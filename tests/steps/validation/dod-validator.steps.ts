/**
 * Step definitions for DoD (Definition of Done) Validator tests
 *
 * Tests the validation logic that ensures completed phases meet DoD criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type {
  Deliverable,
  ScannedGherkinFile,
  GherkinScenario,
} from '../../../src/validation-schemas/index.js';
import type { DoDValidationResult, DoDValidationSummary } from '../../../src/validation/types.js';
import {
  isDeliverableComplete,
  hasAcceptanceCriteria,
  extractAcceptanceCriteriaScenarios,
  validateDoDForPhase,
  validateDoD,
  formatDoDSummary,
} from '../../../src/validation/dod-validator.js';

const feature = await loadFeature('tests/features/validation/dod-validator.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  deliverable: Deliverable | null;
  feature: ScannedGherkinFile | null;
  features: ScannedGherkinFile[];
  isComplete: boolean | null;
  hasAC: boolean | null;
  extractedScenarios: readonly string[];
  dodResult: DoDValidationResult | null;
  dodSummary: DoDValidationSummary | null;
  formattedOutput: string;
  // For building features in steps
  patternName: string;
  phase: number;
  deliverables: Deliverable[];
  scenarios: GherkinScenario[];
}

let state: TestState;

function resetState(): void {
  state = {
    deliverable: null,
    feature: null,
    features: [],
    isComplete: null,
    hasAC: null,
    extractedScenarios: [],
    dodResult: null,
    dodSummary: null,
    formattedOutput: '',
    patternName: '',
    phase: 0,
    deliverables: [],
    scenarios: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function createDeliverable(name: string, status: string): Deliverable {
  return {
    name,
    status,
    tests: 0,
    location: 'src/',
  };
}

function createScenario(name: string, tags: string[]): GherkinScenario {
  return {
    name,
    tags,
    steps: [],
    line: 10,
  };
}

function createMockFeature(
  patternName: string,
  phase: number,
  status: string,
  deliverables: Deliverable[],
  scenarios: GherkinScenario[]
): ScannedGherkinFile {
  // Create background with deliverables table if deliverables exist
  // Uses "Deliverable" column header per extractDeliverables expectations
  const backgroundSteps =
    deliverables.length > 0
      ? [
          {
            keyword: 'Given',
            text: 'the following deliverables:',
            dataTable: {
              headers: ['Deliverable', 'Status', 'Tests', 'Location'],
              rows: deliverables.map((d) => ({
                Deliverable: d.name,
                Status: d.status,
                Tests: String(d.tests),
                Location: d.location,
              })),
            },
          },
        ]
      : [];

  return {
    filePath: `/test/features/${patternName.toLowerCase()}.feature`,
    feature: {
      name: patternName,
      description: `Test feature for ${patternName}`,
      // Use libar-process-* tags (required by extractProcessMetadata)
      tags: [
        `libar-process-pattern:${patternName}`,
        `libar-process-phase:${String(phase).padStart(2, '0')}`,
        `libar-process-status:${status}`,
      ],
      language: 'en',
      line: 1,
    },
    background:
      backgroundSteps.length > 0
        ? {
            name: 'Deliverables',
            steps: backgroundSteps,
            line: 5,
          }
        : undefined,
    scenarios,
  };
}

function createFeatureWithScenarios(scenarios: GherkinScenario[]): ScannedGherkinFile {
  return {
    filePath: '/test/features/test.feature',
    feature: {
      name: 'Test Feature',
      description: 'Test feature',
      tags: [],
      language: 'en',
      line: 1,
    },
    scenarios,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule: Deliverables can be marked complete in various formats
  // ===========================================================================

  Rule('Deliverables can be marked complete in various formats', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Text-based completion statuses are detected',
      ({ Given, When, Then }, variables: { status: string }) => {
        resetState();

        Given('a deliverable with status {string}', () => {
          state.deliverable = createDeliverable('Test Deliverable', variables.status);
        });

        When('checking if deliverable is complete', () => {
          state.isComplete = isDeliverableComplete(state.deliverable!);
        });

        Then('the deliverable is considered complete', () => {
          expect(state.isComplete).toBe(true);
        });
      }
    );

    RuleScenarioOutline(
      'Symbol-based completion statuses are detected',
      ({ Given, When, Then }, variables: { status: string }) => {
        resetState();

        Given('a deliverable with status {string}', () => {
          state.deliverable = createDeliverable('Test Deliverable', variables.status);
        });

        When('checking if deliverable is complete', () => {
          state.isComplete = isDeliverableComplete(state.deliverable!);
        });

        Then('the deliverable is considered complete', () => {
          expect(state.isComplete).toBe(true);
        });
      }
    );

    RuleScenarioOutline(
      'Incomplete statuses are correctly identified',
      ({ Given, When, Then }, variables: { status: string }) => {
        resetState();

        Given('a deliverable with status {string}', () => {
          state.deliverable = createDeliverable('Test Deliverable', variables.status);
        });

        When('checking if deliverable is complete', () => {
          state.isComplete = isDeliverableComplete(state.deliverable!);
        });

        Then('the deliverable is NOT considered complete', () => {
          expect(state.isComplete).toBe(false);
        });
      }
    );
  });

  // ===========================================================================
  // Rule: Acceptance criteria must be tagged with @acceptance-criteria
  // ===========================================================================

  Rule('Acceptance criteria must be tagged with @acceptance-criteria', ({ RuleScenario }) => {
    RuleScenario('Feature with @acceptance-criteria scenario passes', ({ Given, When, Then }) => {
      resetState();

      Given(
        'a feature with scenarios:',
        (_ctx, dataTable: Array<{ name: string; tags: string }>) => {
          const scenarios = dataTable.map((row) =>
            createScenario(
              row.name,
              row.tags.split(',').map((t) => t.trim())
            )
          );
          state.feature = createFeatureWithScenarios(scenarios);
        }
      );

      When('checking for acceptance criteria', () => {
        state.hasAC = hasAcceptanceCriteria(state.feature!);
      });

      Then('acceptance criteria is found', () => {
        expect(state.hasAC).toBe(true);
      });
    });

    RuleScenario('Feature without @acceptance-criteria fails', ({ Given, When, Then }) => {
      resetState();

      Given(
        'a feature with scenarios:',
        (_ctx, dataTable: Array<{ name: string; tags: string }>) => {
          const scenarios = dataTable.map((row) =>
            createScenario(
              row.name,
              row.tags.split(',').map((t) => t.trim())
            )
          );
          state.feature = createFeatureWithScenarios(scenarios);
        }
      );

      When('checking for acceptance criteria', () => {
        state.hasAC = hasAcceptanceCriteria(state.feature!);
      });

      Then('acceptance criteria is NOT found', () => {
        expect(state.hasAC).toBe(false);
      });
    });

    RuleScenario('Tag matching is case-insensitive', ({ Given, When, Then }) => {
      resetState();

      Given(
        'a feature with scenarios:',
        (_ctx, dataTable: Array<{ name: string; tags: string }>) => {
          const scenarios = dataTable.map((row) =>
            createScenario(
              row.name,
              row.tags.split(',').map((t) => t.trim())
            )
          );
          state.feature = createFeatureWithScenarios(scenarios);
        }
      );

      When('checking for acceptance criteria', () => {
        state.hasAC = hasAcceptanceCriteria(state.feature!);
      });

      Then('acceptance criteria is found', () => {
        expect(state.hasAC).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Rule: Acceptance criteria scenarios can be extracted by name
  // ===========================================================================

  Rule('Acceptance criteria scenarios can be extracted by name', ({ RuleScenario }) => {
    RuleScenario('Extract multiple AC scenario names', ({ Given, When, Then }) => {
      resetState();

      Given(
        'a feature with scenarios:',
        (_ctx, dataTable: Array<{ name: string; tags: string }>) => {
          const scenarios = dataTable.map((row) =>
            createScenario(
              row.name,
              row.tags.split(',').map((t) => t.trim())
            )
          );
          state.feature = createFeatureWithScenarios(scenarios);
        }
      );

      When('extracting acceptance criteria scenarios', () => {
        state.extractedScenarios = extractAcceptanceCriteriaScenarios(state.feature!);
      });

      Then('the extracted scenarios are:', (_ctx, dataTable: Array<{ name: string }>) => {
        const expectedNames = dataTable.map((row) => row.name);
        expect(state.extractedScenarios).toEqual(expectedNames);
      });
    });

    RuleScenario('No AC scenarios returns empty list', ({ Given, When, Then }) => {
      resetState();

      Given(
        'a feature with scenarios:',
        (_ctx, dataTable: Array<{ name: string; tags: string }>) => {
          const scenarios = dataTable.map((row) =>
            createScenario(
              row.name,
              row.tags.split(',').map((t) => t.trim())
            )
          );
          state.feature = createFeatureWithScenarios(scenarios);
        }
      );

      When('extracting acceptance criteria scenarios', () => {
        state.extractedScenarios = extractAcceptanceCriteriaScenarios(state.feature!);
      });

      Then('no scenarios are extracted', () => {
        expect(state.extractedScenarios).toEqual([]);
      });
    });
  });

  // ===========================================================================
  // Rule: DoD requires all deliverables complete and AC present
  // ===========================================================================

  Rule('DoD requires all deliverables complete and AC present', ({ RuleScenario }) => {
    RuleScenario(
      'Phase with all deliverables complete and AC passes',
      ({ Given, When, Then, And }) => {
        Given(
          'a feature for phase {int} pattern {string}',
          (_ctx, phaseNum: number, pattern: string) => {
            resetState(); // Reset state at start of scenario
            state.patternName = pattern;
            state.phase = phaseNum;
          }
        );

        And(
          'deliverables with statuses:',
          (_ctx, dataTable: Array<{ name: string; status: string }>) => {
            for (const row of dataTable) {
              state.deliverables.push(createDeliverable(row.name, row.status));
            }
          }
        );

        And('a scenario with tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
          const tags = dataTable.map((row) => row.tag);
          state.scenarios.push(createScenario('Acceptance Test', tags));
        });

        When('validating DoD for the phase', () => {
          state.feature = createMockFeature(
            state.patternName,
            state.phase,
            'completed',
            state.deliverables,
            state.scenarios
          );
          state.dodResult = validateDoDForPhase(state.patternName, state.phase, state.feature);
        });

        Then('DoD is met', () => {
          expect(state.dodResult!.isDoDMet).toBe(true);
        });

        And('the result message contains {string}', (_ctx, substring: string) => {
          const allMessages = state.dodResult!.messages.join(' ');
          expect(allMessages).toContain(substring);
        });
      }
    );

    RuleScenario('Phase with incomplete deliverables fails', ({ Given, When, Then, And }) => {
      Given(
        'a feature for phase {int} pattern {string}',
        (_ctx, phaseNum: number, pattern: string) => {
          resetState(); // Reset state at start of scenario
          state.patternName = pattern;
          state.phase = phaseNum;
        }
      );

      And(
        'deliverables with statuses:',
        (_ctx, dataTable: Array<{ name: string; status: string }>) => {
          for (const row of dataTable) {
            state.deliverables.push(createDeliverable(row.name, row.status));
          }
        }
      );

      And('a scenario with tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        const tags = dataTable.map((row) => row.tag);
        state.scenarios.push(createScenario('Acceptance Test', tags));
      });

      When('validating DoD for the phase', () => {
        state.feature = createMockFeature(
          state.patternName,
          state.phase,
          'completed',
          state.deliverables,
          state.scenarios
        );
        state.dodResult = validateDoDForPhase(state.patternName, state.phase, state.feature);
      });

      Then('DoD is NOT met', () => {
        expect(state.dodResult!.isDoDMet).toBe(false);
      });

      And('the result has {int} incomplete deliverables', (_ctx, count: number) => {
        expect(state.dodResult!.incompleteDeliverables.length).toBe(count);
      });

      And('the result message contains {string}', (_ctx, substring: string) => {
        const allMessages = state.dodResult!.messages.join(' ');
        expect(allMessages).toContain(substring);
      });
    });

    RuleScenario('Phase without acceptance criteria fails', ({ Given, When, Then, And }) => {
      Given(
        'a feature for phase {int} pattern {string}',
        (_ctx, phaseNum: number, pattern: string) => {
          resetState(); // Reset state at start of scenario
          state.patternName = pattern;
          state.phase = phaseNum;
        }
      );

      And(
        'deliverables with statuses:',
        (_ctx, dataTable: Array<{ name: string; status: string }>) => {
          for (const row of dataTable) {
            state.deliverables.push(createDeliverable(row.name, row.status));
          }
        }
      );

      And('a scenario with tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        const tags = dataTable.map((row) => row.tag);
        state.scenarios.push(createScenario('Non-AC Test', tags));
      });

      When('validating DoD for the phase', () => {
        state.feature = createMockFeature(
          state.patternName,
          state.phase,
          'completed',
          state.deliverables,
          state.scenarios
        );
        state.dodResult = validateDoDForPhase(state.patternName, state.phase, state.feature);
      });

      Then('DoD is NOT met', () => {
        expect(state.dodResult!.isDoDMet).toBe(false);
      });

      And('the result message contains {string}', (_ctx, substring: string) => {
        const allMessages = state.dodResult!.messages.join(' ');
        expect(allMessages).toContain(substring);
      });
    });

    RuleScenario('Phase without deliverables fails', ({ Given, When, Then, And }) => {
      Given(
        'a feature for phase {int} pattern {string} with no deliverables',
        (_ctx, phaseNum: number, pattern: string) => {
          resetState(); // Reset state at start of scenario
          state.patternName = pattern;
          state.phase = phaseNum;
        }
      );

      And('a scenario with tags:', (_ctx, dataTable: Array<{ tag: string }>) => {
        const tags = dataTable.map((row) => row.tag);
        state.scenarios.push(createScenario('Acceptance Test', tags));
      });

      When('validating DoD for the phase', () => {
        state.feature = createMockFeature(
          state.patternName,
          state.phase,
          'completed',
          [],
          state.scenarios
        );
        state.dodResult = validateDoDForPhase(state.patternName, state.phase, state.feature);
      });

      Then('DoD is NOT met', () => {
        expect(state.dodResult!.isDoDMet).toBe(false);
      });

      And('the result message contains {string}', (_ctx, substring: string) => {
        const allMessages = state.dodResult!.messages.join(' ');
        expect(allMessages).toContain(substring);
      });
    });
  });

  // ===========================================================================
  // Rule: DoD can be validated across multiple completed phases
  // ===========================================================================

  Rule('DoD can be validated across multiple completed phases', ({ RuleScenario }) => {
    RuleScenario('All completed phases passing DoD', ({ Given, When, Then, And }) => {
      Given(
        'features:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            status: string;
            deliverables_complete: string;
            has_ac: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          state.features = dataTable.map((row) => {
            const deliverables =
              row.deliverables_complete === 'true'
                ? [createDeliverable('Deliverable 1', 'Complete')]
                : [createDeliverable('Deliverable 1', 'Pending')];
            const scenarios =
              row.has_ac === 'true'
                ? [createScenario('AC Test', ['acceptance-criteria'])]
                : [createScenario('Regular Test', ['happy-path'])];
            return createMockFeature(
              row.pattern,
              parseInt(row.phase),
              row.status,
              deliverables,
              scenarios
            );
          });
        }
      );

      When('validating DoD across all features', () => {
        state.dodSummary = validateDoD(state.features);
      });

      Then('the summary shows {int} total phases', (_ctx, count: number) => {
        expect(state.dodSummary!.totalPhases).toBe(count);
      });

      And('the summary shows {int} passed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.passedPhases).toBe(count);
      });

      And('the summary shows {int} failed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.failedPhases).toBe(count);
      });
    });

    RuleScenario('Mixed pass/fail results', ({ Given, When, Then, And }) => {
      Given(
        'features:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            status: string;
            deliverables_complete: string;
            has_ac: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          state.features = dataTable.map((row) => {
            const deliverables =
              row.deliverables_complete === 'true'
                ? [createDeliverable('Deliverable 1', 'Complete')]
                : [createDeliverable('Deliverable 1', 'Pending')];
            const scenarios =
              row.has_ac === 'true'
                ? [createScenario('AC Test', ['acceptance-criteria'])]
                : [createScenario('Regular Test', ['happy-path'])];
            return createMockFeature(
              row.pattern,
              parseInt(row.phase),
              row.status,
              deliverables,
              scenarios
            );
          });
        }
      );

      When('validating DoD across all features', () => {
        state.dodSummary = validateDoD(state.features);
      });

      Then('the summary shows {int} total phases', (_ctx, count: number) => {
        expect(state.dodSummary!.totalPhases).toBe(count);
      });

      And('the summary shows {int} passed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.passedPhases).toBe(count);
      });

      And('the summary shows {int} failed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.failedPhases).toBe(count);
      });
    });

    RuleScenario('Only completed phases are validated by default', ({ Given, When, Then, And }) => {
      Given(
        'features:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            status: string;
            deliverables_complete: string;
            has_ac: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          state.features = dataTable.map((row) => {
            const deliverables =
              row.deliverables_complete === 'true'
                ? [createDeliverable('Deliverable 1', 'Complete')]
                : [createDeliverable('Deliverable 1', 'Pending')];
            const scenarios =
              row.has_ac === 'true'
                ? [createScenario('AC Test', ['acceptance-criteria'])]
                : [createScenario('Regular Test', ['happy-path'])];
            return createMockFeature(
              row.pattern,
              parseInt(row.phase),
              row.status,
              deliverables,
              scenarios
            );
          });
        }
      );

      When('validating DoD across all features', () => {
        state.dodSummary = validateDoD(state.features);
      });

      Then('the summary shows {int} total phases', (_ctx, count: number) => {
        expect(state.dodSummary!.totalPhases).toBe(count);
      });

      And('the summary shows {int} passed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.passedPhases).toBe(count);
      });
    });

    RuleScenario('Filter to specific phases', ({ Given, When, Then, And }) => {
      Given(
        'features:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            status: string;
            deliverables_complete: string;
            has_ac: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          state.features = dataTable.map((row) => {
            const deliverables =
              row.deliverables_complete === 'true'
                ? [createDeliverable('Deliverable 1', 'Complete')]
                : [createDeliverable('Deliverable 1', 'Pending')];
            const scenarios =
              row.has_ac === 'true'
                ? [createScenario('AC Test', ['acceptance-criteria'])]
                : [createScenario('Regular Test', ['happy-path'])];
            return createMockFeature(
              row.pattern,
              parseInt(row.phase),
              row.status,
              deliverables,
              scenarios
            );
          });
        }
      );

      When('validating DoD for phases {int}, {int}', (_ctx, phase1: number, phase2: number) => {
        state.dodSummary = validateDoD(state.features, [phase1, phase2]);
      });

      Then('the summary shows {int} total phases', (_ctx, count: number) => {
        expect(state.dodSummary!.totalPhases).toBe(count);
      });

      And('the summary shows {int} passed phases', (_ctx, count: number) => {
        expect(state.dodSummary!.passedPhases).toBe(count);
      });
    });
  });

  // ===========================================================================
  // Rule: Summary can be formatted for console output
  // ===========================================================================

  Rule('Summary can be formatted for console output', ({ RuleScenario }) => {
    RuleScenario(
      'Empty summary shows no completed phases message',
      ({ Given, When, Then, And }) => {
        Given('an empty DoD validation summary', () => {
          resetState(); // Reset state at start of scenario
          state.dodSummary = {
            results: [],
            totalPhases: 0,
            passedPhases: 0,
            failedPhases: 0,
          };
        });

        When('formatting the DoD summary', () => {
          state.formattedOutput = formatDoDSummary(state.dodSummary!);
        });

        Then('the output shows the summary header', () => {
          expect(state.formattedOutput).toContain('DoD Validation Summary');
        });

        And('the output shows zero phases validated', () => {
          expect(state.formattedOutput).toContain('Total phases validated: 0');
        });

        And('the output shows no completed phases message', () => {
          expect(state.formattedOutput).toContain('No completed phases found');
        });
      }
    );

    RuleScenario('Summary with passed phases shows details', ({ Given, When, Then, And }) => {
      Given(
        'a DoD validation summary with:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            passed: string;
            deliverable_count: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          const results: DoDValidationResult[] = dataTable.map((row) => {
            const deliverables = Array.from({ length: parseInt(row.deliverable_count) }, (_, i) =>
              createDeliverable(`Deliverable ${i + 1}`, 'Complete')
            );
            return {
              patternName: row.pattern,
              phase: parseInt(row.phase),
              isDoDMet: row.passed === 'true',
              deliverables,
              incompleteDeliverables: [],
              missingAcceptanceCriteria: false,
              messages: ['DoD met'],
            };
          });
          state.dodSummary = {
            results,
            totalPhases: results.length,
            passedPhases: results.filter((r) => r.isDoDMet).length,
            failedPhases: results.filter((r) => !r.isDoDMet).length,
          };
        }
      );

      When('formatting the DoD summary', () => {
        state.formattedOutput = formatDoDSummary(state.dodSummary!);
      });

      Then(
        'the output shows {int} passed and {int} failed',
        (_ctx, passed: number, failed: number) => {
          expect(state.formattedOutput).toContain(`Passed: ${passed}`);
          expect(state.formattedOutput).toContain(`Failed: ${failed}`);
        }
      );

      And('the output shows passed phase details', () => {
        expect(state.formattedOutput).toContain('[PASS] Phase 10: PatternA (3 deliverables)');
        expect(state.formattedOutput).toContain('[PASS] Phase 11: PatternB (2 deliverables)');
      });
    });

    RuleScenario('Summary with failed phases shows details', ({ Given, When, Then, And }) => {
      Given(
        'a DoD validation summary with failures:',
        (
          _ctx,
          dataTable: Array<{
            pattern: string;
            phase: string;
            message: string;
          }>
        ) => {
          resetState(); // Reset state at start of scenario
          const results: DoDValidationResult[] = dataTable.map((row) => ({
            patternName: row.pattern,
            phase: parseInt(row.phase),
            isDoDMet: false,
            deliverables: [createDeliverable('Deliverable 1', 'Pending')],
            incompleteDeliverables: [createDeliverable('Deliverable 1', 'Pending')],
            missingAcceptanceCriteria: row.message.includes('acceptance-criteria'),
            messages: [row.message],
          }));
          state.dodSummary = {
            results,
            totalPhases: results.length,
            passedPhases: 0,
            failedPhases: results.length,
          };
        }
      );

      When('formatting the DoD summary', () => {
        state.formattedOutput = formatDoDSummary(state.dodSummary!);
      });

      Then('the output shows {int} failed phases', (_ctx, count: number) => {
        expect(state.formattedOutput).toContain(`Failed: ${count}`);
      });

      And('the output shows failed phase details with messages', () => {
        expect(state.formattedOutput).toContain('[FAIL] Phase 10: PatternA');
        expect(state.formattedOutput).toContain('1/2 deliverables incomplete');
        expect(state.formattedOutput).toContain('[FAIL] Phase 11: PatternB');
        expect(state.formattedOutput).toContain('No @acceptance-criteria scenarios');
      });
    });
  });
});
