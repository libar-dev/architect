/**
 * @architect
 * @architect-pattern ArchitectureComparisonProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses PatternRelationsProjectionSupport, PatternRelationsFragmentContracts
 * @architect-bounded-context:projection
 *
 * ## Architecture comparison projection
 *
 * **Value:** Compares two bounded contexts side-by-side — summaries of their
 * patterns, shared dependencies, unique dependencies, and cross-context
 * integration points — so consumers can reason about boundary coupling
 * without walking raw graph DTOs.
 *
 * **Invariant:** The output always carries both context summaries,
 * `sharedDependencies`, `uniqueToContext1`, `uniqueToContext2`, and
 * `integrationPoints` arrays in a stable shape; integration relationships
 * are limited to `uses` and `dependsOn`.
 *
 * **Behavior:**
 * - Delegates assembly to `buildArchitectureComparison` against the
 *   `ProjectionContext` for the two named contexts.
 * - Wraps the fragment in a `ProjectionBundle` via `projectSingle` so every
 *   projection emits the same collection root.
 * - Leaves empty arrays explicit when contexts share nothing or have no
 *   cross-context integration edges.
 *
 * ### When to Use
 *
 * - Projects a side-by-side bounded-context comparison bundle from the pattern-relations fragment helpers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ArchitectureComparison } from '../../fragments/pattern-relations/index.js';

import { buildArchitectureComparison } from './architecture-comparison.internal.js';

export function projectArchitectureComparison(
  context: ProjectionContext,
  leftContext: string,
  rightContext: string,
): ProjectionBundle<ArchitectureComparison> {
  return projectSingle(buildArchitectureComparison(context, leftContext, rightContext));
}
