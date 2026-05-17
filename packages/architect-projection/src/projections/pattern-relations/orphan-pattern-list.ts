/**
 * @architect
 * @architect-pattern OrphanPatternListProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ## Orphan pattern list projection
 *
 * **Value:** Surfaces patterns that have zero relationships in any
 * direction, so reviewers, docs, and dashboards can flag unused or
 * disconnected patterns that are candidates for cleanup or missing
 * integration.
 *
 * **Invariant:** The output always carries an `items` array of
 * `OrphanPatternEntry` rows; an entry appears only when the pattern has no
 * incoming and no outgoing relationships across every relation kind.
 *
 * **Behavior:**
 * - Delegates computation to `buildOrphanPatternList`, which scans the
 *   graph's patterns against the relationship index.
 * - Wraps the fragment in a `ProjectionBundle` via `projectSingle`.
 * - Emits `items: []` when every pattern is connected.
 *
 * ### When to Use
 *
 * - Projects the list of disconnected patterns with no incoming or outgoing relationships.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { OrphanPatternList } from '../../fragments/pattern-relations/index.js';

import { buildOrphanPatternList } from './orphan-pattern-list.internal.js';

export function projectOrphanPatternList(
  context: ProjectionContext
): ProjectionBundle<OrphanPatternList> {
  return projectSingle(buildOrphanPatternList(context));
}
