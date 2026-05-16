/**
 * @architect
 * @architect-pattern RoleProfile
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const RoleProfileSchema = z.strictObject({
  kind: z.literal('RoleProfile'),
  tag: z.string(),
  domain: z.string(),
  priority: z.number().int().optional(),
  count: z.number().int().nonnegative(),
  description: z.string().optional(),
  examples: z.array(z.string()),
});

export type RoleProfile = z.infer<typeof RoleProfileSchema>;
