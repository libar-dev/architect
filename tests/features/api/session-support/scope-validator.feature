@libar-docs
@libar-docs-pattern:ScopeValidatorTests
@libar-docs-status:active
Feature: Scope Validator - Pre-flight Session Readiness Checks

  **Problem:**
  Starting an implementation or design session without checking prerequisites
  wastes time when blockers are discovered mid-session.

  **Solution:**
  ScopeValidator runs composable checks and aggregates results into a verdict
  (ready, blocked, or warnings) before a session starts.

  Rule: Implementation scope validation checks all prerequisites

    @acceptance-criteria @happy-path
    Scenario: All implementation checks pass
      Given a pattern with all implementation prerequisites met
      When validating scope for implement session
      Then the verdict is "ready"
      And all checks have severity PASS

    @acceptance-criteria @validation
    Scenario: Incomplete dependency blocks implementation
      Given a pattern depending on an incomplete dependency
      When validating scope for implement session
      Then the verdict is "blocked"
      And the dependencies check shows BLOCKED

    @acceptance-criteria @validation
    Scenario: FSM transition from completed blocks implementation
      Given a pattern with completed status
      When validating scope for implement session
      Then the verdict is "blocked"
      And the FSM check shows BLOCKED

    @acceptance-criteria @edge-case
    Scenario: Missing PDR references produce WARN
      Given a pattern with no stubs or PDR references
      When validating scope for implement session
      Then the design decisions check shows WARN
      And the verdict is not blocked

    @acceptance-criteria @edge-case
    Scenario: No deliverables blocks implementation
      Given a pattern with no deliverables defined
      When validating scope for implement session
      Then the deliverables check shows BLOCKED

  Rule: Design scope validation checks dependency stubs

    @acceptance-criteria @happy-path
    Scenario: Design session with no dependencies passes
      Given a pattern with no dependencies
      When validating scope for design session
      Then the verdict is "ready"

  Rule: Formatter produces structured text output

    @acceptance-criteria @happy-path
    Scenario: Formatter produces markers per ADR-008
      Given a scope validation result for pattern TestPattern
      When formatting the scope validation result
      Then the output contains the scope validation header
      And the output contains the checklist marker
      And the output contains the verdict marker
