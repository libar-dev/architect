@libar-docs
@lint @libar-docs-pattern:LintRuleAdvancedTesting
@libar-docs-implements:LintRules
@libar-docs-status:completed
@libar-docs-product-area:Validation
Feature: Pattern Annotation Lint Rules - Advanced Rule Logic
  Complex lint rule logic and collection-level behavior.
  Tests tautological description detection, default collection, and severity filtering.

  Background:
    Given a lint rule context

  Rule: Descriptions must not repeat the pattern name

    **Invariant:** A description that merely echoes the pattern name adds no value and must be rejected.
    **Rationale:** Tautological descriptions waste reader attention and indicate missing documentation effort.
    **Verified by:** Detect description that equals pattern name, Detect description that is pattern name with punctuation, Detect short description starting with pattern name, Accept description with substantial content after name, Accept meaningfully different description, Ignore empty descriptions, Ignore missing pattern name, Skip headings when finding first line, Skip "When to use" sections when finding first line

    @rule:tautological-description @severity:error
    Scenario: Detect description that equals pattern name
      Given a directive with:
        | field       | value               |
        | patternName | CommandOrchestrator |
        | description | CommandOrchestrator |
      When I apply the tautological-description rule
      Then a violation should be detected
      And the violation severity should be "error"
      And the violation message should contain "repeats pattern name"

    @rule:tautological-description
    Scenario: Detect description that is pattern name with punctuation
      Given a directive with:
        | field       | value                |
        | patternName | Command Orchestrator |
        | description | Command-Orchestrator. |
      When I apply the tautological-description rule
      Then a violation should be detected
      And the violation severity should be "error"

    @rule:tautological-description
    Scenario: Detect short description starting with pattern name
      Given a directive with:
        | field       | value          |
        | patternName | FSM Types      |
        | description | FSM Types module |
      When I apply the tautological-description rule
      Then a violation should be detected

    @rule:tautological-description @happy-path
    Scenario: Accept description with substantial content after name
      Given a directive with:
        | field       | value                                                                                         |
        | patternName | FSM Types                                                                                     |
        | description | FSM Types provides strongly-typed state machine definitions for entity lifecycle management.  |
      When I apply the tautological-description rule
      Then no violation should be detected

    @rule:tautological-description @happy-path
    Scenario: Accept meaningfully different description
      Given a directive with:
        | field       | value                                                   |
        | patternName | CommandOrchestrator                                     |
        | description | The 7-step dual-write pattern for atomic command execution. |
      When I apply the tautological-description rule
      Then no violation should be detected

    @rule:tautological-description
    Scenario: Ignore empty descriptions
      Given a directive with:
        | field       | value |
        | patternName | Test  |
        | description |       |
      When I apply the tautological-description rule
      Then no violation should be detected

    @rule:tautological-description
    Scenario: Ignore missing pattern name
      Given a directive with description "Some description"
      When I apply the tautological-description rule
      Then no violation should be detected

    @rule:tautological-description
    Scenario: Skip headings when finding first line
      Given a directive with:
        | field       | value                                                        |
        | patternName | Test Pattern                                                  |
        | description | ## Test Pattern\n\nThis is a meaningful description.         |
      When I apply the tautological-description rule
      Then no violation should be detected

    @rule:tautological-description
    Scenario: Skip "When to use" sections when finding first line
      Given a directive with:
        | field       | value                                                              |
        | patternName | Test                                                               |
        | description | **When to use:** Some guidance\n\nThis is the actual description.  |
      When I apply the tautological-description rule
      Then no violation should be detected

  Rule: Default rules collection is complete and well-ordered

    **Invariant:** The default rules collection must contain all defined rules with unique IDs, ordered by severity (errors first).
    **Rationale:** A complete, ordered collection ensures no rule is silently dropped and severity-based filtering works correctly.
    **Verified by:** Default rules contains all 8 rules, Default rules have unique IDs, Default rules are ordered by severity, Default rules include all named rules

    @collection @validation
    Scenario: Default rules contains all 8 rules
      When I check the default rules collection
      Then it should contain 8 rules

    @collection
    Scenario: Default rules have unique IDs
      When I check the default rules collection
      Then all rule IDs should be unique

    @collection
    Scenario: Default rules are ordered by severity
      When I check the default rules collection
      Then errors should come before warnings
      And warnings should come before info

    @collection
    Scenario: Default rules include all named rules
      When I check the default rules collection
      Then it should include all rules:
        | ruleId                       |
        | missing-pattern-name         |
        | invalid-status               |
        | missing-status               |
        | missing-when-to-use          |
        | tautological-description     |
        | missing-relationships        |
        | pattern-conflict-in-implements |

  Rule: Rules can be filtered by minimum severity

    **Invariant:** Filtering by severity must return only rules at or above the specified level.
    **Rationale:** CI pipelines need to control which violations block merges vs. which are advisory.
    **Verified by:** Filter returns all rules for info severity, Filter excludes info rules for warning severity, Filter returns only errors for error severity

    @filter
    Scenario: Filter returns all rules for info severity
      When I filter rules by minimum severity "info"
      Then I should get 8 rules

    @filter
    Scenario: Filter excludes info rules for warning severity
      When I filter rules by minimum severity "warning"
      Then I should get 7 rules
      And none should have severity "info"

    @filter
    Scenario: Filter returns only errors for error severity
      When I filter rules by minimum severity "error"
      Then I should get 4 rules
      And all should have severity "error"
