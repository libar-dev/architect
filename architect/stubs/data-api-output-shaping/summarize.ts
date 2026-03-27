/**
 * @architect
 * @architect-status roadmap
 * @architect-implements DataAPIOutputShaping
 * @architect-uses ProcessStateAPI
 * @architect-used-by OutputPipeline, ProcessAPICLIImpl
 * @architect-target src/api/summarize.ts
 * @architect-since DS-A
 *
 * ## PatternSummarizer — Compact Pattern Projection
 *
 * Projects the full ExtractedPattern (~3.5KB per pattern) down to a
 * PatternSummary (~100 bytes) for list queries. Reduces CLI output
 * from ~594KB to ~4KB for typical codebases.
 *
 * Uses Zod schema-first pattern: PatternSummarySchema defines the type,
 * and PatternSummary is inferred from it.
 *
 * See: DataAPIOutputShaping spec, Rule 1 (Pattern Summarization)
 *
 * **When to Use:** When projecting full ExtractedPattern data down to compact summaries for list and overview queries.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

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
export const PatternSummarySchema = z.object({
  patternName: z.string(),
  status: z.enum(['roadmap', 'active', 'completed', 'deferred']).optional(),
  category: z.string(),
  phase: z.number().int().optional(),
  file: z.string(),
  source: z.enum(['typescript', 'gherkin']),
});

export type PatternSummary = z.infer<typeof PatternSummarySchema>;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Project an ExtractedPattern to a compact PatternSummary.
 *
 * - `patternName` prefers explicit @architect-pattern tag, falls back to `name`
 * - `source` is derived from file extension (`.feature` → gherkin, else typescript)
 * - Optional fields (status, phase) are included when present, omitted when undefined
 *
 * @param pattern - Full ExtractedPattern from the pipeline
 * @returns Compact PatternSummary (~100 bytes JSON)
 */
export function summarizePattern(_pattern: unknown): PatternSummary {
  throw new Error('DataAPIOutputShaping not yet implemented - roadmap pattern');
}

/**
 * Project an array of ExtractedPatterns to compact summaries.
 *
 * Convenience wrapper over summarizePattern() for list operations.
 *
 * @param patterns - Array of ExtractedPatterns
 * @returns Array of PatternSummary objects
 */
export function summarizePatterns(_patterns: readonly unknown[]): readonly PatternSummary[] {
  throw new Error('DataAPIOutputShaping not yet implemented - roadmap pattern');
}
