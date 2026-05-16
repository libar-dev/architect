@architect
@architect-pattern:PatternGraphApiReverseLookup
@architect-status:active
@architect-product-area:Annotation
@behavior @read-api
Feature: PatternGraphAPI reverse lookups stay canonical

  `createPatternGraphAPI` should never silently report empty reverse
  relationship collections for an existing pattern just because the runtime
  graph omitted `relationshipIndex` or because the stored index is stale.
  The API must derive reverse lookups from the canonical relationship builder
  or fail loudly; it must not pretend there are no `usedBy` or `enables`
  callers when the source patterns say otherwise.

  Background: Synthetic graph with one dependency edge
    Given a synthetic graph where "AlphaCore" uses "BetaCore"

  Rule: Missing relationship index still resolves reverse lookups

    @acceptance-criteria @happy-path
    Scenario: Reverse relationships derive when relationshipIndex is unavailable
      Given the graph omits relationshipIndex
      When I query pattern relationships for "BetaCore"
      Then the relationships field "usedBy" contains "AlphaCore"
      And the relationships field "enables" contains "AlphaCore"

  Rule: Stale relationship index does not return false-empty reverse lookups

    @acceptance-criteria @error-path
    Scenario: Reverse relationships ignore stale empty reverse arrays
      Given the graph has a stale relationshipIndex with empty reverse arrays for "BetaCore"
      When I query pattern dependencies for "BetaCore"
      Then the dependencies field "usedBy" contains "AlphaCore"
      And the dependencies field "enables" contains "AlphaCore"

  Rule: Shared read-api helpers fail loudly for missing canonical entries

    @acceptance-criteria @error-path
    Scenario: Foreign patterns trigger the canonical relationship invariant
      Given a foreign pattern named "GhostCore"
      When I resolve relationships for that foreign pattern through the shared helper
      Then the invariant error equals "PatternGraphAPI invariant violated: canonical relationship entry missing for pattern GhostCore"

  Rule: Neighbor queries reuse the shared canonical relationship seam

    @acceptance-criteria @happy-path
    Scenario: Neighborhood lookup derives reverse relationships without relationshipIndex
      Given the graph omits relationshipIndex
      When I compute the neighborhood for "BetaCore"
      Then the neighborhood field "usedBy" contains "AlphaCore"
      And the neighborhood field "enables" contains "AlphaCore"
