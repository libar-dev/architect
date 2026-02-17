# ✅ Universal Renderer

**Purpose:** Detailed documentation for the Universal Renderer pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Converts RenderableDocument to output strings. Two renderers:
- `renderToMarkdown` — Full markdown for human documentation
- `renderToClaudeContext` — Token-efficient format for LLM consumption

Both are "dumb printers" — they know nothing about patterns, phases,
or domain concepts. All logic lives in the codecs; these just render blocks.

### When to Use

- `renderToMarkdown` for human-readable docs (`docs/` output)
- `renderToClaudeContext` for AI context (`_claude-md/` output)
- `renderDocumentWithFiles` for multi-file output with detail files

---

[← Back to Pattern Registry](../PATTERNS.md)
