@architect
@architect-pattern:EmptyEpic
@architect-status:active
@architect-level:epic
@cli @pattern-graph-cli
Feature: Empty Epic
  Package-host seed parent with no children for list --parent empty-result coverage.

  Scenario: Empty epic exists
    Given a parent epic without children
    Then parent-scoped list queries return an empty result
