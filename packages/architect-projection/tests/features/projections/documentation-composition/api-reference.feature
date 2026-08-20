@architect
@architect-pattern:ApiReferenceProjectionExecutableTests
@architect-implements:ApiReferenceProjection
@architect-enforces-decision:ADR009ProjectionTrustBoundary
@architect-status:active
@architect-product-area:Projection
@architect-role:projection
@documentation-composition @api-reference
Feature: API reference projection and rendering
  The api-reference documentation type projects the `@architect-shape` API/type
  surface off the PatternGraph. `buildApiReferenceBundle` groups shapes by
  workspace package into per-package child digests under a navigation index
  root, and the markdown renderer emits field-tables and fenced signatures while
  escaping every sourced value per ADR-009.

  Background:
    Given a graph with shape-annotated patterns across two packages

  Rule: The bundle groups shapes by package under a navigation root

    **Invariant:** `buildApiReferenceBundle` groups every extracted shape under
    its owning workspace package, emitting one child digest per package (keyed by
    the package slug) plus a `scope:'all'` root whose `groupingEntries` carry the
    per-package shape and pattern counts; shapes within a child are ordered by
    owning pattern then name.

    **Rationale:** A stable, package-grouped tree with deterministic ordering is
    what lets the renderer route per-package child docs and lets consumers
    navigate the API surface by package — ungrouped or unordered output would
    churn `docs-live/` on every regeneration and break navigation.

    **Verified by:** Shapes are grouped into per-package children

    Scenario: Shapes are grouped into per-package children
      When I build the api-reference bundle
      Then the root scope should be "all"
      And the bundle children keys should be "architect-core, architect-projection"
      And the root grouping entries should report 4 shapes for package "architect-core"
      And each child digest should list its shapes sorted by owning pattern

  Rule: The renderer emits field-tables and signatures per documentation kind

    **Invariant:** A package document renders each shape under its owning pattern
    with a fenced TypeScript signature plus kind-appropriate tables — a Properties
    table for interface members and a Parameters table for functions — and the
    root index links to every package child.

    **Rationale:** Field-tables and signatures are the value of the API reference;
    consumers need the per-kind structure (properties vs parameters) and working
    root→child navigation to read and traverse the surface.

    **Verified by:** A package document renders interface, function, and enum shapes

    Scenario: A package document renders interface, function, and enum shapes
      When I render the api-reference bundle to routed markdown
      Then the package document "api-reference/architect-core.md" should contain a "Properties" table
      And the package document "api-reference/architect-core.md" should contain a "Parameters" table
      And the package document "api-reference/architect-core.md" should contain a fenced "ts" code block
      And the root document "API-REFERENCE.md" should link to each package child

  Rule: Sourced shape text is escaped and code fences are guarded (ADR-009)

    **Invariant:** All sourced shape text (names, descriptions, types) is escaped
    before emission so Markdown metacharacters never survive raw, and a
    declaration's `sourceText` is wrapped in a code fence widened by `pickFence`
    so an embedded triple-backtick run cannot break out of the block.

    **Rationale:** ADR-009 treats sourced text as untrusted; unescaped
    metacharacters or a fence breakout would corrupt the generated Markdown and
    reintroduce the projection trust-boundary bug the campaign's Phase 0 fixed.

    **Verified by:** Markdown metacharacters in sourced text are escaped

    Scenario: Markdown metacharacters in sourced text are escaped
      When I render the api-reference bundle to routed markdown
      Then the rendered package document should escape the shape description metacharacters
      And a source declaration containing a triple-backtick fence should be wrapped in a longer fence

  Rule: An unannotated graph degrades to a single document

    **Invariant:** When the graph contains no shape-annotated patterns, the
    projection returns a single root document (rendered as one Markdown string)
    with no child routes, rather than an empty tree or empty child files.

    **Rationale:** A graph with no shapes must still produce a valid, stable
    `API-REFERENCE.md` without emitting empty per-package files or tripping the
    docs determinism gate.

    **Verified by:** A graph with no shapes yields a single root document

    Scenario: A graph with no shapes yields a single root document
      Given a graph with no shape-annotated patterns
      When I render the api-reference bundle to markdown
      Then the render result should be a single root document
