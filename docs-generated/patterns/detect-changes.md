# 🚧 Detect Changes

**Purpose:** Detailed documentation for the Detect Changes pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Lint |

## Description

Detects changes from git diff including:
- Modified, added, deleted files
- Status transitions (@libar-docs-status changes)
- Deliverable changes in Background tables

### Design Principles

- **Parse Git Output**: Uses `git diff --name-status` and `git diff`
- **Status Detection**: Regex patterns for @libar-docs-status changes
- **Deliverable Detection**: Parses DataTable changes

Note: Taxonomy modification detection was removed when taxonomy
moved from JSON to TypeScript (src/taxonomy/). TypeScript changes
require recompilation, making runtime detection unnecessary.

### When to Use

- When validating staged changes (pre-commit)
- When validating all changes against main branch
- When detecting scope creep (new deliverables)

## Implementations

Files that implement this pattern:

- [`detect-changes.feature`](../../tests/features/validation/detect-changes.feature) - Tests for the detectDeliverableChanges function that parses git diff output.
- [`status-transition-detection.feature`](../../tests/features/validation/status-transition-detection.feature) - Tests for the detectStatusTransitions function that parses git diff output.

---

[← Back to Pattern Registry](../PATTERNS.md)
