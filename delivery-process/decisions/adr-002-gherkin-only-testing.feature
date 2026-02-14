@libar-docs
@libar-docs-adr:002
@libar-docs-adr-status:accepted
@libar-docs-adr-category:testing
@libar-docs-pattern:ADR002GherkinOnlyTesting
@libar-docs-status:completed
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Process
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
  - (+) Single source of truth for tests AND documentation
  - (+) Demonstrates Gherkin sufficiency — the package practices what it preaches
  - (+) Living documentation always matches test coverage
  - (+) Forces better scenario design with Examples tables
  - (-) Scenario Outline syntax more verbose than parameterized tests

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Policy definition in CLAUDE.md | complete | CLAUDE.md |

  Rule: Source-driven process benefit

    **Invariant:** Feature files serve as both executable specs and
    documentation source. This dual purpose is the primary benefit
    of Gherkin-only testing for this package.

    | Artifact | Without Gherkin-Only | With Gherkin-Only |
    | Tests | .test.ts (hidden from docs) | .feature (visible in docs) |
    | Business rules | Manually maintained | Extracted from Rule blocks |
    | Acceptance criteria | Implicit in test code | Explicit @acceptance-criteria tags |
    | Traceability | Manual cross-referencing | @libar-docs-implements links |

  @acceptance-criteria
  Scenario: Gherkin-only policy enforced
    Given the delivery-process package
    When checking for .test.ts files in tests/
    Then only step definition files (.steps.ts) are allowed
    And all test logic is in .feature files
