# ✅ Decision Doc Codec

**Purpose:** Detailed documentation for the Decision Doc Codec pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Parses decision documents (ADR/PDR in .feature format) and extracts content
for documentation generation. Provides parsing utilities for source mapping
tables, self-reference markers, and rule block extraction.

### When to Use

- When extracting content from decision documents for doc generation
- When parsing Rule: blocks for Context/Decision/Consequences sections
- When extracting DocStrings (fenced code blocks) with language tags
- When parsing source mapping tables from decision descriptions

### Source Mapping Table Format

```
| Section | Source File | Extraction Method |
| Intro & Context | THIS DECISION | Decision rule description |
| API Types | src/types.ts | @extract-shapes tag |
```

### Self-Reference Markers

- `THIS DECISION` - Extract from the current decision document
- `THIS DECISION (Rule: X)` - Extract specific Rule: block
- `THIS DECISION (DocString)` - Extract fenced code blocks

---

[← Back to Pattern Registry](../PATTERNS.md)
