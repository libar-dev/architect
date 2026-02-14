# 🚧 Pattern Summarize Tests

**Purpose:** Detailed documentation for the Pattern Summarize Tests pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | DDD |

## Description

Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to
  PatternSummary (~100 bytes) with the correct 6 fields.

## Acceptance Criteria

**Summary includes all 6 fields for a TypeScript pattern**

- Given a TypeScript pattern "OrderSaga" with status "active" in phase 22
- When I summarize the pattern
- Then the summary has patternName "OrderSaga"
- And the summary has status "active"
- And the summary has category "projection"
- And the summary has phase 22
- And the summary has source "typescript"
- And the summary file ends with ".ts"

**Summary includes all 6 fields for a Gherkin pattern**

- Given a Gherkin pattern "ProcessGuard" with status "roadmap" in phase 18
- When I summarize the pattern
- Then the summary has patternName "ProcessGuard"
- And the summary has status "roadmap"
- And the summary has source "gherkin"
- And the summary file ends with ".feature"

**Summary uses patternName tag over name field**

- Given a pattern with name "internal-name" and patternName tag "PublicName"
- When I summarize the pattern
- Then the summary has patternName "PublicName"

**Summary omits undefined optional fields**

- Given a pattern without status or phase
- When I summarize the pattern
- Then the summary does not have a status field
- And the summary does not have a phase field

**Batch summarization returns correct count**

- Given 5 patterns exist with various statuses
- When I summarize all patterns
- Then I get 5 summaries
- And each summary has a patternName field

## Business Rules

**summarizePattern projects to compact summary**

_Verified by: Summary includes all 6 fields for a TypeScript pattern, Summary includes all 6 fields for a Gherkin pattern, Summary uses patternName tag over name field, Summary omits undefined optional fields_

**summarizePatterns batch processes arrays**

_Verified by: Batch summarization returns correct count_

---

[← Back to Pattern Registry](../PATTERNS.md)
