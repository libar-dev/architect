/**
 * Extract Summary Step Definitions
 *
 * BDD step definitions for testing the extractSummary function which
 * transforms multi-line pattern descriptions into concise summaries.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { extractSummary } from '../../../src/renderable/utils.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ExtractSummaryTestState {
  summaryResult: string;
  inputDescription: string;
  patternName?: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ExtractSummaryTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ExtractSummaryTestState {
  return {
    summaryResult: '',
    inputDescription: '',
    patternName: undefined,
  };
}

/**
 * Guard helper to ensure state is initialized.
 * Provides clear error message if Background step didn't run.
 */
function requireState(): ExtractSummaryTestState {
  if (!state) {
    throw new Error('Test state not initialized. Ensure the Background step runs.');
  }
  return state;
}

// =============================================================================
// Feature: Extract Summary from Pattern Descriptions
// =============================================================================

const feature = await loadFeature('tests/features/behavior/extract-summary.feature');

describeFeature(feature, ({ Rule, AfterEachScenario, Background }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('an extract summary test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: Single-line descriptions are returned as-is when complete
  // ===========================================================================

  Rule('Single-line descriptions are returned as-is when complete', ({ RuleScenario }) => {
    RuleScenario('Complete sentence on single line', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Single line without sentence ending gets ellipsis', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // Rule: Multi-line descriptions are combined until sentence ending
  // ===========================================================================

  Rule('Multi-line descriptions are combined until sentence ending', ({ RuleScenario }) => {
    RuleScenario('Two lines combine into complete sentence', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Combines lines up to sentence boundary within limit', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Long multi-line text truncates when exceeds limit', ({ When, Then, And }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should end with {string}', (_ctx: unknown, suffix: string) => {
        expect(requireState().summaryResult.endsWith(suffix)).toBe(true);
      });

      And('the summary should be at most {int} characters', (_ctx: unknown, maxLength: number) => {
        expect(requireState().summaryResult.length).toBeLessThanOrEqual(maxLength);
      });
    });

    RuleScenario('Multi-line without sentence ending gets ellipsis', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // Rule: Long descriptions are truncated at sentence or word boundaries
  // ===========================================================================

  Rule('Long descriptions are truncated at sentence or word boundaries', ({ RuleScenario }) => {
    RuleScenario('Long text truncates at sentence boundary within limit', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario(
      'Long text without sentence boundary truncates at word with ellipsis',
      ({ When, Then, And }) => {
        When('I extract summary from:', (_ctx: unknown, docString: string) => {
          const s = requireState();
          s.inputDescription = docString;
          s.summaryResult = extractSummary(docString);
        });

        Then('the summary should end with {string}', (_ctx: unknown, suffix: string) => {
          expect(requireState().summaryResult.endsWith(suffix)).toBe(true);
        });

        And(
          'the summary should be at most {int} characters',
          (_ctx: unknown, maxLength: number) => {
            expect(requireState().summaryResult.length).toBeLessThanOrEqual(maxLength);
          }
        );
      }
    );
  });

  // ===========================================================================
  // Rule: Tautological and header lines are skipped
  // ===========================================================================

  Rule('Tautological and header lines are skipped', ({ RuleScenario }) => {
    RuleScenario('Skips pattern name as first line', ({ When, Then }) => {
      When(
        'I extract summary from {string}:',
        (_ctx: unknown, patternName: string, docString: string) => {
          const s = requireState();
          s.patternName = patternName;
          s.inputDescription = docString;
          s.summaryResult = extractSummary(docString, patternName);
        }
      );

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Skips section header labels', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Skips multiple header patterns', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // Rule: Edge cases are handled gracefully
  // ===========================================================================

  Rule('Edge cases are handled gracefully', ({ RuleScenario }) => {
    RuleScenario('Empty description returns empty string', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Markdown headers are stripped', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Bold markdown is stripped', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Multiple sentence endings - takes first complete sentence', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });

    RuleScenario('Question mark as sentence ending', ({ When, Then }) => {
      When('I extract summary from:', (_ctx: unknown, docString: string) => {
        const s = requireState();
        s.inputDescription = docString;
        s.summaryResult = extractSummary(docString);
      });

      Then('the summary should be {string}', (_ctx: unknown, expected: string) => {
        expect(requireState().summaryResult).toBe(expected);
      });
    });
  });
});
