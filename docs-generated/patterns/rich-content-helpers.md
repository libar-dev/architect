# ✅ Rich Content Helpers

**Purpose:** Detailed documentation for the Rich Content Helpers pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Shared helper functions for rendering Gherkin rich content in document codecs.
Provides granular and composite helpers for DataTables, DocStrings, steps,
scenarios, and business rules.

### When to Use

- When building custom codecs that need to render Gherkin content
- When transforming DataTables, DocStrings, or scenarios into markdown
- When implementing acceptance criteria or business rules sections

### Usage Pattern

```typescript
import { renderAcceptanceCriteria, renderBusinessRulesSection } from "./helpers.js";

// Composite helpers (most common use)
sections.push(...renderAcceptanceCriteria(pattern.scenarios));
sections.push(...renderBusinessRulesSection(pattern.rules));

// Granular helpers (for custom rendering)
const tableBlock = renderDataTable(step.dataTable);
const codeBlock = renderDocString(step.docString, "markdown");
```

## Implementations

Files that implement this pattern:

- [`rich-content-helpers.feature`](../../tests/features/behavior/rich-content-helpers.feature) - As a document codec author

---

[← Back to Pattern Registry](../PATTERNS.md)
