/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern OutputPipelineImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIOutputShaping
 * @libar-docs-uses PatternSummarizerImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer application
 *
 * ## OutputPipeline — CLI Output Shaping and Formatting
 *
 * Post-processing pipeline that transforms raw API results into shaped CLI output.
 * Applies output modifiers (--names-only, --count, --fields, --full) and wraps
 * results in QueryResult envelopes.
 *
 * Architecture decision: This is a single post-processing function, NOT a
 * middleware chain. The 4 modifiers are mutually exclusive with clear precedence:
 * count > namesOnly > fields > default summarize.
 */

import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import { QueryApiError } from '../api/types.js';
import type { QueryResult } from '../api/types.js';
import { summarizePatterns, SUMMARY_FIELDS, deriveSource } from '../api/summarize.js';
import { getPatternName } from '../api/pattern-helpers.js';

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
  | { readonly kind: 'patterns'; readonly data: readonly ExtractedPattern[] }
  | { readonly kind: 'scalar'; readonly data: unknown };

/**
 * Set of ProcessStateAPI method names that return ExtractedPattern[].
 *
 * Used by the router to tag results with `kind: 'patterns'` for the pipeline.
 */
export const PATTERN_ARRAY_METHODS: ReadonlySet<string> = new Set([
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
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate output modifier combinations.
 * Throws on conflicts: --full + --names-only, --full + --count, --full + --fields.
 */
export function validateModifiers(modifiers: OutputModifiers): void {
  if (modifiers.full && modifiers.namesOnly) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Conflicting modifiers: --full and --names-only cannot be used together'
    );
  }
  if (modifiers.full && modifiers.count) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Conflicting modifiers: --full and --count cannot be used together'
    );
  }
  if (modifiers.full && modifiers.fields !== null) {
    throw new QueryApiError(
      'INVALID_ARGUMENT',
      'Conflicting modifiers: --full and --fields cannot be used together'
    );
  }
  if (modifiers.fields !== null) {
    const validFields = SUMMARY_FIELDS;
    const invalidFields = modifiers.fields.filter((f) => !validFields.has(f));
    if (invalidFields.length > 0) {
      throw new QueryApiError(
        'INVALID_ARGUMENT',
        `Invalid field names: ${invalidFields.join(', ')}. Valid fields: ${[...validFields].join(', ')}`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Pipeline
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
 */
export function applyOutputPipeline(input: PipelineInput, modifiers: OutputModifiers): unknown {
  if (input.kind === 'scalar') {
    return input.data;
  }

  const patterns = input.data;

  // Precedence: count > namesOnly > fields > default summarize
  if (modifiers.count) {
    return patterns.length;
  }

  if (modifiers.namesOnly) {
    return patterns.map((p) => getPatternName(p));
  }

  if (modifiers.full) {
    return patterns;
  }

  const summaries = summarizePatterns(patterns);

  if (modifiers.fields !== null) {
    const fieldSet = new Set(modifiers.fields);
    return summaries.map((s) => {
      const picked: Record<string, unknown> = {};
      for (const field of fieldSet) {
        if (field in s) {
          picked[field] = s[field as keyof typeof s];
        }
      }
      return picked;
    });
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Apply composable filters to the pattern list.
 *
 * Sequential filter composition: status → phase → category → source.
 * Pagination (offset/limit) applies after all filters.
 */
export function applyListFilters(
  dataset: MasterDataset,
  filters: ListFilters
): readonly ExtractedPattern[] {
  let candidates: readonly ExtractedPattern[] = dataset.patterns;

  // Filter by status
  if (filters.status !== null) {
    // For exact status matching (roadmap, active, completed, deferred),
    // filter directly rather than using normalized views
    candidates = candidates.filter((p) => p.status === filters.status);
  }

  // Filter by phase
  if (filters.phase !== null) {
    const phase = filters.phase;
    candidates = candidates.filter((p) => p.phase === phase);
  }

  // Filter by category
  if (filters.category !== null) {
    const category = filters.category.toLowerCase();
    candidates = candidates.filter((p) => p.category.toLowerCase() === category);
  }

  // Filter by source
  if (filters.source !== null) {
    const source = filters.source;
    candidates = candidates.filter((p) => {
      return deriveSource(p.source.file) === source;
    });
  }

  // Apply pagination
  if (filters.offset !== null) {
    candidates = candidates.slice(filters.offset);
  }
  if (filters.limit !== null) {
    candidates = candidates.slice(0, filters.limit);
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

/**
 * Strip null, undefined, and empty values from an object for compact output.
 *
 * Recursively removes:
 * - null and undefined values
 * - empty strings
 * - empty arrays
 * - empty objects
 */
export function stripEmpty(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return undefined;
    return obj.map(stripEmpty).filter((v) => v !== undefined);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    let hasKeys = false;
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && value === '') continue;
      const stripped = stripEmpty(value);
      if (stripped !== undefined) {
        result[key] = stripped;
        hasKeys = true;
      }
    }
    return hasKeys ? result : undefined;
  }

  return obj;
}

/**
 * Format a QueryResult envelope for CLI output.
 *
 * - json mode: pretty-printed with 2-space indent
 * - compact mode: minified with empty values stripped
 */
export function formatOutput(envelope: QueryResult<unknown>, format: 'json' | 'compact'): string {
  if (format === 'compact') {
    const stripped = stripEmpty(envelope);
    return JSON.stringify(stripped);
  }
  return JSON.stringify(envelope, null, 2);
}
