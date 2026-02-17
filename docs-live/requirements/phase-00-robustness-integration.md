# ✅ Robustness Integration

**Purpose:** Detailed requirements for the Robustness Integration feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

**Context:** Document generation pipeline needs validation, deduplication, and
  warning collection to work together correctly for production use.

  **Approach:** Integration tests verify the full pipeline with all robustness
  features enabled, ensuring validation runs first, deduplication merges content,
  and warnings are collected across stages.

## Acceptance Criteria

**Valid decision document generates successfully**

- Given a decision document with valid source mappings
- And all referenced files exist
- When generating documentation
- Then generation succeeds
- And output contains all mapped sections
- And no errors are reported

**Invalid mapping halts pipeline before extraction**

- Given a decision document referencing missing file "src/ghost.ts"
- When generating documentation
- Then generation fails with validation error
- And no extraction is attempted
- And error clearly identifies "src/ghost.ts" as missing

**Multiple validation errors are reported together**

- Given a decision document with 3 invalid mappings
- When generating documentation
- Then generation fails
- And all 3 errors are reported
- And user can fix all issues in one iteration

**Duplicate content is removed from final output**

- Given a decision document that extracts "Protection Levels" from:
- And both sources have identical "Protection Levels" content
- When generating documentation
- Then output contains exactly one "Protection Levels" section
- And source attribution shows primary source

| Source | Method |
| --- | --- |
| THIS DECISION (Rule: Decision) | Decision rule description |
| src/lint/process-guard.ts | JSDoc section |

**Non-duplicate sections are preserved**

- Given a decision document with 5 unique sections
- When generating documentation
- Then output contains all 5 sections
- And section order matches source mapping order

**Warnings are collected across pipeline stages**

- Given validation produces warning "File modified recently"
- And extraction produces warning "Empty code block"
- And deduplication produces warning "Content merged from 2 sources"
- When generating documentation
- Then generation succeeds
- And result includes 1 warning
- And warnings are grouped by stage

**Warnings do not prevent successful generation**

- Given a decision document with minor issues
- And issues are warnings not errors
- When generating documentation
- Then generation succeeds
- And warnings are available for review
- And output is complete

**File not found error includes fix suggestion**

- Given a decision document referencing "src/old-name.ts"
- And the file was renamed to "src/new-name.ts"
- When generating documentation
- Then error includes "File not found: src/old-name.ts"
- And error suggests checking file path

**Invalid method error includes valid alternatives**

- Given a decision document with method "extract types"
- When generating documentation
- Then error includes "Unknown extraction method: extract types"
- And error suggests "@extract-shapes tag"

**Extraction error includes source context**

- Given a decision document referencing valid file
- And extraction fails due to syntax error in source
- When generating documentation
- Then error includes source file path
- And error includes line number if available
- And error includes parsing context

**PoC decision document still generates**

- Given the doc-generation-proof-of-concept.feature decision document
- When generating documentation with robustness enabled
- Then generation succeeds
- And output matches expected structure
- And no new errors are introduced

**Process Guard decision document still generates**

- Given a decision document for Process Guard
- When generating documentation with robustness enabled
- Then generation succeeds
- And PROCESS-GUARD.md is generated correctly

## Business Rules

**Validation runs before extraction in the pipeline**

**Invariant:** Validation must complete and pass before extraction begins.
    **Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.
    **Verified by:** @acceptance-criteria scenarios below.

    The validation layer must run first and halt the pipeline if errors
    are found, preventing wasted extraction work.

_Verified by: Valid decision document generates successfully, Invalid mapping halts pipeline before extraction, Multiple validation errors are reported together_

**Deduplication runs after extraction before assembly**

**Invariant:** Deduplication processes all extracted content before document assembly.
    **Rationale:** All sources must be extracted to identify cross-source duplicates.
    **Verified by:** @acceptance-criteria scenarios below.

    Content from all sources is extracted first, then deduplicated,
    then assembled into the final document.

_Verified by: Duplicate content is removed from final output, Non-duplicate sections are preserved_

**Warnings from all stages are collected and reported**

**Invariant:** Warnings from all pipeline stages are aggregated in the result.
    **Rationale:** Users need visibility into non-fatal issues without blocking generation.
    **Verified by:** @acceptance-criteria scenarios below.

    Non-fatal issues from validation, extraction, and deduplication are
    collected and included in the result.

_Verified by: Warnings are collected across pipeline stages, Warnings do not prevent successful generation_

**Pipeline provides actionable error messages**

**Invariant:** Error messages include context and fix suggestions.
    **Rationale:** Users should fix issues in one iteration without guessing.
    **Verified by:** @acceptance-criteria scenarios below.

    Errors include enough context for users to understand and fix the issue.

_Verified by: File not found error includes fix suggestion, Invalid method error includes valid alternatives, Extraction error includes source context_

**Existing decision documents continue to work**

**Invariant:** Valid existing decision documents generate without new errors.
    **Rationale:** Robustness improvements must be backward compatible.
    **Verified by:** @acceptance-criteria scenarios below.

    The robustness improvements must not break existing valid decision
    documents that worked with the PoC.

_Verified by: PoC decision document still generates, Process Guard decision document still generates_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
