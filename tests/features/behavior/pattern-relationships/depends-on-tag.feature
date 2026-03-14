@architect
@architect-pattern:DependsOnTagTesting
@architect-status:active
@architect-implements:PatternRelationshipModel
@architect-product-area:Annotation
@pattern-relationships
Feature: Planning Dependency Tags

  Tests extraction of @architect-depends-on and @architect-enables
  relationship tags from Gherkin files.

  # ===========================================================================
  # RULE 1: Tag Registry Definition
  # ===========================================================================

  Rule: Depends-on tag is defined in taxonomy registry

    **Invariant:** The depends-on and enables tags must exist in the taxonomy registry with CSV format.
    **Rationale:** Without registry definitions, the data-driven AST parser cannot discover or extract these planning dependency tags from source files.
    **Verified by:** Depends-on tag exists in registry, Enables tag exists in registry

    @unit
    Scenario: Depends-on tag exists in registry
      Given the tag registry is loaded
      When querying for tag "depends-on"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should mention "dependencies"

    @unit
    Scenario: Enables tag exists in registry
      Given the tag registry is loaded
      When querying for tag "enables"
      Then the tag should exist
      And the tag format should be "csv"
      And the tag purpose should mention "enables"

  # ===========================================================================
  # RULE 2: Depends-on Extraction from Gherkin
  # ===========================================================================

  Rule: Depends-on tag is extracted from Gherkin files

    **Invariant:** The Gherkin parser must extract depends-on values from feature file tags, including CSV multi-value lists.
    **Rationale:** Missing dependency extraction causes the dependency tree and blocking-pattern queries to return incomplete results.
    **Verified by:** Depends-on extracted from feature file, Multiple depends-on values extracted as CSV

    @acceptance-criteria @happy-path
    Scenario: Depends-on extracted from feature file
      Given a Gherkin file with tags:
        """gherkin
        @architect
        @architect-pattern:FeatureB
        @architect-status:roadmap
        @architect-depends-on:FeatureA
        Feature: Feature B
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have dependsOn "FeatureA"

    @acceptance-criteria @happy-path
    Scenario: Multiple depends-on values extracted as CSV
      Given a Gherkin file with tags:
        """gherkin
        @architect
        @architect-pattern:FeatureC
        @architect-status:roadmap
        @architect-depends-on:FeatureA,FeatureB
        Feature: Feature C
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have dependsOn "FeatureA, FeatureB"

  # ===========================================================================
  # RULE 3: Depends-on Anti-pattern Detection
  # ===========================================================================

  Rule: Depends-on in TypeScript triggers anti-pattern warning

    **Invariant:** The depends-on tag must only appear in Gherkin files; its presence in TypeScript is an anti-pattern.
    **Rationale:** Depends-on represents planning dependencies owned by Gherkin specs, not runtime dependencies owned by TypeScript.
    **Verified by:** Depends-on in TypeScript is detected by lint rule

    The depends-on tag is for planning dependencies and belongs in feature
    files, not TypeScript code. TypeScript files should use "uses" for
    runtime dependencies.

    @acceptance-criteria @validation
    Scenario: Depends-on in TypeScript is detected by lint rule
      Given a TypeScript file with depends-on "ServiceY"
      When the missing-relationship-target rule runs with known patterns
      Then the uses relationship is checked not depends-on

  # ===========================================================================
  # RULE 4: Enables Extraction from Gherkin
  # ===========================================================================

  Rule: Enables tag is extracted from Gherkin files

    **Invariant:** The Gherkin parser must extract enables values from feature file tags, including CSV multi-value lists.
    **Rationale:** Missing enables extraction breaks forward-looking dependency queries, hiding which patterns are unblocked when a prerequisite completes.
    **Verified by:** Enables extracted from feature file, Multiple enables values extracted as CSV

    @acceptance-criteria @happy-path
    Scenario: Enables extracted from feature file
      Given a Gherkin file with tags:
        """gherkin
        @architect
        @architect-pattern:FeatureA
        @architect-status:active
        @architect-enables:FeatureB
        Feature: Feature A
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have enables "FeatureB"

    @acceptance-criteria @happy-path
    Scenario: Multiple enables values extracted as CSV
      Given a Gherkin file with tags:
        """gherkin
        @architect
        @architect-pattern:Foundation
        @architect-status:active
        @architect-enables:ServiceA,ServiceB
        Feature: Foundation
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have enables "ServiceA, ServiceB"

  # ===========================================================================
  # RULE 5: Relationship Index Building
  # ===========================================================================

  Rule: Planning dependencies are stored in relationship index

    **Invariant:** The relationship index must store dependsOn and enables relationships extracted from pattern metadata.
    **Rationale:** Omitting planning dependencies from the index causes blocking-pattern and critical-path queries to return incomplete results.
    **Verified by:** DependsOn relationships stored in relationship index, Enables relationships stored explicitly

    The relationship index stores dependsOn and enables relationships
    directly from pattern metadata. These are explicit declarations.

    @unit
    Scenario: DependsOn relationships stored in relationship index
      Given patterns with planning dependencies:
        | name       | dependsOn |
        | FeatureB   | FeatureA  |
        | FeatureC   | FeatureA  |
      And a pattern "FeatureA" exists
      When the relationship index is built
      Then "FeatureB" should have dependsOn containing "FeatureA"
      And "FeatureC" should have dependsOn containing "FeatureA"

    @unit
    Scenario: Enables relationships stored explicitly
      Given a pattern "FeatureA" with enables "FeatureB, FeatureC"
      When the relationship index is built
      Then "FeatureA" should have enables containing "FeatureB"
      And "FeatureA" should have enables containing "FeatureC"
