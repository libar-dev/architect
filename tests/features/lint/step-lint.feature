Feature: Step Lint - vitest-cucumber Compatibility Checks

  Tests for the lint-steps static analysis rules that detect
  vitest-cucumber compatibility issues before tests run.

  Background:
    Given a step lint context

  Rule: Hash comments inside description pseudo-code-blocks are detected

    **Invariant:** Lines starting with `#` inside description pseudo-code-blocks must be flagged as errors because the Gherkin parser interprets them as comments, terminating the description context.
    **Rationale:** The Gherkin parser treats `#` at line start as a comment even inside `"""` description blocks, causing silent parse failures and lost content.
    **Verified by:** Hash inside description pseudo-code-block is flagged, Hash in step DocString is not flagged, Section separator comments are not flagged

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

    **Invariant:** Multiple `And` steps with identical text within a single scenario must be flagged because vitest-cucumber fails to match them correctly.
    **Rationale:** vitest-cucumber registers step patterns by text; duplicate `And` text causes the second registration to overwrite the first, silently skipping assertions.
    **Verified by:** Duplicate And step text is flagged, Same And text in different scenarios is allowed

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

    **Invariant:** Step text containing a `$` character must produce a warning because it causes pattern matching failures in vitest-cucumber.
    **Verified by:** Dollar in step text produces warning

    @acceptance-criteria @happy-path
    Scenario: Dollar in step text produces warning
      Given a feature file with dollar sign in a When step
      When the step linter checks the feature file
      Then a dollar-in-step-text warning is reported

  Rule: Regex step patterns are detected

    **Invariant:** Step definitions using regex patterns (e.g., `/pattern/`) must be flagged as errors because vitest-cucumber only supports string patterns with Cucumber expressions.
    **Rationale:** Using regex patterns throws `StepAbleStepExpressionError` at runtime; only `{string}` and `{int}` Cucumber expression placeholders are supported.
    **Verified by:** Regex pattern in Given is flagged

    @acceptance-criteria @happy-path
    Scenario: Regex pattern in Given is flagged
      Given a step file with a regex pattern in Given
      When the step linter checks the step file
      Then a regex-step-pattern error is reported

  Rule: Unsupported phrase type is detected

    **Invariant:** Step patterns using the `{phrase}` placeholder type must be flagged because vitest-cucumber does not support it.
    **Rationale:** Only `{string}` and `{int}` are valid Cucumber expression types in vitest-cucumber; `{phrase}` silently fails to match.
    **Verified by:** Phrase type in step string is flagged

    @acceptance-criteria @happy-path
    Scenario: Phrase type in step string is flagged
      Given a step file with phrase type in a step pattern string
      When the step linter checks the step file
      Then an unsupported-phrase-type error is reported

  Rule: ScenarioOutline function params are detected

    **Invariant:** ScenarioOutline step definitions using function parameters (e.g., `{string}`) instead of the variables object must be flagged as errors.
    **Rationale:** ScenarioOutline uses `<column>` placeholders accessed via a variables object; `{string}` function params only work in regular Scenarios and silently fail in Outlines.
    **Verified by:** Function params in ScenarioOutline are flagged, Function params in regular Scenario are not flagged

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

    **Invariant:** Step files that use `And` steps in the feature file must destructure `And` from the scenario callback; omitting it causes `StepAbleUnknowStepError` at runtime.
    **Verified by:** Missing And destructuring is flagged, Present And destructuring passes

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

    **Invariant:** Step files paired with feature files containing `Rule:` blocks must destructure `Rule` from `describeFeature`; omitting it causes steps inside Rule blocks to go unmatched.
    **Verified by:** Missing Rule wrapper is flagged, Present Rule wrapper passes

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

    **Invariant:** The pair resolver must extract feature file paths from both simple string literals and `resolve()`-based expressions in `loadFeature()` calls.
    **Rationale:** Step files use two different patterns to reference feature files; failing to resolve either pattern breaks cross-file lint rules that require paired analysis.
    **Verified by:** Simple loadFeature path is extracted, Resolve-based loadFeature path is extracted

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
