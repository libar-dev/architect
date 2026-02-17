# ✅ Layered Diagram Generation

**Purpose:** Detailed requirements for the Layered Diagram Generation feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

As a documentation generator
I want to generate layered architecture diagrams from metadata
So that system architecture is visualized by layer hierarchy

## Acceptance Criteria

**Generate subgraphs for each layer**

- Given patterns with layers:
- When the layered diagram is generated
- Then the Mermaid output contains subgraphs for layers:

| name        | archRole        | archContext | archLayer      |
| ----------- | --------------- | ----------- | -------------- |
| Decider1    | decider         | orders      | domain         |
| Handler1    | command-handler | orders      | application    |
| Repository1 | repository      | orders      | infrastructure |

| layer          |
| -------------- |
| domain         |
| application    |
| infrastructure |

**Layers render in correct order**

- Given patterns with layers:
- When the layered diagram is generated
- Then the domain layer appears before application layer
- And the application layer appears before infrastructure layer

| name        | archRole        | archContext | archLayer      |
| ----------- | --------------- | ----------- | -------------- |
| Decider1    | decider         | orders      | domain         |
| Handler1    | command-handler | orders      | application    |
| Repository1 | repository      | orders      | infrastructure |

**Nodes include context labels**

- Given patterns with layers:
- When the layered diagram is generated
- Then the Mermaid output contains node "OrderHandler" with context "orders"
- And the Mermaid output contains node "InvHandler" with context "inventory"

| name         | archRole        | archContext | archLayer   |
| ------------ | --------------- | ----------- | ----------- |
| OrderHandler | command-handler | orders      | application |
| InvHandler   | command-handler | inventory   | application |

**Unlayered patterns in Other subgraph**

- Given patterns with layers:
- When the layered diagram is generated
- Then the Mermaid output contains subgraph "Other"
- And the pattern "Uncategorized" appears in the diagram

| name          | archRole        | archContext | archLayer   |
| ------------- | --------------- | ----------- | ----------- |
| Handler1      | command-handler | orders      | application |
| Uncategorized | saga            | orders      | -           |

**Summary section for layered view**

- Given patterns with layers:
- When the layered diagram is generated
- Then the document contains elements:

| name     | archRole        | archContext | archLayer   |
| -------- | --------------- | ----------- | ----------- |
| Decider1 | decider         | orders      | domain      |
| Handler1 | command-handler | orders      | application |

| text                     |
| ------------------------ |
| ## Overview              |
| 2 annotated source files |

## Business Rules

**Layered diagrams group patterns by arch-layer**

**Invariant:** Each distinct arch-layer value must produce exactly one Mermaid subgraph containing all patterns with that layer.
**Verified by:** Generate subgraphs for each layer

    Patterns with arch-layer are grouped into Mermaid subgraphs.
    Each layer becomes a visual container.

_Verified by: Generate subgraphs for each layer_

**Layer order is domain to infrastructure (top to bottom)**

**Invariant:** Layer subgraphs must be rendered in Clean Architecture order: domain first, then application, then infrastructure.
**Rationale:** The visual order reflects the dependency rule where outer layers depend on inner layers; reversing it would misrepresent the architecture.
**Verified by:** Layers render in correct order

    The layer subgraphs are rendered in Clean Architecture order:
    domain at top, then application, then infrastructure at bottom.
    This reflects the dependency rule: outer layers depend on inner layers.

_Verified by: Layers render in correct order_

**Context labels included in layered diagram nodes**

**Invariant:** Each node in a layered diagram must include its bounded context name as a label, since context is not conveyed by subgraph grouping.
**Rationale:** Layered diagrams group by layer, not context, so the context label is the only way to identify which bounded context a node belongs to.
**Verified by:** Nodes include context labels

    Unlike component diagrams which group by context, layered diagrams
    include the context as a label in each node name.

_Verified by: Nodes include context labels_

**Patterns without layer go to Other subgraph**

**Invariant:** Patterns that have arch-role or arch-context but no arch-layer must be placed in an "Other" subgraph, never omitted from the diagram.
**Rationale:** Omitting unlayered patterns would silently hide architectural components; the "Other" group makes their missing classification visible.
**Verified by:** Unlayered patterns in Other subgraph

    Patterns that have arch-role or arch-context but no arch-layer
    are grouped into an "Other" subgraph.

_Verified by: Unlayered patterns in Other subgraph_

**Layered diagram includes summary section**

**Invariant:** The generated layered diagram document must include an Overview section with annotated source file count.
**Verified by:** Summary section for layered view

    The generated document starts with an overview section
    specific to layered architecture visualization.

_Verified by: Summary section for layered view_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
