@architect
@architect-pattern:FSMTransitionsExecutableTests
@architect-status:active
@architect-implements:FSMValidator
@architect-product-area:Validation
@validation @fsm
Feature: FSM Transition Legality
  The FSM validator is the decider that gates lifecycle transitions across the
  delivery process. It encodes the four-state machine (roadmap → active →
  completed, with deferred as a parking state), preserves unknown status values
  verbatim instead of coercing them, guides authors toward legal alternatives
  for well-typed-but-illegal jumps, and derives protection level as a pure
  function of status. Completed is a settled end state, not a one-way trap:
  reopening it to active or roadmap is a first-class transition (PDR-006) so
  that legitimate maintenance on finished work is permitted rather than walled.

  Background:
    Given an FSM transition test context

  Rule: Lifecycle transitions follow the four-state FSM

    **Invariant:** validateTransition is valid only for roadmap→active, roadmap→deferred, active→completed, active→roadmap, deferred→roadmap, completed→active, and completed→roadmap; every other (from, to) over real status values is rejected. Completed is reopenable to active or roadmap but never settles into deferred and never re-enters itself.
    **Rationale:** The FSM encodes the delivery process — planning (roadmap) → implementation (active) → verified end state (completed), with deferred as a parking state re-entered via roadmap; skipping states would bypass the planning and scope gates the process guard keys off. Reopening completed to active/roadmap (PDR-006) lets finished work be revisited without faking status, while completed→deferred and completed→completed stay rejected because deferral and self-loops are not reopen paths.
    **Verified by:** Legal lifecycle transitions are accepted, Completed reopens to active or roadmap, Completed does not transition to deferred

    @function:validateTransition @happy-path
    Scenario: Legal lifecycle transitions are accepted
      Then the transition from "roadmap" to "active" is valid
      And the transition from "roadmap" to "deferred" is valid
      And the transition from "active" to "completed" is valid
      And the transition from "active" to "roadmap" is valid
      And the transition from "deferred" to "roadmap" is valid

    @function:validateTransition @happy-path
    Scenario: Completed reopens to active or roadmap
      Then the transition from "completed" to "active" is valid
      And the transition from "completed" to "roadmap" is valid

    @function:getValidTransitionsFrom
    Scenario: Completed reopen targets are active and roadmap
      When I request the valid transitions from "completed"
      Then the valid transitions are "active, roadmap"

    @function:validateTransition
    Scenario: Completed does not transition to deferred
      When I validate the transition from "completed" to "deferred"
      Then the transition result is invalid
      And the valid alternatives equal the valid transitions from "completed"

  Rule: Unknown status values are preserved, not coerced

    **Invariant:** validateTransition with a from or to value outside {roadmap, active, completed, deferred} returns valid:false echoing the raw value verbatim plus the canonical valid-values list, and isValidStatusValue distinguishes real status values from non-status tokens.
    **Rationale:** Silently casting a typo to a fake state hides author error; echoing the raw value verbatim makes the mistake diagnosable instead of swallowed.
    **Verified by:** An unknown source status is rejected verbatim, An unknown target status is rejected verbatim, isValidStatusValue separates real status values from non-status tokens

    @function:validateTransition
    Scenario: An unknown source status is rejected verbatim
      When I validate the transition from "candidate" to "active"
      Then the transition result is invalid
      And the transition source is echoed as "candidate"
      And the transition error is "Invalid source status 'candidate'. Valid values: roadmap, active, completed, deferred."

    @function:validateTransition
    Scenario: An unknown target status is rejected verbatim
      When I validate the transition from "roadmap" to "candidate"
      Then the transition result is invalid
      And the transition target is echoed as "candidate"
      And the transition error is "Invalid target status 'candidate'. Valid values: roadmap, active, completed, deferred."

    @function:isValidStatusValue
    Scenario: isValidStatusValue separates real status values from non-status tokens
      Then "active" is a valid status value
      And "candidate" is not a valid status value

  Rule: Illegal-but-typed transitions surface valid alternatives

    **Invariant:** a well-typed but illegal transition (e.g. roadmap→completed) returns valid:false with a directive error ("Must go through 'active' first") and validAlternatives equal to getValidTransitionsFrom(from).
    **Rationale:** The decider's errors must guide the author to the legal next step rather than only reporting failure.
    **Verified by:** An illegal but well-typed transition surfaces alternatives

    @function:validateTransition
    Scenario: An illegal but well-typed transition surfaces alternatives
      When I validate the transition from "roadmap" to "completed"
      Then the transition result is invalid
      And the transition error is "Cannot transition from 'roadmap' to 'completed'. Must go through 'active' first."
      And the valid alternatives equal the valid transitions from "roadmap"

  Rule: Protection level is a pure function of status

    **Invariant:** getProtectionLevel maps roadmap and deferred to none, active to scope, and completed to hard; isTerminalState is true if and only if the status is completed.
    **Rationale:** Protection level is what ProcessGuardDecider keys advisory enforcement off (completed→hard→reopen/edit warns and an unlock reason suppresses the warning; active→scope→adding pending scope warns); per PDR-006 these are warnings on the commit path, promotable to blocking only under --strict. The mapping must still be a stable total function of status.
    **Verified by:** Protection level is derived deterministically from status

    @function:getProtectionLevel @function:isTerminalState
    Scenario: Protection level is derived deterministically from status
      Then the protection level for "roadmap" is "none"
      And the protection level for "deferred" is "none"
      And the protection level for "active" is "scope"
      And the protection level for "completed" is "hard"
      And "completed" is a terminal state
      And "active" is not a terminal state
