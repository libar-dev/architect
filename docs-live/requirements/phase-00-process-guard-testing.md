# ✅ Process Guard Testing

**Purpose:** Detailed requirements for the Process Guard Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Validation |

## Description

Pure validation functions for enforcing delivery process rules per PDR-005.
All validation follows the Decider pattern: (state, changes, options) => result.

**Problem:**

- Completed specs modified without explicit unlock reason
- Invalid status transitions bypass FSM rules
- Active specs expand scope unexpectedly with new deliverables
- Changes occur outside session boundaries

**Solution:**

- checkProtectionLevel() enforces unlock-reason for completed (hard) files
- checkStatusTransitions() validates transitions against FSM matrix
- checkScopeCreep() prevents deliverable addition to active (scope) specs
- checkSessionScope() warns about files outside session scope
- checkSessionExcluded() errors on explicitly excluded files

## Acceptance Criteria

**Completed file with unlock-reason passes validation**

- Given a file "specs/phase-14.feature" with status "completed"
- And the file has unlock-reason "Bug fix for critical issue"
- When the file is modified
- And validating changes
- Then validation passes
- And no violations are reported

**Completed file without unlock-reason fails validation**

- Given a file "specs/phase-14.feature" with status "completed"
- And the file does not have unlock-reason
- When the file is modified
- And validating changes
- Then validation fails
- And violation "completed-protection" is reported for "specs/phase-14.feature"
- And the suggestion contains "unlock-reason"

**Protection levels and unlock requirement**

- Given a file "specs/test.feature" with status "<status>"
- And the file does not have unlock-reason
- When the file is modified
- And validating changes
- Then completed-protection violation is expected "<expected>"

**File transitioning to completed does not require unlock-reason**

- Given a file "specs/finishing.feature" with status "completed"
- And the file does not have unlock-reason
- And the file has a status transition from "active" to "completed"
- When the file is modified
- And validating changes
- Then validation passes
- And no "completed-protection" violation is reported

**Valid transitions pass validation**

- Given a file "specs/feature.feature" with status "<from>"
- When the status changes to "<to>"
- And validating changes
- Then no "invalid-status-transition" violation is reported

**Invalid transitions fail validation**

- Given a file "specs/feature.feature" with status "<from>"
- When the status changes to "<to>"
- And validating changes
- Then violation "invalid-status-transition" is reported for "specs/feature.feature"
- And the message contains "<from>"
- And the suggestion contains valid transitions

**Active spec with no deliverable changes passes**

- Given a file "specs/active-phase.feature" with status "active"
- And the file has deliverables "Type definitions" and "Unit tests"
- When the file is modified without adding deliverables
- And validating changes
- Then no "scope-creep" violation is reported

**Active spec adding deliverable fails validation**

- Given a file "specs/active-phase.feature" with status "active"
- And the file has deliverables "Type definitions"
- When the deliverable "New unplanned feature" is added
- And validating changes
- Then violation "scope-creep" is reported for "specs/active-phase.feature"
- And the message contains "New unplanned feature"

**Roadmap spec can add deliverables freely**

- Given a file "specs/roadmap-phase.feature" with status "roadmap"
- When the deliverable "Additional feature" is added
- And validating changes
- Then no "scope-creep" violation is reported

**Removing deliverable produces warning**

- Given a file "specs/active-phase.feature" with status "active"
- And the file has deliverables "Type definitions" and "Unit tests"
- When the deliverable "Unit tests" is removed
- And validating changes
- Then warning "deliverable-removed" is reported for "specs/active-phase.feature"
- And the message contains "Unit tests"

**Deliverable status change does not trigger scope-creep**

- Given a file "specs/active-phase.feature" with status "active"
- And the file has deliverables "Type definitions"
- When the deliverable "Type definitions" status changes
- And validating changes
- Then no "scope-creep" violation is reported
- And no "deliverable-removed" warning is reported

**Multiple deliverable status changes pass validation**

- Given a file "specs/active-phase.feature" with status "active"
- And the file has deliverables "Type definitions" and "Unit tests"
- When the deliverables "Type definitions" and "Unit tests" status change
- And validating changes
- Then no "scope-creep" violation is reported
- And no "deliverable-removed" warning is reported

**File in session scope passes validation**

- Given an active session "session-2026-01"
- And the session scopes specs "phase-44" and "phase-45"
- And a file "specs/phase-44.feature" with status "active"
- When the file is modified
- And validating changes
- Then no "session-scope" violation is reported

**File outside session scope triggers warning**

- Given an active session "session-2026-01"
- And the session scopes specs "phase-44"
- And a file "specs/phase-99.feature" with status "active"
- When the file is modified
- And validating changes
- Then warning "session-scope" is reported for "specs/phase-99.feature"

**No active session means all files in scope**

- Given no active session
- And a file "specs/any-phase.feature" with status "active"
- When the file is modified
- And validating changes
- Then no "session-scope" violation is reported

**ignoreSession flag suppresses session warnings**

- Given an active session "session-2026-01"
- And the session scopes specs "phase-44"
- And a file "specs/phase-99.feature" with status "active"
- When the file is modified
- And validating changes with ignoreSession flag
- Then no "session-scope" violation is reported

**Excluded file triggers error**

- Given an active session "session-2026-01"
- And the session excludes specs "phase-legacy"
- And a file "specs/phase-legacy.feature" with status "roadmap"
- When the file is modified
- And validating changes
- Then violation "session-excluded" is reported for "specs/phase-legacy.feature"

**Non-excluded file passes validation**

- Given an active session "session-2026-01"
- And the session excludes specs "phase-legacy"
- And a file "specs/phase-44.feature" with status "active"
- When the file is modified
- And validating changes
- Then no "session-excluded" violation is reported

**ignoreSession flag suppresses excluded errors**

- Given an active session "session-2026-01"
- And the session excludes specs "phase-legacy"
- And a file "specs/phase-legacy.feature" with status "roadmap"
- When the file is modified
- And validating changes with ignoreSession flag
- Then no "session-excluded" violation is reported

**Multiple violations from different rules**

- Given a file "specs/completed.feature" with status "completed"
- And the file does not have unlock-reason
- And an active session "session-2026-01"
- And the session scopes specs "other-phase"
- When the file is modified
- And validating changes
- Then violation "completed-protection" is reported
- And warning "session-scope" is reported

**Strict mode promotes warnings to errors**

- Given a file "specs/out-of-scope.feature" with status "active"
- And an active session "session-2026-01"
- And the session scopes specs "in-scope-phase"
- When the file is modified
- And validating changes with strict mode
- Then validation fails
- And violation "session-scope" is reported with severity "error"

**Clean change produces empty violations**

- Given a file "specs/roadmap.feature" with status "roadmap"
- And no active session
- When the file is modified
- And validating changes
- Then validation passes
- And no violations are reported
- And no warnings are reported

## Business Rules

**Completed files require unlock-reason to modify**

**Invariant:** A completed spec file cannot be modified unless it carries an @libar-docs-unlock-reason tag.
**Rationale:** Completed work represents validated, shipped functionality — accidental modification risks regression.
**Verified by:** Completed file with unlock-reason passes validation, Completed file without unlock-reason fails validation, Protection levels and unlock requirement, File transitioning to completed does not require unlock-reason

_Verified by: Completed file with unlock-reason passes validation, Completed file without unlock-reason fails validation, Protection levels and unlock requirement, File transitioning to completed does not require unlock-reason_

**Status transitions must follow PDR-005 FSM**

**Invariant:** Status changes must follow the directed graph: roadmap->active->completed, roadmap<->deferred, active->roadmap.
**Rationale:** The FSM prevents skipping required stages (e.g., roadmap->completed bypasses implementation).
**Verified by:** Valid transitions pass validation, Invalid transitions fail validation

_Verified by: Valid transitions pass validation, Invalid transitions fail validation_

**Active specs cannot add new deliverables**

**Invariant:** A spec in active status cannot have deliverables added that were not present when it entered active.
**Rationale:** Scope-locking active work prevents mid-sprint scope creep that derails delivery commitments.
**Verified by:** Active spec with no deliverable changes passes, Active spec adding deliverable fails validation, Roadmap spec can add deliverables freely, Removing deliverable produces warning, Deliverable status change does not trigger scope-creep, Multiple deliverable status changes pass validation

_Verified by: Active spec with no deliverable changes passes, Active spec adding deliverable fails validation, Roadmap spec can add deliverables freely, Removing deliverable produces warning, Deliverable status change does not trigger scope-creep, Multiple deliverable status changes pass validation_

**Files outside active session scope trigger warnings**

**Invariant:** Files modified outside the active session's declared scope produce a session-scope warning.
**Rationale:** Session scoping keeps focus on planned work and makes accidental cross-cutting changes visible.
**Verified by:** File in session scope passes validation, File outside session scope triggers warning, No active session means all files in scope, ignoreSession flag suppresses session warnings

_Verified by: File in session scope passes validation, File outside session scope triggers warning, No active session means all files in scope, ignoreSession flag suppresses session warnings_

**Explicitly excluded files trigger errors**

**Invariant:** Files explicitly excluded from a session cannot be modified, producing a session-excluded error.
**Rationale:** Exclusion is stronger than scope — it marks files that must NOT be touched during this session.
**Verified by:** Excluded file triggers error, Non-excluded file passes validation, ignoreSession flag suppresses excluded errors

_Verified by: Excluded file triggers error, Non-excluded file passes validation, ignoreSession flag suppresses excluded errors_

**Multiple rules validate independently**

**Invariant:** Each validation rule evaluates independently — a single file can produce violations from multiple rules.
**Rationale:** Independent evaluation ensures no rule masks another, giving complete diagnostic output.
**Verified by:** Multiple violations from different rules, Strict mode promotes warnings to errors, Clean change produces empty violations

_Verified by: Multiple violations from different rules, Strict mode promotes warnings to errors, Clean change produces empty violations_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
