@libar-docs
Feature: Taxonomy Document Codec

  Validates the Taxonomy Codec that transforms MasterDataset into a
  RenderableDocument for tag taxonomy reference documentation (TAXONOMY.md).

  Background: Codec setup
    Given the taxonomy codec is initialized

  # ============================================================================
  # RULE 1: Document Metadata
  # ============================================================================

  Rule: Document metadata is correctly set

    The taxonomy document has standard metadata fields for title, purpose,
    and detail level that describe the generated content.

    @acceptance-criteria @unit
    Scenario: Document title is Taxonomy Reference
      When decoding with default options
      Then document title should be "Taxonomy Reference"

    @acceptance-criteria @unit
    Scenario: Document purpose describes tag taxonomy
      When decoding with default options
      Then document purpose should contain "taxonomy"

    @acceptance-criteria @unit
    Scenario: Detail level reflects generateDetailFiles option
      When decoding with generateDetailFiles disabled
      Then document detailLevel should be "Compact summary"

  # ============================================================================
  # RULE 2: Categories Section
  # ============================================================================

  Rule: Categories section is generated from TagRegistry

    The categories section lists all configured tag categories with their
    domain, priority, and description in a sortable table.

    @acceptance-criteria @unit
    Scenario: Categories section is included in output
      When decoding with default options
      Then a section with heading "Categories" should exist

    @acceptance-criteria @unit
    Scenario: Category table has correct columns
      When decoding with default options
      Then the Categories section should have a table
      And the table should have columns "Tag", "Domain", "Priority", "Description"

    @acceptance-criteria @unit
    Scenario: LinkOut to detail file when generateDetailFiles enabled
      When decoding with default options
      Then a linkOut to "taxonomy/categories.md" should exist

  # ============================================================================
  # RULE 3: Metadata Tags Domain Grouping
  # ============================================================================

  Rule: Metadata tags can be grouped by domain

    The groupByDomain option organizes metadata tags into subsections
    by their semantic domain (Core, Relationship, Timeline, etc.).

    @acceptance-criteria @unit
    Scenario: With groupByDomain enabled tags are grouped into subsections
      When decoding with groupByDomain enabled
      Then the Metadata Tags section should have subsection "Core Tags"

    @acceptance-criteria @unit
    Scenario: With groupByDomain disabled single table rendered
      When decoding with groupByDomain disabled
      Then the Metadata Tags section should not have subsection "Core Tags"
      And the Metadata Tags section should have a single table

  # ============================================================================
  # RULE 4: Hardcoded Domain Classification
  # ============================================================================

  Rule: Tags are classified into domains by hardcoded mapping

    The domain classification is intentionally hardcoded for documentation
    stability. Core, Relationship, Timeline, ADR, and Architecture tags
    have specific domain assignments.

    @acceptance-criteria @unit
    Scenario: Core tags correctly classified
      Given a tag registry with metadata tags "pattern", "status", "core"
      When decoding with groupByDomain enabled
      Then tags "pattern", "status", "core" should be in domain "Core Tags"

    @acceptance-criteria @unit
    Scenario: Relationship tags correctly classified
      Given a tag registry with metadata tags "uses", "used-by", "depends-on"
      When decoding with groupByDomain enabled
      Then tags "uses", "used-by", "depends-on" should be in domain "Relationship Tags"

    @acceptance-criteria @unit
    Scenario: Timeline tags correctly classified
      Given a tag registry with metadata tags "phase", "quarter", "team"
      When decoding with groupByDomain enabled
      Then tags "phase", "quarter", "team" should be in domain "Timeline Tags"

    @acceptance-criteria @unit
    Scenario: ADR prefix matching works
      Given a tag registry with metadata tags "adr-number", "adr-status"
      When decoding with groupByDomain enabled
      Then tags "adr-number", "adr-status" should be in domain "ADR Tags"

    @acceptance-criteria @unit
    Scenario: Unknown tags go to Other Tags group
      Given a tag registry with metadata tags "custom-tag", "special-marker"
      When decoding with groupByDomain enabled
      Then tags "custom-tag", "special-marker" should be in domain "Other Tags"

  # ============================================================================
  # RULE 5: Optional Sections
  # ============================================================================

  Rule: Optional sections can be disabled via codec options

    The codec supports disabling format types, presets, and architecture
    diagram sections for compact output generation.

    @acceptance-criteria @unit
    Scenario: includeFormatTypes disabled excludes Format Types section
      When decoding with includeFormatTypes disabled
      Then a section with heading "Format Types" should not exist

    @acceptance-criteria @unit
    Scenario: includePresets disabled excludes Presets section
      When decoding with includePresets disabled
      Then a section with heading "Presets" should not exist

    @acceptance-criteria @unit
    Scenario: includeArchDiagram disabled excludes Architecture section
      When decoding with includeArchDiagram disabled
      Then a section with heading "Architecture" should not exist

  # ============================================================================
  # RULE 6: Detail File Generation
  # ============================================================================

  Rule: Detail files are generated for progressive disclosure

    The generateDetailFiles option creates additional files for
    categories, metadata tags, and format types with detailed content.

    @acceptance-criteria @unit
    Scenario: generateDetailFiles creates 3 additional files
      When decoding with default options
      Then additionalFiles should have 3 entries

    @acceptance-criteria @unit
    Scenario: Detail files have correct paths
      When decoding with default options
      Then additionalFiles should contain all taxonomy detail files

    @acceptance-criteria @unit
    Scenario: generateDetailFiles disabled creates no additional files
      When decoding with generateDetailFiles disabled
      Then additionalFiles should have 0 entries

  # ============================================================================
  # RULE 7: Format Types Reference
  # ============================================================================

  Rule: Format types are documented with descriptions and examples

    The Format Types section documents all supported tag value formats
    with descriptions and examples for each type.

    @acceptance-criteria @unit
    Scenario: All 6 format types are documented
      When decoding with default options
      Then all format types should be documented
