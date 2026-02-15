# ✅ FSM Validator Testing

**Purpose:** Detailed requirements for the FSM Validator Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

Pure validation functions for the 4-state FSM defined in PDR-005.
All validation follows the Decider pattern: no I/O, no side effects.

**Problem:**

- Status values must conform to PDR-005 FSM states
- Status transitions must follow valid paths in the state machine
- Completed patterns should have proper metadata (date, effort)

**Solution:**

- validateStatus() checks status values against allowed enum
- validateTransition() validates transitions against FSM matrix
- validateCompletionMetadata() warns about missing completion info

## Acceptance Criteria

**Valid status values are accepted**

- When validating status "<status>"
- Then validation passes
- And the validated status is "<status>"

**Invalid status values are rejected**

- When validating status "<status>"
- Then validation fails
- And the error message contains "Invalid status"
- And the error message contains valid values list

**Terminal state returns warning**

- When validating status "completed"
- Then validation passes
- And warnings include "terminal state"

**Valid transitions are accepted**

- When validating transition from "<from>" to "<to>"
- Then transition is valid

**Invalid transitions are rejected with alternatives**

- When validating transition from "<from>" to "<to>"
- Then transition is invalid
- And the error message is provided
- And valid alternatives are provided

**Terminal state has no valid transitions**

- When validating transition from "completed" to "roadmap"
- Then transition is invalid
- And valid alternatives list is empty

**Invalid source status in transition**

- When validating transition from "done" to "active"
- Then transition is invalid
- And the error message contains "Invalid source status"

**Invalid target status in transition**

- When validating transition from "roadmap" to "done"
- Then transition is invalid
- And the error message contains "Invalid target status"

**Completed pattern with full metadata has no warnings**

- Given a pattern with status "completed"
- And the pattern has completion date "2026-01-09"
- And the pattern has effort planned "4h"
- And the pattern has effort actual "3h"
- When validating completion metadata
- Then validation passes
- And there are no warnings

**Completed pattern without date shows warning**

- Given a pattern with status "completed"
- When validating completion metadata
- Then validation passes
- And warnings include "missing @libar-docs-completed date"

**Completed pattern with planned but no actual effort shows warning**

- Given a pattern with status "completed"
- And the pattern has completion date "2026-01-09"
- And the pattern has effort planned "4h"
- When validating completion metadata
- Then validation passes
- And warnings include "missing @libar-docs-effort-actual"

**Non-completed pattern skips metadata validation**

- Given a pattern with status "roadmap"
- When validating completion metadata
- Then validation passes
- And there are no warnings

**Roadmap status has no protection**

- When querying protection for status "roadmap"
- Then the protection level is "none"
- And deliverables can be added
- And unlock is not required

**Active status has scope protection**

- When querying protection for status "active"
- Then the protection level is "scope"
- And deliverables cannot be added
- And unlock is not required

**Completed status has hard protection**

- When querying protection for status "completed"
- Then the protection level is "hard"
- And deliverables cannot be added
- And unlock is required

**Deferred status has no protection**

- When querying protection for status "deferred"
- Then the protection level is "none"
- And deliverables can be added
- And unlock is not required

**Valid completed pattern returns combined results**

- Given a pattern with status "completed"
- And the pattern has completion date "2026-01-09"
- When validating pattern status
- Then status validation passes
- And completion validation passes
- And all warnings are collected

## Business Rules

**Status values must be valid PDR-005 FSM states**

**Invariant:** Every pattern status value must be one of the states defined in the PDR-005 finite state machine (roadmap, active, completed, deferred).
**Rationale:** Invalid status values bypass FSM transition validation and produce undefined behavior in process guard enforcement.
**Verified by:** Valid status values are accepted, Invalid status values are rejected, Terminal state returns warning

_Verified by: Valid status values are accepted, Invalid status values are rejected, Terminal state returns warning_

**Status transitions must follow FSM rules**

**Invariant:** Every status change must follow a valid edge in the PDR-005 state machine graph — no skipping states or invalid paths.
**Rationale:** The FSM encodes the delivery workflow contract — invalid transitions indicate process violations that could corrupt delivery tracking.
**Verified by:** Valid transitions are accepted, Invalid transitions are rejected with alternatives, Terminal state has no valid transitions, Invalid source status in transition, Invalid target status in transition

_Verified by: Valid transitions are accepted, Invalid transitions are rejected with alternatives, Terminal state has no valid transitions, Invalid source status in transition, Invalid target status in transition_

**Completed patterns should have proper metadata**

**Invariant:** Patterns in completed status must carry completion date and actual effort metadata to pass validation without warnings.
**Rationale:** Completion metadata enables retrospective analysis and effort estimation — missing metadata degrades project planning accuracy over time.
**Verified by:** Completed pattern with full metadata has no warnings, Completed pattern without date shows warning, Completed pattern with planned but no actual effort shows warning, Non-completed pattern skips metadata validation

_Verified by: Completed pattern with full metadata has no warnings, Completed pattern without date shows warning, Completed pattern with planned but no actual effort shows warning, Non-completed pattern skips metadata validation_

**Protection levels match FSM state definitions**

**Invariant:** Each FSM state must map to exactly one protection level (none, scope-locked, or hard-locked) as defined in PDR-005.
**Rationale:** Protection levels enforce edit constraints per state — mismatched protection would allow prohibited modifications to active or completed specs.
**Verified by:** Roadmap status has no protection, Active status has scope protection, Completed status has hard protection, Deferred status has no protection

_Verified by: Roadmap status has no protection, Active status has scope protection, Completed status has hard protection, Deferred status has no protection_

**Combined validation provides complete results**

**Invariant:** The FSM validator must return a combined result including status validity, transition validity, metadata warnings, and protection level in a single call.
**Rationale:** Callers need a complete validation picture — requiring multiple separate calls risks partial validation and inconsistent error reporting.
**Verified by:** Valid completed pattern returns combined results

_Verified by: Valid completed pattern returns combined results_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
