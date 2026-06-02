/**
 * @architect-bounded-context:documentation-composition
 */
import type { Fragment, ProjectionBundle } from '../../fragments/index.js';

import {
  createEntityRouteId,
  createIndexRouteId,
  type LogicalRouteId,
} from '../../routing/route-id.js';

const DESIGN_REVIEW_DOCUMENT_TYPE = 'design-review';

/**
 * Route id for a design-review lens child doc (e.g. `by-layer`, `by-package`) —
 * resolves to `design-review/<view>.md` under the documentType's child directory.
 */
export function createDesignReviewViewRouteId(view: string): LogicalRouteId {
  return createEntityRouteId(DESIGN_REVIEW_DOCUMENT_TYPE, view);
}

export function createDesignReviewDocumentationRouting(
  childRouteKeys: readonly string[],
): NonNullable<ProjectionBundle<Fragment>['routing']> {
  return {
    rootRouteId: createIndexRouteId(DESIGN_REVIEW_DOCUMENT_TYPE),
    childRouteIds: Object.fromEntries(
      childRouteKeys.map((routeId) => [routeId, routeId as LogicalRouteId]),
    ),
    childPathStrategy: 'flat',
    anchorStrategy: 'heading-slug',
  };
}
