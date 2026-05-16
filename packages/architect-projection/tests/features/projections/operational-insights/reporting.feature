@architect
@architect-pattern:OperationalInsightsProjectionExecutableTests
@architect-implements:OperationalInsightsProjectionSupport,OverviewProjection,AnnotationCoverageProjection,TagUsageProjection,SourceInventoryProjection,RoleProfileProjection,RequirementDigestProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@operational-insights
Feature: Operational Insights reporting projections

  **Business Value:** Consumers receive the full operational-insights surface
  — project overview, annotation coverage, tag usage matrix, source
  inventory, role profiles, and requirement digests — as stable,
  schema-validated fragments derived entirely from `ProjectionContext` and
  `tagRegistry`, so the Data API and docs can answer status/health questions
  without reaching into the raw PatternGraph.

  **How It Works:** Each projection runs against the in-memory graph and tag
  registry. Overview aggregates progress, active phases, and blocked
  patterns; annotation coverage compares source files against required tags;
  tag usage counts `(tag, value)` pairs across patterns; source inventory
  categorises files by type; role profiles normalize configured roles with
  their pattern examples; requirement digests structure product-area
  requirements into rendered blocks. All sorts are deterministic.

  Background:
    Given the Operational Insights reporting projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/operational-insights/reporting.feature |

  Rule: Overview ports the legacy progress and blocking semantics into the fragment shape

    **Invariant:** `OverviewDigest` always carries a `progress` block
    (delivery-total counts and a percentage that excludes candidates),
    `activePhases` limited to phases with active work, a `blocking` array of
    incomplete patterns whose `dependsOn` targets are incomplete, and the
    embedded CLI-hints list for session bootstrap.

    **Rationale:** These fields are the canonical session-start payload;
    omitting any of them forces consumers back into raw graph queries.

    **Verified by:** projecting an overview digest for mixed delivery work

    @acceptance-criteria
    Scenario: projecting an overview digest for mixed delivery work
      Given a Operational Insights overview context with active phases and blocking dependencies
      When I project the overview digest
      Then the overview digest should expose delivery progress active phases and blocking entries
      And the overview digest should preserve unnamed active phase parity

  Rule: Annotation coverage stays numeric and graph-only

    **Invariant:** `AnnotationCoverage` reports `totalSourceFiles`,
    `annotatedFiles`, `unannotatedFiles` (sorted), a rounded
    `coveragePercentage`, and a `gapsByTag` map keyed by required tag with
    sorted file lists. Required tags are derived from the tag registry
    (`required: true`) plus `role` whenever any roles are configured.

    **Rationale:** Coverage must be fully computable from graph + tag
    registry so it can drive CI gates; stable sorting keeps diffs small
    across runs.

    **Verified by:** projecting annotation coverage with required tag gaps, annotation coverage does not read relationships for scalar required tags

    Scenario: projecting annotation coverage with required tag gaps
      Given a Operational Insights coverage context with ten source files and three annotation gaps
      When I project the annotation coverage digest
      Then the annotation coverage digest should expose raw counts percentages and per-tag gaps

    Scenario: annotation coverage does not read relationships for scalar required tags
      Given a Operational Insights coverage context with scalar required tags and a guarded relationship index
      When I project the annotation coverage digest
      Then the annotation coverage digest should be computed without reading relationship entries

  Rule: Tag usage and source inventory preserve reporting aggregations

    **Invariant:** `TagUsageMatrix` lists every tag once with a total count
    and per-value counts, ordered by total descending then tag name.
    `SourceInventoryDigest` lists file groups by categorised type
    (TypeScript, Gherkin, Decisions, Stubs, Other) with unique sorted files,
    derived glob-style `locationPattern`, and a stable type-priority sort.

    **Rationale:** These aggregations power dashboards and doc-generation
    summaries; losing order or double-counting files would silently corrupt
    downstream reports.

    **Verified by:** projecting tag usage and source inventory for mixed source types

    Scenario: projecting tag usage and source inventory for mixed source types
      Given a Operational Insights reporting context with mixed tags and source files
      When I project the tag usage and source inventory views
      Then the tag usage matrix should preserve the aggregated counts
      And the source inventory should preserve categorized unique files

  Rule: Role profiles normalize configured role definitions deterministically

    **Invariant:** `RoleProfile` resolution is case-insensitive and honors
    role aliases, returning `undefined` for unknown roles. Each profile
    exposes `tag`, `domain`, `priority`, `count`, `description`, and an
    alphabetically sorted `examples` list. `RoleProfileCollection.items`
    preserves the tag registry's configured order.

    **Rationale:** Role data is surfaced in the UI and doc generators which
    expect registry order and canonical tags; alias handling stops consumers
    from maintaining their own normalization.

    **Verified by:** projecting one role and the full role catalog

    Scenario: projecting one role and the full role catalog
      Given a Operational Insights role context with configured roles aliases and examples
      When I project the role profile for "APP-SERVICE" and all role profiles
      Then the single role profile should resolve the canonical role definition
      And the role profile catalog should stay in registry order with deterministic examples

  Rule: Requirement digests stay structured and filterable without renderable docs

    **Invariant:** `RequirementDigest` carries a `productArea` label (or
    `"All Product Areas"`), excludes ADR-sourced patterns, sorts by product
    area then normalized status (completed → active → planned → candidate)
    then pattern name,
    structures each requirement's description as a block list
    (Requirement / Use Cases / Business Rules) with resolved `testFiles`
    from executable specs or the behaviour file, and exposes governance-owned
    `businessRuleReferences` instead of embedding `BusinessRule` child fragments;
    for duplicate feature names across packages, all-areas digests aggregate
    every matching reference while executable package/detail child digests keep
    only the local package's references.

    **Rationale:** Requirement digests must be filterable and structured so
    the Studio UI and MCP consumers can render them without re-parsing
    ad-hoc text; ADRs belong to a separate governance projection; and duplicate
    feature names must not cause routed child docs to inherit another package's
    business-rule links.

    **Verified by:** projecting requirement digests for all areas and one product area; executable requirement digests keep duplicate-feature references local to each child

    Scenario: projecting requirement digests for all areas and one product area
      Given a Operational Insights requirement context with product requirements and one ADR decision
      When I project the requirement digests for all areas and for "Projection Platform"
      Then the all-areas requirement digest should aggregate every non-ADR product requirement
      And the filtered requirement digest should keep structured blocks and test file references
      And the all-areas requirement digest should include product-metadata requirements without a product area

    Scenario: requirement digests aggregate business-rule references for duplicate feature names
      Given a Operational Insights requirement context with duplicate feature names across packages
      When I project the requirement digest for all areas
      Then the all-areas requirement digest should aggregate duplicate-feature business-rule references deterministically
      And the all-areas requirement digest should expose stable owner routes for duplicate-feature entries

    Scenario: executable requirement digests keep duplicate-feature references local to each child
      Given a Operational Insights requirement context with duplicate feature names across packages
      When I project the requirements-executable digest
      Then the executable requirement root should aggregate duplicate-feature references deterministically
      And the executable requirement root should expose stable owner routes for duplicate-feature entries
      And the executable requirement root should preserve all-areas sort order for duplicate-feature entries
      And the executable requirement package and detail children should keep only local business-rule references

    Scenario: requirements-specs digests keep duplicate planned feature names routable per package
      Given a Operational Insights requirement context with duplicate planned feature names across packages
      When I project the requirements-specs digest
      Then the requirements-specs root should aggregate duplicate planned features deterministically
      And the requirements-specs child routes should stay package-stable for duplicate planned feature names

    Scenario: executable requirement routes use resolver package ids outside packages slash star
      Given a Operational Insights requirement context with a tests-features executable requirement
      When I project the requirements-executable digest
      Then the executable requirement digest should use the resolver-derived package id for routes

    Scenario: package scoped architect releases stay out of requirement digests
      Given a Operational Insights requirement context with a nested architect release pattern
      When I project the requirement digest for all areas
      Then the nested architect release pattern should be excluded from the all-areas requirement digest
