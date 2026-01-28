@libar-docs
@libar-docs-status:active
@libar-docs-implements:PatternRelationshipModel
@pattern-relationships
Feature: Planning Dependency Tags

  Tests extraction of @libar-docs-depends-on and @libar-docs-enables
  relationship tags from Gherkin files.

  # ===========================================================================
  # RULE 1: Tag Registry Definition
  # ===========================================================================

  Rule: Depends-on tag is defined in taxonomy registry

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

    @acceptance-criteria @happy-path
    Scenario: Depends-on extracted from feature file
      Given a Gherkin file with tags:
        """gherkin
        @libar-docs
        @libar-docs-pattern:FeatureB
        @libar-docs-status:roadmap
        @libar-docs-depends-on:FeatureA
        Feature: Feature B
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have dependsOn "FeatureA"

    @acceptance-criteria @happy-path
    Scenario: Multiple depends-on values extracted as CSV
      Given a Gherkin file with tags:
        """gherkin
        @libar-docs
        @libar-docs-pattern:FeatureC
        @libar-docs-status:roadmap
        @libar-docs-depends-on:FeatureA,FeatureB
        Feature: Feature C
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have dependsOn "FeatureA, FeatureB"

  # ===========================================================================
  # RULE 3: Depends-on Anti-pattern Detection
  # ===========================================================================

  Rule: Depends-on in TypeScript triggers anti-pattern warning

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

    @acceptance-criteria @happy-path
    Scenario: Enables extracted from feature file
      Given a Gherkin file with tags:
        """gherkin
        @libar-docs
        @libar-docs-pattern:FeatureA
        @libar-docs-status:active
        @libar-docs-enables:FeatureB
        Feature: Feature A
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have enables "FeatureB"

    @acceptance-criteria @happy-path
    Scenario: Multiple enables values extracted as CSV
      Given a Gherkin file with tags:
        """gherkin
        @libar-docs
        @libar-docs-pattern:Foundation
        @libar-docs-status:active
        @libar-docs-enables:ServiceA,ServiceB
        Feature: Foundation
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have enables "ServiceA, ServiceB"

  # ===========================================================================
  # RULE 5: Relationship Index Building
  # ===========================================================================

  Rule: Planning dependencies are stored in relationship index

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
