@architect
@architect-pattern:DecisionCatalogProjectionExecutableTests
@architect-implements:DecisionCatalogProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@governance
Feature: Governance decision projections
  Governance projections normalize decision specs into strict decision fragments and catalog bundles.

  **Business Value:** Consumers can look up a single decision by id or list the
  full `DecisionCatalog` as strict fragments with canonical
  Context/Decision/Consequences/Alternatives blocks, without parsing ADR prose
  themselves. Missing decision ids return a loud error that names the
  available ids instead of silently returning undefined.

  **How It Works:** The projection filters `context.graph.patterns` to those
  carrying an `@adr` tag, detects the decision type from filename or pattern
  name (ADR/PDR/DDR/TDR), parses canonical section annotations from the
  directive description, merges them with rules whose names start with
  `context`/`decision`/`consequence`/`alternative`, and emits a bundle with one
  child per decision id for routed documentation output.

  Background:
    Given the Governance decision projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/governance/decision-records.feature |

  Rule: Decision record lookup returns normalized decision fragments

    **Invariant:** `projectDecisionRecord` returns a `DecisionRecord` with the
    canonical fields (`id`, `type`, `status`, `title`, `context`, `decision`,
    `consequences`, optional `alternatives`, `relatedDecisions`,
    `affectedPatterns`) derived from the decision pattern, and throws a
    `DECISION_NOT_FOUND` error that lists the available ids when the lookup
    does not resolve. `relatedDecisions` is the governance chain — the
    decision's see-also cross-links that are themselves decisions, resolved to
    their ids (never a supersession "replaces" edge; that history lives in git).
    `affectedPatterns` includes the computed `enforcedBy` reverse edge, so a
    decision is navigable to every rule that authored `@architect-enforces-decision`
    against it.

    **Rationale:** Decision consumers must see a strict, schema-validated shape
    regardless of how the ADR was authored; unresolved lookups must guide
    callers to the correct id rather than failing silently; and the read model
    carries only live navigable state, so the decision↔rule and decision↔decision
    edges are derived from current links, not from historical supersession.

    **Verified by:** Projecting a decision record from a decision spec, Missing decisions surface the available ids

    @happy-path
    @acceptance-criteria
    Scenario: Projecting a decision record from a decision spec
      Given a decision projection context with ADR-006 and PDR-001
      When I project the decision record for "006"
      Then the decision record should expose the canonical decision fields
      And the decision consequences should include a structured table block

    @error-handling
    Scenario: Missing decisions surface the available ids
      Given a decision projection context with ADR-006 and PDR-001
      When I project the missing decision record for "ADR-999"
      Then the decision projection should fail with the available ids

  Rule: Decision catalogs use a typed catalog root and decision children

    **Invariant:** `projectDecisionCatalog` returns a bundle whose `root` is a
    `DecisionCatalog` containing every normalized decision, with child keys
    slugged from each decision id and routed into `decisions/<id>.md`; the root
    document routes to `DECISIONS.md`.

    **Rationale:** Documentation consumers need deterministic per-decision
    paths for navigation and cross-linking, and a typed catalog root for
    summary rendering.

    **Verified by:** Projecting the decision catalog bundle

    @bundle
    Scenario: Projecting the decision catalog bundle
      Given a decision projection context with ADR-006 and PDR-001
      When I project the decision catalog
      Then the decision catalog root should include both normalized decisions
      And the decision catalog child keys should be deterministic
