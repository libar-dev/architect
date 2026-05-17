/**
 * @architect
 * @architect-pattern SourceInventoryEntry
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `SourceInventoryEntry` fragment shape for one source-file category, count, and file list.
 */
import { z } from 'zod';

export const SourceInventoryEntrySchema = z.strictObject({
  kind: z.literal('SourceInventoryEntry'),
  type: z.string(),
  count: z.number().int().nonnegative(),
  locationPattern: z.string().optional(),
  files: z.array(z.string()),
});

export type SourceInventoryEntry = z.infer<typeof SourceInventoryEntrySchema>;
