@architect
@behavior @anti-patterns
@architect-pattern:AntiPatternDetectorTesting
@architect-implements:AntiPatternDetector
@architect-status:completed
@architect-product-area:Validation
@architect-depends-on:DoDValidationTypes
Feature: Anti-Pattern Detection
  Detects violations of the dual-source documentation architecture and
  process hygiene issues that lead to documentation drift.

  **Problem:**
  - Dependencies in features (should be code-only) cause drift
  - Process metadata in code (should be features-only) violates separation
  - Generator hints in features create tight coupling
  - Large feature files are hard to maintain

  **Solution:**
  - detectProcessInCode() finds feature-only tags in code
  - detectMagicComments() finds generator hints in features
  - detectScenarioBloat() warns about too many scenarios
  - detectMegaFeature() warns about large feature files

  # ==========================================================================
  # Process-in-Code Detection
  # ==========================================================================

  Rule: Process metadata should not appear in TypeScript code

    **Invariant:** Process metadata tags (@architect-status, @architect-phase, etc.) must only appear in Gherkin feature files, never in TypeScript source code.
    **Rationale:** TypeScript owns runtime behavior while Gherkin owns delivery process metadata — mixing them creates dual-source conflicts and validation ambiguity.
    **Verified by:** Code without process tags passes, Feature-only process tags in code are flagged

    @happy-path
    Scenario: Code without process tags passes
      Given a TypeScript file with directive tags:
        | tag                        |
        | @architect                |
        | @architect-pattern        |
        | @architect-status         |
        | @architect-depends-on     |
      When detecting process-in-code anti-patterns
      Then no violations are found

    @edge-case
    Scenario Outline: Feature-only process tags in code are flagged
      Given a TypeScript file with process tag "<process_tag>"
      When detecting process-in-code anti-patterns
      Then a "process-in-code" violation is found
      And the violation severity is "error"
      And the fix suggests moving to feature file

      Examples:
        | process_tag               |
        | @architect-quarter       |
        | @architect-team          |
        | @architect-effort        |
        | @architect-workflow      |
        | @architect-completed     |
        | @architect-effort-actual |

  # ==========================================================================
  # Magic Comments Detection
  # ==========================================================================

  Rule: Generator hints should not appear in feature files

    **Invariant:** Feature files must not contain generator magic comments beyond a configurable threshold.
    **Rationale:** Generator hints are implementation details that belong in TypeScript — excessive magic comments in specs indicate leaking implementation concerns into business requirements.
    **Verified by:** Feature without magic comments passes, Features with excessive magic comments are flagged, Magic comments within threshold pass

    @happy-path
    Scenario: Feature without magic comments passes
      Given a feature file content:
        """
        Feature: Normal Feature
          A normal feature without generator hints.

        Scenario: Normal scenario
          Given some precondition
          Then some result
        """
      When detecting magic comments with threshold 5
      Then no violations are found

    @edge-case
    Scenario: Features with excessive magic comments are flagged
      Given a feature file with 6 magic comments
      When detecting magic comments with threshold 5
      Then a "magic-comments" violation is found
      And the violation severity is "warning"
      And the violation message mentions "6 magic comments"

    @edge-case
    Scenario: Magic comments within threshold pass
      Given a feature file content:
        """
        # GENERATOR: header
        Feature: Acceptable Feature
          Some generator hint is OK.
        """
      When detecting magic comments with threshold 5
      Then no violations are found

  # ==========================================================================
  # Scenario Bloat Detection
  # ==========================================================================

  Rule: Feature files should not have excessive scenarios

    **Invariant:** A single feature file must not exceed the configured maximum scenario count.
    **Rationale:** Oversized feature files indicate missing decomposition — they become hard to maintain and slow to execute.
    **Verified by:** Feature with few scenarios passes, Feature exceeding scenario threshold is flagged

    @happy-path
    Scenario: Feature with few scenarios passes
      Given a feature with 5 scenarios
      When detecting scenario bloat with threshold 20
      Then no violations are found

    @edge-case
    Scenario: Feature exceeding scenario threshold is flagged
      Given a feature with 25 scenarios
      When detecting scenario bloat with threshold 20
      Then a "scenario-bloat" violation is found
      And the violation severity is "warning"
      And the fix suggests splitting the feature

  # ==========================================================================
  # Mega-Feature Detection
  # ==========================================================================

  Rule: Feature files should not exceed size thresholds

    **Invariant:** A single feature file must not exceed the configured maximum line count.
    **Rationale:** Excessively large files indicate a feature that should be split into focused, independently testable specifications.
    **Verified by:** Normal-sized feature passes, Oversized feature is flagged

    @happy-path
    Scenario: Normal-sized feature passes
      Given a feature file with 100 lines
      When detecting mega-feature with threshold 500
      Then no violations are found

    @edge-case
    Scenario: Oversized feature is flagged
      Given a feature file with 600 lines
      When detecting mega-feature with threshold 500
      Then a "mega-feature" violation is found
      And the violation severity is "warning"
      And the violation message mentions "lines"

  # ==========================================================================
  # Combined Detection
  # ==========================================================================

  Rule: All anti-patterns can be detected in one pass

    **Invariant:** The anti-pattern detector must evaluate all registered rules in a single scan pass over the source files.
    **Rationale:** Single-pass detection ensures consistent results and avoids O(n*m) performance degradation with multiple file traversals.
    **Verified by:** Combined detection finds process-in-code issues

    @integration
    Scenario: Combined detection finds process-in-code issues
      Given a TypeScript file with directive tags:
        | tag                 |
        | @architect         |
        | @architect-quarter |
      And a feature file with tags:
        | tag                       |
        | architect-pattern:MyTest |
      When detecting all anti-patterns
      Then 1 violation is found
      And violations include "process-in-code"

  # ==========================================================================
  # Report Formatting
  # ==========================================================================

  Rule: Violations can be formatted for console output

    **Invariant:** Anti-pattern violations must be renderable as grouped, human-readable console output.
    **Rationale:** Developers need actionable feedback at commit time — ungrouped or unformatted violations are hard to triage and fix.
    **Verified by:** Empty violations produce clean report, Violations are grouped by severity

    Scenario: Empty violations produce clean report
      Given no violations
      When formatting the anti-pattern report
      Then the report contains "No anti-patterns detected"

    Scenario: Violations are grouped by severity
      Given violations:
        | id               | severity |
        | tag-duplication  | error    |
        | magic-comments   | warning  |
        | process-in-code  | error    |
      When formatting the anti-pattern report
      Then the report contains "Errors (architectural violations)"
      And the report contains "Warnings (hygiene issues)"
      And the report shows "2 errors, 1 warning"
