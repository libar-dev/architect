@opportunity-5
@libar-docs
@libar-docs-pattern:ArchitectureDelta
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-effort:2d
@libar-docs-product-area:Generation
@libar-docs-business-value:document-release-changes-automatically
@libar-docs-priority:medium
Feature: Architecture Delta Generation - ADRs as Release Notes

  **Problem:**
  Architecture evolution is not visible between releases.
  Breaking changes are not clearly documented.
  New constraints introduced by phases are hard to track.
  No automated way to generate "what changed" for a release.

  **Solution:**
  Generate ARCH-DELTA.md showing changes since last release:
  - New patterns introduced (with ADR references)
  - Deprecated patterns (with replacement guidance)
  - New constraints (with rationale)
  - Breaking changes (with migration notes)

  Uses git tags to determine release boundaries.
  Uses @libar-docs-decision, @libar-docs-replaces annotations.

  Implements Convergence Opportunity 5: Architecture Change Control.

  # ===========================================================================
  # DELIVERABLES
  # ===========================================================================

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Release boundary detector (git tags) | pending | Yes | src/analyzers/ |
      | Pattern diff analyzer | pending | Yes | src/analyzers/ |
      | Architecture delta section renderer | pending | Yes | src/generators/sections/ |
      | arch-delta generator config | pending | No | src/generators/built-in/ |

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria
  Scenario: Generate delta between releases
    Given patterns annotated with decision tags
    And git tags marking release versions
    When running architecture delta generator for v0.2.0
    Then report shows new patterns since v0.1.0
    And deprecated patterns are listed with replacements
    And ADR references are included

  @acceptance-criteria
  Scenario: Highlight breaking changes
    Given patterns with replaces annotations
    When generating architecture delta
    Then breaking changes section is populated
    And migration guidance is included where available

  @acceptance-criteria
  Scenario: Show new constraints by phase
    Given phases introducing new constraints
    When generating architecture delta
    Then constraints are listed with introducing phase
    And rationale from ADRs is summarized
