#  Document Codecs

**Purpose:** Detailed documentation for the Document Codecs pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Core |

## Description

Barrel export for all document codecs.
Each codec transforms MasterDataset → RenderableDocument.

### Factory Pattern

Each codec exports both:
- Default codec with standard options: `PatternsDocumentCodec`
- Factory function for custom options: `createPatternsCodec(options)`

---

[← Back to Pattern Registry](../PATTERNS.md)
