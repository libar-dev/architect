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

---

[← Back to Pattern Registry](../PATTERNS.md)
