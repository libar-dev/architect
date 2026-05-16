Feature: Dependency tree smoke test

  Background:
    Given the Pattern Relations smoke test state is initialized

  Rule: Dependency tree runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid dependency tree from a small graph with relationships
      Given a Pattern Relations context with three patterns and a dependency chain
      When I project the dependency tree for the middle pattern
      Then the dependency tree should validate against its Zod schema
      And the dependency tree root should be the ancestor of the chain
