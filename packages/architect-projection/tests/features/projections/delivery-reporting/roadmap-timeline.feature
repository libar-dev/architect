@architect
@architect-pattern:DeliveryReportingProjectionSupportExecutableTests
@architect-implements:DeliveryReportingProjectionSupport
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting timeline support projections

  **Business Value:** Consumers receive internal roadmap grouping plus retained
  public milestone and current-work views, each grouping patterns into quarter
  buckets with per-bucket status counts and deterministic child routing to
  `ROADMAP.md`, `COMPLETED-MILESTONES.md`, or `CURRENT-WORK.md`.

  **How It Works:** A single `buildTimelineBundle` helper selects the pattern
  set for the requested view, groups patterns by `quarter`, sorts buckets
  chronologically (year then quarter, falling back to label), and emits one
  child fragment per quarter. Patterns without a quarter are excluded. The
  output path strategy is view-specific so renderers can route bundles
  deterministically.

  Background:
    Given the Delivery Reporting timeline projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/roadmap-timeline.feature |

  Rule: Timeline bundles keep roadmap internals, milestones, and current work split by entrypoint

    **Invariant:** Each view emits a timeline bundle whose `view` field
    matches the entrypoint (`roadmap`, `milestones`, or `current`), whose
    quarters are ordered chronologically, and whose child keys are
    deterministic slugs derived from the quarter label. Roadmap contains only
    roadmap + deferred patterns, milestones only completed, current only
    active.

    **Rationale:** Splitting the views at projection time keeps renderer
    routing trivial and matches the T10 bundle decision; chronological
    ordering is required for stable documentation output.

    **Verified by:** roadmap quarters are ordered chronologically, completed milestones keep only completed quarter entries, current work keeps only active quarter entries

    @acceptance-criteria
    Scenario: roadmap quarters are ordered chronologically
      Given a timeline projection context with roadmap work in quarters "Q1 2026, Q2 2026, Q10 2026"
      When I project the roadmap timeline
      Then the roadmap root quarters should be ordered as "Q1 2026, Q2 2026, Q10 2026"
      And the roadmap child keys should be ordered as "q1-2026, q2-2026, q10-2026"

    Scenario: completed milestones keep only completed quarter entries
      Given a timeline projection context with completed, active, and planned work
      When I project the completed milestones timeline
      Then the milestones root should contain only completed quarter entries

    Scenario: current work keeps only active quarter entries
      Given a timeline projection context with completed, active, and planned work
      When I project the current work timeline
      Then the current-work root should contain only active quarter entries
