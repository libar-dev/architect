@architect
@architect-pattern:ComponentDiagramGeneration
@architect-status:completed
@architect-implements:ArchitectureDiagramGeneration
@architect-product-area:Generation
@architecture
Feature: Component Diagram Generation

  As a documentation generator
  I want to generate component diagrams from architecture metadata
  So that system architecture is automatically visualized with bounded context subgraphs

  Background: Dataset with architecture metadata
    Given an architecture codec with default options

  # ============================================================================
  # Bounded Context Subgraph Rules
  # ============================================================================

  Rule: Component diagrams group patterns by bounded context

    **Invariant:** Each distinct arch-context value must produce exactly one Mermaid subgraph containing all patterns with that context.
    **Rationale:** Without subgraph grouping, the visual relationship between components and their bounded context is lost, making the diagram structurally meaningless.
    **Verified by:** Generate subgraphs for bounded contexts

    Patterns with arch-context are grouped into Mermaid subgraphs.
    Each bounded context becomes a visual container.

    @acceptance-criteria @happy-path
    Scenario: Generate subgraphs for bounded contexts
      Given patterns with contexts:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
        | OrderProj    | projection      | orders      |
        | InvHandler   | command-handler | inventory   |
      When the component diagram is generated
      Then the Mermaid output contains subgraphs for contexts:
        | context   |
        | orders    |
        | inventory |

  Rule: Context-less patterns go to Shared Infrastructure

    **Invariant:** Patterns without an arch-context value must be placed in a "Shared Infrastructure" subgraph, never omitted from the diagram.
    **Rationale:** Cross-cutting infrastructure components (event bus, logger) belong to no bounded context but must still appear in the diagram.
    **Verified by:** Shared infrastructure subgraph for context-less patterns

    Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.

    @acceptance-criteria @happy-path
    Scenario: Shared infrastructure subgraph for context-less patterns
      Given patterns with contexts:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
        | EventBus     | infrastructure  | -           |
        | Logger       | infrastructure  | -           |
      When the component diagram is generated
      Then the Mermaid output contains subgraph "Shared Infrastructure"
      And the pattern "EventBus" appears in the diagram

  # ============================================================================
  # Relationship Arrow Rules
  # ============================================================================

  Rule: Relationship types render with distinct arrow styles

    **Invariant:** Each relationship type must render with its designated Mermaid arrow style: uses (-->), depends-on (-.->), implements (..->), extends (-->>).
    **Rationale:** Distinct arrow styles convey dependency semantics visually; conflating them loses architectural information.
    **Verified by:** Arrow styles for relationship types

    Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)

    @acceptance-criteria @happy-path
    Scenario: Arrow styles for relationship types
      Given patterns with relationships:
        | name         | archRole        | archContext | uses      | dependsOn | implements |
        | OrderHandler | command-handler | orders      | OrderRepo | -         | -          |
        | OrderRepo    | repository      | orders      | -         | Database  | Repository |
        | Database     | infrastructure  | -           | -         | -         | -          |
        | Repository   | repository      | -           | -         | -         | -          |
      When the component diagram is generated
      Then the Mermaid output contains arrows:
        | arrow                       |
        | OrderHandler --> OrderRepo  |
        | OrderRepo -.-> Database     |
        | OrderRepo ..-> Repository   |

  Rule: Arrows only connect annotated components

    **Invariant:** Relationship arrows must only be rendered when both source and target patterns exist in the architecture index.
    **Rationale:** Rendering an arrow to a non-existent node would produce invalid Mermaid syntax or dangling references.
    **Verified by:** Skip arrows to non-annotated targets

    Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).

    @acceptance-criteria @validation
    Scenario: Skip arrows to non-annotated targets
      Given patterns with relationships:
        | name         | archRole        | archContext | uses               |
        | OrderHandler | command-handler | orders      | OrderRepo,External |
        | OrderRepo    | repository      | orders      | -                  |
      When the component diagram is generated
      Then the Mermaid output contains arrow "OrderHandler --> OrderRepo"
      And the Mermaid output does not contain "External"

  # ============================================================================
  # Document Structure Rules
  # ============================================================================

  Rule: Component diagram includes summary section

    **Invariant:** The generated component diagram document must include an Overview section with component count and bounded context count.
    **Rationale:** Without summary counts, readers cannot quickly assess diagram scope or detect missing components.
    **Verified by:** Summary section with counts

    The generated document starts with an overview section
    showing component counts and bounded context statistics.

    @acceptance-criteria @happy-path
    Scenario: Summary section with counts
      Given patterns with contexts:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
        | OrderProj    | projection      | orders      |
        | InvHandler   | command-handler | inventory   |
      When the component diagram is generated
      Then the document contains elements:
        | text                      |
        | ## Overview               |
        | 3 key components          |
        | 2 bounded context         |

  Rule: Component diagram includes legend when enabled

    **Invariant:** When the legend is enabled, the document must include a Legend section explaining relationship arrow styles.
    **Rationale:** Without a legend, readers cannot distinguish uses, depends-on, implements, and extends arrows, making relationship semantics ambiguous.
    **Verified by:** Legend section with arrow explanations

    The legend explains arrow style meanings for readers.

    @acceptance-criteria @happy-path
    Scenario: Legend section with arrow explanations
      Given patterns with contexts:
        | name         | archRole        | archContext |
        | OrderHandler | command-handler | orders      |
      When the component diagram is generated
      Then the document contains elements:
        | text        |
        | ## Legend   |
        | uses        |
        | depends-on  |

  Rule: Component diagram includes inventory table when enabled

    **Invariant:** When the inventory is enabled, the document must include a Component Inventory table with Component, Context, Role, and Layer columns.
    **Rationale:** The inventory provides a searchable, text-based alternative to the visual diagram for tooling and accessibility.
    **Verified by:** Inventory table with component details

    The inventory lists all components with their metadata.

    @acceptance-criteria @happy-path
    Scenario: Inventory table with component details
      Given patterns with contexts:
        | name         | archRole        | archContext | archLayer   |
        | OrderHandler | command-handler | orders      | application |
        | OrderProj    | projection      | orders      | application |
      When the component diagram is generated
      Then the document contains "## Component Inventory"
      And the inventory table includes columns:
        | column    |
        | Component |
        | Context   |
        | Role      |
        | Layer     |

  # ============================================================================
  # Edge Cases and Empty States
  # ============================================================================

  Rule: Empty architecture data shows guidance message

    **Invariant:** When no patterns have architecture annotations, the document must display a guidance message explaining how to add arch tags.
    **Rationale:** An empty diagram with no explanation would be confusing; guidance helps users onboard to the annotation system.
    **Verified by:** No architecture data message

    If no patterns have architecture annotations,
    the document explains how to add them.

    @acceptance-criteria @validation
    Scenario: No architecture data message
      Given no patterns with architecture annotations
      When the component diagram is generated
      Then the document contains elements:
        | text                        |
        | No Architecture Data        |
        | @architect-arch-role       |

