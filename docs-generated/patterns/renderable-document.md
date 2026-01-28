# ✅ Renderable Document

**Purpose:** Detailed documentation for the Renderable Document pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Universal intermediate format for all generated documentation.
Document codecs transform MasterDataset into this format,
then the universal renderer converts it to markdown.

### When to Use

- When building documents using block builder functions
- When validating RenderableDocument structures
- When creating custom codecs that produce document output

### Block Vocabulary (9 types)

- Structural: heading, paragraph, separator
- Content: table, list, code, mermaid
- Progressive: collapsible, link-out

---

[← Back to Pattern Registry](../PATTERNS.md)
