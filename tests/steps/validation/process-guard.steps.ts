/**
 * Process Guard Step Definitions
 *
 * BDD step definitions for testing the process guard linter
 * that validates changes against PDR-005 FSM rules.
 *
 * Key insight: The decider is a pure function - tests create in-memory
 * ProcessState and ChangeDetection objects without any git operations.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  validateChanges,
  getViolationsByRule,
  type DeciderInput,
  type DeciderOutput,
  type ProcessState,
  type FileState,
  type SessionState,
  type ChangeDetection,
  type ProcessGuardRule,
} from "../../../src/lint/process-guard/index.js";
import { getProtectionLevel } from "../../../src/validation/fsm/index.js";
import type { ProcessStatusValue, NormalizedStatus } from "../../../src/taxonomy/index.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface ProcessGuardTestState {
  // Files being built
  files: Map<string, FileState>;
  activeSession: SessionState | undefined;

  // Current file context (for step-by-step building)
  currentFile: string;

  // Changes being built
  modifiedFiles: string[];
  statusTransitions: Map<string, StatusTransition>;
  deliverableChanges: Map<string, DeliverableChange>;

  // Options
  strict: boolean;
  ignoreSession: boolean;

  // Output
  output: DeciderOutput | null;
}

// =============================================================================
// Module-level State
// =============================================================================

let state: ProcessGuardTestState | null = null;

function initState(): ProcessGuardTestState {
  return {
    files: new Map(),
    activeSession: undefined,
    currentFile: "",
    modifiedFiles: [],
    statusTransitions: new Map(),
    deliverableChanges: new Map(),
    strict: false,
    ignoreSession: false,
    output: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeStatus(status: ProcessStatusValue): NormalizedStatus {
  if (status === "roadmap" || status === "deferred") return "planned";
  if (status === "active") return "active";
  return "completed";
}

function createFileState(
  relativePath: string,
  status: ProcessStatusValue,
  options: {
    deliverables?: readonly string[];
    hasUnlockReason?: boolean;
    unlockReason?: string;
  } = {}
): FileState {
  const { deliverables = [], hasUnlockReason = false, unlockReason } = options;

  const fileState: FileState = {
    path: `/project/${relativePath}`,
    relativePath,
    status,
    normalizedStatus: normalizeStatus(status),
    protection: getProtectionLevel(status),
    deliverables,
    hasUnlockReason,
  };

  // Handle exactOptionalPropertyTypes
  if (unlockReason !== undefined) {
    (fileState as { unlockReason?: string }).unlockReason = unlockReason;
  }

  return fileState;
}

function createSessionState(
  id: string,
  scopedSpecs: readonly string[],
  excludedSpecs: readonly string[] = []
): SessionState {
  return {
    id,
    status: "active",
    scopedSpecs,
    excludedSpecs,
    sessionFile: `/project/sessions/${id}.feature`,
  };
}

function buildProcessState(): ProcessState {
  const processState: ProcessState = {
    files: state!.files,
    taxonomyHash: "test-hash-1234",
    derivedAt: new Date().toISOString(),
  };

  // Handle exactOptionalPropertyTypes
  if (state!.activeSession !== undefined) {
    (processState as { activeSession?: SessionState }).activeSession = state!.activeSession;
  }

  return processState;
}

function buildChangeDetection(): ChangeDetection {
  return {
    modifiedFiles: state!.modifiedFiles,
    addedFiles: [],
    deletedFiles: [],
    statusTransitions: state!.statusTransitions,
    deliverableChanges: state!.deliverableChanges,
    taxonomyModified: false,
  };
}

function executeValidation(): void {
  const input: DeciderInput = {
    state: buildProcessState(),
    changes: buildChangeDetection(),
    options: {
      strict: state!.strict,
      ignoreSession: state!.ignoreSession,
    },
  };

  state!.output = validateChanges(input);
}

function getViolationForRule(
  rule: ProcessGuardRule
): ReturnType<typeof getViolationsByRule>[number] | undefined {
  if (!state!.output) return undefined;
  const violations = getViolationsByRule(state!.output.result, rule);
  return violations[0];
}

function getWarningForRule(
  rule: ProcessGuardRule
): ReturnType<typeof getViolationsByRule>[number] | undefined {
  if (!state!.output) return undefined;
  const warnings = state!.output.result.warnings.filter((w) => w.rule === rule);
  return warnings[0];
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/validation/process-guard.feature");

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given("a process guard validation context", () => {
      state = initState();
    });
  });

  // ===========================================================================
  // completed-protection Rule
  // ===========================================================================

  Rule(
    "Completed files require unlock-reason to modify",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario(
        "Completed file with unlock-reason passes validation",
        ({ Given, And, When, Then }) => {
          Given('a file "specs/phase-14.feature" with status "completed"', () => {
            const fileState = createFileState("specs/phase-14.feature", "completed");
            state!.files.set("specs/phase-14.feature", fileState);
            state!.currentFile = "specs/phase-14.feature";
          });

          And('the file has unlock-reason "Bug fix for critical issue"', () => {
            const existing = state!.files.get(state!.currentFile)!;
            const updated = createFileState(existing.relativePath, existing.status, {
              deliverables: existing.deliverables,
              hasUnlockReason: true,
              unlockReason: "Bug fix for critical issue",
            });
            state!.files.set(state!.currentFile, updated);
          });

          When("the file is modified", () => {
            state!.modifiedFiles.push(state!.currentFile);
          });

          And("validating changes", () => {
            executeValidation();
          });

          Then("validation passes", () => {
            expect(state!.output!.result.valid).toBe(true);
          });

          And("no violations are reported", () => {
            expect(state!.output!.result.violations.length).toBe(0);
          });
        }
      );

      RuleScenario(
        "Completed file without unlock-reason fails validation",
        ({ Given, And, When, Then }) => {
          Given('a file "specs/phase-14.feature" with status "completed"', () => {
            const fileState = createFileState("specs/phase-14.feature", "completed");
            state!.files.set("specs/phase-14.feature", fileState);
            state!.currentFile = "specs/phase-14.feature";
          });

          And("the file does not have unlock-reason", () => {
            // Default state - no unlock reason
          });

          When("the file is modified", () => {
            state!.modifiedFiles.push(state!.currentFile);
          });

          And("validating changes", () => {
            executeValidation();
          });

          Then("validation fails", () => {
            expect(state!.output!.result.valid).toBe(false);
          });

          And('violation "completed-protection" is reported for "specs/phase-14.feature"', () => {
            const violation = getViolationForRule("completed-protection");
            expect(violation).toBeDefined();
            expect(violation!.file).toBe("specs/phase-14.feature");
          });

          And('the suggestion contains "unlock-reason"', () => {
            const violation = getViolationForRule("completed-protection");
            expect(violation!.suggestion).toContain("unlock-reason");
          });
        }
      );

      RuleScenarioOutline(
        "Protection levels and unlock requirement",
        ({ Given, And, When, Then }, variables: { status: string; expected: string }) => {
          Given('a file "specs/test.feature" with status {string}', () => {
            const fileState = createFileState(
              "specs/test.feature",
              variables.status as ProcessStatusValue
            );
            state!.files.set("specs/test.feature", fileState);
            state!.currentFile = "specs/test.feature";
          });

          And("the file does not have unlock-reason", () => {
            // Default state
          });

          When("the file is modified", () => {
            state!.modifiedFiles.push(state!.currentFile);
          });

          And("validating changes", () => {
            executeValidation();
          });

          Then("completed-protection violation is expected {string}", () => {
            const violation = getViolationForRule("completed-protection");
            const expectViolation = variables.expected === "yes";
            if (expectViolation) {
              expect(violation).toBeDefined();
            } else {
              expect(violation).toBeUndefined();
            }
          });
        }
      );
    }
  );

  // ===========================================================================
  // invalid-status-transition Rule
  // ===========================================================================

  Rule("Status transitions must follow PDR-005 FSM", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      "Valid transitions pass validation",
      ({ Given, When, And, Then }, variables: { from: string; to: string }) => {
        Given('a file "specs/feature.feature" with status {string}', () => {
          const fileState = createFileState(
            "specs/feature.feature",
            variables.from as ProcessStatusValue
          );
          state!.files.set("specs/feature.feature", fileState);
          state!.currentFile = "specs/feature.feature";
        });

        When("the status changes to {string}", () => {
          state!.modifiedFiles.push(state!.currentFile);
          state!.statusTransitions.set(state!.currentFile, {
            from: variables.from as ProcessStatusValue,
            to: variables.to as ProcessStatusValue,
          });
        });

        And("validating changes", () => {
          executeValidation();
        });

        Then('no "invalid-status-transition" violation is reported', () => {
          const violation = getViolationForRule("invalid-status-transition");
          expect(violation).toBeUndefined();
        });
      }
    );

    RuleScenarioOutline(
      "Invalid transitions fail validation",
      ({ Given, When, And, Then }, variables: { from: string; to: string }) => {
        Given('a file "specs/feature.feature" with status {string}', () => {
          const fileState = createFileState(
            "specs/feature.feature",
            variables.from as ProcessStatusValue
          );
          state!.files.set("specs/feature.feature", fileState);
          state!.currentFile = "specs/feature.feature";
        });

        When("the status changes to {string}", () => {
          state!.modifiedFiles.push(state!.currentFile);
          state!.statusTransitions.set(state!.currentFile, {
            from: variables.from as ProcessStatusValue,
            to: variables.to as ProcessStatusValue,
          });
        });

        And("validating changes", () => {
          executeValidation();
        });

        Then(
          'violation "invalid-status-transition" is reported for "specs/feature.feature"',
          () => {
            const violation = getViolationForRule("invalid-status-transition");
            expect(violation).toBeDefined();
            expect(violation!.file).toBe("specs/feature.feature");
          }
        );

        And("the message contains {string}", () => {
          const violation = getViolationForRule("invalid-status-transition");
          expect(violation!.message).toContain(variables.from);
        });

        And("the suggestion contains valid transitions", () => {
          const violation = getViolationForRule("invalid-status-transition");
          expect(violation!.suggestion).toBeDefined();
        });
      }
    );
  });

  // ===========================================================================
  // scope-creep Rule
  // ===========================================================================

  Rule("Active specs cannot add new deliverables", ({ RuleScenario }) => {
    RuleScenario("Active spec with no deliverable changes passes", ({ Given, And, When, Then }) => {
      Given('a file "specs/active-phase.feature" with status "active"', () => {
        const fileState = createFileState("specs/active-phase.feature", "active", {
          deliverables: ["Type definitions", "Unit tests"],
        });
        state!.files.set("specs/active-phase.feature", fileState);
        state!.currentFile = "specs/active-phase.feature";
      });

      And('the file has deliverables "Type definitions" and "Unit tests"', () => {
        // Already set in previous step
      });

      When("the file is modified without adding deliverables", () => {
        state!.modifiedFiles.push(state!.currentFile);
        // No deliverable changes
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('no "scope-creep" violation is reported', () => {
        const violation = getViolationForRule("scope-creep");
        expect(violation).toBeUndefined();
      });
    });

    RuleScenario(
      "Active spec adding deliverable fails validation",
      ({ Given, And, When, Then }) => {
        Given('a file "specs/active-phase.feature" with status "active"', () => {
          const fileState = createFileState("specs/active-phase.feature", "active", {
            deliverables: ["Type definitions"],
          });
          state!.files.set("specs/active-phase.feature", fileState);
          state!.currentFile = "specs/active-phase.feature";
        });

        And('the file has deliverables "Type definitions"', () => {
          // Already set
        });

        When('the deliverable "New unplanned feature" is added', () => {
          state!.modifiedFiles.push(state!.currentFile);
          state!.deliverableChanges.set(state!.currentFile, {
            added: ["New unplanned feature"],
            removed: [],
            modified: [],
          });
        });

        And("validating changes", () => {
          executeValidation();
        });

        Then('violation "scope-creep" is reported for "specs/active-phase.feature"', () => {
          const violation = getViolationForRule("scope-creep");
          expect(violation).toBeDefined();
          expect(violation!.file).toBe("specs/active-phase.feature");
        });

        And('the message contains "New unplanned feature"', () => {
          const violation = getViolationForRule("scope-creep");
          expect(violation!.message).toContain("New unplanned feature");
        });
      }
    );

    RuleScenario("Roadmap spec can add deliverables freely", ({ Given, When, And, Then }) => {
      Given('a file "specs/roadmap-phase.feature" with status "roadmap"', () => {
        const fileState = createFileState("specs/roadmap-phase.feature", "roadmap");
        state!.files.set("specs/roadmap-phase.feature", fileState);
        state!.currentFile = "specs/roadmap-phase.feature";
      });

      When('the deliverable "Additional feature" is added', () => {
        state!.modifiedFiles.push(state!.currentFile);
        state!.deliverableChanges.set(state!.currentFile, {
          added: ["Additional feature"],
          removed: [],
          modified: [],
        });
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('no "scope-creep" violation is reported', () => {
        const violation = getViolationForRule("scope-creep");
        expect(violation).toBeUndefined();
      });
    });

    RuleScenario("Removing deliverable produces warning", ({ Given, And, When, Then }) => {
      Given('a file "specs/active-phase.feature" with status "active"', () => {
        const fileState = createFileState("specs/active-phase.feature", "active", {
          deliverables: ["Type definitions", "Unit tests"],
        });
        state!.files.set("specs/active-phase.feature", fileState);
        state!.currentFile = "specs/active-phase.feature";
      });

      And('the file has deliverables "Type definitions" and "Unit tests"', () => {
        // Already set
      });

      When('the deliverable "Unit tests" is removed', () => {
        state!.modifiedFiles.push(state!.currentFile);
        state!.deliverableChanges.set(state!.currentFile, {
          added: [],
          removed: ["Unit tests"],
          modified: [],
        });
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('warning "deliverable-removed" is reported for "specs/active-phase.feature"', () => {
        const warning = getWarningForRule("deliverable-removed");
        expect(warning).toBeDefined();
        expect(warning!.file).toBe("specs/active-phase.feature");
      });

      And('the message contains "Unit tests"', () => {
        const warning = getWarningForRule("deliverable-removed");
        expect(warning!.message).toContain("Unit tests");
      });
    });

    RuleScenario(
      "Deliverable status change does not trigger scope-creep",
      ({ Given, And, When, Then }) => {
        Given('a file "specs/active-phase.feature" with status "active"', () => {
          const fileState = createFileState("specs/active-phase.feature", "active", {
            deliverables: ["Type definitions"],
          });
          state!.files.set("specs/active-phase.feature", fileState);
          state!.currentFile = "specs/active-phase.feature";
        });

        And('the file has deliverables "Type definitions"', () => {
          // Already set
        });

        When('the deliverable "Type definitions" status changes', () => {
          state!.modifiedFiles.push(state!.currentFile);
          state!.deliverableChanges.set(state!.currentFile, {
            added: [],
            removed: [],
            modified: ["Type definitions"],
          });
        });

        And("validating changes", () => {
          executeValidation();
        });

        Then('no "scope-creep" violation is reported', () => {
          const violation = getViolationForRule("scope-creep");
          expect(violation).toBeUndefined();
        });

        And('no "deliverable-removed" warning is reported', () => {
          const warning = getWarningForRule("deliverable-removed");
          expect(warning).toBeUndefined();
        });
      }
    );

    RuleScenario(
      "Multiple deliverable status changes pass validation",
      ({ Given, And, When, Then }) => {
        Given('a file "specs/active-phase.feature" with status "active"', () => {
          const fileState = createFileState("specs/active-phase.feature", "active", {
            deliverables: ["Type definitions", "Unit tests"],
          });
          state!.files.set("specs/active-phase.feature", fileState);
          state!.currentFile = "specs/active-phase.feature";
        });

        And('the file has deliverables "Type definitions" and "Unit tests"', () => {
          // Already set
        });

        When('the deliverables "Type definitions" and "Unit tests" status change', () => {
          state!.modifiedFiles.push(state!.currentFile);
          state!.deliverableChanges.set(state!.currentFile, {
            added: [],
            removed: [],
            modified: ["Type definitions", "Unit tests"],
          });
        });

        And("validating changes", () => {
          executeValidation();
        });

        Then('no "scope-creep" violation is reported', () => {
          const violation = getViolationForRule("scope-creep");
          expect(violation).toBeUndefined();
        });

        And('no "deliverable-removed" warning is reported', () => {
          const warning = getWarningForRule("deliverable-removed");
          expect(warning).toBeUndefined();
        });
      }
    );
  });

  // ===========================================================================
  // session-scope Rule
  // ===========================================================================

  Rule("Files outside active session scope trigger warnings", ({ RuleScenario }) => {
    RuleScenario("File in session scope passes validation", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", []);
      });

      And('the session scopes specs "phase-44" and "phase-45"', () => {
        state!.activeSession = createSessionState("session-2026-01", ["phase-44", "phase-45"]);
      });

      And('a file "specs/phase-44.feature" with status "active"', () => {
        const fileState = createFileState("specs/phase-44.feature", "active");
        state!.files.set("specs/phase-44.feature", fileState);
        state!.currentFile = "specs/phase-44.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('no "session-scope" violation is reported', () => {
        const violation = getViolationForRule("session-scope");
        const warning = getWarningForRule("session-scope");
        expect(violation).toBeUndefined();
        expect(warning).toBeUndefined();
      });
    });

    RuleScenario("File outside session scope triggers warning", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", []);
      });

      And('the session scopes specs "phase-44"', () => {
        state!.activeSession = createSessionState("session-2026-01", ["phase-44"]);
      });

      And('a file "specs/phase-99.feature" with status "active"', () => {
        const fileState = createFileState("specs/phase-99.feature", "active");
        state!.files.set("specs/phase-99.feature", fileState);
        state!.currentFile = "specs/phase-99.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('warning "session-scope" is reported for "specs/phase-99.feature"', () => {
        const warning = getWarningForRule("session-scope");
        expect(warning).toBeDefined();
        expect(warning!.file).toBe("specs/phase-99.feature");
      });
    });

    RuleScenario("No active session means all files in scope", ({ Given, And, When, Then }) => {
      Given("no active session", () => {
        state!.activeSession = undefined;
      });

      And('a file "specs/any-phase.feature" with status "active"', () => {
        const fileState = createFileState("specs/any-phase.feature", "active");
        state!.files.set("specs/any-phase.feature", fileState);
        state!.currentFile = "specs/any-phase.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('no "session-scope" violation is reported', () => {
        const violation = getViolationForRule("session-scope");
        const warning = getWarningForRule("session-scope");
        expect(violation).toBeUndefined();
        expect(warning).toBeUndefined();
      });
    });

    RuleScenario("ignoreSession flag suppresses session warnings", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", []);
      });

      And('the session scopes specs "phase-44"', () => {
        state!.activeSession = createSessionState("session-2026-01", ["phase-44"]);
      });

      And('a file "specs/phase-99.feature" with status "active"', () => {
        const fileState = createFileState("specs/phase-99.feature", "active");
        state!.files.set("specs/phase-99.feature", fileState);
        state!.currentFile = "specs/phase-99.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes with ignoreSession flag", () => {
        state!.ignoreSession = true;
        executeValidation();
      });

      Then('no "session-scope" violation is reported', () => {
        const violation = getViolationForRule("session-scope");
        const warning = getWarningForRule("session-scope");
        expect(violation).toBeUndefined();
        expect(warning).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // session-excluded Rule
  // ===========================================================================

  Rule("Explicitly excluded files trigger errors", ({ RuleScenario }) => {
    RuleScenario("Excluded file triggers error", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], []);
      });

      And('the session excludes specs "phase-legacy"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], ["phase-legacy"]);
      });

      And('a file "specs/phase-legacy.feature" with status "roadmap"', () => {
        const fileState = createFileState("specs/phase-legacy.feature", "roadmap");
        state!.files.set("specs/phase-legacy.feature", fileState);
        state!.currentFile = "specs/phase-legacy.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('violation "session-excluded" is reported for "specs/phase-legacy.feature"', () => {
        const violation = getViolationForRule("session-excluded");
        expect(violation).toBeDefined();
        expect(violation!.file).toBe("specs/phase-legacy.feature");
      });
    });

    RuleScenario("Non-excluded file passes validation", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], []);
      });

      And('the session excludes specs "phase-legacy"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], ["phase-legacy"]);
      });

      And('a file "specs/phase-44.feature" with status "active"', () => {
        const fileState = createFileState("specs/phase-44.feature", "active");
        state!.files.set("specs/phase-44.feature", fileState);
        state!.currentFile = "specs/phase-44.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('no "session-excluded" violation is reported', () => {
        const violation = getViolationForRule("session-excluded");
        expect(violation).toBeUndefined();
      });
    });

    RuleScenario("ignoreSession flag suppresses excluded errors", ({ Given, And, When, Then }) => {
      Given('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], []);
      });

      And('the session excludes specs "phase-legacy"', () => {
        state!.activeSession = createSessionState("session-2026-01", [], ["phase-legacy"]);
      });

      And('a file "specs/phase-legacy.feature" with status "roadmap"', () => {
        const fileState = createFileState("specs/phase-legacy.feature", "roadmap");
        state!.files.set("specs/phase-legacy.feature", fileState);
        state!.currentFile = "specs/phase-legacy.feature";
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes with ignoreSession flag", () => {
        state!.ignoreSession = true;
        executeValidation();
      });

      Then('no "session-excluded" violation is reported', () => {
        const violation = getViolationForRule("session-excluded");
        expect(violation).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Combined Validation Tests
  // ===========================================================================

  Rule("Multiple rules validate independently", ({ RuleScenario }) => {
    RuleScenario("Multiple violations from different rules", ({ Given, And, When, Then }) => {
      Given('a file "specs/completed.feature" with status "completed"', () => {
        const fileState = createFileState("specs/completed.feature", "completed");
        state!.files.set("specs/completed.feature", fileState);
        state!.currentFile = "specs/completed.feature";
      });

      And("the file does not have unlock-reason", () => {
        // Default state
      });

      And('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", []);
      });

      And('the session scopes specs "other-phase"', () => {
        state!.activeSession = createSessionState("session-2026-01", ["other-phase"]);
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then('violation "completed-protection" is reported', () => {
        const violation = getViolationForRule("completed-protection");
        expect(violation).toBeDefined();
      });

      And('warning "session-scope" is reported', () => {
        const warning = getWarningForRule("session-scope");
        expect(warning).toBeDefined();
      });
    });

    RuleScenario("Strict mode promotes warnings to errors", ({ Given, And, When, Then }) => {
      Given('a file "specs/out-of-scope.feature" with status "active"', () => {
        const fileState = createFileState("specs/out-of-scope.feature", "active");
        state!.files.set("specs/out-of-scope.feature", fileState);
        state!.currentFile = "specs/out-of-scope.feature";
      });

      And('an active session "session-2026-01"', () => {
        state!.activeSession = createSessionState("session-2026-01", []);
      });

      And('the session scopes specs "in-scope-phase"', () => {
        state!.activeSession = createSessionState("session-2026-01", ["in-scope-phase"]);
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes with strict mode", () => {
        state!.strict = true;
        executeValidation();
      });

      Then("validation fails", () => {
        expect(state!.output!.result.valid).toBe(false);
      });

      And('violation "session-scope" is reported with severity "error"', () => {
        const violation = getViolationForRule("session-scope");
        expect(violation).toBeDefined();
        expect(violation!.severity).toBe("error");
      });
    });

    RuleScenario("Clean change produces empty violations", ({ Given, And, When, Then }) => {
      Given('a file "specs/roadmap.feature" with status "roadmap"', () => {
        const fileState = createFileState("specs/roadmap.feature", "roadmap");
        state!.files.set("specs/roadmap.feature", fileState);
        state!.currentFile = "specs/roadmap.feature";
      });

      And("no active session", () => {
        state!.activeSession = undefined;
      });

      When("the file is modified", () => {
        state!.modifiedFiles.push(state!.currentFile);
      });

      And("validating changes", () => {
        executeValidation();
      });

      Then("validation passes", () => {
        expect(state!.output!.result.valid).toBe(true);
      });

      And("no violations are reported", () => {
        expect(state!.output!.result.violations.length).toBe(0);
      });

      And("no warnings are reported", () => {
        expect(state!.output!.result.warnings.length).toBe(0);
      });
    });
  });
});
