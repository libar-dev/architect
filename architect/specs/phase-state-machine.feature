@architect
@architect-pattern:PhaseStateMachineValidation
@architect-status:completed
@architect-unlock-reason:Add-architect-opt-in-marker
@architect-phase:100
@architect-release:v1.0.0
@architect-effort:4h
@architect-product-area:Validation
@architect-business-value:ensure-state-machine-rules-are-enforced-programmatically
@architect-priority:high
Feature: Phase State Machine Validation

  **Problem:**
  Phase lifecycle state transitions are not enforced programmatically despite being documented in PROCESS_SETUP.md.
  Invalid transitions can occur silently, leading to inconsistent process state.

  **Solution:**
  Implement state machine validation that:
  - Validates all status transitions
  - Enforces required metadata for terminal states
  - Provides clear error messages for invalid transitions
  - Integrates with generators and linters

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | FSM states and protection levels | complete | 123 | @libar-dev/architect/src/validation/fsm/states.ts |
      | FSM transition matrix and validator | complete | 123 | @libar-dev/architect/src/validation/fsm/transitions.ts |
      | Pure validation functions | complete | 123 | @libar-dev/architect/src/validation/fsm/validator.ts |
      | Status validation lint rule | complete | 2190 | @libar-dev/architect/src/lint/rules.ts |
      | PatternGraphAPI for programmatic queries | complete | 95 | @libar-dev/architect/src/api/pattern-graph-api.ts |

  Rule: Valid status values are enforced

    **Invariant:** Phase status must be one of the four canonical values: roadmap, active, completed, or deferred.
    **Rationale:** Freeform status strings bypass FSM transition enforcement and produce undefined behavior in downstream generators and validators.
    **Verified by:** Only valid status values are accepted; Invalid status values are rejected

    @acceptance-criteria
    Scenario: Only valid status values are accepted
      Given a feature file with status tag
      When the status value is "roadmap", "active", "completed", or "deferred"
      Then validation passes

    @acceptance-criteria
    Scenario: Invalid status values are rejected
      Given a feature file with status tag
      When the status value is "done" or "in-progress"
      Then validation fails with "Invalid status: must be roadmap, active, completed, or deferred"

  Rule: Status transitions follow state machine rules

    **Invariant:** Every status transition must follow a permitted edge in the FSM transition matrix.
    **Rationale:** Skipping states (e.g., roadmap to completed) breaks scope-lock enforcement and allows incomplete deliverables to reach terminal status.
    **Verified by:** Scenario Outline: Valid transitions are allowed; Scenario Outline: Invalid transitions are rejected

    @acceptance-criteria
    Scenario Outline: Valid transitions are allowed
      Given a phase with current status "<from>"
      When transitioning to status "<to>"
      Then the transition is valid

      Examples:
        | from     | to        |
        | roadmap  | active    |
        | roadmap  | deferred  |
        | roadmap  | roadmap   |
        | active   | completed |
        | active   | roadmap   |
        | deferred | roadmap   |

    @acceptance-criteria
    Scenario Outline: Invalid transitions are rejected
      Given a phase with current status "<from>"
      When transitioning to status "<to>"
      Then the transition is rejected
      And error message indicates valid transitions from "<from>"

      Examples:
        | from      | to       |
        | completed | active   |
        | completed | roadmap  |
        | roadmap   | completed|

  Rule: Terminal states require completion metadata

    **Invariant:** Phases reaching completed status must carry a completion date and actual effort tag.
    **Rationale:** Without completion metadata, effort variance tracking and timeline reporting produce gaps that undermine delivery process visibility.
    **Verified by:** Completed status requires completion date; Completed phases should have effort-actual

    @acceptance-criteria
    Scenario: Completed status requires completion date
      Given a phase transitioning to "completed" status
      When the @architect-completed tag is missing
      Then validation warns "Completed phases should have @architect-completed date"

    @acceptance-criteria
    Scenario: Completed phases should have effort-actual
      Given a phase transitioning to "completed" status
      When the @architect-effort-actual tag is missing
      Then validation warns "Completed phases should have @architect-effort-actual for variance tracking"
