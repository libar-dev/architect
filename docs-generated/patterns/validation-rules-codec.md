# ✅ Validation Rules Codec

**Purpose:** Detailed documentation for the Validation Rules Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into a RenderableDocument for Process Guard validation
rules reference. Generates VALIDATION-RULES.md and detail files (validation/*.md).

### When to Use

- When generating validation rules reference documentation
- When creating FSM state transition diagrams
- When building protection level reference files

### Factory Pattern

Use `createValidationRulesCodec(options)` to create a configured codec:
```typescript
const codec = createValidationRulesCodec({ includeFSMDiagram: false });
const doc = codec.decode(dataset);
```

Or use the default export for standard behavior:
```typescript
const doc = ValidationRulesCodec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
