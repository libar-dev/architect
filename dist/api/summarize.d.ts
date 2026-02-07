/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern PatternSummarizerImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIOutputShaping
 * @libar-docs-uses ProcessStateAPI
 * @libar-docs-used-by OutputPipeline, ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## PatternSummarizer — Compact Pattern Projection
 *
 * Projects the full ExtractedPattern (~3.5KB per pattern) down to a
 * PatternSummary (~100 bytes) for list queries. Reduces CLI output
 * from ~594KB to ~4KB for typical codebases.
 *
 * Uses Zod schema-first pattern: PatternSummarySchema defines the type,
 * and PatternSummary is inferred from it.
 */
import { z } from 'zod';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
/**
 * Compact projection of ExtractedPattern for list queries.
 *
 * Fields selected for maximum information density at minimum size:
 * - patternName: identifies the pattern
 * - status: FSM state (roadmap/active/completed/deferred)
 * - category: domain classification
 * - phase: roadmap phase number (for sequencing)
 * - file: source file path (for navigation)
 * - source: typescript or gherkin (for filtering)
 */
export declare const PatternSummarySchema: z.ZodObject<{
    patternName: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    phase: z.ZodOptional<z.ZodNumber>;
    file: z.ZodString;
    source: z.ZodEnum<{
        typescript: "typescript";
        gherkin: "gherkin";
    }>;
}, z.core.$strip>;
export type PatternSummary = z.infer<typeof PatternSummarySchema>;
/**
 * Valid field names for PatternSummary, used by --fields validation.
 */
export declare const SUMMARY_FIELDS: ReadonlySet<string>;
/**
 * Derive source type from file extension.
 */
export declare function deriveSource(filePath: string): 'typescript' | 'gherkin';
/**
 * Project an ExtractedPattern to a compact PatternSummary.
 *
 * - `patternName` prefers explicit @libar-docs-pattern tag, falls back to `name`
 * - `source` is derived from file extension (.feature -> gherkin, else typescript)
 * - Optional fields (status, phase) are included when present, omitted when undefined
 *
 * @param pattern - Full ExtractedPattern from the pipeline
 * @returns Compact PatternSummary (~100 bytes JSON)
 */
export declare function summarizePattern(pattern: ExtractedPattern): PatternSummary;
/**
 * Project an array of ExtractedPatterns to compact summaries.
 *
 * @param patterns - Array of ExtractedPatterns
 * @returns Array of PatternSummary objects
 */
export declare function summarizePatterns(patterns: readonly ExtractedPattern[]): readonly PatternSummary[];
//# sourceMappingURL=summarize.d.ts.map