# 🚧 Reference Document Codec

**Purpose:** Detailed documentation for the Reference Document Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Pattern |

## Description

A single codec factory that creates reference document codecs from
configuration objects. Convention content is sourced from
decision records tagged with @libar-docs-convention.

### When to Use

- When generating reference documentation from convention-tagged decisions
- When creating both detailed (docs/) and summary (_claude-md/) outputs

### Factory Pattern

```typescript
const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
const doc = codec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
