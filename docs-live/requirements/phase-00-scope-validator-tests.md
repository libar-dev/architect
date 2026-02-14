# ✅ Scope Validator Tests

**Purpose:** Detailed requirements for the Scope Validator Tests feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

**Problem:**
Starting an implementation or design session without checking prerequisites
wastes time when blockers are discovered mid-session.

**Solution:**
ScopeValidator runs composable checks and aggregates results into a verdict
(ready, blocked, or warnings) before a session starts.

## Acceptance Criteria

**All implementation checks pass**

- Given a pattern with all implementation prerequisites met
- When validating scope for implement session
- Then the verdict is "ready"
- And all checks have severity PASS

**Incomplete dependency blocks implementation**

- Given a pattern depending on an incomplete dependency
- When validating scope for implement session
- Then the verdict is "blocked"
- And the dependencies check shows BLOCKED

**FSM transition from completed blocks implementation**

- Given a pattern with completed status
- When validating scope for implement session
- Then the verdict is "blocked"
- And the FSM check shows BLOCKED

**Missing PDR references produce WARN**

- Given a pattern with no stubs or PDR references
- When validating scope for implement session
- Then the design decisions check shows WARN
- And the verdict is not blocked

**No deliverables blocks implementation**

- Given a pattern with no deliverables defined
- When validating scope for implement session
- Then the deliverables check shows BLOCKED

**Strict mode promotes WARN to BLOCKED**

- Given a pattern with warnings but no blockers
- When validating scope with strict mode
- Then the verdict is "blocked"
- And warnings are promoted to BLOCKED severity

**Pattern not found throws error**

- Given no patterns in the dataset
- When validating scope for a nonexistent pattern
- Then a PATTERN_NOT_FOUND error is thrown

**Design session with no dependencies passes**

- Given a pattern with no dependencies
- When validating scope for design session
- Then the verdict is "ready"

**Design session with dependencies lacking stubs produces WARN**

- Given a pattern with dependencies that have no stubs
- When validating scope for design session
- Then the stubs check shows WARN
- And the blocker names include the dependency without stubs

**Formatter produces markers per ADR-008**

- Given a scope validation result for pattern TestPattern
- When formatting the scope validation result
- Then the output contains the scope validation header
- And the output contains the checklist marker
- And the output contains the verdict marker

**Formatter shows warnings verdict text**

- Given a scope validation result with warnings but no blockers
- When formatting the scope validation result
- Then the output contains READY with warning count

**Formatter shows blocker details for blocked verdict**

- Given a scope validation result with blockers
- When formatting the scope validation result
- Then the output contains BLOCKED in the verdict section
- And the output lists each blocker with its detail

## Business Rules

**Implementation scope validation checks all prerequisites**

_Verified by: All implementation checks pass, Incomplete dependency blocks implementation, FSM transition from completed blocks implementation, Missing PDR references produce WARN, No deliverables blocks implementation, Strict mode promotes WARN to BLOCKED, Pattern not found throws error_

**Design scope validation checks dependency stubs**

_Verified by: Design session with no dependencies passes, Design session with dependencies lacking stubs produces WARN_

**Formatter produces structured text output**

_Verified by: Formatter produces markers per ADR-008, Formatter shows warnings verdict text, Formatter shows blocker details for blocked verdict_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
