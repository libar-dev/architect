/**
 * @architect
 * @architect-pattern DeliveryReportingSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines shared delivery-reporting support schemas for counts,
*   percentages, quarter entries, release entries, and trace rows.
 */
import { z } from 'zod';

import { PatternSummarySchema } from '../pattern-relations/index.js';
import { DeliverableSchema } from '../pattern-relations/supporting.js';

export const StatusCountsSchema = z.strictObject({
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const StatusPercentagesSchema = z.strictObject({
  completed: z.number().min(0).max(100),
  active: z.number().min(0).max(100),
  planned: z.number().min(0).max(100),
  candidate: z.number().min(0).max(100),
});

export const QuarterEntrySchema = z.strictObject({
  quarter: z.string(),
  patterns: z.array(PatternSummarySchema),
  counts: StatusCountsSchema,
});

export const ReleaseEntrySchema = z.strictObject({
  release: z.string(),
  date: z.string().optional(),
  patterns: z.array(PatternSummarySchema),
  deliverables: z.array(DeliverableSchema),
  notes: z.string().optional(),
});

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
