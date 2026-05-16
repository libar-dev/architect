@architect
@architect-pattern:DeliveryProgressProjectionExecutableTests
@architect-implements:DeliveryReportingProjectionSupport,PhaseProgressProjection,StatusDistributionProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting progress projections

  **Business Value:** Consumers receive delivery progress for a single phase and
  status distribution across the whole graph in a stable, schema-validated shape
  — completed, active, planned, and candidate counts plus a rounded delivery
  completion percentage — without touching the raw PatternGraph or legacy
  renderer output.

  **How It Works:** Each projection resolves its inputs from `ProjectionContext`
  (a phase group or the full pattern list), classifies patterns with the core
  `isPatternComplete` / `isPatternActive` / `isPatternPlanned` helpers, and
  emits a fragment whose percentages exclude candidates from the delivery total.
  Missing phases yield `undefined`; zero-delivery graphs emit explicit zero
  percentages rather than `NaN`.

  Background:
    Given the Delivery Reporting progress projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/delivery-reporting/phase-progress-status.feature |

  Rule: Phase progress reflects delivery counts without artificial completion

    **Invariant:** `PhaseProgress` always exposes the phase number plus
    completed, active, planned, candidate, and total counts for that phase, and
    the `completionPercentage` is calculated against the delivery total
    (`total - candidate`). Unknown phases yield `undefined` rather than an empty
    fragment.

    **Rationale:** Counting candidates as in-scope delivery inflates completion;
    returning an empty fragment for a missing phase would hide the caller's
    error.

    **Verified by:** projecting progress for a named phase, missing phases return no fragment

    @acceptance-criteria
    Scenario: projecting progress for a named phase
      Given a progress projection context for phase 16 named "Timeline Bodies"
      When I project phase progress for phase 16
      Then the phase progress fragment should expose the named phase counts

    Scenario: missing phases return no fragment
      Given a progress projection context for phase 16 named "Timeline Bodies"
      When I project phase progress for the missing phase 99
      Then the phase progress result should be undefined

    Scenario: projection filters scope phase progress counts
      Given a filtered progress projection context for phase 16 named "Timeline Bodies"
      When I project phase progress for phase 16
      Then the phase progress fragment should include only filtered phase patterns

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
