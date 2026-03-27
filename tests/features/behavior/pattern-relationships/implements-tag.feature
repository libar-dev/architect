@architect
@architect-pattern:ImplementsTagProcessing
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-implements:PatternRelationshipModel
@architect-product-area:Annotation
Feature: Implements Tag Extraction and Processing

  Tests for the @architect-implements tag which links implementation files
  to their corresponding roadmap pattern specifications.

  # ===========================================================================
  # RULE 1: Tag Extraction from Registry (Data-Driven)
  # ===========================================================================

  Rule: Implements tag is defined in taxonomy registry

    **Invariant:** The implements tag must exist in the taxonomy registry with CSV format.
    **Rationale:** Without a registry definition, the data-driven AST parser cannot discover or extract the implements tag from source files.
    **Verified by:** Implements tag exists in registry

    The tag registry defines `implements` with CSV format, enabling the
    data-driven AST parser to automatically extract it.

    @unit
    Scenario: Implements tag exists in registry
      Given the tag registry is loaded
      When querying for tag "implements"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should mention "realization"

  # ===========================================================================
  # RULE 2: Single Pattern Implementation
  # ===========================================================================

  Rule: Files can implement a single pattern

    **Invariant:** The AST parser must extract a single implements value and preserve it through the extraction pipeline.
    **Rationale:** Lost implements values sever the link between implementation files and their roadmap specs, breaking traceability.
    **Verified by:** Parse implements with single pattern, Implements preserved through extraction pipeline

    @unit
    Scenario: Parse implements with single pattern
      Given a TypeScript file with content:
        """typescript
        /**
         * @architect
         * @architect-implements EventStoreDurability
         * @architect-status roadmap
         */
        export function outbox() {}
        """
      When the AST parser extracts metadata
      Then the directive should have implements ["EventStoreDurability"]

    @unit
    Scenario: Implements preserved through extraction pipeline
      Given a scanned file with implements "EventStoreDurability"
      When the extractor builds ExtractedPattern
      Then the pattern should have implementsPatterns ["EventStoreDurability"]

  # ===========================================================================
  # RULE 3: Multiple Pattern Implementation (CSV)
  # ===========================================================================

  Rule: Files can implement multiple patterns using CSV format

    **Invariant:** The AST parser must split CSV implements values into individual pattern references with whitespace trimming.
    **Rationale:** Unsplit or untrimmed CSV values produce invalid pattern references that fail relationship index lookups.
    **Verified by:** Parse implements with multiple patterns, CSV values are trimmed

    @unit
    Scenario: Parse implements with multiple patterns
      Given a TypeScript file with content:
        """typescript
        /**
         * @architect
         * @architect-implements EventStoreDurability, IdempotentAppend
         */
        export function durabilityPrimitive() {}
        """
      When the AST parser extracts metadata
      Then the directive should have implements ["EventStoreDurability", "IdempotentAppend"]

    @unit
    Scenario: CSV values are trimmed
      Given a TypeScript file with implements " Pattern1 , Pattern2 "
      When the AST parser extracts metadata
      Then the directive should have implements ["Pattern1", "Pattern2"]

  # ===========================================================================
  # RULE 4: Relationship Index Building
  # ===========================================================================

  Rule: Transform builds implementedBy reverse lookup

    **Invariant:** The transform must compute an implementedBy reverse index so spec patterns know which files implement them.
    **Rationale:** Without the reverse index, roadmap specs cannot discover their implementation files, breaking traceability and DoD validation.
    **Verified by:** Single implementation creates reverse lookup, Multiple implementations aggregate

    @unit
    Scenario: Single implementation creates reverse lookup
      Given patterns:
        | name | implementsPatterns |
        | outbox.ts | EventStoreDurability |
      And a pattern "EventStoreDurability" exists
      When the relationship index is built
      Then "EventStoreDurability" should have implementedBy ["outbox.ts"]

    @unit
    Scenario: Multiple implementations aggregate
      Given patterns:
        | name | implementsPatterns |
        | outbox.ts | EventStoreDurability |
        | publication.ts | EventStoreDurability |
        | idempotentAppend.ts | EventStoreDurability |
      And a pattern "EventStoreDurability" exists
      When the relationship index is built
      Then "EventStoreDurability" should have implementedBy containing all three files

  # ===========================================================================
  # RULE 5: Schema Validation
  # ===========================================================================

  Rule: Schemas validate implements field correctly

    **Invariant:** The Zod schemas must accept implements and implementedBy fields with correct array-of-string types.
    **Rationale:** Schema rejection of valid implements/implementedBy values causes runtime parse failures that silently drop traceability links.
    **Verified by:** DocDirective schema accepts implements, RelationshipEntry schema accepts implementedBy

    @unit
    Scenario: DocDirective schema accepts implements
      Given a DocDirective with implementsPatterns ["Pattern1"]
      When validating against DocDirectiveSchema
      Then validation should pass

    @unit
    Scenario: RelationshipEntry schema accepts implementedBy
      Given a RelationshipEntry with implementedBy ["file1.ts", "file2.ts"]
      When validating against RelationshipEntrySchema
      Then validation should pass
