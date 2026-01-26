# ✅ Adr Document Codec

**Purpose:** Detailed documentation for the Adr Document Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## ADR Document Codec

Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
Extracts ADRs from patterns with `@libar-docs-adr` tags.

### Factory Pattern

Use `createAdrCodec(options)` for custom options:
```typescript
const codec = createAdrCodec({
  groupBy: 'phase',
  includeContext: true,
  includeDecision: true,
  includeConsequences: false,
});
const doc = codec.decode(dataset);
```

### ADR Content

ADR content is parsed from feature file descriptions:
- **Context**: Problem background and constraints
- **Decision**: The chosen solution
- **Consequences**: Positive and negative outcomes

---

[← Back to Pattern Registry](../PATTERNS.md)
