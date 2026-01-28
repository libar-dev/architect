# ✅ Universal Renderer

**Purpose:** Detailed documentation for the Universal Renderer pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Converts RenderableDocument to Markdown. This is the "dumb printer" -
it knows nothing about patterns, phases, or domain concepts.
All logic lives in the codecs; this just renders blocks.

### When to Use

- When converting RenderableDocument to markdown output
- When generating output files with detail file support
- When customizing markdown rendering behavior

---

[← Back to Pattern Registry](../PATTERNS.md)
