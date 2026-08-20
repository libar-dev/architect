@architect
@architect-pattern:ProjectionKernelRelationshipContractExecutableTests
@architect-implements:PatternRelationsProjectionSupport
@architect-status:active
@architect-product-area:Projection
@architect-role:projection
@behavior @read-api
Feature: Projection kernel relationship resolution stays canonical

  The projection kernel must not silently substitute stale per-pattern
  `uses` arrays when the canonical `relationshipIndex` is missing an entry.
  Doing so returns wrong reverse-relationship data to MCP tool callers and
  downstream AI agents. The shared `read-api` canonical resolver throws
  loudly on a missing entry; the projection kernel must honour the same
  contract (ADR-006).

  Background: Synthetic projection context with one dependency edge
    Given a synthetic graph where "AlphaCore" uses "BetaCore"
    And the graph includes the canonical relationship index

  Rule: Projection kernel reads reverse relationships from the canonical index

    **Invariant:** `normalizePatternRelationships` returns reverse edges
    (`usedBy`, `enables`) populated from `context.graph.relationshipIndex`,
    never from the pattern-local `uses` array alone.
    **Rationale:** The relationship index is the single authoritative source
    of computed reverse edges. Reading `pattern.uses` directly produces
    correct forward edges but empty reverse edges, silently misreporting
    the graph to every MCP tool that calls this path.
    **Verified by:** Reverse relationships populated from index when index
    entry is present

    @acceptance-criteria @happy-path
    Scenario: Reverse relationships populated from index when index entry is present
      When I normalize relationships for "BetaCore" through the projection kernel
      Then the normalized "usedBy" field contains "AlphaCore"
      And the normalized "enables" field contains "AlphaCore"

  Rule: Projection kernel throws the canonical invariant error for missing entries

    **Invariant:** When the requested pattern exists on the graph but has no
    entry in `relationshipIndex`, the kernel throws a
    `PATTERN_RELATIONSHIP_INVARIANT` `ProjectionError` whose message contains
    the phrase "canonical relationship entry missing for pattern" followed
    by the requested name.
    **Rationale:** Silent empty-collection returns are indistinguishable from
    "no relationships" in MCP output. A loud throw surfaces the bug at the
    call site instead of at the AI agent that acts on the wrong answer.
    **Verified by:** Missing index entry throws the canonical invariant error

    @acceptance-criteria @error-path
    Scenario: Missing index entry throws the canonical invariant error
      Given a pattern named "OrphanCore" present on the graph but absent from the canonical relationship index
      When I normalize relationships for "OrphanCore" through the projection kernel
      Then a ProjectionError with code "PATTERN_RELATIONSHIP_INVARIANT" is thrown
      And the error message contains "canonical relationship entry missing for pattern \"OrphanCore\""
