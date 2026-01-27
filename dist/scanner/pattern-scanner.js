/**
 * @libar-docs
 * @libar-docs-core @libar-docs-scanner
 * @libar-docs-pattern Pattern Scanner
 * @libar-docs-status completed
 * @libar-docs-uses glob, AST Parser
 * @libar-docs-used-by Doc Extractor, Orchestrator
 * @libar-docs-usecase "When discovering TypeScript files for documentation extraction"
 * @libar-docs-usecase "When filtering files by @libar-docs opt-in marker"
 *
 * ## Pattern Scanner - File Discovery and Directive Detection
 *
 * Discovers TypeScript files matching glob patterns and filters to only
 * those with `@libar-docs` opt-in. Entry point for the scanning phase.
 *
 * ### When to Use
 *
 * - Discovering source files for documentation generation
 * - Checking file opt-in status before extraction
 * - Building file lists for batch processing
 *
 * ### Key Concepts
 *
 * - **Opt-in Model**: Files must explicitly declare `@libar-docs` to be processed
 * - **Glob Patterns**: Uses glob for flexible file matching
 * - **Exclusion Support**: Configurable exclude patterns for node_modules, tests, etc.
 */
import { glob } from 'glob';
import { createRegexBuilders } from '../config/regex-builders.js';
import { DEFAULT_REGEX_BUILDERS } from '../config/defaults.js';
/**
 * Finds all TypeScript files matching the scanner configuration
 *
 * @param config - Scanner configuration
 * @returns Array of file paths to scan
 */
export async function findFilesToScan(config) {
    const defaultExclude = [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
    ];
    const excludePatterns = config.exclude ? [...defaultExclude, ...config.exclude] : defaultExclude;
    const files = await glob([...config.patterns], {
        cwd: config.baseDir,
        ignore: excludePatterns,
        absolute: true,
    });
    // Filter to only TypeScript source files
    return files.filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'));
}
/**
 * Checks if file has opted-in to documentation generation
 *
 * Files must have the file-level opt-in tag (e.g., `@libar-docs` without suffix)
 * in a JSDoc block comment to be included in documentation generation.
 * This is separate from section tags (e.g., `@libar-docs-*`) which mark
 * individual blocks for extraction.
 *
 * @param content - File content to check
 * @param registry - Optional TagRegistry for custom prefix configuration
 * @returns True if file has opt-in tag
 *
 * @example
 * ```typescript
 * // File with opt-in
 * const content1 = `
 *   /** @libar-docs This file is documented *\/
 *   export function foo() {}
 * `;
 * hasFileOptIn(content1); // true
 *
 * // File without opt-in (only has section tags)
 * const content2 = `
 *   /** @libar-docs-core *\/
 *   export function bar() {}
 * `;
 * hasFileOptIn(content2); // false
 *
 * // With custom registry
 * const registry = { tagPrefix: "@docs-", fileOptInTag: "@docs", ... };
 * hasFileOptIn(content, registry); // Uses @docs pattern
 * ```
 */
export function hasFileOptIn(content, registry) {
    const builders = registry
        ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
        : DEFAULT_REGEX_BUILDERS;
    return builders.hasFileOptIn(content);
}
/**
 * Checks if file content contains doc directives (e.g., @libar-docs-*)
 *
 * @param content - File content to check
 * @param registry - Optional TagRegistry for custom prefix configuration
 * @returns True if content contains documentation directives
 */
export function hasDocDirectives(content, registry) {
    const builders = registry
        ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
        : DEFAULT_REGEX_BUILDERS;
    return builders.hasDocDirectives(content);
}
//# sourceMappingURL=pattern-scanner.js.map