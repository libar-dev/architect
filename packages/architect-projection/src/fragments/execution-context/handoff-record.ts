/**
 * @architect
 * @architect-pattern HandoffRecord
 * @architect-status active
 * @architect-role:contract
 * @architect-uses ExecutionContextSupporting
 * @architect-bounded-context:execution-context
 *
 * Defines the `HandoffRecord` fragment shape for one pattern's session handoff summary.
 */
import { z } from 'zod';

import { HandoffSessionTypeSchema } from './supporting.js';

/**
 * Fragment shape for one pattern's session handoff summary — what was
 * completed and in progress, the files modified, discoveries, blockers, and
 * the recommended next session.
 *
 * @architect-shape
 */
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
