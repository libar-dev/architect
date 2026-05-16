/**
 * @architect
 * @architect-pattern OrphanPatternList
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const OrphanPatternEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  file: z.string(),
});

export const OrphanPatternListSchema = z.strictObject({
  kind: z.literal('OrphanPatternList'),
  items: z.array(OrphanPatternEntrySchema),
});

export type OrphanPatternEntry = z.infer<typeof OrphanPatternEntrySchema>;
export type OrphanPatternList = z.infer<typeof OrphanPatternListSchema>;
