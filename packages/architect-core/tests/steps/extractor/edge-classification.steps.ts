import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import { classifyEdgeExternality } from '../../../src/read-api/pattern-classification.js';
import type { EdgeExternality } from '../../../src/read-api/pattern-classification.js';
import * as relationshipResolver from '../../../src/generators/pipeline/relationship-resolver.js';
import { ExtractedPatternSchema } from '../../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/extracted-pattern.js';
import { PatternGraphSchema } from '../../../src/validation-schemas/pattern-graph.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature('tests/features/extractor/edge-classification.feature');

interface State {
  graph: PatternGraph | null;
  externality: EdgeExternality | null;
  externalities: EdgeExternality[];
  declaredPatternIndexBuildCount: number | null;
}

let state: State;

function makePattern(name: string, sourceFile: string): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: 'pattern-00000001',
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
  });
}

function makeGraph(patterns: ExtractedPattern[]): PatternGraph {
  const graph: PatternGraph = {
    patterns,
    tagRegistry: createDefaultTagRegistry(),
    byStatus: { candidate: [], roadmap: [], active: patterns, completed: [], deferred: [] },
    byNormalizedStatus: { completed: [], active: patterns, planned: [], candidate: [] },
    byMaturity: {},
    byPhase: [],
    byQuarter: {},
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
    phaseCount: 0,
    roleCount: 0,
    relationshipIndex: {},
    nameIndex: new Map(patterns.map((p) => [(p.patternName ?? p.name).toLowerCase(), p])),
  };

  PatternGraphSchema.parse(graph);
  return graph;
}

function findPattern(name: string): ExtractedPattern {
  const graph = state.graph!;
  const found = graph.patterns.find((p) => (p.patternName ?? p.name) === name);
  if (found === undefined) throw new Error(`Pattern not found in synthetic graph: ${name}`);
  return found;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a synthetic two-package graph with AlphaCore, BetaCore, and GammaGuard', () => {
      state = {
        graph: makeGraph([
          makePattern('AlphaCore', 'packages/architect-core/src/alpha.ts'),
          makePattern('BetaCore', 'packages/architect-core/src/beta.ts'),
          makePattern('GammaGuard', 'packages/architect-guard/src/gamma.ts'),
        ]),
        externality: null,
        externalities: [],
        declaredPatternIndexBuildCount: null,
      };
    });
  });

  Rule('Same-package targets classify as internal', ({ RuleScenario }) => {
    RuleScenario('Same-package reference is internal', ({ When, Then }) => {
      When('I classify the edge from "AlphaCore" to "BetaCore"', () => {
        state.externality = classifyEdgeExternality(
          state.graph!,
          findPattern('AlphaCore'),
          'BetaCore'
        );
      });
      Then('the edge externality equals "internal"', () => {
        expect(state.externality).toBe('internal');
      });
    });
  });

  Rule('Cross-package targets classify as external', ({ RuleScenario }) => {
    RuleScenario('Cross-package reference is external', ({ When, Then }) => {
      When('I classify the edge from "AlphaCore" to "GammaGuard"', () => {
        state.externality = classifyEdgeExternality(
          state.graph!,
          findPattern('AlphaCore'),
          'GammaGuard'
        );
      });
      Then('the edge externality equals "external"', () => {
        expect(state.externality).toBe('external');
      });
    });
  });

  Rule('Unresolved references classify as dangling', ({ RuleScenario }) => {
    RuleScenario('Unknown pattern reference is dangling', ({ When, Then }) => {
      When('I classify the edge from "AlphaCore" to "DeltaUnknown"', () => {
        state.externality = classifyEdgeExternality(
          state.graph!,
          findPattern('AlphaCore'),
          'DeltaUnknown'
        );
      });
      Then('the edge externality equals "dangling"', () => {
        expect(state.externality).toBe('dangling');
      });
    });
  });

  Rule('Declared pattern index is cached per graph', ({ RuleScenario }) => {
    RuleScenario(
      'Repeated classifications reuse the declared-pattern index',
      ({ When, Then, And }) => {
        When(
          'I classify the edges from "AlphaCore" to "BetaCore" and "GammaGuard" while tracking declared-pattern-index builds',
          () => {
            const spy = vi.spyOn(relationshipResolver, 'buildDeclaredPatternIndex');

            try {
              state.externalities = [
                classifyEdgeExternality(state.graph!, findPattern('AlphaCore'), 'BetaCore'),
                classifyEdgeExternality(state.graph!, findPattern('AlphaCore'), 'GammaGuard'),
              ];
              state.declaredPatternIndexBuildCount = spy.mock.calls.length;
            } finally {
              spy.mockRestore();
            }
          }
        );

        Then('the declared-pattern index is built {int} time', (_ctx: unknown, count: number) => {
          expect(state.declaredPatternIndexBuildCount).toBe(count);
        });

        And('the classified edges equal "internal" and "external" in order', () => {
          expect(state.externalities).toEqual(['internal', 'external']);
        });
      }
    );
  });
});
