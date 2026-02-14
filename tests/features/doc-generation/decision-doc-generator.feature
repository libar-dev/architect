@libar-docs
@libar-docs-pattern:DecisionDocGeneratorTesting
@libar-docs-implements:DecisionDocGenerator
@libar-docs-status:completed
@libar-docs-product-area:DocGeneration
Feature: Decision Document Generator

  The Decision Doc Generator orchestrates the full documentation generation
  pipeline from decision documents (ADR/PDR in .feature format):

  1. Decision parsing - Extract source mappings, rules, DocStrings
  2. Source mapping - Aggregate content from TypeScript, Gherkin, decision sources
  3. Content assembly - Build RenderableDocument from aggregated sections
  4. Multi-level output - Generate compact and detailed versions

  Background: Generator setup
    Given the decision doc generator is initialized

  # ============================================================================
  # RULE 1: Output Path Resolution
  # ============================================================================

  Rule: Output paths are determined from pattern metadata

    The generator computes output paths based on pattern name and optional
    section configuration. Compact output goes to _claude-md/, detailed to docs/.

    @acceptance-criteria @unit
    Scenario: Default output paths for pattern
      Given pattern name "ProcessGuard"
      When determining output paths
      Then compact path should be "_claude-md/generated/process-guard.md"
      And detailed path should contain "PROCESS-GUARD"

    @acceptance-criteria @unit
    Scenario: Custom section for compact output
      Given pattern name "ProcessGuard"
      And section "validation"
      When determining output paths
      Then compact path should be "_claude-md/validation/process-guard.md"

    @acceptance-criteria @unit
    Scenario: CamelCase pattern converted to kebab-case
      Given pattern name "MyComplexPatternName"
      When determining output paths
      Then compact path should contain "my-complex-pattern-name"

  # ============================================================================
  # RULE 2: Compact Output Generation
  # ============================================================================

  Rule: Compact output includes only essential content

    Summary/compact output is limited to ~50 lines and includes only
    essential tables and type definitions for Claude context files.

    @acceptance-criteria @unit
    Scenario: Compact output excludes full descriptions
      Given a decision document with context and description
      When generating compact output
      Then output should have detail level "summary"
      And output should have purpose containing "Compact"

    @acceptance-criteria @unit
    Scenario: Compact output includes type shapes
      Given a decision document with extracted shapes
      When generating compact output
      Then output sections should reference shapes

    @acceptance-criteria @unit
    Scenario: Compact output handles empty content
      Given a decision document with no content
      When generating compact output
      Then output should contain placeholder text

  # ============================================================================
  # RULE 3: Detailed Output Generation
  # ============================================================================

  Rule: Detailed output includes full content

    Detailed output is ~300 lines and includes everything: JSDoc, examples,
    full descriptions, and all extracted content.

    @acceptance-criteria @unit
    Scenario: Detailed output includes all sections
      Given a decision document with context and decision rules
      When generating detailed output
      Then output should have detail level "detailed"
      And output sections should include Context and Decision

    @acceptance-criteria @unit
    Scenario: Detailed output includes consequences
      Given a decision document with consequences
      When generating detailed output
      Then output sections should include "Consequences"

    @acceptance-criteria @unit
    Scenario: Detailed output includes DocStrings as code blocks
      Given a decision document with DocStrings
      When generating detailed output
      Then output should contain code blocks

  # ============================================================================
  # RULE 4: Multi-Level Generation
  # ============================================================================

  Rule: Multi-level generation produces both outputs

    The generator can produce both compact and detailed outputs in a single
    pass for maximum utility.

    @acceptance-criteria @integration
    Scenario: Generate both compact and detailed outputs
      Given a complete decision document with source mappings
      When generating multi-level output
      Then 2 output files should be produced
      And files should be in both "_claude-md/" and "docs/"

    @acceptance-criteria @integration
    Scenario: Pattern name falls back to pattern.name
      Given a pattern with only the name field
      When generating multi-level output
      Then generation should succeed using the name field

  # ============================================================================
  # RULE 5: Generator Registration
  # ============================================================================

  Rule: Generator is registered with the registry

    The generator is available in the registry under the name "doc-from-decision"
    and can be invoked through the standard generator interface.

    @acceptance-criteria @integration
    Scenario: Generator is registered with correct name
      When checking generator registry
      Then "doc-from-decision" should be available
      And generator should have description about decision documents

    @acceptance-criteria @integration
    Scenario: Generator filters patterns by source mapping presence
      Given patterns without source mappings
      When running generator
      Then generator should produce no output files

    @acceptance-criteria @integration
    Scenario: Generator processes patterns with source mappings
      Given patterns with source mapping tables
      When running generator
      Then generator should produce output files

  # ============================================================================
  # RULE 6: Source Mapping Integration
  # ============================================================================

  Rule: Source mappings are executed during generation

    Decision documents with source mapping tables trigger content aggregation
    from the referenced files during the generation process.

    @acceptance-criteria @integration
    Scenario: Source mappings are executed
      Given a decision document with source mappings
      And source files exist
      When generating from decision
      Then aggregated content should be included

    @acceptance-criteria @integration
    Scenario: Missing source files are reported as validation errors
      Given a decision document referencing missing files
      When generating from decision
      Then validation errors are reported for missing files
