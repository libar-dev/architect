/**
 * @architect
 * @architect-pattern PhaseProgress
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const PhaseProgressSchema = z.strictObject({
  kind: z.literal('PhaseProgress'),
  phaseNumber: z.number().int(),
  phaseName: z.string().optional(),
  completed: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  candidate: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  completionPercentage: z.number().min(0).max(100),
});

export type PhaseProgress = z.infer<typeof PhaseProgressSchema>;
