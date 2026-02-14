# 🚧 Composite Codec

**Purpose:** Detailed documentation for the Composite Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Assembles reference documents from multiple codec outputs by concatenating
RenderableDocument sections. Enables building documents composed from any
combination of existing codecs.

### When to Use

- When building reference docs from multiple codec outputs
- When composing session briefs from overview + current work + remaining work
- When referenceDocConfigs need content from arbitrary codecs

### Factory Pattern

Use the factory function with child codecs and options:
```typescript
const codec = createCompositeCodec(
  [OverviewCodec, CurrentWorkCodec, RemainingWorkCodec],
  { title: 'Session Brief' }
);
const doc = codec.decode(dataset);
```

Or use `composeDocuments` directly at the document level:
```typescript
const doc = composeDocuments([docA, docB], { title: 'Combined' });
```

---

[← Back to Pattern Registry](../PATTERNS.md)
