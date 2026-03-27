@architect
@architect-pattern:SourceMapperTesting
@architect-implements:SourceMapper
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
Feature: Source Mapper

  The Source Mapper aggregates content from multiple source files based on
  source mapping tables parsed from decision documents. It dispatches extraction
  to appropriate handlers based on extraction method and preserves ordering.

  Background: Mapper setup
    Given the source mapper is initialized

  # ============================================================================
  # RULE 1: Extraction Method Dispatch
  # ============================================================================

  Rule: Extraction methods dispatch to correct handlers

    **Invariant:** Each extraction method type (self-reference, TypeScript, Gherkin) must dispatch to the correct specialized handler based on the source file type or marker.
    **Rationale:** Wrong dispatch would apply TypeScript extraction logic to Gherkin files (or vice versa), producing garbled or empty results.
    **Verified by:** Dispatch to decision extraction for THIS DECISION, Dispatch to TypeScript extractor for .ts files, Dispatch to behavior spec extractor for .feature files

    @acceptance-criteria @unit
    Scenario: Dispatch to decision extraction for THIS DECISION
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Intro | THIS DECISION | Decision rule description |
      And a decision document with rules
      When executing source mapping
      Then extraction should use decision extractor
      And extracted section should have name "Intro"

    @acceptance-criteria @unit
    Scenario: Dispatch to TypeScript extractor for .ts files
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | API Types | src/test-types.ts | @extract-shapes tag |
      And the TypeScript file exists with shapes
      When executing source mapping
      Then extraction should use TypeScript extractor
      And extracted section should have name "API Types"

    @acceptance-criteria @unit
    Scenario: Dispatch to behavior spec extractor for .feature files
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Validation Rules | tests/features/test.feature | Rule blocks |
      And the feature file exists with rules
      When executing source mapping
      Then extraction should use behavior spec extractor
      And extracted section should have name "Validation Rules"

  # ============================================================================
  # RULE 2: Self-Reference Extraction
  # ============================================================================

  Rule: Self-references extract from current decision document

    **Invariant:** THIS DECISION self-references must extract content from the current decision document using rule descriptions, DocStrings, or full document access.
    **Rationale:** Self-references avoid circular file reads — the document content is already in memory, so extraction is a lookup operation rather than a file I/O operation.
    **Verified by:** Extract from THIS DECISION using rule description, Extract DocStrings from THIS DECISION, Extract full document from THIS DECISION

    @acceptance-criteria @unit
    Scenario: Extract from THIS DECISION using rule description
      Given a decision with context rule "Context - Why we need this"
      And a source mapping referencing "THIS DECISION (Rule: Context)"
      When executing source mapping
      Then content should contain the context rule description

    @acceptance-criteria @unit
    Scenario: Extract DocStrings from THIS DECISION
      Given a decision with DocStrings containing code examples
      And a source mapping referencing "THIS DECISION (DocString)"
      When executing source mapping
      Then content should contain code blocks

    @acceptance-criteria @unit
    Scenario: Extract full document from THIS DECISION
      Given a decision with description and rules
      And a source mapping referencing "THIS DECISION"
      When executing source mapping
      Then content should be extracted

  # ============================================================================
  # RULE 3: Multi-File Aggregation
  # ============================================================================

  Rule: Multiple sources are aggregated in mapping order

    **Invariant:** When multiple source mappings target the same section, their extracted content must be aggregated in the order defined by the mapping table.
    **Rationale:** Mapping order is intentional — authors structure their source tables to produce a logical reading flow, and reordering would break the narrative.
    **Verified by:** Aggregate from multiple sources, Ordering is preserved from mapping table

    @acceptance-criteria @integration
    Scenario: Aggregate from multiple sources
      Given source mappings:
        | Section | Source File | Extraction Method |
        | Intro | THIS DECISION | Decision rule description |
        | API Types | src/test-types.ts | @extract-shapes tag |
        | Rules | tests/features/test.feature | Rule blocks |
      And all source files exist
      When executing source mapping
      Then 3 sections should be extracted
      And sections should be in mapping order

    @acceptance-criteria @integration
    Scenario: Ordering is preserved from mapping table
      Given source mappings:
        | Section | Source File | Extraction Method |
        | Third | THIS DECISION | Decision rule description |
        | First | src/test-types.ts | @extract-shapes tag |
        | Second | tests/features/test.feature | Rule blocks |
      And all source files exist
      When executing source mapping
      Then sections should be in order:
        | Index | Name |
        | 1 | Third |
        | 2 | First |
        | 3 | Second |

  # ============================================================================
  # RULE 4: Missing File Handling
  # ============================================================================

  Rule: Missing files produce warnings without failing

    **Invariant:** When a referenced source file does not exist, the mapper must produce a warning and continue processing remaining mappings rather than failing entirely.
    **Rationale:** Partial extraction is more useful than total failure — a decision document with most sections populated and one warning is better than no document at all.
    **Verified by:** Missing source file produces warning, Partial extraction when some files missing, Validation checks all files before extraction

    @acceptance-criteria @validation
    Scenario: Missing source file produces warning
      Given a source mapping referencing "nonexistent.ts"
      When executing source mapping
      Then a warning should be produced for "nonexistent.ts"
      And extraction should continue

    @acceptance-criteria @validation
    Scenario: Partial extraction when some files missing
      Given source mappings:
        | Section | Source File | Extraction Method |
        | Present | THIS DECISION | Decision rule description |
        | Missing | nonexistent.ts | @extract-shapes tag |
      When executing source mapping
      Then 1 section should be extracted
      And 1 warning should be produced

    @acceptance-criteria @validation
    Scenario: Validation checks all files before extraction
      Given source mappings with multiple missing files
      When validating source mappings
      Then all missing files should produce warnings
      And validation should complete without error

  # ============================================================================
  # RULE 5: Empty Content Handling
  # ============================================================================

  Rule: Empty extraction results produce info warnings

    **Invariant:** When extraction succeeds but produces empty results (no matching shapes, no matching rules), an informational warning must be generated.
    **Rationale:** Empty results often indicate stale source mappings pointing to renamed or removed content — warnings surface these issues before they reach generated output.
    **Verified by:** Empty shapes extraction produces info warning, No matching rules produces info warning

    @acceptance-criteria @validation
    Scenario: Empty shapes extraction produces info warning
      Given a source mapping for a TypeScript file without shapes
      When executing source mapping
      Then an info warning should be produced
      And section should still be included with empty content

    @acceptance-criteria @validation
    Scenario: No matching rules produces info warning
      Given a source mapping for a feature file without rules
      When executing source mapping
      Then an info warning should be produced

  # ============================================================================
  # RULE 6: Extraction Method Normalization
  # ============================================================================

  Rule: Extraction methods are normalized for dispatch

    **Invariant:** Extraction method strings must be normalized to canonical forms before dispatch, with unrecognized methods producing a warning.
    **Rationale:** Users write extraction methods in natural language — normalization bridges the gap between human-readable table entries and programmatic dispatch keys.
    **Verified by:** Normalize various extraction method formats, Unknown extraction method produces warning

    @acceptance-criteria @unit
    Scenario: Normalize various extraction method formats
      Given extraction methods:
        | Input | Expected |
        | Decision rule description | DECISION_RULE_DESCRIPTION |
        | @extract-shapes tag | EXTRACT_SHAPES |
        | Rule blocks | RULE_BLOCKS |
        | Scenario Outline Examples | SCENARIO_OUTLINE_EXAMPLES |
        | JSDoc section | JSDOC_SECTION |
        | Fenced code block | FENCED_CODE_BLOCK |
      When normalizing each method
      Then all methods should normalize correctly

    @acceptance-criteria @unit
    Scenario: Unknown extraction method produces warning
      Given a source mapping with unknown extraction method
      When validating source mappings
      Then an info warning should be produced for unknown method
