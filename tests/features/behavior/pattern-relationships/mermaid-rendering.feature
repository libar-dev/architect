@libar-docs
@libar-docs-pattern:MermaidRelationshipRendering
@libar-docs-status:completed
@libar-docs-implements:PatternRelationshipModel
@libar-docs-product-area:Generation
Feature: Mermaid Graph Rendering for Relationships

  Tests for rendering all relationship types in Mermaid dependency graphs
  with distinct visual styles per relationship semantics.

  # ===========================================================================
  # RULE 1: Arrow Style Mapping
  # ===========================================================================

  Rule: Each relationship type has a distinct arrow style

    **Invariant:** Each relationship type (uses, depends-on, implements, extends) must render with a unique, visually distinguishable arrow style.
    **Rationale:** Identical arrow styles would make relationship semantics indistinguishable in generated diagrams.
    **Verified by:** Uses relationships render as solid arrows, Depends-on relationships render as dashed arrows, Implements relationships render as dotted arrows, Extends relationships render as solid open arrows

    @unit
    Scenario: Uses relationships render as solid arrows
      Given a pattern "Orchestrator" with uses ["CommandBus", "EventStore"]
      When the Mermaid graph is generated
      Then the output should contain "Orchestrator --> CommandBus"
      And the output should contain "Orchestrator --> EventStore"

    @unit
    Scenario: Depends-on relationships render as dashed arrows
      Given a pattern "DCB" with dependsOn ["CMSDualWrite"]
      When the Mermaid graph is generated
      Then the output should contain "DCB -.-> CMSDualWrite"

    @unit
    Scenario: Implements relationships render as dotted arrows
      Given a file "outbox.ts" that implements "EventStoreDurability"
      When the Mermaid graph is generated
      Then the output should contain "outbox_ts ..-> EventStoreDurability"

    @unit
    Scenario: Extends relationships render as solid open arrows
      Given a pattern "ReactiveProjections" that extends "ProjectionCategories"
      When the Mermaid graph is generated
      Then the output should contain "ReactiveProjections -->> ProjectionCategories"

  # ===========================================================================
  # RULE 2: Node Sanitization
  # ===========================================================================

  Rule: Pattern names are sanitized for Mermaid node IDs

    **Invariant:** Pattern names must be transformed into valid Mermaid node IDs by replacing special characters (dots, hyphens, spaces) with underscores.
    **Rationale:** Unsanitized names containing dots, hyphens, or spaces produce invalid Mermaid syntax that fails to render.
    **Verified by:** Special characters are replaced

    @unit
    Scenario Outline: Special characters are replaced
      Given a pattern named "<patternName>"
      When the node ID is sanitized
      Then the node ID should be "<nodeId>"

      Examples:
        | patternName | nodeId |
        | outbox.ts | outbox_ts |
        | CMS-Dual-Write | CMS_Dual_Write |
        | Event Store | Event_Store |

  # ===========================================================================
  # RULE 3: Combined Graph
  # ===========================================================================

  Rule: All relationship types appear in single graph

    **Invariant:** The generated Mermaid graph must combine all relationship types (uses, depends-on, implements, extends) into a single top-down graph.
    **Rationale:** Splitting relationship types into separate graphs would fragment the dependency picture and hide cross-type interactions.
    **Verified by:** Complete dependency graph with all relationship types

    @unit
    Scenario: Complete dependency graph with all relationship types
      Given the following patterns and relationships:
        | name | uses | dependsOn | implements | extends |
        | Orchestrator | CommandBus | - | - | - |
        | DCB | CMSDualWrite | DeciderPattern | - | - |
        | ReactiveProjections | - | - | - | ProjectionCategories |
        | outbox.ts | - | - | EventStoreDurability | - |
      When the Mermaid graph is generated
      Then the graph should contain at least one of each arrow type
      And the graph header should be "graph TD"
