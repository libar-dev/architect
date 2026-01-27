@libar-docs-pattern:ProcessGuardLinter
@libar-docs-status:completed
@libar-docs-phase:99
@libar-docs-effort:1d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:prevent-accidental-scope-creep-and-locked-file-modifications
@libar-docs-priority:high
Feature: Process Guard Linter

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

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | State derivation from annotations | Pending | src/lint/process-guard/derive-state.ts |
      | Git diff change detection | Pending | src/lint/process-guard/detect-changes.ts |
      | Process Decider (pure validation) | Pending | src/lint/process-guard/decider.ts |
      | Protection level rules | Pending | src/lint/process-guard/rules/ |
      | Session scope validation | Pending | src/lint/process-guard/rules/session-scope.ts |
      | Taxonomy stability validation | Pending | src/lint/process-guard/rules/taxonomy-stability.ts |
      | CLI integration (lint-process.ts) | Pending | src/cli/lint-process.ts |
      | Pre-commit hook integration | Pending | docs |

  # ============================================================================
  # PROTECTION LEVELS
  # ============================================================================

  Rule: Protection levels determine modification restrictions

    Files inherit protection from their `@libar-docs-status` tag. Higher
    protection levels require explicit unlock to modify.

    @acceptance-criteria
    Scenario Outline: Protection level from status
      Given a feature file with @libar-docs-status:<status>
      When deriving protection level
      Then protection level is "<protection>"
      And modification restriction is "<restriction>"

      Examples:
        | status    | protection | restriction                          |
        | roadmap   | none       | Fully editable                       |
        | deferred  | none       | Fully editable                       |
        | active    | scope      | Errors on new deliverables           |
        | completed | hard       | Requires @libar-docs-unlock-reason   |

    @acceptance-criteria
    Scenario: Completed file modification without unlock fails
      Given a feature file with @libar-docs-status:completed
      When modifying the file without @libar-docs-unlock-reason
      Then linting fails with "completed-protection" violation
      And message is "Cannot modify completed spec without unlock reason"

    @acceptance-criteria
    Scenario: Completed file modification with unlock passes
      Given a feature file with @libar-docs-status:completed
      Then linting passes
      And warning indicates "Modifying completed spec: Critical bug fix"

    @acceptance-criteria
    Scenario: Active file modification is allowed but scope-locked
      Given a feature file with @libar-docs-status:active
      When modifying existing content
      Then linting passes
      But adding new deliverables triggers scope-creep violation

  # ============================================================================
  # SESSION SCOPE ENFORCEMENT
  # ============================================================================

  Rule: Session definition files scope what can be modified

    Optional session files (`delivery-process/sessions/*.feature`) explicitly
    declare which specs are in-scope for modification during a work session.
    When active, modifications outside scope trigger warnings or errors.

    @acceptance-criteria
    Scenario: Session file defines modification scope
      Given a session file with @libar-docs-session-id:S-2026-01-09
      And session status is "active"
      And in-scope specs are:
        | spec                              | intent |
        | mvp-workflow-implementation       | modify |
        | short-form-tag-migration          | review |
      When deriving process state
      Then session "S-2026-01-09" is active
      And "mvp-workflow-implementation" is modifiable
      And "short-form-tag-migration" is review-only

    @acceptance-criteria
    Scenario: Modifying spec outside active session scope warns
      Given session "S-2026-01-09" is active with scoped specs:
        | spec                         |
        | mvp-workflow-implementation  |
      When modifying "phase-state-machine.feature"
      Then linting warns with "session-scope"
      And message contains "not in session scope"
      And suggestion is "Add to session scope or use --ignore-session flag"

    @acceptance-criteria
    Scenario: Modifying explicitly excluded spec fails
      Given session "S-2026-01-09" explicitly excludes "cross-source-validation"
      When modifying "cross-source-validation.feature"
      Then linting fails with "session-excluded" violation
      And message is "Spec explicitly excluded from session S-2026-01-09"

    @acceptance-criteria
    Scenario: No active session allows all modifications
      Given no session file exists with status "active"
      When modifying any spec file
      Then session scope rules do not apply
      And only protection level rules are checked

  # ============================================================================
  # STATUS TRANSITION VALIDATION
  # ============================================================================

  Rule: Status transitions follow PDR-005 FSM

    When a file's status changes, the transition must be valid per PDR-005.
    This extends phase-state-machine.feature to the linter context.

    @acceptance-criteria
    Scenario Outline: Valid status transitions
      Given a spec with current @libar-docs-status:<from>
      When changing status to <to>
      Then transition validation passes

      Examples:
        | from     | to        |
        | roadmap  | active    |
        | roadmap  | deferred  |
        | active   | completed |
        | active   | roadmap   |
        | deferred | roadmap   |
        | roadmap  | roadmap   |

    @acceptance-criteria
    Scenario Outline: Invalid status transitions
      Given a spec with current @libar-docs-status:<from>
      When changing status to <to>
      Then linting fails with "invalid-status-transition" violation
      And message indicates valid transitions from "<from>"

      Examples:
        | from      | to        |
        | roadmap   | completed |
        | deferred  | active    |
        | deferred  | completed |
        | completed | active    |
        | completed | roadmap   |
        | completed | deferred  |

  # ============================================================================
  # DELIVERABLE INTEGRITY
  # ============================================================================

  Rule: Active specs cannot add new deliverables

    Once a spec transitions to `active`, its deliverables table is
    considered scope-locked. Adding new rows indicates scope creep.

    @acceptance-criteria
    Scenario: Adding deliverable to active spec fails
      Given a spec with @libar-docs-status:active
      And existing deliverables:
        | Deliverable | Status |
        | Task A      | Done   |
        | Task B      | Pending |
      When adding new deliverable "Task C"
      Then linting fails with "scope-creep" violation
      And message is "Cannot add deliverables to active spec"
      And suggestion is "Create new spec or revert to roadmap status"

    @acceptance-criteria
    Scenario: Updating deliverable status in active spec passes
      Given a spec with @libar-docs-status:active
      And existing deliverables:
        | Deliverable | Status |
        | Task A      | Pending |
      When changing Task A status to "Done"
      Then linting passes

    @acceptance-criteria
    Scenario: Removing deliverable from active spec warns
      Given a spec with @libar-docs-status:active
      When removing a deliverable row
      Then linting warns with "deliverable-removed"
      And message is "Deliverable removed from active spec - was it completed or descoped?"

  # ============================================================================
  # CLI INTERFACE
  # ============================================================================

  Rule: CLI provides flexible validation modes

    @acceptance-criteria
    Scenario: Validate staged changes (pre-commit default)
      When running "pnpm lint:process --staged"
      Then only git-staged files are validated
      And exit code is 1 if violations exist

    @acceptance-criteria
    Scenario: Validate all tracked files
      When running "pnpm lint:process --all"
      Then all delivery-process files are validated
      And summary shows total violations and warnings

    @acceptance-criteria
    Scenario: Show derived state for debugging
      When running "pnpm lint:process --show-state"
      Then output includes:
        | Section | Content |
        | Active Session | Session ID and status, or "none" |
        | Scoped Specs | List of specs in scope |
        | Protected Specs | Specs with active/completed status |

    @acceptance-criteria
    Scenario: Strict mode treats warnings as errors
      When running "pnpm lint:process --staged --strict"
      Then warnings are promoted to errors
      And exit code is 1 if any warnings exist

    @acceptance-criteria
    Scenario: Ignore session flag bypasses session rules
      Given an active session with limited scope
      When running "pnpm lint:process --staged --ignore-session"
      Then session scope rules are skipped
      And only protection level rules apply

  # ============================================================================
  # INTEGRATION
  # ============================================================================

  Rule: Integrates with existing lint infrastructure

    @acceptance-criteria
    Scenario: Output format matches lint-patterns
      When lint-process reports violations
      Then output format is consistent with lint-patterns output
      And includes file path, rule name, message, and suggestion

    @acceptance-criteria
    Scenario: Can run alongside lint-patterns
      When running "pnpm lint:all"
      Then both lint:patterns and lint:process execute
      And combined exit code reflects both results

  # ============================================================================
  # TAG REGISTRY EXTENSIONS
  # ============================================================================

  Rule: New tags support process guard functionality

    The following tags are defined in the TypeScript taxonomy to support process guard:

    @acceptance-criteria
    Scenario: Session-related tags are recognized
      Given the taxonomy includes session tags
      Then the following tags are valid:
        | Tag | Format | Purpose |
        | session-id | value | Unique session identifier |
        | session-status | enum | Session lifecycle: draft, active, closed |
        | session-scope | flag | Marks file as session definition |

    @acceptance-criteria
    Scenario: Protection-related tags are recognized
      Given the taxonomy includes protection tags
      Then the following tags are valid:
        | Tag | Format | Purpose |
        | unlock-reason | quoted-value | Required to modify protected files |
        | locked-by | value | Session ID that locked the file |
