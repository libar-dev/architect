/**
 * @architect
 * @architect-pattern SourceInventoryDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { SourceInventoryEntrySchema } from './source-inventory-entry.js';

export const SourceInventoryDigestSchema = z.strictObject({
  kind: z.literal('SourceInventoryDigest'),
  items: z.array(SourceInventoryEntrySchema),
});

export type SourceInventoryDigest = z.infer<typeof SourceInventoryDigestSchema>;
