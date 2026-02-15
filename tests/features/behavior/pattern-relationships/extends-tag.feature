@libar-docs
@libar-docs-pattern:ExtendsTagTesting
@libar-docs-status:completed
@libar-docs-implements:PatternRelationshipModel
@libar-docs-product-area:Annotation
Feature: Extends Tag Extraction and Processing

  Tests for the @libar-docs-extends tag which establishes generalization
  relationships between patterns (pattern inheritance).

  # ===========================================================================
  # RULE 1: Tag Extraction from Registry
  # ===========================================================================

  Rule: Extends tag is defined in taxonomy registry

    **Invariant:** The extends tag must exist in the taxonomy registry with single-value format.
    **Verified by:** Extends tag exists in registry

    @unit
    Scenario: Extends tag exists in registry
      Given the tag registry is loaded
      When querying for tag "extends"
      Then the tag should exist
      And the tag format should be "value"
      And the tag purpose should mention "generalization"

  # ===========================================================================
  # RULE 2: Pattern Extension (Single Value)
  # ===========================================================================

  Rule: Patterns can extend exactly one base pattern

    **Invariant:** A pattern may extend at most one base pattern, enforced by single-value tag format.
    **Rationale:** Single inheritance avoids diamond-problem ambiguity in pattern generalization hierarchies.
    **Verified by:** Parse extends from feature file, Extends preserved through extraction pipeline

    Extends uses single-value format because pattern inheritance should be
    single-inheritance to avoid diamond problems.

    @unit
    Scenario: Parse extends from feature file
      Given a Gherkin file with tags:
        """gherkin
        @libar-docs
        @libar-docs-pattern:ReactiveProjections
        @libar-docs-extends:ProjectionCategories
        Feature: Reactive Projections
        """
      When the Gherkin parser extracts metadata
      Then the pattern should have extends "ProjectionCategories"

    @unit
    Scenario: Extends preserved through extraction pipeline
      Given a scanned file with extends "ProjectionCategories"
      When the extractor builds ExtractedPattern
      Then the pattern should have extendsPattern "ProjectionCategories"

  # ===========================================================================
  # RULE 3: Reverse Lookup (extendedBy)
  # ===========================================================================

  Rule: Transform builds extendedBy reverse lookup

    **Invariant:** The transform must compute an extendedBy reverse index so base patterns know which patterns extend them.
    **Verified by:** Extended pattern knows its extensions

    @unit
    Scenario: Extended pattern knows its extensions
      Given patterns:
        | name | extendsPattern |
        | ReactiveProjections | ProjectionCategories |
        | CachedProjections | ProjectionCategories |
      And a pattern "ProjectionCategories" exists
      When the relationship index is built
      Then "ProjectionCategories" should have extendedBy ["ReactiveProjections", "CachedProjections"]

  # ===========================================================================
  # RULE 4: Circular Inheritance Detection
  # ===========================================================================

  Rule: Linter detects circular inheritance chains

    **Invariant:** Circular inheritance chains (direct or transitive) must be detected and reported as errors.
    **Rationale:** Circular extends relationships create infinite resolution loops and undefined behavior.
    **Verified by:** Direct circular inheritance detected, Transitive circular inheritance detected

    @validation
    Scenario: Direct circular inheritance detected
      Given pattern A with extends "B"
      And pattern B with extends "A"
      When the linter validates relationships
      Then an error should be emitted for circular inheritance
      And the error should mention both "A" and "B"

    @validation
    Scenario: Transitive circular inheritance detected
      Given pattern A with extends "B"
      And pattern B with extends "C"
      And pattern C with extends "A"
      When the linter validates relationships
      Then an error should be emitted for circular inheritance
