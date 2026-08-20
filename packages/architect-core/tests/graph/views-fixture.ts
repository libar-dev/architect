import type { AcceptedStatusValue } from '../../src/taxonomy/status-values.js';
import { transformToPatternGraph } from '../../src/generators/pipeline/transform-dataset.js';
import {
  ExtractedPatternSchema,
  type ExtractedPattern,
} from '../../src/validation-schemas/extracted-pattern.js';
import {
  PatternGraphSchema,
  type PatternGraph,
} from '../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../src/validation-schemas/tag-registry.js';
import type { MechanicalCore } from '../../src/graph/schema.js';

interface PatternSpec {
  readonly name: string;
  readonly source: string;
  readonly status: AcceptedStatusValue;
  readonly role?: string;
  readonly description?: string;
  readonly uses?: readonly string[];
  readonly implementsPatterns?: readonly string[];
  readonly scenarios?: readonly ScenarioSpec[];
  readonly rules?: readonly RuleSpec[];
}

interface ScenarioSpec {
  readonly featureFile: string;
  readonly scenarioName: string;
  readonly semanticTags: readonly string[];
  readonly tags: readonly string[];
  readonly line: number;
}

interface RuleSpec {
  readonly name: string;
  readonly description: string;
  readonly scenarioNames: readonly string[];
}

const FEATURE_FILES = [
  'architect/specs/authored.feature',
  'packages/sample/tests/features/cohort.feature',
] as const;

const PATTERNS: readonly PatternSpec[] = [
  {
    name: 'CoreView',
    source: 'packages/sample/src/core-view.ts',
    status: 'completed',
    role: 'service',
    description: 'query graph architecture',
    uses: ['UtilityView', 'AuthoredSpecs'],
  },
  {
    name: 'UtilityView',
    source: 'packages/sample/src/utility-view.ts',
    status: 'active',
    role: 'utility',
    description: 'query graph architecture',
  },
  {
    name: 'ExecutableSpecs',
    source: FEATURE_FILES[1],
    status: 'completed',
    implementsPatterns: ['CoreView', 'UtilityView'],
    scenarios: [
      {
        featureFile: FEATURE_FILES[1],
        scenarioName: 'Executable scenario',
        semanticTags: ['happy-path'],
        tags: ['rule:shared-rule'],
        line: 21,
      },
    ],
    rules: [
      {
        name: 'Shared rule',
        description: '**Invariant:** Executable behavior stays stable.\n**Verified by:** scenario',
        scenarioNames: ['Executable scenario'],
      },
    ],
  },
  {
    name: 'AuthoredSpecs',
    source: FEATURE_FILES[0],
    status: 'roadmap',
    implementsPatterns: ['CoreView', 'UtilityView'],
    scenarios: [
      {
        featureFile: FEATURE_FILES[0],
        scenarioName: 'Authored scenario',
        semanticTags: ['validation'],
        tags: ['rule:planned-rule'],
        line: 31,
      },
    ],
    rules: [
      {
        name: 'Planned rule',
        description: '**Invariant:** Authored behavior stays explicit.',
        scenarioNames: ['Authored scenario'],
      },
    ],
  },
];

function makePattern(spec: PatternSpec, index: number): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: `pattern-${index.toString(16).padStart(8, '0')}`,
    name: spec.name,
    patternName: spec.name,
    role: spec.role,
    directive: {
      tags: [`@architect-pattern:${spec.name}`],
      description: spec.description ?? '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: spec.name,
    },
    code: '',
    source: { file: spec.source, lines: [1, 1] },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: spec.status,
    productArea: 'DataAPI',
    whenToUse: ['query architecture'],
    ...(spec.uses === undefined ? {} : { uses: [...spec.uses] }),
    ...(spec.implementsPatterns === undefined
      ? {}
      : { implementsPatterns: [...spec.implementsPatterns] }),
    ...(spec.scenarios === undefined
      ? {}
      : {
          scenarios: spec.scenarios.map((scenario) => ({
            ...scenario,
            featureName: spec.name,
            featureDescription: '',
          })),
        }),
    ...(spec.rules === undefined
      ? {}
      : {
          rules: spec.rules.map((rule) => ({
            ...rule,
            scenarioCount: rule.scenarioNames.length,
          })),
        }),
  });
}

export function createPatternGraphViewsFixture(): PatternGraph {
  return transformToPatternGraph({
    patterns: PATTERNS.map(makePattern),
    tagRegistry: createDefaultTagRegistry(),
  });
}

export function createMechanicalViewsFixture(): MechanicalCore {
  const symbols = [
    ['CoreView', 'packages/sample/src/core-view.ts', 'sample'],
    ['SharedExport', 'packages/sample/src/core-view.ts', 'sample'],
    ['SharedExport', 'packages/sample/src/utility-view.ts', 'sample'],
    ['DarkExport', 'packages/sample/src/dark.ts', 'sample'],
    ['EmptyBarrel', 'packages/empty/src/index.ts', 'empty'],
  ] as const;
  const edges = [
    ['packages/sample/src/core-view.ts', 'packages/sample/src/utility-view.ts', 'UtilityView'],
    ['packages/sample/src/utility-view.ts', 'packages/sample/src/core-view.ts', 'SharedExport'],
    ['packages/sample/src/dark.ts', 'packages/sample/src/core-view.ts', 'SharedExport'],
    ['packages/sample/src/consumer.ts', 'packages/sample/src/dark.ts', 'DarkExport'],
    ['packages/sample/src/core-view.ts', 'packages/sample/src/dark.ts', 'DarkExport'],
    ['packages/sample/src/utility-view.ts', 'packages/sample/src/dark.ts', 'DarkExport'],
    ['packages/sample/src/a.ts', 'packages/sample/src/index.ts', null],
    ['packages/sample/src/b.ts', 'packages/sample/src/index.ts', null],
  ] as const;
  return {
    version: '1.0.0',
    head: 'fixture-head',
    fileCount: 10,
    symbols: symbols.map(([name, file, pkg], index) => ({
      id: `${file}#${name}-${index}`,
      file,
      name,
      kind: 'const',
      pkg,
    })),
    edges: edges.map(([fromFile, toFile, symbol]) => ({
      fromFile,
      toFile,
      symbol,
      kind: symbol === null ? 'namespace' : 'named',
      typeOnly: false,
      crossPkg: false,
    })),
    unresolved: [],
  };
}

export function createDanglingPatternGraphFixture(): PatternGraph {
  const graph = createPatternGraphViewsFixture();
  const relationship = graph.relationshipIndex['CoreView'];
  if (relationship === undefined) {
    throw new TypeError('CoreView relationship fixture is missing');
  }
  return PatternGraphSchema.parse({
    ...graph,
    relationshipIndex: {
      ...graph.relationshipIndex,
      CoreView: { ...relationship, uses: [...relationship.uses, 'MissingPattern'] },
    },
  });
}

export function createEmptyPatternGraphFixture(): PatternGraph {
  return transformToPatternGraph({ patterns: [], tagRegistry: createDefaultTagRegistry() });
}

export function createEmptyMechanicalFixture(): MechanicalCore {
  return { version: '1.0.0', head: 'empty', fileCount: 0, symbols: [], edges: [], unresolved: [] };
}

export { FEATURE_FILES };
