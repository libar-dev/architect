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
  readonly file?: string;
  readonly description?: string;
  readonly deliverables?: ExtractedPattern['deliverables'];
  readonly rules?: ExtractedPattern['rules'];
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly targetPath?: ExtractedPattern['targetPath'];
  readonly uses?: ExtractedPattern['uses'];
  readonly usedBy?: readonly string[];
  readonly dependsOn?: readonly string[];
  readonly enables?: readonly string[];
  readonly implementsPatterns?: ExtractedPattern['implementsPatterns'];
  readonly extendsPattern?: ExtractedPattern['extendsPattern'];
  readonly seeAlso?: ExtractedPattern['seeAlso'];
  readonly apiRef?: ExtractedPattern['apiRef'];
  readonly adr?: ExtractedPattern['adr'];
  readonly boundedContext?: ExtractedPattern['boundedContext'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly archContext?: string;
  readonly archLayer?: string;
  readonly level?: ExtractedPattern['level'];
  readonly parent?: ExtractedPattern['parent'];
  readonly children?: ExtractedPattern['children'];
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
    file: options.file ?? `packages/architect-projection/fixtures/${name}.ts`,
    ...(options.patternName !== undefined ? { patternName: options.patternName } : {}),
    ...(options.status !== undefined ? { status: options.status } : {}),
    ...(options.maturity !== undefined ? { maturity: options.maturity } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.deliverables !== undefined ? { deliverables: options.deliverables } : {}),
    ...(options.rules !== undefined ? { rules: options.rules } : {}),
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
    ...(options.extendsPattern !== undefined ? { extendsPattern: options.extendsPattern } : {}),
    ...(options.seeAlso !== undefined ? { seeAlso: options.seeAlso } : {}),
    ...(options.apiRef !== undefined ? { apiRef: options.apiRef } : {}),
    ...(options.adr !== undefined ? { adr: options.adr } : {}),
    ...(options.boundedContext !== undefined ? { boundedContext: options.boundedContext } : {}),
    ...(options.adrLayer !== undefined ? { adrLayer: options.adrLayer } : {}),
    ...(options.archContext !== undefined ? { archContext: options.archContext } : {}),
    ...(options.archLayer !== undefined ? { archLayer: options.archLayer } : {}),
    ...(options.level !== undefined ? { level: options.level } : {}),
    ...(options.parent !== undefined ? { parent: options.parent } : {}),
    ...(options.children !== undefined ? { children: options.children } : {}),
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

export function createProjectionContext(options: ProjectionContextOptions): ProjectionContext {
  const graph = createPatternGraph(options);
  return { graph, packageResolver: createTestPackageResolver() };
}

function createPatternGraph(options: ProjectionContextOptions): PatternGraph {
  return buildGraphFromPatterns({
    patterns: options.patterns,
    relationshipIndex: options.relationshipIndex,
    ...(options.includeArchIndex !== undefined
      ? { includeArchIndex: options.includeArchIndex }
      : {}),
    tagRegistry: createProjectionTagRegistry({
      roles: [
        {
          tag: 'infra',
          aliases: ['infrastructure'],
          description: 'Infrastructure patterns',
          domain: 'platform',
          priority: 1,
        },
      ],
    }),
  });
}
