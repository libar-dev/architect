/**
 * @architect
 * @architect-pattern DependencyEdge
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { DependencyRelationKindSchema } from './supporting.js';

export const DependencyEdgeSchema = z.strictObject({
  kind: z.literal('DependencyEdge'),
  from: z.string(),
  to: z.string(),
  relationKind: DependencyRelationKindSchema,
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;
