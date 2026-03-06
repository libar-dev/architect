@libar-docs
@libar-docs-pattern:StepLintExtendedRules
@libar-docs-status:completed
@libar-docs-unlock-reason:Retroactive-completion
@libar-docs-phase:51
@libar-docs-effort:1d
@libar-docs-depends-on:StepLintVitestCucumber
@libar-docs-product-area:Validation
@libar-docs-business-value:catch-remaining-vitest-cucumber-traps-statically
@libar-docs-priority:high
Feature: Step Lint Extended Rules - Additional vitest-cucumber Traps

  **Problem:**
  The initial lint-steps CLI catches 8 vitest-cucumber traps, but 4 documented
  traps from _claude-md/testing/vitest-cucumber.md remain uncovered:
  - Hash in step text (mid-line) truncates the step at runtime
  - Feature descriptions starting with Given/When/Then break the parser
  - Scenario Outline steps using quoted values (the feature-file side of the
    Two-Pattern Problem — the step-file side is already caught)
  - Repeated identical step patterns in the same scenario overwrite registrations

  These cause cryptic runtime failures that are statically detectable.

  **Solution:**
  Extend lint-steps with 4 new rules using the same pure-function architecture.
  Two are feature-only checks, one is a step-only check, and one is a
  cross-file check. All reuse the existing LintViolation/LintSummary types
  and integrate into the existing runner pipeline.

  | New Rule | Category | Severity | Trap Caught |
  | hash-in-step-text | feature-only | warning | Mid-line hash in step text interpreted as Gherkin comment |
  | keyword-in-description | feature-only | error | Description line starting with Given/When/Then breaks parser |
  | outline-quoted-values | cross-file | warning | Scenario Outline feature steps with quoted values suggest wrong pattern |
  | repeated-step-pattern | step-only | error | Same step pattern registered twice in one scenario block |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Hash-in-step-text check | complete | Yes | src/lint/steps/feature-checks.ts |
      | Keyword-in-description check | complete | Yes | src/lint/steps/feature-checks.ts |
      | Outline-quoted-values check | complete | Yes | src/lint/steps/cross-checks.ts |
      | Repeated-step-pattern check | complete | Yes | src/lint/steps/step-checks.ts |
      | Rule definitions for 4 new rules | complete | No | src/lint/steps/types.ts |
      | Gherkin executable specs | complete | Yes | tests/features/lint/step-lint-extended.feature |

  Rule: Hash in step text is detected

    **Invariant:** A hash character in the middle of a Gherkin step line
    can be interpreted as a comment by some parsers, silently truncating
    the step text. This differs from hash-in-description (which catches
    hash inside description pseudo-code-blocks).

    **Rationale:** We encountered this exact trap while writing the
    lint-steps test suite. Step text like "Given a file with # inside"
    was silently truncated to "Given a file with".

    **Verified by:** Hash in step text produces warning,
    Hash at start of comment line is not flagged

    @acceptance-criteria @happy-path
    Scenario: Hash in step text produces warning
      Given a feature file with hash in a Given step text
      When the step linter checks the feature file
      Then a hash-in-step-text warning is reported

    @acceptance-criteria @edge-case
    Scenario: Hash at start of comment line is not flagged
      Given a feature file with hash comment lines between scenarios
      When the step linter checks the feature file
      Then no hash-in-step-text warnings are reported

  Rule: Gherkin keywords in description text are detected

    **Invariant:** A Feature or Rule description line that starts with
    Given, When, Then, And, or But breaks the Gherkin parser because it
    interprets the line as a step definition rather than description text.

    **Rationale:** This is documented in vitest-cucumber quirks but has
    no static detection. Authors writing natural language descriptions
    accidentally start sentences with these keywords.

    **Verified by:** Description starting with Given is flagged,
    Step lines with Given are not flagged

    @acceptance-criteria @happy-path
    Scenario: Description starting with Given is flagged
      Given a feature file with a description line starting with Given
      When the step linter checks the feature file
      Then a keyword-in-description error is reported

    @acceptance-criteria @validation
    Scenario: Step lines with Given are not flagged
      Given a feature file with Given only in step lines
      When the step linter checks the feature file
      Then no keyword-in-description errors are reported

  Rule: Scenario Outline steps with quoted values are detected

    **Invariant:** When a feature file has a Scenario Outline and its
    steps use quoted values instead of angle-bracket placeholders, this
    indicates the author may be using the Scenario pattern (function
    params) instead of the ScenarioOutline pattern (variables object).
    This is the feature-file side of the Two-Pattern Problem.

    **Rationale:** The existing scenario-outline-function-params rule
    catches the step-file side. This rule catches the feature-file side
    where quoted values in Scenario Outline steps suggest the author
    expects Cucumber expression matching rather than variable substitution.

    **Verified by:** Outline step with quoted value produces warning,
    Outline step with angle bracket is not flagged

    @acceptance-criteria @happy-path
    Scenario: Outline step with quoted value produces warning
      Given a feature file with a Scenario Outline using quoted step values
      When the step linter checks the feature file
      Then an outline-quoted-values warning is reported

    @acceptance-criteria @validation
    Scenario: Outline step with angle bracket is not flagged
      Given a feature file with a Scenario Outline using angle-bracket placeholders
      When the step linter checks the feature file
      Then no outline-quoted-values warnings are reported

  Rule: Repeated step patterns in the same scenario are detected

    **Invariant:** Registering the same step pattern twice in one
    Scenario block causes vitest-cucumber to overwrite the first
    registration. Only the last callback runs, causing silent test
    failures where assertions appear to pass but the setup was wrong.

    **Rationale:** This happens when authors copy-paste step
    definitions within a scenario and forget to change the pattern.
    The failure is silent — tests pass but with wrong assertions.

    **Verified by:** Duplicate Given pattern in one scenario is flagged,
    Same pattern in different scenarios is not flagged

    @acceptance-criteria @happy-path
    Scenario: Duplicate Given pattern in one scenario is flagged
      Given a step file with the same Given pattern registered twice in one scenario
      When the step linter checks the step file
      Then a repeated-step-pattern error is reported

    @acceptance-criteria @edge-case
    Scenario: Same pattern in different scenarios is not flagged
      Given a step file with the same pattern in separate scenario blocks
      When the step linter checks the step file
      Then no repeated-step-pattern errors are reported
