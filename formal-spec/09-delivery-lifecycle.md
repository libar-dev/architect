# 09 — Delivery Lifecycle

> **Architect Spec v0.1.0** — FSM states, transitions, protection levels, and ProcessGuard.

---

## Overview

The delivery lifecycle is a **finite state machine (FSM)** that governs how patterns
move from idea to completion. Unlike advisory process documentation, this lifecycle is
machine-enforced — toolchain implementations (Level 3) validate every state transition
and prevent unauthorized modifications to protected patterns.

## States

The FSM has five states across two tracks:

### Refinement Track

| State       | Meaning                                 | Protection Level |
| ----------- | --------------------------------------- | ---------------- |
| `candidate` | Idea under refinement, not yet accepted | None             |

### Delivery Track

| State       | Meaning                        | Protection Level |
| ----------- | ------------------------------ | ---------------- |
| `roadmap`   | Accepted, planned for delivery | None             |
| `active`    | Implementation in progress     | Scope-locked     |
| `completed` | Done, tested, delivered        | Hard-locked      |
| `deferred`  | Postponed indefinitely         | None             |

## State Transition Diagram

```
  REFINEMENT                 DELIVERY

  candidate                  roadmap ──────────► active ──────────► completed
      │                          │                 │
      │ acceptance               │                 │ (requires unlock-reason)
      ├──────────────────────►   │                 │
      │                          ▼                 │
      │ rejection            deferred              │
      ▼                          │                 │
   (deleted)                     │                 │
                                 └─────────────────┘
                                   (regress, rare)
```

## Transition Matrix

| From \ To   | `candidate` | `roadmap`         | `active`    | `completed` | `deferred`  |
| ----------- | ----------- | ----------------- | ----------- | ----------- | ----------- |
| `candidate` | —           | ALLOWED (accept)  | NOT ALLOWED | NOT ALLOWED | NOT ALLOWED |
| `roadmap`   | NOT ALLOWED | —                 | ALLOWED     | NOT ALLOWED | ALLOWED     |
| `active`    | NOT ALLOWED | ALLOWED (regress) | —           | ALLOWED     | NOT ALLOWED |
| `completed` | NOT ALLOWED | NOT ALLOWED       | NOT ALLOWED | —           | NOT ALLOWED |
| `deferred`  | NOT ALLOWED | ALLOWED           | NOT ALLOWED | NOT ALLOWED | —           |

**Transition rules:**

1. **candidate → roadmap** — Acceptance gate. Open questions resolved, full tag set applied, deliverables defined.
2. **candidate → (deleted)** — Rejection. Spec is deleted (version control preserves history).
3. **roadmap → active** — Work begins. Deliverables and scope are established.
4. **active → completed** — All deliverables are done. Design spec deleted, executable spec exists. Pattern is locked.
5. **roadmap → deferred** — Feature is postponed. Can return to roadmap later.
6. **deferred → roadmap** — Deferred feature is re-activated for planning.
7. **active → roadmap** — Regression. Work is abandoned and the pattern returns to planning. (SHOULD be rare and justified.)
8. **completed → anything** — NOT ALLOWED without an `@architect-unlock-reason` tag.

## Protection Levels

Each state has an associated protection level that constrains what modifications are allowed.

### None (roadmap, deferred)

No protection. Any field, tag, or structural element can be modified freely.

### Scope-Locked (active)

Scope is frozen. Modifications are allowed within the existing scope but adding new
scope is prevented:

- **ALLOWED:** Modifying existing rules, scenarios, and deliverables
- **ALLOWED:** Updating deliverable status from `pending` to `in-progress` to `complete`
- **ALLOWED:** Adding scenarios within existing rules
- **NOT ALLOWED:** Adding new deliverables (scope creep)
- **NOT ALLOWED:** Adding new rules that expand scope
- **NOT ALLOWED:** Changing the pattern's bounded context or architecture layer

### Hard-Locked (completed)

The pattern is frozen. Modifications require explicit justification:

- **NOT ALLOWED:** Any modification without `@architect-unlock-reason`
- **ALLOWED (with unlock-reason):** Bug fixes, typo corrections, post-completion refinements
- The `@architect-unlock-reason` tag MUST provide a hyphenated justification:
  `@architect-unlock-reason:Bug-fix-for-token-expiry`

## ProcessGuard Rules

Level 3 conformant implementations MUST enforce at least these six rules:

### Rule 1: Completed-Protection

**Invariant:** Completed patterns cannot be modified without an unlock reason.

```
IF pattern.status == 'completed'
AND pattern has modifications
AND @architect-unlock-reason is NOT present
THEN REJECT with "completed pattern requires unlock-reason"
```

### Rule 2: Scope-Creep Detection

**Invariant:** Active patterns cannot have new deliverables or scope-expanding rules added.

```
IF pattern.status == 'active'
AND (new deliverables added OR new rules expand scope)
THEN REJECT with "scope creep on active pattern"
```

### Rule 3: Invalid-Status-Transition

**Invariant:** Status transitions must follow the FSM transition matrix.

```
IF status changes from A to B
AND transition(A, B) is NOT ALLOWED
THEN REJECT with "invalid transition from A to B"
```

### Rule 4: Session-Scope

**Invariant:** Work sessions operate within their declared scope.

```
IF session type is 'implement'
AND modifications target a pattern NOT in the session scope
THEN WARN with "modification outside session scope"
```

### Rule 5: Session-Excluded

**Invariant:** Patterns explicitly excluded from a session cannot be modified.

```
IF pattern is in session exclusion list
AND pattern has modifications
THEN REJECT with "pattern excluded from session"
```

### Rule 6: Deliverable-Removed

**Invariant:** Deliverables cannot be removed from active or completed patterns.

```
IF pattern.status IN ('active', 'completed')
AND a deliverable from the previous version is missing
THEN REJECT with "deliverable removed from active/completed pattern"
```

## Session Types

Sessions scope the work a human or AI agent performs. Three standard session types exist:

| Session Type | Purpose                             | Allowed Operations                                                             |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------ |
| `planning`   | Create or refine plan-level specs   | Create specs, modify roadmap patterns, update coordination docs                |
| `design`     | Create or refine design-level specs | Evolve specs, create stubs, add scenarios, modify roadmap patterns             |
| `implement`  | Write code from design-level specs  | Modify active patterns, update deliverable status, create implementation files |

### Session Context

Each session type produces a different **context bundle** — a curated set of information
optimized for the session's purpose:

| Session Type | Context Includes                                                            |
| ------------ | --------------------------------------------------------------------------- |
| `planning`   | Pattern metadata, dependencies, status (minimal)                            |
| `design`     | Spec content, stubs, dependencies with status, architecture position (full) |
| `implement`  | Deliverables, FSM state, dependency graph, test requirements (focused)      |

## Scope-Validate Pre-Flight

Before starting work on a pattern, implementations SHOULD run a pre-flight validation
that checks:

1. **Status readiness** — Is the pattern in a valid state for the session type?
2. **Dependency status** — Are all `@architect-depends-on` patterns completed?
3. **Blocker check** — Is anything blocking this pattern?
4. **Scope check** — Does the pattern have enough specification for the session type?

**Result categories:**

| Result    | Meaning                                            |
| --------- | -------------------------------------------------- |
| `PASS`    | All checks pass. Safe to proceed.                  |
| `BLOCKED` | Dependencies are incomplete. Cannot proceed.       |
| `WARN`    | Proceed with caution — some checks flagged issues. |

## Lifecycle Integration with Spec Evolution

The delivery lifecycle maps to spec evolution levels (§08):

| Lifecycle Phase | Spec Level                        | Status      | Protection   |
| --------------- | --------------------------------- | ----------- | ------------ |
| Planning        | Plan-level spec created           | `roadmap`   | None         |
| Design          | Design-level spec evolved         | `roadmap`   | None         |
| Implementation  | Code written from spec            | `active`    | Scope-locked |
| Completion      | All deliverables done, tests pass | `completed` | Hard-locked  |

The FSM status transitions as work progresses through the lifecycle. The spec file
evolves in parallel but the status tag in the spec header reflects the FSM state.
