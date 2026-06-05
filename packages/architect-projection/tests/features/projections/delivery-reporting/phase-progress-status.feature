@architect
@architect-pattern:DeliveryProgressProjectionExecutableTests
@architect-implements:DeliveryReportingProjectionSupport,StatusDistributionProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting progress projections

  **Business Value:** Consumers receive status distribution across the whole
  graph in a stable, schema-validated shape — completed, active, planned, and
  candidate counts plus a rounded delivery completion percentage — without
  touching the raw PatternGraph or legacy renderer output.

  **How It Works:** The projection resolves its inputs from `ProjectionContext`
  (the full pattern list), classifies patterns with the core
  `isPatternComplete` / `isPatternActive` / `isPatternPlanned` helpers, and
  emits a fragment whose percentages exclude candidates from the delivery total.
  Zero-delivery graphs emit explicit zero percentages rather than `NaN`.

  Background:
    Given the Delivery Reporting progress projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/phase-progress-status.feature |

  Rule: Status distribution keeps zero-delivery percentages honest

    **Invariant:** `StatusDistribution` always carries completed, active,
    planned, candidate, and total counts plus percentage fields for each
    bucket. When the delivery total is zero, every percentage is `0` rather
    than a division-by-zero artifact; the candidate percentage is always
    computed against the full total so a candidate-only graph still reports a
    meaningful share.

    **Rationale:** Consumers render these percentages directly; silent `NaN`
    or inflated completion would corrupt downstream dashboards and status
    reports.

    **Verified by:** projecting status distribution for mixed delivery work, zero-delivery projects report zero percentages

    @acceptance-criteria
    Scenario: projecting status distribution for mixed delivery work
      Given a status distribution context with completed, active, planned, and candidate work
      When I project the status distribution
      Then the status distribution fragment should expose the expected percentages

    Scenario: zero-delivery projects report zero percentages
      Given a status distribution context with only candidate work
      When I project the status distribution
      Then the status distribution percentages should all be zero

    Scenario: projection filters scope status distribution counts
      Given a filtered status distribution context with completed, active, planned, and candidate work
      When I project the status distribution
      Then the status distribution fragment should include only filtered status patterns
