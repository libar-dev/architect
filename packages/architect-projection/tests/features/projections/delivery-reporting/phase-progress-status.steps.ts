import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectPhaseProgress,
  projectStatusDistribution,
  type PhaseProgress,
  type ProjectionContext,
  type StatusDistribution,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface ProgressProjectionState {
  context: ProjectionContext | null;
  phaseProgress: PhaseProgress | undefined;
  statusDistribution: StatusDistribution | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/phase-progress-status.feature',
);

let state: ProgressProjectionState | null = null;

function createState(): ProgressProjectionState {
  return {
    context: null,
    phaseProgress: undefined,
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

  Rule(
    'Phase progress reflects delivery counts without artificial completion',
    ({ RuleScenario }) => {
      RuleScenario('projecting progress for a named phase', ({ Given, When, Then }) => {
        Given('a progress projection context for phase 16 named "Timeline Bodies"', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('RoadmapBody', { status: 'roadmap', phase: 16 }),
              createPattern('ActiveBundle', { status: 'active', phase: 16 }),
              createPattern('CompletedBundle', { status: 'completed', phase: 16 }),
              createPattern('CandidateBundle', { status: 'candidate', phase: 16 }),
            ],
            phaseNames: {
              16: 'Timeline Bodies',
            },
          });
        });

        When('I project phase progress for phase 16', () => {
          state!.phaseProgress = projectPhaseProgress(state!.context!, 16)?.root;
        });

        Then('the phase progress fragment should expose the named phase counts', () => {
          expect(state!.phaseProgress).toEqual({
            kind: 'PhaseProgress',
            phaseNumber: 16,
            phaseName: 'Timeline Bodies',
            completed: 1,
            active: 1,
            planned: 1,
            candidate: 1,
            total: 4,
            completionPercentage: 33,
          });
        });
      });

      RuleScenario('missing phases return no fragment', ({ Given, When, Then }) => {
        Given('a progress projection context for phase 16 named "Timeline Bodies"', () => {
          state!.context = createProjectionContext({
            patterns: [createPattern('RoadmapBody', { status: 'roadmap', phase: 16 })],
            phaseNames: {
              16: 'Timeline Bodies',
            },
          });
        });

        When('I project phase progress for the missing phase 99', () => {
          state!.phaseProgress = projectPhaseProgress(state!.context!, 99)?.root;
        });

        Then('the phase progress result should be undefined', () => {
          expect(state!.phaseProgress).toBeUndefined();
        });
      });

      RuleScenario('projection filters scope phase progress counts', ({ Given, When, Then }) => {
        Given('a filtered progress projection context for phase 16 named "Timeline Bodies"', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('RoadmapBody', { status: 'roadmap', phase: 16 }),
              createPattern('ActiveBundle', { status: 'active', phase: 16 }),
              createPattern('CompletedBundle', { status: 'completed', phase: 16 }),
              createPattern('CandidateBundle', { status: 'candidate', phase: 16 }),
            ],
            phaseNames: {
              16: 'Timeline Bodies',
            },
            projectionFilter: {
              status: ['active', 'completed'],
            },
          });
        });

        When('I project phase progress for phase 16', () => {
          state!.phaseProgress = projectPhaseProgress(state!.context!, 16)?.root;
        });

        Then('the phase progress fragment should include only filtered phase patterns', () => {
          expect(state!.phaseProgress).toMatchObject({
            kind: 'PhaseProgress',
            completed: 1,
            active: 1,
            planned: 0,
            candidate: 0,
            total: 2,
            completionPercentage: 50,
          });
        });
      });
    },
  );

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
