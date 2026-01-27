import type { Result, ScannerConfig, DocDirective, ExportInfo, FileParseError, DirectiveValidationError } from '../types/index.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
/**
 * Result of scanning a single file
 */
export interface ScannedFile {
    readonly filePath: string;
    readonly directives: ReadonlyArray<{
        readonly directive: DocDirective;
        readonly code: string;
        readonly exports: readonly ExportInfo[];
    }>;
}
/**
 * Information about a file that failed to scan
 */
export interface FileError {
    readonly file: string;
    readonly error: FileParseError;
}
/**
 * Information about a directive that was skipped due to validation errors
 */
export interface SkippedDirective {
    readonly file: string;
    readonly error: DirectiveValidationError;
}
/**
 * Results of scanning multiple files
 *
 * Contains successfully scanned files, file-level errors, and directive-level errors.
 * This provides full visibility into what was processed and what failed.
 */
export interface ScanResults {
    /** Successfully scanned files with directives */
    readonly files: readonly ScannedFile[];
    /** Files that failed to parse entirely (syntax errors) */
    readonly errors: readonly FileError[];
    /** Individual directives that failed validation but file parsed successfully */
    readonly skippedDirectives: readonly SkippedDirective[];
}
/**
 * Scans source files for @libar-docs-* directives and extracts them
 * with their associated code blocks and export information.
 *
 * **Result Pattern**: Returns Result<ScanResults, never> where:
 * - Success contains both successful files AND individual file errors
 * - Never fails completely (errors are collected in results)
 *
 * @param config - Scanner configuration
 * @param registry - Optional tag registry for metadata extraction (uses default if not provided)
 * @returns Result containing scan results with success and error collections
 *
 * @example
 * ```typescript
 * const registry = await loadTagRegistry('tag-registry.json');
 * const result = await scanPatterns({
 *   patterns: ['src/**\/*.ts'],
 *   baseDir: '/path/to/project'
 * }, registry);
 *
 * if (result.ok) {
 *   const { files, errors } = result.value;
 *   console.log(`Scanned ${files.length} files successfully`);
 *   console.log(`Failed to scan ${errors.length} files`);
 *
 *   for (const file of files) {
 *     console.log(`File: ${file.filePath}`);
 *     for (const { directive, code, exports } of file.directives) {
 *       console.log(`  Tags: ${directive.tags.join(', ')}`);
 *       console.log(`  Exports: ${exports.map(e => e.name).join(', ')}`);
 *     }
 *   }
 *
 *   // Handle errors
 *   for (const { file, error } of errors) {
 *     console.error(`Failed to scan ${file}: ${error.message}`);
 *   }
 * }
 * ```
 */
export declare function scanPatterns(config: ScannerConfig, registry?: TagRegistry): Promise<Result<ScanResults, never>>;
export { findFilesToScan, hasDocDirectives, hasFileOptIn } from './pattern-scanner.js';
export { parseFileDirectives, type ParseDirectivesResult } from './ast-parser.js';
//# sourceMappingURL=index.d.ts.map