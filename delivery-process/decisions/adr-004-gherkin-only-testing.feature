@libar-docs
@libar-docs-adr:004
@libar-docs-adr-status:accepted
@libar-docs-adr-category:testing
@libar-docs-pattern:ADR004GherkinOnlyTesting
@libar-docs-phase:43
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-libar-docs-opt-in-marker
@libar-docs-completed:2026-01-07
@libar-docs-product-area:Process
Feature: ADR-004 - Gherkin-Only Testing Policy

  **Context:**
  The delivery-process package had dual test approaches creating inconsistency.
  - 97 legacy tests in .test.ts files alongside Gherkin features
  - Gherkin features are authoritative source for documentation
  - Having .test.ts files undermines "single source of truth" principle
  - Package's thesis is that .feature files ARE sufficient for all testing
  - Edge cases were handled in .test.ts but could use Scenario Outline

  **Decision:**
  Enforce strict Gherkin-only testing policy for delivery-process package:
  - ALL tests must be .feature files with step definitions
  - NO new .test.ts files allowed
  - Existing .test.ts files to be migrated progressively
  - Edge cases use Scenario Outline with Examples tables
  - CI fails if new .test.ts files are added

  **Consequences:**
  - (+) Single source of truth for tests AND documentation
  - (+) Demonstrates Gherkin IS sufficient for comprehensive testing
  - (+) Living documentation always matches test coverage
  - (+) Forces better scenario design with Examples tables
  - (-) Migration effort for 97 existing tests
  - (-) Scenario Outline syntax more verbose than parameterized tests
  - (-) Some developers less familiar with Gherkin

  **Alternatives Considered:**
  - Keep hybrid approach: Rejected because it undermines the package's core thesis
  - TypeScript-only tests: Rejected because it loses documentation benefit
  - Gradual migration without enforcement: Rejected because new .test.ts files would accumulate

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location | Release |
      | Policy definition in CLAUDE.md | Complete | No | CLAUDE.md | v0.3.0 |
      | Test migration manifest | Pending | No | docs/test-migration-manifest.md | v0.3.2 |

  @acceptance-criteria
  Scenario: Gherkin-only policy enforced
    Given the delivery-process package
    When checking for .test.ts files in tests/
    Then only step definition files (.steps.ts) are allowed
    And all test logic is in .feature files
