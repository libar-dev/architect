@libar-docs
@libar-docs-pattern:DecisionDocGeneratorTesting
@libar-docs-implements:DecisionDocGenerator
@libar-docs-status:completed
@libar-docs-product-area:Generation
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

    **Invariant:** Output file paths must be derived from pattern metadata using kebab-case conversion of the pattern name, with configurable section prefixes.
    **Rationale:** Consistent path derivation ensures generated files are predictable and linkable — ad-hoc paths would break cross-document references.
    **Verified by:** Default output paths for pattern, Custom section for compact output, CamelCase pattern converted to kebab-case

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

    **Invariant:** Compact output mode must include only essential decision content (type shapes, key constraints) while excluding full descriptions and verbose sections.
    **Rationale:** Compact output is designed for AI context windows where token budget is limited — including full descriptions would negate the space savings.
    **Verified by:** Compact output excludes full descriptions, Compact output includes type shapes, Compact output handles empty content

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

    **Invariant:** Detailed output mode must include all decision content including full descriptions, consequences, and DocStrings rendered as code blocks.
    **Rationale:** Detailed output serves as the complete human reference — omitting any section would force readers to consult source files for the full picture.
    **Verified by:** Detailed output includes all sections, Detailed output includes consequences, Detailed output includes DocStrings as code blocks

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

    **Invariant:** The generator must produce both compact and detailed output files from a single generation run, using the pattern name or patternName tag as the identifier.
    **Rationale:** Both output levels serve different audiences (AI vs human) — generating them together ensures consistency and eliminates the risk of one becoming stale.
    **Verified by:** Generate both compact and detailed outputs, Pattern name falls back to pattern.name

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

    **Invariant:** The decision document generator must be registered with the generator registry under a canonical name and must filter input patterns to only those with source mappings.
    **Rationale:** Registry registration enables discovery via --list-generators — filtering to source-mapped patterns prevents empty output for patterns without decision metadata.
    **Verified by:** Generator is registered with correct name, Generator filters patterns by source mapping presence, Generator processes patterns with source mappings

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

    **Invariant:** Source mapping tables must be executed during generation to extract content from referenced files, with missing files reported as validation errors.
    **Rationale:** Source mappings are the bridge between decision specs and implementation — unexecuted mappings produce empty sections, while silent missing-file errors hide broken references.
    **Verified by:** Source mappings are executed, Missing source files are reported as validation errors

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
