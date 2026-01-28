@libar-docs-implements:ProcessGuardLinter
@behavior @process-guard @libar-docs-pattern:ProcessGuard
@libar-docs-product-area:Validation
Feature: Process Guard Linter
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

  Background:
    Given a process guard validation context

  # ==========================================================================
  # completed-protection Rule
  # ==========================================================================

  Rule: Completed files require unlock-reason to modify

    @happy-path @rule:completed-protection
    Scenario: Completed file with unlock-reason passes validation
      Given a file "specs/phase-14.feature" with status "completed"
      And the file has unlock-reason "Bug fix for critical issue"
      When the file is modified
      And validating changes
      Then validation passes
      And no violations are reported

    @rule:completed-protection
    Scenario: Completed file without unlock-reason fails validation
      Given a file "specs/phase-14.feature" with status "completed"
      And the file does not have unlock-reason
      When the file is modified
      And validating changes
      Then validation fails
      And violation "completed-protection" is reported for "specs/phase-14.feature"
      And the suggestion contains "unlock-reason"

    @edge-case @rule:completed-protection
    Scenario Outline: Protection levels and unlock requirement
      Given a file "specs/test.feature" with status "<status>"
      And the file does not have unlock-reason
      When the file is modified
      And validating changes
      Then completed-protection violation is expected "<expected>"

      Examples:
        | status    | expected |
        | completed | yes      |
        | active    | no       |
        | roadmap   | no       |
        | deferred  | no       |

  # ==========================================================================
  # invalid-status-transition Rule
  # ==========================================================================

  Rule: Status transitions must follow PDR-005 FSM

    @happy-path @rule:invalid-status-transition
    Scenario Outline: Valid transitions pass validation
      Given a file "specs/feature.feature" with status "<from>"
      When the status changes to "<to>"
      And validating changes
      Then no "invalid-status-transition" violation is reported

      Examples:
        | from     | to        |
        | roadmap  | active    |
        | roadmap  | deferred  |
        | active   | completed |
        | active   | roadmap   |
        | deferred | roadmap   |

    @rule:invalid-status-transition
    Scenario Outline: Invalid transitions fail validation
      Given a file "specs/feature.feature" with status "<from>"
      When the status changes to "<to>"
      And validating changes
      Then violation "invalid-status-transition" is reported for "specs/feature.feature"
      And the message contains "<from>"
      And the suggestion contains valid transitions

      Examples:
        | from      | to        |
        | roadmap   | completed |
        | deferred  | active    |
        | deferred  | completed |
        | completed | active    |
        | completed | roadmap   |
        | completed | deferred  |

  # ==========================================================================
  # scope-creep Rule
  # ==========================================================================

  Rule: Active specs cannot add new deliverables

    @happy-path @rule:scope-creep
    Scenario: Active spec with no deliverable changes passes
      Given a file "specs/active-phase.feature" with status "active"
      And the file has deliverables "Type definitions" and "Unit tests"
      When the file is modified without adding deliverables
      And validating changes
      Then no "scope-creep" violation is reported

    @rule:scope-creep
    Scenario: Active spec adding deliverable fails validation
      Given a file "specs/active-phase.feature" with status "active"
      And the file has deliverables "Type definitions"
      When the deliverable "New unplanned feature" is added
      And validating changes
      Then violation "scope-creep" is reported for "specs/active-phase.feature"
      And the message contains "New unplanned feature"

    @edge-case @rule:scope-creep
    Scenario: Roadmap spec can add deliverables freely
      Given a file "specs/roadmap-phase.feature" with status "roadmap"
      When the deliverable "Additional feature" is added
      And validating changes
      Then no "scope-creep" violation is reported

    @rule:scope-creep
    Scenario: Removing deliverable produces warning
      Given a file "specs/active-phase.feature" with status "active"
      And the file has deliverables "Type definitions" and "Unit tests"
      When the deliverable "Unit tests" is removed
      And validating changes
      Then warning "deliverable-removed" is reported for "specs/active-phase.feature"
      And the message contains "Unit tests"

    @happy-path @rule:scope-creep
    Scenario: Deliverable status change does not trigger scope-creep
      Given a file "specs/active-phase.feature" with status "active"
      And the file has deliverables "Type definitions"
      When the deliverable "Type definitions" status changes
      And validating changes
      Then no "scope-creep" violation is reported
      And no "deliverable-removed" warning is reported

    @happy-path @rule:scope-creep
    Scenario: Multiple deliverable status changes pass validation
      Given a file "specs/active-phase.feature" with status "active"
      And the file has deliverables "Type definitions" and "Unit tests"
      When the deliverables "Type definitions" and "Unit tests" status change
      And validating changes
      Then no "scope-creep" violation is reported
      And no "deliverable-removed" warning is reported

  # ==========================================================================
  # session-scope Rule
  # ==========================================================================

  Rule: Files outside active session scope trigger warnings

    @happy-path @rule:session-scope
    Scenario: File in session scope passes validation
      Given an active session "session-2026-01"
      And the session scopes specs "phase-44" and "phase-45"
      And a file "specs/phase-44.feature" with status "active"
      When the file is modified
      And validating changes
      Then no "session-scope" violation is reported

    @rule:session-scope
    Scenario: File outside session scope triggers warning
      Given an active session "session-2026-01"
      And the session scopes specs "phase-44"
      And a file "specs/phase-99.feature" with status "active"
      When the file is modified
      And validating changes
      Then warning "session-scope" is reported for "specs/phase-99.feature"

    @edge-case @rule:session-scope
    Scenario: No active session means all files in scope
      Given no active session
      And a file "specs/any-phase.feature" with status "active"
      When the file is modified
      And validating changes
      Then no "session-scope" violation is reported

    @rule:session-scope
    Scenario: ignoreSession flag suppresses session warnings
      Given an active session "session-2026-01"
      And the session scopes specs "phase-44"
      And a file "specs/phase-99.feature" with status "active"
      When the file is modified
      And validating changes with ignoreSession flag
      Then no "session-scope" violation is reported

  # ==========================================================================
  # session-excluded Rule
  # ==========================================================================

  Rule: Explicitly excluded files trigger errors

    @rule:session-excluded
    Scenario: Excluded file triggers error
      Given an active session "session-2026-01"
      And the session excludes specs "phase-legacy"
      And a file "specs/phase-legacy.feature" with status "roadmap"
      When the file is modified
      And validating changes
      Then violation "session-excluded" is reported for "specs/phase-legacy.feature"

    @happy-path @rule:session-excluded
    Scenario: Non-excluded file passes validation
      Given an active session "session-2026-01"
      And the session excludes specs "phase-legacy"
      And a file "specs/phase-44.feature" with status "active"
      When the file is modified
      And validating changes
      Then no "session-excluded" violation is reported

    @rule:session-excluded
    Scenario: ignoreSession flag suppresses excluded errors
      Given an active session "session-2026-01"
      And the session excludes specs "phase-legacy"
      And a file "specs/phase-legacy.feature" with status "roadmap"
      When the file is modified
      And validating changes with ignoreSession flag
      Then no "session-excluded" violation is reported

  # ==========================================================================
  # Combined Validation Scenarios
  # ==========================================================================

  Rule: Multiple rules validate independently

    @integration
    Scenario: Multiple violations from different rules
      Given a file "specs/completed.feature" with status "completed"
      And the file does not have unlock-reason
      And an active session "session-2026-01"
      And the session scopes specs "other-phase"
      When the file is modified
      And validating changes
      Then violation "completed-protection" is reported
      And warning "session-scope" is reported

    @integration
    Scenario: Strict mode promotes warnings to errors
      Given a file "specs/out-of-scope.feature" with status "active"
      And an active session "session-2026-01"
      And the session scopes specs "in-scope-phase"
      When the file is modified
      And validating changes with strict mode
      Then validation fails
      And violation "session-scope" is reported with severity "error"

    @happy-path @integration
    Scenario: Clean change produces empty violations
      Given a file "specs/roadmap.feature" with status "roadmap"
      And no active session
      When the file is modified
      And validating changes
      Then validation passes
      And no violations are reported
      And no warnings are reported
