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

type ParsedLogicalRouteId =
  | { documentType: string; kind: 'index' }
  | { documentType: string; kind: 'entity'; stableEntityId: string }
  | {
      documentType: string;
      kind: 'child';
      stableEntityId: string;
      childKind: string;
      stableChildId: string;
    };

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
  stableEntityId: string,
): `${string}:${string}` {
  return `${assertLogicalRouteSegment(documentType, 'documentType')}:${assertLogicalRouteSegment(
    stableEntityId,
    'stableEntityId',
  )}`;
}

export function createChildRouteId(
  documentType: string,
  stableEntityId: string,
  childKind: string,
  stableChildId: string,
): `${string}:${string}:${string}:${string}` {
  return `${assertLogicalRouteSegment(documentType, 'documentType')}:${assertLogicalRouteSegment(
    stableEntityId,
    'stableEntityId',
  )}:${assertLogicalRouteSegment(childKind, 'childKind')}:${assertLogicalRouteSegment(
    stableChildId,
    'stableChildId',
  )}`;
}

export function parseLogicalRouteId(value: string): ParsedLogicalRouteId {
  const parsed = tryParseLogicalRouteId(value);

  if (parsed !== undefined) {
    return parsed;
  }

  throw new Error(`Invalid logical route id: ${value}`);
}

export function isLogicalRouteId(value: string): value is LogicalRouteId {
  return tryParseLogicalRouteId(value) !== undefined;
}

function tryParseLogicalRouteId(value: string): ParsedLogicalRouteId | undefined {
  const segments = value.split(':');
  const [documentType, second, third, fourth] = segments;

  if (documentType === undefined || second === undefined) {
    return undefined;
  }

  if (segments.length === 2 && second === 'index') {
    return isLogicalRouteSegment(documentType) ? { documentType, kind: 'index' } : undefined;
  }

  if (segments.length === 2) {
    return isLogicalRouteSegment(documentType) && isLogicalRouteSegment(second)
      ? { documentType, kind: 'entity', stableEntityId: second }
      : undefined;
  }

  if (segments.length === 4 && third !== undefined && fourth !== undefined) {
    return isLogicalRouteSegment(documentType) &&
      isLogicalRouteSegment(second) &&
      isLogicalRouteSegment(third) &&
      isLogicalRouteSegment(fourth)
      ? {
          documentType,
          kind: 'child',
          stableEntityId: second,
          childKind: third,
          stableChildId: fourth,
        }
      : undefined;
  }

  return undefined;
}

function assertLogicalRouteSegment(value: string, label: string): string {
  if (isLogicalRouteSegment(value)) {
    return value;
  }

  throw new Error(
    `${label} must contain only letters, numbers, underscores, and hyphens, and must start with a letter or number.`,
  );
}

function isLogicalRouteSegment(value: string | undefined): value is string {
  return value !== undefined && ROUTE_SEGMENT_PATTERN.test(value);
}
