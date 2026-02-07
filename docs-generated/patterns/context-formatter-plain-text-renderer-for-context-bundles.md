# 📋 ContextFormatter — Plain Text Renderer for Context Bundles

**Purpose:** Detailed documentation for the ContextFormatter — Plain Text Renderer for Context Bundles pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

First plain-text formatter in the codebase. All other rendering goes
through the Codec/RenderableDocument/UniversalRenderer markdown pipeline.
Context bundles are rendered as compact structured text with === section
markers for easy AI parsing (see ADR-008).

### Output Format (DS-C-4)

Section markers: `=== SECTION ===` (visually distinct, regex-parseable,
no collision with markdown # or YAML ---)

Status in brackets: `[completed]`, `[roadmap]`, `[active]`
Deliverable checkboxes: `[x]` (done), `[ ]` (pending)
Dep-tree arrows: `->` (compact, no Unicode box-drawing)
Focal marker: `<- YOU ARE HERE`

### Reusable Helpers

May reuse from src/renderable/codecs/helpers.ts:
- extractFirstSentence() for metadata summary
- truncateText() for long descriptions

Target: src/api/context-formatter.ts
See: DataAPIContextAssembly spec, ADR-008 (text output path)
Since: DS-C

---

[← Back to Pattern Registry](../PATTERNS.md)
