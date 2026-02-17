@libar-docs
@libar-docs-pattern:ScopeValidatorTests
@libar-docs-status:completed
@libar-docs-product-area:DataAPI
Feature: Scope Validator - Pre-flight Session Readiness Checks

  **Problem:**
  Starting an implementation or design session without checking prerequisites
  wastes time when blockers are discovered mid-session.

  **Solution:**
  ScopeValidator runs composable checks and aggregates results into a verdict
  (ready, blocked, or warnings) before a session starts.

  Rule: Implementation scope validation checks all prerequisites

    **Invariant:** Implementation scope validation must check FSM transition validity, dependency completeness, PDR references, and deliverable presence, with strict mode promoting warnings to blockers.
    **Rationale:** Starting implementation without passing scope validation wastes an entire session — the validator catches all known blockers before any code is written.
    **Verified by:** All implementation checks pass, Incomplete dependency blocks implementation, FSM transition from completed blocks implementation, Missing PDR references produce WARN, No deliverables blocks implementation, Strict mode promotes WARN to BLOCKED, Pattern not found throws error

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

    @acceptance-criteria @edge-case
    Scenario: Strict mode promotes WARN to BLOCKED
      Given a pattern with warnings but no blockers
      When validating scope with strict mode
      Then the verdict is "blocked"
      And warnings are promoted to BLOCKED severity

    @acceptance-criteria @error-handling
    Scenario: Pattern not found throws error
      Given no patterns in the dataset
      When validating scope for a nonexistent pattern
      Then a PATTERN_NOT_FOUND error is thrown

  Rule: Design scope validation checks dependency stubs

    **Invariant:** Design scope validation must verify that dependencies have corresponding code stubs, producing warnings when stubs are missing.
    **Rationale:** Design sessions that reference unstubbed dependencies cannot produce actionable interfaces — stub presence indicates the dependency's API surface is at least sketched.
    **Verified by:** Design session with no dependencies passes, Design session with dependencies lacking stubs produces WARN

    @acceptance-criteria @happy-path
    Scenario: Design session with no dependencies passes
      Given a pattern with no dependencies
      When validating scope for design session
      Then the verdict is "ready"

    @acceptance-criteria @edge-case
    Scenario: Design session with dependencies lacking stubs produces WARN
      Given a pattern with dependencies that have no stubs
      When validating scope for design session
      Then the stubs check shows WARN
      And the blocker names include the dependency without stubs

  Rule: Formatter produces structured text output

    **Invariant:** The scope validator formatter must produce structured text with ADR-008 markers, showing verdict text for warnings and blocker details for blocked verdicts.
    **Rationale:** Structured formatter output enables the CLI to display verdicts consistently — unstructured output would vary by validation type and be hard to parse.
    **Verified by:** Formatter produces markers per ADR-008, Formatter shows warnings verdict text, Formatter shows blocker details for blocked verdict

    @acceptance-criteria @happy-path
    Scenario: Formatter produces markers per ADR-008
      Given a scope validation result for pattern TestPattern
      When formatting the scope validation result
      Then the output contains the scope validation header
      And the output contains the checklist marker
      And the output contains the verdict marker

    @acceptance-criteria @edge-case
    Scenario: Formatter shows warnings verdict text
      Given a scope validation result with warnings but no blockers
      When formatting the scope validation result
      Then the output contains READY with warning count

    @acceptance-criteria @edge-case
    Scenario: Formatter shows blocker details for blocked verdict
      Given a scope validation result with blockers
      When formatting the scope validation result
      Then the output contains BLOCKED in the verdict section
      And the output lists each blocker with its detail
