@architect
@architect-pattern:ScopedArchitecturalView
@architect-status:completed
@architect-unlock-reason:Retroactive-spec-for-completed-work
@architect-phase:28
@architect-effort:3d
@architect-product-area:Generation
@architect-depends-on:ArchitectureDiagramGeneration,ShapeExtraction
@architect-business-value:enables-selective-pattern-composition-with-architecture-diagrams
@architect-priority:high
Feature: Scoped Architectural View

  **Problem:**
  Full architecture diagrams show every annotated pattern in the project. For focused
  use cases -- design session context, PR descriptions, CLAUDE.md module sections --
  developers need views scoped to a small set of relevant patterns with their immediate
  neighbors. Manually curating diagram content defeats the code-first principle.

  **Solution:**
  A `DiagramScope` filter interface that selects patterns by three dimensions
  (`archContext`, `archView`, or explicit pattern names), automatically discovers
  neighbor patterns via relationship edges, and renders scoped Mermaid diagrams
  with subgraph grouping and distinct neighbor styling.

  The `arch-view` tag enables patterns to declare membership in named architectural
  views (e.g., `codec-transformation`, `pipeline-stages`). A single pattern can
  belong to multiple views. The transformer groups patterns by view in the
  `ArchIndex.byView` pre-computed index for O(1) access at render time.

  **Why It Matters:**
  | Benefit | How |
  | Focused context for AI sessions | Select 3-5 patterns instead of 50+ |
  | Automatic neighbor discovery | Related patterns appear without explicit listing |
  | Multiple views per pattern | One annotation, many documents |
  | Two detail levels from one config | Detailed (with diagram) and summary (table only) |
  | Reusable across document types | PR descriptions, CLAUDE.md, design context |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | arch-view tag in taxonomy | complete | src/taxonomy/registry-builder.ts |
      | archView in DocDirective schema | complete | src/validation-schemas/doc-directive.ts |
      | archView in ExtractedPattern schema | complete | src/validation-schemas/extracted-pattern.ts |
      | archView extraction in AST parser | complete | src/scanner/ast-parser.ts |
      | archView propagation in doc-extractor | complete | src/extractor/doc-extractor.ts |
      | byView grouping in ArchIndex | complete | src/generators/pipeline/transform-dataset.ts |
      | DiagramScope interface | complete | src/renderable/codecs/reference.ts |
      | collectScopePatterns filter | complete | src/renderable/codecs/reference.ts |
      | collectNeighborPatterns discovery | complete | src/renderable/codecs/reference.ts |
      | buildScopedDiagram builder | complete | src/renderable/codecs/reference.ts |
      | diagramScopes (plural) support | complete | src/renderable/codecs/reference.ts |
      | sanitizeNodeId shared utility | complete | src/renderable/codecs/diagram-utils.ts |

  Rule: Scope filtering selects patterns by context, view, or name

    **Invariant:** A pattern matches a DiagramScope if ANY of three conditions hold:
    its name is in `scope.patterns`, its `archContext` is in `scope.archContext`,
    or any of its `archView` entries is in `scope.archView`. These dimensions are
    OR'd together -- a pattern need only match one.

    **Rationale:** Three filter dimensions cover different authoring workflows.
    Explicit names for ad-hoc documents, archContext for bounded context views,
    archView for cross-cutting architectural perspectives.

    **Verified by:** archContext filter matches patterns,
    archView filter matches patterns, combined filters OR together

    @acceptance-criteria @happy-path
    Scenario: archContext filter matches patterns in that context
      Given patterns annotated with archContext "renderer"
      And a DiagramScope with archContext "renderer"
      When the scope filter runs
      Then only patterns in the "renderer" context appear

    @acceptance-criteria @happy-path
    Scenario: archView filter matches patterns with that view
      Given patterns annotated with archView "codec-transformation"
      And a DiagramScope with archView "codec-transformation"
      When the scope filter runs
      Then patterns belonging to the "codec-transformation" view appear

    @acceptance-criteria @edge-case
    Scenario: Multiple filter dimensions OR together
      Given a pattern with archContext "scanner" and no archView
      And a pattern with archView "pipeline-stages" and no archContext
      And a DiagramScope with archContext "scanner" and archView "pipeline-stages"
      When the scope filter runs
      Then both patterns appear in the result

  Rule: Neighbor discovery finds connected patterns outside scope

    **Invariant:** Patterns connected to scope patterns via relationship edges
    (uses, dependsOn, implementsPatterns, extendsPattern) but NOT themselves in
    scope appear in a "Related" subgraph with dashed border styling.

    **Rationale:** Scoped views need context. Showing only in-scope patterns
    without their dependencies loses critical relationship information.
    Neighbor patterns provide this context without cluttering the main view.

    **Verified by:** Neighbor patterns appear in diagram, Self-contained scope has no neighbors

    @acceptance-criteria @happy-path
    Scenario: Neighbor patterns appear with dashed styling
      Given scope patterns that use a pattern outside the scope
      When the scoped diagram is built
      Then the neighbor appears in a "Related" subgraph
      And the neighbor node has dashed border styling

    @acceptance-criteria @edge-case
    Scenario: Self-contained scope produces no neighbor subgraph
      Given scope patterns with no external relationships
      When the scoped diagram is built
      Then no "Related" subgraph appears

  Rule: Multiple diagram scopes compose in sequence

    **Invariant:** When `diagramScopes` is an array, each scope produces its own
    Mermaid diagram section with independent title, direction, and pattern selection.
    At summary detail level, all diagrams are suppressed.

    **Rationale:** A single reference document may need multiple architectural
    perspectives. Pipeline Overview shows both a codec transformation view (TB)
    and a pipeline data flow view (LR) in the same document.

    **Verified by:** Two scopes produce two mermaid blocks,
    Direction controls diagram orientation, Summary level omits diagrams

    @acceptance-criteria @happy-path
    Scenario: Two diagram scopes produce two mermaid blocks
      Given a config with two diagramScopes entries
      When the reference codec renders at detailed level
      Then the output contains two separate mermaid code blocks

    @acceptance-criteria @happy-path
    Scenario: Direction controls diagram orientation
      Given a DiagramScope with direction "LR"
      When the scoped diagram is built
      Then the mermaid block contains "graph LR"

    @acceptance-criteria @happy-path
    Scenario: Summary detail level omits all diagrams
      Given a config with diagramScopes entries
      When the reference codec renders at summary level
      Then the output contains no mermaid code blocks
