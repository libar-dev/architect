import type { ExtractedPattern, PatternGraph, RelationshipEntry } from '@libar-dev/architect-core';
import { buildGraphFromPatterns, buildPatternStub } from '../../../support/test-graph-builder.js';

import type { ProjectionContext, ProjectionFilter } from '../../../../src/index.js';
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
  readonly executableSpecs?: ExtractedPattern['executableSpecs'];
  readonly behaviorFile?: ExtractedPattern['behaviorFile'];
  readonly behaviorFileVerified?: boolean;
}

interface ProjectionContextOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly projectionFilter?: ProjectionFilter;
  readonly relationshipIndex?: Record<string, RelationshipEntry>;
}

let _nextPatternId = 1;

export function createPattern(name: string, options: PatternFixtureOptions = {}): ExtractedPattern {
  const isGherkin = options.file?.endsWith('.feature') ?? false;
  const pattern = buildPatternStub(name, {
    ...options,
    maturity: options.maturity ?? 'design',
    role: options.role ?? 'service',
    file:
      options.file ??
      (isGherkin
        ? `architect/specs/${name.toLowerCase()}.feature`
        : `packages/architect-projection/fixtures/${name}.ts`),
  });
  _nextPatternId += 1;
  return {
    ...pattern,
    ...(options.behaviorFileVerified !== undefined
      ? { behaviorFileVerified: options.behaviorFileVerified }
      : {}),
  } as ExtractedPattern;
}

export function createProjectionContext(options: ProjectionContextOptions): ProjectionContext {
  return {
    graph: createPatternGraph(options),
    packageResolver: createTestPackageResolver(),
    ...(options.projectionFilter !== undefined
      ? { projectionFilter: options.projectionFilter }
      : {}),
  };
}

function createPatternGraph(options: ProjectionContextOptions): PatternGraph {
  return buildGraphFromPatterns({
    patterns: options.patterns,
    ...(options.relationshipIndex !== undefined
      ? { relationshipIndex: options.relationshipIndex }
      : {}),
    tagRegistry: {
      ...createProjectionTagRegistry(),
    },
  });
}

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
