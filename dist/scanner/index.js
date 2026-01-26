import * as fs from "fs/promises";
import { Result as R, createFileParseError } from "../types/index.js";
import { parseFileDirectives } from "./ast-parser.js";
import { findFilesToScan, hasDocDirectives, hasFileOptIn } from "./pattern-scanner.js";
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
export async function scanPatterns(config, registry) {
    // Find all files to scan
    const files = await findFilesToScan(config);
    const scanned = [];
    const errors = [];
    const skippedDirectives = [];
    for (const filePath of files) {
        try {
            // Read file content once - passed to all functions (no double read!)
            const content = await fs.readFile(filePath, "utf-8");
            // Check for file-level opt-in (requires opt-in tag from registry)
            if (!hasFileOptIn(content, registry))
                continue;
            // Quick check if file has any section directives
            if (!hasDocDirectives(content, registry))
                continue;
            // Parse the file for directives (pass content to avoid re-reading)
            // Pass registry for metadata tag extraction (uses, usedBy, usecase, etc.)
            const parseResult = parseFileDirectives(content, filePath, registry);
            if (R.isErr(parseResult)) {
                // File-level parse error (syntax error, etc.)
                errors.push({
                    file: filePath,
                    error: parseResult.error,
                });
                continue;
            }
            const { directives, skippedDirectives: fileSkipped } = parseResult.value;
            // Collect directive-level validation errors
            for (const skipped of fileSkipped) {
                skippedDirectives.push({ file: filePath, error: skipped });
            }
            if (directives.length === 0)
                continue;
            scanned.push({
                filePath,
                directives,
            });
        }
        catch (error) {
            // Collect filesystem/IO errors
            errors.push({
                file: filePath,
                error: createFileParseError(filePath, error instanceof Error ? error.message : String(error), undefined, error),
            });
            continue;
        }
    }
    // Always succeeds - errors are collected in results
    return R.ok({
        files: scanned,
        errors,
        skippedDirectives,
    });
}
export { findFilesToScan, hasDocDirectives, hasFileOptIn } from "./pattern-scanner.js";
export { parseFileDirectives } from "./ast-parser.js";
//# sourceMappingURL=index.js.map