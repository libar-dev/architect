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
// =============================================================================
// Main Extraction Function
// =============================================================================
/**
 * Extract named shapes from TypeScript source code.
 *
 * @param sourceCode - The TypeScript source code to parse
 * @param shapeNames - Names of shapes to extract (in desired output order)
 * @param options - Extraction options
 * @returns Extraction result with shapes, warnings, and not-found list
 */
export function extractShapes(sourceCode, shapeNames, options = {}) {
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
        warnings.push(`Failed to parse source code: ${error instanceof Error ? error.message : String(error)}`);
        return { shapes, notFound: shapeNames, imported, reExported, warnings };
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
            if (shape) {
                shapes.push(shape);
            }
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
    return { shapes, notFound, imported, reExported, warnings };
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
    if (kind === 'function') {
        sourceText = functionToSignature(sourceText);
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
    return {
        name,
        kind,
        sourceText,
        jsDoc,
        lineNumber,
        typeParameters,
        extends: extendsArr,
        exported,
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
        // Comment must be on the line immediately before the node
        // (allowing for blank lines would be tricky)
        if (nodeLine - commentEndLine > 2)
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
 * Convert function declaration to signature-only form.
 */
function functionToSignature(sourceText) {
    // Find the opening brace of the function body
    const braceIndex = sourceText.indexOf('{');
    if (braceIndex === -1) {
        // Already a signature (declaration without body)
        return sourceText;
    }
    // Take everything before the brace, trim, and add semicolon
    let signature = sourceText.slice(0, braceIndex).trim();
    // Remove async keyword from arrow functions that might have body
    // and ensure proper formatting
    if (!signature.endsWith(')') && !signature.endsWith('>')) {
        // Might have a return type - find the last )
        const lastParen = signature.lastIndexOf(')');
        if (lastParen !== -1) {
            // Check for return type after )
            const afterParen = signature.slice(lastParen + 1).trim();
            if (afterParen.startsWith(':')) {
                // Has return type, keep it
            }
            else {
                signature = signature.slice(0, lastParen + 1);
            }
        }
    }
    return signature + ';';
}
// =============================================================================
// Integration with Extractor Pipeline
// =============================================================================
/**
 * Process extract-shapes tag and return shapes for ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag
 * @returns Array of extracted shapes in tag order
 */
export function processExtractShapesTag(sourceCode, extractShapesTag) {
    const shapeNames = extractShapesTag
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const result = extractShapes(sourceCode, shapeNames);
    // Log warnings for not-found shapes
    for (const name of result.notFound) {
        console.warn(`[extract-shapes] Shape '${name}' not found in file`);
    }
    // Log warnings for imported shapes
    for (const name of result.imported) {
        console.warn(`[extract-shapes] Shape '${name}' is imported, not defined in this file. ` +
            `Add @libar-docs-extract-shapes to the source file instead.`);
    }
    // Log warnings for re-exported shapes with source module info
    for (const reExport of result.reExported) {
        const typeOnlyNote = reExport.typeOnly ? ' (type-only)' : '';
        console.warn(`[extract-shapes] Shape '${reExport.name}' is re-exported${typeOnlyNote} from '${reExport.sourceModule}'. ` +
            `Add @libar-docs-extract-shapes to ${reExport.sourceModule} instead.`);
    }
    return result.shapes;
}
// =============================================================================
// Rendering Helper
// =============================================================================
/**
 * Render extracted shapes as markdown code blocks.
 *
 * @param shapes - Shapes to render
 * @param options - Rendering options
 * @returns Markdown string with fenced code blocks
 */
export function renderShapesAsMarkdown(shapes, options = {}) {
    const { groupInSingleBlock = true, includeJsDoc = true } = options;
    if (shapes.length === 0) {
        return '';
    }
    const renderShape = (shape) => {
        const parts = [];
        if (includeJsDoc && shape.jsDoc) {
            parts.push(shape.jsDoc);
        }
        parts.push(shape.sourceText);
        return parts.join('\n');
    };
    if (groupInSingleBlock) {
        const content = shapes.map(renderShape).join('\n\n');
        return '```typescript\n' + content + '\n```';
    }
    return shapes.map((shape) => '```typescript\n' + renderShape(shape) + '\n```').join('\n\n');
}
//# sourceMappingURL=shape-extractor.js.map