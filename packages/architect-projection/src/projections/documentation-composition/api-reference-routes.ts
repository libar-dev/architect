/**
 * @architect-bounded-context:documentation-composition
 */
import type { Fragment, ProjectionBundle } from '../../fragments/index.js';

import {
  createEntityRouteId,
  createIndexRouteId,
  type LogicalRouteId,
} from '../../routing/route-id.js';

const API_REFERENCE_DOCUMENT_TYPE = 'api-reference';

/**
 * Route id for an api-reference per-package child doc — resolves to
 * `api-reference/<package-slug>.md` under the documentType's child directory.
 */
export function createApiReferencePackageRouteId(packageSlug: string): LogicalRouteId {
  return createEntityRouteId(API_REFERENCE_DOCUMENT_TYPE, packageSlug);
}

export function createApiReferenceDocumentationRouting(
  childKeys: readonly string[],
): NonNullable<ProjectionBundle<Fragment>['routing']> {
  return {
    rootRouteId: createIndexRouteId(API_REFERENCE_DOCUMENT_TYPE),
    childRouteIds: Object.fromEntries(
      childKeys.map((key) => [key, createApiReferencePackageRouteId(key)]),
    ),
    childPathStrategy: 'flat',
    anchorStrategy: 'heading-slug',
  };
}
