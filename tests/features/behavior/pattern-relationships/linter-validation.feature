@architect
@architect-pattern:LinterValidationTesting
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-implements:PatternRelationshipModel
@architect-product-area:Validation
Feature: Linter Rules for Relationship Validation

  Tests for lint rules that validate relationship integrity, detect conflicts,
  and ensure bidirectional traceability consistency.

  # ===========================================================================
  # RULE 1: Pattern Conflict Detection
  # ===========================================================================

  Rule: Pattern cannot implement itself (circular reference)

    **Invariant:** A pattern's implements tag must reference a different pattern than its own pattern tag.
    **Rationale:** Self-implementing patterns create circular references that break the sub-pattern hierarchy.
    **Verified by:** Pattern tag with implements tag causes error, Implements without pattern tag is valid

    A file cannot define a pattern that implements itself. This creates a
    circular reference. Different patterns are allowed (sub-pattern hierarchy).

    @validation
    Scenario: Pattern tag with implements tag causes error
      Given a TypeScript file with:
        """typescript
        /**
         * @architect
         * @architect-pattern:EventStoreDurability
         * @architect-implements:EventStoreDurability
         */
        """
      When the linter runs
      Then rule "pattern-conflict-in-implements" should trigger
      And the severity should be "error"
      And the message should mention "cannot implement itself"

    @validation
    Scenario: Implements without pattern tag is valid
      Given a TypeScript file with:
        """typescript
        /**
         * @architect
         * @architect-implements:EventStoreDurability
         * @architect-status:roadmap
         */
        """
      When the linter runs
      Then rule "pattern-conflict-in-implements" should not trigger

  # ===========================================================================
  # RULE 2: Missing Target Detection
  # ===========================================================================

  Rule: Relationship targets should exist (strict mode)

    **Invariant:** Every relationship target must reference a pattern that exists in the known pattern registry when strict mode is enabled.
    **Rationale:** Dangling references to non-existent patterns produce broken dependency graphs and misleading documentation.
    **Verified by:** Uses referencing non-existent pattern warns, Implements referencing non-existent pattern warns, Valid relationship target passes

    In strict mode, all relationship targets are validated against known patterns.

    @validation
    Scenario: Uses referencing non-existent pattern warns
      Given a pattern with uses "NonExistentPattern"
      And no pattern named "NonExistentPattern" exists
      When the linter runs in strict mode
      Then rule "missing-relationship-target" should trigger
      And the severity should be "warning"
      And the message should mention "NonExistentPattern"

    @validation
    Scenario: Implements referencing non-existent pattern warns
      Given a file implementing "NonExistentPattern"
      And no pattern named "NonExistentPattern" exists
      When the linter runs in strict mode
      Then rule "missing-relationship-target" should trigger

    @validation
    Scenario: Valid relationship target passes
      Given a pattern with uses "CommandBus"
      And a pattern named "CommandBus" exists
      When the linter runs in strict mode
      Then rule "missing-relationship-target" should not trigger

  # ===========================================================================
  # RULE 3: Traceability Consistency
  # ===========================================================================

  Rule: Bidirectional traceability links should be consistent

    **Invariant:** Every forward traceability link (executable-specs, roadmap-spec) must have a corresponding back-link in the target file.
    **Rationale:** Asymmetric links mean one side of the traceability chain is invisible, defeating the purpose of bidirectional tracing.
    **Verified by:** Missing back-link detected, Orphan executable spec detected

    @validation
    Scenario: Missing back-link detected
      Given a roadmap spec with executable-specs "path/to/tests"
      And no file at "path/to/tests" with roadmap-spec back-link
      When the linter runs in strict mode
      Then rule "asymmetric-traceability" should trigger
      And the message should mention "missing back-link"

    @validation
    Scenario: Orphan executable spec detected
      Given a package spec with roadmap-spec "NonExistentPattern"
      And no pattern named "NonExistentPattern" exists
      When the linter runs
      Then rule "orphan-executable-spec" should trigger

  # ===========================================================================
  # RULE 4: Hierarchy Validation
  # ===========================================================================

  Rule: Parent references must be valid

    **Invariant:** A pattern's parent reference must point to an existing epic pattern in the registry.
    **Rationale:** Dangling parent references break the epic-to-pattern hierarchy, causing patterns to appear orphaned in roadmap views and losing rollup visibility.
    **Verified by:** Invalid parent reference detected, Valid parent reference passes

    @validation
    Scenario: Invalid parent reference detected
      Given a pattern with parent "NonExistentEpic"
      And no pattern named "NonExistentEpic" exists
      When the linter runs
      Then rule "invalid-parent-reference" should trigger
      And the severity should be "error"

    @validation
    Scenario: Valid parent reference passes
      Given a pattern with parent "ProcessEnhancements"
      And an epic pattern named "ProcessEnhancements" exists
      When the linter runs
      Then rule "invalid-parent-reference" should not trigger
