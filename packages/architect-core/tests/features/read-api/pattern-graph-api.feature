@architect
@architect-pattern:PatternGraphApiReverseLookup
@architect-implements:PatternGraphApi
@architect-status:active
@architect-product-area:Annotation
@behavior @read-api
Feature: PatternGraphAPI reverse lookups stay canonical

  `createPatternGraphAPI` should never silently report empty reverse
  relationship collections for an existing pattern. The graph seam now owns a
  canonical `relationshipIndex`, and the read API must consume that index
  directly instead of rebuilding or guessing local fallback state.

  Background: Synthetic graph with one dependency edge
    Given a synthetic graph where "AlphaCore" uses "BetaCore"

  Rule: Canonical relationship index resolves reverse lookups

    @acceptance-criteria @happy-path
    Scenario: Reverse relationships read from the canonical relationship index
      Given the graph includes the canonical relationship index
      When I query pattern relationships for "BetaCore"
      Then the relationships field "usedBy" contains "AlphaCore"
      And the relationships field "enables" contains "AlphaCore"

  Rule: Dependency queries reuse the same canonical relationship index

    @acceptance-criteria @error-path
    Scenario: Reverse relationships stay canonical through dependency queries
      Given the graph includes the canonical relationship index
      When I query pattern dependencies for "BetaCore"
      Then the dependencies field "usedBy" contains "AlphaCore"
      And the dependencies field "enables" contains "AlphaCore"

  Rule: Shared read-api helpers fail loudly for missing canonical entries

    @acceptance-criteria @error-path
    Scenario: Foreign patterns trigger the canonical relationship invariant
      Given a foreign pattern named "GhostCore"
      When I resolve relationships for that foreign pattern through the shared helper
      Then the invariant error equals "read-api invariant violated: canonical relationship entry missing for pattern GhostCore"

  Rule: Neighbor queries reuse the shared canonical relationship seam

    @acceptance-criteria @happy-path
    Scenario: Neighborhood lookup reads the canonical relationship index
      Given the graph includes the canonical relationship index
      When I compute the neighborhood for "BetaCore"
      Then the neighborhood field "usedBy" contains "AlphaCore"
      And the neighborhood field "enables" contains "AlphaCore"
