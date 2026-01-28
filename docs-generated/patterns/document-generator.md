# ✅ Document Generator

**Purpose:** Detailed documentation for the Document Generator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Simplified document generation using codecs.
Replaces the complex BuiltInGenerator + SectionRegistry pattern.

### When to Use

- When generating specific document types from MasterDataset
- When needing high-level generation API without direct codec usage
- When building custom documentation workflows

Flow: MasterDataset → Codec → RenderableDocument → Renderer → Markdown

---

[← Back to Pattern Registry](../PATTERNS.md)
