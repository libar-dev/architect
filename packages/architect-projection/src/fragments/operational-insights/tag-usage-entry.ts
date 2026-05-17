/**
 * @architect
 * @architect-pattern TagUsageEntry
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `TagUsageEntry` fragment shape for one metadata tag and its counted values.
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
