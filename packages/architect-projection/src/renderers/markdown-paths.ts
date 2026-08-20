/**
 * @architect
 * @architect-pattern MarkdownRouteProfile
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:rendering
 * @architect-uses LogicalRouteId, EmissionDescriptor
 *
 * ## MarkdownRouteProfile - Logical Route to On-Disk Markdown Path Resolver
 *
 * The default resolver that turns a sink-agnostic `LogicalRouteId` into the
 * file-sink's on-disk markdown layout. `defaultMarkdownRouteProfile` adapts the
 * route profile interface to `resolveLogicalRoutePath`, which parses the route
 * id and emits the index / entity / child markdown path, honoring the
 * `EmissionDescriptor`-derived `MarkdownFileRoute` overrides (root target,
 * child directory, nested-index layout). The precise boundary where logical
 * routing becomes the markdown directory tree.
 *
 * ### When to Use
 *
 * - Mapping a `LogicalRouteId` to the markdown file path the renderer writes.
 * - Resolving the default on-disk layout for an index, entity, or child route.
 * - Applying `MarkdownFileRoute` overrides from an emission descriptor to the
 *   computed path.
 */
import type { MarkdownRouteProfile } from './types.js';
import { slugForFilename } from '../_internal/slug.js';
import type { MarkdownFileRoute } from '../fragments/emission-descriptor.js';
import { parseLogicalRouteId, type LogicalRouteId } from '../routing/route-id.js';

export const defaultMarkdownRouteProfile: MarkdownRouteProfile = {
  mapPath(routeId, _kind, _key, markdownRoute) {
    return resolveLogicalRoutePath(routeId, markdownRoute);
  },
};

export function resolveLogicalRoutePath(
  routeId: LogicalRouteId,
  markdownRoute: MarkdownFileRoute | undefined,
): string {
  const route = parseLogicalRouteId(routeId);

  if (route.kind === 'index') {
    return resolveRootMarkdownPath(route.documentType, markdownRoute);
  }

  const resolvedDirectory = markdownRoute?.childDirectory ?? route.documentType;

  if (route.kind === 'entity') {
    if (markdownRoute?.entityPathLayout === 'nested-index') {
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
  markdownRoute: MarkdownFileRoute | undefined,
): string {
  if (markdownRoute?.rootTarget !== undefined) {
    return markdownRoute.rootTarget;
  }

  return `${documentType.toUpperCase()}.md`;
}
