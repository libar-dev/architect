@architect
@architect-pattern:MonorepoSupport
@architect-status:roadmap
@architect-product-area:Configuration
Feature: Monorepo Cross-Package Support

  **Problem:**
  Architect already ships the workspace foundation: project config accepts
  package matchers, `PackageResolver` maps source files to package identities,
  `PatternGraph.archIndex.byPackage` indexes canonical patterns, pattern
  summaries/details expose package provenance, `PatternCatalog` accepts a typed
  package filter, and `architect census` reports diagnostic package coverage.
  The remaining roadmap gap is a dedicated package-level dependency projection:
  callers can derive cross-package edges from the current read model, but there
  is no stable projection that aggregates those edges with pattern provenance.

  **Solution:**
  Keep the shipped package foundation as the source of truth and add only the
  remaining package-dependency read model:
  1. Use `ArchitectProjectConfigSchema.packages` and `PackageResolver` for package identity
  2. Keep package provenance derived from source-file matching, never a new annotation tag
  3. Read package buckets from `g.graph.archIndex.byPackage` or the pure PatternCatalog package option
  4. Add a pure cross-package dependency projection over `relationshipIndex` plus `archIndex.byPackage`
  5. Keep `architect census` package coverage explicitly diagnostic-only

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | PackageConfig and project-config packages schemas | complete | packages/architect-core/src/package/package-config.ts; packages/architect-core/src/config/project-config-schema.ts |
      | PackageResolver source-file matcher | complete | packages/architect-core/src/package/package-resolver.ts |
      | PatternGraph archIndex.byPackage view | complete | packages/architect-core/src/generators/pipeline/transform-dataset.ts |
      | Package fields on pattern summary, detail, and catalog projections | complete | packages/architect-projection/src/projections/pattern-relations/ |
      | Package filter in PatternCatalogOptionsSchema | complete | packages/architect-projection/src/projections/pattern-relations/pattern-catalog.internal.ts |
      | Diagnostic package coverage in census | complete | packages/architect-core/src/graph/analysis-views.ts; packages/architect-cli/src/cli/census-report.ts |
      | Cross-package dependency projection | pending | packages/architect-projection/src/projections/pattern-relations/cross-package-dependencies.ts |

  Rule: Config supports workspace-aware package definitions

    **Invariant:** `ArchitectProjectConfigSchema.packages` accepts ordered
    `PackageConfig` entries with an id, display name, and source-file matcher.
    `PackageResolver` uses first-match-wins semantics and fails loudly when a
    configured resolver cannot map a file. The independent top-level `sources`
    field remains optional, so projects can supply graph inputs through the
    supported composition roots without encoding source globs into package rows.

    **Rationale:** Package identity and source discovery are separate contracts.
    Keeping package entries matcher-based avoids duplicating source globs while
    giving every projection one deterministic package resolver.

    **Verified by:** Multi-package config parsing,
    Single-package config without package matchers

    @acceptance-criteria @happy-path
    Scenario: Multi-package config is parsed and validated
      Given a config file with two ordered package matcher entries
      When the config is loaded and resolved
      Then each package exposes its validated id display name and matcher
      And source files resolve to the first matching package

    @acceptance-criteria @edge-case
    Scenario: Single-package config works without packages field
      Given a single-package config with sources but no packages field
      When the config is loaded and resolved
      Then source discovery proceeds without package matcher entries
      And package-index population remains optional

  Rule: PatternGraph and pattern projections expose derived package provenance

    **Invariant:** When a package resolver is supplied, graph transformation
    groups canonical patterns under `archIndex.byPackage` according to each
    pattern's source file. Pattern summary, detail, and catalog projections derive
    their optional `package` field from that index; `ExtractedPattern` does not
    gain a duplicate authored package field. Resolver order makes overlapping
    matchers deterministic.

    **Rationale:** Package provenance is derived automatically from config and
    source location, not manually annotated or copied onto the canonical record.

    **Verified by:** Package bucket derived from source-file match,
    Optional package index without a resolver,
    First matching package wins when matchers overlap

    @acceptance-criteria @happy-path
    Scenario: Package bucket is populated from source-file matching
      Given ordered package matchers for "platform-core" and "platform-bc"
      And a pattern source at "packages/platform-core/src/events.ts"
      When the PatternGraph is transformed with the package resolver
      Then archIndex.byPackage "platform-core" contains that pattern
      And its projected PatternSummary package is "platform-core"

    @acceptance-criteria @edge-case
    Scenario: Package index remains optional without a resolver
      Given graph transformation without a package resolver
      When the PatternGraph is built
      Then no package provenance is invented for pattern summaries

    @acceptance-criteria @edge-case
    Scenario: First matching package wins when matchers overlap
      Given "platform-core" and "platform-shared" both match the same source file
      And "platform-core" is declared first
      When the package resolver maps that source file
      Then it resolves to "platform-core"

  Rule: Package reads compose with existing filters

    **Invariant:** A q script reads a package bucket directly from
    `g.graph.archIndex.byPackage` and may compose it with status or other
    predicates. Programmatic projection consumers use the typed
    `PatternCatalogOptionsSchema.package` field, which composes with status,
    maturity, role, and parent filters via logical AND.

    **Rationale:** Package-scoped reads already exist without a command
    dispatcher or a new handle method; callers choose either the complete graph
    bucket or the pure filtered catalog projection.

    **Verified by:** Package bucket returns matching patterns,
    PatternCatalog package and status filters compose

    @acceptance-criteria @happy-path
    Scenario: Graph package bucket returns only matching patterns
      Given patterns from "platform-core" and "platform-bc" in the graph
      When a q script reads g.graph.archIndex.byPackage "platform-core"
      Then only patterns resolved to "platform-core" are returned

    @acceptance-criteria @happy-path
    Scenario: PatternCatalog package filter composes with status
      Given active and roadmap patterns in both packages
      When PatternCatalog is projected with package "platform-core" and status "active"
      Then only active summaries from "platform-core" are returned

  Rule: Cross-package dependencies have a dedicated pure projection

    **Invariant:** The planned cross-package projection aggregates canonical
    pattern relationships into package-level edges using
    `relationshipIndex` and `archIndex.byPackage`. Each edge exposes source
    package, target package, and the contributing pattern relationships;
    intra-package relationships are excluded. It adds no CLI command or
    graph-handle facade method.

    **Rationale:** Ad-hoc q scripts can derive this cut today, but release
    planning and typed machine consumers need one deterministic projection
    contract with provenance.

    **Verified by:** Cross-package edges derived from pattern relationships,
    Intra-package dependencies excluded

    @acceptance-criteria @happy-path
    Scenario: Cross-package dependency projection shows package edges
      Given "OrderHandler" in "platform-bc" uses "EventStore" in "platform-core"
      When the cross-package dependency projection is evaluated
      Then it reports platform-bc depending on platform-core
      And it identifies OrderHandler and EventStore as contributors

    @acceptance-criteria @edge-case
    Scenario: Intra-package dependencies are excluded
      Given "Scanner" uses "ASTParser" and both resolve to "platform-core"
      When the cross-package dependency projection is evaluated
      Then no self-referencing edge for platform-core appears

  Rule: Census reports package coverage as a diagnostic

    **Invariant:** `architect census` reports per-package mechanical source-node
    coverage alongside edge-density diagnostics. It labels package coverage
    diagnostic-only and presents significance candidates first; it is not a
    separate command contract or a governance gate.

    **Rationale:** Package coverage helps teams identify curation gaps, while
    keeping the metric diagnostic avoids turning source-node density into a
    false architecture-quality score.

    **Verified by:** Census includes package coverage,
    Significance candidates precede diagnostic coverage

    @acceptance-criteria @happy-path
    Scenario: Census includes per-package diagnostic coverage
      Given a configured multi-package workspace
      When running "architect census"
      Then the report shows mapped and total source-node counts per package
      And the package coverage section is labeled diagnostic-only

    @acceptance-criteria @edge-case
    Scenario: Census remains useful for a single package
      Given a workspace whose mechanical substrate contains one package
      When running "architect census"
      Then the report shows that package's mapped and total source-node counts
