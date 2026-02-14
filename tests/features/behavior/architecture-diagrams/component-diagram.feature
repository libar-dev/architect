@libar-docs
@libar-docs-pattern:ComponentDiagramGeneration
@libar-docs-status:completed
@libar-docs-implements:ArchitectureDiagramGeneration
@libar-docs-product-area:Generation
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
        | 3 annotated source files  |
        | 2 bounded context         |

  Rule: Component diagram includes legend when enabled

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

    If no patterns have architecture annotations,
    the document explains how to add them.

    @acceptance-criteria @validation
    Scenario: No architecture data message
      Given no patterns with architecture annotations
      When the component diagram is generated
      Then the document contains elements:
        | text                        |
        | No Architecture Data        |
        | @libar-docs-arch-role       |

