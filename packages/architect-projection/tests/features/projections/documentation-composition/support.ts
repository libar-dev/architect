import type {
  ExtractedPattern,
  RelationshipEntry,
  ProjectMetadata,
  TagRegistry,
} from '@libar-dev/architect-core';

type PatternMaturity = 'idea' | 'plan' | 'design' | 'executable';

import type { ProjectionContext } from '../../../../src/index.js';
import type { ProjectionFilter } from '../../../../src/projections/_shared/filter.js';
import { createTestPackageResolver } from '../../../support/test-package-resolver.js';
import { buildGraphFromPatterns, buildPatternStub } from '../../../support/test-graph-builder.js';

interface RuleFixture {
  readonly name: string;
  readonly description: string;
  readonly scenarioNames: readonly string[];
  readonly scenarioCount: number;
}

interface PatternFixtureOptions {
  readonly patternName?: string;
  readonly status?: ExtractedPattern['status'];
  readonly maturity?: PatternMaturity;
  readonly role?: ExtractedPattern['role'];
  readonly phase?: ExtractedPattern['phase'];
  readonly quarter?: ExtractedPattern['quarter'];
  readonly release?: ExtractedPattern['release'];
  readonly completed?: ExtractedPattern['completed'];
  readonly file?: string;
  readonly description?: string;
  readonly boundedContext?: ExtractedPattern['boundedContext'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly adrTheme?: ExtractedPattern['adrTheme'];
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly archTheme?: string;
  readonly productArea?: ExtractedPattern['productArea'];
  readonly userRole?: ExtractedPattern['userRole'];
  readonly businessValue?: ExtractedPattern['businessValue'];
  readonly deliverables?: ExtractedPattern['deliverables'];
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly targetPath?: ExtractedPattern['targetPath'];
  readonly dependsOn?: readonly string[];
  readonly uses?: ExtractedPattern['uses'];
  readonly usedBy?: readonly string[];
  readonly enables?: readonly string[];
  readonly implementsPatterns?: ExtractedPattern['implementsPatterns'];
  readonly rules?: readonly RuleFixture[];
  readonly adr?: ExtractedPattern['adr'];
}

interface ProjectionContextOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly phaseNames?: Record<number, string>;
  readonly relationshipIndex?: Record<string, RelationshipEntry>;
  readonly tagRegistry?: TagRegistry;
  readonly projectMetadata?: ProjectMetadata;
  readonly projectionFilter?: ProjectionFilter;
}

export function createPattern(name: string, options: PatternFixtureOptions = {}): ExtractedPattern {
  return buildPatternStub(name, options);
}

export function createRelationshipEntry(
  overrides: Partial<RelationshipEntry> = {},
): RelationshipEntry {
  return {
    uses: overrides.uses ?? [],
    usedBy: overrides.usedBy ?? [],
    dependsOn: overrides.dependsOn ?? [],
    enables: overrides.enables ?? [],
    implementsPatterns: overrides.implementsPatterns ?? [],
    implementedBy: overrides.implementedBy ?? [],
    ...(overrides.extendsPattern !== undefined ? { extendsPattern: overrides.extendsPattern } : {}),
    extendedBy: overrides.extendedBy ?? [],
    seeAlso: overrides.seeAlso ?? [],
    apiRef: overrides.apiRef ?? [],
    enforcesDecisions: overrides.enforcesDecisions ?? [],
    enforcedBy: overrides.enforcedBy ?? [],
  };
}

export function createTagRegistry(overrides: Partial<TagRegistry> = {}): TagRegistry {
  return {
    version: '1.0.0',
    roles: overrides.roles ?? [],
    metadataTags: overrides.metadataTags ?? [],
    aggregationTags: overrides.aggregationTags ?? [],
    formatOptions: overrides.formatOptions ?? ['full', 'list', 'summary'],
    tagPrefix: overrides.tagPrefix ?? '@architect-',
    fileOptInTag: overrides.fileOptInTag ?? '@architect',
    ...(overrides.$schema !== undefined ? { $schema: overrides.$schema } : {}),
  };
}

export function createProjectionContext(options: ProjectionContextOptions): ProjectionContext {
  return {
    graph: buildGraphFromPatterns({
      patterns: options.patterns,
      phaseNames: options.phaseNames,
      relationshipIndex: options.relationshipIndex,
      tagRegistry: options.tagRegistry ?? createTagRegistry(),
    }),
    packageResolver: createTestPackageResolver(),
    ...(options.projectMetadata !== undefined ? { projectMetadata: options.projectMetadata } : {}),
    ...(options.projectionFilter !== undefined
      ? { projectionFilter: options.projectionFilter }
      : {}),
  };
}
