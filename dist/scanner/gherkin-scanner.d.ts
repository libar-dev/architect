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
import type { Result } from '../types/index.js';
import type { GherkinScanResults } from '../validation-schemas/feature.js';
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
export declare function findFeatureFiles(config: GherkinScannerConfig): Promise<readonly string[]>;
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
export declare function scanGherkinFiles(config: GherkinScannerConfig): Promise<Result<GherkinScanResults, never>>;
export { parseFeatureFile, extractPatternTags } from './gherkin-ast-parser.js';
export type { ScannedGherkinFile, GherkinFileError, GherkinScanResults, GherkinBackground, GherkinRule, GherkinStep, GherkinDataTable, GherkinDataTableRow, } from '../validation-schemas/feature.js';
//# sourceMappingURL=gherkin-scanner.d.ts.map