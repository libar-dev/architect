# ✅ Patterns Codec

**Purpose:** Detailed documentation for the Patterns Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into a RenderableDocument for pattern registry output.
Generates PATTERNS.md and category detail files (patterns/*.md).

### When to Use

- When generating the pattern registry documentation (PATTERNS.md)
- When creating category-specific pattern detail files
- When building pattern overview reports with status tracking

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

## Implementations

Files that implement this pattern:

- [`patterns-codec.feature`](../../tests/features/behavior/patterns-codec.feature) - The PatternsDocumentCodec transforms MasterDataset into a RenderableDocument

---

[← Back to Pattern Registry](../PATTERNS.md)
