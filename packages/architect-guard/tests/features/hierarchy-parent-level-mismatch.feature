Feature: hierarchy-parent-level-mismatch lint rule

  Wave 2.5 narrowed @architect-parent to the hierarchy axis. The rule
  rejects @architect-parent X where X does not carry @architect-level at
  a strictly higher level than the declarer.

  Rule: Parent target must carry @architect-level at strictly higher level

    Scenario: Positive — task points at epic parent
      Given a directive with parent target "RootEpic" and no declarer level
      And the registry maps "RootEpic" to level "epic"
      When I run the hierarchy-parent-level-mismatch check
      Then no violation is reported

    Scenario: Negative — task points at sibling task
      Given a directive with parent target "SiblingTask" and no declarer level
      And the registry maps "SiblingTask" to level "task"
      When I run the hierarchy-parent-level-mismatch check
      Then one hierarchy-parent-level-mismatch violation is reported
