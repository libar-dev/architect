/**
 * @architect
 * @architect-pattern StatusDistribution
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - Defines the StatusDistribution fragment shape for status counts and
 *   percentages.
 */
import { z } from 'zod';

import { StatusCountsSchema, StatusPercentagesSchema } from './supporting.js';

/**
 * Pattern status breakdown — absolute counts paired with their percentages.
 *
 * @architect-shape
 */
export const StatusDistributionSchema = z.strictObject({
  kind: z.literal('StatusDistribution'),
  counts: StatusCountsSchema,
  percentages: StatusPercentagesSchema,
});

export type StatusDistribution = z.infer<typeof StatusDistributionSchema>;
