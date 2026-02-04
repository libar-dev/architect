# ✅ Phase State Machine Validation

**Purpose:** Detailed documentation for the Phase State Machine Validation pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 100 |

## Description

**Problem:**
  Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.
  Invalid transitions can occur silently, leading to inconsistent process state.

  **Solution:**
  Implement state machine validation that:
  - Validates all status transitions
  - Enforces required metadata for terminal states
  - Provides clear error messages for invalid transitions
  - Integrates with generators and linters

## Implementations

Files that implement this pattern:

- [`process-state.ts`](../../src/api/process-state.ts) - ## Process State API - Programmatic Query Interface
- [`states.ts`](../../src/validation/fsm/states.ts) - :PDR005MvpWorkflow
- [`transitions.ts`](../../src/validation/fsm/transitions.ts) - :PDR005MvpWorkflow
- [`validator.ts`](../../src/validation/fsm/validator.ts) - :PDR005MvpWorkflow

## Acceptance Criteria

**Only valid status values are accepted**

- Given a feature file with status tag
- When the status value is "roadmap", "active", "completed", or "deferred"
- Then validation passes

**Invalid status values are rejected**

- Given a feature file with status tag
- When the status value is "done" or "in-progress"
- Then validation fails with "Invalid status: must be roadmap, active, completed, or deferred"

**Valid transitions are allowed**

- Given a phase with current status "<from>"
- When transitioning to status "<to>"
- Then the transition is valid

**Invalid transitions are rejected**

- Given a phase with current status "<from>"
- When transitioning to status "<to>"
- Then the transition is rejected
- And error message indicates valid transitions from "<from>"

**Completed status requires completion date**

- Given a phase transitioning to "completed" status
- When the @libar-docs-completed tag is missing
- Then validation warns "Completed phases should have @libar-docs-completed date"

**Completed phases should have effort-actual**

- Given a phase transitioning to "completed" status
- When the @libar-docs-effort-actual tag is missing
- Then validation warns "Completed phases should have @libar-docs-effort-actual for variance tracking"

## Business Rules

**Valid status values are enforced**

_Verified by: Only valid status values are accepted, Invalid status values are rejected_

**Status transitions follow state machine rules**

_Verified by: Valid transitions are allowed, Invalid transitions are rejected_

**Terminal states require completion metadata**

_Verified by: Completed status requires completion date, Completed phases should have effort-actual_

---

[← Back to Pattern Registry](../PATTERNS.md)
