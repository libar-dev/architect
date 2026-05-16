Feature: Documentation bundle smoke test

  Background:
    Given the Documentation Composition smoke test state is initialized

  Rule: Documentation bundle runs against a minimal graph and produces a valid fragment

    Scenario: smoke test projects a valid patterns documentation bundle from a small graph
      Given a Documentation Composition context with two patterns and a relationship
      When I project the patterns documentation bundle
      Then the documentation bundle should validate against the fragment schema and any emitted routing
      And the documentation bundle should have the patterns document type and a non-empty title
