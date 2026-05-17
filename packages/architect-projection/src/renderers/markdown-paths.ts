import type { MarkdownRouteProfile } from './types.js';
import { slugForFilename } from '../_internal/slug.js';
import type { BundleRouting } from '../fragments/base.js';
import type { LogicalRouteId } from '../routing/route-id.js';

export const defaultMarkdownRouteProfile: MarkdownRouteProfile = {
  mapPath(routeId, _kind, _key, routing) {
    return resolveLogicalRoutePath(routeId, routing);
  },
};

export function resolveLogicalRoutePath(
  routeId: LogicalRouteId,
  routing: BundleRouting | undefined
): string {
  const route = parseLogicalRouteId(routeId);

  if (route.kind === 'index') {
    return resolveRootMarkdownPath(route.documentType, routing);
  }

  const resolvedDirectory = routing?.markdownChildDirectory ?? route.documentType;

  if (route.kind === 'entity') {
    if (routing?.entityPathLayout === 'nested-index') {
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

function resolveRootMarkdownPath(
  documentType: string,
  routing: BundleRouting | undefined
): string {
  if (routing?.markdownRootTarget !== undefined) {
    return routing.markdownRootTarget;
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
