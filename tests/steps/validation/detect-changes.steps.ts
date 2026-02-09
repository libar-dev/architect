/**
 * Detect Changes Step Definitions
 *
 * BDD step definitions for testing the detectDeliverableChanges function
 * that parses git diff output to identify added, removed, and modified deliverables.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { detectDeliverableChanges } from '../../../src/lint/process-guard/index.js';
import type { DeliverableChange } from '../../../src/lint/process-guard/index.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface DetectChangesTestState {
  // Input
  diff: string;
  files: string[];

  // Output
  result: Array<[string, DeliverableChange]> | null;
}

// =============================================================================
// Module-level State
// =============================================================================

let state: DetectChangesTestState | null = null;

function initState(): DetectChangesTestState {
  return {
    diff: '',
    files: [],
    result: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

const TEST_FILE = 'specs/test.feature';

/**
 * Create a git diff string for testing.
 * Includes a deliverable table header as context so detectDeliverableChanges
 * recognizes subsequent rows as deliverable data.
 */
function createDiffHeader(file: string): string {
  return `diff --git a/${file} b/${file}
index 1234567..abcdefg 100644
--- a/${file}
+++ b/${file}
@@ -1,10 +1,10 @@
       | Deliverable | Status | Location | Tests | Test Type |`;
}

/**
 * Create a deliverable table row.
 */
function createDeliverableRow(name: string, status: string): string {
  return `      | ${name} | ${status} | path/to/file.ts | Yes | unit |`;
}

/**
 * Get the result for the test file.
 */
function getResult(): DeliverableChange | undefined {
  const entry = state!.result?.find(([file]) => file === TEST_FILE);
  return entry?.[1];
}

// =============================================================================
// Feature Loading
// =============================================================================

const feature = await loadFeature('tests/features/validation/detect-changes.feature');

// =============================================================================
// Step Definitions
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a detect changes test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Modification Detection Rule
  // ===========================================================================

  Rule('Status changes are detected as modifications not additions', ({ RuleScenario }) => {
    RuleScenario(
      'Single deliverable status change is detected as modification',
      ({ Given, When, Then, And }) => {
        Given(
          'a git diff with deliverable "Type definitions" changed from "planned" to "completed"',
          () => {
            state!.files = [TEST_FILE];
            state!.diff = `${createDiffHeader(TEST_FILE)}
-${createDeliverableRow('Type definitions', 'pending')}
+${createDeliverableRow('Type definitions', 'complete')}`;
          }
        );

        When('detecting deliverable changes', () => {
          state!.result = detectDeliverableChanges(state!.diff, state!.files);
        });

        Then('the deliverable "Type definitions" is in the "modified" list', () => {
          const result = getResult();
          expect(result).toBeDefined();
          expect(result!.modified).toContain('Type definitions');
        });

        And('the deliverable "Type definitions" is not in the "added" list', () => {
          const result = getResult();
          expect(result!.added).not.toContain('Type definitions');
        });

        And('the deliverable "Type definitions" is not in the "removed" list', () => {
          const result = getResult();
          expect(result!.removed).not.toContain('Type definitions');
        });
      }
    );

    RuleScenario(
      'Multiple deliverable status changes are all modifications',
      ({ Given, When, Then, And }) => {
        Given(
          'a git diff with deliverables "Type definitions" and "Unit tests" both changing status',
          () => {
            state!.files = [TEST_FILE];
            state!.diff = `${createDiffHeader(TEST_FILE)}
-${createDeliverableRow('Type definitions', 'pending')}
-${createDeliverableRow('Unit tests', 'pending')}
+${createDeliverableRow('Type definitions', 'complete')}
+${createDeliverableRow('Unit tests', 'complete')}`;
          }
        );

        When('detecting deliverable changes', () => {
          state!.result = detectDeliverableChanges(state!.diff, state!.files);
        });

        Then('the deliverable "Type definitions" is in the "modified" list', () => {
          const result = getResult();
          expect(result).toBeDefined();
          expect(result!.modified).toContain('Type definitions');
        });

        And('the deliverable "Unit tests" is in the "modified" list', () => {
          const result = getResult();
          expect(result!.modified).toContain('Unit tests');
        });

        And('no deliverables are in the "added" list', () => {
          const result = getResult();
          expect(result!.added).toHaveLength(0);
        });

        And('no deliverables are in the "removed" list', () => {
          const result = getResult();
          expect(result!.removed).toHaveLength(0);
        });
      }
    );
  });

  // ===========================================================================
  // Addition Detection Rule
  // ===========================================================================

  Rule('New deliverables are detected as additions', ({ RuleScenario }) => {
    RuleScenario('New deliverable is detected as addition', ({ Given, When, Then, And }) => {
      Given('a git diff with new deliverable "New feature" added', () => {
        state!.files = [TEST_FILE];
        state!.diff = `${createDiffHeader(TEST_FILE)}
+${createDeliverableRow('New feature', 'pending')}`;
      });

      When('detecting deliverable changes', () => {
        state!.result = detectDeliverableChanges(state!.diff, state!.files);
      });

      Then('the deliverable "New feature" is in the "added" list', () => {
        const result = getResult();
        expect(result).toBeDefined();
        expect(result!.added).toContain('New feature');
      });

      And('the deliverable "New feature" is not in the "modified" list', () => {
        const result = getResult();
        expect(result!.modified).not.toContain('New feature');
      });

      And('the deliverable "New feature" is not in the "removed" list', () => {
        const result = getResult();
        expect(result!.removed).not.toContain('New feature');
      });
    });
  });

  // ===========================================================================
  // Removal Detection Rule
  // ===========================================================================

  Rule('Removed deliverables are detected as removals', ({ RuleScenario }) => {
    RuleScenario('Removed deliverable is detected as removal', ({ Given, When, Then, And }) => {
      Given('a git diff with deliverable "Deprecated feature" removed', () => {
        state!.files = [TEST_FILE];
        state!.diff = `${createDiffHeader(TEST_FILE)}
-${createDeliverableRow('Deprecated feature', 'complete')}`;
      });

      When('detecting deliverable changes', () => {
        state!.result = detectDeliverableChanges(state!.diff, state!.files);
      });

      Then('the deliverable "Deprecated feature" is in the "removed" list', () => {
        const result = getResult();
        expect(result).toBeDefined();
        expect(result!.removed).toContain('Deprecated feature');
      });

      And('the deliverable "Deprecated feature" is not in the "modified" list', () => {
        const result = getResult();
        expect(result!.modified).not.toContain('Deprecated feature');
      });

      And('the deliverable "Deprecated feature" is not in the "added" list', () => {
        const result = getResult();
        expect(result!.added).not.toContain('Deprecated feature');
      });
    });
  });

  // ===========================================================================
  // Mixed Changes Rule
  // ===========================================================================

  Rule('Mixed changes are correctly categorized', ({ RuleScenario }) => {
    RuleScenario(
      'Mixed additions, removals, and modifications are handled correctly',
      ({ Given, When, Then, And }) => {
        Given(
          'a git diff with:',
          (_ctx: unknown, table: Array<{ change_type: string; deliverable: string }>) => {
            state!.files = [TEST_FILE];
            // Build diff with mixed changes
            let removedLines = '';
            let addedLines = '';

            for (const row of table) {
              if (row.change_type === 'status_change') {
                // Status change: appears in both removed and added
                removedLines += `-${createDeliverableRow(row.deliverable, 'pending')}\n`;
                addedLines += `+${createDeliverableRow(row.deliverable, 'complete')}\n`;
              } else if (row.change_type === 'added') {
                addedLines += `+${createDeliverableRow(row.deliverable, 'pending')}\n`;
              } else if (row.change_type === 'removed') {
                removedLines += `-${createDeliverableRow(row.deliverable, 'complete')}\n`;
              }
            }

            state!.diff = `${createDiffHeader(TEST_FILE)}
${removedLines}${addedLines}`;
          }
        );

        When('detecting deliverable changes', () => {
          state!.result = detectDeliverableChanges(state!.diff, state!.files);
        });

        Then('the deliverable "Existing feature" is in the "modified" list', () => {
          const result = getResult();
          expect(result).toBeDefined();
          expect(result!.modified).toContain('Existing feature');
        });

        And('the deliverable "New feature" is in the "added" list', () => {
          const result = getResult();
          expect(result!.added).toContain('New feature');
        });

        And('the deliverable "Old feature" is in the "removed" list', () => {
          const result = getResult();
          expect(result!.removed).toContain('Old feature');
        });
      }
    );
  });

  // ===========================================================================
  // Non-Deliverable Table Filtering Rule
  // ===========================================================================

  Rule('Non-deliverable tables are ignored', ({ RuleScenario }) => {
    RuleScenario(
      'Changes in Examples tables are not detected as deliverable changes',
      ({ Given, When, Then }) => {
        Given('a git diff with changes only in an Examples table', () => {
          state!.files = [TEST_FILE];
          // Simulates a diff where only Examples table rows change (no deliverable header)
          state!.diff = `diff --git a/${TEST_FILE} b/${TEST_FILE}
index 1234567..abcdefg 100644
--- a/${TEST_FILE}
+++ b/${TEST_FILE}
@@ -70,4 +70,4 @@
       Examples:
         | from      | to        |
-        | completed | hard      |
+        | complete  | hard      |`;
        });

        When('detecting deliverable changes', () => {
          state!.result = detectDeliverableChanges(state!.diff, state!.files);
        });

        Then('no deliverables are detected', () => {
          const result = getResult();
          expect(result).toBeUndefined();
        });
      }
    );
  });
});
