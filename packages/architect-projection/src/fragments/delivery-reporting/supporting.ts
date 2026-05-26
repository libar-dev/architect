/**
 * @architect
 * @architect-pattern DeliveryReportingSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-uses PatternSummary, Deliverable
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines shared delivery-reporting support schemas for counts,
 *   percentages, quarter entries, release entries, and trace rows.
 */
import { z } from 'zod';

import { PatternSummarySchema } from '../pattern-relations/index.js';
import { EmbeddedDeliverableSchema } from '../pattern-relations/supporting.js';

/**
 * Absolute pattern counts per delivery status, plus their total.
 *
 * @architect-shape
 */
export const StatusCountsSchema = z.strictObject({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/**
 * Pattern share per delivery status, each a 0-100 percentage.
 *
 * @architect-shape
 */
export const StatusPercentagesSchema = z.strictObject({
  completed: z.number().min(0).max(100),
  active: z.number().min(0).max(100),
  planned: z.number().min(0).max(100),
  candidate: z.number().min(0).max(100),
});

/**
 * One quarter of a roadmap — its label, the patterns scheduled in it, and their
 * status counts.
 *
 * @architect-shape
 */
export const QuarterEntrySchema = z.strictObject({
  quarter: z.string(),
  patterns: z.array(PatternSummarySchema),
  counts: StatusCountsSchema,
});

/**
 * One release in a notes digest — its label, optional date, member patterns,
 * deliverables, and optional free-form notes.
 *
 * @architect-shape
 */
export const ReleaseEntrySchema = z.strictObject({
  release: z.string(),
  date: z.string().optional(),
  patterns: z.array(PatternSummarySchema),
  deliverables: z.array(EmbeddedDeliverableSchema),
  notes: z.string().optional(),
});

/**
 * One row of a traceability matrix — a pattern with its optional status and the
 * tests, specs, and deliverables that trace to it.
 *
 * @architect-shape
 */
export const TraceRowSchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  tests: z.array(z.string()),
  specs: z.array(z.string()),
  deliverables: z.array(z.string()),
});

export type StatusCounts = z.infer<typeof StatusCountsSchema>;
export type StatusPercentages = z.infer<typeof StatusPercentagesSchema>;
export type QuarterEntry = z.infer<typeof QuarterEntrySchema>;
export type ReleaseEntry = z.infer<typeof ReleaseEntrySchema>;
export type TraceRow = z.infer<typeof TraceRowSchema>;
