Feature: Overview digest smoke test

  Background:
    Given the Operational Insights smoke test state is initialized

  Rule: Overview digest runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid overview digest from a small graph
      Given an Operational Insights context with three patterns across different statuses
      When I project the overview digest
      Then the overview digest should validate against its Zod schema
      And the overview progress should reflect the three input patterns
