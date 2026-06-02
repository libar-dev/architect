/**
 * @architect
 * @architect-pattern DesignReviewProjection
 * @architect-status active
 * @architect-role:projection
 * @architect-uses ArchitectureDiagramProjection, ArchitectureDiagram
 * @architect-enforces-decision ADR006SingleReadModelArchitecture, ADR009ProjectionTrustBoundary, ADR010DocumentationCompositionHelpers
 * @architect-bounded-context:projection
 *
 * **Value:** Projects a design-review document — component diagrams over the live
 * pattern graph that, unlike the production-only `architecture` view, INCLUDE
 * not-yet-implemented working-state specs — so a planned pattern's shape is
 * reviewable before any implementation exists. Generated deterministically from
 * the graph, it cannot drift into a stale orphan the way the removed bespoke
 * design-review generator did.
 *
 * **Invariant:** Reads ONLY the PatternGraph (ADR-006 single read model, ADR-009
 * input boundary) — every node, edge, and annotation is already in the graph; no
 * scanner/extractor internals, AST, or new annotation carrier (it does not revive
 * the removed `@sequence-*` tags). Composition reuses the ADR-010 shipped
 * substrate (the architecture component builder + the shared block renderer); it
 * adds no document-authoring framework.
 *
 * **Behavior:**
 * - Reuses the `ArchitectureDiagram` fragment shape via `buildArchitectureDiagram`
 *   with `includeWorkingState: true`, so the component view spans specs under
 *   `architect/` (still excluding test features — the verification surface, not a
 *   design subject) and every status (no committed-only filter).
 * - Sets `annotateStatus: true` so every node label carries its lifecycle status
 *   (and `@architect-level` when set) beside its role — making a planned pattern
 *   visibly distinct from a shipped one, which a view that exists to review unbuilt
 *   shape must show. The production `architecture` view leaves it off and stays
 *   role-only / byte-identical.
 * - The doc-type bundle emits a working-state-inclusive component root plus
 *   `by-layer` and `by-package` lens children (each emitted only when non-empty),
 *   rendered under its own `Design Review` heading via the fragment's
 *   `presentation` override — no second fragment kind or renderer normalizer.
 * - The scoped entry (`projectDesignReview`) narrows the review to a related set
 *   (a bounded-context / product-area / layer / package scope), lifting the prior
 *   generator's single-central-pattern limit.
 *
 * ### When to Use
 *
 * - Projects the `design-review` documentation bundle (the `documentation
 *   design-review` verb and the `docs:all` generated `DESIGN-REVIEW.md`).
 * - `projectDesignReview` / `parseAndProjectDesignReview` project a scoped review
 *   for an ad-hoc related set (Studio and programmatic callers).
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { ArchitectureDiagram } from '../../fragments/documentation-composition/index.js';
import { ArchitectureDiagramScopeSchema } from '../../fragments/documentation-composition/supporting.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

import { buildArchitectureDiagram } from './architecture-diagram.internal.js';
import {
  createDesignReviewDocumentationRouting,
  createDesignReviewViewRouteId,
} from './design-review-routes.js';

/**
 * Document-presentation override applied to every design-review diagram fragment,
 * so the reused `ArchitectureDiagram` kind renders under the design-review
 * heading instead of the default `Architecture` title.
 */
const DESIGN_REVIEW_PRESENTATION = {
  title: 'Design Review',
  purpose:
    "Component diagrams over the live pattern graph — including not-yet-implemented specs — so a planned pattern's shape is reviewable before implementation.",
  detailLevel: 'Working-state-inclusive context map plus per-lens component diagrams',
} as const;

export const ProjectDesignReviewOptionsSchema = z
  .strictObject({
    scope: ArchitectureDiagramScopeSchema,
    scopeValue: z.string().optional(),
  })
  .readonly();

export type ProjectDesignReviewOptions = z.infer<typeof ProjectDesignReviewOptionsSchema>;

/**
 * Project a scoped design review (a single diagram for a related set), including
 * working-state specs. Lifts the removed generator's single-central-pattern limit
 * by accepting any architecture scope (`bounded-context` / `product-area` /
 * `layered` / `package` / `component`).
 */
export function projectDesignReview(
  context: ProjectionContext,
  options: ProjectDesignReviewOptions,
): ProjectionBundle<ArchitectureDiagram> {
  return projectSingle(
    buildArchitectureDiagram(context, {
      ...options,
      includeWorkingState: true,
      excludeTestFeatures: true,
      annotateStatus: true,
      presentation: DESIGN_REVIEW_PRESENTATION,
    }),
  );
}

/**
 * The design-review documentation tree: a working-state-inclusive component-view
 * root plus one child doc per additional lens (`by-layer`, `by-package`). A lens
 * is emitted only when it actually has patterns, so a graph with no
 * `@architect-layer` annotations does not produce an empty `design-review/by-layer.md`.
 * Reuses the generic bundle-routing machinery — the registry's
 * `childDirectory: 'design-review'` routes children to `design-review/<view>.md`.
 */
export function buildDesignReviewBundle(
  context: ProjectionContext,
): ProjectionBundle<ArchitectureDiagram> {
  const root = buildArchitectureDiagram(context, {
    scope: 'component',
    includeWorkingState: true,
    excludeTestFeatures: true,
    annotateStatus: true,
    presentation: DESIGN_REVIEW_PRESENTATION,
  });

  // `layered` and `package` carry no required scopeValue (unlike bounded-context /
  // product-area), so they fan out as whole-graph lenses cleanly. Each carries its
  // own presentation so the child doc renders under a design-review heading rather
  // than the default `Architecture` kind title.
  const lenses: readonly {
    readonly view: string;
    readonly scope: 'layered' | 'package';
    readonly title: string;
    readonly purpose: string;
  }[] = [
    {
      view: 'by-layer',
      scope: 'layered',
      title: 'Design Review — Layered Lens',
      purpose:
        'Design-review components grouped by architecture layer, including not-yet-implemented specs.',
    },
    {
      view: 'by-package',
      scope: 'package',
      title: 'Design Review — Package Lens',
      purpose:
        'Design-review components grouped by workspace package, including not-yet-implemented specs.',
    },
  ];

  const children: Record<string, ArchitectureDiagram> = {};
  for (const lens of lenses) {
    const diagram = buildArchitectureDiagram(context, {
      scope: lens.scope,
      includeWorkingState: true,
      excludeTestFeatures: true,
      annotateStatus: true,
      presentation: {
        title: lens.title,
        purpose: lens.purpose,
        detailLevel: DESIGN_REVIEW_PRESENTATION.detailLevel,
      },
    });
    if (diagram.patterns.length === 0) {
      continue;
    }
    children[createDesignReviewViewRouteId(lens.view)] = diagram;
  }

  if (Object.keys(children).length === 0) {
    return projectSingle(root);
  }

  return {
    root,
    children,
    routing: createDesignReviewDocumentationRouting(Object.keys(children)),
  };
}

export const parseAndProjectDesignReview = parseAndProject(
  ProjectDesignReviewOptionsSchema,
  projectDesignReview,
  'parseAndProjectDesignReview',
);
