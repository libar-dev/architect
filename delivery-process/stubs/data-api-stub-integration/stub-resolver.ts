/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIStubIntegration
 * @libar-docs-uses ProcessStateAPI
 * @libar-docs-used-by ProcessAPICLIImpl
 *
 * ## StubResolver — Design Stub Discovery and Resolution
 *
 * Identifies design session stubs in the MasterDataset and resolves them
 * against the filesystem to determine implementation status.
 *
 * Stub identification heuristic:
 * - Source file path contains `/stubs/` (lives in stubs directory), OR
 * - Pattern has a `targetPath` field (from @libar-docs-target tag)
 *
 * Resolution uses `fs.existsSync()` on targetPath — not pipeline data —
 * because target files may not have `@libar-docs` annotations.
 *
 * Target: src/api/stub-resolver.ts
 * See: DataAPIStubIntegration spec, Rule 2 (Stubs Subcommand)
 * Since: DS-B
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of resolving a single stub against the filesystem.
 */
export interface StubResolution {
  /** The stub's pattern name (from @libar-docs-implements or patternName) */
  readonly stubName: string;
  /** Source file path of the stub */
  readonly stubFile: string;
  /** Target implementation path (from @libar-docs-target) */
  readonly targetPath: string;
  /** Design session that created this stub (from @libar-docs-since) */
  readonly since: string | undefined;
  /** Parent pattern this stub implements (from @libar-docs-implements) */
  readonly implementsPattern: string | undefined;
  /** Whether the target file exists on disk */
  readonly targetExists: boolean;
}

/**
 * Summary of all stubs grouped by the pattern they implement.
 */
export interface StubSummary {
  /** Pattern name that stubs implement */
  readonly pattern: string;
  /** All stubs for this pattern */
  readonly stubs: readonly StubResolution[];
  /** Count of resolved (target exists) stubs */
  readonly resolvedCount: number;
  /** Count of unresolved (target missing) stubs */
  readonly unresolvedCount: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Identify stub patterns from the MasterDataset.
 *
 * A pattern is a stub if:
 * 1. Its source file path contains '/stubs/' (lives in stubs directory), OR
 * 2. It has a `targetPath` field (from @libar-docs-target tag)
 *
 * @param dataset - MasterDataset with all patterns
 * @returns Array of patterns identified as stubs
 */
export function findStubPatterns(_dataset: unknown): readonly unknown[] {
  throw new Error('DataAPIStubIntegration not yet implemented — roadmap pattern');
}

/**
 * Resolve stubs against the filesystem to determine implementation status.
 *
 * For each stub pattern with a `targetPath`:
 * - Resolves the path relative to baseDir
 * - Checks if the target file exists via `fs.existsSync()`
 * - Extracts stub metadata (since, implementsPattern)
 *
 * @param stubs - Stub patterns to resolve
 * @param baseDir - Base directory for resolving target paths
 * @returns Array of StubResolution objects
 */
export function resolveStubs(
  _stubs: readonly unknown[],
  _baseDir: string
): readonly StubResolution[] {
  throw new Error('DataAPIStubIntegration not yet implemented — roadmap pattern');
}

/**
 * Group stub resolutions by the pattern they implement.
 *
 * Stubs that share the same `implementsPattern` value are grouped together.
 * Each group includes resolution counts for quick status overview.
 *
 * @param resolutions - Individual stub resolutions
 * @returns Array of StubSummary objects, sorted by pattern name
 */
export function groupStubsByPattern(
  _resolutions: readonly StubResolution[]
): readonly StubSummary[] {
  throw new Error('DataAPIStubIntegration not yet implemented — roadmap pattern');
}

/**
 * Extract AD-N decision items from a pattern's description text.
 *
 * Parses JSDoc description for references like:
 * - `AD-1: Unified action model (PDR-011)`
 * - `AD-5: Router maps command types to orchestrator`
 *
 * @param description - Pattern's directive description text
 * @returns Array of extracted decision items
 */
export function extractDecisionItems(
  _description: string
): readonly { id: string; description: string; pdr: string | undefined }[] {
  throw new Error('DataAPIStubIntegration not yet implemented — roadmap pattern');
}

/**
 * Cross-reference all patterns that mention a specific PDR number.
 *
 * Scans pattern descriptions, ADR fields, and seeAlso references
 * for `PDR-{number}` occurrences.
 *
 * @param patterns - All patterns from MasterDataset
 * @param pdrNumber - PDR number to search for (e.g., "012")
 * @returns Patterns referencing this PDR
 */
export function findPdrReferences(
  _patterns: readonly unknown[],
  _pdrNumber: string
): readonly { pattern: string; source: 'description' | 'adr' | 'seeAlso' }[] {
  throw new Error('DataAPIStubIntegration not yet implemented — roadmap pattern');
}
