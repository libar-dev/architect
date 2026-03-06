# Annotation Reference Guide

**Purpose:** Reference document: Annotation Reference Guide
**Detail Level:** Full reference

---

## Getting Started

Every file that participates in the annotation system must have a `@libar-docs` opt-in marker. Files without this marker are invisible to the scanner.

### File-Level Opt-In

**TypeScript** -- file-level JSDoc block:

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MyPattern
 * @libar-docs-status roadmap
 * @libar-docs-uses EventStore, CommandBus
 *
 * ## My Pattern - Description
 */
```

**Gherkin** -- file-level tags before `Feature:`:

```gherkin
@libar-docs
@libar-docs-pattern:MyPattern
@libar-docs-status:roadmap
@libar-docs-phase:14
Feature: My Pattern

  **Problem:**
  Description of the problem.
```

### Tag Prefix by Preset

| Preset                    | Prefix         | Categories | Use Case                      |
| ------------------------- | -------------- | ---------- | ----------------------------- |
| `libar-generic` (default) | `@libar-docs-` | 3          | Simple projects               |
| `ddd-es-cqrs`             | `@libar-docs-` | 21         | DDD/Event Sourcing monorepos  |
| `generic`                 | `@docs-`       | 3          | Simple projects, short prefix |

### Dual-Source Ownership

| Source         | Owns                                            | Example Tags                                 |
| -------------- | ----------------------------------------------- | -------------------------------------------- |
| **TypeScript** | Implementation: runtime deps, category, shapes  | `uses`, `used-by`, `extract-shapes`, `shape` |
| **Gherkin**    | Planning: status, phase, timeline, dependencies | `status`, `phase`, `depends-on`, `quarter`   |

---

## Shape Extraction

Shape extraction pulls TypeScript type definitions (interfaces, type aliases, enums, functions, consts) into generated documentation. There are three modes:

### Mode 1: File-Level Explicit Names

List specific declaration names in the file-level JSDoc:

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes MasterDatasetSchema, StatusGroupsSchema
 */
```

Names appear in the generated output in the order listed.

### Mode 2: File-Level Wildcard

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes *
 */
```

Wildcard must be the sole value -- `*, Foo` is invalid.

### Mode 3: Declaration-Level Tagging

Tag individual declarations with `@libar-docs-shape`, optionally with a group name:

```typescript
/** @libar-docs-shape api-types */
export interface CommandInput {
  readonly aggregateId: string;
  readonly payload: unknown;
}
```

The optional group name (`api-types`) enables filtering in diagram scopes and product area documents via `@libar-docs-include`.

---

## Critical Gotcha: Zod Schemas

For Zod files, extract the **schema constant** (with `Schema` suffix), not the inferred type alias:

| Wrong (type alias)                       | Correct (schema constant)                 |
| ---------------------------------------- | ----------------------------------------- |
| `@extract-shapes MasterDataset`          | `@extract-shapes MasterDatasetSchema`     |
| Shows: `z.infer<typeof ...>` (unhelpful) | Shows: `z.object({...})` (full structure) |

---

## Verification

### CLI Commands

```bash
# Tag usage inventory (counts per tag and value)
pnpm process:query -- tags

# Find files missing @libar-docs opt-in marker
pnpm process:query -- unannotated --path src/types

# File inventory by type (TS, Gherkin, Stubs)
pnpm process:query -- sources

# Full pattern JSON including extractedShapes
pnpm process:query -- query getPattern MyPattern

# Generate complete tag reference
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

---

## Common Issues

| Symptom                         | Cause                               | Fix                                              |
| ------------------------------- | ----------------------------------- | ------------------------------------------------ |
| Pattern not in scanner output   | Missing `@libar-docs` opt-in marker | Add file-level `@libar-docs` JSDoc/tag           |
| Shape shows `z.infer<>` wrapper | Extracted type alias, not schema    | Use schema constant name (e.g., `FooSchema`)     |
| Shape not in product area doc   | Missing `@libar-docs-product-area`  | Add product-area tag to file-level annotation    |
| Declaration-level shape missing | No `@libar-docs-shape` on decl      | Add `@libar-docs-shape` JSDoc to the declaration |
| Tag value rejected              | Wrong format or invalid enum value  | Check format type in taxonomy reference          |
| Anti-pattern validation error   | Tag on wrong source type            | Move tag to correct source (TS vs Gherkin)       |

---
