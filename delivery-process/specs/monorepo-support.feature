@libar-docs
@libar-docs-pattern:MonorepoSupport
@libar-docs-status:roadmap
@libar-docs-phase:100
@libar-docs-product-area:Configuration
@libar-docs-effort:3d
@libar-docs-priority:low
@libar-docs-business-value:multi-package-config-and-scoped-queries-for-monorepo-consumers
Feature: Monorepo Cross-Package Support

  **Problem:**
  The delivery-process package is consumed by a large monorepo (~600 files across
  multiple packages), but the config system has no concept of "packages." The
  consumer passes all source paths as repeated --input and --features CLI flags,
  creating massive duplication across 15+ scripts. MasterDataset has no concept of
  which package a pattern belongs to. There is no --package filter for scoping
  queries, no cross-package dependency visibility, and no per-package coverage.

  **Solution:**
  Extend config and pipeline with workspace-aware capabilities:
  1. Multi-package config mapping package names to source globs
  2. Package provenance derived from glob matching (not a new annotation tag)
  3. Package-scoped query filter composing with existing filters
  4. Cross-package dependency analysis aggregated from pattern relationships
  5. Per-package coverage reports

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | PackageConfig type and Zod schema | pending | src/config/project-config.ts |
      | Package-aware source resolver | pending | src/config/resolve-config.ts |
      | Package provenance on ExtractedPattern | pending | src/validation-schemas/extracted-pattern.ts |
      | Scanner package assignment | pending | src/scanner/pattern-scanner.ts |
      | MasterDataset byPackage view | pending | src/generators/pipeline/transform-dataset.ts |
      | CLI --package filter flag | pending | src/cli/output-pipeline.ts |
      | Cross-package dependency subcommand | pending | src/api/cross-package.ts |
      | Per-package coverage report | pending | src/api/coverage-analyzer.ts |

  Rule: Config supports workspace-aware package definitions

    **Invariant:** When a packages field is present in the config, each entry maps
    a package name to its source globs. The top-level sources field becomes optional.
    Packages without their own features or stubs inherit from top-level sources.
    Repos without packages work exactly as before (backward compatible).

    **Rationale:** The consumer monorepo has no config file because the system only
    supports flat glob arrays. Adding packages enables a single config file to
    replace duplicated globs across 15+ scripts.

    **Verified by:** Multi-package config parsing,
    Single-package backward compatibility

    @acceptance-criteria @happy-path
    Scenario: Multi-package config is parsed and validated
      Given a config file with two package entries
      When the config is loaded and resolved
      Then each package has resolved TypeScript and feature globs
      And the total source set is the union of all package globs

    @acceptance-criteria @happy-path
    Scenario: Single-package config works without packages field
      Given a config file with sources but no packages field
      When the config is loaded and resolved
      Then resolution proceeds exactly as before
      And no package provenance is assigned

  Rule: Extracted patterns carry package provenance from glob matching

    **Invariant:** When packages config is active, every ExtractedPattern has an
    optional package field set from the matching glob. If no packages config exists,
    the field is undefined. First match wins on overlapping globs.

    **Rationale:** Package provenance must be derived automatically from config,
    not from manual annotation. This ensures zero additional developer effort.

    **Verified by:** Package derived from glob match,
    No package when config lacks packages field

    @acceptance-criteria @happy-path
    Scenario: Package field is set from matching glob
      Given a multi-package config with "platform-core" and "platform-bc"
      And a source file at "packages/platform-core/src/events.ts"
      When the file is scanned and extracted
      Then the resulting pattern has package "platform-core"

    @acceptance-criteria @edge-case
    Scenario: Package field is undefined without packages config
      Given a single-package config with no packages field
      When a source file is scanned
      Then the resulting pattern has no package field

  Rule: CLI commands accept a package filter that composes with existing filters

    **Invariant:** The --package flag filters patterns to those from a specific
    package. It composes with --status, --phase, --category via logical AND.

    **Rationale:** In a 600-file monorepo, unscoped queries return too many results.
    Package-scoped filtering lets developers focus on a single workspace member.

    **Verified by:** Package filter returns matching patterns,
    Package filter composes with status filter

    @acceptance-criteria @happy-path
    Scenario: Package filter returns only matching patterns
      Given patterns from "platform-core" and "platform-bc" in the dataset
      When running "process-api list --package platform-core"
      Then only patterns with package "platform-core" are returned

    @acceptance-criteria @happy-path
    Scenario: Package filter composes with status filter
      Given active and roadmap patterns in both packages
      When running "process-api list --package platform-core --status active"
      Then only active patterns from "platform-core" are returned

  Rule: Cross-package dependencies are visible as a package-level graph

    **Invariant:** The cross-package subcommand aggregates pattern-level relationships
    into package-level edges, showing source package, target package, and the patterns
    forming the dependency. Intra-package dependencies are excluded.

    **Rationale:** Understanding cross-package dependencies is essential for release
    planning and impact analysis. The relationship data already exists in
    relationshipIndex -- this adds package-level aggregation.

    **Verified by:** Cross-package edges derived from pattern relationships,
    Intra-package dependencies excluded

    @acceptance-criteria @happy-path
    Scenario: Cross-package dependency view shows package edges
      Given "OrderHandler" in "platform-bc" uses "EventStore" in "platform-core"
      When running "process-api cross-package"
      Then the output shows platform-bc depends on platform-core

    @acceptance-criteria @edge-case
    Scenario: Intra-package dependencies are excluded
      Given "Scanner" uses "ASTParser" and both are in "platform-core"
      When running "process-api cross-package"
      Then no self-referencing edge for platform-core appears

  Rule: Coverage analysis reports annotation completeness per package

    **Invariant:** When packages config is active, arch coverage reports per-package
    annotation counts alongside the aggregate total.

    **Rationale:** Different packages have different annotation maturity. Per-package
    breakdown lets teams track their own progress and identify which packages need
    the most work.

    **Verified by:** Per-package coverage breakdown,
    Single-package config shows flat report

    @acceptance-criteria @happy-path
    Scenario: Coverage report includes per-package breakdown
      Given a multi-package config with two packages
      When running "process-api arch coverage"
      Then the report shows per-package coverage with annotated counts and percentages

    @acceptance-criteria @edge-case
    Scenario: Single-package config shows flat coverage report
      Given a config with no packages field
      When running "process-api arch coverage"
      Then the report shows a single aggregate coverage number
