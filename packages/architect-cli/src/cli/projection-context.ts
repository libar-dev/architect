import { createPackageResolver } from '@libar-dev/architect-core';
import type { ProjectionContext } from '@libar-dev/architect-projection';

interface CreateCliProjectionContextOptions {
  readonly graph: ProjectionContext['graph'];
  readonly packageEntries: Parameters<typeof createPackageResolver>[0];
  readonly projectionFilter?: ProjectionContext['projectionFilter'];
  readonly projectMetadata?: ProjectionContext['projectMetadata'];
  readonly tagExampleOverrides?: ProjectionContext['tagExampleOverrides'];
}

export function createCliProjectionContext({
  graph,
  packageEntries,
  projectionFilter,
  projectMetadata,
  tagExampleOverrides,
}: CreateCliProjectionContextOptions): ProjectionContext {
  return {
    graph,
    packageResolver: createPackageResolver(packageEntries),
    ...(projectionFilter !== undefined ? { projectionFilter } : {}),
    ...(projectMetadata !== undefined ? { projectMetadata } : {}),
    ...(tagExampleOverrides !== undefined ? { tagExampleOverrides } : {}),
  };
}
