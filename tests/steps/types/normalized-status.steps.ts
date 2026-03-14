/**
 * @libar-docs
 * @libar-docs-implements NormalizedStatusTesting
 * @libar-docs-uses NormalizedStatus
 *
 * Normalized Status Step Definitions
 *
 * BDD step definitions for testing the normalized status taxonomy:
 * - normalizeStatus - maps raw FSM states to display buckets
 * - isPatternComplete / isPatternActive / isPatternPlanned - predicates
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  normalizeStatus,
  isPatternComplete,
  isPatternActive,
  isPatternPlanned,
} from '../../../src/taxonomy/normalized-status.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface NormalizedStatusTestState {
  normalizedResult: string;
  predicateResult: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: NormalizedStatusTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): NormalizedStatusTestState {
  return {
    normalizedResult: '',
    predicateResult: false,
  };
}

// =============================================================================
// Feature: Normalized Status Taxonomy
// =============================================================================

const feature = await loadFeature('tests/features/types/normalized-status.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a normalized status test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // normalizeStatus
  // ===========================================================================

  Rule(
    'normalizeStatus maps raw FSM states to display buckets',
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'Status normalization',
        ({ When, Then }, variables: { rawStatus: string; normalizedStatus: string }) => {
          When('normalizing status "<rawStatus>"', () => {
            state!.normalizedResult = normalizeStatus(variables.rawStatus);
          });

          Then('the normalized status is "<normalizedStatus>"', () => {
            expect(state!.normalizedResult).toBe(variables.normalizedStatus);
          });
        }
      );

      RuleScenario('normalizeStatus defaults undefined to planned', ({ When, Then }) => {
        When('normalizing an undefined status', () => {
          state!.normalizedResult = normalizeStatus(undefined);
        });

        Then('the normalized status is {string}', (_ctx: unknown, expected: string) => {
          expect(state!.normalizedResult).toBe(expected);
        });
      });

      RuleScenario('normalizeStatus defaults unknown status to planned', ({ When, Then }) => {
        When('normalizing status {string}', (_ctx: unknown, rawStatus: string) => {
          state!.normalizedResult = normalizeStatus(rawStatus);
        });

        Then('the normalized status is {string}', (_ctx: unknown, expected: string) => {
          expect(state!.normalizedResult).toBe(expected);
        });
      });
    }
  );

  // ===========================================================================
  // Pattern status predicates
  // ===========================================================================

  Rule('Pattern status predicates check normalized state', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'isPatternComplete classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking isPatternComplete for "<status>"', () => {
          state!.predicateResult = isPatternComplete(variables.status);
        });

        Then('the predicate result is "<expected>"', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );

    RuleScenarioOutline(
      'isPatternActive classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking isPatternActive for "<status>"', () => {
          state!.predicateResult = isPatternActive(variables.status);
        });

        Then('the predicate result is "<expected>"', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );

    RuleScenarioOutline(
      'isPatternPlanned classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking isPatternPlanned for "<status>"', () => {
          state!.predicateResult = isPatternPlanned(variables.status);
        });

        Then('the predicate result is "<expected>"', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );
  });
});
