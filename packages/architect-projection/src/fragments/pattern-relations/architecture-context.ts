/**
 * @architect
 * @architect-pattern BoundedContextFragmentContract
 * @architect-role:contract
 * @architect-status active
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const BoundedContextEntrySchema = z.strictObject({
  name: z.string(),
  patternCount: z.number().int().nonnegative(),
  patterns: z.array(z.string()),
  layers: z.array(z.string()),
  roles: z.array(z.string()),
});

export const BoundedContextSchema = z.strictObject({
  kind: z.literal('BoundedContext'),
  scope: z.string().optional(),
  entries: z.array(BoundedContextEntrySchema),
});

export type BoundedContextEntry = z.infer<typeof BoundedContextEntrySchema>;
export type BoundedContext = z.infer<typeof BoundedContextSchema>;
