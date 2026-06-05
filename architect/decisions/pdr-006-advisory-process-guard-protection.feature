@architect
@architect-adr:006
@architect-adr-status:accepted
@architect-adr-category:process
@architect-adr-layer:refinement
@architect-adr-theme:coordination
@architect-pattern:PDR006AdvisoryProcessGuardProtection
@architect-status:completed
@architect-unlock-reason:Born-accepted-record-proven-by-the-advisory-guard-implementation-it-describes
@architect-product-area:Validation
@architect-uses:PDR005ProcessGuardFSM,ADR001TaxonomyCanonicalValues
Feature: PDR-006 - Process Guard Protection Is Advisory, Not Preventive

  **Context:**
  PDR-005 derives a protection level from each FSM state and ADR-001 Rule 3
  defines what each level forbids: an active spec is scope-locked (cannot add
  deliverables) and a completed spec is hard-locked (modification requires an
  unlock reason). Process Guard enforces these as commit-blocking errors, and
  the completed state has no valid outbound transition — reopening finished work
  requires hand-adding an unlock-reason tag per spec.

  In practice this walls legitimate work. Scope legitimately crystallizes
  during implementation, and small but important changes routinely require
  touching already-completed executable specs and their implementation. A hard
  commit-time block leaves only two ways forward, both worse than the change
  itself: revert the valuable work, or misreport deliverable status to satisfy
  the guard. An event-sourced read model is meant to describe state accurately;
  a block that incentivizes a status lie corrupts the model it was meant to
  protect.

  **Decision:**
  Process Guard protection is advisory at commit time for the lifecycle states
  that gate legitimate iterative work. The FSM still models the delivery
  lifecycle and still rejects malformed jumps, but the protection that guards
  active scope and completed work surfaces consequential changes as warnings
  rather than blocking them. Integrity comes from changes being visible and
  intentional, not from being walled.

  1. Reopening completed work is a first-class transition: completed to active
     and completed to roadmap are valid. Any number of completed specs may be
     reactivated in a single commit.

  2. Modifying or reopening a completed spec surfaces a warning, never a commit
     -blocking error. `@architect-unlock-reason` is optional: when supplied it
     records intent for the audit trail and suppresses the warning; when absent
     the guard warns but does not block.

  3. Expanding the scope of an active spec is advisory. Adding a deliverable
     whose status is pending surfaces a warning; adding a deliverable that
     records real progress (in-progress, complete, deferred, superseded, n/a) is
     silent; removing a deliverable warns. `@architect-unlock-reason` suppresses
     the warning. No deliverable change to an active spec blocks a commit.

  The advisory model is scoped to the protection that gates iterative work
  (completed reopen and active scope). It does not make the lifecycle permissive
  — genuinely malformed transitions remain rejected — and the opt-in --strict
  mode (used by CI, not the commit path) may still promote these warnings to
  blocking, per the PASS / BLOCKED / WARN severity model.

  This record states the decided model. The contradicting live claims — PDR-005's
  transition matrix and protection levels, and ADR-001 Rule 3 and Rule 4 — are
  brought into line with it in the same change that makes Process Guard advisory,
  so the read model holds one model, not two.

  **Consequences:**
  | Type | Impact |
  | Positive | Legitimate changes to completed work and active scope never force a revert or a status misreport |
  | Positive | Any number of completed specs can be reactivated in one commit without per-spec ceremony |
  | Positive | The unlock-reason tag remains a real audit signal, now opt-in rather than a friction wall |
  | Positive | The read model stays honest because reality reaches it instead of being blocked |
  | Negative | The commit-time guard no longer prevents scope expansion or completed-spec edits; visibility replaces prevention, and CI --strict is the remaining hard gate |

  Rule: Reopening completed work is a valid, advisory transition

    **Invariant:** completed to active and completed to roadmap are valid FSM
    transitions. Reopening or modifying a completed spec surfaces a warning, not
    a commit-blocking error. `@architect-unlock-reason` is optional and, when
    present, records intent and suppresses the warning.
    **Rationale:** Small, planned-related changes to finished work are normal
    maintenance, not process violations. A hard block forces reverting valuable
    work or faking status; a warning keeps the change visible and intentional
    while letting it land.
    **Verified by:** Completed spec reopens without blocking

    @acceptance-criteria @happy-path
    Scenario: Completed spec reopens without blocking
      Given a completed spec
      When its status is changed to active without an unlock reason
      Then the transition is permitted
      And the guard emits a warning rather than a blocking error

  Rule: Active-spec scope expansion is advisory

    **Invariant:** Adding a pending deliverable to an active spec emits a
    warning; adding a deliverable with a non-pending status is silent; removing a
    deliverable emits a warning. `@architect-unlock-reason` suppresses the
    warning. No deliverable change to an active spec blocks a commit.
    **Rationale:** Scope crystallizes during implementation. Surfacing the
    addition of unbuilt scope keeps it intentional; blocking it only invites a
    revert or a status lie. Recording real progress is reality and needs no
    signal.
    **Verified by:** Adding pending scope warns without blocking

    @acceptance-criteria @happy-path
    Scenario: Adding pending scope warns without blocking
      Given an active spec
      When a deliverable with status pending is added
      Then the guard emits a warning
      And the commit is not blocked
      And supplying an unlock reason suppresses the warning

  Rule: Advisory protection narrows visibility, not legality

    **Invariant:** The advisory model applies to the protection that gates
    iterative work (completed reopen, active scope). The FSM still rejects
    malformed transitions, and the opt-in --strict mode may promote advisory
    warnings to blocking using the PASS / BLOCKED / WARN severity model.
    **Rationale:** Advisory protection is not a permissive lifecycle. Keeping
    malformed jumps rejected preserves the FSM's meaning, and a strict CI lever
    costs nothing on the commit path while leaving a hard gate available.
    **Verified by:** Strict mode promotes advisory warnings

    @acceptance-criteria @validation
    Scenario: Strict mode promotes advisory warnings
      Given an advisory protection warning
      When the guard runs in --strict mode
      Then the warning is promoted to a blocking result
