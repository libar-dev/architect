@architect
@architect-pattern:BrokenSpecPattern
@architect-status:completed
Feature: Broken Spec Pattern

  Rule: Parse attribution

    Scenario: Unterminated docstring
      Given a broken feature source
      """
      missing closing docstring
