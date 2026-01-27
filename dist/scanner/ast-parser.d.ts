/**
 * @libar-docs
 * @libar-docs-core @libar-docs-scanner
 * @libar-docs-pattern TypeScript AST Parser
 * @libar-docs-status completed
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
import type { DocDirective, ExportInfo, DirectiveValidationError, FileParseError } from '../types/index.js';
import { type TagRegistry } from '../validation-schemas/index.js';
/**
 * Result of parsing a file for directives
 */
export interface ParseDirectivesResult {
    readonly directives: ReadonlyArray<{
        directive: DocDirective;
        code: string;
        exports: readonly ExportInfo[];
    }>;
    /** Directive-level validation errors (individual directives that failed) */
    readonly skippedDirectives: readonly DirectiveValidationError[];
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
export declare function parseFileDirectives(content: string, filePath: string, registry?: TagRegistry): Result<ParseDirectivesResult, FileParseError>;
//# sourceMappingURL=ast-parser.d.ts.map