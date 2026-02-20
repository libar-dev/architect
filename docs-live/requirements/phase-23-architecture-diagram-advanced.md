# 📋 Architecture Diagram Advanced

**Purpose:** Detailed requirements for the Architecture Diagram Advanced feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | planned    |
| Product Area | Generation |
| Phase        | 23         |

## Description

**Problem:** Architecture documentation requires manually maintaining mermaid diagrams
that duplicate information already encoded in source code. When code changes,
diagrams become stale. Manual sync is error-prone and time-consuming.

**Solution:** Generate architecture diagrams automatically from source code annotations
using dedicated `arch-*` tags for precise control. Three tags classify components:

- `@libar-docs-arch-role` - Component type (preset-configurable: service, handler, repository, etc.)
- `@libar-docs-arch-context` - Bounded context for subgraph grouping
- `@libar-docs-arch-layer` - Architectural layer (domain, application, infrastructure)

**Why It Matters:**
| Benefit | How |
| Always-current diagrams | Generated from source annotations |
| Bounded context isolation | arch-context groups into subgraphs |
| Multiple diagram types | Component diagrams + layered diagrams |
| UML-inspired semantics | Relationship arrows match uses/depends-on/implements/extends |
| CLI integration | `pnpm docs:architecture` via generator registry |

## Acceptance Criteria

**Generate subgraphs per layer**

- Given patterns with arch-layer:
- When the layered diagram codec runs
- Then output contains subgraph "Domain Layer"
- And output contains subgraph "Application Layer"
- And output contains subgraph "Infrastructure Layer"

| Pattern | arch-layer     | arch-context |
| ------- | -------------- | ------------ |
| Decider | domain         | orders       |
| Handler | application    | orders       |
| Infra   | infrastructure | -            |

**Layer order is infrastructure-application-domain**

- Given patterns with all three layers
- When the layered diagram codec runs
- Then Infrastructure Layer appears before Application Layer in output
- And Application Layer appears before Domain Layer in output

**Include context label in node names**

- Given patterns:
- When the layered diagram codec runs
- Then OrderHandler node label includes "(orders)"
- And InventoryHandler node label includes "(inventory)"

| Pattern          | arch-layer  | arch-context |
| ---------------- | ----------- | ------------ |
| OrderHandler     | application | orders       |
| InventoryHandler | application | inventory    |

**Patterns without layer go to Other subgraph**

- Given patterns:
- When the layered diagram codec runs
- Then output contains subgraph "Other"
- And Unlayered is inside Other subgraph

| Pattern   | arch-layer  | arch-role |
| --------- | ----------- | --------- |
| Layered   | application | handler   |
| Unlayered | -           | saga      |

**Architecture generator is registered**

- Given the generator registry
- When listing available generators
- Then "architecture" should be in the list

**Generator produces component diagram by default**

- When running generate-docs with --generators architecture
- Then output contains valid mermaid graph TB
- And output contains bounded context subgraphs

**Generator option for layered diagram**

- When running generate-docs with --generators architecture --diagram-type layered
- Then output contains layer subgraphs
- And output follows infrastructure-application-domain order

**Generator option for context filtering**

- When running generate-docs with --generators architecture --contexts orders
- Then output only contains patterns from orders context
- And output does not contain inventory context subgraph

**npm script pnpm docs:architecture works**

- When running `pnpm docs:architecture`
- Then command exits successfully
- And architecture diagram is written to output directory

**Generate command flow sequence diagram**

- Given a command handler pattern with uses relationships
- When the sequence diagram codec runs with command flow template
- Then output contains mermaid sequenceDiagram
- And participants are derived from uses relationships
- And 7-step CommandOrchestrator flow is rendered

**Generate saga flow sequence diagram**

- Given a saga pattern with uses relationships to multiple BCs
- When the sequence diagram codec runs with saga flow template
- Then output contains mermaid sequenceDiagram
- And participants include each bounded context
- And compensation steps are shown

**Participant ordering follows architectural layers**

- Given patterns spanning multiple layers
- When the sequence diagram codec runs
- Then participants are ordered by layer
- And infrastructure layer appears first

## Business Rules

**Layered diagrams group patterns by architectural layer**

**Invariant:** Layered diagrams must render patterns grouped by architectural
layer (domain, application, infrastructure) with top-to-bottom flow.

    **Rationale:** Layered architecture visualization shows dependency direction -
    infrastructure at top, domain at bottom - following conventional layer ordering.

    **Verified by:** Generate subgraphs per layer, Layer order is infrastructure-application-domain,
    Include context label in node names

_Verified by: Generate subgraphs per layer, Layer order is infrastructure-application-domain, Include context label in node names, Patterns without layer go to Other subgraph_

**Architecture generator is registered with generator registry**

**Invariant:** An "architecture" generator must be registered with the generator
registry to enable `pnpm docs:architecture` via the existing `generate-docs.js` CLI.

    **Rationale:** The delivery-process uses a generator registry pattern. New
    generators register with the orchestrator rather than creating separate CLI commands.

    **Verified by:** Generator is registered, Generator produces component diagram,
    Generator produces layered diagram, npm script works

_Verified by: Architecture generator is registered, Generator produces component diagram by default, Generator option for layered diagram, Generator option for context filtering, npm script pnpm docs:architecture works_

**Sequence diagrams render interaction flows**

**Invariant:** Sequence diagrams must render interaction flows (command flow,
saga flow) showing step-by-step message passing between components.

    **Rationale:** Component diagrams show structure but not behavior. Sequence
    diagrams show runtime flow - essential for understanding command/saga execution.

    **Verified by:** Generate command flow sequence, Generate saga flow sequence

_Verified by: Generate command flow sequence diagram, Generate saga flow sequence diagram, Participant ordering follows architectural layers_

## Deliverables

- ArchitectureCodec (layered) (complete)
- Architecture generator (pending)
- Example app annotations (pending)
- Sequence diagram support (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
