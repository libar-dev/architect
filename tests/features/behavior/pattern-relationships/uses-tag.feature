@architect
@architect-pattern:UsesTagTesting
@architect-status:active
@architect-implements:PatternRelationshipModel
@architect-product-area:Annotation
@pattern-relationships
Feature: Uses Tag Extraction

  Tests extraction and processing of @architect-uses and @architect-used-by
  relationship tags from TypeScript files.

  # ===========================================================================
  # RULE 1: Tag Registry Definition
  # ===========================================================================

  Rule: Uses tag is defined in taxonomy registry

    **Invariant:** The uses and used-by tags must be registered in the taxonomy with CSV format and dependency-related purpose descriptions.
    **Rationale:** Without registry definitions, the data-driven AST parser cannot discover or extract these tags from source files.
    **Verified by:** Uses tag exists in registry, Used-by tag exists in registry

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

    **Invariant:** The AST parser must extract single and comma-separated uses values from TypeScript JSDoc annotations.
    **Rationale:** Missing or malformed uses extraction breaks runtime dependency tracking and produces incomplete relationship diagrams.
    **Verified by:** Single uses value extracted, Multiple uses values extracted as CSV

    @acceptance-criteria @happy-path
    Scenario: Single uses value extracted
      Given a TypeScript file with content:
        """typescript
        /**
         * @architect
         * @architect-pattern ServiceA
         * @architect-status active
         * @architect-uses ServiceB
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
         * @architect
         * @architect-pattern Orchestrator
         * @architect-status active
         * @architect-uses ServiceA, ServiceB, ServiceC
         */
        export class Orchestrator {}
        """
      When the AST parser extracts metadata
      Then the directive should have uses "ServiceA, ServiceB, ServiceC"

  # ===========================================================================
  # RULE 3: Used-by Extraction
  # ===========================================================================

  Rule: Used-by tag is extracted from TypeScript files

    **Invariant:** The AST parser must extract single and comma-separated used-by values from TypeScript JSDoc annotations.
    **Rationale:** Missing used-by extraction prevents reverse dependency lookups, leaving consumers unable to discover which patterns depend on them.
    **Verified by:** Single used-by value extracted, Multiple used-by values extracted as CSV

    @acceptance-criteria @happy-path
    Scenario: Single used-by value extracted
      Given a TypeScript file with content:
        """typescript
        /**
         * @architect
         * @architect-pattern CoreService
         * @architect-status active
         * @architect-used-by HighLevelOrchestrator
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
         * @architect
         * @architect-pattern Foundation
         * @architect-status active
         * @architect-used-by ServiceA, ServiceB
         */
        export class Foundation {}
        """
      When the AST parser extracts metadata
      Then the directive should have usedBy "ServiceA, ServiceB"

  # ===========================================================================
  # RULE 4: Relationship Index Building
  # ===========================================================================

  Rule: Uses relationships are stored in relationship index

    **Invariant:** All declared uses and usedBy relationships must be stored in the relationship index as explicitly declared entries.
    **Rationale:** Omitting relationships from the index causes dependency diagrams and impact-analysis queries to silently miss connections.
    **Verified by:** Uses relationships stored in relationship index, UsedBy relationships stored explicitly

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

    **Invariant:** DocDirective and RelationshipEntry schemas must accept uses and usedBy fields as valid CSV string values.
    **Rationale:** Schema rejection of valid uses/usedBy values causes runtime parse failures that silently drop relationship data.
    **Verified by:** DocDirective schema accepts uses, RelationshipEntry schema accepts usedBy

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
