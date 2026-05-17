/**
 * @architect
 * @architect-pattern DependencyEdgeSet
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `DependencyEdgeSet` fragment shape for a pattern's outgoing dependency edges.
 */
import { z } from 'zod';

import { DependencyEdgeSchema } from './dependency-edge.js';

export const DependencyEdgeSetSchema = z.strictObject({
  kind: z.literal('DependencyEdgeSet'),
  from: z.string(),
  items: z.array(DependencyEdgeSchema),
});

export type DependencyEdgeSet = z.infer<typeof DependencyEdgeSetSchema>;
