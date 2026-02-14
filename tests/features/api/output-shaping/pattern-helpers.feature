@libar-docs
@libar-docs-pattern:PatternHelpersTests
@libar-docs-status:active
@libar-docs-phase:25a
@libar-docs-product-area:DataAPI
Feature: Pattern Helpers — Shared Lookup Utilities

  Rule: getPatternName uses patternName tag when available

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
