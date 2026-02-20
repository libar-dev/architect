# ✅ Lint Rules

**Purpose:** Detailed documentation for the Lint Rules pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Lint |

## Description

Defines lint rules that check @libar-docs-* directives for completeness
and quality. Rules include: missing-pattern-name, missing-status,
missing-when-to-use, tautological-description, and missing-relationships.

### When to Use

- Use `defaultRules` for standard quality checks
- Use `filterRulesBySeverity()` to customize which rules apply
- Use individual rules for targeted validation

## Implementations

Files that implement this pattern:

- [`lint-rules-advanced.feature`](../../tests/features/lint/lint-rules-advanced.feature) - Complex lint rule logic and collection-level behavior.
- [`lint-rules-individual.feature`](../../tests/features/lint/lint-rules-individual.feature) - Individual lint rules that check parsed directives for completeness.

---

[← Back to Pattern Registry](../PATTERNS.md)
