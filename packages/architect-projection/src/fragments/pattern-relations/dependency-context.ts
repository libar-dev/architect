/**
 * @architect
 * @architect-pattern DependencyContext
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 *
 * ### When to Use
 *
 * - Defines the `DependencyContext` fragment shape: a focal-rooted, bidirectional
 *   transitive dependency view with precomputed blast-radius counts.
 */
import { z } from 'zod';

import { DependencyContextNodeSchema } from './supporting.js';

/**
 * Focal-rooted, bidirectional transitive dependency context for one pattern.
 * `upstream` is the cycle-safe closure over the focal's prerequisites (what it
 * needs); `downstream` is the closure over its dependents (what needs it, the
 * blast radius). The focal pattern is the root of both forests, named by
 * `focal`, and never appears as a node. `summary` precomputes the direct and
 * transitive counts in each direction so a consumer can size impact without
 * re-walking. `options.maxDepth` records the depth cap that produced the view.
 *
 * @architect-shape
 */
export const DependencyContextSchema = z.strictObject({
  kind: z.literal('DependencyContext'),
  focal: z.string(),
  upstream: z.array(DependencyContextNodeSchema),
  downstream: z.array(DependencyContextNodeSchema),
  summary: z.strictObject({
    upstreamDirect: z.number().int().nonnegative(),
    upstreamTransitive: z.number().int().nonnegative(),
    downstreamDirect: z.number().int().nonnegative(),
    downstreamTransitive: z.number().int().nonnegative(),
  }),
  options: z.strictObject({
    maxDepth: z.number().int().nonnegative(),
  }),
});

export type DependencyContext = z.infer<typeof DependencyContextSchema>;
