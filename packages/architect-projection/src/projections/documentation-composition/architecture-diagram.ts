/**
 * @architect
 * @architect-pattern ArchitectureDiagramProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DocumentationCompositionProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Produces a schema-validated `ArchitectureDiagram` fragment for
 * any supported scope (component, layered, bounded-context, product-area) so
 * Studio and documentation surfaces render the same Mermaid diagram, legend,
 * and pattern list for a given scope request.
 *
 * **Invariant:** The returned fragment preserves the requested `scope`, and
 * scoped filtering by `archContext` or `productArea` is applied inside the
 * projection — bounded-context and product-area scopes require a non-empty
 * `scopeValue` and throw `MISSING_SCOPE_VALUE` otherwise.
 *
 * **Behavior:**
 * - Collects patterns from the graph, filters them by the requested scope,
 *   and assigns unique Mermaid-safe node ids.
 * - Collects `dependsOn`, `uses`, `enables`, and `seeAlso` relationships, then
 *   renders forward dependencies only: the context map aggregates one solid
 *   arrow per cross-group `depends-on`/`uses` pair, and each per-group detail
 *   diagram collapses `depends-on`/`uses` to one solid dependency arrow, drops
 *   the derived reverse `enables`, and keeps `see-also` as a dotted reference.
 * - Splits the view into a context map plus one detail diagram per group and
 *   emits a stable legend (dependency / reference) describing the arrows.
 *
 * ### When to Use
 *
 * - Projects a schema-validated ArchitectureDiagram bundle for the requested
 *   scope.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ArchitectureDiagram } from '../../fragments/documentation-composition/index.js';

import {
  ProjectArchitectureDiagramOptionsSchema,
  buildArchitectureDiagram,
  type ProjectArchitectureDiagramOptions,
} from './architecture-diagram.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { ProjectArchitectureDiagramOptionsSchema } from './architecture-diagram.internal.js';

export function projectArchitectureDiagram(
  context: ProjectionContext,
  options: ProjectArchitectureDiagramOptions,
): ProjectionBundle<ArchitectureDiagram> {
  return projectSingle(buildArchitectureDiagram(context, options));
}

export const parseAndProjectArchitectureDiagram = parseAndProject(
  ProjectArchitectureDiagramOptionsSchema,
  projectArchitectureDiagram,
  'parseAndProjectArchitectureDiagram',
);

export type { ProjectArchitectureDiagramOptions } from './architecture-diagram.internal.js';
