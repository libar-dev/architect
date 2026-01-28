# ✅ Pr Changes Codec

**Purpose:** Detailed documentation for the Pr Changes Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into RenderableDocument for PR-scoped output.
Filters patterns by changed files and/or release version tags.

### When to Use

- When generating PR summaries filtered by changed files
- When creating release-scoped documentation for PR reviews
- When building CI/CD outputs focused on PR scope

### Factory Pattern

Use `createPrChangesCodec(options)` for custom options:
```typescript
const codec = createPrChangesCodec({
  changedFiles: ['src/commands/order.ts'],
  releaseFilter: 'v1.0.0',
});
const doc = codec.decode(dataset);
```

### Scope Filtering

PR Changes codec filters patterns by:
1. Changed files (matches against pattern.filePath)
2. Release version (matches against deliverable.release tags)

If both are specified, patterns must match at least one criterion.

---

[← Back to Pattern Registry](../PATTERNS.md)
