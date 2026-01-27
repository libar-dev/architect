# ✅ Timeline Codec

**Purpose:** Detailed documentation for the Timeline Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into RenderableDocuments for timeline outputs:
- ROADMAP.md (phase breakdown with progress)
- COMPLETED-MILESTONES.md (historical completed phases)

### Factory Pattern

Use factory functions for custom options:
```typescript
const codec = createRoadmapCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
