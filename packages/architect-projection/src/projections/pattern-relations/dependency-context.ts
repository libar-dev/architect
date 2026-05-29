/**
 * @architect
 * @architect-pattern DependencyContextProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts, DependencyContext
 * @architect-bounded-context:projection
 *
 * ## Dependency context projection
 *
 * **Value:** Gives consumers a single focal-rooted, bidirectional dependency
 * view for any pattern: `upstream` (what the focal needs, its prerequisites)
 * and `downstream` (what needs the focal, its blast radius), each expanded
 * transitively with a precomputed summary. The consumer never specifies a
 * direction and never reasons about graph internals, so UI trees, MCP tools,
 * and docs read both directions without re-implementing the walk.
 *
 * **Invariant:** The output is always a `DependencyContext` with `{focal,
 * upstream, downstream, summary, options}`; the focal pattern is the root of
 * both forests and never appears as a node; traversal honours `maxDepth` by
 * stopping recursion and setting `truncated: true` on a node that still has
 * unexpanded edges in its direction; cycles never recurse; a pattern with no
 * relationship entry yields empty `upstream`/`downstream` with a zeroed summary
 * and the focal name set.
 *
 * **Behavior:**
 * - Validates options through `DepContextOptionsSchema` (pattern, maxDepth) and
 *   delegates to `buildDependencyContext`, which calls the kernel's cycle-safe
 *   transitive-closure accessor `getDependencyContext` (ADR-006) and maps the
 *   result to the fragment.
 * - Folds the implementation edges into the same closures (uses → upstream,
 *   enables → downstream): there is no implementation-deps knob to push graph
 *   internals onto the consumer.
 * - Exposes `parseAndProjectDependencyContext` for callers that receive raw
 *   option payloads.
 *
 * ### When to Use
 *
 * - Projects a focal-rooted bidirectional dependency context with bounded depth
 *   and cycle protection.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { DependencyContext } from '../../fragments/pattern-relations/index.js';
import {
  DepContextOptionsSchema,
  buildDependencyContext,
  type DepContextOptions,
} from './dependency-context.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { DepContextOptionsSchema } from './dependency-context.internal.js';
export type { DepContextOptions } from './dependency-context.internal.js';

export function projectDependencyContext(
  context: ProjectionContext,
  options: DepContextOptions,
): ProjectionBundle<DependencyContext> {
  const payload = buildDependencyContext(context, options);

  return projectSingle({
    kind: 'DependencyContext',
    focal: payload.focal,
    upstream: payload.upstream,
    downstream: payload.downstream,
    summary: payload.summary,
    options: payload.options,
  });
}

export const parseAndProjectDependencyContext = parseAndProject(
  DepContextOptionsSchema,
  projectDependencyContext,
  'parseAndProjectDependencyContext',
);
