import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectTraceabilityMatrix,
  type ProjectionBundle,
  type ProjectionContext,
  type TraceabilityMatrix,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface TraceabilityState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<TraceabilityMatrix> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/traceability-matrix.feature',
);

let state: TraceabilityState | null = null;

function createState(): TraceabilityState {
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
    Given('the Delivery Reporting traceability projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Traceability rows stay projection-shaped and deterministic', ({ RuleScenario }) => {
    RuleScenario(
      'projecting the traceability matrix from timeline specs',
      ({ Given, When, Then, And }) => {
        Given('a traceability projection context with gherkin and non-gherkin patterns', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('BehaviorPhaseOne', {
                status: 'active',
                phase: 11,
                file: 'architect/specs/behavior-phase-one.feature',
                executableSpecs: ['tests/features/behavior/phase-one.feature'],
                behaviorFile: 'tests/features/behavior/phase-one.steps.ts',
                deliverables: [
                  {
                    name: 'Phase one bundle',
                    status: 'complete',
                    tests: 2,
                    location: 'src/projections/delivery-reporting/phase-progress.ts',
                  },
                ],
              }),
              createPattern('BehaviorPhaseTwo', {
                status: 'completed',
                phase: 12,
                file: 'architect/specs/behavior-phase-two.feature',
                behaviorFileVerified: true,
                deliverables: [
                  {
                    name: 'Phase two bundle',
                    status: 'complete',
                    tests: 1,
                    location: 'src/projections/delivery-reporting/release-notes.ts',
                  },
                ],
              }),
              createPattern('ImplementationOnly', {
                status: 'active',
                phase: 13,
                file: 'packages/architect-projection/src/index.ts',
              }),
            ],
          });
        });

        When('I project the traceability matrix', () => {
          state!.bundle = projectTraceabilityMatrix(state!.context!);
        });

        Then('the traceability matrix should include only phased gherkin rows', () => {
          expect(state!.bundle?.root.rows).toEqual([
            {
              pattern: 'BehaviorPhaseOne',
              status: 'active',
              tests: [
                'tests/features/behavior/phase-one.feature',
                'tests/features/behavior/phase-one.steps.ts',
              ],
              specs: ['architect/specs/behavior-phase-one.feature'],
              deliverables: ['src/projections/delivery-reporting/phase-progress.ts'],
            },
            {
              pattern: 'BehaviorPhaseTwo',
              status: 'completed',
              tests: [],
              specs: ['architect/specs/behavior-phase-two.feature'],
              deliverables: ['src/projections/delivery-reporting/release-notes.ts'],
            },
          ]);
        });

        And('the traceability child keys should be deterministic', () => {
          expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
            'behavior-phase-one',
            'behavior-phase-two',
          ]);
        });
      },
    );
  });
});
