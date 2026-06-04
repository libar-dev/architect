@architect
@architect-adr:005
@architect-adr-status:accepted
@architect-adr-category:process
@architect-adr-layer:foundation
@architect-adr-theme:coordination
@architect-pattern:PDR005ProcessGuardFSM
@architect-status:completed
@architect-unlock-reason:Backfill-adr-layer-and-theme-classification-tags
@architect-product-area:Validation
@architect-uses:ADR001TaxonomyCanonicalValues
Feature: PDR-005 - Process Guard FSM and Protection Levels

  **Context:**
  ProcessGuard, validation docs, and CLI guidance all refer to a shared delivery
  workflow FSM with status-based protection levels, but the repo never captured
  that decision record explicitly.

  **Decision:**
  The delivery workflow uses a four-state FSM (`roadmap`, `active`, `completed`,
  `deferred`) with protection derived from state. `candidate` remains outside the
  FSM and is handled as a promotion gate ahead of ProcessGuard enforcement.

  Rule: Delivery statuses follow one four-state FSM

    **Invariant:** Only `roadmap`, `active`, `completed`, and `deferred` are FSM
    states, and only the canonical transitions between them are valid.
    **Rationale:** The FSM is the enforcement contract shared by ProcessGuard,
    CLI guidance, and delivery-state validation; widening it ad hoc would blur the
    boundary between candidate promotion and delivery execution.
    **Verified by:** Canonical transition matrix remains stable

    @acceptance-criteria @validation
    Scenario Outline: Canonical transition matrix remains stable
      Given a delivery pattern with status "<from>"
      When ProcessGuard evaluates a transition to "<to>"
      Then the transition is "<verdict>"

      Examples:
        | from      | to        | verdict |
        | roadmap   | active    | valid   |
        | roadmap   | deferred  | valid   |
        | active    | completed | valid   |
        | active    | roadmap   | valid   |
        | deferred  | roadmap   | valid   |
        | completed | roadmap   | invalid |

  Rule: Protection levels are derived from FSM state

    **Invariant:** `roadmap` and `deferred` are fully editable, `active` is
    scope-locked, and `completed` is hard-locked until an explicit unlock reason
    is supplied.
    **Rationale:** Protection must be deterministic from status so the CLI,
    ProcessGuard, and docs describe the same contract without per-surface rules.
    **Verified by:** Protection level follows status

    @acceptance-criteria @happy-path
    Scenario Outline: Protection level follows status
      Given a delivery pattern with status "<status>"
      When protection is derived from the FSM state
      Then the protection level is "<protection>"

      Examples:
        | status    | protection |
        | roadmap   | none       |
        | active    | scope      |
        | completed | hard       |
        | deferred  | none       |

  Rule: Candidate promotion is outside the FSM

    **Invariant:** `candidate` is accepted at extraction and projection
    boundaries but is not an FSM state; candidate-to-roadmap remains a promotion
    gate evaluated separately from the FSM transition matrix.
    **Rationale:** Promotion and delivery execution have different enforcement
    semantics; keeping candidate outside the FSM avoids a fake fifth transition
    state and preserves the delivery-only protection model.
    **Verified by:** Candidate promotion stays outside ProcessGuard FSM

    @acceptance-criteria @validation
    Scenario: Candidate promotion stays outside ProcessGuard FSM
      Given a candidate pattern that is ready for roadmap promotion
      When the delivery FSM is evaluated
      Then candidate is not treated as an FSM state
      And promotion validation happens before FSM enforcement
