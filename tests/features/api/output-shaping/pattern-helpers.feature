@architect
@architect-pattern:PatternHelpersTests
@architect-status:active
@architect-phase:25a
@architect-product-area:DataAPI
Feature: Pattern Helpers — Shared Lookup Utilities

  Rule: getPatternName uses patternName tag when available

    **Invariant:** getPatternName must return the patternName tag value when set, falling back to the pattern's name field when the tag is absent.
    **Rationale:** The patternName tag allows human-friendly display names — without the fallback, patterns missing the tag would display as undefined.
    **Verified by:** Returns patternName when set, Falls back to name when patternName is absent

    @acceptance-criteria @happy-path
    Scenario: Returns patternName when set
      Given a pattern with name "FooImpl" and patternName "Foo"
      When I get the pattern name
      Then the result is "Foo"

    @acceptance-criteria @happy-path
    Scenario: Falls back to name when patternName is absent
      Given a pattern with name "BarImpl" and no patternName
      When I get the pattern name
      Then the result is "BarImpl"

  Rule: findPatternByName performs case-insensitive matching

    **Invariant:** findPatternByName must match pattern names case-insensitively, returning undefined when no match exists.
    **Rationale:** Case-insensitive matching prevents frustrating "not found" errors when developers type "processguard" instead of "ProcessGuard" — both clearly refer to the same pattern.
    **Verified by:** Exact case match, Case-insensitive match, No match returns undefined

    @acceptance-criteria @happy-path
    Scenario: Exact case match
      Given patterns "Alpha" and "Beta"
      When I find pattern by name "Alpha"
      Then the found pattern name is "Alpha"

    @acceptance-criteria @happy-path
    Scenario: Case-insensitive match
      Given patterns "Alpha" and "Beta"
      When I find pattern by name "alpha"
      Then the found pattern name is "Alpha"

    @acceptance-criteria @edge-case
    Scenario: No match returns undefined
      Given patterns "Alpha" and "Beta"
      When I find pattern by name "Gamma"
      Then no pattern is found

  Rule: getRelationships looks up with case-insensitive fallback

    **Invariant:** getRelationships must first try exact key lookup in the relationship index, then fall back to case-insensitive matching, returning undefined when no match exists.
    **Rationale:** Exact-first with case-insensitive fallback balances performance (O(1) exact lookup) with usability (tolerates case mismatches in cross-references).
    **Verified by:** Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined

    @acceptance-criteria @happy-path
    Scenario: Exact key match in relationship index
      Given a dataset with relationship entry for "OrderSaga"
      When I get relationships for "OrderSaga"
      Then relationships are found

    @acceptance-criteria @happy-path
    Scenario: Case-insensitive fallback match
      Given a dataset with relationship entry for "OrderSaga"
      When I get relationships for "ordersaga"
      Then relationships are found

    @acceptance-criteria @edge-case
    Scenario: Missing relationship index returns undefined
      Given a dataset without relationship index
      When I get relationships for "OrderSaga"
      Then no relationships are found

  Rule: suggestPattern provides fuzzy suggestions

    **Invariant:** suggestPattern must return fuzzy match suggestions for close pattern names, returning empty results when no close match exists.
    **Rationale:** Fuzzy suggestions power "did you mean?" UX in the CLI — without them, typos produce unhelpful "pattern not found" messages.
    **Verified by:** Suggests close match, No close match returns empty

    @acceptance-criteria @happy-path
    Scenario: Suggests close match
      Given candidate names "AgentCommandInfra" and "EventStore"
      When I suggest a pattern for "AgentCommand"
      Then the suggestion contains "AgentCommandInfra"

    @acceptance-criteria @edge-case
    Scenario: No close match returns empty
      Given candidate names "AgentCommandInfra" and "EventStore"
      When I suggest a pattern for "zzNonexistent"
      Then the suggestion is empty
