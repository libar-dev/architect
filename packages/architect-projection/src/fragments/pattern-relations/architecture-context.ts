/**
 * @architect
 * @architect-pattern BoundedContextFragmentContract
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 * @architect-status active
 *
 * ### When to Use
 *
 * - Defines the `BoundedContext` fragment shape for bounded-context catalogs, with per-context pattern counts, pattern lists, layers, and roles.
 */
import { z } from 'zod';

/**
 * One entry in a bounded-context catalog — the context name with its pattern
 * count, member patterns, architecture layers, and roles.
 *
 * @architect-shape
 */
export const BoundedContextEntrySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  layers: z.array(z.string()),
  roles: z.array(z.string()),
});

/**
 * A catalog of bounded contexts, optionally narrowed by `scope`, with one entry
 * per context.
 *
 * @architect-shape
 */
export const BoundedContextSchema = z.strictObject({
  kind: z.literal('BoundedContext'),
  scope: z.string().optional(),
  entries: z.array(BoundedContextEntrySchema),
});

export type BoundedContextEntry = z.infer<typeof BoundedContextEntrySchema>;
export type BoundedContext = z.infer<typeof BoundedContextSchema>;
