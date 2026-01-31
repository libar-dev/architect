# ✅ Shape Extractor

**Purpose:** Detailed documentation for the Shape Extractor pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Pattern |
| Phase | 26 |

## Description

Extracts TypeScript type definitions (interfaces, type aliases, enums,
function signatures) from source files for documentation generation.

### When to Use

- When processing @libar-docs-extract-shapes tags during extraction
- When generating documentation that needs actual type definitions
- When eliminating duplication between JSDoc examples and code

### Key Concepts

- **AST-based extraction**: Uses typescript-estree for accurate parsing
- **Preserves formatting**: Extracts exact source text, not regenerated
- **Includes JSDoc**: Type-level JSDoc comments are preserved
- **Order from tag**: Shapes appear in tag-specified order, not source order

---

[← Back to Pattern Registry](../PATTERNS.md)
