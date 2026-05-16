import type { MarkdownRouteProfile } from './types.js';
import { slugForFilename } from '../_internal/slug.js';
import { getDocumentationTypeMetadata } from '../projections/documentation-composition/documentation-types.js';
import type { LogicalRouteId } from '../projections/documentation-composition/progressive-disclosure.js';

export const defaultMarkdownRouteProfile: MarkdownRouteProfile = {
  mapPath(routeId) {
    return resolveLogicalRoutePath(routeId);
  },
};

export function resolveLogicalRoutePath(routeId: LogicalRouteId): string {
  const route = parseLogicalRouteId(routeId);
  const metadata = getDocumentationTypeMetadata(route.documentType);
  const directory =
    metadata?.status === 'supported' && 'childDirectory' in metadata
      ? metadata.childDirectory
      : undefined;
  const resolvedDirectory = directory ?? route.documentType;

  if (route.kind === 'index') {
    return resolveRootMarkdownPath(route.documentType);
  }

  if (route.kind === 'entity') {
    if (route.documentType === 'requirements-executable') {
      return `${resolvedDirectory}/${slugForFilename(route.stableEntityId)}/INDEX.md`;
    }

    return resolvedDirectory.length > 0
      ? `${resolvedDirectory}/${slugForFilename(route.stableEntityId)}.md`
      : `${slugForFilename(route.stableEntityId)}.md`;
  }

  const childFileName = slugForFilename(route.stableChildId);

  return resolvedDirectory.length > 0
    ? `${resolvedDirectory}/${slugForFilename(route.stableEntityId)}/${childFileName}.md`
    : `${slugForFilename(route.stableEntityId)}/${childFileName}.md`;
}

function resolveRootMarkdownPath(documentType: string): string {
  const metadata = getDocumentationTypeMetadata(documentType);
  if (metadata?.status === 'supported') {
    return metadata.markdownRootTarget;
  }

  if (documentType === 'milestones') {
    return 'COMPLETED-MILESTONES.md';
  }

  return `${documentType.toUpperCase()}.md`;
}

function parseLogicalRouteId(routeId: LogicalRouteId):
  | { documentType: string; kind: 'index' }
  | { documentType: string; kind: 'entity'; stableEntityId: string }
  | {
      documentType: string;
      kind: 'child';
      stableEntityId: string;
      childKind: string;
      stableChildId: string;
    } {
  const parts = routeId.split(':');
  const [documentType, second, third, fourth] = parts;

  if (documentType === undefined || second === undefined) {
    throw new Error(`Invalid logical route id: ${routeId}`);
  }

  if (parts.length === 2 && second === 'index') {
    return { documentType, kind: 'index' };
  }

  if (parts.length === 2) {
    return { documentType, kind: 'entity', stableEntityId: second };
  }

  if (parts.length === 4 && third !== undefined && fourth !== undefined) {
    return {
      documentType,
      kind: 'child',
      stableEntityId: second,
      childKind: third,
      stableChildId: fourth,
    };
  }

  throw new Error(`Invalid logical route id: ${routeId}`);
}
