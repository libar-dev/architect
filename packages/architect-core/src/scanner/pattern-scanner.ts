/**
 * @architect
 * @architect-pattern PatternScanner
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:scanner
 *
 * ## PatternScanner - TypeScript Pattern Source Discovery
 *
 * Globs `.ts` source files according to the scanner config and
 * collects them as `ScannedFile` records for the JSDoc directive
 * extractor.
 *
 * ### When to Use
 *
 * - Build pipeline: enumerate TS sources carrying `@architect-*` JSDoc
 * - Lint: feed the lint engine the same canonical file list
 */
import { glob } from 'glob';

import type { ScannerConfig } from '../types/index.js';
import { DEFAULT_REGEX_BUILDERS } from '../config/defaults.js';
import { createRegexBuilders } from '../config/regex-builders.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';

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

  files.sort();
  return files.filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'));
}

export function hasFileOptIn(content: string, registry?: TagRegistry): boolean {
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_REGEX_BUILDERS;
  return builders.hasFileOptIn(content);
}

export function hasDocDirectives(content: string, registry?: TagRegistry): boolean {
  const builders = registry
    ? createRegexBuilders(registry.tagPrefix, registry.fileOptInTag)
    : DEFAULT_REGEX_BUILDERS;
  return builders.hasDocDirectives(content);
}
