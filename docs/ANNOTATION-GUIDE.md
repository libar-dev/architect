# Annotation Guide

> **Deprecated:** This document is superseded by the auto-generated [Annotation Reference Guide](../docs-live/reference/ANNOTATION-REFERENCE.md) which includes all content from this guide plus auto-updated tag tables. This file is preserved for reference only.

How to annotate TypeScript and Gherkin files for pattern extraction, documentation generation, and architecture diagrams.

For the **complete tag reference** (all 50+ tags with formats, values, and examples), generate the taxonomy: `pnpm docs:taxonomy` or see [TAXONOMY.md](./TAXONOMY.md) for the taxonomy architecture.

---

## Getting Started

### File-Level Opt-In

Every file that participates in the annotation system must have a `@architect` opt-in marker. Files without this marker are invisible to the scanner.

**TypeScript** — file-level JSDoc block:

```typescript
/**
 * @architect
 * @architect-pattern MyPattern
 * @architect-status roadmap
 * @architect-uses EventStore, CommandBus
 *
 * ## My Pattern - Description
 *
 * Paragraph describing the pattern's purpose.
 */
```

**Gherkin** — file-level tags before `Feature:`:

```gherkin
@architect
@architect-pattern:MyPattern
@architect-status:roadmap
@architect-phase:14
@architect-depends-on:EventStore,CommandBus
Feature: My Pattern

  **Problem:**
  Description of the problem.
```

### Tag Prefix by Preset

The tag prefix is configurable via presets. All examples in this guide use the default `@architect-` prefix.

| Preset                    | Prefix        | Categories | Use Case                     |
| ------------------------- | ------------- | ---------- | ---------------------------- |
| `libar-generic` (default) | `@architect-` | 3          | Simple projects              |
| `ddd-es-cqrs`             | `@architect-` | 21         | DDD/Event Sourcing monorepos |

See [CONFIGURATION.md](./CONFIGURATION.md) for preset details and custom configuration.

### Dual-Source Ownership

Annotations are split between TypeScript and Gherkin by domain:

| Source         | Owns                                            | Example Tags                                 |
| -------------- | ----------------------------------------------- | -------------------------------------------- |
| **TypeScript** | Implementation: runtime deps, category, shapes  | `uses`, `used-by`, `extract-shapes`, `shape` |
| **Gherkin**    | Planning: status, phase, timeline, dependencies | `status`, `phase`, `depends-on`, `quarter`   |

Anti-pattern validation enforces these boundaries — see [VALIDATION.md](./VALIDATION.md).

---

## Shape Extraction

Shape extraction pulls TypeScript type definitions (interfaces, type aliases, enums, functions, consts) into generated documentation. There are three modes:

### Mode 1: File-Level Explicit Names

List specific declaration names in the file-level JSDoc:

```typescript
/**
 * @architect
 * @architect-extract-shapes MasterDatasetSchema, StatusGroupsSchema, RelationshipEntry
 */
```

Names appear in the generated output in the order listed.

### Mode 2: File-Level Wildcard

Extract all exported declarations automatically:

```typescript
/**
 * @architect
 * @architect-extract-shapes *
 */
```

Wildcard must be the sole value — `*, Foo` is invalid.

### Mode 3: Declaration-Level Tagging

Tag individual declarations with `@architect-shape`, optionally with a group name:

```typescript
/** @architect-shape api-types */
export interface CommandInput {
  readonly aggregateId: string;
  readonly payload: unknown;
}

/** @architect-shape api-types */
export type CommandResult = Result<void, CommandError>;
```

Declaration-level shapes work on both exported and non-exported declarations. The optional group name (`api-types`) enables filtering in diagram scopes and product area documents via `@architect-include`.

### Critical Gotcha: Zod Schemas

For Zod files, extract the **schema constant** (with `Schema` suffix), not the inferred type alias:

| Wrong (type alias)                       | Correct (schema constant)                 |
| ---------------------------------------- | ----------------------------------------- |
| `@extract-shapes MasterDataset`          | `@extract-shapes MasterDatasetSchema`     |
| Shows: `z.infer<typeof ...>` (unhelpful) | Shows: `z.object({...})` (full structure) |

---

## Annotation Patterns by File Type

### Zod Schema Files

```typescript
/**
 * @architect
 * @architect-pattern MasterDataset
 * @architect-status completed
 * @architect-extract-shapes MasterDatasetSchema, StatusGroupsSchema, PhaseGroupSchema
 */
```

### Interface / Type Files

```typescript
/**
 * @architect
 * @architect-pattern DocumentGenerator
 * @architect-status completed
 * @architect-extract-shapes DocumentGenerator, GeneratorContext, GeneratorOutput
 */
```

### Function / Service Files

```typescript
/**
 * @architect
 * @architect-pattern TransformDataset
 * @architect-status completed
 * @architect-arch-context generator
 * @architect-arch-layer application
 * @architect-extract-shapes transformToMasterDataset, RuntimeMasterDataset
 */
```

### Gherkin Feature Files

```gherkin
@architect
@architect-pattern:ProcessGuardLinter
@architect-status:roadmap
@architect-phase:99
@architect-depends-on:StateMachine,ValidationRules
Feature: Process Guard Linter

  Background: Deliverables
    Given the following deliverables:
      | Deliverable      | Status  | Location             |
      | State derivation | Pending | src/lint/derive.ts   |

  Rule: Completed specs require unlock reason

    **Invariant:** A completed spec cannot be modified without explicit unlock.
    **Rationale:** Prevents accidental regression of validated work.

    @acceptance-criteria @happy-path
    Scenario: Reject modification without unlock
      Given a spec with status "completed"
      When I modify a deliverable
      Then validation fails with "completed-protection"
```

---

## Tag Groups Quick Reference

> For the complete tag reference with all values, see the [generated Taxonomy Reference](../docs-live/TAXONOMY.md).

Tags are organized into 12 functional groups. This table shows representative tags per group — for the **complete reference** with all formats, values, and examples, run `pnpm docs:taxonomy`.

| Group            | Tags (representative)                                | Format Types              |
| ---------------- | ---------------------------------------------------- | ------------------------- |
| **Core**         | `pattern`, `status`, `core`, `brief`                 | value, enum, flag         |
| **Relationship** | `uses`, `used-by`, `implements`, `depends-on`        | csv, value                |
| **Process**      | `phase`, `quarter`, `effort`, `team`, `priority`     | number, value, enum       |
| **PRD**          | `product-area`, `user-role`, `business-value`        | value                     |
| **ADR**          | `adr`, `adr-status`, `adr-category`, `adr-theme`     | value, enum               |
| **Hierarchy**    | `level`, `parent`, `title`                           | enum, value, quoted-value |
| **Traceability** | `executable-specs`, `roadmap-spec`, `behavior-file`  | csv, value                |
| **Discovery**    | `discovered-gap`, `discovered-improvement`           | value (repeatable)        |
| **Architecture** | `arch-role`, `arch-context`, `arch-layer`, `include` | enum, value, csv          |
| **Extraction**   | `extract-shapes`, `shape`                            | csv, value                |
| **Stub**         | `target`, `since`                                    | value                     |
| **Convention**   | `convention`                                         | csv (enum values)         |

### Format Types

| Format         | Syntax Example                | Parsing                        |
| -------------- | ----------------------------- | ------------------------------ |
| `flag`         | `@architect-core`             | Boolean presence (no value)    |
| `value`        | `@architect-pattern Foo`      | Simple string                  |
| `enum`         | `@architect-status roadmap`   | Constrained to predefined list |
| `csv`          | `@architect-uses A, B, C`     | Comma-separated values         |
| `number`       | `@architect-phase 14`         | Numeric value                  |
| `quoted-value` | `@architect-title:'My Title'` | Preserves spaces in value      |

---

## Verification

### CLI Commands

```bash
# Tag usage inventory (counts per tag and value)
pnpm architect:query -- tags

# Find files missing @architect opt-in marker
pnpm architect:query -- unannotated --path src/types

# File inventory by type (TS, Gherkin, Stubs)
pnpm architect:query -- sources

# Full pattern JSON including extractedShapes
pnpm architect:query -- query getPattern MyPattern

# Generate complete tag reference
pnpm docs:taxonomy
```

### Common Issues

| Symptom                         | Cause                              | Fix                                             |
| ------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Pattern not in scanner output   | Missing `@architect` opt-in marker | Add file-level `@architect` JSDoc/tag           |
| Shape shows `z.infer<>` wrapper | Extracted type alias, not schema   | Use schema constant name (e.g., `FooSchema`)    |
| Shape not in product area doc   | Missing `@architect-product-area`  | Add product-area tag to file-level annotation   |
| Declaration-level shape missing | No `@architect-shape` on decl      | Add `@architect-shape` JSDoc to the declaration |
| Tag value rejected              | Wrong format or invalid enum value | Check format type in taxonomy reference         |
| Anti-pattern validation error   | Tag on wrong source type           | Move tag to correct source (TS vs Gherkin)      |

---

## Related Documentation

| Topic                     | Document                                       |
| ------------------------- | ---------------------------------------------- |
| Taxonomy architecture     | [TAXONOMY.md](./TAXONOMY.md)                   |
| Presets and configuration | [CONFIGURATION.md](./CONFIGURATION.md)         |
| Pipeline and codecs       | [ARCHITECTURE.md](./ARCHITECTURE.md)           |
| Gherkin writing patterns  | [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md)   |
| Anti-pattern validation   | [VALIDATION.md](./VALIDATION.md)               |
| Product area enrichment   | [CLAUDE.md — Product Area Guide](../CLAUDE.md) |
