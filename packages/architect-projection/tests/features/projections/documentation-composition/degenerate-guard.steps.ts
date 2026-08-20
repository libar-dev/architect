import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  assertGeneratorNotDegenerate,
  GeneratorDegenerateError,
  type Fragment,
  type StatusDistribution,
  type TraceabilityMatrix,
} from '../../../../src/index.js';

interface GuardState {
  rootFragment: Fragment | null;
  caught: unknown;
  threw: boolean;
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/degenerate-guard.feature',
);

let state: GuardState | null = null;

function createState(): GuardState {
  return {
    rootFragment: null,
    caught: null,
    threw: false,
  };
}

function emptyTraceabilityMatrix(): TraceabilityMatrix {
  return { kind: 'TraceabilityMatrix', rows: [] };
}

function populatedTraceabilityMatrix(): TraceabilityMatrix {
  return {
    kind: 'TraceabilityMatrix',
    rows: [
      {
        pattern: 'GraphHandle',
        status: 'completed',
        tests: ['packages/architect-core/tests/features/read-api/consistency.feature'],
        specs: ['packages/architect-core/src/read-api/graph-handle.ts'],
        deliverables: [],
      },
    ],
  };
}

function statusDistribution(): StatusDistribution {
  return {
    kind: 'StatusDistribution',
    counts: { completed: 0, active: 0, planned: 0, candidate: 0, total: 0 },
    percentages: { completed: 0, active: 0, planned: 0, candidate: 0 },
  };
}

function runGuard(documentType: 'traceability' | 'current-work'): void {
  try {
    assertGeneratorNotDegenerate(documentType, state!.rootFragment!);
    state!.threw = false;
  } catch (error) {
    state!.threw = true;
    state!.caught = error;
  }
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the generator degeneracy guard state is initialized', () => {
      state = createState();
    });
  });

  Rule('Collection-bearing generators must not produce a degenerate root', ({ RuleScenario }) => {
    RuleScenario('an empty collection-bearing root is rejected', ({ Given, When, Then }) => {
      Given('a traceability matrix root fragment with no rows', () => {
        state!.rootFragment = emptyTraceabilityMatrix();
      });

      When('the degeneracy guard inspects the traceability generator', () => {
        runGuard('traceability');
      });

      Then('the guard should throw a degenerate error naming the traceability generator', () => {
        expect(state!.threw).toBe(true);
        expect(state!.caught).toBeInstanceOf(GeneratorDegenerateError);
        const error = state!.caught as GeneratorDegenerateError;
        expect(error.documentType).toBe('traceability');
        expect(error.reason).toBe('0 rows');
        expect(error.message).toContain('traceability');
      });
    });

    RuleScenario('a populated collection-bearing root passes', ({ Given, When, Then }) => {
      Given('a traceability matrix root fragment with one row', () => {
        state!.rootFragment = populatedTraceabilityMatrix();
      });

      When('the degeneracy guard inspects the traceability generator', () => {
        runGuard('traceability');
      });

      Then('the guard should not throw', () => {
        expect(state!.threw).toBe(false);
      });
    });
  });

  Rule('Non-collection-bearing generators are never reported degenerate', ({ RuleScenario }) => {
    RuleScenario('a non-collection-bearing root passes', ({ Given, When, Then }) => {
      Given('a status distribution root fragment', () => {
        state!.rootFragment = statusDistribution();
      });

      When('the degeneracy guard inspects the current-work generator', () => {
        runGuard('current-work');
      });

      Then('the guard should not throw', () => {
        expect(state!.threw).toBe(false);
      });
    });
  });
});
