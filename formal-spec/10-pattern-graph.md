# 10 — Pattern Graph

> **Architect Spec v0.1.0** — The data model produced by parsing all architect artifacts.

---

## Overview

The pattern graph is the **single read model** computed from all annotated source files,
Gherkin specs, stubs, ADRs, and release manifests. It is the sole data structure consumed
by all downstream tools: CLI queries, MCP servers, documentation generators, ProcessGuard,
and desktop UI views.

The pattern graph is a **projection** — it is recomputed from source on every change and
never maintained separately. This is the same principle as CQRS read models in domain-driven
design: the write model is the annotated code, the read model is the pattern graph.

Level 3 conformant implementations MUST produce a pattern graph conforming to this section.

## Core Structure

The pattern graph contains three top-level components:

```
PatternGraph {
  patterns: ExtractedPattern[]     // All patterns from all sources
  tagRegistry: TagRegistry         // Project tag taxonomy
  views: PreComputedViews          // O(1) lookup indexes
}
```

## ExtractedPattern

Each annotated file or Gherkin feature produces one `ExtractedPattern`. This is the atom
of the architecture — the fundamental unit from which everything else is derived.

### Identity Fields

| Field         | Type      | Description                                                  |
| ------------- | --------- | ------------------------------------------------------------ |
| `id`          | PatternId | Unique identifier (generated, e.g., `pattern-a1b2c3d4`)      |
| `name`        | string    | Display name derived from Feature title or JSDoc heading     |
| `patternName` | string    | Value of `@architect-pattern` tag (PascalCase)               |
| `role`        | RoleName  | First matching role tag value (e.g., `@architect-role:saga`) |

### Source Fields

| Field          | Type             | Description                |
| -------------- | ---------------- | -------------------------- |
| `source.file`  | SourceFilePath   | Path to the source file    |
| `source.lines` | [number, number] | Start and end line numbers |
| `code`         | string           | Raw source text            |
| `extractedAt`  | ISO8601          | Extraction timestamp       |

### Status and Lifecycle

| Field          | Type                                                 | Description                     |
| -------------- | ---------------------------------------------------- | ------------------------------- |
| `status`       | `'roadmap' \| 'active' \| 'completed' \| 'deferred'` | FSM state                       |
| `phase`        | number                                               | Roadmap phase                   |
| `priority`     | `'critical' \| 'high' \| 'medium' \| 'low'`          | Priority level                  |
| `effort`       | string                                               | Effort estimate (e.g., `5d`)    |
| `effortActual` | string?                                              | Actual effort (post-completion) |
| `quarter`      | string?                                              | Target quarter                  |
| `completed`    | ISO8601?                                             | Completion date                 |
| `team`         | string?                                              | Responsible team                |
| `risk`         | `'high' \| 'medium' \| 'low'`?                       | Risk level                      |
| `workflow`     | string?                                              | Active workflow identifier      |

### Relationships

| Field                | Type     | Description                        |
| -------------------- | -------- | ---------------------------------- |
| `dependsOn`          | string[] | Pattern names this depends on      |
| `enables`            | string[] | Pattern names this enables         |
| `uses`               | string[] | Pattern names this uses at runtime |
| `usedBy`             | string[] | Pattern names that use this        |
| `implementsPatterns` | string[] | Spec patterns this implements      |
| `extendsPattern`     | string?  | Pattern this extends               |
| `seeAlso`            | string[] | Related pattern names              |
| `apiRef`             | string?  | External API reference             |

### Architecture

| Field            | Type                                                               | Description                                    |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| `roleDefinition` | RoleDefinition?                                                    | Resolved role metadata (diagram shape, labels) |
| `archContext`    | string?                                                            | Bounded context                                |
| `archLayer`      | `'presentation' \| 'application' \| 'domain' \| 'infrastructure'`? | Layer                                          |
| `productArea`    | string?                                                            | Product area                                   |
| `boundedContext` | string?                                                            | Bounded context (alias)                        |

> **Historical note:** `archRole` appears in legacy extraction aliases and preserved reference docs only.

### Business Rules

| Field   | Type           | Description                                 |
| ------- | -------------- | ------------------------------------------- |
| `rules` | BusinessRule[] | Rules extracted from Gherkin `Rule:` blocks |

Each `BusinessRule`:

| Field           | Type      | Description                                                |
| --------------- | --------- | ---------------------------------------------------------- |
| `name`          | string    | Rule title text                                            |
| `description`   | string    | Full rule text including Invariant, Rationale, Verified by |
| `scenarioCount` | number    | Number of scenarios under this rule                        |
| `scenarioNames` | string[]  | Names of verifying scenarios                               |
| `tags`          | string[]? | Tags on the Rule block (e.g., sequence tags)               |

### Deliverables

| Field          | Type          | Description                           |
| -------------- | ------------- | ------------------------------------- |
| `deliverables` | Deliverable[] | From `Background: Deliverables` table |

Each `Deliverable`:

| Field      | Type                                         | Description                |
| ---------- | -------------------------------------------- | -------------------------- |
| `name`     | string                                       | Deliverable name           |
| `status`   | `'pending' \| 'in-progress' \| 'complete'`   | Delivery status            |
| `location` | string                                       | File path                  |
| `tests`    | boolean?                                     | Whether tests are required |
| `testType` | `'unit' \| 'integration' \| 'e2e' \| 'n/a'`? | Test type                  |

### ADR Fields (when applicable)

| Field             | Type                                                        | Description              |
| ----------------- | ----------------------------------------------------------- | ------------------------ |
| `adr`             | string?                                                     | ADR number               |
| `adrStatus`       | `'proposed' \| 'accepted' \| 'deprecated' \| 'superseded'`? | ADR lifecycle            |
| `adrCategory`     | string?                                                     | ADR category             |
| `adrSupersedes`   | string?                                                     | ADR this supersedes      |
| `adrSupersededBy` | string?                                                     | ADR that supersedes this |

### Product & Business

| Field           | Type      | Description                       |
| --------------- | --------- | --------------------------------- |
| `businessValue` | string?   | Business value slug               |
| `userRole`      | string?   | Primary user role                 |
| `constraints`   | string[]? | Business or technical constraints |

### Hierarchy

| Field      | Type                           | Description                    |
| ---------- | ------------------------------ | ------------------------------ |
| `level`    | `'epic' \| 'phase' \| 'task'`? | Hierarchy level                |
| `parent`   | string?                        | Parent pattern name            |
| `children` | string[]?                      | Child pattern names (computed) |

### Discovery

| Field                    | Type      | Description               |
| ------------------------ | --------- | ------------------------- |
| `discoveredGaps`         | string[]? | Gaps found during review  |
| `discoveredImprovements` | string[]? | Improvement opportunities |
| `discoveredRisks`        | string[]? | Risks identified          |
| `discoveredLearnings`    | string[]? | Lessons learned           |

## Pre-Computed Views

The pattern graph MUST provide pre-computed views for efficient querying. These views
are computed once during graph building and provide O(1) lookups.

### Status Views

| View                 | Type               | Description                     |
| -------------------- | ------------------ | ------------------------------- |
| `byStatus.completed` | ExtractedPattern[] | All completed patterns          |
| `byStatus.active`    | ExtractedPattern[] | All active patterns             |
| `byStatus.planned`   | ExtractedPattern[] | All roadmap + deferred patterns |

### Phase Views

| View      | Type                            | Description               |
| --------- | ------------------------------- | ------------------------- |
| `byPhase` | Map<number, ExtractedPattern[]> | Patterns grouped by phase |

### Role Views

| View     | Type                            | Description              |
| -------- | ------------------------------- | ------------------------ |
| `byRole` | Map<string, ExtractedPattern[]> | Patterns grouped by role |

### Source Type Views

| View                      | Type               | Description                    |
| ------------------------- | ------------------ | ------------------------------ |
| `bySourceType.typescript` | ExtractedPattern[] | Patterns from `.ts` files      |
| `bySourceType.gherkin`    | ExtractedPattern[] | Patterns from `.feature` files |

### Product Area Views

| View            | Type                            | Description                      |
| --------------- | ------------------------------- | -------------------------------- |
| `byProductArea` | Map<string, ExtractedPattern[]> | Patterns grouped by product area |

### Statistics

| Field              | Type   | Description                 |
| ------------------ | ------ | --------------------------- |
| `counts.completed` | number | Count of completed patterns |
| `counts.active`    | number | Count of active patterns    |
| `counts.planned`   | number | Count of planned patterns   |
| `counts.total`     | number | Total pattern count         |
| `phaseCount`       | number | Number of distinct phases   |
| `roleCount`        | number | Number of distinct roles    |

## Optional Indexes

Level 3 implementations SHOULD provide these additional indexes:

### Relationship Index

Per-pattern relationship resolution:

| Field                | Type               | Description                     |
| -------------------- | ------------------ | ------------------------------- |
| `uses`               | ExtractedPattern[] | Resolved patterns this uses     |
| `usedBy`             | ExtractedPattern[] | Resolved patterns that use this |
| `dependsOn`          | ExtractedPattern[] | Resolved dependencies           |
| `enables`            | ExtractedPattern[] | Resolved patterns this enables  |
| `implementsPatterns` | ExtractedPattern[] | Resolved implemented specs      |
| `implementedBy`      | ExtractedPattern[] | Resolved implementing code      |
| `seeAlso`            | ExtractedPattern[] | Resolved cross-references       |

### Architecture Index

| Field       | Type                              | Description                    |
| ----------- | --------------------------------- | ------------------------------ |
| `byRole`    | Map<ArchRole, ExtractedPattern[]> | Patterns by architecture role  |
| `byContext` | Map<string, ExtractedPattern[]>   | Patterns by bounded context    |
| `byLayer`   | Map<string, ExtractedPattern[]>   | Patterns by architecture layer |

## Tag Registry

The pattern graph includes the project's tag taxonomy as a queryable structure:

```
TagRegistry {
  prefix: string                    // e.g., "@architect-"
  gateTag: string                   // e.g., "@architect"
  tags: Map<string, TagDefinition>  // All registered tags
}

TagDefinition {
  name: string                      // Tag name without prefix
  format: FormatType                // value, enum, csv, number, quoted-value, flag
  values?: string[]                 // Allowed values (for enum format)
  required?: boolean                // Whether the tag is required
  group: string                     // Functional group
  description: string               // Human-readable purpose
}
```

## Build Pipeline

The pattern graph is built through a pipeline that processes all annotated sources:

```
1. Load project configuration (architect.config.ts)
2. Scan TypeScript sources → extract @architect-* JSDoc tags
3. Scan Gherkin features → extract @architect-* Gherkin tags
4. Merge TypeScript and Gherkin extractions (dual-source reconciliation)
5. Build hierarchy (parent-child relationships)
6. Transform and validate (Zod schema validation)
7. Compute pre-computed views and indexes
8. Return immutable PatternGraph
```

The pipeline is deterministic — the same inputs always produce the same graph. The graph
is immutable once built. Modifications to source files trigger a full rebuild.
