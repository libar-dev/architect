import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  getProtectionLevel,
  getValidTransitionsFrom,
  isTerminalState,
  isValidStatusValue,
  validateTransition,
  type ProcessStatusValue,
  type TransitionValidationResult,
} from '../../../src/validation/fsm/index.js';

interface FsmTransitionTestState {
  result: TransitionValidationResult | null;
  validTransitions: readonly ProcessStatusValue[] | null;
}

let state: FsmTransitionTestState | null = null;

function initState(): FsmTransitionTestState {
  return { result: null, validTransitions: null };
}

const feature = await loadFeature('tests/features/validation/fsm-transitions.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('an FSM transition test context', () => {
      state = initState();
    });
  });

  Rule('Lifecycle transitions follow the four-state FSM', ({ RuleScenario }) => {
    RuleScenario('Legal lifecycle transitions are accepted', ({ Then, And }) => {
      Then('the transition from "roadmap" to "active" is valid', () => {
        expect(validateTransition('roadmap', 'active').valid).toBe(true);
      });
      And('the transition from "roadmap" to "deferred" is valid', () => {
        expect(validateTransition('roadmap', 'deferred').valid).toBe(true);
      });
      And('the transition from "active" to "completed" is valid', () => {
        expect(validateTransition('active', 'completed').valid).toBe(true);
      });
      And('the transition from "active" to "roadmap" is valid', () => {
        expect(validateTransition('active', 'roadmap').valid).toBe(true);
      });
      And('the transition from "deferred" to "roadmap" is valid', () => {
        expect(validateTransition('deferred', 'roadmap').valid).toBe(true);
      });
    });

    RuleScenario('Completed reopens to active or roadmap', ({ Then, And }) => {
      Then('the transition from "completed" to "active" is valid', () => {
        expect(validateTransition('completed', 'active').valid).toBe(true);
      });
      And('the transition from "completed" to "roadmap" is valid', () => {
        expect(validateTransition('completed', 'roadmap').valid).toBe(true);
      });
    });

    RuleScenario('Completed reopen targets are active and roadmap', ({ When, Then }) => {
      When('I request the valid transitions from "completed"', () => {
        state!.validTransitions = getValidTransitionsFrom('completed');
      });
      Then('the valid transitions are "active, roadmap"', () => {
        expect(state!.validTransitions).toEqual(['active', 'roadmap']);
      });
    });

    RuleScenario('Completed does not transition to deferred', ({ When, Then, And }) => {
      When('I validate the transition from "completed" to "deferred"', () => {
        state!.result = validateTransition('completed', 'deferred');
      });
      Then('the transition result is invalid', () => {
        expect(state!.result!.valid).toBe(false);
      });
      And('the valid alternatives equal the valid transitions from "completed"', () => {
        expect(state!.result!.valid).toBe(false);
        if (state!.result!.valid) {
          return;
        }
        expect(state!.result!.validAlternatives).toEqual(getValidTransitionsFrom('completed'));
      });
    });
  });

  Rule('Unknown status values are preserved, not coerced', ({ RuleScenario }) => {
    RuleScenario('An unknown source status is rejected verbatim', ({ When, Then, And }) => {
      When('I validate the transition from "candidate" to "active"', () => {
        state!.result = validateTransition('candidate', 'active');
      });
      Then('the transition result is invalid', () => {
        expect(state!.result!.valid).toBe(false);
      });
      And('the transition source is echoed as "candidate"', () => {
        expect(state!.result!.from).toBe('candidate');
      });
      And(
        'the transition error is "Invalid source status \'candidate\'. Valid values: roadmap, active, completed, deferred."',
        () => {
          expect(state!.result!.valid).toBe(false);
          if (state!.result!.valid) {
            return;
          }
          expect(state!.result!.error).toBe(
            "Invalid source status 'candidate'. Valid values: roadmap, active, completed, deferred.",
          );
        },
      );
    });

    RuleScenario('An unknown target status is rejected verbatim', ({ When, Then, And }) => {
      When('I validate the transition from "roadmap" to "candidate"', () => {
        state!.result = validateTransition('roadmap', 'candidate');
      });
      Then('the transition result is invalid', () => {
        expect(state!.result!.valid).toBe(false);
      });
      And('the transition target is echoed as "candidate"', () => {
        expect(state!.result!.to).toBe('candidate');
      });
      And(
        'the transition error is "Invalid target status \'candidate\'. Valid values: roadmap, active, completed, deferred."',
        () => {
          expect(state!.result!.valid).toBe(false);
          if (state!.result!.valid) {
            return;
          }
          expect(state!.result!.error).toBe(
            "Invalid target status 'candidate'. Valid values: roadmap, active, completed, deferred.",
          );
        },
      );
    });

    RuleScenario(
      'isValidStatusValue separates real status values from non-status tokens',
      ({ Then, And }) => {
        Then('"active" is a valid status value', () => {
          expect(isValidStatusValue('active')).toBe(true);
        });
        And('"candidate" is not a valid status value', () => {
          expect(isValidStatusValue('candidate')).toBe(false);
        });
      },
    );
  });

  Rule('Illegal-but-typed transitions surface valid alternatives', ({ RuleScenario }) => {
    RuleScenario(
      'An illegal but well-typed transition surfaces alternatives',
      ({ When, Then, And }) => {
        When('I validate the transition from "roadmap" to "completed"', () => {
          state!.result = validateTransition('roadmap', 'completed');
        });
        Then('the transition result is invalid', () => {
          expect(state!.result!.valid).toBe(false);
        });
        And(
          "the transition error is \"Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first.\"",
          () => {
            expect(state!.result!.valid).toBe(false);
            if (state!.result!.valid) {
              return;
            }
            expect(state!.result!.error).toBe(
              "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first.",
            );
          },
        );
        And('the valid alternatives equal the valid transitions from "roadmap"', () => {
          expect(state!.result!.valid).toBe(false);
          if (state!.result!.valid) {
            return;
          }
          expect(state!.result!.validAlternatives).toEqual(getValidTransitionsFrom('roadmap'));
        });
      },
    );
  });

  Rule('Protection level is a pure function of status', ({ RuleScenario }) => {
    RuleScenario('Protection level is derived deterministically from status', ({ Then, And }) => {
      Then('the protection level for "roadmap" is "none"', () => {
        expect(getProtectionLevel('roadmap')).toBe('none');
      });
      And('the protection level for "deferred" is "none"', () => {
        expect(getProtectionLevel('deferred')).toBe('none');
      });
      And('the protection level for "active" is "scope"', () => {
        expect(getProtectionLevel('active')).toBe('scope');
      });
      And('the protection level for "completed" is "hard"', () => {
        expect(getProtectionLevel('completed')).toBe('hard');
      });
      And('"completed" is a terminal state', () => {
        expect(isTerminalState('completed')).toBe(true);
      });
      And('"active" is not a terminal state', () => {
        expect(isTerminalState('active')).toBe(false);
      });
    });
  });
});
