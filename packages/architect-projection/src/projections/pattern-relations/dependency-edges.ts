/**
 * @architect
 * @architect-pattern DependencyEdgeProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ## Dependency edge projection
 *
 * **Value:** Gives consumers the outgoing relationships of a pattern as a
 * flat, discriminator-tagged edge set so graph views, MCP tools, and
 * renderers can display and filter dependencies without reaching into
 * PatternGraph DTOs or re-deriving relation types.
 *
 * **Invariant:** The output is always a `DependencyEdgeSet` rooted at
 * `from`, whose items are `DependencyEdge` fragments carrying explicit
 * `relationKind` values; missing relationship indices degrade to raw
 * pattern relationship arrays, and unknown pattern names fail with a
 * `PATTERN_NOT_FOUND` error plus a fuzzy suggestion.
 *
 * **Behavior:**
 * - Delegates edge collection to `projectOutgoingEdges`, which walks each
 *   outgoing relation kind from the relationship index.
 * - Maps each raw edge into the stable `{kind, from, to, relationKind}`
 *   fragment shape.
 * - Wraps the set in a `ProjectionBundle` via `projectSingle` so every
 *   projection emits the same collection root.
 *
 * ### When to Use
 *
 * - Projects the outgoing dependency edge set for one pattern as stable `DependencyEdge` rows.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { DependencyEdge, DependencyEdgeSet } from '../../fragments/pattern-relations/index.js';
import { projectOutgoingEdges } from './dependency-edges.internal.js';

export function projectDependencyEdges(
  context: ProjectionContext,
  from: string
): ProjectionBundle<DependencyEdgeSet> {
  const items: DependencyEdge[] = projectOutgoingEdges(context, from).map((edge) => ({
    kind: 'DependencyEdge',
    from: edge.from,
    to: edge.to,
    relationKind: edge.relationKind,
  }));
  return projectSingle({
    kind: 'DependencyEdgeSet',
    from,
    items,
  });
}
