import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectCurrentWork,
  projectRoadmapTimeline,
  type ProjectionBundle,
  type ProjectionContext,
  type RoadmapTimeline,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface TimelineProjectionState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<RoadmapTimeline> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/roadmap-timeline.feature',
);

let state: TimelineProjectionState | null = null;

function createState(): TimelineProjectionState {
  return {
    context: null,
    bundle: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Delivery Reporting timeline projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Timeline bundles keep roadmap and current work split by entrypoint', ({ RuleScenario }) => {
    RuleScenario(
      'roadmap timeline lists roadmap and deferred patterns',
      ({ Given, When, Then }) => {
        Given('a timeline projection context with roadmap and deferred work', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('RoadmapTwo', { status: 'roadmap' }),
              createPattern('DeferredOne', { status: 'deferred' }),
              createPattern('RoadmapOne', { status: 'roadmap' }),
            ],
          });
        });

        When('I project the roadmap timeline', () => {
          state!.bundle = projectRoadmapTimeline(state!.context!);
        });

        Then('the roadmap root should list the roadmap and deferred patterns name-sorted', () => {
          expect(state!.bundle?.root.view).toBe('roadmap');
          expect(state!.bundle?.root.patterns.map((pattern) => pattern.patternName)).toEqual([
            'DeferredOne',
            'RoadmapOne',
            'RoadmapTwo',
          ]);
          expect(state!.bundle?.root.counts).toEqual({
            completed: 0,
            active: 0,
            planned: 3,
            candidate: 0,
            total: 3,
          });
        });
      },
    );

    RuleScenario('current work keeps only active patterns', ({ Given, When, Then }) => {
      Given('a timeline projection context with completed, active, and planned work', () => {
        state!.context = createProjectionContext({
          patterns: [
            createPattern('CompletedA', { status: 'completed' }),
            createPattern('ActiveB', { status: 'active' }),
            createPattern('ActiveA', { status: 'active' }),
            createPattern('PlannedA', { status: 'roadmap' }),
          ],
        });
      });

      When('I project the current work timeline', () => {
        state!.bundle = projectCurrentWork(state!.context!);
      });

      Then('the current-work root should contain only active patterns', () => {
        expect(state!.bundle?.root.view).toBe('current');
        expect(state!.bundle?.root.patterns.map((pattern) => pattern.patternName)).toEqual([
          'ActiveA',
          'ActiveB',
        ]);
      });
    });
  });
});
