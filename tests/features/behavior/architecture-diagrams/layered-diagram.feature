@libar-docs
@libar-docs-pattern:LayeredDiagramGeneration
@libar-docs-status:completed
@libar-docs-implements:ArchitectureDiagramGeneration
@libar-docs-product-area:Generation
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

    **Invariant:** Each distinct arch-layer value must produce exactly one Mermaid subgraph containing all patterns with that layer.
    **Rationale:** Without layer subgraphs, the Clean Architecture boundary between domain, application, and infrastructure is not visually enforced.
    **Verified by:** Generate subgraphs for each layer

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

  Rule: Layer order is domain to infrastructure (top to bottom)

    **Invariant:** Layer subgraphs must be rendered in Clean Architecture order: domain first, then application, then infrastructure.
    **Rationale:** The visual order reflects the dependency rule where outer layers depend on inner layers; reversing it would misrepresent the architecture.
    **Verified by:** Layers render in correct order

    The layer subgraphs are rendered in Clean Architecture order:
    domain at top, then application, then infrastructure at bottom.
    This reflects the dependency rule: outer layers depend on inner layers.

    @acceptance-criteria @happy-path
    Scenario: Layers render in correct order
      Given patterns with layers:
        | name        | archRole        | archContext | archLayer      |
        | Decider1    | decider         | orders      | domain         |
        | Handler1    | command-handler | orders      | application    |
        | Repository1 | repository      | orders      | infrastructure |
      When the layered diagram is generated
      Then the domain layer appears before application layer
      And the application layer appears before infrastructure layer

  Rule: Context labels included in layered diagram nodes

    **Invariant:** Each node in a layered diagram must include its bounded context name as a label, since context is not conveyed by subgraph grouping.
    **Rationale:** Layered diagrams group by layer, not context, so the context label is the only way to identify which bounded context a node belongs to.
    **Verified by:** Nodes include context labels

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

    **Invariant:** Patterns that have arch-role or arch-context but no arch-layer must be placed in an "Other" subgraph, never omitted from the diagram.
    **Rationale:** Omitting unlayered patterns would silently hide architectural components; the "Other" group makes their missing classification visible.
    **Verified by:** Unlayered patterns in Other subgraph

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

    **Invariant:** The generated layered diagram document must include an Overview section with annotated source file count.
    **Rationale:** Without summary counts, readers cannot assess diagram completeness or detect missing annotated sources.
    **Verified by:** Summary section for layered view

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
        | 2 key components           |

