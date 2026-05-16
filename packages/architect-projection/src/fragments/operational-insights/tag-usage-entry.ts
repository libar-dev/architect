/**
 * @architect
 * @architect-pattern TagUsageEntry
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { TagValueCountSchema } from './supporting.js';

export const TagUsageEntrySchema = z.strictObject({
  kind: z.literal('TagUsageEntry'),
  tag: z.string(),
  count: z.number().int().nonnegative(),
  values: z.array(TagValueCountSchema).nullable(),
});

export type TagUsageEntry = z.infer<typeof TagUsageEntrySchema>;
