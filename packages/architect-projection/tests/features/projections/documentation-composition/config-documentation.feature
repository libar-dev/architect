@architect
@architect-pattern:DocumentationCompositionProjectionExecutableTests
@architect-implements:DocumentationCompositionProjectionSupport,ProjectConfigProjection,DocumentationBundle,ArchitectureDiagramProjection,PrChangeReviewProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@documentation-composition
Feature: Documentation Composition projection bodies

  **Business Value:** Consumers compose complete documentation payloads —
  project-config snapshots, documentation bundles, architecture diagrams, and PR
  change reviews — from `ProjectionContext` alone, without reaching into raw
  graph DTOs or legacy Studio config shapes.

  **How It Works:** Each projection parses its options through a strict Zod
  schema, walks the PatternGraph for matching patterns and relationships, and
  returns a schema-validated fragment or bundle. Dropped or unknown document
  types throw `UnknownDocumentType`; grouped source globs are flattened and
  deduped into a single snapshot list.

  Background:
    Given the Documentation Composition projection state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/documentation-composition/config-documentation.feature |

  Rule: Project config snapshots normalize the legacy Studio payload into fragment contracts

    **Invariant:** `projectConfig` always flattens grouped input/features/exclude
    globs into a single deduped `sourceGlobs` array, preserves graph-derived
    counts (`patternCount`, `phaseCount`, `roleCount`), and `parseAndProjectConfig`
    rejects malformed source-glob groups loudly before building the snapshot.

    **Rationale:** Consumers need one stable snapshot shape per project regardless
    of how the Studio config authored its source groups, and malformed options
    must fail at the parse boundary instead of corrupting downstream fragments.

    **Verified by:** projecting a config snapshot with grouped source globs, parseAndProjectConfig rejects malformed source glob groups

    @acceptance-criteria
    Scenario: projecting a config snapshot with grouped source globs
      Given a Documentation Composition config context with project metadata and grouped source globs
      When I project the config snapshot
      Then the config snapshot should flatten source globs and preserve graph counts
      And the config snapshot root should round-trip through the Fragment schema

    Scenario: parseAndProjectConfig rejects malformed source glob groups
      Given a Documentation Composition config context with project metadata and grouped source globs
      When I parse-and-project a config snapshot with malformed source glob groups
      Then parsing config projection options should fail loudly

  Rule: Documentation dispatch only supports the retained Documentation Composition document types

    **Invariant:** `projectDocumentationBundle` dispatches only on the retained
    Documentation Composition document types (architecture, decisions,
    business-rules, patterns, roadmap, current-work, requirements-executable,
    requirements-specs, validation-rules, taxonomy, changelog, traceability) and throws
    `UnknownDocumentType` for both intentionally dropped types (reference,
    product-areas, design-review, product-requirements) and any unknown type.

    **Rationale:** The supported set is the durable contract between Studio and
    documentation consumers; silently accepting dropped or unknown types would
    hide schema drift and regressions.

    **Verified by:** projecting all supported documentation bundles, dropped and unknown documentation types are rejected explicitly

    Scenario: projecting all supported documentation bundles
      Given a Documentation Composition documentation context with delivery architecture requirements and decisions data
      When I project every supported documentation bundle
      Then each supported documentation bundle should return a non-empty root section bundle
      And the supported documentation registry should expose metadata for every live surface
      And each supported documentation registry entry should define a complete disclosure matrix
      And each supported disclosure matrix should define maturity and status filter defaults
      And each supported documentation default disclosure level should exist in its disclosure matrix
      And committed false disclosure levels should only appear on opt-in detail surfaces
      And the patterns documentation bundle should expose per-pattern detail additional files
      And the requirements executable documentation links should resolve to emitted files
      And the requirements specs documentation should omit roadmap requirements by default
      And the roadmap documentation should include roadmap work by default
      And advanced business-rule documentation should include candidate rules
      And runtime maturity filter overrides should preserve default status filtering

    Scenario: composing requirement details without embedded business-rule detail children
      Given a Documentation Composition documentation context with delivery architecture requirements and decisions data
      When I project every supported documentation bundle
      Then the requirements executable documentation should omit business-rule child routes
      And requirement detail views should not synthesize business-rule detail sections
      And requirement business-rule owner routes should resolve against business-rule docs

    Scenario: dropped and unknown documentation types are rejected explicitly
      Given a Documentation Composition documentation context with delivery architecture requirements and decisions data
      When I project dropped and unknown documentation bundle types
      Then each rejected documentation type should throw UnknownDocumentType

  Rule: Architecture diagram projections support the full scope enum explicitly

    **Invariant:** `projectArchitectureDiagram` supports every
    `ArchitectureDiagramScope` value (`component`, `layered`, `bounded-context`,
    `product-area`), preserves the requested scope on the output fragment, and
    filters patterns by `archContext` or `productArea` when a `scopeValue` is
    supplied for bounded-context or product-area views.

    **Rationale:** Consumers rely on the scope value round-tripping into the
    diagram fragment to title and route each diagram, and scoped filtering must
    happen inside the projection so no raw graph iteration leaks into callers.

    **Verified by:** projecting architecture diagrams for each supported scope

    Scenario: projecting architecture diagrams for each supported scope
      Given a Documentation Composition architecture context with bounded contexts layers and product areas
      When I project architecture diagrams for each supported scope
      Then each architecture diagram should preserve the requested scope
      And the bounded-context and product-area diagrams should filter patterns by the explicit scope value

  Rule: PR change review projections derive affected patterns from explicit options

    **Invariant:** `projectPrChangeReview` preserves the explicit `branch` and
    deduped `changedFiles` from the caller's options, and derives
    `affectedPatterns` only from patterns whose source, behavior, target, or
    deliverable paths match a changed file — never from implicit state.

    **Rationale:** PR review context must be reproducible from the supplied
    options alone so Studio and Action surfaces produce identical reviews for
    the same branch and change set.

    **Verified by:** projecting PR change review with changed files and branch inputs

    Scenario: projecting PR change review with changed files and branch inputs
      Given a Documentation Composition PR review context with changed deliverable and feature files
      When I project the PR change review for branch "feat/documentation-composition"
      Then the PR change review should preserve the explicit branch and changed files
      And the PR change review should list affected patterns matched from the changed file options

  Rule: Projection package options-schema barrels stay aligned with subtree declarations

    **Invariant:** Every `*OptionsSchema` that is intentionally public from a
    projection subtree remains re-exported through `src/projections/index.ts`,
    and the root package barrel continues to aggregate that projections barrel.

    **Rationale:** The package root is the consumer-facing contract, so public
    option schemas must stay discoverable there while leaf-only schemas remain
    private.

    **Verified by:** auditing the projection package options-schema barrel during
    the package test chain

    @acceptance-criteria
    Scenario: the projection package options-schema barrel audit stays green
      Given the Documentation Composition projection state is initialized
      When I audit the projection package options-schema barrels
      Then the audit should report no missing or unexpected root exports
      And the audit should confirm the public subtree export set matches the projections barrel export set
