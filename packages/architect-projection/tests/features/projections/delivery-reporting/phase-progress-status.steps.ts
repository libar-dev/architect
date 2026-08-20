import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectStatusDistribution,
  type ProjectionContext,
  type StatusDistribution,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface ProgressProjectionState {
  context: ProjectionContext | null;
  statusDistribution: StatusDistribution | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/phase-progress-status.feature',
);

let state: ProgressProjectionState | null = null;

function createState(): ProgressProjectionState {
  return {
    context: null,
    statusDistribution: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Delivery Reporting progress projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Status distribution keeps zero-delivery percentages honest', ({ RuleScenario }) => {
    RuleScenario(
      'projecting status distribution for mixed delivery work',
      ({ Given, When, Then }) => {
        Given(
          'a status distribution context with completed, active, planned, and candidate work',
          () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('CompletedOne', { status: 'completed' }),
                createPattern('CompletedTwo', { status: 'completed' }),
                createPattern('ActiveOne', { status: 'active' }),
                createPattern('PlannedOne', { status: 'roadmap' }),
                createPattern('CandidateOne', { status: 'candidate' }),
              ],
            });
          },
        );

        When('I project the status distribution', () => {
          state!.statusDistribution = projectStatusDistribution(state!.context!).root;
        });

        Then('the status distribution fragment should expose the expected percentages', () => {
          expect(state!.statusDistribution).toEqual({
            kind: 'StatusDistribution',
            counts: {
              completed: 2,
              active: 1,
              planned: 1,
              candidate: 1,
              total: 5,
            },
            percentages: {
              completed: 50,
              active: 25,
              planned: 25,
              candidate: 20,
            },
          });
        });
      },
    );

    RuleScenario('zero-delivery projects report zero percentages', ({ Given, When, Then }) => {
      Given('a status distribution context with only candidate work', () => {
        state!.context = createProjectionContext({
          patterns: [
            createPattern('CandidateOne', { status: 'candidate' }),
            createPattern('CandidateTwo', { status: 'candidate' }),
          ],
        });
      });

      When('I project the status distribution', () => {
        state!.statusDistribution = projectStatusDistribution(state!.context!).root;
      });

      Then('the status distribution percentages should all be zero', () => {
        expect(state!.statusDistribution?.percentages).toEqual({
          completed: 0,
          active: 0,
          planned: 0,
          candidate: 0,
        });
      });
    });

    RuleScenario('projection filters scope status distribution counts', ({ Given, When, Then }) => {
      Given(
        'a filtered status distribution context with completed, active, planned, and candidate work',
        () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('CompletedOne', { status: 'completed' }),
              createPattern('CompletedTwo', { status: 'completed' }),
              createPattern('ActiveOne', { status: 'active' }),
              createPattern('PlannedOne', { status: 'roadmap' }),
              createPattern('CandidateOne', { status: 'candidate' }),
            ],
            projectionFilter: {
              status: ['active', 'completed'],
            },
          });
        },
      );

      When('I project the status distribution', () => {
        state!.statusDistribution = projectStatusDistribution(state!.context!).root;
      });

      Then('the status distribution fragment should include only filtered status patterns', () => {
        expect(state!.statusDistribution).toEqual({
          kind: 'StatusDistribution',
          counts: {
            completed: 2,
            active: 1,
            planned: 0,
            candidate: 0,
            total: 3,
          },
          percentages: {
            completed: 67,
            active: 33,
            planned: 0,
            candidate: 0,
          },
        });
      });
    });
  });
});
