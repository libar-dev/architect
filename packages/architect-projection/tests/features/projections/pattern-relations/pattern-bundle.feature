@architect
@architect-pattern:PatternBundleProjectionExecutableTests
@architect-implements:PatternBundleProjection
@architect-status:active
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Pattern bundle projection

  Background:
    Given the pattern bundle projection state is initialized

  Rule: Bundles compose summaries plus explicitly requested member blocks

    **Invariant:** The pattern bundle projection must compose the root pattern and its immediate members through existing projection seams, honoring explicit include blocks over mode defaults and never recursing past direct children.

    **Rationale:** Bundler consumers need one stable composite payload without re-deriving rules, open questions, or dependency relationships outside the projection layer.

    **Verified by:** projecting a bundle with explicit include blocks, mode defaults populate implement includes, rejecting an unknown bundle root

    Scenario: projecting a bundle with explicit include blocks
      Given a pattern bundle context with parent hierarchy
      When I project the pattern bundle for "ParentEpic" with explicit includes
      Then the bundle root should list the immediate members
      And the child bundle entries should include rules scenarios dependencies and open questions

    Scenario: mode defaults populate implement includes
      Given a pattern bundle context with parent hierarchy
      When I project the pattern bundle for "ParentEpic" in implement mode with token estimates
      Then the bundle root should use the implement default includes
      And the bundle token estimates should use the char/4 heuristic

    Scenario: rejecting an unknown bundle root
      Given a pattern bundle context with parent hierarchy
      When I project the pattern bundle for "UnknownParent" with explicit includes
      Then the pattern bundle projection fails with "Pattern not found: \"UnknownParent\""

  Rule: Review bundles surface a TS pattern's rules via the implementedBy edge

    **Invariant:** A review-mode bundle for a TypeScript pattern that owns no
    inline rules populates `blocks.rules` and `blocks.scenarios` from the rules
    authored on the feature pattern that realizes it, resolved through the
    derived `implementedBy` reverse edge.

    **Rationale:** The bundle sources rules through the feature-scoped rule set;
    reverse-trace through `implementedBy` means `bundle <TsPattern> --mode review`
    is no longer empty just because the focal node owns no rules (ADR-002).

    **Verified by:** review bundle for a TS pattern surfaces the realizing feature rules

    Scenario: review bundle for a TS pattern surfaces the realizing feature rules
      Given a pattern bundle context where a TS pattern is realized by a rule-owning feature
      When I project the review-mode pattern bundle for "ReverseTraceApi"
      Then the bundle root blocks should include the realizing feature's rules and scenarios
