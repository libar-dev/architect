# ✅ Lint Engine

**Purpose:** Detailed documentation for the Lint Engine pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Lint |

## Description

Orchestrates lint rule execution against parsed directives.
Takes scanned @libar-docs-* directives and runs quality rules against them,
collecting violations and computing summary statistics for CI enforcement.

### When to Use

- Use when validating annotation quality across multiple files
- Use when building CI pipelines for documentation standards
- Use for formatting lint results (pretty or JSON output)

## Implementations

Files that implement this pattern:

- [`lint-engine.feature`](../../tests/features/lint/lint-engine.feature) - The lint engine orchestrates rule execution, aggregates violations,

---

[← Back to Pattern Registry](../PATTERNS.md)
