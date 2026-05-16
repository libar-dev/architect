@architect
@architect-pattern:ArchitectureNavigationProjectionExecutableTests
@architect-implements:ArchitectureNeighborhoodProjection,BoundedContextProjection,ArchitectureComparisonProjection,OrphanPatternListProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Architecture neighborhood projection

  **Business Value:** Consumers receive the full architectural vicinity of a
  single pattern — uses, usedBy, dependsOn, enables, sameContext, implements,
  implementedBy — plus the sibling `BoundedContext`,
  `ArchitectureComparison`, and `OrphanPatternList` views in one stable bundle,
  without touching raw PatternGraph DTOs.

  **How It Works:** Each projection resolves a pattern or cross-context query
  from `ProjectionContext`, walks the relationship and architecture indices,
  and emits a schema-validated fragment whose directional arrays and
  implementation references are always present in a stable shape. Missing
  indices degrade to empty arrays rather than errors.

  Background:
    Given the Pattern Relations architecture neighborhood state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location                                                                                          |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/architecture-neighborhood.feature |

  Rule: Architecture neighborhoods preserve directional coverage without leaking raw DTOs

    **Invariant:** Every relationship direction (`uses`, `usedBy`, `dependsOn`,
    `enables`, `sameContext`, `implements`, `implementedBy`) is present as an
    array, implementation references are structured `ImplementationRef`
    objects, and missing relationship or architecture indices degrade to empty
    arrays rather than errors.

    **Rationale:** Consumers must be able to iterate every direction without
    null-checking, and must never see raw graph DTOs whose shape can drift
    across core versions.

    **Verified by:** architecture neighborhoods include all relationship directions, missing relationship indices keep neighborhood metadata but empty directional arrays, missing architecture indices remove same-context neighbors only

    @acceptance-criteria
    Scenario: architecture neighborhoods include all relationship directions
      Given an architecture neighborhood context with full direction coverage
      When I project the architecture neighborhood for "PatternGraphAPI"
      Then the architecture neighborhood should include all direction buckets and structured implementation refs

    Scenario: missing relationship indices keep neighborhood metadata but empty directional arrays
      Given an architecture neighborhood context without a relationship index
      When I project the architecture neighborhood for "PatternGraphAPI"
      Then the architecture neighborhood should keep empty directional arrays and preserve same-context neighbors

    Scenario: missing architecture indices remove same-context neighbors only
      Given an architecture neighborhood context without an architecture index
      When I project the architecture neighborhood for "PatternGraphAPI"
      Then the architecture neighborhood should keep sameContext empty

  Rule: Bounded-context navigation stays projection-owned

    **Invariant:** Bounded-context navigation, cross-context comparisons, and
    the orphan-pattern list are assembled entirely from `ProjectionContext` —
    no consumer ever reaches into `graph.archIndex` or relationship tables
    directly. A `BoundedContext` catalog exposes grouped patterns, layers, and
    roles per bounded context; an `ArchitectureComparison` exposes shared
    dependencies and cross-context integration points; an `OrphanPatternList`
    contains only patterns with zero relationships in any direction.

    **Rationale:** Architecture navigation is a read-model concern. Letting
    it leak into consumers would duplicate assembly logic and couple the UI
    to graph internals.

    **Verified by:** bounded-context catalog groups patterns by bounded context, bounded-context catalog derives layers without per-context layer scans, architecture comparison highlights shared dependencies and cross-context edges, orphan pattern lists include only disconnected patterns

    Scenario: bounded-context catalog groups patterns by bounded context
      Given an architecture navigation context with multiple contexts and layers
      When I project the bounded-context catalog
      Then the bounded-context catalog should summarize each bounded context

    Scenario: bounded-context catalog derives layers without per-context layer scans
      Given an architecture navigation context with guarded layer buckets
      When I project the bounded-context catalog
      Then the bounded-context catalog should summarize each bounded context

    Scenario: architecture comparison highlights shared dependencies and cross-context edges
      Given an architecture navigation context with multiple contexts and layers
      When I project the architecture comparison for "scanner" and "codec"
      Then the architecture comparison should expose shared dependencies and integration points

    Scenario: orphan pattern lists include only disconnected patterns
      Given an architecture navigation context with connected and orphaned patterns
      When I project the orphan pattern list
      Then the orphan pattern list should include only disconnected patterns
