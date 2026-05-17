/**
 * @architect
 * @architect-pattern SourceInventoryDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `SourceInventoryDigest` fragment shape for grouped source-file inventory summaries.
 */
import { z } from 'zod';

import { SourceInventoryEntrySchema } from './source-inventory-entry.js';

export const SourceInventoryDigestSchema = z.strictObject({
  kind: z.literal('SourceInventoryDigest'),
  items: z.array(SourceInventoryEntrySchema),
});

export type SourceInventoryDigest = z.infer<typeof SourceInventoryDigestSchema>;
