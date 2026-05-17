/**
 * @architect
 * @architect-pattern DecisionCatalog
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - Defines the `DecisionCatalog` fragment shape that collects normalized decision records for a governance surface.
 */
import { z } from 'zod';

import { DecisionRecordSchema } from './decision-record.js';

export const DecisionCatalogSchema = z.strictObject({
  kind: z.literal('DecisionCatalog'),
  decisions: z.array(DecisionRecordSchema),
});

export type DecisionCatalog = z.infer<typeof DecisionCatalogSchema>;
