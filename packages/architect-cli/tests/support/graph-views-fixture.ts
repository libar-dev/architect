import {
  createDefaultTagRegistry,
  ExtractedPatternSchema,
  transformToPatternGraph,
  type AcceptedStatusValue,
  type ExtractedPattern,
} from '@libar-dev/architect-core';
import { createGraph, type Graph, type MechanicalCore } from '@libar-dev/architect-core/graph';

interface PatternSpec {
  readonly name: string;
  readonly source: string;
  readonly status: AcceptedStatusValue;
  readonly role?: string;
  readonly description?: string;
  readonly uses?: readonly string[];
  readonly implementsPatterns?: readonly string[];
  readonly scenarios?: readonly {
    readonly featureFile: string;
    readonly scenarioName: string;
    readonly semanticTags: readonly string[];
    readonly tags: readonly string[];
    readonly line: number;
  }[];
  readonly rules?: readonly {
    readonly name: string;
    readonly description: string;
    readonly scenarioNames: readonly string[];
  }[];
}

const specs: readonly PatternSpec[] = [
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
    source: 'packages/sample/tests/features/cohort.feature',
    status: 'completed',
    implementsPatterns: ['CoreView', 'UtilityView'],
    scenarios: [
      {
        featureFile: 'packages/sample/tests/features/cohort.feature',
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
    source: 'architect/specs/authored.feature',
    status: 'roadmap',
    implementsPatterns: ['CoreView', 'UtilityView'],
    scenarios: [
      {
        featureFile: 'architect/specs/authored.feature',
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

export function createCliViewsGraph(): Graph {
  const canonical = transformToPatternGraph({
    patterns: specs.map(makePattern),
    tagRegistry: createDefaultTagRegistry(),
  });
  return createGraph(canonical, createMechanicalViewsFixture());
}

export function createCurationCensusGraph(): Graph {
  const structural: PatternSpec = {
    name: 'CurationContract',
    source: 'packages/sample/src/contract.ts',
    status: 'completed',
    role: 'contract',
  };
  const canonical = transformToPatternGraph({
    patterns: [...specs.map(makePattern), makePattern(structural, specs.length)],
    tagRegistry: createDefaultTagRegistry(),
  });
  const mechanical = createMechanicalViewsFixture();
  return createGraph(canonical, {
    ...mechanical,
    symbols: [
      ...mechanical.symbols,
      {
        id: 'packages/sample/src/reader.ts#Reader',
        file: 'packages/sample/src/reader.ts',
        name: 'Reader',
        kind: 'const',
        pkg: 'sample',
      },
      {
        id: 'packages/sample/src/contract.ts#CurationContract',
        file: 'packages/sample/src/contract.ts',
        name: 'CurationContract',
        kind: 'const',
        pkg: 'sample',
      },
    ],
    edges: [
      ...mechanical.edges,
      {
        fromFile: 'packages/sample/src/reader.ts',
        toFile: 'packages/sample/src/dark.ts',
        symbol: 'DarkExport',
        kind: 'named',
        typeOnly: false,
        crossPkg: false,
      },
    ],
  });
}

export function createEmptyCensusGraph(): Graph {
  return createGraph(
    transformToPatternGraph({ patterns: [], tagRegistry: createDefaultTagRegistry() }),
    { version: '1.0.0', head: 'empty', fileCount: 0, symbols: [], edges: [], unresolved: [] },
  );
}
