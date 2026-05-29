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
  function of status.

  Background:
    Given an FSM transition test context

  Rule: Lifecycle transitions follow the four-state FSM

    **Invariant:** validateTransition is valid only for roadmap→active, roadmap→deferred, active→completed, active→roadmap, and deferred→roadmap; every other (from, to) over real status values is rejected, and completed is terminal with no outgoing transition.
    **Rationale:** The FSM encodes the delivery process — planning (roadmap) → implementation (active) → verified terminal (completed), with deferred as a parking state re-entered via roadmap; skipping states would bypass the planning and scope gates the process guard keys off.
    **Verified by:** Legal lifecycle transitions are accepted, Completed is terminal with no outgoing transition

    @function:validateTransition @happy-path
    Scenario: Legal lifecycle transitions are accepted
      Then the transition from "roadmap" to "active" is valid
      And the transition from "roadmap" to "deferred" is valid
      And the transition from "active" to "completed" is valid
      And the transition from "active" to "roadmap" is valid
      And the transition from "deferred" to "roadmap" is valid

    @function:getValidTransitionsFrom
    Scenario: Completed is terminal with no outgoing transition
      When I request the valid transitions from "completed"
      Then there are no valid transitions

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
    **Rationale:** Protection level is what ProcessGuardDecider keys enforcement off (completed→hard→unlock required; active→scope→no new deliverables); it must be a stable total function of status.
    **Verified by:** Protection level is derived deterministically from status

    @function:getProtectionLevel @function:isTerminalState
    Scenario: Protection level is derived deterministically from status
      Then the protection level for "roadmap" is "none"
      And the protection level for "deferred" is "none"
      And the protection level for "active" is "scope"
      And the protection level for "completed" is "hard"
      And "completed" is a terminal state
      And "active" is not a terminal state
