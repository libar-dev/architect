/**
 * @libar-docs-status roadmap
 * @libar-docs-implements DataAPIOutputShaping
 * @libar-docs-uses PatternSummarizer
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-target src/cli/output-pipeline.ts
 * @libar-docs-since DS-A
 *
 * ## OutputPipeline — CLI Output Shaping and Formatting
 *
 * Post-processing pipeline that transforms raw API results into shaped CLI output.
 * Applies output modifiers (--names-only, --count, --fields, --full) and wraps
 * results in QueryResult<T> envelopes.
 *
 * Architecture decision: This is a single post-processing function, NOT a
 * middleware chain. The 4 modifiers are mutually exclusive with clear precedence:
 * count > namesOnly > fields > default summarize.
 *
 * The pipeline discriminates pattern arrays from scalars using a PipelineInput
 * discriminated union — the router knows which methods return ExtractedPattern[]
 * via a static PATTERN_ARRAY_METHODS set.
 *
 * See: DataAPIOutputShaping spec, Rule 2 (Output Modifiers), Rule 3 (Output Format)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Output modifier flags parsed from CLI arguments.
 *
 * Precedence: count > namesOnly > fields > default summarize.
 * When --full is set, summarization is bypassed.
 */
export interface OutputModifiers {
  /** --names-only: return array of pattern name strings */
  readonly namesOnly: boolean;
  /** --count: return single integer count */
  readonly count: boolean;
  /** --fields name,status: return only selected fields per pattern */
  readonly fields: readonly string[] | null;
  /** --full: bypass summarization, return raw ExtractedPattern[] */
  readonly full: boolean;
}

export const DEFAULT_OUTPUT_MODIFIERS: OutputModifiers = {
  namesOnly: false,
  count: false,
  fields: null,
  full: false,
};

/**
 * Composable list filters for the `list` subcommand.
 *
 * Filters combine via AND logic. Each filter narrows the result set.
 * The pipeline uses Set-based intersection on pre-computed MasterDataset views.
 */
export interface ListFilters {
  /** Filter by FSM status (roadmap, active, completed, deferred) */
  readonly status: string | null;
  /** Filter by roadmap phase number */
  readonly phase: number | null;
  /** Filter by category name */
  readonly category: string | null;
  /** Filter by source type */
  readonly source: 'typescript' | 'gherkin' | null;
  /** Maximum number of results */
  readonly limit: number | null;
  /** Number of results to skip */
  readonly offset: number | null;
}

export const DEFAULT_LIST_FILTERS: ListFilters = {
  status: null,
  phase: null,
  category: null,
  source: null,
  limit: null,
  offset: null,
};

/**
 * Discriminated union for pipeline input.
 *
 * The router determines `kind` based on which API method was called.
 * Pattern arrays get summarization + modifiers; scalars pass through.
 */
export type PipelineInput =
  | { readonly kind: 'patterns'; readonly data: readonly unknown[] }
  | { readonly kind: 'scalar'; readonly data: unknown };

/**
 * Set of ProcessStateAPI method names that return ExtractedPattern[].
 *
 * Used by the router to tag results with `kind: 'patterns'` for the pipeline.
 */
export const PATTERN_ARRAY_METHODS = new Set([
  'getPatternsByNormalizedStatus',
  'getPatternsByStatus',
  'getPatternsByPhase',
  'getPatternsByCategory',
  'getPatternsByQuarter',
  'getCurrentWork',
  'getRoadmapItems',
  'getRecentlyCompleted',
]);

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Apply output modifiers to pipeline input.
 *
 * For pattern arrays:
 * - Default: summarize each pattern to ~100 bytes
 * - --full: bypass summarization
 * - --names-only: extract pattern names as string[]
 * - --count: return array length as number
 * - --fields: pick specific fields from each summary
 *
 * For scalars: pass through unchanged (modifiers do not apply).
 *
 * @param input - Discriminated pipeline input (patterns or scalar)
 * @param modifiers - Output modifier flags from CLI args
 * @returns Shaped output ready for JSON serialization
 */
export function applyOutputPipeline(
  _input: PipelineInput,
  _modifiers: OutputModifiers
): unknown {
  throw new Error('DataAPIOutputShaping not yet implemented — roadmap pattern');
}

/**
 * Apply composable filters to the pattern list using MasterDataset views.
 *
 * Uses Set-based intersection for O(n) composition across pre-computed views.
 * Pagination (offset/limit) applies after all filters.
 *
 * @param dataset - MasterDataset with pre-computed views
 * @param filters - Composable list filters
 * @returns Filtered array of ExtractedPatterns
 */
export function applyListFilters(
  _dataset: unknown,
  _filters: ListFilters
): readonly unknown[] {
  throw new Error('DataAPIOutputShaping not yet implemented — roadmap pattern');
}

/**
 * Strip null, undefined, and empty values from an object for compact output.
 *
 * Recursively removes:
 * - null and undefined values
 * - empty strings
 * - empty arrays
 * - empty objects
 *
 * Used by formatOutput() when compact mode is active.
 *
 * @param obj - Object to strip
 * @returns Object with empty values removed
 */
export function stripEmpty(_obj: unknown): unknown {
  throw new Error('DataAPIOutputShaping not yet implemented — roadmap pattern');
}

/**
 * Format a QueryResult envelope for CLI output.
 *
 * - json mode: pretty-printed with 2-space indent
 * - compact mode: minified with empty values stripped
 *
 * @param envelope - QueryResult<T> envelope
 * @param format - Output format ('json' or 'compact')
 * @returns Formatted JSON string
 */
export function formatOutput(
  _envelope: unknown,
  _format: 'json' | 'compact'
): string {
  throw new Error('DataAPIOutputShaping not yet implemented — roadmap pattern');
}
