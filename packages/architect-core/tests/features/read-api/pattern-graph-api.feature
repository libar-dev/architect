@architect
@architect-pattern:PatternGraphApiReverseLookup
@architect-implements:PatternGraphApi
@architect-status:active
@architect-product-area:Annotation
@behavior @read-api
Feature: PatternGraphAPI reverse lookups stay canonical

  `createPatternGraphAPI` should never silently report empty reverse
  relationship collections for an existing pattern. The graph seam now owns a
  canonical `relationshipIndex`, and the read API must consume that index
  directly instead of rebuilding or guessing local fallback state.

  Background: Synthetic graph with one dependency edge
    Given a synthetic graph where "AlphaCore" uses "BetaCore"

  Rule: Canonical relationship index resolves reverse lookups

    @acceptance-criteria @happy-path
    Scenario: Reverse relationships read from the canonical relationship index
      Given the graph includes the canonical relationship index
      When I query pattern relationships for "BetaCore"
      Then the relationships field "usedBy" contains "AlphaCore"
      And the relationships field "enables" contains "AlphaCore"

  Rule: Dependency queries reuse the same canonical relationship index

    @acceptance-criteria @error-path
    Scenario: Reverse relationships stay canonical through dependency queries
      Given the graph includes the canonical relationship index
      When I query pattern dependencies for "BetaCore"
      Then the dependencies field "usedBy" contains "AlphaCore"
      And the dependencies field "enables" contains "AlphaCore"

  Rule: Shared read-api helpers fail loudly for missing canonical entries

    @acceptance-criteria @error-path
    Scenario: Foreign patterns trigger the canonical relationship invariant
      Given a foreign pattern named "GhostCore"
      When I resolve relationships for that foreign pattern through the shared helper
      Then the invariant error equals "read-api invariant violated: canonical relationship entry missing for pattern GhostCore"

  Rule: Neighbor queries reuse the shared canonical relationship seam

    @acceptance-criteria @happy-path
    Scenario: Neighborhood lookup reads the canonical relationship index
      Given the graph includes the canonical relationship index
      When I compute the neighborhood for "BetaCore"
      Then the neighborhood field "usedBy" contains "AlphaCore"
      And the neighborhood field "enables" contains "AlphaCore"

  Rule: Dependency context reports bidirectional transitive closure

    `getDependencyContext` walks both directions off one focal pattern:
    `upstream` closes over dependsOn∪uses (the prerequisites the focal needs),
    `downstream` closes over usedBy∪enables (the blast radius that needs the
    focal). The focal pattern is the root of both forests, never a node, and
    `summary` precomputes the direct and transitive counts.

    @acceptance-criteria @happy-path
    Scenario: Upstream and downstream forests are reported off one focal pattern
      Given a pipeline-built graph with the dependency chain "Leaf" -> "Mid" -> "Root"
      When I read the dependency context for "Mid"
      Then the focal pattern is "Mid"
      And the upstream forest direct children are "Root"
      And the downstream forest direct children are "Leaf"
      And the upstream summary direct count is 1
      And the downstream summary direct count is 1

    @acceptance-criteria @happy-path
    Scenario: Transitive prerequisites are summarized beyond the direct ring
      Given a pipeline-built graph with the dependency chain "Leaf" -> "Mid" -> "Root"
      When I read the dependency context for "Leaf"
      Then the upstream summary direct count is 1
      And the upstream summary transitive count is 2

    @acceptance-criteria @edge-case
    Scenario: The walk is cycle-safe on a cyclic graph
      Given a pipeline-built graph with the dependency cycle "Ouro" uses "Boros" uses "Ouro"
      When I read the dependency context for "Ouro"
      Then a dependency context is returned
      And no upstream node name appears twice along any path

    @acceptance-criteria @edge-case
    Scenario: The depth cap truncates and flags the boundary node
      Given a pipeline-built graph with the dependency chain "Leaf" -> "Mid" -> "Root"
      When I read the dependency context for "Leaf" with max depth 1
      Then the upstream forest direct children are "Mid"
      And the upstream boundary node "Mid" is truncated
      And the upstream boundary node "Mid" has no children

    @acceptance-criteria @error-path
    Scenario: An unknown pattern yields no dependency context
      Given a pipeline-built graph with the dependency chain "Leaf" -> "Mid" -> "Root"
      When I read the dependency context for "Ghost"
      Then no dependency context is returned

  Rule: Rules reverse-trace from a TypeScript pattern through its implementers

    `getRulesForPattern` follows the derived `implementedBy` edge so a
    TypeScript pattern surfaces the business rules authored on the `.feature`
    specs that realize it, each tagged with the provenance of the feature it
    came from.

    @acceptance-criteria @happy-path
    Scenario: A TypeScript pattern surfaces its implementing feature's rules with provenance
      Given a pipeline-built graph where feature "WidgetFeature" implements TypeScript pattern "WidgetService" and owns rule "Widgets stay frozen"
      When I read the rules for "WidgetService"
      Then a rule named "Widgets stay frozen" is returned
      And that rule is sourced from pattern "WidgetFeature"
      And that rule's source file is the feature file

  Rule: Decision-scoped rule and pattern lookups resolve through enforcedBy

    `getRulesByDecision` and `getPatternsByDecision` resolve the canonical
    decision key through the relationship index `enforcedBy` edge (plus the
    decision pattern itself), so a rule-owning pattern that carries
    `@architect-enforces-decision` surfaces under its decision.

    @acceptance-criteria @happy-path
    Scenario: A rule-owning pattern surfaces under the decision it enforces
      Given a pipeline-built graph where pattern "GuardRail" enforces decision "ADR099Example" and owns rule "Boundary is strict"
      When I read the patterns for decision "ADR099Example"
      Then the decision patterns include "GuardRail"
      When I read the rules for decision "ADR099Example"
      Then a decision rule named "Boundary is strict" is returned
      And that decision rule is owned by pattern "GuardRail"

  Rule: Package keys are reported distinct and sorted

    `listPackages` returns the canonical package keys from the architecture
    index, deduplicated and sorted.

    @acceptance-criteria @happy-path
    Scenario: Packages are reported as distinct sorted keys
      Given a pipeline-built graph resolving patterns into packages "architect-core" and "architect-cli"
      When I list the packages
      Then the package list is exactly "architect-cli, architect-core"
