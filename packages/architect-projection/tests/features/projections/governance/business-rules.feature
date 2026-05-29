@architect
@architect-pattern:BusinessRulesProjectionExecutableTests
@architect-implements:GovernanceProjectionSupport,BusinessRulesProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@governance
Feature: Governance business rule projections
  Governance business rule projections keep rule annotations and grouping semantics inside fragment bundles.

  **Business Value:** Consumers receive business rules as normalized
  `BusinessRule` fragments — with invariant, rationale, and verified-by lifted
  out of the rule description — and grouped `BusinessRuleSet` bundles scoped by
  feature, phase, or product area, including projection-owned grouping summary
  entries that downstream renderers can format without recomputing semantic counts.

  **How It Works:** The projection walks `context.graph.patterns`, parses each
  rule's `**Invariant:** / **Rationale:** / **Verified by:**` annotations, merges
  scenario names with the explicit verified-by list, and assembles a typed
  bundle root with optional child keys per grouping. Options pass through a Zod
  schema so invalid grouping values fail at the parse boundary.

  Background:
    Given the Governance business rule projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/governance/business-rules.feature |

  Rule: Single business rules preserve canonical annotations

    **Invariant:** `projectBusinessRule` returns a `BusinessRule` whose
    `invariant`, `rationale`, and `verifiedBy` fields are parsed from the rule
    description's canonical `**Invariant:** / **Rationale:** / **Verified by:**`
    annotations, with scenario names deduplicated against the explicit
    verified-by list, and whose owning package is derived from the configured
    `packageResolver`.

    **Rationale:** Rule authors encode business intent in the annotation block;
    projections must surface that intent as first-class fragment fields instead
    of raw description text so documentation and UI consumers render it
    consistently.

    **Verified by:** Projecting a business rule from a feature

    @happy-path
    @acceptance-criteria
    Scenario: Projecting a business rule from a feature
      Given a business rule projection context with Delivery Process and Data API rules
      When I project the business rule "Fragments stay JSON-safe" from feature "ProjectionMigration"
      Then the projected business rule should preserve invariant rationale and verified-by semantics

    @filtering
    Scenario: Filtering a single business rule projection returns no fragment
      Given a business rule projection context with active and candidate rule patterns
      And the business rule projection context excludes active patterns at runtime
      When I project the business rule "Committed rule" from feature "CommittedRules"
      Then no business rule bundle should be returned

  Rule: Product-area grouping returns a combined root and area children

    **Invariant:** When `projectBusinessRuleSet` is called with
    `groupedBy: 'product-area'` and no explicit scope value, the bundle root
    normalizes to an `all`-scope `BusinessRuleSet` while children expose one
    product-area child per slugged area, each scoped to that product area; the
    root also carries grouping summary entries keyed to those child routes; and
    `parseAndProjectBusinessRuleSet` rejects grouping values outside the
    `BusinessRuleGroupingSchema` enum.

    **Rationale:** Documentation surfaces route one page per product area but
    still need a combined root, and invalid grouping values must fail loudly at
    the parse boundary rather than silently producing an ungrouped bundle.

    **Verified by:** Grouping business rules by product area, parseAndProjectBusinessRuleSet rejects an invalid grouping option

    @bundle
    Scenario: Grouping business rules by product area
      Given a business rule projection context with Delivery Process and Data API rules
      When I project the business rule set scoped to product areas and grouped by product area
      Then the business rule bundle root should normalize to an all-rules grouping root
      And the business rule bundle root should expose product-area grouping entries
      And the business rule bundle should expose product-area child keys
      And the delivery-process child should scope to "Delivery Process"
      And the business rule bundle root should round-trip through the Fragment schema

    @validation
    Scenario: parseAndProjectBusinessRuleSet rejects an invalid grouping option
      Given a business rule projection context with Delivery Process and Data API rules
      When I parse-and-project the business rule set with an invalid grouping option
      Then parsing business-rule-set options should fail loudly

  Rule: Phase grouping requires every grouped rule to expose a phase

    **Invariant:** When `groupedBy: 'phase'` is requested, every collected rule
    must carry a numeric `phase`; otherwise the projection rejects the grouping
    request rather than silently dropping unphased rules from child routes and
    grouping summaries.

    **Rationale:** Projection-owned grouping semantics must remain lossless. A
    partially grouped root would make navigation-oriented documentation omit
    valid rules before any renderer has a chance to recover them.

    **Verified by:** Phase grouping rejects unphased rules loudly

    @validation
    Scenario: Phase grouping rejects unphased rules loudly
      Given a business rule projection context with at least one unphased rule
      When I project the business rule set grouped by phase
      Then grouping business rules by phase should fail loudly

  Rule: Package grouping reuses the package axis at runtime

    **Invariant:** When `projectBusinessRuleSet` is called with
    `groupedBy: 'package'`, the bundle root stays an all-rules aggregate and the
    children expose one package-scoped `BusinessRuleSet` per resolved package id,
    and the root grouping summary entries describe those package children.

    **Rationale:** The package axis is the stable ownership boundary used by the
    unified documentation pipeline; it must be real runtime behavior, not just a
    schema placeholder.

    **Verified by:** Grouping business rules by package

    @bundle
    Scenario: Grouping business rules by package
      Given a business rule projection context with rules from multiple workspace packages
      When I project the business rule set scoped to all rules and grouped by package
      Then the business rule bundle root should expose package grouping entries
      Then the business rule bundle should expose package child keys
      And the architect-projection child should scope to package "architect-projection"
      And the architect-core child should scope to package "architect-core"

  Rule: Feature scope follows the implementedBy reverse edge

    **Invariant:** `projectBusinessRuleSet({ scope: 'feature', scopeValue: X })`
    aggregates the rules owned by `X` AND by every feature pattern that realizes
    `X` via the derived `implementedBy` reverse edge, each fragment carrying the
    owning feature as `feature`/`pattern` provenance. Querying a feature pattern
    that owns rules directly still returns exactly its own rules.

    **Rationale:** A reverse-trace question that starts at a TypeScript pattern
    must surface the rules authored on its implementing `.feature` specs
    (ADR-002/ADR-003), not return empty just because the focal node owns no
    inline rules.

    **Verified by:** Feature scope aggregates the implementing features' rules, Feature scope on a rule-owning feature returns its own rules

    @bundle
    Scenario: Feature scope aggregates the implementing features' rules
      Given a business rule projection context where a TS pattern is realized by two rule-owning features
      When I project the business rule set scoped to feature "PatternGraphApi"
      Then the projected rules should include the implementing features' rules with owning-feature provenance

    @bundle
    Scenario: Feature scope on a rule-owning feature returns its own rules
      Given a business rule projection context where a TS pattern is realized by two rule-owning features
      When I project the business rule set scoped to feature "PatternGraphApiReverseLookup"
      Then the projected rules should be exactly that feature's own rules

  Rule: Decision scope aggregates rules across enforcing patterns

    **Invariant:** `projectBusinessRuleSet({ scope: 'decision', scopeValue: ADR })`
    keeps a rule when its owning pattern authors the ADR in `enforcesDecisions`
    OR when the pattern IS the decision record (its own `adr` tag), so the
    decision's own feature rules and every enforcing pattern's rules appear;
    unrelated rules are excluded. The `scopeValue` is matched through the
    canonical decision identity, so the human ADR id form (`ADR-009`) and the
    decision pattern name (`ADR009ProjectionTrustBoundary`) aggregate the same
    rule set.

    **Rationale:** The ADR → enforcing-rule link is a first-class graph edge, so
    asking "which rules govern this decision?" must aggregate across the whole
    enforcement set rather than reading free text.

    **Verified by:** Decision scope aggregates enforcing and own rules, Decision scope accepts the human ADR id form, Decision scope excludes unrelated rules

    @bundle
    Scenario: Decision scope aggregates enforcing and own rules
      Given a business rule projection context with a decision record and an enforcing pattern
      When I project the business rule set scoped to decision "ADR009ProjectionTrustBoundary"
      Then the projected rules should include both the decision's own rule and the enforcing pattern's rule
      And the decision-scoped bundle root should round-trip through the Fragment schema

    @bundle
    Scenario: Decision scope accepts the human ADR id form
      Given a business rule projection context with a decision record and an enforcing pattern
      When I project the business rule set scoped to decision "ADR-009"
      Then the projected rules should include both the decision's own rule and the enforcing pattern's rule

    @filtering
    Scenario: Decision scope excludes unrelated rules
      Given a business rule projection context with a decision record and an enforcing pattern
      When I project the business rule set scoped to decision "ADR009ProjectionTrustBoundary"
      Then the projected rules should exclude the unrelated pattern's rule

  Rule: BusinessRule fragments stay source-agnostic across rule carriers

    **Invariant:** The `BusinessRule` fragment shape is source-agnostic across
    decision records, design specs, and executable feature files; after removing
    carrier-specific identity fields, the normalized fragment payload remains
    identical.

    **Rationale:** Governance owns the aggregate root, so downstream consumers
    must not branch on where a rule came from.

    **Verified by:** BusinessRule fragments stay source-agnostic across decision spec and executable carriers

    @bundle
    Scenario: BusinessRule fragments stay source-agnostic across decision spec and executable carriers
      Given a business rule projection context with decision spec and executable rule carriers
      When I project the default business rule set
      Then the projected business rules should stay source-agnostic after identity fields are removed

  Rule: Projection filters exclude non-matching patterns before rule collection

    **Invariant:** `projectBusinessRuleSet` applies the effective
    `ProjectionFilter` before turning pattern rules into `BusinessRule`
    fragments; registry defaults still exclude candidate work, maturity is
    derived from status for filtering, and an explicit runtime filter on
    `ProjectionContext` replaces only the axis it sets.

    **Rationale:** Committed documentation must not leak speculative rules, but
    exploratory callers still need an opt-in way to inspect idea and candidate
    rule content without renderer-specific filtering.

    **Verified by:** ProjectionFilter accepts and rejects patterns by maturity and status, Default business-rule disclosure filters out candidate rules, runtime business-rule filter override includes candidate rules, runtime business-rule maturity override preserves the default status filter, explicit override on initially-excluded maturity

    @filtering
    Scenario: ProjectionFilter accepts and rejects patterns by maturity and status
      Given a business rule projection context with active and candidate rule patterns
      Then the ProjectionFilter helper should honor maturity and status axes independently

    @filtering
    Scenario: Default business-rule disclosure filters out candidate rules
      Given a business rule projection context with active and candidate rule patterns
      When I project the default business rule set
      Then the projected business rule set should include the committed and active-status-derived rule patterns

    @filtering
    Scenario: Runtime business-rule filter override includes candidate rules
      Given a business rule projection context with a runtime candidate filter override
      When I project the default business rule set
      Then the projected business rule set should include the candidate rule pattern

    @filtering
    Scenario: Runtime business-rule maturity override preserves the default status filter
      Given a business rule projection context with an idea-maturity runtime override
      When I project the default business rule set
      Then the projected business rule set should include no rules when only the maturity axis is narrowed to idea

    @filtering
    Scenario: explicit override on initially-excluded maturity
      Given a business rule projection context with executable and idea rule patterns
      When I project the business rule set with a runtime maturity override for "idea"
      Then the projected business rule set should include no rules when idea maturity is requested without a status override
