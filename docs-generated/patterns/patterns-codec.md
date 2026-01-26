# ✅ Patterns Codec

**Purpose:** Detailed documentation for the Patterns Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Patterns Document Codec

Transforms MasterDataset into a RenderableDocument for pattern registry output.
Generates PATTERNS.md and category detail files (patterns/*.md).

### Factory Pattern

Use `createPatternsCodec(options)` to create a configured codec:
```typescript
const codec = createPatternsCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

Or use the default export for standard behavior:
```typescript
const doc = PatternsDocumentCodec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
