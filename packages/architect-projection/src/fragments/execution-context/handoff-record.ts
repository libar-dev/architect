/**
 * @architect
 * @architect-pattern HandoffRecord
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { HandoffSessionTypeSchema } from './supporting.js';

export const HandoffRecordSchema = z.strictObject({
  kind: z.literal('HandoffRecord'),
  pattern: z.string(),
  status: z.string().optional(),
  sessionType: HandoffSessionTypeSchema,
  completed: z.array(z.string()),
  inProgress: z.array(z.string()),
  filesModified: z.array(z.string()),
  discovered: z.array(z.string()),
  blockers: z.array(z.string()),
  nextSession: z.string(),
});

export type HandoffRecord = z.infer<typeof HandoffRecordSchema>;
