@projection
Feature: Architecture graph projection emits the whole component graph
  projectArchitectureGraph returns every production node and typed edge in one
  structured object, so a consumer gets the graph without an N-call neighborhood loop.

  Background:
    Given the architecture graph projection state is initialized

  Rule: The whole-graph dump carries nodes and typed edges with name endpoints

    @happy-path
    Scenario: projecting the architecture graph returns nodes and typed edges
      Given an architecture graph context with two connected patterns
      When I project the architecture graph
      Then the architecture graph should carry both nodes with role, context, and package
      And the architecture graph edges should reference patterns by name with typed kinds
      And the architecture graph counts should match the node and edge arrays
