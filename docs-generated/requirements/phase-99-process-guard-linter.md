# ✅ Process Guard Linter

**Purpose:** Detailed requirements for the Process Guard Linter feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DeliveryProcess |
| Business Value | prevent accidental scope creep and locked file modifications |
| Phase | 99 |

## Description

**Problem:**
  During planning and implementation sessions, accidental modifications occur:
  - Specs outside the intended scope get modified in bulk
  - Completed/approved work gets inadvertently changed
  - No enforcement boundary between "planning what to do" and "doing it"

  The delivery process has implicit states (planning, implementing) but no
  programmatic guard preventing invalid state transitions or out-of-scope changes.

  **Solution:**
  Implement a Decider-based linter that:
  1. Derives process state from existing file annotations (no separate state file)
  2. Validates proposed changes (git diff) against derived state
  3. Enforces file protection levels per PDR-005 state machine
  4. Supports explicit session scoping via session definition files
  5. Protects taxonomy from changes that would break protected specs

  **Design Principles:**
  - State is derived from annotations, not maintained separately
  - Decider logic is pure (no I/O), enabling unit testing
  - Integrates with existing lint infrastructure (`lint-process.ts`)
  - Warnings for soft rules, errors for hard rules
  - Escape hatch via `@libar-docs-unlock-reason` annotation

  **Relationship to PDR-005:**
  Uses the phase-state-machine FSM as protection levels:
  - `roadmap`: Fully editable, no restrictions (planning phase)
  - `active`: Scope-locked, errors on new deliverables (work in progress)
  - `completed`: Hard-locked, requires explicit unlock to modify
  - `deferred`: Fully editable, no restrictions (parked work)

## Acceptance Criteria

**Protection level from status**

- Given a feature file with @libar-docs-status:<status>
- When deriving protection level
- Then protection level is "<protection>"
- And modification restriction is "<restriction>"

**Completed file modification without unlock fails**

- Given a feature file with @libar-docs-status:completed
- When modifying the file without @libar-docs-unlock-reason
- Then linting fails with "completed-protection" violation
- And message is "Cannot modify completed spec without unlock reason"

**Completed file modification with unlock passes**

- Given a feature file with @libar-docs-status:completed
- Then linting passes
- And warning indicates "Modifying completed spec: Critical bug fix"

**Active file modification is allowed but scope-locked**

- Given a feature file with @libar-docs-status:active
- When modifying existing content
- Then linting passes
- But adding new deliverables triggers scope-creep violation

**Session file defines modification scope**

- Given a session file with @libar-docs-session-id:S-2026-01-09
- And session status is "active"
- And in-scope specs are:
- When deriving process state
- Then session "S-2026-01-09" is active
- And "mvp-workflow-implementation" is modifiable
- And "short-form-tag-migration" is review-only

| spec | intent |
| --- | --- |
| mvp-workflow-implementation | modify |
| short-form-tag-migration | review |

**Modifying spec outside active session scope warns**

- Given session "S-2026-01-09" is active with scoped specs:
- When modifying "phase-state-machine.feature"
- Then linting warns with "session-scope"
- And message contains "not in session scope"
- And suggestion is "Add to session scope or use --ignore-session flag"

| spec |
| --- |
| mvp-workflow-implementation |

**Modifying explicitly excluded spec fails**

- Given session "S-2026-01-09" explicitly excludes "cross-source-validation"
- When modifying "cross-source-validation.feature"
- Then linting fails with "session-excluded" violation
- And message is "Spec explicitly excluded from session S-2026-01-09"

**No active session allows all modifications**

- Given no session file exists with status "active"
- When modifying any spec file
- Then session scope rules do not apply
- And only protection level rules are checked

**Valid status transitions**

- Given a spec with current @libar-docs-status:<from>
- When changing status to <to>
- Then transition validation passes

**Invalid status transitions**

- Given a spec with current @libar-docs-status:<from>
- When changing status to <to>
- Then linting fails with "invalid-status-transition" violation
- And message indicates valid transitions from "<from>"

**Adding deliverable to active spec fails**

- Given a spec with @libar-docs-status:active
- And existing deliverables:
- When adding new deliverable "Task C"
- Then linting fails with "scope-creep" violation
- And message is "Cannot add deliverables to active spec"
- And suggestion is "Create new spec or revert to roadmap status"

| Deliverable | Status |
| --- | --- |
| Task A | complete |
| Task B | pending |

**Updating deliverable status in active spec passes**

- Given a spec with @libar-docs-status:active
- And existing deliverables:
- When changing Task A status to "Done"
- Then linting passes

| Deliverable | Status |
| --- | --- |
| Task A | pending |

**Removing deliverable from active spec warns**

- Given a spec with @libar-docs-status:active
- When removing a deliverable row
- Then linting warns with "deliverable-removed"
- And message is "Deliverable removed from active spec - was it completed or descoped?"

**Validate staged changes (pre-commit default)**

- When running "pnpm lint:process --staged"
- Then only git-staged files are validated
- And exit code is 1 if violations exist

**Validate all tracked files**

- When running "pnpm lint:process --all"
- Then all delivery-process files are validated
- And summary shows total violations and warnings

**Show derived state for debugging**

- When running "pnpm lint:process --show-state"
- Then output includes:

| Section | Content |
| --- | --- |
| Active Session | Session ID and status, or "none" |
| Scoped Specs | List of specs in scope |
| Protected Specs | Specs with active/completed status |

**Strict mode treats warnings as errors**

- When running "pnpm lint:process --staged --strict"
- Then warnings are promoted to errors
- And exit code is 1 if any warnings exist

**Ignore session flag bypasses session rules**

- Given an active session with limited scope
- When running "pnpm lint:process --staged --ignore-session"
- Then session scope rules are skipped
- And only protection level rules apply

**Output format matches lint-patterns**

- When lint-process reports violations
- Then output format is consistent with lint-patterns output
- And includes file path, rule name, message, and suggestion

**Can run alongside lint-patterns**

- When running "pnpm lint:all"
- Then both lint:patterns and lint:process execute
- And combined exit code reflects both results

**Session-related tags are recognized**

- Given the taxonomy includes session tags
- Then the following tags are valid:

| Tag | Format | Purpose |
| --- | --- | --- |
| session-id | value | Unique session identifier |
| session-status | enum | Session lifecycle: draft, active, closed |
| session-scope | flag | Marks file as session definition |

**Protection-related tags are recognized**

- Given the taxonomy includes protection tags
- Then the following tags are valid:

| Tag | Format | Purpose |
| --- | --- | --- |
| unlock-reason | quoted-value | Required to modify protected files |
| locked-by | value | Session ID that locked the file |

## Business Rules

**Protection levels determine modification restrictions**

Files inherit protection from their `@libar-docs-status` tag. Higher
    protection levels require explicit unlock to modify.

_Verified by: Protection level from status, Completed file modification without unlock fails, Completed file modification with unlock passes, Active file modification is allowed but scope-locked_

**Session definition files scope what can be modified**

Optional session files (`delivery-process/sessions/*.feature`) explicitly
    declare which specs are in-scope for modification during a work session.
    When active, modifications outside scope trigger warnings or errors.

_Verified by: Session file defines modification scope, Modifying spec outside active session scope warns, Modifying explicitly excluded spec fails, No active session allows all modifications_

**Status transitions follow PDR-005 FSM**

When a file's status changes, the transition must be valid per PDR-005.
    This extends phase-state-machine.feature to the linter context.

_Verified by: Valid status transitions, Invalid status transitions_

**Active specs cannot add new deliverables**

Once a spec transitions to `active`, its deliverables table is
    considered scope-locked. Adding new rows indicates scope creep.

_Verified by: Adding deliverable to active spec fails, Updating deliverable status in active spec passes, Removing deliverable from active spec warns_

**CLI provides flexible validation modes**

_Verified by: Validate staged changes (pre-commit default), Validate all tracked files, Show derived state for debugging, Strict mode treats warnings as errors, Ignore session flag bypasses session rules_

**Integrates with existing lint infrastructure**

_Verified by: Output format matches lint-patterns, Can run alongside lint-patterns_

**New tags support process guard functionality**

The following tags are defined in the TypeScript taxonomy to support process guard:

_Verified by: Session-related tags are recognized, Protection-related tags are recognized_

## Deliverables

- State derivation from annotations (complete)
- Git diff change detection (complete)
- Process Decider (pure validation) (complete)
- Protection level rules (complete)
- Session scope validation (complete)
- Taxonomy stability validation (complete)
- CLI integration (lint-process.ts) (complete)
- Pre-commit hook integration (complete)

## Implementations

Files that implement this pattern:

- [`decider.ts`](../../src/lint/process-guard/decider.ts) - :FSMValidator,DeriveProcessState,DetectChanges
- [`derive-state.ts`](../../src/lint/process-guard/derive-state.ts) - :GherkinScanner,FSMValidator
- [`detect-changes.ts`](../../src/lint/process-guard/detect-changes.ts) - ## DetectChanges - Git Diff Change Detection
- [`index.ts`](../../src/lint/process-guard/index.ts) - :FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider
- [`types.ts`](../../src/lint/process-guard/types.ts) - :FSMValidator

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
