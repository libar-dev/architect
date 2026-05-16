import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { computeNeighborhood } from '../../../src/read-api/architecture-inspection.js';
import { createPatternGraphAPI } from '../../../src/read-api/pattern-graph-api.js';
import { getRelationshipsForPattern } from '../../../src/read-api/pattern-helpers.js';
import type { PatternDependencies, PatternRelationships } from '../../../src/read-api/types.js';
import { ExtractedPatternSchema } from '../../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/extracted-pattern.js';
import {
  PatternGraphSchema,
  type PatternGraph,
  type RelationshipEntry,
} from '../../../src/validation-schemas/pattern-graph.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature('tests/features/read-api/pattern-graph-api.feature');

interface State {
  graph: PatternGraph | null;
  relationships: PatternRelationships | null;
  dependencies: PatternDependencies | null;
  neighborhoodUsedBy: readonly string[] | null;
  neighborhoodEnables: readonly string[] | null;
  foreignPattern: ExtractedPattern | null;
  invariantError: string | null;
}

let state: State;

function makePatternId(name: string): string {
  if (name === 'AlphaCore') return 'pattern-0000000a';
  if (name === 'BetaCore') return 'pattern-0000000b';
  return 'pattern-0000000f';
}

function makePattern(
  name: string,
  sourceFile: string,
  uses: readonly string[] = []
): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: makePatternId(name),
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

function makeGraph(
  patterns: ExtractedPattern[],
  relationshipIndex?: Record<string, RelationshipEntry>
): PatternGraph {
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
    ...(relationshipIndex !== undefined ? { relationshipIndex } : {}),
  };

  PatternGraphSchema.parse(graph);
  return graph;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a synthetic graph where "AlphaCore" uses "BetaCore"', () => {
      state = {
        graph: makeGraph([
          makePattern('AlphaCore', 'packages/architect-core/src/alpha.ts', ['BetaCore']),
          makePattern('BetaCore', 'packages/architect-core/src/beta.ts'),
        ]),
        relationships: null,
        dependencies: null,
        neighborhoodUsedBy: null,
        neighborhoodEnables: null,
        foreignPattern: null,
        invariantError: null,
      };
    });
  });

  Rule('Missing relationship index still resolves reverse lookups', ({ RuleScenario }) => {
    RuleScenario(
      'Reverse relationships derive when relationshipIndex is unavailable',
      ({ Given, When, Then, And }) => {
        Given('the graph omits relationshipIndex', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

        When('I query pattern relationships for "BetaCore"', () => {
          state.relationships =
            createPatternGraphAPI(state.graph!).getPatternRelationships('BetaCore') ?? null;
        });

        Then('the relationships field "usedBy" contains "AlphaCore"', () => {
          expect(state.relationships?.usedBy).toContain('AlphaCore');
        });

        And('the relationships field "enables" contains "AlphaCore"', () => {
          expect(state.relationships?.enables).toContain('AlphaCore');
        });
      }
    );
  });

  Rule(
    'Stale relationship index does not return false-empty reverse lookups',
    ({ RuleScenario }) => {
      RuleScenario(
        'Reverse relationships ignore stale empty reverse arrays',
        ({ Given, When, Then, And }) => {
          Given(
            'the graph has a stale relationshipIndex with empty reverse arrays for "BetaCore"',
            () => {
              state.graph = makeGraph(state.graph!.patterns, {
                AlphaCore: {
                  uses: ['BetaCore'],
                  usedBy: [],
                  dependsOn: ['BetaCore'],
                  enables: [],
                  implementsPatterns: [],
                  implementedBy: [],
                  extendedBy: [],
                  seeAlso: [],
                  apiRef: [],
                },
                BetaCore: {
                  uses: [],
                  usedBy: [],
                  dependsOn: [],
                  enables: [],
                  implementsPatterns: [],
                  implementedBy: [],
                  extendedBy: [],
                  seeAlso: [],
                  apiRef: [],
                },
              });
            }
          );

          When('I query pattern dependencies for "BetaCore"', () => {
            state.dependencies =
              createPatternGraphAPI(state.graph!).getPatternDependencies('BetaCore') ?? null;
          });

          Then('the dependencies field "usedBy" contains "AlphaCore"', () => {
            expect(state.dependencies?.usedBy).toContain('AlphaCore');
          });

          And('the dependencies field "enables" contains "AlphaCore"', () => {
            expect(state.dependencies?.enables).toContain('AlphaCore');
          });
        }
      );
    }
  );

  Rule('Shared read-api helpers fail loudly for missing canonical entries', ({ RuleScenario }) => {
    RuleScenario(
      'Foreign patterns trigger the canonical relationship invariant',
      ({ Given, When, Then }) => {
        Given('a foreign pattern named {string}', (_ctx: unknown, name: string) => {
          state.foreignPattern = makePattern(name, 'packages/architect-core/src/ghost.ts');
        });

        When('I resolve relationships for that foreign pattern through the shared helper', () => {
          let errorMessage: string | null = null;
          try {
            getRelationshipsForPattern(state.graph!, state.foreignPattern!);
          } catch (error) {
            errorMessage = error instanceof Error ? error.message : String(error);
          }

          state.invariantError = errorMessage;
        });

        Then('the invariant error equals {string}', (_ctx: unknown, message: string) => {
          expect(state.invariantError).toBe(message);
        });
      }
    );
  });

  Rule('Neighbor queries reuse the shared canonical relationship seam', ({ RuleScenario }) => {
    RuleScenario(
      'Neighborhood lookup derives reverse relationships without relationshipIndex',
      ({ Given, When, Then, And }) => {
        Given('the graph omits relationshipIndex', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

        When('I compute the neighborhood for {string}', (_ctx: unknown, name: string) => {
          const neighborhood = computeNeighborhood(name, state.graph!);
          state.neighborhoodUsedBy = neighborhood?.usedBy.map((entry) => entry.name) ?? null;
          state.neighborhoodEnables = neighborhood?.enables.map((entry) => entry.name) ?? null;
        });

        Then(
          'the neighborhood field {string} contains {string}',
          (_ctx: unknown, field: string, value: string) => {
            const collection =
              field === 'usedBy' ? state.neighborhoodUsedBy : state.neighborhoodEnables;
            expect(collection).toContain(value);
          }
        );

        And(
          'the neighborhood field {string} contains {string}',
          (_ctx: unknown, field: string, value: string) => {
            const collection =
              field === 'usedBy' ? state.neighborhoodUsedBy : state.neighborhoodEnables;
            expect(collection).toContain(value);
          }
        );
      }
    );
  });
});
