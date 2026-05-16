/**
 * @architect
 * @architect-pattern DependencyTree
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { DependencyTreeNodeSchema } from './supporting.js';

export const DependencyTreeSchema = z.strictObject({
  kind: z.literal('DependencyTree'),
  root: z.string(),
  nodes: z.array(DependencyTreeNodeSchema),
  options: z.strictObject({
    maxDepth: z.number().int().nonnegative(),
    includeImplementationDeps: z.boolean(),
  }),
});

export type DependencyTree = z.infer<typeof DependencyTreeSchema>;
