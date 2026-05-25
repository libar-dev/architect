/**
 * @architect
 * @architect-pattern DecisionRecord
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 * @architect-uses BlockSchema
 *
 * ### When to Use
 *
 * - Defines the `DecisionRecord` fragment shape for one ADR/PDR/DDR/TDR record with structured context, decision, consequences, and related pattern links.
 */
import { z } from 'zod';

import { BlockSchema } from '../../blocks/schema.js';
import { DecisionStatusSchema, DecisionTypeSchema } from './supporting.js';

export const DecisionRecordSchema = z.strictObject({
  kind: z.literal('DecisionRecord'),
  id: z.string(),
  type: DecisionTypeSchema,
  status: DecisionStatusSchema,
  title: z.string(),
  context: z.array(BlockSchema),
  decision: z.array(BlockSchema),
  consequences: z.array(BlockSchema),
  alternatives: z.array(BlockSchema).optional(),
  relatedDecisions: z.array(z.string()),
  affectedPatterns: z.array(z.string()),
});

export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;
