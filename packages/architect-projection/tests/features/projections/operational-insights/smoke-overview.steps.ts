import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectOverviewDigest,
  OverviewDigestSchema,
  type OverviewDigest,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<OverviewDigest> | null;
}

const feature = await loadFeature(
  'tests/features/projections/operational-insights/smoke-overview.feature',
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Operational Insights smoke test state is initialized', () => {
      state = { context: null, bundle: null };
    });
  });

  Rule(
    'Overview digest runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid overview digest from a small graph',
        ({ Given, When, Then, And }) => {
          Given(
            'an Operational Insights context with three patterns across different statuses',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('ActivePattern', {
                    status: 'active',
                    role: 'service',
                    phase: 1,
                  }),
                  createPattern('CompletedPattern', {
                    status: 'completed',
                    role: 'service',
                    phase: 1,
                  }),
                  createPattern('PlannedPattern', {
                    status: 'roadmap',
                    role: 'utility',
                    phase: 2,
                  }),
                ],
                phaseNames: { 1: 'Foundation', 2: 'Extension' },
              });
            },
          );

          When('I project the overview digest', () => {
            state!.bundle = projectOverviewDigest(state!.context!);
          });

          Then('the overview digest should validate against its Zod schema', () => {
            OverviewDigestSchema.parse(state!.bundle!.root);
          });

          And('the overview progress should reflect the three input patterns', () => {
            expect(state!.bundle!.root.progress.total).toBe(3);
            expect(state!.bundle!.root.progress.completed).toBe(1);
            expect(state!.bundle!.root.progress.active).toBe(1);
            expect(state!.bundle!.root.progress.planned).toBe(1);
          });
        },
      );
    },
  );
});
