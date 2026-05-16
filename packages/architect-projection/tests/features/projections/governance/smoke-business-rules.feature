Feature: Business rule set smoke test

  Background:
    Given the Governance smoke test state is initialized

  Rule: Business rule set runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid business rule set from patterns with rules
      Given a Governance context with two patterns carrying Gherkin rules
      When I project the business rule set with scope all
      Then the business rule set should validate against its Zod schema
      And the business rule set should contain the rules from both patterns
