/**
 * @architect
 * @architect-pattern StatusDistribution
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:delivery-reporting
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { StatusCountsSchema, StatusPercentagesSchema } from './supporting.js';

export const StatusDistributionSchema = z.strictObject({
  kind: z.literal('StatusDistribution'),
  counts: StatusCountsSchema,
  percentages: StatusPercentagesSchema,
});

export type StatusDistribution = z.infer<typeof StatusDistributionSchema>;
