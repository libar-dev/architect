/**
 * FSM Validator Step Definitions
 *
 * BDD step definitions for testing the Phase State Machine validation
 * functions that validate status values and transitions per PDR-005.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  validateStatus,
  validateTransition,
  validateCompletionMetadata,
  validatePatternStatus,
  getProtectionSummary,
  type StatusValidationResult,
  type TransitionValidationResult,
  type CompletionMetadataValidationResult,
  type PatternMetadata,
} from "../../../src/validation/fsm/index.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface FSMValidatorState {
  statusResult: StatusValidationResult | null;
  transitionResult: TransitionValidationResult | null;
  completionResult: CompletionMetadataValidationResult | null;
  patternResult: ReturnType<typeof validatePatternStatus> | null;
  protectionSummary: ReturnType<typeof getProtectionSummary> | null;
  pattern: PatternMetadata;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: FSMValidatorState | null = null;

function initState(): FSMValidatorState {
  return {
    statusResult: null,
    transitionResult: null,
    completionResult: null,
    patternResult: null,
    protectionSummary: null,
    pattern: {
      status: "",
    },
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/validation/fsm-validator.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Status Validation Tests
  // ===========================================================================

  Rule(
    "Status values must be valid PDR-005 FSM states",
    ({ RuleScenarioOutline, RuleScenario }) => {
      RuleScenarioOutline(
        "Valid status values are accepted",
        ({ When, Then, And }, variables: { status: string }) => {
          When("validating status {string}", () => {
            state = initState();
            state.statusResult = validateStatus(variables.status);
          });

          Then("validation passes", () => {
            expect(state!.statusResult!.valid).toBe(true);
          });

          And("the validated status is {string}", () => {
            expect(state!.statusResult!.status).toBe(variables.status);
          });
        }
      );

      RuleScenarioOutline(
        "Invalid status values are rejected",
        ({ When, Then, And }, variables: { status: string }) => {
          When("validating status {string}", () => {
            state = initState();
            state.statusResult = validateStatus(variables.status);
          });

          Then("validation fails", () => {
            expect(state!.statusResult!.valid).toBe(false);
          });

          And('the error message contains "Invalid status"', () => {
            expect(state!.statusResult!.error).toContain("Invalid status");
          });

          And("the error message contains valid values list", () => {
            expect(state!.statusResult!.error).toContain("roadmap");
            expect(state!.statusResult!.error).toContain("active");
            expect(state!.statusResult!.error).toContain("completed");
            expect(state!.statusResult!.error).toContain("deferred");
          });
        }
      );

      RuleScenario("Terminal state returns warning", ({ When, Then, And }) => {
        When('validating status "completed"', () => {
          state = initState();
          state.statusResult = validateStatus("completed");
        });

        Then("validation passes", () => {
          expect(state!.statusResult!.valid).toBe(true);
        });

        And('warnings include "terminal state"', () => {
          expect(state!.statusResult!.warnings).toBeDefined();
          expect(state!.statusResult!.warnings!.some((w) => w.includes("terminal state"))).toBe(
            true
          );
        });
      });
    }
  );

  // ===========================================================================
  // Transition Validation Tests
  // ===========================================================================

  Rule("Status transitions must follow FSM rules", ({ RuleScenarioOutline, RuleScenario }) => {
    RuleScenarioOutline(
      "Valid transitions are accepted",
      ({ When, Then }, variables: { from: string; to: string }) => {
        When("validating transition from {string} to {string}", () => {
          state = initState();
          state.transitionResult = validateTransition(variables.from, variables.to);
        });

        Then("transition is valid", () => {
          expect(state!.transitionResult!.valid).toBe(true);
        });
      }
    );

    RuleScenarioOutline(
      "Invalid transitions are rejected with alternatives",
      ({ When, Then, And }, variables: { from: string; to: string }) => {
        When("validating transition from {string} to {string}", () => {
          state = initState();
          state.transitionResult = validateTransition(variables.from, variables.to);
        });

        Then("transition is invalid", () => {
          expect(state!.transitionResult!.valid).toBe(false);
        });

        And("the error message is provided", () => {
          expect(state!.transitionResult!.error).toBeDefined();
          expect(state!.transitionResult!.error!.length).toBeGreaterThan(0);
        });

        And("valid alternatives are provided", () => {
          expect(state!.transitionResult!.validAlternatives).toBeDefined();
        });
      }
    );

    RuleScenario("Terminal state has no valid transitions", ({ When, Then, And }) => {
      When('validating transition from "completed" to "roadmap"', () => {
        state = initState();
        state.transitionResult = validateTransition("completed", "roadmap");
      });

      Then("transition is invalid", () => {
        expect(state!.transitionResult!.valid).toBe(false);
      });

      And("valid alternatives list is empty", () => {
        expect(state!.transitionResult!.validAlternatives).toBeDefined();
        expect(state!.transitionResult!.validAlternatives!.length).toBe(0);
      });
    });

    RuleScenario("Invalid source status in transition", ({ When, Then, And }) => {
      When('validating transition from "done" to "active"', () => {
        state = initState();
        state.transitionResult = validateTransition("done", "active");
      });

      Then("transition is invalid", () => {
        expect(state!.transitionResult!.valid).toBe(false);
      });

      And('the error message contains "Invalid source status"', () => {
        expect(state!.transitionResult!.error).toContain("Invalid source status");
      });
    });

    RuleScenario("Invalid target status in transition", ({ When, Then, And }) => {
      When('validating transition from "roadmap" to "done"', () => {
        state = initState();
        state.transitionResult = validateTransition("roadmap", "done");
      });

      Then("transition is invalid", () => {
        expect(state!.transitionResult!.valid).toBe(false);
      });

      And('the error message contains "Invalid target status"', () => {
        expect(state!.transitionResult!.error).toContain("Invalid target status");
      });
    });
  });

  // ===========================================================================
  // Completion Metadata Validation Tests
  // ===========================================================================

  Rule("Completed patterns should have proper metadata", ({ RuleScenario }) => {
    RuleScenario(
      "Completed pattern with full metadata has no warnings",
      ({ Given, And, When, Then }) => {
        Given('a pattern with status "completed"', () => {
          state = initState();
          state.pattern.status = "completed";
        });

        And('the pattern has completion date "2026-01-09"', () => {
          state!.pattern.completed = "2026-01-09";
        });

        And('the pattern has effort planned "4h"', () => {
          state!.pattern.effortPlanned = "4h";
        });

        And('the pattern has effort actual "3h"', () => {
          state!.pattern.effortActual = "3h";
        });

        When("validating completion metadata", () => {
          state!.completionResult = validateCompletionMetadata(state!.pattern);
        });

        Then("validation passes", () => {
          expect(state!.completionResult!.valid).toBe(true);
        });

        And("there are no warnings", () => {
          expect(state!.completionResult!.warnings.length).toBe(0);
        });
      }
    );

    RuleScenario("Completed pattern without date shows warning", ({ Given, When, Then, And }) => {
      Given('a pattern with status "completed"', () => {
        state = initState();
        state.pattern.status = "completed";
      });

      When("validating completion metadata", () => {
        state!.completionResult = validateCompletionMetadata(state!.pattern);
      });

      Then("validation passes", () => {
        expect(state!.completionResult!.valid).toBe(true);
      });

      And('warnings include "missing @libar-docs-completed date"', () => {
        expect(
          state!.completionResult!.warnings.some((w) => w.includes("@libar-docs-completed"))
        ).toBe(true);
      });
    });

    RuleScenario(
      "Completed pattern with planned but no actual effort shows warning",
      ({ Given, And, When, Then }) => {
        Given('a pattern with status "completed"', () => {
          state = initState();
          state.pattern.status = "completed";
        });

        And('the pattern has completion date "2026-01-09"', () => {
          state!.pattern.completed = "2026-01-09";
        });

        And('the pattern has effort planned "4h"', () => {
          state!.pattern.effortPlanned = "4h";
        });

        When("validating completion metadata", () => {
          state!.completionResult = validateCompletionMetadata(state!.pattern);
        });

        Then("validation passes", () => {
          expect(state!.completionResult!.valid).toBe(true);
        });

        And('warnings include "missing @libar-docs-effort-actual"', () => {
          expect(
            state!.completionResult!.warnings.some((w) => w.includes("@libar-docs-effort-actual"))
          ).toBe(true);
        });
      }
    );

    RuleScenario(
      "Non-completed pattern skips metadata validation",
      ({ Given, When, Then, And }) => {
        Given('a pattern with status "roadmap"', () => {
          state = initState();
          state.pattern.status = "roadmap";
        });

        When("validating completion metadata", () => {
          state!.completionResult = validateCompletionMetadata(state!.pattern);
        });

        Then("validation passes", () => {
          expect(state!.completionResult!.valid).toBe(true);
        });

        And("there are no warnings", () => {
          expect(state!.completionResult!.warnings.length).toBe(0);
        });
      }
    );
  });

  // ===========================================================================
  // Protection Level Tests
  // ===========================================================================

  Rule("Protection levels match FSM state definitions", ({ RuleScenario }) => {
    RuleScenario("Roadmap status has no protection", ({ When, Then, And }) => {
      When('querying protection for status "roadmap"', () => {
        state = initState();
        state.protectionSummary = getProtectionSummary("roadmap");
      });

      Then('the protection level is "none"', () => {
        expect(state!.protectionSummary!.level).toBe("none");
      });

      And("deliverables can be added", () => {
        expect(state!.protectionSummary!.canAddDeliverables).toBe(true);
      });

      And("unlock is not required", () => {
        expect(state!.protectionSummary!.requiresUnlock).toBe(false);
      });
    });

    RuleScenario("Active status has scope protection", ({ When, Then, And }) => {
      When('querying protection for status "active"', () => {
        state = initState();
        state.protectionSummary = getProtectionSummary("active");
      });

      Then('the protection level is "scope"', () => {
        expect(state!.protectionSummary!.level).toBe("scope");
      });

      And("deliverables cannot be added", () => {
        expect(state!.protectionSummary!.canAddDeliverables).toBe(false);
      });

      And("unlock is not required", () => {
        expect(state!.protectionSummary!.requiresUnlock).toBe(false);
      });
    });

    RuleScenario("Completed status has hard protection", ({ When, Then, And }) => {
      When('querying protection for status "completed"', () => {
        state = initState();
        state.protectionSummary = getProtectionSummary("completed");
      });

      Then('the protection level is "hard"', () => {
        expect(state!.protectionSummary!.level).toBe("hard");
      });

      And("deliverables cannot be added", () => {
        expect(state!.protectionSummary!.canAddDeliverables).toBe(false);
      });

      And("unlock is required", () => {
        expect(state!.protectionSummary!.requiresUnlock).toBe(true);
      });
    });

    RuleScenario("Deferred status has no protection", ({ When, Then, And }) => {
      When('querying protection for status "deferred"', () => {
        state = initState();
        state.protectionSummary = getProtectionSummary("deferred");
      });

      Then('the protection level is "none"', () => {
        expect(state!.protectionSummary!.level).toBe("none");
      });

      And("deliverables can be added", () => {
        expect(state!.protectionSummary!.canAddDeliverables).toBe(true);
      });

      And("unlock is not required", () => {
        expect(state!.protectionSummary!.requiresUnlock).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Full Pattern Validation Tests
  // ===========================================================================

  Rule("Combined validation provides complete results", ({ RuleScenario }) => {
    RuleScenario(
      "Valid completed pattern returns combined results",
      ({ Given, And, When, Then }) => {
        Given('a pattern with status "completed"', () => {
          state = initState();
          state.pattern.status = "completed";
        });

        And('the pattern has completion date "2026-01-09"', () => {
          state!.pattern.completed = "2026-01-09";
        });

        When("validating pattern status", () => {
          state!.patternResult = validatePatternStatus(state!.pattern);
        });

        Then("status validation passes", () => {
          expect(state!.patternResult!.statusResult.valid).toBe(true);
        });

        And("completion validation passes", () => {
          expect(state!.patternResult!.completionResult.valid).toBe(true);
        });

        And("all warnings are collected", () => {
          expect(state!.patternResult!.allWarnings).toBeDefined();
          // Should have terminal state warning from status + any completion warnings
          expect(state!.patternResult!.allWarnings.length).toBeGreaterThan(0);
        });
      }
    );
  });
});
