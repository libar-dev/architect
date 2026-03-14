/**
 * @architect
 * @architect-core @architect-scanner
 * @architect-pattern Pattern Scanner
 * @architect-status completed
 * @architect-arch-role infrastructure
 * @architect-arch-context scanner
 * @architect-arch-layer infrastructure
 * @architect-include pipeline-stages
 * @architect-uses glob, AST Parser
 * @architect-used-by Doc Extractor, Orchestrator
 * @architect-usecase "When discovering TypeScript files for documentation extraction"
 * @architect-usecase "When filtering files by @architect opt-in marker"
 *
 * ## Pattern Scanner - File Discovery and Directive Detection
 *
 * Discovers TypeScript files matching glob patterns and filters to only
 * those with `@architect` opt-in. Entry point for the scanning phase.
 *
 * ### When to Use
 *
 * - Discovering source files for documentation generation
 * - Checking file opt-in status before extraction
 * - Building file lists for batch processing
 *
 * ### Key Concepts
 *
 * - **Opt-in Model**: Files must explicitly declare `@architect` to be processed
 * - **Glob Patterns**: Uses glob for flexible file matching
 * - **Exclusion Support**: Configurable exclude patterns for node_modules, tests, etc.
 */

import { glob } from 'glob';
import type { ScannerConfig } from '../types/index.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import { DEFAULT_REGEX_BUILDERS } from '../config/defaults.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';

/**
 * Finds all TypeScript files matching the scanner configuration
 *
 * @param config - Scanner configuration
 * @returns Array of file paths to scan
 */
export async function findFilesToScan(config: ScannerConfig): Promise<readonly string[]> {
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
 * Files must have the file-level opt-in tag (e.g., `@architect` without suffix)
 * in a JSDoc block comment to be included in documentation generation.
 * This is separate from section tags (e.g., `@architect-*`) which mark
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
 *   /** @architect This file is documented *\/
 *   export function foo() {}
 * `;
 * hasFileOptIn(content1); // true
 *
 * // File without opt-in (only has section tags)
 * const content2 = `
 *   /** @architect-core *\/
 *   export function bar() {}
 * `;
 * hasFileOptIn(content2); // false
 *
 * // With custom registry
 * const registry = { tagPrefix: "@docs-", fileOptInTag: "@docs", ... };
 * hasFileOptIn(content, registry); // Uses @docs pattern
 * ```
 */
export function hasFileOptIn(content: string, registry?: TagRegistry): boolean {
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_REGEX_BUILDERS;
  return builders.hasFileOptIn(content);
}

/**
 * Checks if file content contains doc directives (e.g., @architect-*)
 *
 * @param content - File content to check
 * @param registry - Optional TagRegistry for custom prefix configuration
 * @returns True if content contains documentation directives
 */
export function hasDocDirectives(content: string, registry?: TagRegistry): boolean {
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_REGEX_BUILDERS;
  return builders.hasDocDirectives(content);
}
