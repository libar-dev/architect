# 09 — Delivery Lifecycle

> **Architect Spec v0.2.0** — FSM states, transitions, protection levels, and ProcessGuard.

---

## Overview

The delivery lifecycle is a **finite state machine (FSM)** that governs how patterns
move from idea to completion. Toolchain implementations (Level 3) validate every state
transition, surface advisory warnings for consequential changes to active or completed
work, and may promote those warnings to blocking in strict CI mode.

## States

The FSM has five states across two tracks:

### Refinement Track

| State       | Meaning                                 | Protection Level |
| ----------- | --------------------------------------- | ---------------- |
| `candidate` | Idea under refinement, not yet accepted | None             |

### Delivery Track

| State       | Meaning                        | Protection Signal      |
| ----------- | ------------------------------ | ---------------------- |
| `roadmap`   | Accepted, planned for delivery | None                   |
| `active`    | Implementation in progress     | Advisory scope signal  |
| `completed` | Done, tested, delivered        | Advisory reopen signal |
| `deferred`  | Postponed indefinitely         | None                   |

## State Transition Diagram

```
  REFINEMENT                 DELIVERY

  candidate                  roadmap ──────────► active ──────────► completed
      │                          │                 │                 │
      │ acceptance               │                 ▼                 ├────────► active
      ├──────────────────────►   │              roadmap             └────────► roadmap
      │                          ▼
      │ rejection            deferred
      ▼                          │
   (deleted)                     │
                                 └─────────────────┘
                                   (regress, rare)
```

## Transition Matrix

| From \ To   | `candidate` | `roadmap`         | `active`         | `completed` | `deferred`  |
| ----------- | ----------- | ----------------- | ---------------- | ----------- | ----------- |
| `candidate` | —           | ALLOWED (accept)  | NOT ALLOWED      | NOT ALLOWED | NOT ALLOWED |
| `roadmap`   | NOT ALLOWED | —                 | ALLOWED          | NOT ALLOWED | ALLOWED     |
| `active`    | NOT ALLOWED | ALLOWED (regress) | —                | ALLOWED     | NOT ALLOWED |
| `completed` | NOT ALLOWED | ALLOWED (reopen)  | ALLOWED (reopen) | —           | NOT ALLOWED |
| `deferred`  | NOT ALLOWED | ALLOWED           | NOT ALLOWED      | NOT ALLOWED | —           |

**Transition rules:**

1. **candidate → roadmap** — Acceptance gate. Open questions resolved, full tag set applied, deliverables defined.
2. **candidate → (deleted)** — Rejection. Spec is deleted (version control preserves history).
3. **roadmap → active** — Work begins. Deliverables and scope are established.
4. **active → completed** — All deliverables are done. Design spec deleted, executable spec exists.
5. **roadmap → deferred** — Feature is postponed. Can return to roadmap later.
6. **deferred → roadmap** — Deferred feature is re-activated for planning.
7. **active → roadmap** — Regression. Work is abandoned and the pattern returns to planning. (SHOULD be rare and justified.)
8. **completed → active / roadmap** — Advisory reopen path. The transition is valid, warns by default, and `@architect-unlock-reason` optionally records intent and suppresses the warning.

## Protection Signals

Each state has an associated protection signal that determines whether ProcessGuard stays
silent, warns, or rejects the change.

### None (roadmap, deferred)

No protection. Any field, tag, or structural element can be modified freely.

### Advisory Scope Signal (`active`)

Scope changes stay visible without blocking legitimate implementation drift:

- **ALLOWED:** Modifying existing rules, scenarios, and deliverables
- **ALLOWED:** Updating deliverable status from `pending` to `in-progress` to `complete`
- **ALLOWED:** Adding scenarios within existing rules
- **WARNS:** Adding new pending deliverables (scope expansion)
- **WARNS:** Adding new rules that expand scope
- **NOT ALLOWED:** Changing the pattern's bounded context or architecture layer

### Advisory Reopen Signal (`completed`)

Completed work may be reopened deliberately:

- **WARNS:** Reopening or editing completed work without `@architect-unlock-reason`
- **ALLOWED:** Bug fixes, typo corrections, post-completion refinements
- The `@architect-unlock-reason` tag MAY provide a hyphenated justification that suppresses the advisory warning:
  `@architect-unlock-reason:Bug-fix-for-token-expiry`

## ProcessGuard Rules

Level 3 conformant implementations MUST enforce at least these six rules:

### Rule 1: Completed-Protection

**Invariant:** Reopening or editing completed patterns is advisory. The guard warns when `@architect-unlock-reason` is absent and stays silent when it is present.

```
IF pattern.status == 'completed'
AND pattern has modifications
AND @architect-unlock-reason is NOT present
THEN WARN with "completed pattern changed without unlock-reason"
```

### Rule 2: Scope-Creep Detection

**Invariant:** Active patterns surface scope expansion as a warning, not a block.

```
IF pattern.status == 'active'
AND (new deliverables added OR new rules expand scope)
THEN WARN with "scope creep on active pattern"
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

**Invariant:** Deliverable removal from active or completed patterns surfaces a warning.

```
IF pattern.status IN ('active', 'completed')
AND a deliverable from the previous version is missing
THEN WARN with "deliverable removed from active/completed pattern"
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
2. **Dependency status** — Are all `@architect-uses` patterns completed?
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

| Lifecycle Phase | Spec Level                        | Status      | Protection Signal      |
| --------------- | --------------------------------- | ----------- | ---------------------- |
| Planning        | Plan-level spec created           | `roadmap`   | None                   |
| Design          | Design-level spec evolved         | `roadmap`   | None                   |
| Implementation  | Code written from spec            | `active`    | Advisory scope signal  |
| Completion      | All deliverables done, tests pass | `completed` | Advisory reopen signal |

The FSM status transitions as work progresses through the lifecycle. The spec file
evolves in parallel but the status tag in the spec header reflects the FSM state.
