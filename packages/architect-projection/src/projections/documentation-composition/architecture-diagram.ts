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
 * - Builds directed edges from `dependsOn`, `uses`, `enables`, and `seeAlso`
 *   relationships with distinct arrow operators per label.
 * - Groups nodes into Mermaid subgraphs by context/layer/product-area and
 *   emits a stable legend describing the arrow semantics.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
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
  options: ProjectArchitectureDiagramOptions
): ProjectionBundle<ArchitectureDiagram> {
  return projectSingle(buildArchitectureDiagram(context, options));
}

export const parseAndProjectArchitectureDiagram = parseAndProject(
  ProjectArchitectureDiagramOptionsSchema,
  projectArchitectureDiagram,
  'parseAndProjectArchitectureDiagram'
);

export type { ProjectArchitectureDiagramOptions } from './architecture-diagram.internal.js';
