# ✅ Codec Based Generator Testing

**Purpose:** Detailed requirements for the Codec Based Generator Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Tests the CodecBasedGenerator which adapts the RenderableDocument Model (RDM)
codec system to the DocumentGenerator interface. This enables codec-based
document generation to work seamlessly with the existing orchestrator.

## Acceptance Criteria

**Generator delegates to codec**

- Given a CodecBasedGenerator wrapping "patterns" document type
- And a context with MasterDataset containing patterns
- When the generator generate method is called
- Then the output should contain a file with path "PATTERNS.md"
- And the output should have no errors

**Missing MasterDataset returns error**

- Given a CodecBasedGenerator for "patterns" document type
- And a context WITHOUT MasterDataset
- When the generator generate method is called
- Then the output should have no files
- And the output should contain an error mentioning "MasterDataset"

**Codec options are passed through**

- Given a CodecBasedGenerator for "pr-changes" document type
- And a context with MasterDataset
- And codecOptions with changedFiles filter:
- When the generator generate method is called
- Then the output should contain a file with path "working/PR-CHANGES.md"

| file              |
| ----------------- |
| src/core/types.ts |
| src/api/index.ts  |

## Business Rules

**CodecBasedGenerator adapts codecs to generator interface**

**Invariant:** CodecBasedGenerator delegates document generation to the underlying codec and surfaces codec errors through the generator interface.
**Rationale:** The adapter pattern enables codec-based rendering to integrate with the existing orchestrator without modifying either side.
**Verified by:** Generator delegates to codec, Missing MasterDataset returns error, Codec options are passed through

_Verified by: Generator delegates to codec, Missing MasterDataset returns error, Codec options are passed through_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
