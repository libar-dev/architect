import { transformToPatternGraph } from '../../src/generators/pipeline/transform-dataset.js';
import type { RawDataset } from '../../src/generators/pipeline/transform-types.js';
import { createPackageResolver } from '../../src/package/package-resolver.js';
import { ExtractedPatternSchema } from '../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../src/validation-schemas/extracted-pattern.js';
import type { PatternGraph } from '../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../src/validation-schemas/tag-registry.js';

interface PatternSpec {
  readonly name: string;
  readonly status: string;
  readonly sourceFile?: string;
  readonly uses?: readonly string[];
  readonly seeAlso?: readonly string[];
  readonly apiRef?: readonly string[];
  readonly implementsPatterns?: readonly string[];
  readonly enforcesDecisions?: readonly string[];
  readonly adr?: string;
  readonly rules?: readonly string[];
}

function patternId(name: string): string {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `pattern-${hash.toString(16).padStart(8, '0').slice(0, 8)}`;
}

function makePattern(spec: PatternSpec): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: patternId(spec.name),
    name: spec.name,
    patternName: spec.name,
    directive: {
      tags: [`@architect-pattern:${spec.name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: spec.name,
    },
    code: '',
    source: {
      file: spec.sourceFile ?? `packages/architect-core/src/${spec.name.toLowerCase()}.ts`,
      lines: [1, 1],
    },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: spec.status,
    ...(spec.uses !== undefined ? { uses: [...spec.uses] } : {}),
    ...(spec.seeAlso !== undefined ? { seeAlso: [...spec.seeAlso] } : {}),
    ...(spec.apiRef !== undefined ? { apiRef: [...spec.apiRef] } : {}),
    ...(spec.implementsPatterns !== undefined
      ? { implementsPatterns: [...spec.implementsPatterns] }
      : {}),
    ...(spec.enforcesDecisions !== undefined
      ? { enforcesDecisions: [...spec.enforcesDecisions] }
      : {}),
    ...(spec.adr !== undefined ? { adr: spec.adr } : {}),
    ...(spec.rules !== undefined
      ? {
          rules: spec.rules.map((name) => ({
            name,
            description: '',
            scenarioCount: 0,
            scenarioNames: [],
          })),
        }
      : {}),
  });
}

const PATTERNS: readonly PatternSpec[] = [
  {
    name: 'AlphaCore',
    status: 'completed',
    uses: ['BetaCore'],
    seeAlso: ['BetaCore'],
    apiRef: ['AlphaCore.run'],
  },
  { name: 'BetaCore', status: 'completed' },
  { name: 'Leaf', status: 'active', uses: ['Mid'] },
  { name: 'Mid', status: 'roadmap', uses: ['Root'] },
  { name: 'Root', status: 'deferred' },
  { name: 'WidgetService', status: 'active' },
  {
    name: 'WidgetFeature',
    status: 'completed',
    sourceFile: 'packages/architect-core/tests/features/widget.feature',
    implementsPatterns: ['WidgetService'],
    rules: ['Widgets stay frozen'],
  },
  { name: 'ADR099Example', status: 'candidate', adr: '099' },
  {
    name: 'GuardRail',
    status: 'active',
    enforcesDecisions: ['ADR099Example'],
    rules: ['Boundary is strict'],
  },
  {
    name: 'CliEntry',
    status: 'completed',
    sourceFile: 'packages/architect-cli/src/cli-entry.ts',
  },
];

export function createReadKernelGraph(): PatternGraph {
  const raw: RawDataset = {
    patterns: PATTERNS.map(makePattern),
    tagRegistry: createDefaultTagRegistry(),
  };
  const resolver = createPackageResolver([
    {
      id: 'architect-core',
      displayName: 'Architect Core',
      match: 'packages/architect-core/',
    },
    {
      id: 'architect-cli',
      displayName: 'Architect CLI',
      match: 'packages/architect-cli/',
    },
  ]);
  return transformToPatternGraph(raw, resolver);
}
