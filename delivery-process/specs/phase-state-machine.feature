@libar-docs
@libar-docs-pattern:PhaseStateMachineValidation
@libar-docs-status:completed
@libar-docs-unlock-reason:Add-libar-docs-opt-in-marker
@libar-docs-phase:100
@libar-docs-release:v1.0.0
@libar-docs-effort:4h
@libar-docs-product-area:Validation
@libar-docs-business-value:ensure-state-machine-rules-are-enforced-programmatically
@libar-docs-priority:high
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
      | FSM states and protection levels | complete | 123 | @libar-dev/delivery-process/src/validation/fsm/states.ts |
      | FSM transition matrix and validator | complete | 123 | @libar-dev/delivery-process/src/validation/fsm/transitions.ts |
      | Pure validation functions | complete | 123 | @libar-dev/delivery-process/src/validation/fsm/validator.ts |
      | Status validation lint rule | complete | 2190 | @libar-dev/delivery-process/src/lint/rules.ts |
      | ProcessStateAPI for programmatic queries | complete | 95 | @libar-dev/delivery-process/src/api/process-state.ts |

  Rule: Valid status values are enforced

    **Invariant:** Phase status must be one of the four canonical values: roadmap, active, completed, or deferred.
    **Rationale:** Freeform status strings bypass FSM transition enforcement and produce undefined behavior in downstream generators and validators.

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
        | active   | complete |
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
        | complete | active   |
        | complete | roadmap  |
        | roadmap   | completed|

  Rule: Terminal states require completion metadata

    **Invariant:** Phases reaching completed status must carry a completion date and actual effort tag.
    **Rationale:** Without completion metadata, effort variance tracking and timeline reporting produce gaps that undermine delivery process visibility.

    @acceptance-criteria
    Scenario: Completed status requires completion date
      Given a phase transitioning to "completed" status
      When the @libar-docs-completed tag is missing
      Then validation warns "Completed phases should have @libar-docs-completed date"

    @acceptance-criteria
    Scenario: Completed phases should have effort-actual
      Given a phase transitioning to "completed" status
      When the @libar-docs-effort-actual tag is missing
      Then validation warns "Completed phases should have @libar-docs-effort-actual for variance tracking"
