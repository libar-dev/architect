Feature: Step Lint - vitest-cucumber Compatibility Checks

  Tests for the lint-steps static analysis rules that detect
  vitest-cucumber compatibility issues before tests run.

  Background:
    Given a step lint context

  Rule: Hash comments inside description pseudo-code-blocks are detected

    @acceptance-criteria @happy-path
    Scenario: Hash inside description pseudo-code-block is flagged
      Given a feature file with a pseudo-code-block containing hash in description
      When the step linter checks the feature file
      Then a hash-in-description error is reported

    @acceptance-criteria @validation
    Scenario: Hash in step DocString is not flagged
      Given a feature file with hash inside a step DocString
      When the step linter checks the feature file
      Then no hash-in-description errors are reported

    @acceptance-criteria @edge-case
    Scenario: Section separator comments are not flagged
      Given a feature file with hash separators between keywords
      When the step linter checks the feature file
      Then no hash-in-description errors are reported

  Rule: Duplicate And steps in the same scenario are detected

    @acceptance-criteria @happy-path
    Scenario: Duplicate And step text is flagged
      Given a feature file with duplicate And steps in one scenario
      When the step linter checks the feature file
      Then a duplicate-and-step error is reported

    @acceptance-criteria @edge-case
    Scenario: Same And text in different scenarios is allowed
      Given a feature file with identical And text in separate scenarios
      When the step linter checks the feature file
      Then no duplicate-and-step errors are reported

  Rule: Dollar sign in step text is detected

    @acceptance-criteria @happy-path
    Scenario: Dollar in step text produces warning
      Given a feature file with dollar sign in a When step
      When the step linter checks the feature file
      Then a dollar-in-step-text warning is reported

  Rule: Regex step patterns are detected

    @acceptance-criteria @happy-path
    Scenario: Regex pattern in Given is flagged
      Given a step file with a regex pattern in Given
      When the step linter checks the step file
      Then a regex-step-pattern error is reported

  Rule: Unsupported phrase type is detected

    @acceptance-criteria @happy-path
    Scenario: Phrase type in step string is flagged
      Given a step file with phrase type in a step pattern string
      When the step linter checks the step file
      Then an unsupported-phrase-type error is reported

  Rule: ScenarioOutline function params are detected

    @acceptance-criteria @happy-path
    Scenario: Function params in ScenarioOutline are flagged
      Given a feature file with a Scenario Outline
      And a step file using ScenarioOutline with function params callback
      When the step linter checks the paired files
      Then a scenario-outline-function-params error is reported

    @acceptance-criteria @validation
    Scenario: Function params in regular Scenario are not flagged
      Given a feature file with a regular Scenario only
      And a step file using Scenario with function params callback
      When the step linter checks the paired files
      Then no scenario-outline-function-params errors are reported

  Rule: Missing And destructuring is detected

    @acceptance-criteria @happy-path
    Scenario: Missing And destructuring is flagged
      Given a feature file with And steps
      And a step file that does not destructure And
      When the step linter checks the paired files
      Then a missing-and-destructuring error is reported

    @acceptance-criteria @validation
    Scenario: Present And destructuring passes
      Given a feature file with And steps
      And a step file that destructures And
      When the step linter checks the paired files
      Then no missing-and-destructuring errors are reported

  Rule: Missing Rule wrapper is detected

    @acceptance-criteria @happy-path
    Scenario: Missing Rule wrapper is flagged
      Given a feature file with Rule blocks
      And a step file that does not destructure Rule
      When the step linter checks the paired files
      Then a missing-rule-wrapper error is reported

    @acceptance-criteria @validation
    Scenario: Present Rule wrapper passes
      Given a feature file with Rule blocks
      And a step file that destructures Rule from describeFeature
      When the step linter checks the paired files
      Then no missing-rule-wrapper errors are reported

  Rule: Feature-to-step pairing resolves both loadFeature patterns

    @acceptance-criteria @happy-path
    Scenario: Simple loadFeature path is extracted
      Given a step file with a simple loadFeature string path
      When the pair resolver extracts the feature path
      Then the extracted path matches the expected simple path

    @acceptance-criteria @happy-path
    Scenario: Resolve-based loadFeature path is extracted
      Given a step file with a resolve-based loadFeature path
      When the pair resolver extracts the feature path
      Then the extracted path is a relative path
