@opportunity-2
@libar-docs-pattern:DoDValidation
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:3d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:enable-machine-checkable-phase-completion
@libar-docs-priority:high
Feature: DoD Validation CLI - Machine-Checkable Definition of Done

  **Problem:**
  Phase completion is currently subjective ("done when we feel it").
  No objective criteria validation, easy to miss deliverables.
  Cannot gate CI/releases on DoD compliance.

  **Solution:**
  Implement `pnpm validate:dod --phase N` CLI command that:
  - Checks all deliverables have status "Complete"/"Done"
  - Verifies at least one @acceptance-criteria scenario exists
  - Warns if effort-actual is missing for completed phases
  - Returns exit code for CI gating

  Implements Convergence Opportunity 2: DoD as Machine-Checkable.

  See: docs/ideation-convergence/01-delivery-process-opportunities.md

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | validate:dod CLI command | Pending | Yes | src/cli/ |
      | Deliverable status parser | Pending | Yes | src/extractor/ |
      | Acceptance criteria checker | Pending | Yes | src/validation/ |
      | CI integration documentation | Pending | No | README.md |

  @acceptance-criteria
  Scenario: Validate DoD for completed phase
    Given a phase with all deliverables marked "Complete"
    And at least one @acceptance-criteria scenario exists
    When running pnpm validate:dod --phase N
    Then exit code is 0
    And report shows "DoD met"

  @acceptance-criteria
  Scenario: Detect incomplete DoD
    Given a phase marked "completed" with incomplete deliverables
    When running pnpm validate:dod --phase N
    Then exit code is 1
    And report lists incomplete deliverables

  @acceptance-criteria
  Scenario: Warn on missing effort-actual
    Given a completed phase without effort-actual metadata
    When running pnpm validate:dod --phase N
    Then warning is emitted for missing variance data
    But exit code is still 0 (warning, not error)
