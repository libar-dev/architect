/**
 * @libar-docs
 * @libar-docs-scanner
 * @libar-docs-pattern GherkinScanner
 * @libar-docs-status completed
 * @libar-docs-implements GherkinRulesSupport
 * @libar-docs-uses GherkinASTParser, GherkinTypes
 * @libar-docs-used-by DualSourceExtractor, Orchestrator
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context scanner
 * @libar-docs-arch-layer infrastructure
 *
 * ## GherkinScanner - Multi-Source Pattern Extraction from Feature Files
 *
 * Scans .feature files for pattern metadata encoded in Gherkin tags.
 * Enables roadmap patterns to be defined in acceptance criteria files
 * before implementation, supporting specification-first development.
 *
 * ### When to Use
 *
 * - When defining roadmap patterns in .feature files
 * - When extracting pattern metadata from acceptance criteria
 * - When building multi-source documentation (TypeScript + Gherkin)
 *
 * ### Key Concepts
 *
 * - **Feature Tags**: @pattern:Name, @phase:N, @status:roadmap map to pattern metadata
 * - **Multi-Source**: Patterns can be defined in TypeScript stubs OR Gherkin features
 * - **Conflict Detection**: Same pattern name in both sources triggers error
 */

import * as fs from 'fs/promises';
import { glob } from 'glob';
import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';
import type {
  ScannedGherkinFile,
  GherkinFileError,
  GherkinScanResults,
} from '../validation-schemas/feature.js';
import { parseFeatureFile } from './gherkin-ast-parser.js';

/**
 * Configuration for Gherkin scanner
 */
export interface GherkinScannerConfig {
  /** Glob pattern(s) for .feature files */
  readonly patterns: string | readonly string[];
  /** Base directory for resolving patterns (default: cwd) */
  readonly baseDir?: string;
  /** Additional glob patterns to exclude */
  readonly exclude?: readonly string[];
}

/**
 * Find all .feature files matching the scanner configuration
 *
 * @param config - Scanner configuration
 * @returns Array of absolute file paths to .feature files
 *
 * @example
 * ```typescript
 * const files = await findFeatureFiles({
 *   patterns: 'tests/features/**\/*.feature',
 *   baseDir: '/path/to/project'
 * });
 * console.log(files); // ['/path/to/project/tests/features/my-pattern.feature', ...]
 * ```
 */
export async function findFeatureFiles(config: GherkinScannerConfig): Promise<readonly string[]> {
  const defaultExclude = ['node_modules/**', 'dist/**'];
  const excludePatterns = config.exclude ? [...defaultExclude, ...config.exclude] : defaultExclude;

  const patterns = Array.isArray(config.patterns) ? config.patterns : [config.patterns];

  const files = await glob(patterns, {
    cwd: config.baseDir ?? process.cwd(),
    ignore: excludePatterns,
    absolute: true,
  });

  // Filter to only .feature and .feature.md files (MDG format)
  return files.filter((file) => file.endsWith('.feature') || file.endsWith('.feature.md'));
}

/**
 * Scan Gherkin feature files and extract pattern metadata
 *
 * Parses .feature files and extracts:
 * - Feature name, description, tags
 * - Scenario names, tags, steps
 * - Pattern metadata from tags (@pattern:Name, @phase:N, etc.)
 *
 * **Result Pattern**: Returns Result<GherkinScanResults, never> where:
 * - Success contains both successful files AND individual file errors
 * - Never fails completely (errors are collected in results)
 *
 * @param config - Scanner configuration
 * @returns Result containing scan results with success and error collections
 *
 * @example
 * ```typescript
 * const result = await scanGherkinFiles({
 *   patterns: 'tests/features/roadmap/**\/*.feature',
 *   baseDir: '/path/to/project'
 * });
 *
 * if (result.ok) {
 *   const { files, errors } = result.value;
 *   console.log(`Scanned ${files.length} features successfully`);
 *   console.log(`Failed to parse ${errors.length} features`);
 *
 *   for (const file of files) {
 *     console.log(`Feature: ${file.feature.name}`);
 *     console.log(`  Tags: ${file.feature.tags.join(', ')}`);
 *     console.log(`  Scenarios: ${file.scenarios.length}`);
 *   }
 *
 *   // Handle errors
 *   for (const { file, error } of errors) {
 *     console.error(`Failed to parse ${file}: ${error.message}`);
 *     if (error.line) {
 *       console.error(`  at line ${error.line}${error.column ? `, column ${error.column}` : ''}`);
 *     }
 *   }
 * }
 * ```
 */
export async function scanGherkinFiles(
  config: GherkinScannerConfig
): Promise<Result<GherkinScanResults, never>> {
  // Find all feature files to scan
  const files = await findFeatureFiles(config);

  const scanned: ScannedGherkinFile[] = [];
  const errors: GherkinFileError[] = [];

  for (const filePath of files) {
    try {
      // Read feature file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse the feature file
      const parseResult = parseFeatureFile(content, filePath);

      if (R.isErr(parseResult)) {
        // Failed to parse - collect error
        errors.push(parseResult.error);
        continue;
      }

      const { feature, background, rules, scenarios } = parseResult.value;

      // Store scanned file
      scanned.push({
        filePath,
        feature,
        ...(background && { background }),
        ...(rules && rules.length > 0 && { rules }),
        scenarios,
      });
    } catch (error) {
      // Collect filesystem/IO errors
      errors.push({
        file: filePath,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
      continue;
    }
  }

  // Always succeeds - errors are collected in results
  return R.ok({
    files: scanned,
    errors,
  });
}

export { parseFeatureFile, extractPatternTags } from './gherkin-ast-parser.js';
export type {
  ScannedGherkinFile,
  GherkinFileError,
  GherkinScanResults,
  GherkinBackground,
  GherkinRule,
  GherkinStep,
  GherkinDataTable,
  GherkinDataTableRow,
} from '../validation-schemas/feature.js';
