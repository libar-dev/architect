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
import { QueryApiError } from '../api/types.js';
import { summarizePatterns, SUMMARY_FIELDS, deriveSource } from '../api/summarize.js';
import { getPatternName } from '../api/pattern-helpers.js';
export const DEFAULT_OUTPUT_MODIFIERS = {
    namesOnly: false,
    count: false,
    fields: null,
    full: false,
};
export const DEFAULT_LIST_FILTERS = {
    status: null,
    phase: null,
    category: null,
    source: null,
    archContext: null,
    productArea: null,
    limit: null,
    offset: null,
};
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
// Validation
// ---------------------------------------------------------------------------
/**
 * Validate output modifier combinations.
 * Throws on conflicts: --full + --names-only, --full + --count, --full + --fields.
 */
export function validateModifiers(modifiers) {
    if (modifiers.full && modifiers.namesOnly) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Conflicting modifiers: --full and --names-only cannot be used together');
    }
    if (modifiers.full && modifiers.count) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Conflicting modifiers: --full and --count cannot be used together');
    }
    if (modifiers.full && modifiers.fields !== null) {
        throw new QueryApiError('INVALID_ARGUMENT', 'Conflicting modifiers: --full and --fields cannot be used together');
    }
    if (modifiers.fields !== null) {
        const validFields = SUMMARY_FIELDS;
        const invalidFields = modifiers.fields.filter((f) => !validFields.has(f));
        if (invalidFields.length > 0) {
            throw new QueryApiError('INVALID_ARGUMENT', `Invalid field names: ${invalidFields.join(', ')}. Valid fields: ${[...validFields].join(', ')}`);
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
export function applyOutputPipeline(input, modifiers) {
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
            const picked = {};
            for (const field of fieldSet) {
                if (field in s) {
                    picked[field] = s[field];
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
export function applyListFilters(dataset, filters) {
    let candidates = dataset.patterns;
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
    // Filter by architecture context
    if (filters.archContext !== null) {
        const ctx = filters.archContext.toLowerCase();
        candidates = candidates.filter((p) => p.archContext?.toLowerCase() === ctx);
    }
    // Filter by product area
    if (filters.productArea !== null) {
        const area = filters.productArea.toLowerCase();
        candidates = candidates.filter((p) => p.productArea?.toLowerCase() === area);
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
export function stripEmpty(obj) {
    if (obj === null || obj === undefined) {
        return undefined;
    }
    if (Array.isArray(obj)) {
        if (obj.length === 0)
            return undefined;
        return obj.map(stripEmpty).filter((v) => v !== undefined);
    }
    if (typeof obj === 'object') {
        const result = {};
        let hasKeys = false;
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined)
                continue;
            if (typeof value === 'string' && value === '')
                continue;
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
export function formatOutput(envelope, format) {
    if (format === 'compact') {
        const stripped = stripEmpty(envelope);
        return JSON.stringify(stripped);
    }
    return JSON.stringify(envelope, null, 2);
}
//# sourceMappingURL=output-pipeline.js.map