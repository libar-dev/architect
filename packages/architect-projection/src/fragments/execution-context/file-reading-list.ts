/**
 * @architect
 * @architect-pattern FileReadingList
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:execution-context
 *
 * Defines the `FileReadingList` fragment shape for the primary, dependency, and neighbor files used to read a pattern.
 */
import { z } from 'zod';

export const FileReadingListSchema = z.strictObject({
  kind: z.literal('FileReadingList'),
  pattern: z.string(),
  primary: z.array(z.string()),
  completedDeps: z.array(z.string()),
  roadmapDeps: z.array(z.string()),
  architectureNeighbors: z.array(z.string()),
});

export type FileReadingList = z.infer<typeof FileReadingListSchema>;
