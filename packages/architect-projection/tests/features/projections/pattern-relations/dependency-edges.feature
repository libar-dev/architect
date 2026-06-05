@architect
@architect-pattern:DependencyEdgeProjectionExecutableTests
@architect-implements:DependencyEdgeProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Dependency edge projection

  **Business Value:** Consumers receive the outgoing relationships of a pattern
  as a flat `DependencyEdgeSet` whose items carry explicit `relationKind`
  values, letting graph views, MCP tools, and docs render and filter edges
  without reaching into PatternGraph DTOs or re-deriving relation types.

  **How It Works:** The projection resolves the source pattern through
  `ProjectionContext`, walks every outgoing relation kind via
  `projectOutgoingEdges`, and wraps each edge in a stable
  `{kind, from, to, relationKind}` fragment. When the relationship index is
  absent, it falls back to the raw pattern relationship arrays so the set
  still projects; unknown patterns fail with a fuzzy-suggestion error.

  Background:
    Given the Pattern Relations dependency edge state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/dependency-edges.feature |

  Rule: Dependency edges use normalized relationKind payloads only

    **Invariant:** Every edge carries a stable `DependencyEdge` shape with an
    explicit `relationKind`, the collection is always emitted as a
    `DependencyEdgeSet` rooted at `from`, the projection falls back to raw
    pattern relationship arrays when the relationship index is missing, and
    unknown pattern names fail with a `PATTERN_NOT_FOUND` error plus a fuzzy
    suggestion.

    **Rationale:** Consumers must be able to iterate edges with stable
    discriminators without inspecting graph internals, keep working when
    indices are partially built, and get helpful errors on typos instead of
    silent empty results.

    **Verified by:** dependency edges project every outgoing relation kind, dependency edges fall back to raw pattern arrays when the relationship index is missing, missing patterns return a suggested match for dependency edges

    @acceptance-criteria
    Scenario: dependency edges project every outgoing relation kind
      Given a dependency edge context with rich outgoing relationships
      When I project the dependency edges for "PatternGraphAPI"
      Then the dependency edges should expose stable relationKind values

    Scenario: dependency edges fall back to raw pattern arrays when the relationship index is missing
      Given a dependency edge context without a relationship index
      When I project the dependency edges for "FallbackEdges"
      Then the dependency edges should use the raw pattern relationship arrays

    Scenario: missing patterns return a suggested match for dependency edges
      Given a dependency edge context with a pattern named "PatternGraphAPI"
      When I project the dependency edges for the missing pattern "PatternGraphAp"
      Then the dependency edge projection should fail with a suggestion for "PatternGraphAPI"
