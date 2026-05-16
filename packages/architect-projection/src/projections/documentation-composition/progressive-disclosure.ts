/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

export const PROGRESSIVE_DISCLOSURE_LEVELS = [
  'essential',
  'important',
  'useful',
  'advanced',
] as const;

export const ProgressiveDisclosureLevelSchema = z.enum(PROGRESSIVE_DISCLOSURE_LEVELS);
export type ProgressiveDisclosureLevel = z.infer<typeof ProgressiveDisclosureLevelSchema>;

export const ProgressiveDisclosurePolicySchema = z.strictObject({
  level: ProgressiveDisclosureLevelSchema,
  availability: z.enum(['always', 'nearby', 'available', 'reference']),
  purpose: z.string().min(1),
});

export type ProgressiveDisclosurePolicy = z.infer<typeof ProgressiveDisclosurePolicySchema>;

export const PROGRESSIVE_DISCLOSURE_POLICY = [
  {
    level: 'essential',
    availability: 'always',
    purpose: 'Root summaries and orientation needed before any drill-down.',
  },
  {
    level: 'important',
    availability: 'nearby',
    purpose: 'Primary details reachable from the same bundle.',
  },
  {
    level: 'useful',
    availability: 'available',
    purpose: 'Secondary or nested detail available through explicit routes.',
  },
  {
    level: 'advanced',
    availability: 'reference',
    purpose: 'Deep reference material intentionally separated from the primary path.',
  },
] as const satisfies readonly ProgressiveDisclosurePolicy[];

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
