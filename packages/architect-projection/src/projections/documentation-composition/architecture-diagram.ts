/**
 * @architect
 * @architect-pattern ArchitectureDiagramProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses DocumentationCompositionProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Produces a schema-validated `ArchitectureDiagram` fragment for
 * any supported scope (component, layered, theme, bounded-context, product-area,
 * package) so Studio and documentation surfaces render the same Mermaid diagram,
 * legend, and pattern list for a given scope request.
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
import {
  createArchitectureDocumentationRouting,
  createArchitectureViewRouteId,
} from './architecture-routes.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { ProjectArchitectureDiagramOptionsSchema } from './architecture-diagram.internal.js';

export function projectArchitectureDiagram(
  context: ProjectionContext,
  options: ProjectArchitectureDiagramOptions,
): ProjectionBundle<ArchitectureDiagram> {
  return projectSingle(buildArchitectureDiagram(context, options));
}

/**
 * The architecture documentation tree: a component-view root plus one child doc per
 * additional lens (package-seam, layered, by-theme). A lens is emitted only when it
 * actually has patterns, so a graph with no `@architect-adr-layer` / `@architect-adr-theme`
 * annotations does not produce an empty `architecture/layered.md` or `architecture/by-theme.md`.
 * Reuses the generic bundle-routing machinery — the registry's `childDirectory: 'architecture'`
 * routes children to `architecture/<view>.md`.
 */
export function buildArchitectureBundle(
  context: ProjectionContext,
): ProjectionBundle<ArchitectureDiagram> {
  const root = buildArchitectureDiagram(context, { scope: 'component' });

  const lenses: readonly {
    readonly view: string;
    readonly scope: 'package' | 'layered' | 'theme';
  }[] = [
    { view: 'package-seam', scope: 'package' },
    { view: 'layered', scope: 'layered' },
    { view: 'by-theme', scope: 'theme' },
  ];

  const children: Record<string, ArchitectureDiagram> = {};
  for (const lens of lenses) {
    const diagram = buildArchitectureDiagram(context, { scope: lens.scope });
    if (diagram.patterns.length === 0) {
      continue;
    }
    children[createArchitectureViewRouteId(lens.view)] = diagram;
  }

  if (Object.keys(children).length === 0) {
    return projectSingle(root);
  }

  return {
    root,
    children,
    routing: createArchitectureDocumentationRouting(Object.keys(children)),
  };
}

export const parseAndProjectArchitectureDiagram = parseAndProject(
  ProjectArchitectureDiagramOptionsSchema,
  projectArchitectureDiagram,
  'parseAndProjectArchitectureDiagram',
);

export type { ProjectArchitectureDiagramOptions } from './architecture-diagram.internal.js';
