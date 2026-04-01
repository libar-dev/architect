/**
 * @architect
 * @architect-core
 * @architect-pattern PatternSummarizerImpl
 * @architect-status active
 * @architect-implements DataAPIOutputShaping
 * @architect-uses PatternGraphAPI
 * @architect-used-by OutputPipeline, PatternGraphCLIImpl
 * @architect-arch-role service
 * @architect-arch-context api
 * @architect-arch-layer application
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
 * **When to Use:** When projecting full ExtractedPattern data down to compact summaries for list and overview queries.
 */

import { z } from 'zod';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import { getPatternName } from './pattern-helpers.js';

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
  status: z.string().optional(),
  category: z.string(),
  phase: z.number().int().optional(),
  file: z.string(),
  source: z.enum(['typescript', 'gherkin']),
});

export type PatternSummary = z.infer<typeof PatternSummarySchema>;

/**
 * Valid field names for PatternSummary, used by --fields validation.
 */
export const SUMMARY_FIELDS: ReadonlySet<string> = new Set([
  'patternName',
  'status',
  'category',
  'phase',
  'file',
  'source',
]);

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Derive source type from file extension.
 */
export function deriveSource(filePath: string): 'typescript' | 'gherkin' {
  return filePath.endsWith('.feature') ? 'gherkin' : 'typescript';
}

/**
 * Project an ExtractedPattern to a compact PatternSummary.
 *
 * - `patternName` prefers explicit @architect-pattern tag, falls back to `name`
 * - `source` is derived from file extension (.feature -> gherkin, else typescript)
 * - Optional fields (status, phase) are included when present, omitted when undefined
 *
 * @param pattern - Full ExtractedPattern from the pipeline
 * @returns Compact PatternSummary (~100 bytes JSON)
 */
export function summarizePattern(pattern: ExtractedPattern): PatternSummary {
  return {
    patternName: getPatternName(pattern),
    category: pattern.category,
    file: pattern.source.file,
    source: deriveSource(pattern.source.file),
    ...(pattern.status !== undefined && { status: pattern.status }),
    ...(pattern.phase !== undefined && { phase: pattern.phase }),
  };
}

/**
 * Project an array of ExtractedPatterns to compact summaries.
 *
 * @param patterns - Array of ExtractedPatterns
 * @returns Array of PatternSummary objects
 */
export function summarizePatterns(
  patterns: readonly ExtractedPattern[]
): readonly PatternSummary[] {
  return patterns.map(summarizePattern);
}
