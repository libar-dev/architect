/**
 * @architect
 * @architect-pattern OperationalInsightsSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 * @architect-uses BlockSchema
 *
 * Houses the shared operational-insights helper schemas for progress, blocking, tag gaps, tag counts, and requirement entries.
 */
import { z } from 'zod';

import { BlockSchema, MermaidBlockSchema } from '../../blocks/schema.js';

export const OverviewProgressSchema = z.strictObject({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const ActivePhaseEntrySchema = z.strictObject({
  phase: z.number().int(),
  name: z.string().optional(),
  patternCount: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
});

export const BlockingEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  blockedBy: z.array(z.string()),
});

export const GeneratedViewEntrySchema = z.strictObject({
  docType: z.string(),
  verb: z.string(),
  summary: z.string(),
});

/**
 * The high-level architecture glimpse rendered in `overview`. `packageChart` is
 * a coarse package-level context map shown at every non-`name-only` disclosure;
 * `contextMap` is the richer bounded-context map (identical grouping to
 * `docs-live/ARCHITECTURE.md`) shown only at `full`. Both are pre-rendered
 * Mermaid (built at projection time, per ADR-005 codec/renderer separation — the
 * renderer cannot reach the grouping machinery behind the renderer boundary).
 * `pointer` is a one-line "explore via the API, not grep" hint.
 */
export const OverviewArchitectureSchema = z.strictObject({
  packageChart: MermaidBlockSchema,
  packageCount: z.number().int().nonnegative(),
  contextMap: MermaidBlockSchema.optional(),
  contextNodeCount: z.number().int().nonnegative().optional(),
  pointer: z.string(),
});

export const GapsByTagSchema = z.record(z.string(), z.array(z.string()));

export const TagValueCountSchema = z.strictObject({
  value: z.string(),
  count: z.number().int().nonnegative(),
});

export const RequirementEntrySchema = z.strictObject({
  pattern: z.string(),
  ownerRouteId: z.string().min(1),
  status: z.string().optional(),
  description: z.array(BlockSchema),
  testFiles: z.array(z.string()),
});

export type OverviewProgress = z.infer<typeof OverviewProgressSchema>;
export type ActivePhaseEntry = z.infer<typeof ActivePhaseEntrySchema>;
export type BlockingEntry = z.infer<typeof BlockingEntrySchema>;
export type OverviewArchitecture = z.infer<typeof OverviewArchitectureSchema>;
export type GapsByTag = z.infer<typeof GapsByTagSchema>;
export type TagValueCount = z.infer<typeof TagValueCountSchema>;
export type RequirementEntry = z.infer<typeof RequirementEntrySchema>;
