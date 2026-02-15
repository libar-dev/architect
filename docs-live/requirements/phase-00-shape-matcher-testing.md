# ✅ Shape Matcher Testing

**Purpose:** Detailed requirements for the Shape Matcher Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Matches file paths against glob patterns for TypeScript shape extraction.
Uses in-memory string matching (no filesystem access) per AD-6.

## Acceptance Criteria

**Exact path matches identical path**

- When matching path "src/generators/types.ts" against pattern "src/generators/types.ts"
- Then the match result is true

**Exact path does not match different path**

- When matching path "src/generators/types.ts" against pattern "src/generators/other.ts"
- Then the match result is false

**Single glob matches file in target directory**

- When matching path "src/lint/rules.ts" against pattern "src/lint/\*.ts"
- Then the match result is true

**Single glob does not match nested subdirectory**

- When matching path "src/lint/sub/rules.ts" against pattern "src/lint/\*.ts"
- Then the match result is false

**Single glob does not match wrong extension**

- When matching path "src/lint/rules.js" against pattern "src/lint/\*.ts"
- Then the match result is false

**Recursive glob matches file at target depth**

- When matching path "src/generators/pipeline/transform.ts" against pattern "src/generators/\*_/_.ts"
- Then the match result is true

**Recursive glob matches file at deeper depth**

- When matching path "src/generators/pipeline/sub/deep.ts" against pattern "src/\*_/_.ts"
- Then the match result is true

**Recursive glob matches file at top level**

- When matching path "src/index.ts" against pattern "src/\*_/_.ts"
- Then the match result is true

**Recursive glob does not match wrong prefix**

- When matching path "other/generators/types.ts" against pattern "src/\*_/_.ts"
- Then the match result is false

**Shapes are extracted from matching patterns**

- Given a MasterDataset with patterns:
- When extracting shapes with source pattern "src/lint/\*.ts"
- Then 2 shapes are returned
- And the shape names are "LintRule" and "LintConfig"

| filePath           | shapeName  | shapeKind |
| ------------------ | ---------- | --------- |
| src/lint/rules.ts  | LintRule   | interface |
| src/lint/config.ts | LintConfig | type      |

**Duplicate shape names are deduplicated**

- Given a MasterDataset with patterns:
- When extracting shapes with source pattern "src/lint/\*.ts"
- Then 1 shapes are returned

| filePath           | shapeName | shapeKind |
| ------------------ | --------- | --------- |
| src/lint/rules.ts  | LintRule  | interface |
| src/lint/config.ts | LintRule  | type      |

**No shapes returned when glob does not match**

- Given a MasterDataset with patterns:
- When extracting shapes with source pattern "src/lint/\*.ts"
- Then 0 shapes are returned

| filePath               | shapeName | shapeKind |
| ---------------------- | --------- | --------- |
| src/other/unrelated.ts | Unrelated | interface |

## Business Rules

**Exact paths match without wildcards**

**Invariant:** A pattern without glob characters must match only the exact file path, character for character.
**Verified by:** Exact path matches identical path, Exact path does not match different path

_Verified by: Exact path matches identical path, Exact path does not match different path_

**Single-level globs match one directory level**

**Invariant:** A single `*` glob must match files only within the specified directory, never crossing directory boundaries.
**Verified by:** Single glob matches file in target directory, Single glob does not match nested subdirectory, Single glob does not match wrong extension

_Verified by: Single glob matches file in target directory, Single glob does not match nested subdirectory, Single glob does not match wrong extension_

**Recursive globs match any depth**

**Invariant:** A `**` glob must match files at any nesting depth below the specified prefix, while still respecting extension and prefix constraints.
**Verified by:** Recursive glob matches file at target depth, Recursive glob matches file at deeper depth, Recursive glob matches file at top level, Recursive glob does not match wrong prefix

_Verified by: Recursive glob matches file at target depth, Recursive glob matches file at deeper depth, Recursive glob matches file at top level, Recursive glob does not match wrong prefix_

**Dataset shape extraction deduplicates by name**

**Invariant:** When multiple patterns match a source glob, the returned shapes must be deduplicated by name so each shape appears at most once.
**Rationale:** Duplicate shape names in generated documentation confuse readers and inflate type registries.
**Verified by:** Shapes are extracted from matching patterns, Duplicate shape names are deduplicated, No shapes returned when glob does not match

_Verified by: Shapes are extracted from matching patterns, Duplicate shape names are deduplicated, No shapes returned when glob does not match_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
