/**
 * Dedent Helper Step Definitions
 *
 * BDD step definitions for testing the dedent helper function edge cases:
 * - Tab normalization
 * - Empty line handling
 * - Single line input
 * - Unicode whitespace
 * - Relative indentation preservation
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { dedent } from '../../../../src/renderable/codecs/helpers.js';

// =============================================================================
// State Types
// =============================================================================

interface DedentState {
  inputText: string;
  outputText: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DedentState | null = null;

function initState(): DedentState {
  return {
    inputText: '',
    outputText: '',
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a string has leading whitespace on the first non-empty line.
 */
function hasLeadingWhitespace(text: string): boolean {
  const lines = text.split('\n');
  const firstNonEmpty = lines.find((line) => line.trim().length > 0);
  if (!firstNonEmpty) return false;
  return firstNonEmpty !== firstNonEmpty.trimStart();
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/dedent.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a dedent test context', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Tabs are normalized to spaces before dedent
  // ---------------------------------------------------------------------------

  Rule('Tabs are normalized to spaces before dedent', ({ RuleScenario }) => {
    RuleScenario('Tab-indented code is properly dedented', ({ Given, When, Then }) => {
      Given('input text with tab indentation:', (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        state.inputText = docString;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output is:', (_ctx: unknown, expectedDocString: string) => {
        if (!state) throw new Error('State not initialized');
        expect(state.outputText.trim()).toBe(expectedDocString.trim());
      });
    });

    RuleScenario('Mixed tabs and spaces are normalized', ({ Given, When, Then }) => {
      Given('input text with mixed indentation:', (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        state.inputText = docString;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output has no leading whitespace on first non-empty line', () => {
        if (!state) throw new Error('State not initialized');
        expect(hasLeadingWhitespace(state.outputText)).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Empty lines are handled correctly
  // ---------------------------------------------------------------------------

  Rule('Empty lines are handled correctly', ({ RuleScenario }) => {
    RuleScenario('Empty lines with trailing spaces are preserved', ({ Given, When, Then, And }) => {
      Given('input text:', (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        state.inputText = docString;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('empty lines remain in output', () => {
        if (!state) throw new Error('State not initialized');
        // Count empty lines in input and output (after trimming trailing whitespace per line)
        const inputEmptyLines = state.inputText.split('\n').filter((l) => l.trim() === '').length;
        const outputEmptyLines = state.outputText.split('\n').filter((l) => l.trim() === '').length;
        expect(outputEmptyLines).toBe(inputEmptyLines);
      });

      And('the output preserves relative indentation', () => {
        if (!state) throw new Error('State not initialized');
        // Check that the function body has more indentation than the function declaration
        const lines = state.outputText.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length >= 2) {
          const firstLineIndent = lines[0].length - lines[0].trimStart().length;
          // The inner return statement should have more indentation than the outer function
          const innerLines = lines.slice(1, -1);
          for (const line of innerLines) {
            const indent = line.length - line.trimStart().length;
            expect(indent).toBeGreaterThanOrEqual(firstLineIndent);
          }
        }
      });
    });

    RuleScenario('All empty lines returns original text', ({ Given, When, Then }) => {
      Given('input with only empty lines', () => {
        if (!state) state = initState();
        state.inputText = '\n\n\n';
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output equals the input', () => {
        if (!state) throw new Error('State not initialized');
        // Empty input returns empty (trimmed by the function)
        expect(state.outputText.trim()).toBe('');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Single line input is handled
  // ---------------------------------------------------------------------------

  Rule('Single line input is handled', ({ RuleScenario }) => {
    RuleScenario('Single line with indentation is dedented', ({ Given, When, Then }) => {
      Given('input text {string}', (_ctx: unknown, text: string) => {
        if (!state) state = initState();
        state.inputText = text;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output is {string}', (_ctx: unknown, expected: string) => {
        if (!state) throw new Error('State not initialized');
        expect(state.outputText.trim()).toBe(expected);
      });
    });

    RuleScenario('Single line without indentation is unchanged', ({ Given, When, Then }) => {
      Given('input text {string}', (_ctx: unknown, text: string) => {
        if (!state) state = initState();
        state.inputText = text;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output is {string}', (_ctx: unknown, expected: string) => {
        if (!state) throw new Error('State not initialized');
        expect(state.outputText.trim()).toBe(expected);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Unicode whitespace is handled
  // ---------------------------------------------------------------------------

  Rule('Unicode whitespace is handled', ({ RuleScenario }) => {
    RuleScenario('Non-breaking space is treated as content', ({ Given, When, Then }) => {
      Given('input text with non-breaking spaces in content', () => {
        if (!state) state = initState();
        // Non-breaking space (U+00A0) in the content, not leading whitespace
        state.inputText = '    const text = "hello\u00A0world";';
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output preserves non-breaking spaces in content', () => {
        if (!state) throw new Error('State not initialized');
        // The non-breaking space in the string should be preserved
        expect(state.outputText).toContain('\u00A0');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Relative indentation is preserved
  // ---------------------------------------------------------------------------

  Rule('Relative indentation is preserved', ({ RuleScenario }) => {
    RuleScenario('Nested code blocks preserve relative indentation', ({ Given, When, Then }) => {
      Given('input text:', (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        state.inputText = docString;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output is:', (_ctx: unknown, expectedDocString: string) => {
        if (!state) throw new Error('State not initialized');
        expect(state.outputText.trim()).toBe(expectedDocString.trim());
      });
    });

    RuleScenario('Mixed indentation levels are preserved relatively', ({ Given, When, Then }) => {
      Given('input text:', (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        state.inputText = docString;
      });

      When('dedenting the text', () => {
        if (!state) throw new Error('State not initialized');
        state.outputText = dedent(state.inputText);
      });

      Then('the output is:', (_ctx: unknown, expectedDocString: string) => {
        if (!state) throw new Error('State not initialized');
        expect(state.outputText.trim()).toBe(expectedDocString.trim());
      });
    });
  });
});
