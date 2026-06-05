import {
  PatternGraphSchema,
  createPackageResolver,
  type TagRegistry,
} from '@libar-dev/architect-core';
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

export function createCliTaxonomyProjectionContext(tagRegistry: TagRegistry): ProjectionContext {
  const graph: ProjectionContext['graph'] = {
    patterns: [],
    tagRegistry: { ...tagRegistry, $schema: tagRegistry.$schema ?? '' },
    byStatus: { candidate: [], roadmap: [], active: [], completed: [], deferred: [] },
    byNormalizedStatus: { completed: [], active: [], planned: [], candidate: [] },
    byMaturity: {},
    byRole: {},
    bySourceType: { typescript: [], gherkin: [], roadmap: [], prd: [] },
    byProductArea: {},
    counts: { completed: 0, active: 0, planned: 0, candidate: 0, total: 0 },
    roleCount: 0,
    relationshipIndex: {},
  };

  PatternGraphSchema.parse(graph);

  return createCliProjectionContext({ graph, packageEntries: [] });
}
