@architect
@architect-pattern:GovernanceValidationTaxonomyProjectionExecutableTests
@architect-implements:ValidationRuleDigestProjection,TaxonomyDigestProjection
@architect-status:completed
@architect-unlock-reason:Strengthen-count-summary-invariant-pin-derivation-from-digest-entries
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@governance
Feature: Governance validation and taxonomy projections
  Governance validation and taxonomy digests stay pure and per-call explicit.

  **Business Value:** Consumers can render the full validation-rule catalog and
  the project's tag taxonomy as schema-validated fragments —
  `ValidationRuleDigest` with FSM states/transitions and
  protection-level metadata, `TaxonomyDigest` with grouped role/metadata/
  aggregation tag entries and format-type examples — without reaching into
  core constants or the tag registry directly.

  **How It Works:** `projectValidationRuleDigest` materializes the fixed rule
  list, maps `VALID_TRANSITIONS` into FSM edges, and groups statuses by
  `PROTECTION_LEVELS`. `projectTaxonomyDigest` groups the `TagRegistry` into
  Roles, domain-bucketed metadata tags, and aggregation tags, then merges per-
  call `exampleOverrides` into the format-type entries without mutating any
  registry state.

  Background:
    Given the Governance validation and taxonomy projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/governance/validation-taxonomy.feature |

  Rule: Validation rule digests expose normalized FSM and protection metadata

    **Invariant:** `projectValidationRuleDigest` emits a `ValidationRuleDigest`
    whose `rules` list matches the canonical validation-rule catalog, whose
    `fsm` reflects `VALID_TRANSITIONS` (with initial state `roadmap` and
    terminal states computed from transitions), and whose `protectionLevels`
    expose each `PROTECTION_LEVELS` bucket with `canAddDeliverables` and
    `needsUnlock` flags.

    **Rationale:** Validation surfaces must render a deterministic, core-driven
    view of the lifecycle so FSM changes propagate through one projection
    rather than being duplicated in UI or doc templates.

    **Verified by:** Projecting the validation rule digest

    @happy-path
    @acceptance-criteria
    Scenario: Projecting the validation rule digest
      Given a taxonomy projection context with roles metadata tags and aggregation tags
      When I project the validation rule digest
      Then the validation rule digest should expose rule fsm and protection-level fragments

  Rule: Taxonomy overrides are explicit and per-call only

    **Invariant:** `projectTaxonomyDigest` applies `exampleOverrides` only to
    the current call's format-type entries and records them on the fragment's
    `exampleOverrides` field; a subsequent call without overrides falls back to
    the default examples and descriptions, and no override state persists
    across calls.

    **Rationale:** Example overrides are presentation-only context that must
    never leak between calls or consumers, so the projection must stay pure
    per-call and never mutate shared registry or digest state.

    **Verified by:** Projecting taxonomy digests with and without explicit overrides

    @override
    Scenario: Projecting taxonomy digests with and without explicit overrides
      Given a taxonomy projection context with roles metadata tags and aggregation tags
      When I project the taxonomy digest with explicit overrides
      And I project the taxonomy digest again without overrides
      Then the first taxonomy digest should use the explicit override examples and descriptions
      And the second taxonomy digest should fall back to the default examples without retaining overrides

  Rule: Public taxonomy digests hide internal authoring-only tags

    **Invariant:** `projectTaxonomyDigest` must omit internal/scaffold-only tags
    from the public metadata digest even when they remain registered for
    extractor, stub, or lifecycle runtime semantics.

    **Rationale:** Public taxonomy consumers need the locked contract surface,
    while runtime registry support for internal authoring aids remains intact for
    validation and extraction flows.

    **Verified by:** Projecting a taxonomy digest with hidden internal tags registered

    @happy-path
    Scenario: Projecting a taxonomy digest with hidden internal tags registered
      Given a taxonomy projection context with roles metadata tags and aggregation tags
      When I project the taxonomy digest
      Then the taxonomy digest should hide internal-only metadata tags from the public surface

  Rule: Taxonomy count summaries use the digest surface

    **Invariant:** Taxonomy count summaries must be derived from the projected
    `TaxonomyDigest` entries, not from pattern-graph counts or caller-specific
    registry reads.

    **Rationale:** CLI count mode and generated Markdown headers must stay
    numerically aligned even when taxonomy projection runs against a
    registry-only context with zero patterns.

    **Verified by:** Summarizing a projected taxonomy digest

    @happy-path
    Scenario: Summarizing a projected taxonomy digest
      Given a taxonomy projection context with roles metadata tags and aggregation tags
      When I project the taxonomy digest
      Then the taxonomy digest count summary should match the visible tag entries

    @happy-path @acceptance-criteria
    Scenario: the count summary is a self-consistent function of the digest's own entries
      Given a taxonomy projection context with roles metadata tags and aggregation tags
      When I project the taxonomy digest
      Then the count summary equals the role, metadata, and aggregation entries enumerated from the digest itself
      And the total equals the sum of those three counts, so the count surface cannot diverge from the enumerated surface
