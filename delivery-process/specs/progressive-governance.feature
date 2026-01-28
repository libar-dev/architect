@opportunity-6
@libar-docs
@libar-docs-pattern:ProgressiveGovernance
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:2d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:filter-work-by-risk-and-priority
@libar-docs-priority:medium
Feature: Progressive Governance - Opt-in Richness Where It Matters

  **Problem:**
  Enterprise governance patterns applied everywhere create overhead.
  Simple utility patterns don't need risk tables and stakeholder approvals.
  No way to filter views by governance level.

  **Solution:**
  Enable governance as a lens, not a mandate:
  - Default: Lightweight (no risk/compliance tags required)
  - Opt-in: Rich governance for high-risk patterns only

  Use risk metadata to:
  - Filter roadmap views by risk level
  - Require additional metadata only for high-risk patterns
  - Generate risk-focused dashboards when requested

  Implements Convergence Opportunity 6: Progressive Governance.

  Note: This is lower priority because simple --filter "risk=high" on
  existing generators achieves 80% of the value. This phase adds polish.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Risk filter for generators | Pending | Yes | src/generators/ |
      | Risk-based validation rules | Pending | Yes | src/lint/ |
      | Risk summary section renderer | Pending | Yes | src/generators/sections/ |

  @acceptance-criteria
  Scenario: Filter roadmap by risk level
    Given TypeScript phase files with varying risk levels
    When generating roadmap with --filter "risk=high"
    Then only high-risk phases appear in output
    And risk level is prominently displayed

  @acceptance-criteria
  Scenario: Lint rules for high-risk patterns
    Given a pattern with high risk level
    When running lint validation
    Then warning is emitted if risk mitigation is not documented
    And suggestion to add Background risk table is shown

  @acceptance-criteria
  Scenario: Generate risk summary view
    Given phases with risk metadata across the roadmap
    When generating risk summary
    Then patterns are grouped by risk level
    And high-risk items show mitigation status
