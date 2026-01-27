# ✅ Architecture Codec

**Purpose:** Detailed documentation for the Architecture Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into a RenderableDocument containing
architecture diagrams (Mermaid) generated from source annotations.

### Factory Pattern

Use `createArchitectureCodec(options)` to create a configured codec:
```typescript
const codec = createArchitectureCodec({ diagramType: "component" });
const doc = codec.decode(dataset);
```

Or use the default export for standard behavior:
```typescript
const doc = ArchitectureDocumentCodec.decode(dataset);
```

### Supported Diagram Types

- **component**: System overview with bounded context subgraphs
- **layered**: Components organized by architectural layer

---

[← Back to Pattern Registry](../PATTERNS.md)
