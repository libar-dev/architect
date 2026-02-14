# ✅ Component Diagram Generation

**Purpose:** Detailed documentation for the Component Diagram Generation pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Architecture |

## Description

As a documentation generator
  I want to generate component diagrams from architecture metadata
  So that system architecture is automatically visualized with bounded context subgraphs

## Acceptance Criteria

**Generate subgraphs for bounded contexts**

- Given patterns with contexts:
- When the component diagram is generated
- Then the Mermaid output contains subgraphs for contexts:

| name | archRole | archContext |
| --- | --- | --- |
| OrderHandler | command-handler | orders |
| OrderProj | projection | orders |
| InvHandler | command-handler | inventory |

| context |
| --- |
| orders |
| inventory |

**Shared infrastructure subgraph for context-less patterns**

- Given patterns with contexts:
- When the component diagram is generated
- Then the Mermaid output contains subgraph "Shared Infrastructure"
- And the pattern "EventBus" appears in the diagram

| name | archRole | archContext |
| --- | --- | --- |
| OrderHandler | command-handler | orders |
| EventBus | infrastructure | - |
| Logger | infrastructure | - |

**Arrow styles for relationship types**

- Given patterns with relationships:
- When the component diagram is generated
- Then the Mermaid output contains arrows:

| name | archRole | archContext | uses | dependsOn | implements |
| --- | --- | --- | --- | --- | --- |
| OrderHandler | command-handler | orders | OrderRepo | - | - |
| OrderRepo | repository | orders | - | Database | Repository |
| Database | infrastructure | - | - | - | - |
| Repository | repository | - | - | - | - |

| arrow |
| --- |
| OrderHandler --> OrderRepo |
| OrderRepo -.-> Database |
| OrderRepo ..-> Repository |

**Skip arrows to non-annotated targets**

- Given patterns with relationships:
- When the component diagram is generated
- Then the Mermaid output contains arrow "OrderHandler --> OrderRepo"
- And the Mermaid output does not contain "External"

| name | archRole | archContext | uses |
| --- | --- | --- | --- |
| OrderHandler | command-handler | orders | OrderRepo,External |
| OrderRepo | repository | orders | - |

**Summary section with counts**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains elements:

| name | archRole | archContext |
| --- | --- | --- |
| OrderHandler | command-handler | orders |
| OrderProj | projection | orders |
| InvHandler | command-handler | inventory |

| text |
| --- |
| ## Overview |
| 3 annotated source files |
| 2 bounded context |

**Legend section with arrow explanations**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains elements:

| name | archRole | archContext |
| --- | --- | --- |
| OrderHandler | command-handler | orders |

| text |
| --- |
| ## Legend |
| uses |
| depends-on |

**Inventory table with component details**

- Given patterns with contexts:
- When the component diagram is generated
- Then the document contains "## Component Inventory"
- And the inventory table includes columns:

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| OrderHandler | command-handler | orders | application |
| OrderProj | projection | orders | application |

| column |
| --- |
| Component |
| Context |
| Role |
| Layer |

**No architecture data message**

- Given no patterns with architecture annotations
- When the component diagram is generated
- Then the document contains elements:

| text |
| --- |
| No Architecture Data |
| @libar-docs-arch-role |

## Business Rules

**Component diagrams group patterns by bounded context**

Patterns with arch-context are grouped into Mermaid subgraphs.
    Each bounded context becomes a visual container.

_Verified by: Generate subgraphs for bounded contexts_

**Context-less patterns go to Shared Infrastructure**

Patterns without arch-context are grouped into a
    "Shared Infrastructure" subgraph.

_Verified by: Shared infrastructure subgraph for context-less patterns_

**Relationship types render with distinct arrow styles**

Arrow styles follow UML conventions:
    - uses: solid arrow (-->)
    - depends-on: dashed arrow (-.->)
    - implements: dotted arrow (..->)
    - extends: open arrow (-->>)

_Verified by: Arrow styles for relationship types_

**Arrows only connect annotated components**

Relationships pointing to non-annotated patterns
    are not rendered (target would not exist in diagram).

_Verified by: Skip arrows to non-annotated targets_

**Component diagram includes summary section**

The generated document starts with an overview section
    showing component counts and bounded context statistics.

_Verified by: Summary section with counts_

**Component diagram includes legend when enabled**

The legend explains arrow style meanings for readers.

_Verified by: Legend section with arrow explanations_

**Component diagram includes inventory table when enabled**

The inventory lists all components with their metadata.

_Verified by: Inventory table with component details_

**Empty architecture data shows guidance message**

If no patterns have architecture annotations,
    the document explains how to add them.

_Verified by: No architecture data message_

---

[← Back to Pattern Registry](../PATTERNS.md)
