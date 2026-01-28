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

### When to Use

- When generating roadmap documentation by phase
- When tracking completed milestones and historical progress
- When building timeline-based project views

### Factory Pattern

Use factory functions for custom options:
```typescript
const codec = createRoadmapCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
