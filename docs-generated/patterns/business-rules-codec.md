# 📋 Business Rules Codec

**Purpose:** Detailed documentation for the Business Rules Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Core |

## Description

Transforms MasterDataset into a RenderableDocument for business rules output.
Generates BUSINESS-RULES.md organized by product area, phase, and feature.

### Purpose

Enable stakeholders to understand domain constraints without reading
implementation details or full feature files.

### Information Architecture

```
Product Area (Platform, DeliveryProcess)
  └── Phase (21, 15, etc.) or Release (v0.1.0 for DeliveryProcess)
       └── Feature (pattern name with description)
            └── Rules (inline with Invariant + Rationale)
```

### Progressive Disclosure

- **summary**: Statistics only (compact reference)
- **standard**: Above + all features with rules inline
- **detailed**: Full content including code examples and verification links

### Factory Pattern

Use `createBusinessRulesCodec(options)` to create a configured codec:
```typescript
const codec = createBusinessRulesCodec({ detailLevel: "summary" });
const doc = codec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
