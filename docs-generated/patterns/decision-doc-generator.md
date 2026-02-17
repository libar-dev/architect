# ✅ Decision Doc Generator

**Purpose:** Detailed documentation for the Decision Doc Generator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |
| Phase | 27 |

## Description

Orchestrates the full pipeline for generating documentation from decision
documents (ADR/PDR in .feature format):

1. Decision parsing - Extract source mappings, rules, DocStrings
2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
3. Content assembly - Build RenderableDocument from aggregated sections
4. Multi-level output - Generate compact (_claude-md/) and detailed (docs/) versions

### When to Use

- When generating documentation from ADR/PDR decision documents
- When decision documents contain source mapping tables
- When building progressive disclosure docs at multiple detail levels

### Output Path Convention

- Compact: `_claude-md/{section}/{module}.md` (~50 lines)
- Detailed: `docs/{PATTERN-NAME}.md` (~300 lines)

## Dependencies

- Depends on: DecisionDocCodec
- Depends on: SourceMapper

## Implementations

Files that implement this pattern:

- [`decision-doc-generator.feature`](../../tests/features/doc-generation/decision-doc-generator.feature) - The Decision Doc Generator orchestrates the full documentation generation

---

[← Back to Pattern Registry](../PATTERNS.md)
