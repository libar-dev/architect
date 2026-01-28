# ✅ Adr Document Codec

**Purpose:** Detailed documentation for the Adr Document Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into RenderableDocument for Architecture Decision Records.
Extracts ADRs from patterns with `@libar-docs-adr` tags.

### When to Use

- When generating Architecture Decision Record documentation
- When extracting ADRs from feature files with structured annotations
- When building custom ADR reports with configurable content sections

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
