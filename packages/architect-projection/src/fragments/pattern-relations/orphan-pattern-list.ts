/**
 * @architect
 * @architect-pattern OrphanPatternList
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `OrphanPatternList` fragment shape for patterns with no incoming or outgoing relationships.
 */
import { z } from 'zod';

/**
 * One orphan pattern entry — its name, optional status, and source file.
 *
 * @architect-shape
 */
export const OrphanPatternEntrySchema = z.strictObject({
  pattern: z.string(),
  status: z.string().optional(),
  file: z.string(),
});

/**
 * A list of patterns that have no incoming or outgoing relationships.
 *
 * @architect-shape
 */
export const OrphanPatternListSchema = z.strictObject({
  kind: z.literal('OrphanPatternList'),
  items: z.array(OrphanPatternEntrySchema),
});

export type OrphanPatternEntry = z.infer<typeof OrphanPatternEntrySchema>;
export type OrphanPatternList = z.infer<typeof OrphanPatternListSchema>;
