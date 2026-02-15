# ✅ Mermaid Relationship Rendering

**Purpose:** Detailed documentation for the Mermaid Relationship Rendering pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

Tests for rendering all relationship types in Mermaid dependency graphs
  with distinct visual styles per relationship semantics.

## Acceptance Criteria

**Uses relationships render as solid arrows**

- Given a pattern "Orchestrator" with uses ["CommandBus", "EventStore"]
- When the Mermaid graph is generated
- Then the output should contain "Orchestrator --> CommandBus"
- And the output should contain "Orchestrator --> EventStore"

**Depends-on relationships render as dashed arrows**

- Given a pattern "DCB" with dependsOn ["CMSDualWrite"]
- When the Mermaid graph is generated
- Then the output should contain "DCB -.-> CMSDualWrite"

**Implements relationships render as dotted arrows**

- Given a file "outbox.ts" that implements "EventStoreDurability"
- When the Mermaid graph is generated
- Then the output should contain "outbox_ts ..-> EventStoreDurability"

**Extends relationships render as solid open arrows**

- Given a pattern "ReactiveProjections" that extends "ProjectionCategories"
- When the Mermaid graph is generated
- Then the output should contain "ReactiveProjections -->> ProjectionCategories"

**Special characters are replaced**

- Given a pattern named "<patternName>"
- When the node ID is sanitized
- Then the node ID should be "<nodeId>"

**Complete dependency graph with all relationship types**

- Given the following patterns and relationships:
- When the Mermaid graph is generated
- Then the graph should contain at least one of each arrow type
- And the graph header should be "graph TD"

| name | uses | dependsOn | implements | extends |
| --- | --- | --- | --- | --- |
| Orchestrator | CommandBus | - | - | - |
| DCB | CMSDualWrite | DeciderPattern | - | - |
| ReactiveProjections | - | - | - | ProjectionCategories |
| outbox.ts | - | - | EventStoreDurability | - |

## Business Rules

**Each relationship type has a distinct arrow style**

**Invariant:** Each relationship type (uses, depends-on, implements, extends) must render with a unique, visually distinguishable arrow style.
    **Rationale:** Identical arrow styles would make relationship semantics indistinguishable in generated diagrams.
    **Verified by:** Uses relationships render as solid arrows, Depends-on relationships render as dashed arrows, Implements relationships render as dotted arrows, Extends relationships render as solid open arrows

_Verified by: Uses relationships render as solid arrows, Depends-on relationships render as dashed arrows, Implements relationships render as dotted arrows, Extends relationships render as solid open arrows_

**Pattern names are sanitized for Mermaid node IDs**

**Invariant:** Pattern names must be transformed into valid Mermaid node IDs by replacing special characters (dots, hyphens, spaces) with underscores.
    **Verified by:** Special characters are replaced

_Verified by: Special characters are replaced_

**All relationship types appear in single graph**

**Invariant:** The generated Mermaid graph must combine all relationship types (uses, depends-on, implements, extends) into a single top-down graph.
    **Verified by:** Complete dependency graph with all relationship types

_Verified by: Complete dependency graph with all relationship types_

---

[← Back to Pattern Registry](../PATTERNS.md)
