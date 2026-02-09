# ProcessGuard

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### How It Works

Process Guard implements 7 validation rules:

    | Rule ID | Severity | What It Checks |
    | completed-protection | error | Completed specs require unlock reason |
    | invalid-status-transition | error | Transitions must follow FSM |
    | scope-creep | error | Active specs cannot add deliverables |
    | session-excluded | error | Cannot modify excluded files |
    | missing-relationship-target | warning | Relationship target must exist |
    | session-scope | warning | File outside session scope |
    | deliverable-removed | warning | Deliverable was removed |

    The linter runs as a pre-commit hook via Husky.
    See `.husky/pre-commit` for the hook configuration.

    Pre-commit: `npx lint-process --staged`
    CI pipeline: `npx lint-process --all --strict`

### Protection Levels

| status | protection | restriction |
| --- | --- | --- |
| roadmap | none | Fully editable |
| deferred | none | Fully editable |
| active | scope | Errors on new deliverables |
| complete | hard | Requires @libar-docs-unlock-reason |

### Valid Transitions

| from | to |
| --- | --- |
| roadmap | active |
| roadmap | deferred |
| active | complete |
| active | roadmap |
| deferred | roadmap |
| roadmap | roadmap |

| from | to |
| --- | --- |
| roadmap | complete |
| deferred | active |
| deferred | complete |
| complete | active |
| complete | roadmap |
| complete | deferred |

### API Types

- `ProcessGuardRule` - type
- `DeciderInput` - interface
- `ValidationResult` - interface
- `ProcessViolation` - interface
- `FileState` - interface

### Decider API

- `validateChanges` - function

### Error Messages

| Error Code |
|---|
| completed-protection |
| invalid-status-transition |
| scope-creep |
| deliverable-removed |
| session-scope |
| session-excluded |
