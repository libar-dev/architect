@libar-docs
@libar-docs-pattern:PocIntegration
@libar-docs-status:completed
@libar-docs-product-area:Generation
Feature: Documentation Generation POC Integration

  End-to-end integration tests that exercise the full documentation generation
  pipeline using the actual POC decision document and real source files.

  This validates that all 11 source mappings from the POC decision document
  work correctly with real project files.

  Background: POC integration setup
    Given the POC integration context is initialized

  # ============================================================================
  # RULE 1: Load and Parse POC Decision
  # ============================================================================

  Rule: POC decision document is parsed correctly

    **Invariant:** The real POC decision document (Process Guard) must be parseable by the codec, extracting all source mappings with their extraction types.
    **Rationale:** Integration testing against the actual POC document validates that the codec works with real-world content, not just synthetic test data.
    **Verified by:** Load actual POC decision document, Source mappings include all extraction types

    @acceptance-criteria @integration
    Scenario: Load actual POC decision document
      Given the POC decision document at "delivery-process/specs/doc-generation-proof-of-concept.feature"
      When parsing the decision document
      Then parsed content should have correct structure

    @acceptance-criteria @integration
    Scenario: Source mappings include all extraction types
      Given the POC decision document is loaded
      When inspecting source mappings
      Then mappings should include all required source types

  # ============================================================================
  # RULE 2: Self-Reference Extraction
  # ============================================================================

  Rule: Self-references extract content from POC decision

    **Invariant:** THIS DECISION self-references in the POC document must successfully extract Context rules, Decision rules, and DocStrings from the document itself.
    **Rationale:** Self-references are the most common extraction type in decision docs — they must work correctly for the POC to demonstrate the end-to-end pipeline.
    **Verified by:** Extract Context rule from THIS DECISION, Extract Decision rule from THIS DECISION, Extract DocStrings from THIS DECISION

    @acceptance-criteria @integration
    Scenario: Extract Context rule from THIS DECISION
      Given the POC decision document is loaded
      When extracting self-reference "THIS DECISION (Rule: Context above)"
      Then extracted content should contain context keywords

    @acceptance-criteria @integration
    Scenario: Extract Decision rule from THIS DECISION
      Given the POC decision document is loaded
      When extracting self-reference "THIS DECISION (Rule: Decision above)"
      Then extracted content should contain decision keywords

    @acceptance-criteria @integration
    Scenario: Extract DocStrings from THIS DECISION
      Given the POC decision document is loaded
      When extracting DocStrings from decision
      Then extracted DocStrings should include 3 languages

  # ============================================================================
  # RULE 3: TypeScript Shape Extraction
  # ============================================================================

  Rule: TypeScript shapes are extracted from real files

    **Invariant:** The source mapper must successfully extract type shapes and patterns from real TypeScript source files referenced in the POC document.
    **Rationale:** TypeScript extraction is the primary mechanism for pulling implementation details into decision docs — it must work with actual project files.
    **Verified by:** Extract shapes from types.ts, Extract shapes from decider.ts, Extract createViolation patterns from decider.ts

    @acceptance-criteria @integration
    Scenario: Extract shapes from types.ts
      Given the source mapper with base directory at project root
      When extracting from "src/lint/process-guard/types.ts" with method "@extract-shapes tag"
      Then shapes should include all expected type definitions

    @acceptance-criteria @integration
    Scenario: Extract shapes from decider.ts
      Given the source mapper with base directory at project root
      When extracting from "src/lint/process-guard/decider.ts" with method "@extract-shapes tag"
      Then shapes should include validateChanges function

    @acceptance-criteria @integration
    Scenario: Extract createViolation patterns from decider.ts
      Given the source mapper with base directory at project root
      When extracting from "src/lint/process-guard/decider.ts" with method "createViolation() patterns"
      Then extracted content should contain violation patterns

  # ============================================================================
  # RULE 4: Behavior Spec Extraction
  # ============================================================================

  Rule: Behavior spec content is extracted correctly

    **Invariant:** The source mapper must successfully extract Rule blocks and ScenarioOutline Examples from real Gherkin feature files referenced in the POC document.
    **Rationale:** Behavior spec extraction bridges decision documents to executable specifications — incorrect extraction would misrepresent the verified behavior.
    **Verified by:** Extract Rule blocks from process-guard.feature, Extract Scenario Outline Examples from process-guard-linter.feature

    @acceptance-criteria @integration
    Scenario: Extract Rule blocks from process-guard.feature
      Given the source mapper with base directory at project root
      When extracting from "tests/features/validation/process-guard.feature" with method "Rule blocks"
      Then extracted content should contain validation rule names

    @acceptance-criteria @integration
    Scenario: Extract Scenario Outline Examples from process-guard-linter.feature
      Given the source mapper with base directory at project root
      When extracting from "delivery-process/specs/process-guard-linter.feature" with method "Scenario Outline Examples"
      Then extracted content should contain protection level table

  # ============================================================================
  # RULE 5: JSDoc Section Extraction
  # ============================================================================

  Rule: JSDoc sections are extracted from CLI files

    **Invariant:** The source mapper must successfully extract JSDoc comment sections from real TypeScript CLI files referenced in the POC document.
    **Rationale:** CLI documentation often lives in JSDoc comments — extracting them into decision docs avoids duplicating CLI usage information manually.
    **Verified by:** Extract JSDoc from lint-process.ts

    @acceptance-criteria @integration
    Scenario: Extract JSDoc from lint-process.ts
      Given the source mapper with base directory at project root
      When extracting from "src/cli/lint-process.ts" with method "JSDoc section"
      Then extracted content should contain CLI documentation

  # ============================================================================
  # RULE 6: Full Source Mapping Execution
  # ============================================================================

  Rule: All source mappings execute successfully

    **Invariant:** All source mappings defined in the POC decision document must execute without errors, producing non-empty extraction results.
    **Rationale:** End-to-end execution validates that all extraction types work with real files — a single failing mapping would produce incomplete decision documentation.
    **Verified by:** Execute all 11 source mappings from POC

    @acceptance-criteria @integration
    Scenario: Execute all 11 source mappings from POC
      Given the POC decision document is loaded
      And source mapper options configured with project root
      When executing all source mappings
      Then aggregated content should be successful with sections

  # ============================================================================
  # RULE 7: Compact Output Generation
  # ============================================================================

  Rule: Compact output generates correctly

    **Invariant:** The compact output for the POC document must generate successfully and contain all essential sections defined by the compact format.
    **Rationale:** Compact output is the AI-facing artifact — verifying it against the real POC ensures the format serves its purpose of providing concise decision context.
    **Verified by:** Generate compact output from POC, Compact output contains essential sections

    @acceptance-criteria @integration
    Scenario: Generate compact output from POC
      Given the POC pattern is created from decision document
      When generating with detail level "summary"
      Then compact output should be generated with essential sections

    @acceptance-criteria @integration
    Scenario: Compact output contains essential sections
      Given compact output is generated from POC
      Then compact output should contain essential content

  # ============================================================================
  # RULE 8: Detailed Output Generation
  # ============================================================================

  Rule: Detailed output generates correctly

    **Invariant:** The detailed output for the POC document must generate successfully and contain all sections including full content from source mappings.
    **Rationale:** Detailed output is the human-facing artifact — verifying it against the real POC ensures no content is lost in the generation pipeline.
    **Verified by:** Generate detailed output from POC, Detailed output contains full content

    @acceptance-criteria @integration
    Scenario: Generate detailed output from POC
      Given the POC pattern is created from decision document
      When generating with detail level "detailed"
      Then detailed output should be generated successfully

    @acceptance-criteria @integration
    Scenario: Detailed output contains full content
      Given detailed output is generated from POC
      Then detailed output should contain full sections

  # ============================================================================
  # RULE 9: Output Quality Validation
  # ============================================================================

  Rule: Generated output matches quality expectations

    **Invariant:** The generated output structure must match the expected target format, with complete validation rules and properly structured sections.
    **Rationale:** Quality assertions catch regressions in output formatting — structural drift in generated documents would degrade their usefulness as references.
    **Verified by:** Compact output matches target structure, Validation rules are complete in output

    @acceptance-criteria @integration
    Scenario: Compact output matches target structure
      Given compact output is generated from POC
      When comparing to existing compact output
      Then compact output structure should be valid

    @acceptance-criteria @integration
    Scenario: Validation rules are complete in output
      Given detailed output is generated from POC
      Then detailed output should contain all validation rules
