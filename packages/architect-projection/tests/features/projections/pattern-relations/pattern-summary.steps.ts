import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { AcceptedStatusValue } from '@libar-dev/architect-core';

import {
  parseAndProjectPatternCatalog,
  ProjectionError,
  projectPatternSummary,
  type PatternCatalog,
  type ProjectionContext,
  type PatternSummary,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface PatternSummaryState {
  context: ProjectionContext | null;
  catalog: PatternCatalog | null;
  summary: PatternSummary | null;
  error: unknown;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/pattern-summary.feature',
);

let state: PatternSummaryState | null = null;

function createState(): PatternSummaryState {
  return {
    context: null,
    catalog: null,
    summary: null,
    error: null,
  };
}

function createMixedCatalogContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ActiveService', {
        status: 'active',
        role: 'service',
        phase: 49,
      }),
      createPattern('CompletedService', {
        status: 'completed',
        role: 'service',
        phase: 49,
      }),
      createPattern('ActiveInfraPhase50', {
        status: 'active',
        role: 'infra',
        phase: 50,
      }),
      createPattern('RoadmapUiPhase50', {
        status: 'roadmap',
        role: 'ui',
        phase: 50,
      }),
    ],
  });
}

function expectCatalogNames(csvNames: string): void {
  expect(state!.catalog?.names).toEqual(csvNames.split(', '));
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations pattern summary state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Pattern summaries keep the stable fragment contract', ({ RuleScenario }) => {
    RuleScenario('projecting a canonical pattern summary', ({ Given, When, Then }) => {
      Given('a summary projection context with a pattern named "PatternGraphAPI"', () => {
        state!.context = createProjectionContext({
          patterns: [
            createPattern('PatternGraphAPI', {
              role: 'service',
              phase: 49,
              file: 'packages/architect-query/src/pattern-graph-api.ts',
            }),
          ],
        });
      });

      When('I project the summary for "PatternGraphAPI"', () => {
        state!.summary = projectPatternSummary(state!.context!, 'PatternGraphAPI').root;
      });

      Then('the projected summary should expose the canonical fragment fields', () => {
        expect(state!.summary).toEqual({
          kind: 'PatternSummary',
          patternName: 'PatternGraphAPI',
          status: 'active',
          maturity: 'design',
          role: 'service',
          phase: 49,
          file: 'packages/architect-query/src/pattern-graph-api.ts',
          source: 'typescript',
        });
      });
    });

    RuleScenario('pattern lookup is case-insensitive', ({ Given, When, Then }) => {
      Given('a summary projection context with a pattern named "PatternGraphAPI"', () => {
        state!.context = createProjectionContext({
          patterns: [createPattern('PatternGraphAPI')],
        });
      });

      When('I project the summary for "patterngraphapi"', () => {
        state!.summary = projectPatternSummary(state!.context!, 'patterngraphapi').root;
      });

      Then('the projected summary should still target "PatternGraphAPI"', () => {
        expect(state!.summary?.patternName).toBe('PatternGraphAPI');
      });
    });

    RuleScenario('missing patterns return a suggested match', ({ Given, When, Then }) => {
      Given('a summary projection context with a pattern named "PatternGraphAPI"', () => {
        state!.context = createProjectionContext({
          patterns: [createPattern('PatternGraphAPI')],
        });
      });

      When('I project the summary for the missing pattern "PatternGraphAp"', () => {
        try {
          projectPatternSummary(state!.context!, 'PatternGraphAp');
        } catch (error) {
          state!.error = error;
        }
      });

      Then('the summary projection should fail with a suggestion for "PatternGraphAPI"', () => {
        expect(state!.error).toBeInstanceOf(ProjectionError);
        expect((state!.error as Error).message).toContain('Pattern not found: "PatternGraphAp"');
        expect((state!.error as Error).message).toContain('Did you mean: PatternGraphAPI?');
      });
    });
  });

  Rule('Pattern catalogs own list filtering semantics', ({ RuleScenario }) => {
    RuleScenario('role aliases resolve before catalog filtering', ({ Given, When, Then, And }) => {
      Given('a catalog projection context with canonical and non-matching roles', () => {
        state!.context = createProjectionContext({
          patterns: [
            createPattern('InfraPattern', {
              role: 'infra',
              file: 'packages/architect-core/src/runtime/infra.ts',
            }),
            createPattern('ServicePattern', {
              role: 'service',
              file: 'packages/architect-query/src/pattern-graph-api.ts',
            }),
          ],
        });
      });

      When('I project the pattern catalog for role alias "infrastructure"', () => {
        state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
          role: 'infrastructure',
          namesOnly: true,
        }).root;
      });

      Then('the projected catalog should resolve the canonical role filter', () => {
        expect(state!.catalog?.filters.role).toBe('infra');
      });

      And('the projected catalog should include only "InfraPattern"', () => {
        expect(state!.catalog).toEqual({
          kind: 'PatternCatalog',
          filters: {
            role: 'infra',
            namesOnly: true,
            count: false,
          },
          count: 1,
          names: ['InfraPattern'],
          items: [],
        });
      });
    });

    RuleScenario('status filter selects matching patterns', ({ Given, When, Then }) => {
      Given('a catalog projection context with mixed status phase and role variants', () => {
        state!.context = createMixedCatalogContext();
      });

      When('I project the pattern catalog with status "active"', () => {
        state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
          status: 'active',
        }).root;
      });

      Then('the projected catalog names should be {string}', (_ctx: unknown, names: string) => {
        expectCatalogNames(names);
      });
    });

    RuleScenario('phase filter selects matching patterns', ({ Given, When, Then }) => {
      Given('a catalog projection context with mixed status phase and role variants', () => {
        state!.context = createMixedCatalogContext();
      });

      When('I project the pattern catalog with phase {int}', (_ctx: unknown, phase: number) => {
        state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
          phase,
        }).root;
      });

      Then('the projected catalog names should be {string}', (_ctx: unknown, names: string) => {
        expectCatalogNames(names);
      });
    });

    RuleScenario('status phase and role filters combine', ({ Given, When, Then, And }) => {
      Given('a catalog projection context with mixed status phase and role variants', () => {
        state!.context = createMixedCatalogContext();
      });

      When(
        'I project the pattern catalog with status {string} phase {int} and role alias {string}',
        (_ctx: unknown, status: AcceptedStatusValue, phase: number, role: string) => {
          state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
            status,
            phase,
            role,
          }).root;
        },
      );

      Then('the projected catalog should resolve the canonical role filter', () => {
        expect(state!.catalog?.filters.role).toBe('infra');
      });

      And('the projected catalog names should be {string}', (_ctx: unknown, names: string) => {
        expectCatalogNames(names);
      });
    });

    RuleScenario('count flag returns only the matching count', ({ Given, When, Then, And }) => {
      Given('a catalog projection context with mixed status phase and role variants', () => {
        state!.context = createMixedCatalogContext();
      });

      When('I project the pattern catalog with count true', () => {
        state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
          count: true,
        }).root;
      });

      Then('the projected catalog count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.catalog?.count).toBe(count);
      });

      And('the projected catalog should omit names and items', () => {
        expect(state!.catalog?.names).toEqual([]);
        expect(state!.catalog?.items).toEqual([]);
      });
    });

    RuleScenario(
      'namesOnly flag returns names without item details',
      ({ Given, When, Then, And }) => {
        Given('a catalog projection context with mixed status phase and role variants', () => {
          state!.context = createMixedCatalogContext();
        });

        When('I project the pattern catalog with namesOnly true', () => {
          state!.catalog = parseAndProjectPatternCatalog(state!.context!, {
            namesOnly: true,
          }).root;
        });

        Then('the projected catalog names should be {string}', (_ctx: unknown, names: string) => {
          expectCatalogNames(names);
        });

        And('the projected catalog should omit item details', () => {
          expect(state!.catalog?.items).toEqual([]);
        });
      },
    );
  });
});
