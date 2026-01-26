@behavior @fsm-validation
@libar-docs-pattern:FSMValidator
@libar-docs-product-area:Validation
Feature: Phase State Machine Validation
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

  # ==========================================================================
  # Status Validation
  # ==========================================================================

  Rule: Status values must be valid PDR-005 FSM states

    @happy-path
    Scenario Outline: Valid status values are accepted
      When validating status "<status>"
      Then validation passes
      And the validated status is "<status>"

      Examples:
        | status    |
        | roadmap   |
        | active    |
        | completed |
        | deferred  |

    @edge-case
    Scenario Outline: Invalid status values are rejected
      When validating status "<status>"
      Then validation fails
      And the error message contains "Invalid status"
      And the error message contains valid values list

      Examples:
        | status       |
        | done         |
        | in-progress  |
        | implemented  |
        | pending      |
        | wip          |

    @edge-case
    Scenario: Terminal state returns warning
      When validating status "completed"
      Then validation passes
      And warnings include "terminal state"

  # ==========================================================================
  # Transition Validation
  # ==========================================================================

  Rule: Status transitions must follow FSM rules

    @happy-path
    Scenario Outline: Valid transitions are accepted
      When validating transition from "<from>" to "<to>"
      Then transition is valid

      Examples:
        | from     | to        |
        | roadmap  | active    |
        | roadmap  | deferred  |
        | roadmap  | roadmap   |
        | active   | completed |
        | active   | roadmap   |
        | deferred | roadmap   |

    @edge-case
    Scenario Outline: Invalid transitions are rejected with alternatives
      When validating transition from "<from>" to "<to>"
      Then transition is invalid
      And the error message is provided
      And valid alternatives are provided

      Examples:
        | from      | to        |
        | roadmap   | completed |
        | deferred  | active    |
        | deferred  | completed |
        | completed | active    |
        | completed | roadmap   |
        | completed | deferred  |

    @edge-case
    Scenario: Terminal state has no valid transitions
      When validating transition from "completed" to "roadmap"
      Then transition is invalid
      And valid alternatives list is empty

    @edge-case
    Scenario: Invalid source status in transition
      When validating transition from "done" to "active"
      Then transition is invalid
      And the error message contains "Invalid source status"

    @edge-case
    Scenario: Invalid target status in transition
      When validating transition from "roadmap" to "done"
      Then transition is invalid
      And the error message contains "Invalid target status"

  # ==========================================================================
  # Completion Metadata Validation
  # ==========================================================================

  Rule: Completed patterns should have proper metadata

    @happy-path
    Scenario: Completed pattern with full metadata has no warnings
      Given a pattern with status "completed"
      And the pattern has completion date "2026-01-09"
      And the pattern has effort planned "4h"
      And the pattern has effort actual "3h"
      When validating completion metadata
      Then validation passes
      And there are no warnings

    @edge-case
    Scenario: Completed pattern without date shows warning
      Given a pattern with status "completed"
      When validating completion metadata
      Then validation passes
      And warnings include "missing @libar-docs-completed date"

    @edge-case
    Scenario: Completed pattern with planned but no actual effort shows warning
      Given a pattern with status "completed"
      And the pattern has completion date "2026-01-09"
      And the pattern has effort planned "4h"
      When validating completion metadata
      Then validation passes
      And warnings include "missing @libar-docs-effort-actual"

    @happy-path
    Scenario: Non-completed pattern skips metadata validation
      Given a pattern with status "roadmap"
      When validating completion metadata
      Then validation passes
      And there are no warnings

  # ==========================================================================
  # Protection Level Queries
  # ==========================================================================

  Rule: Protection levels match FSM state definitions

    @happy-path
    Scenario: Roadmap status has no protection
      When querying protection for status "roadmap"
      Then the protection level is "none"
      And deliverables can be added
      And unlock is not required

    @happy-path
    Scenario: Active status has scope protection
      When querying protection for status "active"
      Then the protection level is "scope"
      And deliverables cannot be added
      And unlock is not required

    @happy-path
    Scenario: Completed status has hard protection
      When querying protection for status "completed"
      Then the protection level is "hard"
      And deliverables cannot be added
      And unlock is required

    @happy-path
    Scenario: Deferred status has no protection
      When querying protection for status "deferred"
      Then the protection level is "none"
      And deliverables can be added
      And unlock is not required

  # ==========================================================================
  # Full Pattern Validation
  # ==========================================================================

  Rule: Combined validation provides complete results

    @happy-path
    Scenario: Valid completed pattern returns combined results
      Given a pattern with status "completed"
      And the pattern has completion date "2026-01-09"
      When validating pattern status
      Then status validation passes
      And completion validation passes
      And all warnings are collected
