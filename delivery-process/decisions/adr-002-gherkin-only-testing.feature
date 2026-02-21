@libar-docs
@libar-docs-adr:002
@libar-docs-adr-status:accepted
@libar-docs-adr-category:testing
@libar-docs-pattern:ADR002GherkinOnlyTesting
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-process-workflow-include-tag
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Process
@libar-docs-include:process-workflow
Feature: ADR-002 - Gherkin-Only Testing Policy

  **Context:**
  A package that generates documentation from `.feature` files had dual
  test approaches: 97 legacy `.test.ts` files alongside Gherkin features.
  This undermined the core thesis that Gherkin IS sufficient for all testing.

  **Decision:**
  Enforce strict Gherkin-only testing for the delivery-process package:
  - All tests must be `.feature` files with step definitions
  - No new `.test.ts` files
  - Edge cases use Scenario Outline with Examples tables

  **Consequences:**
  | Type | Impact |
  | Positive | Single source of truth for tests AND documentation |
  | Positive | Demonstrates Gherkin sufficiency -- the package practices what it preaches |
  | Positive | Living documentation always matches test coverage |
  | Positive | Forces better scenario design with Examples tables |
  | Negative | Scenario Outline syntax more verbose than parameterized tests |

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Policy definition in CLAUDE.md | complete | CLAUDE.md |

  # ===========================================================================
  # RULE 1: Source-Driven Process Benefit
  # ===========================================================================

  Rule: Source-driven process benefit

    **Invariant:** Feature files serve as both executable specs and
    documentation source. This dual purpose is the primary benefit
    of Gherkin-only testing for this package.
    **Rationale:** Parallel `.test.ts` files create a hidden test layer invisible to the documentation pipeline, undermining the single source of truth principle this package enforces.

    | Artifact | Without Gherkin-Only | With Gherkin-Only |
    | Tests | .test.ts (hidden from docs) | .feature (visible in docs) |
    | Business rules | Manually maintained | Extracted from Rule blocks |
    | Acceptance criteria | Implicit in test code | Explicit @acceptance-criteria tags |
    | Traceability | Manual cross-referencing | @libar-docs-implements links |

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria
  Scenario: Gherkin-only policy enforced
    Given the delivery-process package
    When checking for .test.ts files in tests/
    Then only step definition files (.steps.ts) are allowed
    And all test logic is in .feature files
