@architect
@architect-pattern:OpenQuestionListProjectionExecutableTests
@architect-implements:OpenQuestionListProjection
@architect-status:active
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Open question list projection

  Background:
    Given the open question list projection state is initialized

  Rule: Open questions are omitted unless real normalized prose exists

    **Invariant:** The open-question list projection reads already-normalized pattern descriptions, extracts the `**Open Questions[...]:**` section (tolerating a qualifier between the label and the colon), reuses strict parent filtering, and omits patterns with no questions. With `--include-self` the focal parent's own questions are emitted alongside its descendants'.

    **Rationale:** CLI and MCP consumers need a machine-readable design-gap surface without reparsing raw Gherkin or returning placeholder empty rows; epic-level gating questions (authored under a qualified heading, on the parent itself) must be reachable, not silently dropped.

    **Verified by:** projecting all open questions (incl. a qualified heading), parent-filtering open questions, including the focal parent's own questions with include-self, returning an empty list for a parent without questioned descendants, rejecting an unknown parent

    Scenario: projecting all open questions
      Given an open question context with parent hierarchy
      When I project open questions without filters
      Then the open question list includes only patterns with real questions

    Scenario: parent-filtering open questions
      Given an open question context with parent hierarchy
      When I project open questions for parent "ParentEpic"
      Then the open question list includes only questioned descendants of "ParentEpic"

    Scenario: including the focal parent own questions with include-self
      Given an open question context with parent hierarchy
      When I project open questions for parent "ParentEpic" including self
      Then the open question list includes "ParentEpic" alongside its questioned descendants

    Scenario: returning an empty list for a parent without questioned descendants
      Given an open question context with parent hierarchy
      When I project open questions for parent "EmptyEpic"
      Then the open question list is empty

    Scenario: rejecting an unknown parent
      Given an open question context with parent hierarchy
      When I project open questions for parent "UnknownParent"
      Then the open question projection fails with "Parent pattern not found: UnknownParent"
