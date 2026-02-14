@libar-docs
@libar-docs-pattern:UsesTagTesting
@libar-docs-status:active
@libar-docs-implements:PatternRelationshipModel
@libar-docs-product-area:PatternRelationship
@pattern-relationships
Feature: Uses Tag Extraction

  Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by
  relationship tags from TypeScript files.

  # ===========================================================================
  # RULE 1: Tag Registry Definition
  # ===========================================================================

  Rule: Uses tag is defined in taxonomy registry

    @unit
    Scenario: Uses tag exists in registry
      Given the tag registry is loaded
      When querying for tag "uses"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should mention "depends"

    @unit
    Scenario: Used-by tag exists in registry
      Given the tag registry is loaded
      When querying for tag "used-by"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should mention "depend"

  # ===========================================================================
  # RULE 2: Single Uses Value
  # ===========================================================================

  Rule: Uses tag is extracted from TypeScript files

    @acceptance-criteria @happy-path
    Scenario: Single uses value extracted
      Given a TypeScript file with content:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern ServiceA
         * @libar-docs-status active
         * @libar-docs-uses ServiceB
         */
        export class ServiceA {}
        """
      When the AST parser extracts metadata
      Then the directive should have uses "ServiceB"

    @acceptance-criteria @happy-path
    Scenario: Multiple uses values extracted as CSV
      Given a TypeScript file with content:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern Orchestrator
         * @libar-docs-status active
         * @libar-docs-uses ServiceA, ServiceB, ServiceC
         */
        export class Orchestrator {}
        """
      When the AST parser extracts metadata
      Then the directive should have uses "ServiceA, ServiceB, ServiceC"

  # ===========================================================================
  # RULE 3: Used-by Extraction
  # ===========================================================================

  Rule: Used-by tag is extracted from TypeScript files

    @acceptance-criteria @happy-path
    Scenario: Single used-by value extracted
      Given a TypeScript file with content:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern CoreService
         * @libar-docs-status active
         * @libar-docs-used-by HighLevelOrchestrator
         */
        export class CoreService {}
        """
      When the AST parser extracts metadata
      Then the directive should have usedBy "HighLevelOrchestrator"

    @acceptance-criteria @happy-path
    Scenario: Multiple used-by values extracted as CSV
      Given a TypeScript file with content:
        """typescript
        /**
         * @libar-docs
         * @libar-docs-pattern Foundation
         * @libar-docs-status active
         * @libar-docs-used-by ServiceA, ServiceB
         */
        export class Foundation {}
        """
      When the AST parser extracts metadata
      Then the directive should have usedBy "ServiceA, ServiceB"

  # ===========================================================================
  # RULE 4: Relationship Index Building
  # ===========================================================================

  Rule: Uses relationships are stored in relationship index

    The relationship index stores uses and usedBy relationships directly
    from pattern metadata. Unlike implements, these are explicit declarations.

    @unit
    Scenario: Uses relationships stored in relationship index
      Given patterns with uses relationships:
        | name       | uses      |
        | ServiceA   | ServiceB  |
        | ServiceC   | ServiceB  |
      And a pattern "ServiceB" exists
      When the relationship index is built
      Then "ServiceA" should have uses containing "ServiceB"
      And "ServiceC" should have uses containing "ServiceB"

    @unit
    Scenario: UsedBy relationships stored explicitly
      Given a pattern "ServiceB" with usedBy "ServiceA, ServiceC"
      When the relationship index is built
      Then "ServiceB" should have usedBy containing "ServiceA"
      And "ServiceB" should have usedBy containing "ServiceC"

  # ===========================================================================
  # RULE 5: Schema Validation
  # ===========================================================================

  Rule: Schemas validate uses field correctly

    @unit
    Scenario: DocDirective schema accepts uses
      Given a DocDirective with uses "Pattern1, Pattern2"
      When validating against DocDirectiveSchema
      Then validation should pass

    @unit
    Scenario: RelationshipEntry schema accepts usedBy
      Given a RelationshipEntry with usedBy "Pattern1, Pattern2"
      When validating against RelationshipEntrySchema
      Then validation should pass
