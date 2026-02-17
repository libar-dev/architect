/**
 * Step Lint Step Definitions
 *
 * BDD step definitions for testing vitest-cucumber compatibility lint rules.
 * Tests pure functions — no infrastructure required. Input strings are
 * constructed inline, check functions are called directly, and violations
 * are asserted on.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  checkHashInDescription,
  checkDuplicateAndSteps,
  checkDollarInStepText,
} from '../../../src/lint/steps/feature-checks.js';
import { checkRegexStepPatterns, checkPhraseUsage } from '../../../src/lint/steps/step-checks.js';
import {
  checkScenarioOutlineFunctionParams,
  checkMissingAndDestructuring,
  checkMissingRuleWrapper,
} from '../../../src/lint/steps/cross-checks.js';
import { extractFeaturePath } from '../../../src/lint/steps/pair-resolver.js';
import type { LintViolation } from '../../../src/validation-schemas/lint.js';

// =============================================================================
// Module-level state (reset per scenario via Background)
// =============================================================================

interface StepLintState {
  featureContent: string;
  stepContent: string;
  violations: readonly LintViolation[];
  extractedPath: string | null;
}

let state: StepLintState | null = null;

function initState(): StepLintState {
  return {
    featureContent: '',
    stepContent: '',
    violations: [],
    extractedPath: null,
  };
}

// =============================================================================
// Feature: Step Lint
// =============================================================================

const feature = await loadFeature('tests/features/lint/step-lint.feature');

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a step lint context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // FEATURE-ONLY CHECKS
  // ===========================================================================

  Rule('Hash comments inside description pseudo-code-blocks are detected', ({ RuleScenario }) => {
    RuleScenario(
      'Hash inside description pseudo-code-block is flagged',
      ({ Given, When, Then }) => {
        Given('a feature file with a pseudo-code-block containing hash in description', () => {
          state!.featureContent = [
            'Feature: Test',
            '',
            '  Rule: My Rule',
            '',
            '    """bash',
            '    # This should be flagged',
            '    some-command',
            '    """',
            '',
            '    Scenario: Test scenario',
            '      Given something',
          ].join('\n');
        });

        When('the step linter checks the feature file', () => {
          state!.violations = checkHashInDescription(state!.featureContent, 'test.feature');
        });

        Then('a hash-in-description error is reported', () => {
          expect(state!.violations).toHaveLength(1);
          expect(state!.violations[0]?.rule).toBe('hash-in-description');
          expect(state!.violations[0]?.severity).toBe('error');
        });
      }
    );

    RuleScenario('Hash in step DocString is not flagged', ({ Given, When, Then }) => {
      Given('a feature file with hash inside a step DocString', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given the following script:',
          '      """bash',
          '      # This is a real DocString',
          '      some-command',
          '      """',
        ].join('\n');
      });

      When('the step linter checks the feature file', () => {
        state!.violations = checkHashInDescription(state!.featureContent, 'test.feature');
      });

      Then('no hash-in-description errors are reported', () => {
        const hashViolations = state!.violations.filter((v) => v.rule === 'hash-in-description');
        expect(hashViolations).toHaveLength(0);
      });
    });

    RuleScenario('Section separator comments are not flagged', ({ Given, When, Then }) => {
      Given('a feature file with hash separators between keywords', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  # This is a section separator between keywords',
          '',
          '  Scenario: First scenario',
          '    Given something',
          '',
          '  # Another separator',
          '',
          '  Scenario: Second scenario',
          '    Given something else',
        ].join('\n');
      });

      When('the step linter checks the feature file', () => {
        state!.violations = checkHashInDescription(state!.featureContent, 'test.feature');
      });

      Then('no hash-in-description errors are reported', () => {
        const hashViolations = state!.violations.filter((v) => v.rule === 'hash-in-description');
        expect(hashViolations).toHaveLength(0);
      });
    });
  });

  Rule('Duplicate And steps in the same scenario are detected', ({ RuleScenario }) => {
    RuleScenario('Duplicate And step text is flagged', ({ Given, When, Then }) => {
      Given('a feature file with duplicate And steps in one scenario', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given a starting state',
          '    And the value is set',
          '    And the value is set',
          '    When I do something',
        ].join('\n');
      });

      When('the step linter checks the feature file', () => {
        state!.violations = checkDuplicateAndSteps(state!.featureContent, 'test.feature');
      });

      Then('a duplicate-and-step error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('duplicate-and-step');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario('Same And text in different scenarios is allowed', ({ Given, When, Then }) => {
      Given('a feature file with identical And text in separate scenarios', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: First scenario',
          '    Given a state',
          '    And the value is set',
          '    When I act',
          '',
          '  Scenario: Second scenario',
          '    Given a state',
          '    And the value is set',
          '    When I act',
        ].join('\n');
      });

      When('the step linter checks the feature file', () => {
        state!.violations = checkDuplicateAndSteps(state!.featureContent, 'test.feature');
      });

      Then('no duplicate-and-step errors are reported', () => {
        const dupViolations = state!.violations.filter((v) => v.rule === 'duplicate-and-step');
        expect(dupViolations).toHaveLength(0);
      });
    });
  });

  Rule('Dollar sign in step text is detected', ({ RuleScenario }) => {
    RuleScenario('Dollar in step text produces warning', ({ Given, When, Then }) => {
      Given('a feature file with dollar sign in a When step', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given a state',
          '    When I check the $amount value',
          '    Then it works',
        ].join('\n');
      });

      When('the step linter checks the feature file', () => {
        state!.violations = checkDollarInStepText(state!.featureContent, 'test.feature');
      });

      Then('a dollar-in-step-text warning is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('dollar-in-step-text');
        expect(state!.violations[0]?.severity).toBe('warning');
      });
    });
  });

  // ===========================================================================
  // STEP-ONLY CHECKS
  // ===========================================================================

  Rule('Regex step patterns are detected', ({ RuleScenario }) => {
    RuleScenario('Regex pattern in Given is flagged', ({ Given, When, Then }) => {
      Given('a step file with a regex pattern in Given', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test", ({ Given }) => {',
          '    Given(/a user with name (.+)/, (_ctx, name) => {',
          '      state.name = name;',
          '    });',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the step file', () => {
        state!.violations = checkRegexStepPatterns(state!.stepContent, 'test.steps.ts');
      });

      Then('a regex-step-pattern error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('regex-step-pattern');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });
  });

  Rule('Unsupported phrase type is detected', ({ RuleScenario }) => {
    RuleScenario('Phrase type in step string is flagged', ({ Given, When, Then }) => {
      Given('a step file with phrase type in a step pattern string', () => {
        // Build the test input via concatenation to avoid self-triggering
        // the unsupported-phrase-type lint rule on this test file
        const phraseType = '{phr' + 'ase}';
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test", ({ Given }) => {',
          `    Given("a user with name ${phraseType}", (_ctx, name) => {`,
          '      state.name = name;',
          '    });',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the step file', () => {
        state!.violations = checkPhraseUsage(state!.stepContent, 'test.steps.ts');
      });

      Then('an unsupported-phrase-type error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('unsupported-phrase-type');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });
  });

  // ===========================================================================
  // CROSS-FILE CHECKS
  // ===========================================================================

  Rule('ScenarioOutline function params are detected', ({ RuleScenario }) => {
    RuleScenario('Function params in ScenarioOutline are flagged', ({ Given, And, When, Then }) => {
      Given('a feature file with a Scenario Outline', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario Outline: Validate values',
          '    Given a value <value>',
          '    Then it should be <expected>',
          '',
          '    Examples:',
          '      | value | expected |',
          '      | foo   | true     |',
        ].join('\n');
      });

      And('a step file using ScenarioOutline with function params callback', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ ScenarioOutline }) => {',
          '  ScenarioOutline("Validate values", ({ Given, Then }) => {',
          '    Given("a value {string}", (_ctx, value: string) => {',
          '      state.value = value;',
          '    });',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files', () => {
        state!.violations = checkScenarioOutlineFunctionParams(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('a scenario-outline-function-params error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('scenario-outline-function-params');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario(
      'Function params in regular Scenario are not flagged',
      ({ Given, And, When, Then }) => {
        Given('a feature file with a regular Scenario only', () => {
          state!.featureContent = [
            'Feature: Test',
            '',
            '  Scenario: Test something',
            '    Given a value "foo"',
            '    Then it works',
          ].join('\n');
        });

        And('a step file using Scenario with function params callback', () => {
          state!.stepContent = [
            'describeFeature(feature, ({ Scenario }) => {',
            '  Scenario("Test something", ({ Given }) => {',
            '    Given("a value {string}", (_ctx, value: string) => {',
            '      state.value = value;',
            '    });',
            '  });',
            '});',
          ].join('\n');
        });

        When('the step linter checks the paired files', () => {
          state!.violations = checkScenarioOutlineFunctionParams(
            state!.featureContent,
            state!.stepContent,
            'test.steps.ts'
          );
        });

        Then('no scenario-outline-function-params errors are reported', () => {
          const outlineViolations = state!.violations.filter(
            (v) => v.rule === 'scenario-outline-function-params'
          );
          expect(outlineViolations).toHaveLength(0);
        });
      }
    );
  });

  Rule('Missing And destructuring is detected', ({ RuleScenario }) => {
    RuleScenario('Missing And destructuring is flagged', ({ Given, And, When, Then }) => {
      Given('a feature file with And steps', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given a state',
          '    And a secondary condition',
          '    When I act',
        ].join('\n');
      });

      And('a step file that does not destructure And', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test scenario", ({ Given, When, Then }) => {',
          '    Given("a state", () => {});',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files', () => {
        state!.violations = checkMissingAndDestructuring(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('a missing-and-destructuring error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('missing-and-destructuring');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario('Present And destructuring passes', ({ Given, And, When, Then }) => {
      Given('a feature file with And steps', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Scenario: Test scenario',
          '    Given a state',
          '    And a secondary condition',
          '    When I act',
        ].join('\n');
      });

      And('a step file that destructures And', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test scenario", ({ Given, When, Then, And }) => {',
          '    Given("a state", () => {});',
          '    And("a secondary condition", () => {});',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files', () => {
        state!.violations = checkMissingAndDestructuring(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('no missing-and-destructuring errors are reported', () => {
        const andViolations = state!.violations.filter(
          (v) => v.rule === 'missing-and-destructuring'
        );
        expect(andViolations).toHaveLength(0);
      });
    });
  });

  Rule('Missing Rule wrapper is detected', ({ RuleScenario }) => {
    RuleScenario('Missing Rule wrapper is flagged', ({ Given, And, When, Then }) => {
      Given('a feature file with Rule blocks', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Rule: First rule',
          '',
          '    Scenario: Test scenario',
          '      Given something',
        ].join('\n');
      });

      And('a step file that does not destructure Rule', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Scenario }) => {',
          '  Scenario("Test scenario", ({ Given }) => {',
          '    Given("something", () => {});',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files', () => {
        state!.violations = checkMissingRuleWrapper(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('a missing-rule-wrapper error is reported', () => {
        expect(state!.violations).toHaveLength(1);
        expect(state!.violations[0]?.rule).toBe('missing-rule-wrapper');
        expect(state!.violations[0]?.severity).toBe('error');
      });
    });

    RuleScenario('Present Rule wrapper passes', ({ Given, And, When, Then }) => {
      Given('a feature file with Rule blocks', () => {
        state!.featureContent = [
          'Feature: Test',
          '',
          '  Rule: First rule',
          '',
          '    Scenario: Test scenario',
          '      Given something',
        ].join('\n');
      });

      And('a step file that destructures Rule from describeFeature', () => {
        state!.stepContent = [
          'describeFeature(feature, ({ Rule }) => {',
          '  Rule("First rule", ({ RuleScenario }) => {',
          '    RuleScenario("Test scenario", ({ Given }) => {',
          '      Given("something", () => {});',
          '    });',
          '  });',
          '});',
        ].join('\n');
      });

      When('the step linter checks the paired files', () => {
        state!.violations = checkMissingRuleWrapper(
          state!.featureContent,
          state!.stepContent,
          'test.steps.ts'
        );
      });

      Then('no missing-rule-wrapper errors are reported', () => {
        const ruleViolations = state!.violations.filter((v) => v.rule === 'missing-rule-wrapper');
        expect(ruleViolations).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // PAIR RESOLVER
  // ===========================================================================

  Rule('Feature-to-step pairing resolves both loadFeature patterns', ({ RuleScenario }) => {
    RuleScenario('Simple loadFeature path is extracted', ({ Given, When, Then }) => {
      Given('a step file with a simple loadFeature string path', () => {
        state!.stepContent = [
          'import { loadFeature } from "@amiceli/vitest-cucumber";',
          '',
          "const feature = await loadFeature('tests/features/foo.feature');",
        ].join('\n');
      });

      When('the pair resolver extracts the feature path', () => {
        state!.extractedPath = extractFeaturePath(state!.stepContent);
      });

      Then('the extracted path matches the expected simple path', () => {
        expect(state!.extractedPath).toBe('tests/features/foo.feature');
      });
    });

    RuleScenario('Resolve-based loadFeature path is extracted', ({ Given, When, Then }) => {
      Given('a step file with a resolve-based loadFeature path', () => {
        state!.stepContent = [
          'import { loadFeature } from "@amiceli/vitest-cucumber";',
          'import { resolve } from "path";',
          '',
          "const feature = await loadFeature(resolve(__dirname, '../features/foo.feature'));",
        ].join('\n');
      });

      When('the pair resolver extracts the feature path', () => {
        state!.extractedPath = extractFeaturePath(state!.stepContent);
      });

      Then('the extracted path is a relative path', () => {
        expect(state!.extractedPath).not.toBeNull();
        expect(state!.extractedPath!.startsWith('..')).toBe(true);
      });
    });
  });
});
