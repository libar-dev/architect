Feature: Dependency context smoke test

  Background:
    Given the Pattern Relations smoke test state is initialized

  Rule: Dependency context runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid dependency context from a small graph with relationships
      Given a Pattern Relations context with three patterns and a dependency chain
      When I project the dependency context for the middle pattern
      Then the dependency context should validate against its Zod schema
      And the dependency context should be focal-rooted at the middle pattern
