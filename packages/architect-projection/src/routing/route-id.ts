/**
 * Logical route-id vocabulary — structured identifiers for documentation routing.
 * Format: docType:index | docType:stableEntityId | docType:stableEntityId:childKind:stableChildId.
 * Promoted here from documentation-composition/progressive-disclosure.ts so
 * routing-concerned code (fragments/base.ts BundleRouting, renderers) doesn't
 * import from one projection domain (was finding F5/F18 in the review).
 */
import { z } from 'zod';

export type LogicalRouteId =
  | `${string}:index`
  | `${string}:${string}`
  | `${string}:${string}:${string}:${string}`;

const ROUTE_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export const LogicalRouteSegmentSchema = z.string().regex(ROUTE_SEGMENT_PATTERN);
export const LogicalRouteIdSchema = z.string().refine(isLogicalRouteId, {
  message:
    'Logical route IDs must be docType:index, docType:stableEntityId, or docType:stableEntityId:childKind:stableChildId.',
});

export function createIndexRouteId(documentType: string): `${string}:index` {
  return `${assertLogicalRouteSegment(documentType, 'documentType')}:index`;
}

export function createEntityRouteId(
  documentType: string,
  stableEntityId: string
): `${string}:${string}` {
  return `${assertLogicalRouteSegment(documentType, 'documentType')}:${assertLogicalRouteSegment(
    stableEntityId,
    'stableEntityId'
  )}`;
}

export function createChildRouteId(
  documentType: string,
  stableEntityId: string,
  childKind: string,
  stableChildId: string
): `${string}:${string}:${string}:${string}` {
  return `${assertLogicalRouteSegment(documentType, 'documentType')}:${assertLogicalRouteSegment(
    stableEntityId,
    'stableEntityId'
  )}:${assertLogicalRouteSegment(childKind, 'childKind')}:${assertLogicalRouteSegment(
    stableChildId,
    'stableChildId'
  )}`;
}

export function isLogicalRouteId(value: string): value is LogicalRouteId {
  const segments = value.split(':');

  if (segments.length === 2 && segments[1] === 'index') {
    return isLogicalRouteSegment(segments[0]);
  }

  if (segments.length === 2) {
    return segments.every(isLogicalRouteSegment);
  }

  if (segments.length === 4) {
    return segments.every(isLogicalRouteSegment);
  }

  return false;
}

function assertLogicalRouteSegment(value: string, label: string): string {
  if (isLogicalRouteSegment(value)) {
    return value;
  }

  throw new Error(
    `${label} must contain only letters, numbers, underscores, and hyphens, and must start with a letter or number.`
  );
}

function isLogicalRouteSegment(value: string | undefined): value is string {
  return value !== undefined && ROUTE_SEGMENT_PATTERN.test(value);
}
