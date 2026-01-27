# ✅ Session Codec

**Purpose:** Detailed documentation for the Session Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into RenderableDocuments for session/planning outputs:
- SESSION-CONTEXT.md (current session context)
- REMAINING-WORK.md (incomplete work aggregation)

### Factory Pattern

Use factory functions for custom options:
```typescript
const codec = createSessionContextCodec({ includeRelatedPatterns: true });
const remainingCodec = createRemainingWorkCodec({ sortBy: "priority" });
```

---

[← Back to Pattern Registry](../PATTERNS.md)
