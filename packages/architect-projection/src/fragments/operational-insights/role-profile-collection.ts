/**
 * @architect
 * @architect-pattern RoleProfileCollection
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * Defines the `RoleProfileCollection` fragment shape for the ordered catalog of role profiles.
 */
import { z } from 'zod';

import { RoleProfileSchema } from './role-profile.js';

/**
 * Fragment shape wrapping the ordered catalog of role profiles.
 *
 * @architect-shape
 */
export const RoleProfileCollectionSchema = z.strictObject({
  kind: z.literal('RoleProfileCollection'),
  items: z.array(RoleProfileSchema),
});

export type RoleProfileCollection = z.infer<typeof RoleProfileCollectionSchema>;
