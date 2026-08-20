/**
 * @architect
 * @architect-pattern LogicalRouteId
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:rendering
 *
 * ## LogicalRouteId - Sink-Agnostic Projection Route Vocabulary
 *
 * The logical addressing scheme for the entire projection read side: a branded
 * template-literal route id in one of three shapes — `docType:index`,
 * `docType:stableEntityId` (entity), or
 * `docType:stableEntityId:childKind:stableChildId` (child). Ships the Zod
 * schema, the `create*RouteId` constructors, and the `parse` / `is` guards that
 * validate and decompose a route id without binding to any concrete sink
 * (markdown file path, API bundle key, or Studio view-state route).
 *
 * ### When to Use
 *
 * - Constructing a route id for an index, entity, or child document.
 * - Parsing or guarding a raw string against the logical route-id grammar.
 * - Wiring bundle routing or a renderer that must address documents without
 *   depending on a single projection domain.
 */
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
  if (!segments.every(isLogicalRouteSegment)) {
    return undefined;
  }

  const [documentType, second, third, fourth] = segments;

  if (documentType === undefined) {
    return undefined;
  }

  switch (segments.length) {
    case 2:
      if (second === undefined) {
        return undefined;
      }
      if (second === 'index') {
        return { documentType, kind: 'index' };
      }
      return { documentType, kind: 'entity', stableEntityId: second };
    case 4:
      if (second === undefined || third === undefined || fourth === undefined) {
        return undefined;
      }
      return {
        documentType,
        kind: 'child',
        stableEntityId: second,
        childKind: third,
        stableChildId: fourth,
      };
    default:
      return undefined;
  }
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
