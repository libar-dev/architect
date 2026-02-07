/**
 * @libar-docs
 * @libar-docs-core @libar-docs-scanner
 * @libar-docs-pattern TypeScript AST Parser
 * @libar-docs-status completed
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context scanner
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-uses TagRegistry, DocDirectiveSchema, typescript-estree
 * @libar-docs-used-by Pattern Scanner, Doc Extractor
 * @libar-docs-usecase "When parsing JSDoc comments for @libar-docs-* directives"
 * @libar-docs-usecase "When extracting code blocks following documentation comments"
 *
 * ## TypeScript AST Parser - JSDoc Directive Extraction
 *
 * Parses TypeScript source files using @typescript-eslint/typescript-estree
 * to extract @libar-docs-* directives with their associated code blocks.
 * First stage of the three-stage pipeline: Scanner → Extractor → Generator.
 *
 * ### When to Use
 *
 * - Scanning TypeScript files for documentation directives
 * - Extracting code snippets following JSDoc comments
 * - Building pattern metadata from JSDoc tags
 *
 * ### Key Concepts
 *
 * - **Data-Driven Extraction**: Tag formats defined in registry, not hardcoded
 * - **Schema-First Validation**: All directives validated against Zod schemas
 * - **Result Monad**: Returns Result<T, E> for explicit error handling
 */
import { Result } from '../types/index.js';
import { parse } from '@typescript-eslint/typescript-estree';
import { asDirectiveTag, createDirectiveValidationError, createFileParseError, } from '../types/index.js';
import { DocDirectiveSchema, createDefaultTagRegistry, } from '../validation-schemas/index.js';
import { createRegexBuilders } from '../config/regex-builders.js';
/**
 * Module-level regex cache for performance optimization.
 *
 * Regex compilation is expensive (~50μs per pattern). In hot paths where
 * the same patterns are used repeatedly (e.g., extracting metadata tags),
 * caching provides ~80x fewer RegExp instantiations.
 *
 * @internal
 */
const REGEX_CACHE = new Map();
/**
 * Get or create a cached RegExp instance.
 *
 * @param pattern - Regex pattern string
 * @param flags - Optional regex flags (g, i, m, etc.)
 * @returns Cached or newly created RegExp
 *
 * @internal
 */
function getCachedRegex(pattern, flags) {
    const key = flags ? `${pattern}|${flags}` : pattern;
    let regex = REGEX_CACHE.get(key);
    if (!regex) {
        regex = new RegExp(pattern, flags);
        REGEX_CACHE.set(key, regex);
    }
    // Reset lastIndex for stateful regexes (those with 'g' flag)
    if (regex.global) {
        regex.lastIndex = 0;
    }
    return regex;
}
/**
 * Extract single value from comment text for format="value"
 *
 * @example
 * ```
 * @libar-docs-pattern MyPattern
 * ```
 */
function extractSingleValue(commentText, fullTag) {
    const regex = getCachedRegex(`${escapeRegex(fullTag)}\\s+(.+?)(?:\\n|\\*|$)`);
    const match = regex.exec(commentText);
    return match?.[1]?.trim();
}
/**
 * Extract enum value from comment text for format="enum"
 *
 * @example
 * ```
 * @libar-docs-status completed
 * ```
 */
function extractEnumValue(commentText, fullTag, validValues) {
    const valuesPattern = validValues.join('|');
    const regex = getCachedRegex(`${escapeRegex(fullTag)}\\s+(${valuesPattern})`);
    const match = regex.exec(commentText);
    return match?.[1];
}
/**
 * Extract quoted value from comment text for format="quoted-value"
 *
 * @example
 * ```
 * @libar-docs-usecase "When implementing a new command"
 * ```
 */
function extractQuotedValue(commentText, fullTag) {
    const regex = getCachedRegex(`${escapeRegex(fullTag)}\\s+(?:"([^"]+)"|([^\\n*]+?)(?:\\n|\\*|$))`, 'g');
    const values = [];
    let match;
    while ((match = regex.exec(commentText)) !== null) {
        const value = (match[1] ?? match[2])?.trim();
        if (value) {
            values.push(value);
        }
    }
    return values;
}
/**
 * Extract comma-separated values from comment text for format="csv"
 *
 * @example
 * ```
 * @libar-docs-uses PatternA, PatternB, PatternC
 * ```
 */
function extractCsvValue(commentText, fullTag) {
    const regex = getCachedRegex(`${escapeRegex(fullTag)}\\s+([^\\n@*]+)`);
    const match = regex.exec(commentText);
    if (!match?.[1])
        return undefined;
    return match[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}
/**
 * Extract number value from comment text for format="number"
 *
 * @example
 * ```
 * @libar-docs-phase 14
 * ```
 */
function extractNumberValue(commentText, fullTag) {
    const regex = getCachedRegex(`${escapeRegex(fullTag)}\\s+(\\d+)`);
    const match = regex.exec(commentText);
    return match?.[1] ? parseInt(match[1], 10) : undefined;
}
/**
 * Check if flag is present in comment text for format="flag"
 *
 * @example
 * ```
 * @libar-docs-core
 * ```
 */
function checkFlagPresent(commentText, fullTag) {
    const regex = getCachedRegex(`${escapeRegex(fullTag)}(?:\\s|$|\\*)`);
    return regex.test(commentText);
}
/**
 * Escape special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Build regex patterns for directive parsing from registry configuration.
 *
 * @param registry - Tag registry with prefix and opt-in tag configuration
 * @returns Object with compiled regex patterns for directive parsing
 *
 * @internal
 */
function buildDirectivePatterns(registry) {
    // Extract prefix without @ for pattern construction
    const prefixWithoutAt = registry.tagPrefix.startsWith('@')
        ? registry.tagPrefix.substring(1)
        : registry.tagPrefix;
    const escapedPrefixWithoutAt = escapeRegex(prefixWithoutAt);
    // Extract opt-in tag without @ for pattern construction
    const optInWithoutAt = registry.fileOptInTag.startsWith('@')
        ? registry.fileOptInTag.substring(1)
        : registry.fileOptInTag;
    const escapedOptInWithoutAt = escapeRegex(optInWithoutAt);
    return {
        // Match directive tags: @prefix-pattern, @prefix-core, etc. (prefix includes trailing -)
        tagRegex: new RegExp(`@${escapedPrefixWithoutAt}[\\w-]+`, 'g'),
        // Check if line starts with opt-in or directive
        // e.g., ^@libar-docs or ^@libar-docs-pattern
        startsWithOptInOrDirective: new RegExp(`^@${escapedOptInWithoutAt}(?:-[\\w-]+)?`),
        // Match opt-in tag for removal (not followed by -)
        // e.g., @libar-docs followed by whitespace or end
        optInTagPattern: new RegExp(`@${escapedOptInWithoutAt}(?!-)(\\s|$)?`, 'g'),
        // Match any @ tag that is NOT our prefix
        // e.g., @param, @returns, @example (not @libar-docs)
        nonOptInAtTagPattern: new RegExp(`^@(?!${escapedOptInWithoutAt})`),
    };
}
/**
 * Build regex pattern for value-taking tags from registry.
 *
 * Value-taking tags are all metadata tags except those with format="flag".
 * This pattern detects when a line contains a metadata directive whose
 * value should NOT be captured as inline description text.
 *
 * @param registry - Tag registry to extract metadata tags from
 * @returns RegExp pattern string (without surrounding slashes)
 *
 * @internal
 */
function buildValueTakingTagsPattern(registry) {
    const valueTakingTags = registry.metadataTags
        .filter((tag) => tag.format !== 'flag')
        .map((tag) => escapeRegex(tag.tag));
    const tagPrefix = escapeRegex(registry.tagPrefix);
    return `${tagPrefix}(?:${valueTakingTags.join('|')})\\s`;
}
/**
 * Pre-compiled regex for detecting value-taking metadata directives.
 *
 * Built at module load time from the default registry to:
 * 1. Avoid regex compilation on every parse call
 * 2. Eliminate hardcoded tag lists that fall out of sync with registry
 *
 * Matches lines containing tags like @libar-docs-pattern, @libar-docs-status, etc.
 * Does NOT match flag-only tags like @libar-docs-core.
 *
 * @internal
 */
const _VALUE_TAKING_TAGS_REGEX = (() => {
    const defaultRegistry = createDefaultTagRegistry();
    return new RegExp(buildValueTakingTagsPattern(defaultRegistry));
})();
/**
 * Extract metadata tag value based on format type
 *
 * Dispatches to the appropriate extraction function based on the tag's format.
 * This enables data-driven metadata extraction without hardcoded patterns.
 *
 * @param commentText - Full JSDoc comment text
 * @param tagDef - Metadata tag definition from registry
 * @param prefix - Tag prefix (e.g., "@libar-docs-")
 * @returns Extracted value in appropriate format, or undefined if not found
 */
function extractMetadataTag(commentText, tagDef, prefix) {
    const fullTag = `${prefix}${tagDef.tag}`;
    switch (tagDef.format) {
        case 'value':
            return extractSingleValue(commentText, fullTag);
        case 'enum':
            return extractEnumValue(commentText, fullTag, tagDef.values ?? []);
        case 'quoted-value':
            // For repeatable tags, return array; otherwise return single value
            if (tagDef.repeatable) {
                const values = extractQuotedValue(commentText, fullTag);
                return values.length > 0 ? values : undefined;
            }
            else {
                const values = extractQuotedValue(commentText, fullTag);
                return values[0];
            }
        case 'csv':
            return extractCsvValue(commentText, fullTag);
        case 'number':
            return extractNumberValue(commentText, fullTag);
        case 'flag':
            return checkFlagPresent(commentText, fullTag);
        default:
            return undefined;
    }
}
/**
 * Parses TypeScript content and extracts all @libar-docs-* directives
 * with their associated code blocks and exports.
 *
 * **Error Handling**: Returns Result type to surface parse errors:
 * - Ok: Contains successfully parsed directives and any skipped directive errors
 * - Err: Contains FileParseError when the entire file fails to parse
 *
 * @param content - TypeScript file content
 * @param filePath - Path to TypeScript file (for error messages)
 * @param registry - Tag registry for metadata extraction (optional, defaults to generic registry)
 * @returns Result with parsed directives or parse error
 *
 * @example
 * ```typescript
 * const content = await fs.readFile(filePath, "utf-8");
 * const result = parseFileDirectives(content, filePath, registry);
 *
 * if (Result.isOk(result)) {
 *   const { directives, skippedDirectives } = result.value;
 *   console.log(`Parsed ${directives.length} directives`);
 *   console.log(`Skipped ${skippedDirectives.length} invalid directives`);
 * } else {
 *   console.error(`Parse error: ${result.error.message}`);
 * }
 * ```
 */
export function parseFileDirectives(content, filePath, registry) {
    const effectiveRegistry = registry ?? createDefaultTagRegistry();
    let ast;
    try {
        ast = parse(content, {
            loc: true,
            range: true,
            comment: true,
            tokens: false,
        });
    }
    catch (error) {
        // Surface parse errors instead of silently returning empty
        const tsError = error;
        const location = 'lineNumber' in tsError && 'column' in tsError
            ? { line: tsError.lineNumber, column: tsError.column }
            : undefined;
        return Result.err(createFileParseError(filePath, tsError.message || 'Unknown parse error', location, error));
    }
    const results = [];
    const skippedDirectives = [];
    const comments = ast.comments ?? [];
    // Create regex builders for directive detection using registry configuration
    const builders = createRegexBuilders(effectiveRegistry.tagPrefix, effectiveRegistry.fileOptInTag);
    for (const comment of comments) {
        if (comment.type !== 'Block')
            continue;
        const commentText = comment.value;
        if (!builders.hasDocDirectives(commentText))
            continue;
        // Extract directive information (with schema validation)
        if (!comment.loc)
            continue; // Skip if no location info
        const directiveResult = parseDirective(commentText, comment.loc, filePath, effectiveRegistry);
        if (Result.isErr(directiveResult)) {
            // Collect directive validation errors instead of silently skipping
            skippedDirectives.push(directiveResult.error);
            continue;
        }
        const directive = directiveResult.value;
        if (directive.tags.length === 0)
            continue;
        // Find the code block following this comment
        const codeBlock = extractCodeBlockAfterComment(content, ast, comment);
        if (!codeBlock)
            continue;
        // Extract exports from the code block
        const exports = extractExportsFromBlock(ast, codeBlock);
        results.push({
            directive,
            code: codeBlock.code,
            exports,
        });
    }
    return Result.ok({ directives: results, skippedDirectives });
}
/**
 * Parse JSDoc comment to extract directive information
 *
 * **Schema-First Enforcement**: Validates constructed directive against schema
 * to ensure data integrity at the boundary.
 *
 * **Directive-Level Tag Extraction**: Only extracts `@libar-docs-*` tags from
 * the directive section (first lines before description content). Tags mentioned
 * in descriptions, examples, or other sections are NOT extracted.
 *
 * JSDoc structure:
 * ```
 * /**
 *  * @libar-docs-core @libar-docs-api   <- Directive tags (extracted)
 *  *
 *  * Description mentioning @libar-docs-x <- NOT extracted
 *  * @example
 *  * hasTag('@libar-docs-y');            <- NOT extracted
 *  *\/
 * ```
 */
function parseDirective(commentText, loc, filePath, registry) {
    const lines = commentText.split('\n').map((l) => l.trim().replace(/^\*\s?/, ''));
    // Build registry-based regex patterns for directive parsing
    const patterns = buildDirectivePatterns(registry);
    const valueTakingTagsRegex = new RegExp(buildValueTakingTagsPattern(registry));
    // Extract directive tags ONLY from directive section
    // Directive section = lines where tags appear at the START (not mentioned in text)
    // A directive tag line: "@libar-docs-core @libar-docs-api Some brief description"
    // A description line: "This works with @libar-docs-api patterns" (tag not at start)
    const tags = [];
    let inlineDescription = ''; // Capture description on same line as tags
    for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip empty lines at the start (before we've found any tags)
        if (trimmedLine === '' && tags.length === 0)
            continue;
        // Stop at empty lines after we've found tags (description section started)
        if (trimmedLine === '' && tags.length > 0)
            break;
        // Check if line starts with a standard JSDoc tag (@param, @returns, @example, etc.)
        // but NOT our doc directives
        if (patterns.nonOptInAtTagPattern.exec(trimmedLine)) {
            break; // Stop at other @ tags
        }
        // Check if line STARTS with opt-in or directive tag
        // e.g., @libar-docs (no suffix) = file opt-in tag
        // e.g., @libar-docs-* (with suffix) = section tag to extract
        const startsWithDocTag = patterns.startsWithOptInOrDirective.exec(trimmedLine);
        if (startsWithDocTag) {
            // This is a directive line - extract only directive tags (with suffix)
            // Skip opt-in tag (no suffix) which is just the opt-in marker
            // e.g., "@libar-docs @libar-docs-core Brief description" extracts only @libar-docs-core
            let match;
            let lastTagEnd = 0;
            patterns.tagRegex.lastIndex = 0;
            while ((match = patterns.tagRegex.exec(trimmedLine)) !== null) {
                // Only extract tags that are at the start (consecutive, separated by whitespace or opt-in)
                const textBefore = trimmedLine.slice(lastTagEnd, match.index).trim();
                // Allow opt-in tag and whitespace between directive tags
                const cleanedBefore = textBefore.replace(patterns.optInTagPattern, '').trim();
                if (lastTagEnd > 0 && cleanedBefore !== '') {
                    // There's non-whitespace content between tags - this tag is in description
                    break;
                }
                tags.push(match[0]);
                lastTagEnd = match.index + match[0].length;
            }
            // Capture any description text after the tags on the same line
            // e.g., "@libar-docs-core Brief description on same line" -> "Brief description on same line"
            // But skip lines with metadata directives that take values (all non-flag tags)
            // to prevent their values from leaking into the description
            // (e.g., "@libar-docs-phase 01" would incorrectly capture "01")
            const hasMetadataDirective = valueTakingTagsRegex.test(trimmedLine);
            if (!hasMetadataDirective) {
                const textAfterTags = trimmedLine
                    .slice(lastTagEnd)
                    .replace(patterns.optInTagPattern, '') // Remove any opt-in markers
                    .trim();
                if (textAfterTags) {
                    inlineDescription = textAfterTags;
                }
            }
            // Continue to next line - there might be more directive tags
        }
        else {
            // Line doesn't start with doc tag - it's description content
            break;
        }
    }
    // Data-driven metadata extraction using registry
    // Build map of metadata tag results: tagName -> extracted value
    const metadataResults = new Map();
    for (const tagDef of registry.metadataTags) {
        const result = extractMetadataTag(commentText, tagDef, registry.tagPrefix);
        if (result !== undefined) {
            metadataResults.set(tagDef.tag, result);
        }
    }
    // Map extracted metadata to directive fields
    // This mapping translates registry tag names to DocDirective field names
    const patternName = metadataResults.get('pattern');
    const status = metadataResults.get('status');
    const isCore = metadataResults.get('core');
    const useCases = metadataResults.get('usecase');
    const uses = metadataResults.get('uses');
    const usedBy = metadataResults.get('used-by');
    const phase = metadataResults.get('phase');
    const brief = metadataResults.get('brief');
    const dependsOn = metadataResults.get('depends-on');
    const enables = metadataResults.get('enables');
    // UML-inspired relationship tags (PatternRelationshipModel)
    const implementsPatterns = metadataResults.get('implements');
    const extendsPattern = metadataResults.get('extends');
    // Cross-reference and API navigation tags (PatternRelationshipModel enhancement)
    const seeAlso = metadataResults.get('see-also');
    const apiRef = metadataResults.get('api-ref');
    // Architecture diagram generation tags
    const archRole = metadataResults.get('arch-role');
    const archContext = metadataResults.get('arch-context');
    const archLayer = metadataResults.get('arch-layer');
    // Design session stub metadata tags
    const target = metadataResults.get('target');
    const since = metadataResults.get('since');
    // Shape extraction tags
    const extractShapes = metadataResults.get('extract-shapes');
    // Extract "### When to Use" section or "**When to use:**" inline format
    // Returns array of bullet points, stopping at section boundaries
    // This is a special format that extracts from description, not a metadata tag
    const whenToUse = extractWhenToUse(commentText, registry.fileOptInTag);
    // Extract description and examples
    const descriptionLines = [];
    const examples = [];
    let inExample = false;
    let exampleBuffer = [];
    for (const line of lines) {
        if (line.startsWith('@example')) {
            inExample = true;
            if (exampleBuffer.length > 0) {
                examples.push(exampleBuffer.join('\n'));
                exampleBuffer = [];
            }
            continue;
        }
        if (line.startsWith('@param') || line.startsWith('@returns') || line.startsWith('@')) {
            if (inExample && exampleBuffer.length > 0) {
                examples.push(exampleBuffer.join('\n'));
                exampleBuffer = [];
            }
            inExample = false;
            continue;
        }
        if (inExample) {
            // Remove code fence markers
            if (!line.startsWith('```')) {
                exampleBuffer.push(line);
            }
        }
        else if (!line.startsWith('@')) {
            descriptionLines.push(line);
        }
    }
    if (exampleBuffer.length > 0) {
        examples.push(exampleBuffer.join('\n'));
    }
    // Build directive object
    // Combine inline description (from same line as tags) with multi-line description
    const fullDescription = inlineDescription
        ? [inlineDescription, ...descriptionLines].join('\n').trim()
        : descriptionLines.join('\n').trim();
    const directive = {
        tags: tags.map((tag) => asDirectiveTag(tag)),
        description: fullDescription,
        examples,
        position: {
            startLine: loc.start.line,
            endLine: loc.end.line,
        },
        // Include optional fields only if present
        ...(patternName && { patternName }),
        ...(status && { status }),
        ...(isCore && { isCore }),
        ...(useCases && useCases.length > 0 && { useCases }),
        ...(whenToUse && { whenToUse }),
        ...(uses && uses.length > 0 && { uses }),
        ...(usedBy && usedBy.length > 0 && { usedBy }),
        ...(phase !== undefined && { phase }),
        ...(brief && { brief }),
        ...(dependsOn && dependsOn.length > 0 && { dependsOn }),
        ...(enables && enables.length > 0 && { enables }),
        // UML-inspired relationship fields (PatternRelationshipModel)
        ...(implementsPatterns && implementsPatterns.length > 0 && { implements: implementsPatterns }),
        ...(extendsPattern && { extends: extendsPattern }),
        // Cross-reference and API navigation fields (PatternRelationshipModel enhancement)
        ...(seeAlso && seeAlso.length > 0 && { seeAlso }),
        ...(apiRef && apiRef.length > 0 && { apiRef }),
        // Design session stub metadata fields
        ...(target && { target }),
        ...(since && { since }),
        // Architecture diagram generation fields
        ...(archRole && { archRole }),
        ...(archContext && { archContext }),
        ...(archLayer && { archLayer }),
        // Shape extraction fields
        ...(extractShapes && extractShapes.length > 0 && { extractShapes }),
    };
    // Validate against schema (schema-first enforcement)
    const validation = DocDirectiveSchema.safeParse(directive);
    if (!validation.success) {
        const error = createDirectiveValidationError(filePath, loc.start.line, 'Invalid directive structure', commentText.substring(0, 100));
        return Result.err(error);
    }
    return Result.ok(validation.data);
}
/**
 * Extract code block immediately following a comment
 */
function extractCodeBlockAfterComment(content, ast, comment) {
    if (!comment.range)
        return null;
    const commentEnd = comment.range[1];
    // Find the first meaningful AST node after this comment
    const nextNode = findNextNodeAfterPosition(ast, commentEnd);
    if (!nextNode?.range || !nextNode.loc)
        return null;
    const lines = content.split('\n');
    const startLine = nextNode.loc.start.line;
    const endLine = nextNode.loc.end.line;
    // Extract the code block
    const codeLines = lines.slice(startLine - 1, endLine);
    return {
        code: codeLines.join('\n'),
        startLine,
        endLine,
    };
}
/**
 * Find the first AST node after a given position
 */
function findNextNodeAfterPosition(ast, position) {
    for (const node of ast.body) {
        if (node.range && node.range[0] > position) {
            return node;
        }
    }
    return null;
}
/**
 * Extract export information from a code block
 */
function extractExportsFromBlock(ast, block) {
    const exports = [];
    for (const node of ast.body) {
        if (!node.loc)
            continue;
        if (node.loc.start.line < block.startLine || node.loc.end.line > block.endLine)
            continue;
        if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration) {
                exports.push(...extractFromDeclaration(node.declaration));
            }
            // Handle re-exports like: export { foo, bar } from './module'
            // or type exports: export type { Foo } from './module'
            if (node.specifiers) {
                // Check if parent ExportNamedDeclaration is type-only
                const isTypeExport = node.exportKind === 'type';
                for (const spec of node.specifiers) {
                    if (spec.type === 'ExportSpecifier') {
                        // TypeScript 5.9.0+: exported can be Identifier or Literal (StringLiteral)
                        // Handles cases like: export { "foo-bar" as baz } from './module'
                        // Type union exhaustion: only Identifier and Literal are valid types here
                        const exportedName = spec.exported.type === 'Identifier'
                            ? spec.exported.name
                            : spec.exported.value; // Literal type - extract value
                        exports.push({
                            name: exportedName,
                            type: isTypeExport ? 'type' : 'const',
                        });
                    }
                }
            }
        }
        else if (node.type === 'ExportDefaultDeclaration') {
            exports.push({
                name: 'default',
                type: getExportType(node.declaration),
            });
        }
    }
    return exports;
}
/**
 * Extract exports from a declaration node
 */
function extractFromDeclaration(declaration) {
    const exports = [];
    switch (declaration.type) {
        case 'FunctionDeclaration':
            if (declaration.id) {
                exports.push({
                    name: declaration.id.name,
                    type: 'function',
                    signature: `${declaration.id.name}(${declaration.params.map(() => '...').join(', ')})`,
                });
            }
            break;
        case 'VariableDeclaration':
            for (const declarator of declaration.declarations) {
                if (declarator.id.type === 'Identifier') {
                    exports.push({
                        name: declarator.id.name,
                        type: 'const',
                    });
                }
            }
            break;
        case 'TSTypeAliasDeclaration':
            exports.push({
                name: declaration.id.name,
                type: 'type',
            });
            break;
        case 'TSInterfaceDeclaration':
            exports.push({
                name: declaration.id.name,
                type: 'interface',
            });
            break;
        case 'ClassDeclaration':
            if (declaration.id) {
                exports.push({
                    name: declaration.id.name,
                    type: 'class',
                });
            }
            break;
        case 'TSEnumDeclaration':
            if (declaration.id) {
                exports.push({
                    name: declaration.id.name,
                    type: 'enum',
                });
            }
            break;
    }
    return exports;
}
/**
 * Get export type from declaration
 */
function getExportType(declaration) {
    switch (declaration.type) {
        case 'FunctionDeclaration':
            return 'function';
        case 'ClassDeclaration':
            return 'class';
        case 'TSInterfaceDeclaration':
            return 'interface';
        case 'TSTypeAliasDeclaration':
            return 'type';
        default:
            return 'const';
    }
}
/**
 * Extract "When to Use" bullet points from JSDoc comment
 *
 * Handles two formats:
 * - Heading format: `### When to Use\n- bullet 1\n- bullet 2`
 * - Inline format: `**When to use:** Single line description`
 *
 * Key improvements over naive regex:
 * - Strips JSDoc `* ` markers before matching
 * - Only captures actual bullet points (lines starting with `- ` or `* `)
 * - Stops at section boundaries (empty lines, headings, tables, JSDoc tags)
 *
 * **Limitation:** Multi-line bullets (continuation lines) are not supported.
 * Each bullet must be a single line. For example:
 * ```
 * ### When to Use
 * - This works (single line)
 * - This is broken because it
 *   continues on the next line  // <-- Not captured
 * ```
 * Recommendation: Keep all bullet points as single lines.
 *
 * @param commentText - Raw JSDoc comment content
 * @param fileOptInTag - The file opt-in tag (e.g., "@docs" or "@libar-docs")
 * @returns Array of bullet point strings, or undefined if no "When to Use" section
 */
function extractWhenToUse(commentText, fileOptInTag) {
    // Strip JSDoc markers and normalize lines
    const cleanedLines = commentText.split('\n').map((line) => line
        .trim()
        .replace(/^\*\s?/, '')
        .trim());
    const cleanedText = cleanedLines.join('\n');
    // Try heading format first: ### When to Use
    const headingMatch = /###\s*When to Use\s*\n/i.exec(cleanedText);
    if (headingMatch) {
        const startIndex = headingMatch.index + headingMatch[0].length;
        const afterHeading = cleanedText.slice(startIndex);
        const lines = afterHeading.split('\n');
        const bullets = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // Stop conditions: empty line, new heading, table, JSDoc tag (but not doc directives)
            if (trimmed === '')
                break;
            if (trimmed.startsWith('#'))
                break;
            if (trimmed.startsWith('|'))
                break;
            if (trimmed.startsWith('@') && !trimmed.startsWith(fileOptInTag))
                break;
            // Extract bullet point content (must start with - or * followed by space)
            const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed);
            if (bulletMatch?.[1]) {
                bullets.push(bulletMatch[1].trim());
            }
            else {
                // Line doesn't start with bullet - stop extraction
                break;
            }
        }
        if (bullets.length > 0) {
            return bullets;
        }
    }
    // Try inline format: **When to use:** description
    const inlineMatch = /\*\*When to use:\*\*\s*([^\n]+)/i.exec(cleanedText);
    if (inlineMatch?.[1]) {
        const description = inlineMatch[1].trim();
        if (description) {
            return [description];
        }
    }
    return undefined;
}
//# sourceMappingURL=ast-parser.js.map