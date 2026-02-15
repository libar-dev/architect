Feature: Step Lint Extended Rules - Additional vitest-cucumber Traps

  Tests for the 4 extended lint-steps rules that catch additional
  vitest-cucumber compatibility issues statically.

  Background:
    Given a step lint context

  Rule: Hash in step text is detected

    @acceptance-criteria @happy-path
    Scenario: Hash in step text produces warning
      Given a feature file with hash inside step text
      When the step linter checks the feature file for hash-in-step-text
      Then a hash-in-step-text warning is reported

    @acceptance-criteria @edge-case
    Scenario: Hash at start of comment line is not flagged
      Given a feature file with hash comment lines between scenarios
      When the step linter checks the feature file for hash-in-step-text
      Then no hash-in-step-text warnings are reported

  Rule: Keywords in description text are detected

    @acceptance-criteria @happy-path
    Scenario: Description starting with a keyword is flagged
      Given a feature file with a description line starting with a keyword
      When the step linter checks the feature file for keyword-in-description
      Then a keyword-in-description error is reported

    @acceptance-criteria @validation
    Scenario: Step lines with keywords are not flagged
      Given a feature file with keywords only in step lines
      When the step linter checks the feature file for keyword-in-description
      Then no keyword-in-description errors are reported

  Rule: Scenario Outline steps with quoted values are detected

    @acceptance-criteria @happy-path
    Scenario: Outline step with quoted value produces warning
      Given a feature file with a Scenario Outline using quoted step values
      And a step file paired with the feature
      When the step linter checks the paired files for outline-quoted-values
      Then an outline-quoted-values warning is reported

    @acceptance-criteria @validation
    Scenario: Outline step with angle bracket is not flagged
      Given a feature file with a Scenario Outline using angle-bracket placeholders
      And a step file paired with the feature
      When the step linter checks the paired files for outline-quoted-values
      Then no outline-quoted-values warnings are reported

  Rule: Repeated step patterns in the same scenario are detected

    @acceptance-criteria @happy-path
    Scenario: Duplicate step pattern in one scenario is flagged
      Given a step file with the same step pattern registered twice in one scenario
      When the step linter checks the step file for repeated-step-pattern
      Then a repeated-step-pattern error is reported

    @acceptance-criteria @edge-case
    Scenario: Same pattern in different scenarios is not flagged
      Given a step file with the same pattern in separate scenario blocks
      When the step linter checks the step file for repeated-step-pattern
      Then no repeated-step-pattern errors are reported
