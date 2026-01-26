# 🚧 Derive Process State

**Purpose:** Detailed documentation for the Derive Process State pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Lint |

## Description

:GherkinScanner,FSMValidator


## DeriveProcessState - Extract Process State from File Annotations

Derives process state from @libar-docs-* annotations in files.
State is computed on-demand, not stored separately.

### Design Principles

- **Derived, Not Stored**: State comes from file annotations
- **Reuses Scanner**: Builds on existing gherkin-scanner infrastructure
- **Pure Functions**: No side effects, testable

### When to Use

- When validating changes against process rules
- When computing protection levels for files
- When determining session scope

---

[← Back to Pattern Registry](../PATTERNS.md)
