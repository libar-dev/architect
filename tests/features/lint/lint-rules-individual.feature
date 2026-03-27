@architect
@lint @architect-pattern:LintRuleIndividualTesting
@architect-implements:LintRules
@architect-status:completed
@architect-unlock-reason:'Split-from-original'
@architect-product-area:Validation
Feature: Pattern Annotation Lint Rules - Individual Rule Validation
  Individual lint rules that check parsed directives for completeness.
  Tests presence/absence checks: pattern name, status, whenToUse, and relationships.

  Background:
    Given a lint rule context

  Rule: Files must declare an explicit pattern name

    **Invariant:** Every annotated file must have a non-empty patternName to be identifiable in the registry.
    **Rationale:** Without a pattern name, the file cannot be tracked, linked, or referenced in generated documentation.
    **Verified by:** Detect missing pattern name, Detect empty string pattern name, Detect whitespace-only pattern name, Accept valid pattern name, Include file and line in violation

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

  Rule: Files should declare a lifecycle status

    **Invariant:** Every annotated file should have a status tag to track its position in the delivery lifecycle.
    **Rationale:** Missing status prevents FSM validation and roadmap tracking.
    **Verified by:** Detect missing status, Accept completed status, Accept active status, Accept roadmap status, Accept deferred status

    @rule:missing-status @severity:warning
    Scenario: Detect missing status
      Given a directive without status
      When I apply the missing-status rule
      Then a violation should be detected
      And the violation severity should be "warning"
      And the violation message should contain "@architect-status"

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

  Rule: Files must use canonical FSM status values

    **Invariant:** Annotated files may use only the canonical PDR-005 FSM statuses: roadmap, active, completed, deferred.
    **Rationale:** Legacy aliases hide process drift and break a single-source-of-truth workflow model.
    **Verified by:** Reject planned status alias, Reject in-progress status alias, Reject implemented status alias, Accept canonical deferred status

    @rule:invalid-status @severity:error
    Scenario: Reject planned status alias
      Given a directive with status "planned"
      When I apply the invalid-status rule
      Then a violation should be detected
      And the violation severity should be "error"
      And the violation message should contain "Invalid status"

    @rule:invalid-status
    Scenario: Reject in-progress status alias
      Given a directive with status "in-progress"
      When I apply the invalid-status rule
      Then a violation should be detected
      And the violation message should contain "roadmap, active, completed, deferred"

    @rule:invalid-status
    Scenario: Reject implemented status alias
      Given a directive with status "implemented"
      When I apply the invalid-status rule
      Then a violation should be detected

    @rule:invalid-status @happy-path
    Scenario: Accept canonical deferred status
      Given a directive with status "deferred"
      When I apply the invalid-status rule
      Then no violation should be detected

  Rule: Files should document when to use the pattern

    **Invariant:** Annotated files should include whenToUse guidance so consumers know when to apply the pattern.
    **Rationale:** Without usage guidance, patterns become undiscoverable despite being documented.
    **Verified by:** Detect missing whenToUse, Detect empty whenToUse array, Accept whenToUse with content

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

  Rule: Files should declare relationship tags

    **Invariant:** Annotated files should declare uses or usedBy relationships to enable dependency tracking and architecture diagrams.
    **Rationale:** Isolated patterns without relationships produce diagrams with no edges and prevent dependency analysis.
    **Verified by:** Detect missing relationship tags, Detect empty uses array, Accept uses with content, Accept usedBy with content, Accept both uses and usedBy

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
