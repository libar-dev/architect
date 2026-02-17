# ✅ Handoff Generator Tests

**Purpose:** Detailed requirements for the Handoff Generator Tests feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

**Problem:**
Multi-session work loses critical state between sessions when handoff
documentation is manual or forgotten.

**Solution:**
HandoffGenerator assembles a structured handoff document from ProcessStateAPI
and MasterDataset, capturing completed work, remaining items, discovered
issues, and next-session priorities.

## Acceptance Criteria

**Generate handoff for in-progress pattern**

- Given an active pattern with completed and remaining deliverables
- When generating a handoff document
- Then the handoff shows the session summary header
- And the handoff lists completed deliverables
- And the handoff lists in-progress deliverables
- And the handoff lists remaining deliverables as next priorities

**Handoff captures discovered items**

- Given a pattern with discovery tags
- When generating a handoff document
- Then the handoff includes discovered gaps
- And the handoff includes discovered improvements
- And the handoff includes discovered learnings

**Session type is inferred from status**

- Given a roadmap pattern
- When generating a handoff document without explicit session type
- Then the inferred session type is design

**Completed pattern infers review session type**

- Given a completed pattern
- When generating a handoff document without explicit session type
- Then the inferred session type is review

**Deferred pattern infers design session type**

- Given a deferred pattern
- When generating a handoff document without explicit session type
- Then the inferred session type is design

**Files modified section included when provided**

- Given an active pattern with completed and remaining deliverables
- When generating a handoff with modified files
- Then the handoff includes a files modified section

**Blockers section shows incomplete dependencies**

- Given a pattern with an incomplete dependency
- When generating a handoff document
- Then the handoff shows the incomplete dependency as a blocker

**Pattern not found throws error**

- Given no patterns in the dataset
- When generating a handoff for a nonexistent pattern
- Then a PATTERN_NOT_FOUND error is thrown

**Handoff formatter produces markers per ADR-008**

- Given a handoff document for pattern TestPattern
- When formatting the handoff document
- Then the output contains the handoff header
- And the output contains section markers

## Business Rules

**Handoff generates compact session state summary**

**Invariant:** The handoff generator must produce a compact session state summary including pattern status, discovered items, inferred session type, modified files, and dependency blockers, throwing an error for unknown patterns.
**Rationale:** Handoff documents are the bridge between multi-session work — without compact state capture, the next session starts from scratch instead of resuming where the previous one left off.
**Verified by:** Generate handoff for in-progress pattern, Handoff captures discovered items, Session type is inferred from status, Completed pattern infers review session type, Deferred pattern infers design session type, Files modified section included when provided, Blockers section shows incomplete dependencies, Pattern not found throws error

_Verified by: Generate handoff for in-progress pattern, Handoff captures discovered items, Session type is inferred from status, Completed pattern infers review session type, Deferred pattern infers design session type, Files modified section included when provided, Blockers section shows incomplete dependencies, Pattern not found throws error_

**Formatter produces structured text output**

**Invariant:** The handoff formatter must produce structured text output with ADR-008 section markers for machine-parseable session state.
**Rationale:** ADR-008 markers enable the context assembler to parse handoff output programmatically — unstructured text would require fragile regex parsing.
**Verified by:** Handoff formatter produces markers per ADR-008

_Verified by: Handoff formatter produces markers per ADR-008_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
