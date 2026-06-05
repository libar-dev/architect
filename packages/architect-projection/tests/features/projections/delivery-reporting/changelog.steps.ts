import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectChangelog,
  type ProjectionBundle,
  type ProjectionContext,
  type RoadmapTimeline,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface ChangelogState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<RoadmapTimeline> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/changelog.feature',
);

let state: ChangelogState | null = null;

function createState(): ChangelogState {
  return {
    context: null,
    bundle: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Delivery Reporting changelog projection state is initialized', () => {
      state = createState();
    });
  });

  Rule('The changelog is a release-free completed-patterns view', ({ RuleScenario }) => {
    RuleScenario(
      'the changelog lists completed patterns in name order with no children',
      ({ Given, When, Then, And }) => {
        Given('a changelog projection context with completed and non-completed patterns', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('ZetaShipped', { status: 'completed' }),
              createPattern('AlphaShipped', { status: 'completed' }),
              createPattern('MidShipped', { status: 'completed' }),
              createPattern('StillActive', { status: 'active' }),
              createPattern('OnRoadmap', { status: 'roadmap' }),
            ],
          });
        });

        When('I project the changelog', () => {
          state!.bundle = projectChangelog(state!.context!);
        });

        Then('the changelog root lists only completed patterns in name order', () => {
          expect(state!.bundle?.root.view).toBe('milestones');
          expect(state!.bundle?.root.patterns.map((pattern) => pattern.patternName)).toEqual([
            'AlphaShipped',
            'MidShipped',
            'ZetaShipped',
          ]);
        });

        And('the changelog root reports the completed count', () => {
          expect(state!.bundle?.root.counts.completed).toBe(3);
        });

        And('the changelog has no child entries', () => {
          expect(Object.keys(state!.bundle?.children ?? {})).toEqual([]);
        });
      },
    );
  });
});
