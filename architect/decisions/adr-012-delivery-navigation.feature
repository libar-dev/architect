@architect
@architect-adr:012
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:refinement
@architect-adr-theme:taxonomy
@architect-pattern:ADR012DeliveryNavigation
@architect-status:completed
@architect-unlock-reason:Born-accepted-record-after-edge-derived-navigation-proven-in-source
@architect-product-area:Process
@architect-uses:ADR003SourceFirstPatternArchitecture,ADR001TaxonomyCanonicalValues
@architect-see-also:ADR013TaxonomyRetirement
Feature: ADR-012 - Delivery Navigation via Edge-Derived Structural Hierarchy

  **Context:**
  Delivery work needs a durable way to be grouped and navigated. Value transfer
  deletes a design-level spec once its value moves to executable Gherkin and
  code, so a reader browsing the spec folder progressively loses the thread of
  which specs formed one logical unit of work and where their realizations now
  live. A navigation layer that survives that deletion must be derived from
  edges that ride the durable surface, not from prose that disappears with the
  spec.

  The mechanics that make such a layer possible already exist in source: the
  hierarchy axis is edge-derived (a pattern's `@architect-parent` is inverted
  into a parent-to-children map), the parent edge rides the pattern's durable
  surface and therefore survives value transfer, and `@architect-implements` is
  a fully traversable bidirectional realization edge.

  **Decision:**
  Delivery work is navigated along a durable STRUCTURAL HIERARCHY whose nodes are
  derived from edges, never authored as prose.

  1. The structural hierarchy (epic > phase > task, expressed through
     `@architect-level` and `@architect-parent`) is the read model's navigation
     and documentation-grouping unit. It is purely structural: a pattern's
     position groups it for navigation and does not encode when it shipped. No
     temporal or release axis is modeled by this record — delivery-timing
     grouping is out of scope and deliberately deferred until it is needed.

  2. Epics and slices are durable, thin, edge-derived navigation nodes. Their
     member set is derived from reverse `@architect-parent` edges; any prose
     "Members" list in a spec is documentation with no authority and no parser.
     They are exempt from the value-transfer deletion gate (which targets only
     design-tier specs), so the navigation index persists after every member's
     design spec is deleted.

  **Consequences:**
  | Type | Impact |
  | Positive | The navigation index is self-maintaining: members and parents derive from edges that ride the durable surface, so no prose list can drift |
  | Positive | Keeping the hierarchy purely structural — not a delivery-timing proxy — avoids the ordinal-tag tangle the pre-extraction process produced |
  | Positive | The hierarchy reuses edges (`@architect-parent`, `@architect-implements`) the graph already resolves, so navigation is adoption, not new machinery |
  | Negative | A thin epic carries no design rationale; that rationale must land in decision records and code annotations, not accrete on the epic |

  Rule: The structural hierarchy is a pure navigation axis

    **Invariant:** The structural hierarchy (`@architect-level` / `@architect-parent`)
    groups patterns for navigation and documentation. A pattern's hierarchy
    position does not encode delivery timing, and the read model maintains no
    parallel temporal axis at this stage.
    **Rationale:** Conflating structural grouping with delivery timing makes every
    grouping query ambiguous and forces a pattern to be re-filed whenever its
    timing changes — the documented mistake of the pre-extraction process.
    Keeping the hierarchy purely structural lets it answer one question cleanly.
    **Verified by:** Hierarchy grouping reflects only structural edges

    @acceptance-criteria @validation
    Scenario: Hierarchy grouping reflects only structural edges
      Given a pattern with an @architect-parent hierarchy position
      When the read model groups patterns
      Then the grouping reflects only @architect-level and @architect-parent
      And the hierarchy position does not encode delivery timing

  Rule: Epics and slices are durable, edge-derived navigation nodes

    **Invariant:** An epic's or slice's member set is derived from reverse
    `@architect-parent` edges. A prose "Members" list is documentation only and
    is never parsed. Epic and slice nodes are exempt from the value-transfer
    deletion gate, and the `@architect-parent` edge persists on each member's
    durable surface, so the navigation index stays accurate after every member's
    design spec is deleted.
    **Rationale:** A hand-authored member list is a second source of truth that
    drifts the moment a member is added or removed. Deriving membership from the
    edges that already ride the durable surface makes the index self-maintaining
    and keeps the epic a thin pointer rather than a design-substrate document.
    **Verified by:** Member set is edge-derived and survives value transfer

    @acceptance-criteria @happy-path
    Scenario: Member set is edge-derived and survives value transfer
      Given an epic whose members declare @architect-parent pointing at it
      When a member's design spec is deleted after value transfer
      Then the member still resolves under the epic via its durable @architect-parent edge
      And the epic's projected member set is unchanged
