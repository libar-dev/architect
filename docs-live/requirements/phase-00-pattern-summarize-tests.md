# 🚧 Pattern Summarize Tests

**Purpose:** Detailed requirements for the Pattern Summarize Tests feature

---

## Overview

| Property     | Value   |
| ------------ | ------- |
| Status       | active  |
| Product Area | DataAPI |

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

**Invariant:** summarizePattern must project a full pattern object to a compact summary containing exactly 6 fields, using the patternName tag over the name field when available and omitting undefined optional fields.
**Rationale:** Compact summaries reduce token usage by 80-90% compared to full patterns — they provide enough context for navigation without overwhelming AI context windows.
**Verified by:** Summary includes all 6 fields for a TypeScript pattern, Summary includes all 6 fields for a Gherkin pattern, Summary uses patternName tag over name field, Summary omits undefined optional fields

_Verified by: Summary includes all 6 fields for a TypeScript pattern, Summary includes all 6 fields for a Gherkin pattern, Summary uses patternName tag over name field, Summary omits undefined optional fields_

**summarizePatterns batch processes arrays**

**Invariant:** summarizePatterns must batch-process an array of patterns, returning a correctly-sized array of compact summaries.
**Rationale:** Batch processing avoids N individual function calls — the API frequently needs to summarize all patterns matching a query in a single operation.
**Verified by:** Batch summarization returns correct count

_Verified by: Batch summarization returns correct count_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
