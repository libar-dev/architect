# ✅ Document Codecs

**Purpose:** Detailed documentation for the Document Codecs pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Barrel export for all document codecs.
Each codec transforms MasterDataset → RenderableDocument.

### When to Use

- When importing codecs for document generation
- When accessing codec factory functions with custom options
- When using shared helpers for rich content rendering

### Factory Pattern

Each codec exports both:
- Default codec with standard options: `PatternsDocumentCodec`
- Factory function for custom options: `createPatternsCodec(options)`

---

[← Back to Pattern Registry](../PATTERNS.md)
