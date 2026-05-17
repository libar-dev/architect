/**
 * @architect
 * @architect-pattern OperationalInsightsSupporting
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Houses the shared operational-insights helper schemas for progress, blocking, tag gaps, tag counts, and requirement entries.
 */
import { z } from 'zod';

import { BlockSchema } from '../../blocks/schema.js';

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
export type GapsByTag = z.infer<typeof GapsByTagSchema>;
export type TagValueCount = z.infer<typeof TagValueCountSchema>;
export type RequirementEntry = z.infer<typeof RequirementEntrySchema>;
