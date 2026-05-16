@architect
@architect-pattern:ParentEpic
@architect-status:active
@architect-level:epic
@cli @pattern-graph-cli
Feature: Parent Epic
  Package-host seed parent for list --parent acceptance coverage.

  **Problem:** Parent bundles should collapse child lookups into one query.

  **Solution:** Keep immediate child slices grouped under this epic.

  Scenario: Parent epic exists
    Given a parent epic
    Then child patterns can attach to it
