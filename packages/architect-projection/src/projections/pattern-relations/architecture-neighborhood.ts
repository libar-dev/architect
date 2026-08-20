/**
 * @architect
 * @architect-pattern ArchitectureNeighborhoodProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts, ArchitectureNeighborhood
 * @architect-bounded-context:projection
 *
 * ## Architecture neighborhood projection
 *
 * **Value:** Gives a consumer the full architectural vicinity of a single
 * pattern — what it uses, what uses it, what it depends on, what it enables,
 * which peers share its bounded context, and which concrete symbols implement
 * it — in one stable, schema-validated bundle.
 *
 * **Invariant:** The output always carries every relationship direction as a
 * named array (`uses`, `usedBy`, `dependsOn`, `enables`, `sameContext`,
 * `implements`, `implementedBy`), even when empty. Implementation references
 * are returned as structured `ImplementationRef` objects, never raw graph
 * DTOs. Missing relationship or architecture indices degrade gracefully
 * (empty arrays), not errors.
 *
 * **Behavior:**
 * - Resolves the pattern by canonical name and throws
 *   `PATTERN_NOT_FOUND` (with a fuzzy suggestion) if it is unknown.
 * - Populates `sameContext` from the graph's architecture index, excluding
 *   the pattern itself; returns `[]` when either the pattern has no
 *   `archContext` or the graph lacks an `archIndex`.
 * - Normalizes every `implementedBy` reference through
 *   `normalizeImplementationRef` to keep the fragment shape stable across
 *   core version bumps.
 *
 * ### When to Use
 *
 * - Projects a single pattern's architectural neighborhood bundle, including relationship directions, same-context peers, and implementation refs.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ArchitectureNeighborhood } from '../../fragments/pattern-relations/index.js';
import { buildArchitectureNeighborhood } from './architecture-neighborhood.internal.js';

export function projectArchitectureNeighborhood(
  context: ProjectionContext,
  pattern: string,
): ProjectionBundle<ArchitectureNeighborhood> {
  return projectSingle({
    kind: 'ArchitectureNeighborhood',
    ...buildArchitectureNeighborhood(context, pattern),
  });
}
