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

import { BlockSchema, MermaidBlockSchema } from '@libar-dev/architect-core';

/**
 * Delivery progress totals for the overview — overall pattern count broken
 * down by lifecycle bucket (completed, active, planned, candidate) plus the
 * completed percentage.
 *
 * @architect-shape
 */
export const OverviewProgressSchema = z.strictObject({
  total: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
});

/**
 * One active-phase entry in the overview — the phase number, its optional
 * name, the total patterns in the phase, and how many are active.
 *
 * @architect-shape
 */
export const ActivePhaseEntrySchema = z.strictObject({
  phase: z.number().int(),
  name: z.string().optional(),
  patternCount: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
});

/**
 * One blocking entry in the overview — a blocked pattern, its status, and the
 * patterns blocking it.
 *
 * @architect-shape
 */
export const BlockingEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  blockedBy: z.array(z.string()),
});

/**
 * One entry in the generated-views index — the doc type it produces, the CLI
 * verb that generates it, and a short summary.
 *
 * @architect-shape
 */
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
 *
 * @architect-shape
 */
export const OverviewArchitectureSchema = z.strictObject({
  packageChart: MermaidBlockSchema,
  packageCount: z.number().int().nonnegative(),
  contextMap: MermaidBlockSchema.optional(),
  contextNodeCount: z.number().int().nonnegative().optional(),
  pointer: z.string(),
});

/**
 * One orientation reference in the overview's "start here" tier — a generated
 * doc the agent should read first (decisions, taxonomy, validation rules,
 * business rules, API reference), the `documentation <type>` verb that emits
 * it, and its display title. Derived from the documentation-type registry so
 * the list never drifts from the supported set.
 *
 * @architect-shape
 */
export const OrientationReferenceSchema = z.strictObject({
  docType: z.string(),
  verb: z.string(),
  title: z.string(),
});

/**
 * The overview's "start here" orientation block — the high-signal generated
 * docs to read first, a one-line note on the `--disclosure` drill-down
 * mechanic, and the count + sample of roadmap patterns whose dependencies are
 * all satisfied (the "safe to start" actionable set, the complement of
 * BLOCKING). Rendered at `summary-with-references` and `full` richness so a
 * cold-start agent is steered toward orientation + workable items rather than
 * only the BLOCKING wall.
 *
 * @architect-shape
 */
export const OverviewOrientationSchema = z.strictObject({
  references: z.array(OrientationReferenceSchema),
  disclosureHint: z.string(),
  startableCount: z.number().int().nonnegative(),
  startableSample: z.array(z.string()),
});

/**
 * One role-distribution entry — a canonical `@architect-role` value and how
 * many patterns carry it. Sourced from the precomputed graph, not re-derived.
 *
 * @architect-shape
 */
export const RoleCountSchema = z.strictObject({
  role: z.string(),
  count: z.number().int().nonnegative(),
});

/**
 * Per-tag annotation gaps — maps each tag to the list of source files missing
 * that tag.
 *
 * @architect-shape
 */
export const GapsByTagSchema = z.record(z.string(), z.array(z.string()));

/**
 * A single tag value paired with the number of patterns that carry it.
 *
 * @architect-shape
 */
export const TagValueCountSchema = z.strictObject({
  value: z.string(),
  count: z.number().int().nonnegative(),
});

/**
 * One requirement entry in a requirement digest — the owning pattern and route
 * id, its status, a rich-text description (block list), and the resolved test
 * files.
 *
 * @architect-shape
 */
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
export type OrientationReference = z.infer<typeof OrientationReferenceSchema>;
export type OverviewOrientation = z.infer<typeof OverviewOrientationSchema>;
export type RoleCount = z.infer<typeof RoleCountSchema>;
export type OverviewArchitecture = z.infer<typeof OverviewArchitectureSchema>;
export type GapsByTag = z.infer<typeof GapsByTagSchema>;
export type TagValueCount = z.infer<typeof TagValueCountSchema>;
export type RequirementEntry = z.infer<typeof RequirementEntrySchema>;
