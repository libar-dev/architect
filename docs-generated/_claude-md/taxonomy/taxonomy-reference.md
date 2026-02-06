# TaxonomyReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Concept

**Context:** A taxonomy is a classification system for organizing knowledge.

    **Definition:** In delivery-process, the taxonomy defines the vocabulary for
    pattern annotations. It determines what tags exist, their valid values, and
    how they are parsed from source code.

    **Components:**

| Component | Purpose | Source File |
| --- | --- | --- |
| Categories | Domain classifications (e.g., core, api, ddd) | categories.ts |
| Status Values | FSM states (roadmap, active, completed, deferred) | status-values.ts |
| Format Types | How tag values are parsed (flag, csv, enum) | format-types.ts |
| Hierarchy Levels | Work item levels (epic, phase, task) | hierarchy-levels.ts |
| Risk Levels | Risk assessment (low, medium, high) | risk-levels.ts |
| Layer Types | Feature layer (timeline, domain, integration) | layer-types.ts |

    **Key Principle:** The taxonomy is NOT a fixed schema. Presets select
    different subsets, and you can define custom categories.

### Format Types

- `FORMAT_TYPES` - const
- `FormatType` - type

### Categories

- `CategoryDefinition` - interface
- `CATEGORIES` - const
- `CategoryTag` - type
- `CATEGORY_TAGS` - const

### Status Values (from status-values)

- `PROCESS_STATUS_VALUES` - const
- `ProcessStatusValue` - type
- `ACCEPTED_STATUS_VALUES` - const
- `AcceptedStatusValue` - type
- `DEFAULT_STATUS` - const

### Status Values (from this decision (rule: status values))

**Context:** Status values control the FSM workflow for pattern lifecycle.

    **Decision:** Four canonical status values are defined (per PDR-005).
    See `src/taxonomy/status-values.ts` for the `PROCESS_STATUS_VALUES` array
    with inline documentation on FSM transitions and protection levels.

    **Status Values Reference:**

| Status | Protection Level | Description | Editable |
| --- | --- | --- | --- |
| roadmap | None | Planned work, not yet started | Full editing |
| active | Scope-locked | Work in progress | Edit existing only |
| completed | Hard-locked | Work finished | Requires unlock tag |
| deferred | None | On hold, may resume later | Full editing |

    **Valid FSM Transitions:**

| From | To | Trigger |
| --- | --- | --- |
| roadmap | active | Start work |
| roadmap | deferred | Postpone before start |
| active | completed | Finish work |
| active | roadmap | Regress (blocked) |
| deferred | roadmap | Resume planning |

    **FSM Diagram:**

    """mermaid
    stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Hard-locked
        note right of active : Scope-locked
    """

### Normalized Status (from normalized-status)

- `NORMALIZED_STATUS_VALUES` - const
- `NormalizedStatus` - type
- `STATUS_NORMALIZATION_MAP` - const
- `normalizeStatus` - function

### Hierarchy Levels

- `HIERARCHY_LEVELS` - const
- `HierarchyLevel` - type
- `DEFAULT_HIERARCHY_LEVEL` - const

### Risk Levels

- `RISK_LEVELS` - const
- `RiskLevel` - type

### Layer Types

- `LAYER_TYPES` - const
- `LayerType` - type

### TagRegistry

- `TagRegistry` - interface
- `MetadataTagDefinitionForRegistry` - interface
- `TagDefinition` - type
- `buildRegistry` - function
- `METADATA_TAGS_BY_GROUP` - const

### Presets

**Context:** Different projects need different taxonomy subsets.

    **Decision:** Three presets are available:

| Preset | Categories | Tag Prefix | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | 3 | @libar-docs- | Simple projects (this package) |
| ddd-es-cqrs | 21 | @libar-docs- | DDD/Event Sourcing architectures |
| generic | 3 | @docs- | Simple projects with @docs- prefix |

    **Behavior:** The preset determines which categories are available.
    All presets share the same status values and format types.
