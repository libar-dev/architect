import type { AcceptedStatusValue } from '../../src/taxonomy/status-values.js';
import { ExtractedPatternSchema } from '../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../src/validation-schemas/extracted-pattern.js';
import {
  PatternGraphSchema,
  type PatternGraph,
  type RelationshipEntry,
} from '../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../src/validation-schemas/tag-registry.js';

const PATTERN_SPECS = [
  ['GraphHandle', 'completed', 'pattern-00000001'],
  ['CandidateWork', 'candidate', 'pattern-00000002'],
  ['RoadmapWork', 'roadmap', 'pattern-00000003'],
  ['ActiveWork', 'active', 'pattern-00000004'],
  ['DeferredWork', 'deferred', 'pattern-00000005'],
] as const satisfies readonly (readonly [string, AcceptedStatusValue, string])[];

function makePattern(name: string, status: AcceptedStatusValue, id: string): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id,
    name,
    patternName: name,
    role: 'service',
    directive: {
      tags: [`@architect-pattern:${name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: name,
    },
    code: '',
    source: { file: `packages/architect-core/src/${name}.ts`, lines: [1, 1] },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status,
  });
}

function emptyRelationship(): RelationshipEntry {
  return {
    uses: [],
    usedBy: [],
    dependsOn: [],
    enables: [],
    implementsPatterns: [],
    implementedBy: [],
    extendedBy: [],
    seeAlso: [],
    apiRef: [],
    enforcesDecisions: [],
    enforcedBy: [],
  };
}

export function createPatternGraphFixture(): PatternGraph {
  const patterns = PATTERN_SPECS.map(([name, status, id]) => makePattern(name, status, id));
  const byName = new Map(patterns.map((pattern) => [pattern.name, pattern]));
  const graphHandle = byName.get('GraphHandle');
  const candidate = byName.get('CandidateWork');
  const roadmap = byName.get('RoadmapWork');
  const active = byName.get('ActiveWork');
  const deferred = byName.get('DeferredWork');

  if (
    graphHandle === undefined ||
    candidate === undefined ||
    roadmap === undefined ||
    active === undefined ||
    deferred === undefined
  ) {
    throw new TypeError('Graph fixture pattern construction failed');
  }

  const graphHandleRelationship: RelationshipEntry = {
    ...emptyRelationship(),
    uses: ['DeferredWork'],
    dependsOn: ['DeferredWork'],
    implementedBy: [
      {
        name: 'CoreGraphExecutableTests',
        file: 'packages/architect-core/tests/features/graph/graph.feature',
      },
    ],
  };
  const deferredRelationship: RelationshipEntry = {
    ...emptyRelationship(),
    usedBy: ['GraphHandle'],
    enables: ['GraphHandle'],
  };

  return PatternGraphSchema.parse({
    patterns,
    tagRegistry: createDefaultTagRegistry(),
    byStatus: {
      candidate: [candidate],
      roadmap: [roadmap],
      active: [active],
      completed: [graphHandle],
      deferred: [deferred],
    },
    byNormalizedStatus: {
      completed: [graphHandle],
      active: [active],
      planned: [roadmap, deferred],
      candidate: [candidate],
    },
    byMaturity: {},
    byRole: { service: patterns },
    bySourceType: { typescript: patterns, gherkin: [], roadmap: [], prd: [] },
    byProductArea: {},
    counts: { completed: 1, active: 1, planned: 2, candidate: 1, total: 5 },
    roleCount: 1,
    relationshipIndex: {
      GraphHandle: graphHandleRelationship,
      CandidateWork: emptyRelationship(),
      RoadmapWork: emptyRelationship(),
      ActiveWork: emptyRelationship(),
      DeferredWork: deferredRelationship,
    },
  });
}

export const createMechanicalFixture = () => ({
  version: '1.0.0' as const,
  head: 'fixture-head',
  fileCount: 1,
  symbols: [
    {
      id: 'packages/architect-core/src/GraphHandle.ts#Graph',
      file: 'packages/architect-core/src/GraphHandle.ts',
      name: 'Graph',
      kind: 'class' as const,
      pkg: 'architect-core',
    },
  ],
  edges: [
    {
      fromFile: 'packages/architect-core/src/GraphHandle.ts',
      toFile: 'packages/architect-core/src/DeferredWork.ts',
      symbol: 'DeferredWork',
      kind: 'named' as const,
      typeOnly: false,
      crossPkg: false,
    },
  ],
  unresolved: [],
});
