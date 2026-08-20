/**
 * @architect
 * @architect-pattern DependencyEdge
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the normalized `DependencyEdge` fragment shape for one typed relation between two patterns.
 */
import { z } from 'zod';

import { DependencyRelationKindSchema } from './supporting.js';

/**
 * One normalized directed edge between two patterns, tagged with the kind of
 * relation it represents.
 *
 * @architect-shape
 */
export const DependencyEdgeSchema = z.strictObject({
  kind: z.literal('DependencyEdge'),
  from: z.string(),
  to: z.string(),
  relationKind: DependencyRelationKindSchema,
});

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;
