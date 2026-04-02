@architect
@behavior @reference-codec
@architect-pattern:ScopedArchitecturalView
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-implements:ReferenceDocShowcase
@architect-phase:28
@architect-depends-on:ArchitectureDiagramGeneration,ShapeExtraction
@architect-product-area:Generation
Feature: Reference Codec - Diagram Type Rendering

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

  Diagram type controls Mermaid output format including flowchart,
  sequenceDiagram, stateDiagram-v2, C4Context, and classDiagram.
  Edge labels and custom node shapes enrich diagram readability.

  Background:
    Given a reference codec test context

  Rule: Diagram type controls Mermaid output format

    **Invariant:** The diagramType field on DiagramScope selects the Mermaid
    output format. Supported types are graph (flowchart, default),
    sequenceDiagram, and stateDiagram-v2. Each type produces syntactically
    valid Mermaid output with type-appropriate node and edge rendering.

    **Rationale:** Flowcharts cannot naturally express event flows (sequence),
    FSM visualization (state), or temporal ordering. Multiple diagram types
    unlock richer architectural documentation from the same relationship data.

    **Verified by:** Default diagramType produces flowchart,
    Sequence diagram renders participant-message format,
    State diagram renders state transitions,
    Sequence diagram includes neighbor patterns as participants,
    State diagram adds start and end pseudo-states

    @acceptance-criteria @happy-path
    Scenario: Default diagramType produces flowchart
      Given a reference config with diagramScopes archContext "orders"
      And a PatternGraph with arch-annotated patterns in context "orders"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "graph"

    @acceptance-criteria @happy-path
    Scenario: Sequence diagram renders participant-message format
      Given a reference config with diagramScopes archContext "orders" and diagramType "sequenceDiagram"
      And a PatternGraph with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "sequenceDiagram"
      And the mermaid content contains "participant" declarations
      And the mermaid content contains message arrows between participants

    @acceptance-criteria @happy-path
    Scenario: State diagram renders state transitions
      Given a reference config with diagramScopes archContext "workflow" and diagramType "stateDiagram-v2"
      And a PatternGraph with patterns in context "workflow" with dependsOn relationships
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content starts with "stateDiagram-v2"
      And the mermaid content contains state transition syntax

    @acceptance-criteria @edge-case
    Scenario: Sequence diagram includes neighbor patterns as participants
      Given a reference config with diagramScopes archContext "orders" and diagramType "sequenceDiagram"
      And a PatternGraph with an orders pattern that uses an external pattern
      When decoding at detail level "detailed"
      Then the mermaid content contains participant declarations for both scope and neighbor patterns

    @acceptance-criteria @edge-case
    Scenario: State diagram adds start and end pseudo-states
      Given a reference config with diagramScopes archContext "workflow" and diagramType "stateDiagram-v2"
      And a PatternGraph with a linear dependsOn chain of workflow patterns
      When decoding at detail level "detailed"
      Then the mermaid content contains a start pseudo-state transition
      And the mermaid content contains an end pseudo-state transition

    @acceptance-criteria @happy-path
    Scenario: C4 diagram renders system boundary format
      Given a reference config with diagramScopes archContext "orders" and diagramType "C4Context"
      And a PatternGraph with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content starts with "C4Context"
      And the mermaid content contains a Boundary block for "orders"
      And the mermaid content contains System declarations
      And the mermaid content contains Rel declarations

    @acceptance-criteria @happy-path
    Scenario: C4 diagram renders neighbor patterns as external systems
      Given a reference config with diagramScopes archContext "orders" and diagramType "C4Context"
      And a PatternGraph with an orders pattern that uses an external pattern
      When decoding at detail level "detailed"
      Then the mermaid content contains a System_Ext declaration

    @acceptance-criteria @happy-path
    Scenario: Class diagram renders class members and relationships
      Given a reference config with diagramScopes archContext "orders" and diagramType "classDiagram"
      And a PatternGraph with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content starts with "classDiagram"
      And the mermaid content contains class declarations with members
      And the mermaid content contains relationship arrows

    @acceptance-criteria @happy-path
    Scenario: Class diagram renders archRole as stereotype
      Given a reference config with diagramScopes archContext "orders" and diagramType "classDiagram"
      And a PatternGraph with a service pattern and a projection pattern in context "orders"
      When decoding at detail level "detailed"
      Then the mermaid content contains a service stereotype
      And the mermaid content contains a projection stereotype

  Rule: Edge labels and custom node shapes enrich diagram readability

    **Invariant:** Relationship edges display labels describing the relationship
    type (uses, depends on, implements, extends). Edge labels are enabled by
    default and can be disabled via showEdgeLabels false. Node shapes in
    flowchart diagrams vary by archRole value using Mermaid shape syntax.

    **Rationale:** Unlabeled edges are ambiguous without consulting a legend.
    Custom node shapes make archRole visually distinguishable without color
    reliance, improving accessibility and scanability.

    **Verified by:** Edge labels appear by default,
    Edge labels can be disabled,
    archRole controls node shape,
    Unknown archRole falls back to rectangle

    @acceptance-criteria @happy-path
    Scenario: Relationship edges display type labels by default
      Given a reference config with diagramScopes archContext "orders"
      And a PatternGraph with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content contains labeled edges with relationship type text

    @acceptance-criteria @happy-path
    Scenario: Edge labels can be disabled for compact diagrams
      Given a reference config with diagramScopes archContext "orders" and showEdgeLabels false
      And a PatternGraph with patterns in context "orders" with uses relationships
      When decoding at detail level "detailed"
      Then the mermaid content contains unlabeled edges

    @acceptance-criteria @happy-path
    Scenario: archRole controls Mermaid node shape
      Given a reference config with diagramScopes archContext "orders"
      And a PatternGraph with a service pattern and a projection pattern in context "orders"
      When decoding at detail level "detailed"
      Then the service node uses rounded rectangle syntax
      And the projection node uses cylinder syntax

    @acceptance-criteria @edge-case
    Scenario: Pattern without archRole uses default rectangle shape
      Given a reference config with diagramScopes archContext "orders"
      And a PatternGraph with a pattern without archRole in context "orders"
      When decoding at detail level "detailed"
      Then the node uses default rectangle syntax
