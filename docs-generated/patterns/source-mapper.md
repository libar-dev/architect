# ✅ Source Mapper

**Purpose:** Detailed documentation for the Source Mapper pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Aggregates content from multiple source files based on source mapping tables
parsed from decision documents. Dispatches extraction to appropriate handlers
based on extraction method (shape extraction, rule blocks, JSDoc, etc.).

### When to Use

- When generating documentation from a decision document's source mapping
- When aggregating content from TypeScript, Gherkin, and decision sources
- When building docs with progressive disclosure (compact vs detailed)

### Key Concepts

- **Source Mapping Table**: Defines sections, source files, and extraction methods
- **Self-Reference**: `THIS DECISION` markers extract from current document
- **Graceful Degradation**: Missing files produce warnings, not failures
- **Order Preservation**: Aggregated content maintains mapping table order

## Dependencies

- Depends on: DecisionDocCodec
- Depends on: ShapeExtractor
- Depends on: GherkinASTParser

## Implementations

Files that implement this pattern:

- [`source-mapper.feature`](../../tests/features/doc-generation/source-mapper.feature) - The Source Mapper aggregates content from multiple source files based on

---

[← Back to Pattern Registry](../PATTERNS.md)
