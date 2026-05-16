/**
 * @architect
 * @architect-pattern RoleProfileCollection
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { RoleProfileSchema } from './role-profile.js';

export const RoleProfileCollectionSchema = z.strictObject({
  kind: z.literal('RoleProfileCollection'),
  items: z.array(RoleProfileSchema),
});

export type RoleProfileCollection = z.infer<typeof RoleProfileCollectionSchema>;
