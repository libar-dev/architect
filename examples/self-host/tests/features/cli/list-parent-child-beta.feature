@architect
@architect-pattern:ChildBeta
@architect-status:active
@architect-level:slice
@architect-parent:ParentEpic
@cli @pattern-graph-cli
Feature: Child Beta
  Package-host seed child for list --parent acceptance coverage.

  **Problem:** Beta still needs a rollout signal.

  **Open Questions:**
  - What beta rollout signal is durable?

  Rule: Beta scenarios remain visible

    **Invariant:** Bundle scenario extraction must preserve beta scenario names.

    **Verified by:** Beta child exists

  Scenario: Beta child exists
    Given another child pattern
    Then it is returned by its parent filter
