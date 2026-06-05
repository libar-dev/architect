@architect
@architect-pattern:DeliveryReportingProjectionSupportExecutableTests
@architect-implements:DeliveryReportingProjectionSupport
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting timeline support projections

  **Business Value:** Consumers receive an internal roadmap view plus a retained
  current-work view, each a flat, name-sorted pattern list with overall status
  counts and deterministic routing to `ROADMAP.md` or `CURRENT-WORK.md`.

  **How It Works:** A single `buildTimelineBundle` helper selects the pattern
  set for the requested view, sorts patterns by name, and folds them into a flat
  `RoadmapTimeline` fragment with overall status counts. The output path
  strategy is view-specific so renderers can route bundles deterministically.

  Background:
    Given the Delivery Reporting timeline projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/roadmap-timeline.feature |

  Rule: Timeline bundles keep roadmap and current work split by entrypoint

    **Invariant:** Each view emits a timeline bundle whose `view` field
    matches the entrypoint (`roadmap` or `current`) over a flat, name-sorted
    pattern list. Roadmap contains only roadmap + deferred patterns, current
    only active.

    **Rationale:** Splitting the views at projection time keeps renderer
    routing trivial; name-sorting keeps documentation output stable.

    **Verified by:** roadmap timeline lists roadmap and deferred patterns, current work keeps only active patterns

    @acceptance-criteria
    Scenario: roadmap timeline lists roadmap and deferred patterns
      Given a timeline projection context with roadmap and deferred work
      When I project the roadmap timeline
      Then the roadmap root should list the roadmap and deferred patterns name-sorted

    Scenario: current work keeps only active patterns
      Given a timeline projection context with completed, active, and planned work
      When I project the current work timeline
      Then the current-work root should contain only active patterns
