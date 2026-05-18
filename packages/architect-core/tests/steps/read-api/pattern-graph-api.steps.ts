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
  uses: readonly string[] = [],
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
    relationshipIndex: buildRelationshipIndex(patterns),
  };

  PatternGraphSchema.parse(graph);
  return graph;
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

  Rule('Canonical relationship index resolves reverse lookups', ({ RuleScenario }) => {
    RuleScenario(
      'Reverse relationships read from the canonical relationship index',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
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
      },
    );
  });

  Rule('Dependency queries reuse the same canonical relationship index', ({ RuleScenario }) => {
    RuleScenario(
      'Reverse relationships stay canonical through dependency queries',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
          state.graph = makeGraph(state.graph!.patterns);
        });

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
      },
    );
  });

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
      },
    );
  });

  Rule('Neighbor queries reuse the shared canonical relationship seam', ({ RuleScenario }) => {
    RuleScenario(
      'Neighborhood lookup reads the canonical relationship index',
      ({ Given, When, Then, And }) => {
        Given('the graph includes the canonical relationship index', () => {
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
          },
        );

        And(
          'the neighborhood field {string} contains {string}',
          (_ctx: unknown, field: string, value: string) => {
            const collection =
              field === 'usedBy' ? state.neighborhoodUsedBy : state.neighborhoodEnables;
            expect(collection).toContain(value);
          },
        );
      },
    );
  });
});
