# ✅ Warning Collector

**Purpose:** Detailed documentation for the Warning Collector pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |
| Phase | 28 |

## Description

Provides a unified system for capturing, categorizing, and reporting
non-fatal issues during document generation. Replaces scattered console.warn
calls with structured warning handling that integrates with the Result pattern.

### When to Use

- When generating documentation from source mappings
- When extracting content from TypeScript or Gherkin files
- When deduplicating or assembling content sections

### Key Concepts

- **Warning Categories**: validation, extraction, deduplication, file-access, format
- **Source Attribution**: Each warning includes source file and optional line number
- **Aggregation**: Warnings collected across pipeline stages, maintaining insertion order
- **Formatting**: Console, JSON, and markdown output formats

## Implementations

Files that implement this pattern:

- [`warning-collector.feature`](../../tests/features/doc-generation/warning-collector.feature) - The warning collector provides a unified system for capturing, categorizing,

---

[← Back to Pattern Registry](../PATTERNS.md)
