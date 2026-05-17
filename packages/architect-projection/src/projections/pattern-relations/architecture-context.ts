/**
 * @architect
 * @architect-pattern BoundedContextProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, BoundedContextFragmentContract
 * @architect-bounded-context:projection
 *
 * ## Bounded context projection
 *
 * **Value:** Gives consumers a catalog of bounded contexts in the graph —
 * each with pattern count, pattern list, covered layers, and covered roles
 * — so architecture navigation, dashboards, and docs can render a map of
 * the system's contexts without walking the graph by hand.
 *
 * **Invariant:** The output always carries an `entries` array of
 * `BoundedContextEntry` rows whose `patternCount` matches the length
 * of `patterns`; an optional `scope` filter narrows the catalog to a single
 * context while keeping the same shape.
 *
 * **Behavior:**
 * - Delegates assembly to `buildBoundedContext`, which reads from the
 *   `ProjectionContext` and the graph's architecture index.
 * - Wraps the fragment in a `ProjectionBundle` via `projectSingle`.
 * - Honours an optional `scope` argument to produce a single-entry catalog
 *   for the matching bounded context.
 *
 * ### When to Use
 *
 * - Projects the bounded-context catalog bundle that powers context lists and summaries.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { BoundedContext } from '../../fragments/pattern-relations/index.js';

import { buildBoundedContext } from './architecture-context.internal.js';

export function projectBoundedContext(
  context: ProjectionContext,
  scope?: string
): ProjectionBundle<BoundedContext> {
  return projectSingle(buildBoundedContext(context, scope));
}
