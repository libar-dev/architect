/**
 * @libar-docs
 * @libar-docs-pattern ShapeExtractor
 * @libar-docs-status completed
 * @libar-docs-phase 26
 * @libar-docs-implements ShapeExtraction
 * @libar-docs-uses typescript-estree
 *
 * ## Shape Extractor - TypeScript Type Extraction
 *
 * Extracts TypeScript type definitions (interfaces, type aliases, enums,
 * function signatures) from source files for documentation generation.
 *
 * ### When to Use
 *
 * - When processing @libar-docs-extract-shapes tags during extraction
 * - When generating documentation that needs actual type definitions
 * - When eliminating duplication between JSDoc examples and code
 *
 * ### Key Concepts
 *
 * - **AST-based extraction**: Uses typescript-estree for accurate parsing
 * - **Preserves formatting**: Extracts exact source text, not regenerated
 * - **Includes JSDoc**: Type-level JSDoc comments are preserved
 * - **Order from tag**: Shapes appear in tag-specified order, not source order
 */
import { parse } from '@typescript-eslint/typescript-estree';
import { Result } from '../types/result.js';
// =============================================================================
// Constants
// =============================================================================
/**
 * Maximum line gap between JSDoc comment end and declaration start.
 * Allows 1 blank line between JSDoc and declaration (comment end line + 1 blank + decl line = 3 gap)
 */
const MAX_JSDOC_LINE_DISTANCE = 3;
/**
 * Strict adjacency required for property-level JSDoc.
 * Property JSDoc must end on the line immediately before the property (no gap allowed).
 * This prevents interface-level JSDoc from being misattributed to the first property.
 */
const PROPERTY_JSDOC_MAX_GAP = 1;
/**
 * Maximum source code size in bytes (5MB).
 * Prevents memory exhaustion from oversized input during AST parsing.
 */
const MAX_SOURCE_SIZE_BYTES = 5 * 1024 * 1024;
// =============================================================================
// Main Extraction Function
// =============================================================================
/**
 * Extract named shapes from TypeScript source code.
 *
 * @param sourceCode - The TypeScript source code to parse
 * @param shapeNames - Names of shapes to extract (in desired output order)
 * @param options - Extraction options
 * @returns Result containing extraction result with shapes, warnings, and not-found list
 */
export function extractShapes(sourceCode, shapeNames, options = {}) {
    // Validate input size to prevent memory exhaustion
    if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
        return Result.err(new Error(`Source code size (${sourceCode.length} bytes) exceeds maximum allowed (${MAX_SOURCE_SIZE_BYTES} bytes)`));
    }
    const { includeJsDoc = true, preserveFormatting = true } = options;
    const shapes = [];
    const notFound = [];
    const imported = [];
    const reExported = [];
    const warnings = [];
    // Parse the source code
    let ast;
    try {
        ast = parse(sourceCode, {
            loc: true,
            range: true,
            comment: true,
            jsx: true,
        });
    }
    catch (error) {
        return Result.err(error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`));
    }
    // Build maps of declarations and imports/re-exports
    const declarations = findDeclarations(ast);
    const importsAndReExports = findImportsAndReExports(ast);
    // Process each requested shape name
    for (const shapeName of shapeNames) {
        // Check if it's a local declaration
        const declaration = declarations.get(shapeName);
        if (declaration) {
            const shape = extractShape(sourceCode, declaration, ast.comments ?? [], {
                includeJsDoc,
                preserveFormatting,
            });
            shapes.push(shape);
            continue;
        }
        // Check if it's an import or re-export
        const importInfo = importsAndReExports.get(shapeName);
        if (importInfo) {
            if (importInfo.isReExport) {
                reExported.push({
                    name: shapeName,
                    sourceModule: importInfo.sourceModule,
                    typeOnly: importInfo.typeOnly,
                });
            }
            else {
                imported.push(shapeName);
            }
            continue;
        }
        // Not found at all
        notFound.push(shapeName);
    }
    return Result.ok({ shapes, notFound, imported, reExported, warnings });
}
// =============================================================================
// AST Traversal Functions
// =============================================================================
/**
 * Find all declarations that could be extracted as shapes.
 */
function findDeclarations(ast) {
    const declarations = new Map();
    for (const node of ast.body) {
        // Handle export declarations
        if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration) {
                const found = processDeclaration(node.declaration, true);
                for (const decl of found) {
                    declarations.set(decl.name, decl);
                }
            }
            // Handle export { Foo } without a source (local re-export)
            if (!node.source) {
                for (const spec of node.specifiers) {
                    const localName = spec.local.name;
                    // This might reference a local declaration - mark it as exported
                    const existing = declarations.get(localName);
                    if (existing) {
                        existing.exported = true;
                    }
                }
            }
        }
        // Handle non-exported declarations
        else {
            const found = processDeclaration(node, false);
            for (const decl of found) {
                // Only add if not already found (export takes precedence)
                if (!declarations.has(decl.name)) {
                    declarations.set(decl.name, decl);
                }
            }
        }
    }
    return declarations;
}
/**
 * Process a declaration node and extract shape info.
 */
function processDeclaration(node, exported) {
    const results = [];
    switch (node.type) {
        case 'TSInterfaceDeclaration':
            results.push({
                node,
                kind: 'interface',
                name: node.id.name,
                exported,
            });
            break;
        case 'TSTypeAliasDeclaration':
            results.push({
                node,
                kind: 'type',
                name: node.id.name,
                exported,
            });
            break;
        case 'TSEnumDeclaration':
            results.push({
                node,
                kind: 'enum',
                name: node.id.name,
                exported,
            });
            break;
        case 'FunctionDeclaration':
            if (node.id) {
                results.push({
                    node,
                    kind: 'function',
                    name: node.id.name,
                    exported,
                });
            }
            break;
        case 'VariableDeclaration':
            // Handle const declarations
            if (node.kind === 'const') {
                for (const declarator of node.declarations) {
                    if (declarator.id.type === 'Identifier') {
                        results.push({
                            node: declarator,
                            kind: 'const',
                            name: declarator.id.name,
                            exported,
                        });
                    }
                }
            }
            break;
    }
    return results;
}
/**
 * Find all imports and re-exports.
 */
function findImportsAndReExports(ast) {
    const result = new Map();
    for (const node of ast.body) {
        // Import declarations
        if (node.type === 'ImportDeclaration') {
            const sourceModule = node.source.value;
            const typeOnly = node.importKind === 'type';
            for (const spec of node.specifiers) {
                if (spec.type === 'ImportSpecifier') {
                    result.set(spec.local.name, {
                        name: spec.local.name,
                        sourceModule,
                        isReExport: false,
                        typeOnly: typeOnly || spec.importKind === 'type',
                    });
                }
                else if (spec.type === 'ImportDefaultSpecifier') {
                    result.set(spec.local.name, {
                        name: spec.local.name,
                        sourceModule,
                        isReExport: false,
                        typeOnly,
                    });
                }
            }
        }
        // Export declarations with source (re-exports)
        if (node.type === 'ExportNamedDeclaration' && node.source) {
            const sourceModule = node.source.value;
            const typeOnly = node.exportKind === 'type';
            for (const spec of node.specifiers) {
                const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value;
                result.set(exportedName, {
                    name: exportedName,
                    sourceModule,
                    isReExport: true,
                    typeOnly,
                });
            }
        }
        // Export all (export * from './module')
        if (node.type === 'ExportAllDeclaration') {
            // We can't know specific names from export *, just note it
            // This is handled by the "not found" case
        }
    }
    return result;
}
// =============================================================================
// Shape Extraction
// =============================================================================
/**
 * Extract a single shape from its declaration.
 */
function extractShape(sourceCode, declaration, comments, options) {
    const { node, kind, name, exported } = declaration;
    // Get the node's range for source extraction (guaranteed by parse options: range: true)
    let sourceText = sourceCode.slice(node.range[0], node.range[1]);
    // For functions, convert to signature only (remove body)
    // Uses AST body range for precise location — avoids brace-matching that
    // fails on object parameter types like { timeout: number }
    if (kind === 'function' && node.type === 'FunctionDeclaration') {
        const funcNode = node;
        const bodyStart = funcNode.body.range[0];
        const declStart = node.range[0];
        sourceText = sourceCode.slice(declStart, bodyStart).trim();
        if (sourceText.startsWith('export ')) {
            sourceText = sourceText.slice('export '.length);
        }
        sourceText = sourceText.trim() + ';';
    }
    // For const, extract just the type annotation if present
    if (kind === 'const' && node.type === 'VariableDeclarator') {
        const declNode = node;
        if (declNode.id.typeAnnotation) {
            // Extract const with type annotation (ranges guaranteed by parse options)
            const idRange = declNode.id.range;
            const typeRange = declNode.id.typeAnnotation.range;
            sourceText = `const ${sourceCode.slice(idRange[0], typeRange[1])};`;
        }
    }
    // Get JSDoc if requested
    let jsDoc;
    if (options.includeJsDoc) {
        jsDoc = extractPrecedingJsDoc(sourceCode, node, comments);
    }
    // DD-3: Parse @param/@returns/@throws from JSDoc for function shapes
    let parsedTags;
    if (options.includeJsDoc && kind === 'function' && jsDoc) {
        parsedTags = parseJsDocTags(jsDoc);
    }
    // Get line number (guaranteed by parse options: loc: true)
    const lineNumber = node.loc.start.line;
    // Extract type parameters for interfaces and types
    let typeParameters;
    if (node.type === 'TSInterfaceDeclaration' || node.type === 'TSTypeAliasDeclaration') {
        const params = node.typeParameters;
        if (params?.params) {
            typeParameters = params.params.map((p) => sourceCode.slice(p.range[0], p.range[1]));
        }
    }
    // Extract extends for interfaces
    let extendsArr;
    if (node.type === 'TSInterfaceDeclaration' && node.extends.length > 0) {
        extendsArr = node.extends.map((ext) => sourceCode.slice(ext.range[0], ext.range[1]));
    }
    // Extract property-level JSDoc for interfaces
    // Uses strict adjacency to prevent interface-level JSDoc from being misattributed to first property
    // Performance optimization: pre-sort comments once O(c log c), then O(log c) per property lookup
    let propertyDocs;
    if (options.includeJsDoc && node.type === 'TSInterfaceDeclaration') {
        const docs = [];
        // Get the line where the interface body starts (the `{` line)
        // loc is guaranteed by parse options: { range: true, loc: true }
        const interfaceBodyStartLine = node.body.loc.start.line;
        // Pre-process comments once for O(log c) binary search per property
        // This converts O(m × c) to O(c log c + m log c) where m=properties, c=comments
        const sortedComments = prepareJsDocComments(comments);
        for (const member of node.body.body) {
            if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
                const propName = member.key.name;
                // Use strict adjacency - comment must be inside interface body and immediately before property
                const propJsDoc = findStrictlyAdjacentPropertyJsDoc(sourceCode, member, sortedComments, interfaceBodyStartLine);
                if (propJsDoc) {
                    // Extract just the text content from JSDoc, removing delimiters
                    const cleanedJsDoc = extractJsDocText(propJsDoc);
                    if (cleanedJsDoc) {
                        docs.push({ name: propName, jsDoc: cleanedJsDoc });
                    }
                }
            }
        }
        if (docs.length > 0) {
            propertyDocs = docs;
        }
    }
    return {
        name,
        kind,
        sourceText,
        jsDoc,
        lineNumber,
        typeParameters,
        extends: extendsArr,
        exported,
        propertyDocs,
        // DD-3: Include parsed JSDoc tags for function shapes
        params: parsedTags !== undefined && parsedTags.params.length > 0 ? parsedTags.params : undefined,
        returns: parsedTags?.returns,
        throws: parsedTags !== undefined && parsedTags.throws.length > 0 ? parsedTags.throws : undefined,
    };
}
/**
 * Extract JSDoc comment preceding a node.
 */
function extractPrecedingJsDoc(sourceCode, node, comments) {
    // Range and loc are guaranteed by parse options: { range: true, loc: true }
    const nodeStart = node.range[0];
    const nodeLine = node.loc.start.line;
    // Find the closest block comment that ends before this node
    // and is a JSDoc comment (starts with /**)
    let closestJsDoc;
    for (const comment of comments) {
        if (comment.type !== 'Block')
            continue;
        if (!comment.value.startsWith('*'))
            continue; // JSDoc starts with /**
        const commentEnd = comment.range[1];
        const commentEndLine = comment.loc.end.line;
        // Comment must end before node starts
        if (commentEnd > nodeStart)
            continue;
        // Comment must be close to the node
        if (nodeLine - commentEndLine > MAX_JSDOC_LINE_DISTANCE)
            continue;
        // This is a candidate - pick the one closest to the node
        if (!closestJsDoc || comment.range[1] > closestJsDoc.range[1]) {
            closestJsDoc = comment;
        }
    }
    if (!closestJsDoc)
        return undefined;
    // Return the full JSDoc including delimiters
    return sourceCode.slice(closestJsDoc.range[0], closestJsDoc.range[1]);
}
/**
 * Pre-process comments for efficient property JSDoc lookup.
 *
 * Filters to only JSDoc block comments and sorts by end line for binary search.
 * This is O(c log c) but done once per file, enabling O(log c) lookups per property.
 *
 * @param comments - All comments from the AST
 * @returns Sorted array of JSDoc comments with pre-extracted line info
 */
function prepareJsDocComments(comments) {
    const jsDocComments = [];
    for (const comment of comments) {
        // Filter: Must be a block comment with JSDoc format (starts with *)
        if (comment.type !== 'Block' || !comment.value.startsWith('*')) {
            continue;
        }
        // Pre-extract line info (loc guaranteed by parse options: { loc: true })
        jsDocComments.push({
            comment,
            endLine: comment.loc.end.line,
            startLine: comment.loc.start.line,
            endPosition: comment.range[1],
        });
    }
    // Sort by end line for binary search
    jsDocComments.sort((a, b) => a.endLine - b.endLine);
    return jsDocComments;
}
/**
 * Binary search to find a JSDoc comment that ends at or near a target line.
 *
 * Returns the index of the comment with the largest endLine <= targetLine,
 * or -1 if no such comment exists.
 *
 * @param sortedComments - Comments sorted by endLine
 * @param targetLine - The line to search for
 * @returns Index of matching comment, or -1 if not found
 */
function findCommentEndingAtLine(sortedComments, targetLine) {
    if (sortedComments.length === 0)
        return -1;
    let left = 0;
    let right = sortedComments.length - 1;
    let result = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const comment = sortedComments[mid];
        if (!comment)
            break;
        const endLine = comment.endLine;
        if (endLine === targetLine) {
            // Exact match - could be multiple, find the rightmost one
            result = mid;
            left = mid + 1;
        }
        else if (endLine < targetLine) {
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return result;
}
/**
 * Find JSDoc comment strictly adjacent to an interface property member.
 *
 * Unlike extractPrecedingJsDoc which allows a 3-line gap, this function requires:
 * 1. Comment must be INSIDE the interface body (start line > minLine)
 * 2. Comment must end exactly at member.startLine - 1 (strictly adjacent)
 *
 * This prevents interface-level JSDoc from being misattributed to the first property
 * when the interface is tightly formatted.
 *
 * Performance: O(log c) per property when using pre-sorted comments, vs O(c) previously.
 *
 * @param sourceCode - Full source code text
 * @param member - The property member node
 * @param sortedComments - Pre-sorted JSDoc comments (call prepareJsDocComments once per file)
 * @param interfaceBodyStartLine - Line where interface body starts (the `{` line)
 * @returns JSDoc string if found, undefined otherwise
 */
function findStrictlyAdjacentPropertyJsDoc(sourceCode, member, sortedComments, interfaceBodyStartLine) {
    // Range and loc are guaranteed by parse options: { range: true, loc: true }
    const memberStartLine = member.loc.start.line;
    const memberStart = member.range[0];
    // Property JSDoc must end exactly on the line before the property
    const expectedCommentEndLine = memberStartLine - PROPERTY_JSDOC_MAX_GAP;
    // Binary search for comment ending at expected line
    const index = findCommentEndingAtLine(sortedComments, expectedCommentEndLine);
    if (index === -1)
        return undefined;
    // Check all comments ending at that line (there could be multiple)
    // Start from the found index and check backwards/forwards for exact matches
    for (let i = index; i >= 0; i--) {
        const entry = sortedComments[i];
        if (entry?.endLine !== expectedCommentEndLine)
            break;
        // Comment must end before the member starts (character position)
        if (entry.endPosition > memberStart)
            continue;
        // Comment must be INSIDE the interface body (after the opening brace line)
        if (entry.startLine <= interfaceBodyStartLine)
            continue;
        // Found a valid property-level JSDoc
        return sourceCode.slice(entry.comment.range[0], entry.comment.range[1]);
    }
    return undefined;
}
/**
 * Parse @param, @returns, and @throws tags from raw JSDoc text.
 *
 * DD-3: Handles both TypeScript-style (`@param name - desc`) and
 * JSDoc-style (`@param {Type} name desc`) formats. Multi-line tag
 * descriptions are supported — lines not starting with `@` are
 * continuations of the previous tag.
 *
 * @param rawJsDoc - Raw JSDoc text with delimiters (/** ... *\/)
 * @returns Structured param/returns/throws data
 */
function parseJsDocTags(rawJsDoc) {
    // Strip JSDoc delimiters and leading asterisks
    let text = rawJsDoc.trim();
    if (text.startsWith('/**')) {
        text = text.slice(3);
    }
    if (text.endsWith('*/')) {
        text = text.slice(0, -2);
    }
    const lines = text.split('\n').map((line) => {
        let cleaned = line.trim();
        if (cleaned.startsWith('*')) {
            cleaned = cleaned.slice(1).trim();
        }
        return cleaned;
    });
    const params = [];
    let returns;
    const throws = [];
    // Regex for @param with optional {Type}: @param {Type} name - description
    const paramRegex = /^@param\s+(?:\{([^}]+)\}\s+)?([\w.]+)\s*(?:-\s*)?(.*)$/;
    // Regex for @returns/@return with optional {Type}
    const returnsRegex = /^@returns?\s+(?:\{([^}]+)\}\s+)?(.*)$/;
    // Regex for @throws/@throw with optional {Type}
    const throwsRegex = /^@throws?\s+(?:\{([^}]+)\}\s+)?(.*)$/;
    let currentTag;
    for (const line of lines) {
        if (line.length === 0) {
            currentTag = undefined;
            continue;
        }
        // Try @param
        const paramMatch = paramRegex.exec(line);
        if (paramMatch) {
            const paramName = paramMatch[2] ?? '';
            const paramType = paramMatch[1];
            const paramDesc = paramMatch[3] ?? '';
            params.push({
                name: paramName,
                type: paramType ?? undefined,
                description: paramDesc.trim(),
            });
            currentTag = { target: 'param', index: params.length - 1 };
            continue;
        }
        // Try @returns
        const returnsMatch = returnsRegex.exec(line);
        if (returnsMatch) {
            const retType = returnsMatch[1];
            const retDesc = returnsMatch[2] ?? '';
            returns = {
                type: retType ?? undefined,
                description: retDesc.trim(),
            };
            currentTag = { target: 'returns', index: 0 };
            continue;
        }
        // Try @throws
        const throwsMatch = throwsRegex.exec(line);
        if (throwsMatch) {
            const throwType = throwsMatch[1];
            const throwDesc = throwsMatch[2] ?? '';
            throws.push({
                type: throwType ?? undefined,
                description: throwDesc.trim(),
            });
            currentTag = { target: 'throws', index: throws.length - 1 };
            continue;
        }
        // Any other @tag breaks the current continuation
        if (line.startsWith('@')) {
            currentTag = undefined;
            continue;
        }
        // Continuation line for current tag
        if (currentTag) {
            const continuation = line.trim();
            if (continuation.length === 0)
                continue;
            const paramEntry = currentTag.target === 'param' ? params[currentTag.index] : undefined;
            const throwEntry = currentTag.target === 'throws' ? throws[currentTag.index] : undefined;
            if (currentTag.target === 'param' && paramEntry !== undefined) {
                params[currentTag.index] = {
                    ...paramEntry,
                    description: paramEntry.description.length > 0
                        ? `${paramEntry.description} ${continuation}`
                        : continuation,
                };
            }
            else if (currentTag.target === 'returns' && returns !== undefined) {
                returns = {
                    ...returns,
                    description: returns.description.length > 0
                        ? `${returns.description} ${continuation}`
                        : continuation,
                };
            }
            else if (currentTag.target === 'throws' && throwEntry !== undefined) {
                throws[currentTag.index] = {
                    ...throwEntry,
                    description: throwEntry.description.length > 0
                        ? `${throwEntry.description} ${continuation}`
                        : continuation,
                };
            }
        }
    }
    return { params, returns, throws };
}
/**
 * Extract clean text content from a JSDoc comment.
 *
 * Removes the JSDoc delimiters (/** and *\/) and leading asterisks from each line.
 * Returns the first meaningful line as the description.
 */
function extractJsDocText(jsDoc) {
    // Remove /** prefix and */ suffix
    let text = jsDoc.trim();
    if (text.startsWith('/**')) {
        text = text.slice(3);
    }
    if (text.endsWith('*/')) {
        text = text.slice(0, -2);
    }
    // Split into lines and clean each line
    const lines = text
        .split('\n')
        .map((line) => {
        // Remove leading whitespace and asterisk
        let cleaned = line.trim();
        if (cleaned.startsWith('*')) {
            cleaned = cleaned.slice(1).trim();
        }
        return cleaned;
    })
        .filter((line) => line.length > 0 && !line.startsWith('@')); // Skip empty and tag lines
    // DD-2: Return all non-empty, non-tag lines joined with space (not just first line)
    // Space-join because property JSDoc renders in table cells where newlines break formatting
    return lines.length > 0 ? lines.join(' ') : undefined;
}
/**
 * DD-4: Extract all exported declarations from a file as shapes.
 *
 * Auto-discovery mode: when `@libar-docs-extract-shapes *` is used,
 * all exported types/interfaces/enums/functions/consts are extracted
 * without requiring explicit names.
 *
 * @param sourceCode - File content
 * @returns Result with all exported shapes
 */
function extractAllExportedShapes(sourceCode) {
    // Validate input size
    if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
        return Result.err(new Error(`Source code size (${sourceCode.length} bytes) exceeds maximum allowed (${MAX_SOURCE_SIZE_BYTES} bytes)`));
    }
    let ast;
    try {
        ast = parse(sourceCode, {
            loc: true,
            range: true,
            comment: true,
            jsx: true,
        });
    }
    catch (error) {
        return Result.err(error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`));
    }
    const declarations = findDeclarations(ast);
    const shapes = [];
    const warnings = [];
    // Extract only exported declarations
    for (const [, declaration] of declarations) {
        if (!declaration.exported)
            continue;
        const shape = extractShape(sourceCode, declaration, ast.comments ?? [], {
            includeJsDoc: true,
            preserveFormatting: true,
        });
        shapes.push(shape);
    }
    if (shapes.length > 50) {
        warnings.push(`[extract-shapes] Auto-discovery extracted ${shapes.length} shapes. ` +
            `This may indicate the file has too many exports for effective documentation.`);
    }
    return Result.ok({ shapes, notFound: [], imported: [], reExported: [], warnings });
}
/**
 * Process extract-shapes tag and return shapes for ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * DD-4: Supports wildcard `*` for auto-discovery mode.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag, or `*` for auto-discovery
 * @returns Result with extracted shapes and any warnings
 */
export function processExtractShapesTag(sourceCode, extractShapesTag) {
    // DD-4: Auto-shape discovery via wildcard
    const shapeNames = extractShapesTag
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const hasWildcard = shapeNames.includes('*');
    if (hasWildcard) {
        // Wildcard must be sole value — reject mixed case
        if (shapeNames.length > 1) {
            const namedShapes = shapeNames.filter((n) => n !== '*');
            return {
                shapes: [],
                warnings: [
                    `[extract-shapes] Wildcard '*' must be the sole extract-shapes value. ` +
                        `Ignoring named shapes: ${namedShapes.join(', ')}. Use '*' alone or list specific names.`,
                ],
            };
        }
        const result = extractAllExportedShapes(sourceCode);
        if (!result.ok) {
            return {
                shapes: [],
                warnings: [`[extract-shapes] ${result.error.message}`],
            };
        }
        return { shapes: [...result.value.shapes], warnings: [...result.value.warnings] };
    }
    const extractionResult = extractShapes(sourceCode, shapeNames);
    // If extraction failed (parse error), return empty shapes with error as warning
    if (!extractionResult.ok) {
        return {
            shapes: [],
            warnings: [`[extract-shapes] ${extractionResult.error.message}`],
        };
    }
    const result = extractionResult.value;
    const warnings = [...result.warnings];
    // Collect warnings for not-found shapes
    for (const name of result.notFound) {
        warnings.push(`[extract-shapes] Shape '${name}' not found in file`);
    }
    // Collect warnings for imported shapes
    for (const name of result.imported) {
        warnings.push(`[extract-shapes] Shape '${name}' is imported, not defined in this file. ` +
            `Add @libar-docs-extract-shapes to the source file instead.`);
    }
    // Collect warnings for re-exported shapes with source module info
    for (const reExport of result.reExported) {
        const typeOnlyNote = reExport.typeOnly ? ' (type-only)' : '';
        warnings.push(`[extract-shapes] Shape '${reExport.name}' is re-exported${typeOnlyNote} from '${reExport.sourceModule}'. ` +
            `Add @libar-docs-extract-shapes to ${reExport.sourceModule} instead.`);
    }
    return { shapes: [...result.shapes], warnings };
}
// =============================================================================
// Declaration-Level Shape Discovery (DD-1, DD-2, DD-4, DD-7)
// =============================================================================
/**
 * Extract the @libar-docs-shape tag from JSDoc text.
 *
 * Returns `{ tagged: true, group }` if the tag is present,
 * where `group` is `undefined` for bare tags and a string for valued tags.
 *
 * @param jsDocText - Raw JSDoc text including delimiters
 */
function extractShapeTag(jsDocText) {
    // Match tag with optional group name, excluding JSDoc delimiters (* and /).
    // Negative lookahead (?!-) prevents matching hypothetical libar-docs-shape-* tags.
    const match = /libar-docs-shape(?!-)(?:\s+([^\s*/]+))?/.exec(jsDocText);
    if (!match)
        return { tagged: false };
    const group = match[1];
    if (group !== undefined) {
        return { tagged: true, group };
    }
    return { tagged: true };
}
/**
 * Extract the @libar-docs-include tag from JSDoc text.
 *
 * Returns an array of include values if the tag is present (CSV format),
 * or `undefined` if the tag is absent. Values are trimmed and filtered for empties.
 *
 * @param jsDocText - Raw JSDoc text including delimiters
 */
function extractIncludeTag(jsDocText) {
    const match = /libar-docs-include(?!-)(?:\s+([^\n@*]+))?/.exec(jsDocText);
    if (!match)
        return undefined;
    const raw = match[1];
    if (raw === undefined)
        return undefined;
    const values = raw
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    return values.length > 0 ? values : undefined;
}
/**
 * Discover declarations tagged with @libar-docs-shape in source code.
 *
 * Scans all top-level declarations (exported and non-exported per DD-7)
 * for @libar-docs-shape tags in their preceding JSDoc. Tagged declarations
 * are extracted as shapes with an optional group from the tag value (DD-5).
 *
 * Reuses existing infrastructure: findDeclarations(), extractPrecedingJsDoc(),
 * and extractShape() — no parser changes needed (DD-2).
 *
 * @param sourceCode - TypeScript source code to scan
 * @returns Result containing discovered shapes and warnings
 */
export function discoverTaggedShapes(sourceCode) {
    // Validate input size
    if (sourceCode.length > MAX_SOURCE_SIZE_BYTES) {
        return Result.err(new Error(`Source code size (${sourceCode.length} bytes) exceeds maximum allowed (${MAX_SOURCE_SIZE_BYTES} bytes)`));
    }
    // Parse with same config as extractShapes (DD-2: stay on estree parser)
    let ast;
    try {
        ast = parse(sourceCode, {
            loc: true,
            range: true,
            comment: true,
            jsx: true,
        });
    }
    catch (error) {
        return Result.err(error instanceof Error ? error : new Error(`Failed to parse source code: ${String(error)}`));
    }
    // DD-7: Get ALL declarations (exported + non-exported)
    const declarations = findDeclarations(ast);
    const comments = ast.comments ?? [];
    const shapes = [];
    const warnings = [];
    for (const [, declaration] of declarations) {
        // Get JSDoc for this declaration (respects MAX_JSDOC_LINE_DISTANCE)
        const jsDoc = extractPrecedingJsDoc(sourceCode, declaration.node, comments);
        if (jsDoc === undefined)
            continue;
        // Check for @libar-docs-shape tag
        const tagResult = extractShapeTag(jsDoc);
        if (!tagResult.tagged)
            continue;
        // Extract the shape using existing infrastructure
        const shape = extractShape(sourceCode, declaration, comments, {
            includeJsDoc: true,
            preserveFormatting: true,
        });
        // DD-5: Add group field from tag value
        // DD-3 (CrossCuttingDocumentInclusion): Add includes from @libar-docs-include
        const includeValues = extractIncludeTag(jsDoc);
        shapes.push({ ...shape, group: tagResult.group, ...(includeValues !== undefined && { includes: includeValues }) });
    }
    return Result.ok({ shapes, warnings });
}
// =============================================================================
// Re-export Rendering Helper (moved to codec layer)
// =============================================================================
// Re-export renderShapesAsMarkdown from the codec helpers where it belongs
// This maintains backwards compatibility for existing imports
export { renderShapesAsMarkdown } from '../renderable/codecs/helpers.js';
//# sourceMappingURL=shape-extractor.js.map