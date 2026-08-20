@architect
@architect-pattern:BusinessRuleSetPackageScopeExecutableTests
@architect-status:active
@architect-implements:BusinessRuleSet
@projection @governance @package
Feature: BusinessRuleSet — package scope branch
  The BusinessRuleSet discriminated union gains a `'package'` branch
  alongside the existing `all | product-area | feature` branches
  so projections can group business rules by workspace package
  (`architect-core`, `architect-projection`, `desktop`, …) without a
  schema rewrite later.

  Background:
    Given the BusinessRuleSet schema is loaded

  Rule: Schema round-trips a 'package' scope branch

    **Invariant:** A BusinessRuleSet with `scope: 'package'` and a
    string `scopeValue` (the package id) parses, type-narrows, and
    JSON-round-trips identically to the existing `'product-area'` branch.
    **Verified by:** Schema accepts package scope, schema accepts package grouping, JSON round trip preserves shape

    @happy-path
    Scenario: Schema accepts a package-scoped BusinessRuleSet fixture
      When parsing a BusinessRuleSet fixture with scope "package" and scopeValue "architect-core"
      Then the parse should succeed
      And the parsed scope should be "package"
      And the parsed scopeValue should be "architect-core"

    @happy-path
    Scenario: Schema accepts the 'package' literal in BusinessRuleGroupingSchema
      When parsing the grouping literal "package"
      Then the grouping parse should succeed

    @happy-path
    Scenario: Round-trip preserves the package-scoped shape
      When round-tripping a BusinessRuleSet fixture with scope "package" and scopeValue "architect-projection"
      Then the round-tripped value should equal the original fixture

  Rule: Supporting scope schema lists the new literal in canonical order

    **Invariant:** `BusinessRuleScopeSchema` exposes literals in the
    order `all | package | product-area | feature`; this is the
    enum the CLI uses to validate `--scope` flag inputs once S9 lands.
    **Verified by:** scope schema lists package literal

    @validation
    Scenario: BusinessRuleScopeSchema includes the canonical literals in order
      Then the BusinessRuleScope literals should equal "all,package,product-area,feature"

  Rule: Runtime package config swap changes grouping without changing source patterns

    **Invariant:** Runtime package grouping depends on the configured `PackageResolver`, so the same `BusinessRuleSet` source patterns may bucket under different child keys without any source-code change.
    **Verified by:** package config swap changes bucketing without code changes

    @runtime
    Scenario: package config swap changes bucketing without code changes
      Given a BusinessRuleSet sourced from 4 patterns across 3 workspace packages
      When I project the bundle with a Studio-style packages config
      Then the children should include "architect-core" and "architect-projection"
      When I project the same bundle with an architect-pkg-style packages config
      Then the children keys should differ from the previous run
      And no source code changed between the two runs

  Rule: The package scope filter matches by the resolver package id

    **Invariant:** The `scope: 'package'` FILTER keeps a rule when the resolver
    maps its source file to the canonical unscoped package id (`architect-core`,
    `architect-projection`, …) — the same id the package GROUPING axis and the
    `BusinessRule.package` field use. The scoped `@libar-dev/<pkg>` form is not a
    package id the resolver produces, so it matches nothing.
    **Verified by:** Package filter selects rules by resolver id, Scoped package form matches nothing

    @happy-path
    Scenario: Package filter selects rules by resolver id
      Given a BusinessRuleSet sourced from 4 patterns across 3 workspace packages
      When I project the rule set filtered to package "architect-projection"
      Then every projected rule should carry package "architect-projection"
      And at least one rule should be projected

    @validation
    Scenario: Scoped package form matches nothing
      Given a BusinessRuleSet sourced from 4 patterns across 3 workspace packages
      When I project the rule set filtered to package "@libar-dev/architect-projection"
      Then no rules should be projected
