@architect
@architect-pattern:ChangelogProjectionExecutableTests
@architect-implements:ChangelogProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@delivery-reporting
Feature: Delivery Reporting changelog projection

  **Business Value:** Consumers receive a release-free changelog — the set of
  `completed` patterns in deterministic name order as a `RoadmapTimeline`
  milestones bundle — so downstream renderers can emit `CHANGELOG.md` without
  any release tag or completion date. Per ADR-013 the release axis and the
  completion-date field are retired; completion order lives in git, and
  releases, when first practiced, are git-tag-derived.

  Background:
    Given the Delivery Reporting changelog projection state is initialized

  Rule: The changelog is a release-free completed-patterns view

    **Invariant:** The root `RoadmapTimeline` carries `view: 'milestones'`,
    lists every `completed` pattern in name order, and reports overall status
    counts. There is no release grouping, no completion-date column, and the
    changelog never carries a child split.

    **Rationale:** A release tag and a completion date are denormalized git
    facts; baking them into the read model re-introduces temporal/historical
    state the read model must not carry. The changelog projects only live
    completion state, name-ordered for determinism.

    **Verified by:** the changelog lists completed patterns in name order with no children

    @acceptance-criteria
    Scenario: the changelog lists completed patterns in name order with no children
      Given a changelog projection context with completed and non-completed patterns
      When I project the changelog
      Then the changelog root lists only completed patterns in name order
      And the changelog root reports the completed count
      And the changelog has no child entries
