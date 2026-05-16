/**
 * @architect-bounded-context:documentation-composition
 */
import type { Fragment, ProjectionBundle } from '../../fragments/index.js';

import { slugForRouteSegment } from '../../_internal/slug.js';
import {
  createIndexRouteId,
  createChildRouteId,
  createEntityRouteId,
  type LogicalRouteId,
} from './progressive-disclosure.js';

export type RequirementDocumentationBucket = 'executable' | 'specs';

const REQUIREMENT_DOCUMENT_TYPES = {
  executable: 'requirements-executable',
  specs: 'requirements-specs',
} as const satisfies Record<RequirementDocumentationBucket, string>;

export function createRequirementDetailRouteId(
  bucket: RequirementDocumentationBucket,
  patternName: string
): LogicalRouteId {
  return createEntityRouteId(getRequirementDocumentType(bucket), slugForRouteSegment(patternName));
}

export function createRequirementPackageIndexRouteId(
  bucket: RequirementDocumentationBucket,
  packageId: string
): LogicalRouteId {
  return createEntityRouteId(getRequirementDocumentType(bucket), slugForRouteSegment(packageId));
}

export function createRequirementPackageDetailRouteId(
  bucket: RequirementDocumentationBucket,
  packageId: string,
  patternName: string
): LogicalRouteId {
  return createChildRouteId(
    getRequirementDocumentType(bucket),
    slugForRouteSegment(packageId),
    'requirement',
    slugForRouteSegment(patternName)
  );
}

export function createRequirementBusinessRuleRouteId(
  bucket: RequirementDocumentationBucket,
  requirementEntityId: string,
  ruleId: string
): LogicalRouteId {
  return createChildRouteId(
    getRequirementDocumentType(bucket),
    slugForRouteSegment(requirementEntityId),
    'business-rule',
    slugForRouteSegment(ruleId)
  );
}

export function createBusinessRuleOwnerRouteId(packageId: string): LogicalRouteId {
  return createEntityRouteId('business-rules', slugForRouteSegment(packageId));
}

export function createRequirementDocumentationRouting(
  bucket: RequirementDocumentationBucket,
  childRouteKeys: readonly string[]
): NonNullable<ProjectionBundle<Fragment>['routing']> {
  return {
    rootRouteId: createIndexRouteId(getRequirementDocumentType(bucket)),
    childRouteIds: Object.fromEntries(
      childRouteKeys.map((routeId) => [routeId, routeId as LogicalRouteId])
    ),
    childPathStrategy: 'nested',
    anchorStrategy: 'heading-slug',
  };
}

function getRequirementDocumentType(bucket: RequirementDocumentationBucket): string {
  return REQUIREMENT_DOCUMENT_TYPES[bucket];
}
