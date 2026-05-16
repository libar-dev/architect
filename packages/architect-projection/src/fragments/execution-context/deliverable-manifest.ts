/**
 * @architect
 * @architect-pattern DeliverableManifest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { DeliverableSchema } from './deliverable.js';

export const DeliverableManifestSchema = z.strictObject({
  kind: z.literal('DeliverableManifest'),
  pattern: z.string(),
  items: z.array(DeliverableSchema),
});

export type DeliverableManifest = z.infer<typeof DeliverableManifestSchema>;
