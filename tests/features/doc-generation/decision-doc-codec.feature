@libar-docs
@libar-docs-pattern:DecisionDocCodecTesting
@libar-docs-implements:DecisionDocCodec
@libar-docs-status:completed
@libar-docs-product-area:Generation
Feature: Decision Document Codec

  Validates the Decision Doc Codec that parses decision documents (ADR/PDR
  in .feature format) and extracts content for documentation generation.

  Background: Codec setup
    Given the decision doc codec is initialized

  # ============================================================================
  # RULE 1: Rule Block Partitioning
  # ============================================================================

  Rule: Rule blocks are partitioned by semantic prefix

    Decision documents use Rule: blocks with semantic prefixes to organize
    content into Context, Decision, and Consequences sections (standard ADR
    format). Additional rules (like "Proof of Concept") are classified as other.

    @acceptance-criteria @unit
    Scenario: Partition rules into ADR sections
      Given business rules:
        | Name | Description |
        | Context - Why we need this | Background explanation |
        | Decision - How it works | Implementation approach |
        | Consequences - Trade-offs | Benefits and costs |
      When partitioning rules for decision doc
      Then context should have 1 rule
      And decision should have 1 rule
      And consequences should have 1 rule
      And other should have 0 rules

    @acceptance-criteria @unit
    Scenario: Non-standard rules go to other category
      Given business rules:
        | Name | Description |
        | Proof of Concept - Demo | Example implementation |
        | Expected Output - Format | Output specification |
      When partitioning rules for decision doc
      Then other should have 2 rules
      And context should have 0 rules

  # ============================================================================
  # RULE 2: DocString Extraction
  # ============================================================================

  Rule: DocStrings are extracted with language tags

    Decision documents contain code examples as Gherkin DocStrings.

    @acceptance-criteria @unit
    Scenario: Extract single DocString
      Given text with single DocString
      When extracting DocStrings
      Then 1 DocString should be extracted
      And first DocString should have language "bash"

    @acceptance-criteria @unit
    Scenario: Extract multiple DocStrings
      Given text with multiple DocStrings
      When extracting DocStrings
      Then 2 DocStrings should be extracted

    @acceptance-criteria @unit
    Scenario: DocString without language defaults to text
      Given text with untagged DocString
      When extracting DocStrings
      Then first DocString should have language "text"

  # ============================================================================
  # RULE 3: Source Mapping Table Parsing
  # ============================================================================

  Rule: Source mapping tables are parsed from rule descriptions

    Decision documents define source mappings in markdown tables.

    @acceptance-criteria @unit
    Scenario: Parse basic source mapping table
      Given text with source mapping table
      When parsing source mapping table
      Then 2 source mappings should be found
      And first mapping section should be "Intro"

    @acceptance-criteria @unit
    Scenario: No source mapping returns empty
      Given text without tables
      When parsing source mapping table
      Then 0 source mappings should be found

  # ============================================================================
  # RULE 4: Self-Reference Detection
  # ============================================================================

  Rule: Self-reference markers are correctly detected

    Source files can reference the current decision document using special
    markers like "THIS DECISION", "THIS DECISION (Rule: X)", etc.

    @acceptance-criteria @unit
    Scenario: Detect THIS DECISION marker
      Given sourceFile "THIS DECISION"
      When checking if self-reference
      Then it should be a self-reference

    @acceptance-criteria @unit
    Scenario: Detect THIS DECISION with Rule
      Given sourceFile "THIS DECISION (Rule: Context above)"
      When checking if self-reference
      Then it should be a self-reference

    @acceptance-criteria @unit
    Scenario: Regular file path is not self-reference
      Given sourceFile "src/types.ts"
      When checking if self-reference
      Then it should not be a self-reference

    @acceptance-criteria @unit
    Scenario: Parse self-reference types
      Given sourceFile "THIS DECISION"
      When parsing self-reference
      Then self-reference type should be "document"

    @acceptance-criteria @unit
    Scenario: Parse self-reference with rule name
      Given sourceFile "THIS DECISION (Rule: Context above)"
      When parsing self-reference
      Then self-reference type should be "rule"

  # ============================================================================
  # RULE 5: Extraction Method Normalization
  # ============================================================================

  Rule: Extraction methods are normalized to known types

    The extraction method column can be written in various formats.

    @acceptance-criteria @unit
    Scenario: Normalize Decision rule description
      Given extraction method "Decision rule description"
      When normalizing extraction method
      Then normalized method should be "DECISION_RULE_DESCRIPTION"

    @acceptance-criteria @unit
    Scenario: Normalize extract-shapes
      Given extraction method "@extract-shapes tag"
      When normalizing extraction method
      Then normalized method should be "EXTRACT_SHAPES"

    @acceptance-criteria @unit
    Scenario: Normalize unknown method
      Given extraction method "some custom method"
      When normalizing extraction method
      Then normalized method should be "unknown"

  # ============================================================================
  # RULE 6: Full Decision Document Parsing
  # ============================================================================

  Rule: Complete decision documents are parsed with all content

    The parseDecisionDocument function extracts all content from an ADR/PDR.

    @acceptance-criteria @integration
    Scenario: Parse complete decision document
      Given a complete decision document
      When parsing the decision document
      Then parsed content should have 1 context rule
      And parsed content should have 1 decision rule
      And parsed content should have DocStrings

  # ============================================================================
  # RULE 7: Rule Finding
  # ============================================================================

  Rule: Rules can be found by name with partial matching

    Self-references may not have an exact rule name match.

    @acceptance-criteria @unit
    Scenario: Find rule by exact name
      Given business rules:
        | Name | Description |
        | Context - Problem | The problem description |
        | Decision - Solution | The solution description |
      When finding rule "Context - Problem"
      Then the found rule should have name "Context - Problem"

    @acceptance-criteria @unit
    Scenario: Find rule by partial name
      Given business rules:
        | Name | Description |
        | Context - Why we need this feature | Background |
        | Decision - The implementation approach | Solution |
      When finding rule "Context"
      Then the found rule should have name "Context - Why we need this feature"

    @acceptance-criteria @unit
    Scenario: Rule not found returns undefined
      Given business rules:
        | Name | Description |
        | Context - Problem | Description |
      When finding rule "NonExistent"
      Then no rule should be found
