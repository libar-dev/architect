/**
 * @architect-bounded-context:documentation-composition
 */
import type { Fragment, ProjectionBundle } from '../../fragments/index.js';

import {
  createEntityRouteId,
  createIndexRouteId,
  type LogicalRouteId,
} from '../../routing/route-id.js';

const ARCHITECTURE_DOCUMENT_TYPE = 'architecture';

/**
 * Route id for an architecture lens child doc (e.g. `package-seam`, `layered`) —
 * resolves to `architecture/<view>.md` under the documentType's child directory.
 */
export function createArchitectureViewRouteId(view: string): LogicalRouteId {
  return createEntityRouteId(ARCHITECTURE_DOCUMENT_TYPE, view);
}

export function createArchitectureDocumentationRouting(
  childRouteKeys: readonly string[],
): NonNullable<ProjectionBundle<Fragment>['routing']> {
  return {
    rootRouteId: createIndexRouteId(ARCHITECTURE_DOCUMENT_TYPE),
    childRouteIds: Object.fromEntries(
      childRouteKeys.map((routeId) => [routeId, routeId as LogicalRouteId]),
    ),
    childPathStrategy: 'flat',
    anchorStrategy: 'heading-slug',
  };
}
