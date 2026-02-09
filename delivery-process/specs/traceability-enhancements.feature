@opportunity-4
@libar-docs
@libar-docs-pattern:TraceabilityEnhancements
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:3d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:detect-coverage-gaps-and-requirements-drift
@libar-docs-priority:medium
Feature: Traceability Enhancements - Requirements ↔ Tests Loop

  **Problem:**
  Current TRACEABILITY.md shows 15% coverage (timeline → behavior).
  No visibility into patterns without scenarios.
  No detection of orphaned scenarios referencing non-existent patterns.

  **Solution:**
  Enhance traceability generator to show:
  - Pattern coverage matrix (scenarios per pattern)
  - Orphaned scenarios report (scenarios without matching patterns)
  - Patterns missing acceptance criteria
  - Coverage gap trends over time

  Implements Convergence Opportunity 4: Requirements ↔ Tests Traceability.

  Existing: docs-living/TRACEABILITY.md

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Coverage matrix section | pending | Yes | src/generators/sections/ |
      | Orphaned scenarios detector | pending | Yes | src/analyzers/ |
      | Pattern gap reporter | pending | Yes | src/analyzers/ |

  @acceptance-criteria
  Scenario: Show pattern coverage matrix
    Given patterns with associated behavior scenarios
    When generating traceability report
    Then matrix shows scenario count per pattern
    And coverage percentage is calculated

  @acceptance-criteria
  Scenario: Detect orphaned scenarios
    Given behavior scenarios referencing non-existent patterns
    When generating traceability report
    Then orphaned scenarios are listed with warning
    And expected pattern names are shown
