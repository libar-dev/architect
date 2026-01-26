@lint @libar-docs-pattern:LintRules
Feature: Pattern Annotation Lint Rules
  The lint system validates @libar-docs-* documentation annotations for quality.

  Rules check parsed directives for completeness and quality, enabling
  CI enforcement of documentation standards.

  Each rule has a severity level:
  - error: Must fix before merge
  - warning: Should fix for quality
  - info: Suggestions for improvement

  Background:
    Given a lint rule context

  # ============================================================================
  # Rule: missing-pattern-name (error)
  # ============================================================================

  @rule:missing-pattern-name @severity:error
  Scenario: Detect missing pattern name
    Given a directive without patternName
    When I apply the missing-pattern-name rule
    Then a violation should be detected
    And the violation severity should be "error"
    And the violation message should contain "Pattern missing explicit name"

  @rule:missing-pattern-name
  Scenario: Detect empty string pattern name
    Given a directive with patternName ""
    When I apply the missing-pattern-name rule
    Then a violation should be detected
    And the violation severity should be "error"

  @rule:missing-pattern-name
  Scenario: Detect whitespace-only pattern name
    Given a directive with patternName "   "
    When I apply the missing-pattern-name rule
    Then a violation should be detected
    And the violation severity should be "error"

  @rule:missing-pattern-name @happy-path
  Scenario: Accept valid pattern name
    Given a directive with patternName "CommandOrchestrator"
    When I apply the missing-pattern-name rule
    Then no violation should be detected

  @rule:missing-pattern-name
  Scenario: Include file and line in violation
    Given a directive without patternName
    And the file path is "/path/to/my-file.ts"
    And the line number is 42
    When I apply the missing-pattern-name rule
    Then the violation should have file "/path/to/my-file.ts"
    And the violation should have line 42

  # ============================================================================
  # Rule: missing-status (warning)
  # ============================================================================

  @rule:missing-status @severity:warning
  Scenario: Detect missing status
    Given a directive without status
    When I apply the missing-status rule
    Then a violation should be detected
    And the violation severity should be "warning"
    And the violation message should contain "@libar-docs-status"

  @rule:missing-status @happy-path
  Scenario: Accept completed status
    Given a directive with status "completed"
    When I apply the missing-status rule
    Then no violation should be detected

  @rule:missing-status
  Scenario: Accept active status
    Given a directive with status "active"
    When I apply the missing-status rule
    Then no violation should be detected

  @rule:missing-status
  Scenario: Accept roadmap status
    Given a directive with status "roadmap"
    When I apply the missing-status rule
    Then no violation should be detected

  @rule:missing-status
  Scenario: Accept deferred status
    Given a directive with status "deferred"
    When I apply the missing-status rule
    Then no violation should be detected

  # ============================================================================
  # Rule: missing-when-to-use (warning)
  # ============================================================================

  @rule:missing-when-to-use @severity:warning
  Scenario: Detect missing whenToUse
    Given a directive without whenToUse
    When I apply the missing-when-to-use rule
    Then a violation should be detected
    And the violation severity should be "warning"
    And the violation message should contain "When to Use"

  @rule:missing-when-to-use
  Scenario: Detect empty whenToUse array
    Given a directive with empty whenToUse array
    When I apply the missing-when-to-use rule
    Then a violation should be detected

  @rule:missing-when-to-use @happy-path
  Scenario: Accept whenToUse with content
    Given a directive with whenToUse:
      | value                        |
      | Use when processing commands |
    When I apply the missing-when-to-use rule
    Then no violation should be detected

  # ============================================================================
  # Rule: tautological-description (error)
  # ============================================================================

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

  # ============================================================================
  # Rule: missing-relationships (info)
  # ============================================================================

  @rule:missing-relationships @severity:info
  Scenario: Detect missing relationship tags
    Given a directive without relationship tags
    When I apply the missing-relationships rule
    Then a violation should be detected
    And the violation severity should be "info"
    And the violation message should contain "relationship tags"

  @rule:missing-relationships
  Scenario: Detect empty uses array
    Given a directive with empty uses array
    When I apply the missing-relationships rule
    Then a violation should be detected

  @rule:missing-relationships @happy-path
  Scenario: Accept uses with content
    Given a directive with uses:
      | value     |
      | FSM Types |
    When I apply the missing-relationships rule
    Then no violation should be detected

  @rule:missing-relationships @happy-path
  Scenario: Accept usedBy with content
    Given a directive with usedBy:
      | value               |
      | CommandOrchestrator |
    When I apply the missing-relationships rule
    Then no violation should be detected

  @rule:missing-relationships @happy-path
  Scenario: Accept both uses and usedBy
    Given a directive with:
      | field  | value           |
      | uses   | FSM Types       |
      | usedBy | Decider Factory |
    When I apply the missing-relationships rule
    Then no violation should be detected

  # ============================================================================
  # Default Rules Collection
  # ============================================================================

  @collection @validation
  Scenario: Default rules contains all 8 rules
    # Updated from 7 to 8 after adding missingRelationshipTarget rule
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

  # ============================================================================
  # Filter by Severity
  # ============================================================================

  @filter
  Scenario: Filter returns all rules for info severity
    When I filter rules by minimum severity "info"
    # 8 rules: 4 error, 3 warning, 1 info (includes patternConflictInImplements, missingRelationshipTarget)
    Then I should get 8 rules

  @filter
  Scenario: Filter excludes info rules for warning severity
    When I filter rules by minimum severity "warning"
    # 7 rules: 4 error + 3 warning (excludes 1 info)
    Then I should get 7 rules
    And none should have severity "info"

  @filter
  Scenario: Filter returns only errors for error severity
    When I filter rules by minimum severity "error"
    # 4 error rules: missingPatternName, tautologicalDescription, invalidStatus, patternConflictInImplements
    Then I should get 4 rules
    And all should have severity "error"
