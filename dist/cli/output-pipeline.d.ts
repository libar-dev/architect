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
import type { QueryResult } from '../api/types.js';
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
export declare const DEFAULT_OUTPUT_MODIFIERS: OutputModifiers;
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
    /** Filter by architecture context (@libar-docs-arch-context) */
    readonly archContext: string | null;
    /** Filter by product area (@libar-docs-product-area) */
    readonly productArea: string | null;
    /** Maximum number of results */
    readonly limit: number | null;
    /** Number of results to skip */
    readonly offset: number | null;
}
export declare const DEFAULT_LIST_FILTERS: ListFilters;
/**
 * Discriminated union for pipeline input.
 *
 * The router determines `kind` based on which API method was called.
 * Pattern arrays get summarization + modifiers; scalars pass through.
 */
export type PipelineInput = {
    readonly kind: 'patterns';
    readonly data: readonly ExtractedPattern[];
} | {
    readonly kind: 'scalar';
    readonly data: unknown;
};
/**
 * Set of ProcessStateAPI method names that return ExtractedPattern[].
 *
 * Used by the router to tag results with `kind: 'patterns'` for the pipeline.
 */
export declare const PATTERN_ARRAY_METHODS: ReadonlySet<string>;
/**
 * Validate output modifier combinations.
 * Throws on conflicts: --full + --names-only, --full + --count, --full + --fields.
 */
export declare function validateModifiers(modifiers: OutputModifiers): void;
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
export declare function applyOutputPipeline(input: PipelineInput, modifiers: OutputModifiers): unknown;
/**
 * Apply composable filters to the pattern list.
 *
 * Sequential filter composition: status → phase → category → source.
 * Pagination (offset/limit) applies after all filters.
 */
export declare function applyListFilters(dataset: MasterDataset, filters: ListFilters): readonly ExtractedPattern[];
/**
 * Strip null, undefined, and empty values from an object for compact output.
 *
 * Recursively removes:
 * - null and undefined values
 * - empty strings
 * - empty arrays
 * - empty objects
 */
export declare function stripEmpty(obj: unknown): unknown;
/**
 * Format a QueryResult envelope for CLI output.
 *
 * - json mode: pretty-printed with 2-space indent
 * - compact mode: minified with empty values stripped
 */
export declare function formatOutput(envelope: QueryResult<unknown>, format: 'json' | 'compact'): string;
//# sourceMappingURL=output-pipeline.d.ts.map