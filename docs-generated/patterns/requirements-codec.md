# ✅ Requirements Codec

**Purpose:** Detailed documentation for the Requirements Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Requirements Document Codec

Transforms MasterDataset into RenderableDocument for PRD/requirements output.
Generates PRODUCT-REQUIREMENTS.md and detail files (requirements/*.md).

### Factory Pattern

Use `createRequirementsCodec(options)` for custom options:
```typescript
const codec = createRequirementsCodec({ groupBy: "user-role" });
const doc = codec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
