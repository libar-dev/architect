/**
 * @architect
 * @architect-pattern TagUsageMatrix
 * @architect-status active
 * @architect-role:contract
 * @architect-uses TagUsageEntry
 * @architect-bounded-context:operational-insights
 *
 * Defines the `TagUsageMatrix` fragment shape for tag usage counts across the pattern graph.
 */
import { z } from 'zod';

import { TagUsageEntrySchema } from './tag-usage-entry.js';

export const TagUsageMatrixSchema = z.strictObject({
  kind: z.literal('TagUsageMatrix'),
  tags: z.array(TagUsageEntrySchema),
  patternCount: z.number().int().nonnegative(),
});

export type TagUsageMatrix = z.infer<typeof TagUsageMatrixSchema>;
