/**
 * @architect
 * @architect-pattern TagUsageMatrix
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { TagUsageEntrySchema } from './tag-usage-entry.js';

export const TagUsageMatrixSchema = z.strictObject({
  kind: z.literal('TagUsageMatrix'),
  tags: z.array(TagUsageEntrySchema),
  patternCount: z.number().int().nonnegative(),
});

export type TagUsageMatrix = z.infer<typeof TagUsageMatrixSchema>;
