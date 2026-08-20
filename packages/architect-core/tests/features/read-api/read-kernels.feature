@architect
@architect-pattern:ReadKernelExecutableTests
@architect-status:active
@architect-product-area:DataAPI
@read-api @kernel
Feature: Pure read kernels preserve canonical graph behavior
  Named read kernels and direct PatternGraph fields retain the behavior that is
  still public after the facade is removed.

  Background:
    Given a representative graph for pure read kernels

  Rule: Relationship and dependency kernels use the canonical index

    **Invariant:** Shared relationship, neighborhood, and dependency-context reads derive reverse and transitive edges from PatternGraph.relationshipIndex.
    **Verified by:** Pure relationship and dependency kernels read canonical edges

    Scenario: Pure relationship and dependency kernels read canonical edges
      Then the canonical helper reports "AlphaCore" as a consumer of "BetaCore"
      And the neighborhood reports "AlphaCore" as a consumer of "BetaCore"
      And dependency context for "Leaf" reaches "Root" transitively
      And dependency context for "Ghost" is absent

  Rule: Rule aggregation follows implementation provenance

    **Invariant:** getRulesForPattern follows implementedBy and returns a feature-owned rule with its source pattern and file.
    **Verified by:** Rule aggregation returns implementing feature provenance

    Scenario: Rule aggregation returns implementing feature provenance
      Then rules for "WidgetService" include "Widgets stay frozen" from "WidgetFeature"

  Rule: Decision resolution composes with enforcedBy

    **Invariant:** Decision id forms resolve to one canonical decision whose enforcedBy edge names the rule-owning pattern.
    **Verified by:** Decision resolution exposes enforcing patterns and rules

    Scenario: Decision resolution exposes enforcing patterns and rules
      Then decision "ADR-099" resolves to "ADR099Example"
      And the decision is enforced by "GuardRail" with rule "Boundary is strict"

  Rule: Package helpers and architecture indexing agree

    **Invariant:** Configured package resolution feeds distinct, sorted archIndex package keys.
    **Verified by:** Package keys are distinct and sorted

    Scenario: Package keys are distinct and sorted
      Then the package keys are exactly "architect-cli, architect-core"
