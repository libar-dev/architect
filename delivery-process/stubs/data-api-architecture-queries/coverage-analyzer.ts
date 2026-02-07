/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIArchitectureQueries
 * @libar-docs-uses Pattern Scanner, MasterDataset
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/api/coverage-analyzer.ts
 * @libar-docs-since DS-D
 *
 * ## CoverageAnalyzer — Annotation Coverage and Taxonomy Gap Detection
 *
 * Reports annotation completeness by comparing scannable files (from glob)
 * against annotated patterns in MasterDataset. Also detects unused taxonomy
 * values defined in TagRegistry but never applied.
 *
 * ### Coverage Data Access Strategy (DS-D-1)
 *
 * Uses independent glob via findFilesToScan() from src/scanner/pattern-scanner.ts.
 * Re-running a glob is cheap (~1ms) and avoids changing buildPipeline() to
 * thread scan results. The coverage analyzer receives CLI config (input globs,
 * baseDir) and TagRegistry via SubcommandContext.
 *
 * findUnannotatedFiles() also reads file content to check hasFileOptIn() —
 * this is a fast regex check, not AST parsing.
 *
 * ### What Counts as "Scannable"
 *
 * - TypeScript files matching input globs (e.g., src/**\/*.ts)
 * - Excluding: node_modules, dist, test files, declaration files
 * - Same exclusion rules as the scanner: findFilesToScan() defaults
 *
 * See: DataAPIArchitectureQueries spec, Rule 2 (Architecture Coverage)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Report on unused taxonomy values.
 *
 * Compares tagRegistry definitions against actual usage in patterns.
 * "Unused" means defined in the registry but not applied to any pattern.
 */
export interface UnusedTaxonomyReport {
  /** Category names defined in registry but not used by any pattern. */
  readonly unusedCategories: readonly string[];
  /** Architecture role values defined but not applied. */
  readonly unusedRoles: readonly string[];
  /** Architecture layer values defined but not applied. */
  readonly unusedLayers: readonly string[];
  /** Status values defined but not applied. */
  readonly unusedStatuses: readonly string[];
}

/**
 * Full coverage report combining file coverage and taxonomy gaps.
 *
 * Output for `arch coverage` subcommand:
 *     41/50 files annotated (82%)
 *     9 unannotated files: [list]
 *     Unused taxonomy: [categories, roles, layers]
 */
export interface CoverageReport {
  /** Count of files with @libar-docs opt-in that produced patterns. */
  readonly annotatedFileCount: number;
  /** Total .ts files found by glob (before opt-in filter). */
  readonly totalScannableFiles: number;
  /** annotatedFileCount / totalScannableFiles * 100. */
  readonly coveragePercentage: number;
  /** Files matching input globs but lacking @libar-docs marker. */
  readonly unannotatedFiles: readonly string[];
  /** Taxonomy values defined but never used. */
  readonly unusedTaxonomy: UnusedTaxonomyReport;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Analyze annotation coverage by comparing glob results against extracted patterns.
 *
 * Algorithm:
 * 1. Call findFilesToScan() with input globs to get all scannable files
 * 2. Collect unique source files from dataset.patterns
 * 3. Compute difference: scannable - annotated = unannotated
 * 4. Compute unused taxonomy values
 * 5. Return CoverageReport
 *
 * Async because findFilesToScan() uses glob (filesystem I/O).
 *
 * @param dataset - MasterDataset with extracted patterns
 * @param inputGlobs - CLI --input glob patterns
 * @param baseDir - Base directory for file discovery
 * @param registry - TagRegistry for unused taxonomy detection
 * @returns Coverage report with annotated/total counts and gaps
 */
export async function analyzeCoverage(
  _dataset: unknown,
  _inputGlobs: readonly string[],
  _baseDir: string,
  _registry: unknown
): Promise<CoverageReport> {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}

/**
 * Find unannotated files matching an optional path filter.
 *
 * Calls findFilesToScan() for file discovery, then reads each file
 * to check hasFileOptIn() (fast regex, no AST parsing).
 *
 * @param inputGlobs - Glob patterns for file discovery
 * @param baseDir - Base directory for scanning
 * @param registry - TagRegistry for opt-in detection
 * @param pathFilter - Optional additional glob to narrow results (e.g., 'src/generators/**\/*.ts')
 * @returns Relative paths of files without @libar-docs marker
 */
export async function findUnannotatedFiles(
  _inputGlobs: readonly string[],
  _baseDir: string,
  _registry: unknown,
  _pathFilter?: string
): Promise<readonly string[]> {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}

/**
 * Compute unused taxonomy values by comparing registry definitions
 * against actual tag usage in patterns.
 *
 * Algorithm:
 * 1. Collect all category names used: dataset.patterns.map(p => p.category)
 * 2. Collect all arch roles used: dataset.patterns.map(p => p.archRole).filter(defined)
 * 3. Collect all arch layers used: similarly
 * 4. Collect all statuses used: similarly
 * 5. Diff against registry definitions
 *
 * @param dataset - MasterDataset with patterns
 * @param registry - TagRegistry with definitions
 * @returns Report of unused taxonomy values
 */
export function findUnusedTaxonomy(
  _dataset: unknown,
  _registry: unknown
): UnusedTaxonomyReport {
  throw new Error('DataAPIArchitectureQueries not yet implemented — roadmap pattern');
}
