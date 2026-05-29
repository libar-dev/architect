import { StatusFilterSchema, type StatusFilterValue } from '@libar-dev/architect-core';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { projectPatternCatalog, type ProjectionContext } from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface CatalogState {
  context: ProjectionContext | null;
  names: string[];
}

function parseStatusFilter(value: string): StatusFilterValue {
  return StatusFilterSchema.parse(value);
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/pattern-catalog-status-filter.feature',
);

let state: CatalogState | null = null;

function createStatusSpreadContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('CandidatePattern', { status: 'candidate' }),
      createPattern('RoadmapPattern', { status: 'roadmap' }),
      createPattern('ActivePattern', { status: 'active' }),
      createPattern('CompletedPattern', { status: 'completed' }),
      createPattern('DeferredPattern', { status: 'deferred' }),
    ],
  });
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a pattern catalog spanning every authored status', () => {
      state = { context: createStatusSpreadContext(), names: [] };
    });
  });

  Rule('The normalized bucket word filters the union', ({ RuleScenario }) => {
    RuleScenario('Planned filter returns the roadmap and deferred union', ({ When, Then, And }) => {
      When('I filter the pattern catalog by status {string}', (_ctx: unknown, status: string) => {
        state!.names = projectPatternCatalog(state!.context!, {
          status: parseStatusFilter(status),
        }).root.names;
      });

      Then('the catalog should list the roadmap and deferred patterns', () => {
        expect(state!.names).toEqual(['DeferredPattern', 'RoadmapPattern']);
      });

      And('the catalog should not list the candidate, active, or completed patterns', () => {
        expect(state!.names).not.toContain('CandidatePattern');
        expect(state!.names).not.toContain('ActivePattern');
        expect(state!.names).not.toContain('CompletedPattern');
      });
    });
  });

  Rule('FSM authored words still exact-match', ({ RuleScenario }) => {
    RuleScenario('Roadmap filter is exact', ({ When, Then }) => {
      When('I filter the pattern catalog by status {string}', (_ctx: unknown, status: string) => {
        state!.names = projectPatternCatalog(state!.context!, {
          status: parseStatusFilter(status),
        }).root.names;
      });

      Then('the catalog should list only the roadmap patterns', () => {
        expect(state!.names).toEqual(['RoadmapPattern']);
      });
    });

    RuleScenario('Deferred filter is exact', ({ When, Then }) => {
      When('I filter the pattern catalog by status {string}', (_ctx: unknown, status: string) => {
        state!.names = projectPatternCatalog(state!.context!, {
          status: parseStatusFilter(status),
        }).root.names;
      });

      Then('the catalog should list only the deferred patterns', () => {
        expect(state!.names).toEqual(['DeferredPattern']);
      });
    });
  });

  Rule('candidate stays pre-FSM and outside the planned bucket', ({ RuleScenario }) => {
    RuleScenario('Candidate filter is exact and excluded from planned', ({ When, Then }) => {
      When('I filter the pattern catalog by status {string}', (_ctx: unknown, status: string) => {
        state!.names = projectPatternCatalog(state!.context!, {
          status: parseStatusFilter(status),
        }).root.names;
      });

      Then('the catalog should list only the candidate patterns', () => {
        expect(state!.names).toEqual(['CandidatePattern']);
      });
    });
  });
});
