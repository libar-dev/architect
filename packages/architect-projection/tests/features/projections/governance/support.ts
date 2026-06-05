import type { ExtractedPattern, RelationshipEntry, TagRegistry } from '@libar-dev/architect-core';

type PatternMaturity = 'idea' | 'plan' | 'design' | 'executable';

import type { ProjectionContext, ProjectionFilter } from '../../../../src/index.js';
import { createTestPackageResolver } from '../../../support/test-package-resolver.js';
import {
  buildBusinessRuleStub,
  buildGraphFromPatterns,
  buildPatternStub,
} from '../../../support/test-graph-builder.js';

interface RuleFixture {
  readonly name: string;
  readonly description: string;
  readonly scenarioNames: readonly string[];
  readonly scenarioCount: number;
}

interface PatternFixtureOptions {
  readonly patternName?: string;
  readonly title?: string;
  readonly status?: ExtractedPattern['status'];
  readonly maturity?: PatternMaturity;
  readonly role?: ExtractedPattern['role'];
  readonly file?: string;
  readonly description?: string;
  readonly productArea?: ExtractedPattern['productArea'];
  readonly rules?: readonly RuleFixture[];
  readonly adr?: string;
  readonly adrStatus?: ExtractedPattern['adrStatus'];
  readonly adrCategory?: ExtractedPattern['adrCategory'];
  readonly adrLayer?: ExtractedPattern['adrLayer'];
  readonly adrTheme?: ExtractedPattern['adrTheme'];
  readonly adrSupersedes?: ExtractedPattern['adrSupersedes'];
  readonly adrSupersededBy?: ExtractedPattern['adrSupersededBy'];
  readonly dependsOn?: readonly string[];
  readonly uses?: ExtractedPattern['uses'];
  readonly enables?: readonly string[];
  readonly implementsPatterns?: ExtractedPattern['implementsPatterns'];
  readonly enforcesDecisions?: ExtractedPattern['enforcesDecisions'];
  readonly usedBy?: readonly string[];
  readonly seeAlso?: ExtractedPattern['seeAlso'];
  readonly apiRef?: ExtractedPattern['apiRef'];
  readonly extendsPattern?: ExtractedPattern['extendsPattern'];
  readonly extractedShapes?: ExtractedPattern['extractedShapes'];
}

interface ProjectionContextOptions {
  readonly patterns: readonly ExtractedPattern[];
  readonly tagRegistry?: TagRegistry;
  readonly projectionFilter?: ProjectionFilter;
  readonly relationshipIndex?: Record<string, RelationshipEntry>;
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

export function createRule(options: RuleFixture): RuleFixture {
  return buildBusinessRuleStub(options);
}

export function createPattern(name: string, options: PatternFixtureOptions = {}): ExtractedPattern {
  return buildPatternStub(name, {
    ...options,
    role: options.role ?? 'service',
  });
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
      tagRegistry: options.tagRegistry ?? createTagRegistry(),
      ...(options.relationshipIndex !== undefined
        ? { relationshipIndex: options.relationshipIndex }
        : {}),
    }),
    packageResolver: createTestPackageResolver(),
    ...(options.projectionFilter !== undefined
      ? { projectionFilter: options.projectionFilter }
      : {}),
  };
}
