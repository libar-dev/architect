/**
 * @architect
 * @architect-pattern OpenQuestionList
 * @architect-status completed
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 */
import { z } from 'zod';

const OpenQuestionEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  file: z.string(),
  questions: z.array(z.string()).min(1),
});

export const OpenQuestionListSchema = z.strictObject({
  kind: z.literal('OpenQuestionList'),
  filters: z.strictObject({
    parent: z.string().optional(),
  }),
  count: z.number().int(),
  items: z.array(OpenQuestionEntrySchema),
});

export type OpenQuestionList = z.infer<typeof OpenQuestionListSchema>;
