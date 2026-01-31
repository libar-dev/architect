# ✅ Taxonomy Codec

**Purpose:** Detailed documentation for the Taxonomy Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms MasterDataset into a RenderableDocument for taxonomy reference output.
Generates TAXONOMY.md and detail files (taxonomy/*.md).

### When to Use

- When generating the taxonomy reference documentation (TAXONOMY.md)
- When creating tag reference files for progressive disclosure
- When building taxonomy overview reports

### Factory Pattern

Use `createTaxonomyCodec(options)` to create a configured codec:
```typescript
const codec = createTaxonomyCodec({ generateDetailFiles: false });
const doc = codec.decode(dataset);
```

Or use the default export for standard behavior:
```typescript
const doc = TaxonomyDocumentCodec.decode(dataset);
```

---

[← Back to Pattern Registry](../PATTERNS.md)
