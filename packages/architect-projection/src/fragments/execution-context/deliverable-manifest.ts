/**
 * @architect
 * @architect-pattern DeliverableManifest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the canonical `DeliverableManifest` fragment shape for one pattern's ordered deliverables.
 */
import { z } from 'zod';

import { DeliverableSchema } from './deliverable.js';

/**
 * Fragment shape for one pattern's ordered list of deliverables. Carries the
 * fragment `kind` discriminator, the owning pattern name, and the deliverable
 * items in declaration order.
 *
 * @architect-shape
 */
export const DeliverableManifestSchema = z.strictObject({
  kind: z.literal('DeliverableManifest'),
  pattern: z.string(),
  items: z.array(DeliverableSchema),
});

export type DeliverableManifest = z.infer<typeof DeliverableManifestSchema>;
