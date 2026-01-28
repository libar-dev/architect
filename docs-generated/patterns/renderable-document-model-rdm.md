# ✅ Renderable Document Model(RDM)

**Purpose:** Detailed documentation for the Renderable Document Model(RDM) pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Unified document generation using codecs and a universal renderer.

Architecture:
```
MasterDataset → Document Codecs → RenderableDocument → Universal Renderer → Markdown
```

Key Exports:
- Schema: `RenderableDocument`, `SectionBlock`, block builders
- Codecs: `PatternsDocumentCodec`, `TimelineCodec`, etc.
- Renderer: `renderToMarkdown`, `renderDocumentWithFiles`
- Generation: `generateDocument`, `generateAllDocuments`

---

[← Back to Pattern Registry](../PATTERNS.md)
