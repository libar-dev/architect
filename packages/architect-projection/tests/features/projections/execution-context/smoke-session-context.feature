Feature: Session context smoke test

  Background:
    Given the Execution Context smoke test state is initialized

  Rule: Session context runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid session context bundle from a small graph
      Given an Execution Context with two patterns and a dependency relationship
      When I project the session context for both patterns in implement mode
      Then the session context bundle should validate against its Zod schema
      And the session context bundle should reference both input patterns
