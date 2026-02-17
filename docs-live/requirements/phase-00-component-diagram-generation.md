# ✅ Component Diagram Generation

**Purpose:** Detailed requirements for the Component Diagram Generation feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

As a documentation generator
I want to generate component diagrams from architecture metadata
So that system architecture is automatically visualized with bounded context subgraphs

## Acceptance Criteria

**Generate subgraphs for bounded contexts**

- Given patterns with contexts:
- When the component diagram is generated
- Then the Mermaid output contains subgraphs for contexts:

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |
| OrderProj    | projection      | orders      |
| InvHandler   | command-handler | inventory   |

| context   |
| --------- |
| orders    |
| inventory |

**Shared infrastructure subgraph for context-less patterns**

- Given patterns with contexts:
- When the component diagram is generated
- Then the Mermaid output contains subgraph "Shared Infrastructure"
- And the pattern "EventBus" appears in the diagram

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |
| EventBus     | infrastructure  | -           |
| Logger       | infrastructure  | -           |

**Arrow styles for relationship types**

- Given patterns with relationships:
- When the component diagram is generated
- Then the Mermaid output contains arrows:

| name         | archRole        | archContext | uses      | dependsOn | implements |
| ------------ | --------------- | ----------- | --------- | --------- | ---------- |
| OrderHandler | command-handler | orders      | OrderRepo | -         | -          |
| OrderRepo    | repository      | orders      | -         | Database  | Repository |
| Database     | infrastructure  | -           | -         | -         | -          |
| Repository   | repository      | -           | -         | -         | -          |

| arrow                      |
| -------------------------- |
| OrderHandler --> OrderRepo |
| OrderRepo -.-> Database    |
| OrderRepo ..-> Repository  |

**Skip arrows to non-annotated targets**

- Given patterns with relationships:
- When the component diagram is generated
- Then the Mermaid output contains arrow "OrderHandler --> OrderRepo"
- And the Mermaid output does not contain "External"

| name         | archRole        | archContext | uses               |
| ------------ | --------------- | ----------- | ------------------ |
| OrderHandler | command-handler | orders      | OrderRepo,External |
| OrderRepo    | repository      | orders      | -                  |

**Summary section with counts**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains elements:

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |
| OrderProj    | projection      | orders      |
| InvHandler   | command-handler | inventory   |

| text                     |
| ------------------------ |
| ## Overview              |
| 3 annotated source files |
| 2 bounded context        |

**Legend section with arrow explanations**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains elements:

| name         | archRole        | archContext |
| ------------ | --------------- | ----------- |
| OrderHandler | command-handler | orders      |

| text       |
| ---------- |
| ## Legend  |
| uses       |
| depends-on |

**Inventory table with component details**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains "## Component Inventory"
- And the inventory table includes columns:

| name         | archRole        | archContext | archLayer   |
| ------------ | --------------- | ----------- | ----------- |
| OrderHandler | command-handler | orders      | application |
| OrderProj    | projection      | orders      | application |

| column    |
| --------- |
| Component |
| Context   |
| Role      |
| Layer     |

**No architecture data message**

- Given no patterns with architecture annotations
- When the component diagram is generated
- Then the document contains elements:

| text                  |
| --------------------- |
| No Architecture Data  |
| @libar-docs-arch-role |

## Business Rules

**Component diagrams group patterns by bounded context**

**Invariant:** Each distinct arch-context value must produce exactly one Mermaid subgraph containing all patterns with that context.
**Verified by:** Generate subgraphs for bounded contexts

    Patterns with arch-context are grouped into Mermaid subgraphs.
    Each bounded context becomes a visual container.

_Verified by: Generate subgraphs for bounded contexts_

**Context-less patterns go to Shared Infrastructure**

**Invariant:** Patterns without an arch-context value must be placed in a "Shared Infrastructure" subgraph, never omitted from the diagram.
**Rationale:** Cross-cutting infrastructure components (event bus, logger) belong to no bounded context but must still appear in the diagram.
**Verified by:** Shared infrastructure subgraph for context-less patterns

    Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.

_Verified by: Shared infrastructure subgraph for context-less patterns_

**Relationship types render with distinct arrow styles**

**Invariant:** Each relationship type must render with its designated Mermaid arrow style: uses (-->), depends-on (-.->), implements (..->), extends (-->>).
**Rationale:** Distinct arrow styles convey dependency semantics visually; conflating them loses architectural information.
**Verified by:** Arrow styles for relationship types

    Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)

_Verified by: Arrow styles for relationship types_

**Arrows only connect annotated components**

**Invariant:** Relationship arrows must only be rendered when both source and target patterns exist in the architecture index.
**Rationale:** Rendering an arrow to a non-existent node would produce invalid Mermaid syntax or dangling references.
**Verified by:** Skip arrows to non-annotated targets

    Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).

_Verified by: Skip arrows to non-annotated targets_

**Component diagram includes summary section**

**Invariant:** The generated component diagram document must include an Overview section with component count and bounded context count.
**Verified by:** Summary section with counts

    The generated document starts with an overview section
    showing component counts and bounded context statistics.

_Verified by: Summary section with counts_

**Component diagram includes legend when enabled**

**Invariant:** When the legend is enabled, the document must include a Legend section explaining relationship arrow styles.
**Verified by:** Legend section with arrow explanations

    The legend explains arrow style meanings for readers.

_Verified by: Legend section with arrow explanations_

**Component diagram includes inventory table when enabled**

**Invariant:** When the inventory is enabled, the document must include a Component Inventory table with Component, Context, Role, and Layer columns.
**Verified by:** Inventory table with component details

    The inventory lists all components with their metadata.

_Verified by: Inventory table with component details_

**Empty architecture data shows guidance message**

**Invariant:** When no patterns have architecture annotations, the document must display a guidance message explaining how to add arch tags.
**Rationale:** An empty diagram with no explanation would be confusing; guidance helps users onboard to the annotation system.
**Verified by:** No architecture data message

    If no patterns have architecture annotations,
    the document explains how to add them.

_Verified by: No architecture data message_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
