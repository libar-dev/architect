import type {
  ExtractedPattern,
  PackageResolver,
  PatternGraph,
  RelationshipEntry,
  TagRegistry,
} from '@libar-dev/architect-core';
import {
  isPatternActive as _isPatternActive,
  isPatternComplete as _isPatternComplete,
  isPatternPlanned as _isPatternPlanned,
} from '@libar-dev/architect-core';
import { buildGraphFromPatterns, buildPatternStub } from '../../../support/test-graph-builder.js';

import type { ProjectionContext } from '../../../../src/index.js';
import { createTestPackageResolver } from '../../../support/test-package-resolver.js';

type PatternMaturity = 'idea' | 'plan' | 'design' | 'executable';

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
  readonly file?: string;
  readonly description?: string;
  readonly boundedContext?: ExtractedPattern['boundedContext'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly dependsOn?: readonly string[];
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly productArea?: ExtractedPattern['productArea'];
  readonly userRole?: ExtractedPattern['userRole'];
  readonly businessValue?: ExtractedPattern['businessValue'];
  readonly adr?: ExtractedPattern['adr'];
  readonly team?: ExtractedPattern['team'];
  readonly effort?: ExtractedPattern['effort'];
  readonly priority?: ExtractedPattern['priority'];
  readonly rules?: readonly RuleFixture[];
}

interface ProjectionContextOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly relationshipIndex?: Record<string, RelationshipEntry>;
  readonly tagRegistry?: TagRegistry;
  readonly packageResolver?: PackageResolver;
}

let _nextPatternId = 1;

export function createPattern(name: string, options: PatternFixtureOptions = {}): ExtractedPattern {
  const pattern = buildPatternStub(name, {
    file: options.file ?? `packages/architect-projection/fixtures/${name}.ts`,
    ...(options.patternName !== undefined ? { patternName: options.patternName } : {}),
    ...(options.status !== undefined ? { status: options.status } : {}),
    ...(options.maturity !== undefined ? { maturity: options.maturity } : {}),
    ...(options.role !== undefined ? { role: options.role } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.boundedContext !== undefined ? { boundedContext: options.boundedContext } : {}),
    ...(options.adrLayer !== undefined ? { adrLayer: options.adrLayer } : {}),
    ...(options.archContext !== undefined ? { archContext: options.archContext } : {}),
    ...(options.archLayer !== undefined ? { archLayer: options.archLayer } : {}),
    ...(options.dependsOn !== undefined ? { dependsOn: options.dependsOn } : {}),
    ...(options.executableSpecs !== undefined ? { executableSpecs: options.executableSpecs } : {}),
    ...(options.behaviorFile !== undefined ? { behaviorFile: options.behaviorFile } : {}),
    ...(options.productArea !== undefined ? { productArea: options.productArea } : {}),
    ...(options.userRole !== undefined ? { userRole: options.userRole } : {}),
    ...(options.businessValue !== undefined ? { businessValue: options.businessValue } : {}),
    ...(options.adr !== undefined ? { adr: options.adr } : {}),
    ...(options.team !== undefined ? { team: options.team } : {}),
    ...(options.effort !== undefined ? { effort: options.effort } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
    ...(options.rules !== undefined ? { rules: options.rules } : {}),
  });
  _nextPatternId += 1;
  return pattern;
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
    graph: createPatternGraph(options),
    packageResolver: options.packageResolver ?? createTestPackageResolver(),
  };
}

function createPatternGraph(options: ProjectionContextOptions): PatternGraph {
  return buildGraphFromPatterns({
    patterns: options.patterns,
    relationshipIndex: options.relationshipIndex,
    tagRegistry: options.tagRegistry ?? createTagRegistry(),
  });
}
