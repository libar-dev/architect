@libar-docs
@libar-docs-pattern:ArchitectureDiagramGeneration
@libar-docs-status:active
@libar-docs-phase:23
@libar-docs-product-area:DeliveryProcess
@architecture
Feature: Layered Architecture Diagram Generation

  As a documentation generator
  I want to generate layered architecture diagrams from metadata
  So that system architecture is visualized by layer hierarchy

  Background: Dataset with architecture metadata
    Given an architecture codec configured for layered diagrams

  # ============================================================================
  # Layer Subgraph Rules
  # ============================================================================

  Rule: Layered diagrams group patterns by arch-layer

    Patterns with arch-layer are grouped into Mermaid subgraphs.
    Each layer becomes a visual container.

    @acceptance-criteria @happy-path
    Scenario: Generate subgraphs for each layer
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer      |
        | Decider1    | decider         | orders      | domain         |
        | Handler1    | command-handler | orders      | application    |
        | Repository1 | repository      | orders      | infrastructure |
      When the layered diagram is generated
      Then the Mermaid output contains subgraphs for layers:
        | layer          |
        | domain         |
        | application    |
        | infrastructure |

  Rule: Layer order is infrastructure to domain (top to bottom)

    The layer subgraphs are rendered in conventional order:
    infrastructure at top, then application, then domain at bottom.

    @acceptance-criteria @happy-path
    Scenario: Layers render in correct order
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer      |
        | Decider1    | decider         | orders      | domain         |
        | Handler1    | command-handler | orders      | application    |
        | Repository1 | repository      | orders      | infrastructure |
      When the layered diagram is generated
      Then the infrastructure layer appears before application layer
      And the application layer appears before domain layer

  Rule: Context labels included in layered diagram nodes

    Unlike component diagrams which group by context, layered diagrams
    include the context as a label in each node name.

    @acceptance-criteria @happy-path
    Scenario: Nodes include context labels
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer   |
        | OrderHandler| command-handler | orders      | application |
        | InvHandler  | command-handler | inventory   | application |
      When the layered diagram is generated
      Then the Mermaid output contains node "OrderHandler" with context "orders"
      And the Mermaid output contains node "InvHandler" with context "inventory"

  Rule: Patterns without layer go to Other subgraph

    Patterns that have arch-role or arch-context but no arch-layer
    are grouped into an "Other" subgraph.

    @acceptance-criteria @validation
    Scenario: Unlayered patterns in Other subgraph
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer   |
        | Handler1    | command-handler | orders      | application |
        | Uncategorized| saga           | orders      | -           |
      When the layered diagram is generated
      Then the Mermaid output contains subgraph "Other"
      And the pattern "Uncategorized" appears in the diagram

  # ============================================================================
  # Document Structure Rules
  # ============================================================================

  Rule: Layered diagram includes summary section

    The generated document starts with an overview section
    specific to layered architecture visualization.

    @acceptance-criteria @happy-path
    Scenario: Summary section for layered view
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer   |
        | Decider1    | decider         | orders      | domain      |
        | Handler1    | command-handler | orders      | application |
      When the layered diagram is generated
      Then the document contains elements:
        | text                       |
        | ## Overview                |
        | 2 annotated source files   |

