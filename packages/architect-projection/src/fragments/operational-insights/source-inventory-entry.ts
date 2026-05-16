/**
 * @architect
 * @architect-pattern SourceInventoryEntry
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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
