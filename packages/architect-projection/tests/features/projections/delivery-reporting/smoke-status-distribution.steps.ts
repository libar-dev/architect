import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectStatusDistribution,
  StatusDistributionSchema,
  type ProjectionContext,
  type StatusDistribution,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  result: StatusDistribution | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/smoke-status-distribution.feature'
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Delivery Reporting smoke test state is initialized', () => {
      state = { context: null, result: null };
    });
  });

  Rule(
    'Status distribution runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid status distribution from a small graph',
        ({ Given, When, Then, And }) => {
          Given(
            'a Delivery Reporting context with three patterns across different statuses',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('ActiveService', { status: 'active', phase: 1 }),
                  createPattern('CompletedService', { status: 'completed', phase: 1 }),
                  createPattern('PlannedService', { status: 'roadmap', phase: 2 }),
                ],
              });
            }
          );

          When('I project the status distribution', () => {
            state!.result = projectStatusDistribution(state!.context!).root;
          });

          Then('the status distribution should validate against its Zod schema', () => {
            StatusDistributionSchema.parse(state!.result);
          });

          And('the status distribution counts should reflect the three input patterns', () => {
            expect(state!.result!.counts.active).toBe(1);
            expect(state!.result!.counts.completed).toBe(1);
            expect(state!.result!.counts.planned).toBe(1);
            expect(state!.result!.counts.total).toBe(3);
          });
        }
      );
    }
  );
});
