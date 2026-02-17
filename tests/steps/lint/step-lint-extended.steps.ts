/**
 * Step Lint Extended Rules - Step Definitions
 *
 * BDD step definitions for testing the 4 extended vitest-cucumber lint rules.
 * Tests pure functions — no infrastructure required. Input strings are
 * constructed inline, check functions are called directly, and violations
 * are asserted on.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  checkHashInStepText,
  checkKeywordInDescription,
} from '../../../src/lint/steps/feature-checks.js';
import { checkRepeatedStepPattern } from '../../../src/lint/steps/step-checks.js';
import { checkOutlineQuotedValues } from '../../../src/lint/steps/cross-checks.js';
import type { LintViolation } from '../../../src/validation-schemas/lint.js';

// =============================================================================
// Module-level state (reset per scenario via Background)
// =============================================================================

interface StepLintState {
  featureContent: string;
  stepContent: string;
  violations: readonly LintViolation[];
}

let state: StepLintState | null = null;

function initState(): StepLintState {
  return {
    featureContent: '',
    stepContent: '',
    violations: [],
  };
}

// =============================================================================
// Feature: Step Lint Extended Rules
// =============================================================================

const feature = await loadFeature('tests/features/lint/step-lint-extended.feature');

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a step lint context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // FEATURE-ONLY CHECKS
  // ===========================================================================

  Rule('Hash in step text is detected', ({ RuleScenario }) => {
    RuleScenario('Hash in step text produces warning', ({ Given, When, Then }) => {
      Given('a feature file with hash inside step text', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given a file with # inside the name',
          '    When I process it',
          '    Then it works',
        ].join('\n');
      });

      When('the step linter checks the feature file for hash-in-step-text', () => {
        state!.violations = checkHashInStepText(state!.featureContent, 'test.feature');
      });

      Then('a hash-in-step-text warning is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('hash-in-step-text');
        expect(state!.violations[0]?.severity).toBe('warning');
      });
    });

    RuleScenario('Hash at start of comment line is not flagged', ({ Given, When, Then }) => {
      Given('a feature file with hash comment lines between scenarios', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  # This is a comment between scenarios',
          '',
          '  Scenario: First scenario',
          '    Given something',
          '',
          '  # Another comment',
          '',
          '  Scenario: Second scenario',
          '    Given something else',
        ].join('\n');
      });

      When('the step linter checks the feature file for hash-in-step-text', () => {
        state!.violations = checkHashInStepText(state!.featureContent, 'test.feature');
      });

      Then('no hash-in-step-text warnings are reported', () => {
        const hashViolations = state!.violations.filter((v) => v.rule === 'hash-in-step-text');
        expect(hashViolations).toHaveLength(0);
      });
    });
  });

  Rule('Keywords in description text are detected', ({ RuleScenario }) => {
    RuleScenario('Description starting with a keyword is flagged', ({ Given, When, Then }) => {
      Given('a feature file with a description line starting with a keyword', () => {
        state!.featureContent = [
          'Feature: Test Feature',
          '',
          '  Rule: My business rule',
          '',
          '    Given the system is configured properly, this rule applies.',
          '',
          '    Scenario: Test scenario',
          '      Given a state',
          '      When I act',
          '      Then it works',
        ].join('\n');
      });

      When('the step linter checks the feature file for keyword-in-description', () => {
        state!.violations = checkKeywordInDescription(state!.featureContent, 'test.feature');
      });

      Then('a keyword-in-description error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('keyword-in-description');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario('Step lines with keywords are not flagged', ({ Given, When, Then }) => {
      Given('a feature file with keywords only in step lines', () => {
        state!.featureContent = [
          'Feature: Test Feature',
          '',
          '  This is a normal description without keywords.',
          '',
          '  Scenario: Test scenario',
          '    Given a state',
          '    When I act',
          '    Then it works',
        ].join('\n');
      });

      When('the step linter checks the feature file for keyword-in-description', () => {
        state!.violations = checkKeywordInDescription(state!.featureContent, 'test.feature');
      });

      Then('no keyword-in-description errors are reported', () => {
        const keywordViolations = state!.violations.filter(
          (v) => v.rule === 'keyword-in-description'
        );
        expect(keywordViolations).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // CROSS-FILE CHECKS
  // ===========================================================================

  Rule('Scenario Outline steps with quoted values are detected', ({ RuleScenario }) => {
    RuleScenario(
      'Outline step with quoted value produces warning',
      ({ Given, And, When, Then }) => {
        Given('a feature file with a Scenario Outline using quoted step values', () => {
          state!.featureContent = [
            'Feature: Test',
            '',
            '  Scenario Outline: Validate input',
            '    Given a user "admin"',
            '    When I set quantity to "5"',
            '    Then validation returns <valid>',
            '',
            '    Examples:',
            '      | admin | valid |',
            '      | admin | true  |',
          ].join('\n');
        });

        And('a step file paired with the feature', () => {
          state!.stepContent = [
            'describeFeature(feature, ({ ScenarioOutline }) => {',
            '  ScenarioOutline("Validate input", ({ Given, When, Then }) => {',
            '    Given("a user {string}", (_ctx, user) => {});',
            '  });',
            '});',
          ].join('\n');
        });

        When('the step linter checks the paired files for outline-quoted-values', () => {
          state!.violations = checkOutlineQuotedValues(
            state!.featureContent,
            state!.stepContent,
            'test.steps.ts'
          );
        });

        Then('an outline-quoted-values warning is reported', () => {
          const outlineViolations = state!.violations.filter(
            (v) => v.rule === 'outline-quoted-values'
          );
          expect(outlineViolations.length).toBeGreaterThanOrEqual(1);
          expect(outlineViolations[0]?.severity).toBe('warning');
        });
      }
    );

    RuleScenario('Outline step with angle bracket is not flagged', ({ Given, And, When, Then }) => {
      Given('a feature file with a Scenario Outline using angle-bracket placeholders', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario Outline: Validate input',
          '    Given a user <username>',
          '    When I set quantity to <quantity>',
          '    Then validation returns <valid>',
          '',
          '    Examples:',
          '      | username | quantity | valid |',
          '      | admin    | 5        | true  |',
        ].join('\n');
      });

      And('a step file paired with the feature', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ ScenarioOutline }) => {',
          '  ScenarioOutline("Validate input", ({ Given }, variables) => {',
          '    Given("a user <username>", () => { state.user = variables.username; });',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files for outline-quoted-values', () => {
        state!.violations = checkOutlineQuotedValues(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('no outline-quoted-values warnings are reported', () => {
        const outlineViolations = state!.violations.filter(
          (v) => v.rule === 'outline-quoted-values'
        );
        expect(outlineViolations).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // STEP-ONLY CHECKS
  // ===========================================================================

  Rule('Repeated step patterns in the same scenario are detected', ({ RuleScenario }) => {
    RuleScenario('Duplicate step pattern in one scenario is flagged', ({ Given, When, Then }) => {
      Given('a step file with the same step pattern registered twice in one scenario', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test", ({ Given, When, Then }) => {',
          "    Given('a configured state', () => {",
          '      state.configured = true;',
          '    });',
          "    Given('a configured state', () => {",
          '      state.configured = false;',
          '    });',
          "    When('I act', () => {});",
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the step file for repeated-step-pattern', () => {
        state!.violations = checkRepeatedStepPattern(state!.stepContent, 'test.steps.ts');
      });

      Then('a repeated-step-pattern error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('repeated-step-pattern');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario('Same pattern in different scenarios is not flagged', ({ Given, When, Then }) => {
      Given('a step file with the same pattern in separate scenario blocks', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("First test", ({ Given, When }) => {',
          "    Given('a configured state', () => {",
          '      state.configured = true;',
          '    });',
          "    When('I act', () => {});",
          '  });',
          '',
          '  Scenario("Second test", ({ Given, When }) => {',
          "    Given('a configured state', () => {",
          '      state.configured = true;',
          '    });',
          "    When('I act', () => {});",
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the step file for repeated-step-pattern', () => {
        state!.violations = checkRepeatedStepPattern(state!.stepContent, 'test.steps.ts');
      });

      Then('no repeated-step-pattern errors are reported', () => {
        const repeatViolations = state!.violations.filter(
          (v) => v.rule === 'repeated-step-pattern'
        );
        expect(repeatViolations).toHaveLength(0);
      });
    });
  });
});
