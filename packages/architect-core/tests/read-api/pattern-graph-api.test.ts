import { describe, expect, it } from 'vitest';

import { createPatternGraphAPI } from '../../src/read-api/pattern-graph-api.js';
import { ExtractedPatternSchema } from '../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../src/validation-schemas/extracted-pattern.js';
import {
  PatternGraphSchema,
  type PatternGraph,
  type RelationshipEntry,
} from '../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../src/validation-schemas/tag-registry.js';

function makePattern(
  name: string,
  sourceFile: string,
  uses: readonly string[] = [],
): ExtractedPattern {
  const idByName: Record<string, string> = {
    AlphaCore: 'pattern-0000000a',
    BetaCore: 'pattern-0000000b',
  };

  return ExtractedPatternSchema.parse({
    id: idByName[name] ?? 'pattern-0000000f',
    name,
    patternName: name,
    directive: {
      tags: [`@architect-pattern:${name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: name,
    },
    code: '',
    source: { file: sourceFile, lines: [1, 1] },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    uses: [...uses],
  });
}

function buildRelationshipIndex(
  patterns: readonly ExtractedPattern[],
): Record<string, RelationshipEntry> {
  const index: Record<string, RelationshipEntry> = {};

  for (const pattern of patterns) {
    const patternName = pattern.patternName ?? pattern.name;
    const uses = [...(pattern.uses ?? [])];
    index[patternName] = {
      uses,
      usedBy: [],
      dependsOn: uses,
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

  for (const pattern of patterns) {
    const patternName = pattern.patternName ?? pattern.name;
    for (const target of pattern.uses ?? []) {
      const targetEntry = index[target];
      if (targetEntry !== undefined) {
        targetEntry.usedBy.push(patternName);
        targetEntry.enables.push(patternName);
      }
    }
  }

  return index;
}

function makeGraph(patterns: readonly ExtractedPattern[]): PatternGraph {
  return PatternGraphSchema.parse({
    patterns,
    tagRegistry: createDefaultTagRegistry(),
    byStatus: { candidate: [], roadmap: [], active: patterns, completed: [], deferred: [] },
    byNormalizedStatus: { completed: [], active: patterns, planned: [], candidate: [] },
    byMaturity: {},
    byRole: {},
    bySourceType: { typescript: patterns, gherkin: [], roadmap: [], prd: [] },
    byProductArea: {},
    counts: {
      completed: 0,
      active: patterns.length,
      planned: 0,
      candidate: 0,
      total: patterns.length,
    },
    roleCount: 0,
    relationshipIndex: buildRelationshipIndex(patterns),
  });
}

describe('createPatternGraphAPI', () => {
  it('exposes the canonical graph seam without per-read cloning', () => {
    const patterns = [
      makePattern('AlphaCore', 'packages/architect-core/src/alpha.ts', ['BetaCore']),
      makePattern('BetaCore', 'packages/architect-core/src/beta.ts'),
    ];
    const graph = makeGraph(patterns);

    const api = createPatternGraphAPI(graph);

    expect(api.getPatternGraph()).toBe(graph);
    expect(Object.isFrozen(api.getPatternGraph())).toBe(true);
    expect(api.getPatternsByStatus('active')).toBe(graph.byStatus.active);
    expect(api.getPatternsByNormalizedStatus('active')).toBe(graph.byNormalizedStatus.active);
    expect(api.getPattern('AlphaCore')).toBe(graph.patterns[0]);
  });

  it('reads reverse relationships from the canonical relationship index', () => {
    const graph = makeGraph([
      makePattern('AlphaCore', 'packages/architect-core/src/alpha.ts', ['BetaCore']),
      makePattern('BetaCore', 'packages/architect-core/src/beta.ts'),
    ]);

    const api = createPatternGraphAPI(graph);
    const relationships = api.getPatternRelationships('BetaCore');

    expect(relationships).toMatchObject({
      usedBy: ['AlphaCore'],
      enables: ['AlphaCore'],
      uses: [],
      dependsOn: [],
    });
  });
});
