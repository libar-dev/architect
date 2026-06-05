@architect
@architect-pattern:ArchitectureDelta
@architect-status:roadmap
@architect-product-area:Generation
Feature: Architecture Delta Generation

  **Problem:**
  Architecture evolution is not visible between tagged releases.
  Breaking architectural changes are not clearly documented.
  Newly introduced constraints are hard to track across tagged cuts.
  No automated way exists to generate "what changed" between release tags.

  **Solution:**
  Generate ARCH-DELTA.md showing changes between two git tags:
  - New patterns introduced (with ADR references)
  - Breaking changes (with migration guidance where authored)
  - New and changed constraints (with rationale and owning ADRs)

  Uses git tags to determine release boundaries.
  Uses graph diffs plus ADR references; no release manifest or release
  annotation is required.

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
    And ADR references are included

  @acceptance-criteria
  Scenario: Highlight breaking changes
    Given patterns added, removed, or materially changed between two git tags
    When generating architecture delta
    Then breaking changes section is populated
    And migration guidance is included where available

  @acceptance-criteria
  Scenario: Show new constraints introduced between tags
    Given decision records accepted between two git tags
    When generating architecture delta
    Then constraints are listed with owning ADRs
    And rationale from ADRs is summarized
