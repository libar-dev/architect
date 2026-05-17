# 03 — Tag System

> **Architect Spec v0.2.0** — Tag mechanics, format types, ordering, and validation rules.

---

## Overview

The tag system is the bridge between human-readable Gherkin specifications and the
machine-queryable pattern graph. Every `@architect-*` tag adds structured metadata that
the extraction pipeline processes into pattern attributes, relationships, and indexes.

Tags appear in two contexts:

1. **Gherkin files** — as tags before the `Feature:` keyword (standard Gherkin tag syntax)
2. **TypeScript files** — as `@architect-*` annotations within JSDoc `/** */` comment blocks

## Tag Prefix

The tag prefix is configurable per project. The default is `@architect-`.

```
Default:  @architect-pattern:UserRegistration
Custom:   @myprefix-pattern:UserRegistration
```

The prefix MUST end with a hyphen (`-`). The gate tag uses the prefix without a hyphen
(e.g., `@architect` for the default prefix).

Throughout this specification, examples use the default `@architect-` prefix. Implementations
MUST support configuring an alternative prefix.

## Gate Tag

The gate tag (`@architect` by default) is REQUIRED on every file that should be processed
by the extraction pipeline. Files without the gate tag are ignored.

**In Gherkin files:**

```gherkin
@architect
@architect-pattern:UserRegistration
Feature: UserRegistration - New user account creation
```

**In TypeScript files:**

```typescript
/**
 * @architect
 * @architect-pattern UserRegistration
 * @architect-status roadmap
 */
export interface UserRegistrationService { ... }
```

> _Informative:_ The gate tag exists to enable opt-in extraction. In a large codebase,
> only files explicitly marked with the gate tag are processed. This keeps extraction
> fast and avoids false positives from unrelated `@` tags.

## Tag Syntax

### Gherkin Syntax

In Gherkin files, tags follow the standard Gherkin tag syntax with a colon separator
for values:

```
@architect-<tag-name>:<value>
```

- Tags appear on lines before the `Feature:` keyword
- One tag per line (RECOMMENDED)
- No space between the tag name and the colon
- No space between the colon and the value
- CSV values use commas with no spaces: `@architect-uses:PatternA,PatternB`

### TypeScript JSDoc Syntax

In TypeScript files, tags appear within JSDoc blocks with a space separator for values:

```
@architect-<tag-name> <value>
```

- Tags appear inside `/** */` comment blocks
- One tag per line, each prefixed with `*`
- Space separator instead of colon (JSDoc convention)
- CSV values use commas with optional spaces: `@architect-uses PatternA, PatternB`

## Format Types

Each tag has a defined format type that determines how its value is parsed:

| Format Type    | Description                        | Syntax (Gherkin)  | Syntax (JSDoc)    | Example                          |
| -------------- | ---------------------------------- | ----------------- | ----------------- | -------------------------------- |
| `value`        | Free-form string                   | `@tag:MyValue`    | `@tag MyValue`    | `@architect-pattern:UserService` |
| `enum`         | One of a fixed set of values       | `@tag:active`     | `@tag active`     | `@architect-status:active`       |
| `csv`          | Comma-separated list of values     | `@tag:A,B,C`      | `@tag A, B, C`    | `@architect-uses:Auth,Tokens`    |
| `number`       | Numeric value                      | `@tag:3`          | `@tag 3`          | `@architect-phase:2`             |
| `quoted-value` | String value (may contain spaces)  | `@tag:"My Value"` | `@tag "My Value"` | (rare, used internally)          |
| `flag`         | Boolean presence (no value needed) | `@tag`            | `@tag`            | `@architect` (the gate tag)      |

**Validation rules:**

- `enum` values MUST match one of the allowed values defined in the tag registry (§04)
- `csv` values MUST contain at least one item
- `number` values MUST be valid integers or values matching effort format (e.g., `3d`, `1w`)
- `value` strings SHOULD NOT contain commas (use `csv` format for lists)

## Tag Ordering

Tags in the header block SHOULD follow this ordering convention. While parsers MUST accept
tags in any order, consistent ordering improves readability and review.

**Recommended order for feature specs:**

```gherkin
@architect                              # 1. Gate tag (always first)
@architect-pattern:PatternName          # 2. Identity
@architect-status:roadmap               # 3. Delivery status
@architect-product-area:Process         # 4. Product area
@architect-uses:Dep1,Dep2               # 5. Dependencies
@architect-see-also:Related1            # 6. Cross-references
@architect-bounded-context:identity     # 7. Bounded context
@architect-arch-layer:domain            # 8. Architecture layer
@architect-role:service                 # 9. Canonical role
@architect-level:task                   # 10. Hierarchy level
@architect-parent:UserManagementEpic    # 11. Hierarchy parent
```

> _Informative:_ Several planning-oriented tags from earlier drafts (`@architect-phase`,
> `@architect-effort`, `@architect-priority`, `@architect-release`,
> `@architect-business-value`) are not part of the v0.2.0 standard authored tag set. See
> §04 for the canonical list. Projects MAY add such tags as custom extensions but they are
> not recognized by the reference implementation's standard taxonomy.

**Recommended order for ADRs:**

```gherkin
@architect                              # 1. Gate tag
@architect-adr:004                      # 2. ADR number
@architect-adr-status:accepted          # 3. ADR status
@architect-adr-category:architecture    # 4. ADR category
@architect-adr-layer:foundation         # 5. ADR layer (optional)
@architect-adr-theme:persistence        # 6. ADR theme (optional)
@architect-pattern:ADR004Name           # 7. Pattern name
@architect-status:completed             # 8. Delivery status
@architect-product-area:Process         # 9. Product area
```

## Required vs. Optional Tags by Artifact Type

### Level 1 (Minimal) — All Artifact Types

| Tag                  | Required | Notes                    |
| -------------------- | -------- | ------------------------ |
| `@architect`         | MUST     | Gate tag                 |
| `@architect-pattern` | MUST     | Except release manifests |
| `@architect-status`  | MUST     | FSM state                |

### Candidate Specs (Pre-Acceptance)

Candidate specs (`@architect-status:candidate`) have reduced tag requirements:

| Tag                          | Required | Notes                             |
| ---------------------------- | -------- | --------------------------------- |
| `@architect`                 | MUST     | Gate tag                          |
| `@architect-pattern`         | MUST     | PascalCase pattern name           |
| `@architect-status`          | MUST     | Must be `candidate`               |
| `@architect-product-area`    | SHOULD   | Product area                      |
| `@architect-bounded-context` | SHOULD   | Architecture grouping             |
| All other tags               | MAY      | Added during acceptance promotion |

### Level 2 (Standard) — Accepted Feature Specs

Accepted specs (`@architect-status:roadmap` or later) require the full tag set:

| Tag                          | Required | Notes                              |
| ---------------------------- | -------- | ---------------------------------- |
| `@architect-product-area`    | MUST     | Product area                       |
| `@architect-bounded-context` | MUST     | Architecture grouping              |
| `@architect-arch-layer`      | MUST     | Architecture layer                 |
| `@architect-role`            | MUST     | Canonical role                     |
| `@architect-uses`            | SHOULD   | If dependencies exist              |
| `@architect-see-also`        | SHOULD   | If related patterns exist          |
| `@architect-level`           | SHOULD   | Hierarchy level (when meaningful)  |
| `@architect-parent`          | SHOULD   | Hierarchy parent (when applicable) |

### Level 2 (Standard) — ADRs

| Tag                       | Required | Notes             |
| ------------------------- | -------- | ----------------- |
| `@architect-adr`          | MUST     | ADR number        |
| `@architect-adr-status`   | MUST     | Decision status   |
| `@architect-adr-category` | MUST     | Decision category |
| `@architect-product-area` | MUST     | Product area      |

### Level 2 (Standard) — Design Stubs

| Tag                          | Required | Notes                      |
| ---------------------------- | -------- | -------------------------- |
| `@architect-implements`      | MUST     | Feature spec this realizes |
| `@architect-target`          | MUST     | Destination file path      |
| `@architect-product-area`    | SHOULD   | Product area               |
| `@architect-bounded-context` | SHOULD   | Architecture grouping      |
| `@architect-arch-layer`      | SHOULD   | Architecture layer         |
| `@architect-uses`            | SHOULD   | Patterns this stub uses    |

### Level 2 (Standard) — Release Manifests

| Tag                       | Required | Notes        |
| ------------------------- | -------- | ------------ |
| `@architect-product-area` | MUST     | Product area |

> _Informative:_ Earlier drafts of this spec listed `@architect-release` as the version
> identifier on release manifests. That tag is not part of the v0.2.0 canonical taxonomy;
> release manifests today use the file name (`vNEXT.feature`, `vX.Y.Z.feature`) as the
> version identifier and may carry only the core gate + status + product-area tags.

> _Informative:_ Release manifests do not require `@architect-pattern` because
> they represent temporal groupings, not architectural patterns.

## Tag Validation Rules

Conforming implementations (Level 2+) MUST validate:

1. **Gate tag presence** — Every processed file MUST contain the gate tag
2. **Required tags** — All required tags for the artifact type MUST be present
3. **Enum values** — Enum tag values MUST match the project's tag taxonomy
4. **Pattern name uniqueness** — Each `@architect-pattern` value MUST be unique across the project
5. **Dependency resolution** — `@architect-uses` values SHOULD reference existing pattern names
6. **Status validity** — `@architect-status` values MUST be valid FSM states (§09)
7. **Tag prefix consistency** — All tags in a file MUST use the same configured prefix

## Tag Taxonomy

Each project maintains a **tag taxonomy** — the project-specific registry of valid tag
values. The taxonomy defines:

- Which category tags exist and their priority ordering
- Which enum values are valid for each enum tag
- Which product areas, bounded contexts, and architecture layers are recognized
- Any project-specific custom tags

A project's tag taxonomy is conveyed by its `architect.config.ts` (§11) — specifically
the `roles`, `productAreas`, and any custom-tag entries — and SHOULD be queryable via
the project's data API (`architect:query taxonomy` in the reference implementation).
Projects MAY additionally maintain an informative `architect/tag-taxonomy.md` document,
but it is not required and the configuration is the source of truth. The tag taxonomy
separates the **tag system** (how tags work — this document) from the **tag registry**
(which tags exist — §04 for the standard set, plus project-specific additions).
