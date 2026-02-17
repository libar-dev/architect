# ✅ Dual Source Extractor

**Purpose:** Detailed documentation for the Dual Source Extractor pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Extractor |

## Description

Extracts pattern metadata from both TypeScript code stubs (@libar-docs-*)
and Gherkin feature files (@libar-docs-*), validates consistency,
and composes unified pattern data for documentation generation.

### When to Use

- When implementing USDP Pattern 2 (Standard) or higher
- When you have both code stubs AND timeline features
- When generating artifacts that need both timeless and temporal data
- When validating cross-source consistency (pattern name, phase alignment)

### Key Concepts

- **Code Source**: @libar-docs-* tags define timeless pattern graph
- **Feature Source**: @libar-docs-* tags add temporal process metadata
- **Cross-Validation**: Pattern name + phase must match across sources
- **Deliverables**: Parsed from Gherkin Background tables in features

## Implementations

Files that implement this pattern:

- [`dual-source-extraction.feature`](../../tests/features/extractor/dual-source-extraction.feature) - Extracts and combines pattern metadata from both TypeScript code stubs

---

[← Back to Pattern Registry](../PATTERNS.md)
