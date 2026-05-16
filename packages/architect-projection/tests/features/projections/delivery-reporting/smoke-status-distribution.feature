Feature: Status distribution smoke test

  Background:
    Given the Delivery Reporting smoke test state is initialized

  Rule: Status distribution runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid status distribution from a small graph
      Given a Delivery Reporting context with three patterns across different statuses
      When I project the status distribution
      Then the status distribution should validate against its Zod schema
      And the status distribution counts should reflect the three input patterns
