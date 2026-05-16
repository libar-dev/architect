# 03 — Tag System

> **Architect Spec v0.1.0** — Tag mechanics, format types, ordering, and validation rules.

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
- CSV values use commas with no spaces: `@architect-depends-on:PatternA,PatternB`

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

| Format Type    | Description                        | Syntax (Gherkin)  | Syntax (JSDoc)    | Example                             |
| -------------- | ---------------------------------- | ----------------- | ----------------- | ----------------------------------- |
| `value`        | Free-form string                   | `@tag:MyValue`    | `@tag MyValue`    | `@architect-pattern:UserService`    |
| `enum`         | One of a fixed set of values       | `@tag:active`     | `@tag active`     | `@architect-status:active`          |
| `csv`          | Comma-separated list of values     | `@tag:A,B,C`      | `@tag A, B, C`    | `@architect-depends-on:Auth,Tokens` |
| `number`       | Numeric value                      | `@tag:3`          | `@tag 3`          | `@architect-phase:2`                |
| `quoted-value` | String value (may contain spaces)  | `@tag:"My Value"` | `@tag "My Value"` | (rare, used internally)             |
| `flag`         | Boolean presence (no value needed) | `@tag`            | `@tag`            | `@architect` (the gate tag)         |

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
@architect-phase:2                      # 4. Phase
@architect-product-area:Desktop         # 5. Product area
@architect-effort:5d                    # 6. Effort estimate
@architect-priority:high                # 7. Priority
@architect-depends-on:Dep1,Dep2         # 8. Dependencies
@architect-see-also:Related1            # 9. Cross-references
@architect-business-value:description   # 10. Business value
@architect-bounded-context:identity     # 11. Architecture context
@architect-arch-layer:domain            # 12. Architecture layer
@architect-release:vNEXT                # 13. Release target
```

**Recommended order for ADRs:**

```gherkin
@architect                              # 1. Gate tag
@architect-adr:004                      # 2. ADR number
@architect-adr-status:accepted          # 3. ADR status
@architect-adr-category:architecture    # 4. ADR category
@architect-pattern:ADR004Name           # 5. Pattern name
@architect-status:completed             # 6. Delivery status
@architect-product-area:Process         # 7. Product area
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

| Tag                          | Required | Notes                     |
| ---------------------------- | -------- | ------------------------- |
| `@architect-phase`           | MUST     | Roadmap phase number      |
| `@architect-product-area`    | MUST     | Product area              |
| `@architect-effort`          | MUST     | Effort estimate           |
| `@architect-priority`        | MUST     | Priority level            |
| `@architect-bounded-context` | MUST     | Architecture grouping     |
| `@architect-arch-layer`      | MUST     | Architecture layer        |
| `@architect-release`         | MUST     | Target release            |
| `@architect-depends-on`      | SHOULD   | If dependencies exist     |
| `@architect-see-also`        | SHOULD   | If related patterns exist |
| `@architect-business-value`  | SHOULD   | Business value slug       |

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
| `@architect-bounded-context` | SHOULD   | Architecture grouping      |
| `@architect-arch-layer`      | SHOULD   | Architecture layer         |
| `@architect-uses`            | SHOULD   | Patterns this stub uses    |

### Level 2 (Standard) — Release Manifests

| Tag                       | Required | Notes              |
| ------------------------- | -------- | ------------------ |
| `@architect-release`      | MUST     | Version identifier |
| `@architect-product-area` | MUST     | Product area       |

> _Informative:_ Release manifests do not require `@architect-pattern` because
> they represent temporal groupings, not architectural patterns.

## Tag Validation Rules

Conforming implementations (Level 2+) MUST validate:

1. **Gate tag presence** — Every processed file MUST contain the gate tag
2. **Required tags** — All required tags for the artifact type MUST be present
3. **Enum values** — Enum tag values MUST match the project's tag taxonomy
4. **Pattern name uniqueness** — Each `@architect-pattern` value MUST be unique across the project
5. **Dependency resolution** — `@architect-depends-on` values SHOULD reference existing pattern names
6. **Status validity** — `@architect-status` values MUST be valid FSM states (§09)
7. **Tag prefix consistency** — All tags in a file MUST use the same configured prefix

## Tag Taxonomy

Each project maintains a **tag taxonomy** — the project-specific registry of valid tag
values. The taxonomy defines:

- Which category tags exist and their priority ordering
- Which enum values are valid for each enum tag
- Which product areas, bounded contexts, and architecture layers are recognized
- Any project-specific custom tags

The tag taxonomy is documented in `architect/tag-taxonomy.md` and enforced by the
project configuration (§11). The tag taxonomy separates the **tag system** (how tags
work — this document) from the **tag registry** (which tags exist — §04 for the
standard set, plus project-specific additions).
