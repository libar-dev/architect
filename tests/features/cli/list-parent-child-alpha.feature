@architect
@architect-pattern:ChildAlpha
@architect-status:active
@architect-level:slice
@architect-parent:ParentEpic
@architect-uses:ChildBeta
@cli @pattern-graph-cli
Feature: Child Alpha
  Package-host seed child for list --parent acceptance coverage.

  **Problem:** Alpha needs a delivery owner.

  **Open Questions:**
  - Who owns the alpha follow-up?
  - Which signal closes the alpha gap?

  Rule: Alpha bundle data stays grouped

    **Invariant:** Alpha bundle data must keep its open questions and dependencies together.

    **Verified by:** Alpha child exists

  Scenario: Alpha child exists
    Given a child pattern
    Then it is returned by its parent filter
