/**
 * Deliverable Status Step Definitions
 *
 * BDD step definitions for testing the deliverable status taxonomy:
 * - isDeliverableStatusTerminal - DoD validation check
 * - isDeliverableStatusComplete / InProgress / Pending - individual predicates
 * - getDeliverableStatusEmoji - display emoji mapping
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  isDeliverableStatusTerminal,
  isDeliverableStatusComplete,
  isDeliverableStatusInProgress,
  isDeliverableStatusPending,
  getDeliverableStatusEmoji,
  type DeliverableStatus,
} from '../../../src/taxonomy/deliverable-status.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface DeliverableStatusTestState {
  terminalResult: boolean;
  predicateResult: boolean;
  emojiResult: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DeliverableStatusTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): DeliverableStatusTestState {
  return {
    terminalResult: false,
    predicateResult: false,
    emojiResult: '',
  };
}

// =============================================================================
// Feature: Deliverable Status Taxonomy
// =============================================================================

const feature = await loadFeature('tests/features/types/deliverable-status.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a deliverable status test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // isDeliverableStatusTerminal
  // ===========================================================================

  Rule(
    'isDeliverableStatusTerminal identifies terminal statuses for DoD validation',
    ({ RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'Terminal status classification',
        ({ When, Then }, variables: { status: string; isTerminal: string }) => {
          When('checking if {string} is terminal', () => {
            state!.terminalResult = isDeliverableStatusTerminal(
              variables.status as DeliverableStatus
            );
          });

          Then('the terminal check result is {string}', () => {
            expect(state!.terminalResult).toBe(variables.isTerminal === 'true');
          });
        }
      );
    }
  );

  // ===========================================================================
  // Status predicates
  // ===========================================================================

  Rule('Status predicates classify individual deliverable states', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'isDeliverableStatusComplete classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking if {string} is complete', () => {
          state!.predicateResult = isDeliverableStatusComplete(
            variables.status as DeliverableStatus
          );
        });

        Then('the predicate result is {string}', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );

    RuleScenarioOutline(
      'isDeliverableStatusInProgress classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking if {string} is in-progress', () => {
          state!.predicateResult = isDeliverableStatusInProgress(
            variables.status as DeliverableStatus
          );
        });

        Then('the predicate result is {string}', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );

    RuleScenarioOutline(
      'isDeliverableStatusPending classification',
      ({ When, Then }, variables: { status: string; expected: string }) => {
        When('checking if {string} is pending', () => {
          state!.predicateResult = isDeliverableStatusPending(
            variables.status as DeliverableStatus
          );
        });

        Then('the predicate result is {string}', () => {
          expect(state!.predicateResult).toBe(variables.expected === 'true');
        });
      }
    );
  });

  // ===========================================================================
  // getDeliverableStatusEmoji
  // ===========================================================================

  Rule(
    'getDeliverableStatusEmoji returns display emoji for all statuses',
    ({ RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'Emoji mapping for all statuses',
        ({ When, Then }, variables: { status: string }) => {
          When('getting the emoji for {string}', () => {
            state!.emojiResult = getDeliverableStatusEmoji(variables.status as DeliverableStatus);
          });

          Then('the emoji is not empty', () => {
            expect(state!.emojiResult.length).toBeGreaterThan(0);
          });
        }
      );
    }
  );
});
