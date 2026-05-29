import type { ExtractedPattern, PatternGraph, RelationshipEntry } from '@libar-dev/architect-core';
import { buildGraphFromPatterns, buildPatternStub } from '../../../support/test-graph-builder.js';

import type { ProjectionContext } from '../../../../src/index.js';
import { createTestPackageResolver } from '../../../support/test-package-resolver.js';
import { createProjectionTagRegistry } from '../support.js';

type PatternMaturity = 'idea' | 'plan' | 'design' | 'executable';

interface PatternFixtureOptions {
  readonly patternName?: string;
  readonly status?: ExtractedPattern['status'];
  readonly maturity?: PatternMaturity;
  readonly role?: ExtractedPattern['role'];
  readonly phase?: ExtractedPattern['phase'];
  readonly file?: string;
  readonly description?: string;
  readonly deliverables?: ExtractedPattern['deliverables'];
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly targetPath?: ExtractedPattern['targetPath'];
  readonly uses?: ExtractedPattern['uses'];
  readonly usedBy?: readonly string[];
  readonly dependsOn?: readonly string[];
  readonly enables?: readonly string[];
  readonly implementsPatterns?: ExtractedPattern['implementsPatterns'];
  readonly boundedContext?: ExtractedPattern['boundedContext'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly discoveredGaps?: ExtractedPattern['discoveredGaps'];
  readonly discoveredImprovements?: ExtractedPattern['discoveredImprovements'];
  readonly discoveredLearnings?: ExtractedPattern['discoveredLearnings'];
}

interface ProjectionContextOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly relationshipIndex?: Record<string, RelationshipEntry>;
  readonly includeArchIndex?: boolean;
}

let _nextPatternId = 1;

export function createPattern(name: string, options: PatternFixtureOptions = {}): ExtractedPattern {
  const pattern = buildPatternStub(name, {
    role: options.role ?? 'service',
    phase: options.phase ?? 49,
    file: options.file ?? `packages/architect-projection/fixtures/${name}.ts`,
    ...(options.patternName !== undefined ? { patternName: options.patternName } : {}),
    ...(options.status !== undefined ? { status: options.status } : {}),
    ...(options.maturity !== undefined ? { maturity: options.maturity } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.deliverables !== undefined ? { deliverables: options.deliverables } : {}),
    ...(options.executableSpecs !== undefined ? { executableSpecs: options.executableSpecs } : {}),
    ...(options.behaviorFile !== undefined ? { behaviorFile: options.behaviorFile } : {}),
    ...(options.targetPath !== undefined ? { targetPath: options.targetPath } : {}),
    ...(options.uses !== undefined ? { uses: options.uses } : {}),
    ...(options.usedBy !== undefined ? { usedBy: options.usedBy } : {}),
    ...(options.dependsOn !== undefined ? { dependsOn: options.dependsOn } : {}),
    ...(options.enables !== undefined ? { enables: options.enables } : {}),
    ...(options.implementsPatterns !== undefined
      ? { implementsPatterns: options.implementsPatterns }
      : {}),
    ...(options.boundedContext !== undefined ? { boundedContext: options.boundedContext } : {}),
    ...(options.adrLayer !== undefined ? { adrLayer: options.adrLayer } : {}),
    ...(options.archContext !== undefined ? { archContext: options.archContext } : {}),
    ...(options.archLayer !== undefined ? { archLayer: options.archLayer } : {}),
  });
  _nextPatternId += 1;
  return {
    ...pattern,
    ...(options.discoveredGaps !== undefined ? { discoveredGaps: options.discoveredGaps } : {}),
    ...(options.discoveredImprovements !== undefined
      ? { discoveredImprovements: options.discoveredImprovements }
      : {}),
    ...(options.discoveredLearnings !== undefined
      ? { discoveredLearnings: options.discoveredLearnings }
      : {}),
  } as ExtractedPattern;
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

export function createProjectionContext(options: ProjectionContextOptions): ProjectionContext {
  return {
    graph: createPatternGraph(options),
    packageResolver: createTestPackageResolver(),
  };
}

function createPatternGraph(options: ProjectionContextOptions): PatternGraph {
  return buildGraphFromPatterns({
    patterns: options.patterns,
    relationshipIndex: options.relationshipIndex,
    ...(options.includeArchIndex !== undefined
      ? { includeArchIndex: options.includeArchIndex }
      : {}),
    tagRegistry: createProjectionTagRegistry(),
  });
}
