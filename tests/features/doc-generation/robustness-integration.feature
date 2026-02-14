@libar-docs
@libar-docs-pattern:RobustnessIntegration
@libar-docs-status:completed
@libar-docs-product-area:Generation
Feature: Robustness Integration

  **Context:** Document generation pipeline needs validation, deduplication, and
  warning collection to work together correctly for production use.

  **Approach:** Integration tests verify the full pipeline with all robustness
  features enabled, ensuring validation runs first, deduplication merges content,
  and warnings are collected across stages.

  Background: Pipeline setup
    Given the decision doc generator is initialized
    And validation is enabled
    And deduplication is enabled
    And warning collection is enabled

  # ============================================================================
  # RULE 1: End-to-End Validation
  # ============================================================================

  Rule: Validation runs before extraction in the pipeline

    **Invariant:** Validation must complete and pass before extraction begins.
    **Rationale:** Prevents wasted extraction work and provides clear fail-fast behavior.
    **Verified by:** @acceptance-criteria scenarios below.

    The validation layer must run first and halt the pipeline if errors
    are found, preventing wasted extraction work.

    @acceptance-criteria @integration @happy-path
    Scenario: Valid decision document generates successfully
      Given a decision document with valid source mappings
      And all referenced files exist
      When generating documentation
      Then generation succeeds
      And output contains all mapped sections
      And no errors are reported

    @acceptance-criteria @integration @validation
    Scenario: Invalid mapping halts pipeline before extraction
      Given a decision document referencing missing file "src/ghost.ts"
      When generating documentation
      Then generation fails with validation error
      And no extraction is attempted
      And error clearly identifies "src/ghost.ts" as missing

    @acceptance-criteria @integration
    Scenario: Multiple validation errors are reported together
      Given a decision document with 3 invalid mappings
      When generating documentation
      Then generation fails
      And all 3 errors are reported
      And user can fix all issues in one iteration

  # ============================================================================
  # RULE 2: Deduplication in Pipeline
  # ============================================================================

  Rule: Deduplication runs after extraction before assembly

    **Invariant:** Deduplication processes all extracted content before document assembly.
    **Rationale:** All sources must be extracted to identify cross-source duplicates.
    **Verified by:** @acceptance-criteria scenarios below.

    Content from all sources is extracted first, then deduplicated,
    then assembled into the final document.

    @acceptance-criteria @integration @happy-path
    Scenario: Duplicate content is removed from final output
      Given a decision document that extracts "Protection Levels" from:
        | Source | Method |
        | THIS DECISION (Rule: Decision) | Decision rule description |
        | src/lint/process-guard.ts | JSDoc section |
      And both sources have identical "Protection Levels" content
      When generating documentation
      Then output contains exactly one "Protection Levels" section
      And source attribution shows primary source

    @acceptance-criteria @integration
    Scenario: Non-duplicate sections are preserved
      Given a decision document with 5 unique sections
      When generating documentation
      Then output contains all 5 sections
      And section order matches source mapping order

  # ============================================================================
  # RULE 3: Warning Collection in Pipeline
  # ============================================================================

  Rule: Warnings from all stages are collected and reported

    **Invariant:** Warnings from all pipeline stages are aggregated in the result.
    **Rationale:** Users need visibility into non-fatal issues without blocking generation.
    **Verified by:** @acceptance-criteria scenarios below.

    Non-fatal issues from validation, extraction, and deduplication are
    collected and included in the result.

    @acceptance-criteria @integration
    Scenario: Warnings are collected across pipeline stages
      Given validation produces warning "File modified recently"
      And extraction produces warning "Empty code block"
      And deduplication produces warning "Content merged from 2 sources"
      When generating documentation
      Then generation succeeds
      And result includes 1 warning
      And warnings are grouped by stage

    @acceptance-criteria @integration
    Scenario: Warnings do not prevent successful generation
      Given a decision document with minor issues
      And issues are warnings not errors
      When generating documentation
      Then generation succeeds
      And warnings are available for review
      And output is complete

  # ============================================================================
  # RULE 4: Error Recovery
  # ============================================================================

  Rule: Pipeline provides actionable error messages

    **Invariant:** Error messages include context and fix suggestions.
    **Rationale:** Users should fix issues in one iteration without guessing.
    **Verified by:** @acceptance-criteria scenarios below.

    Errors include enough context for users to understand and fix the issue.

    @acceptance-criteria @integration
    Scenario: File not found error includes fix suggestion
      Given a decision document referencing "src/old-name.ts"
      And the file was renamed to "src/new-name.ts"
      When generating documentation
      Then error includes "File not found: src/old-name.ts"
      And error suggests checking file path

    @acceptance-criteria @integration
    Scenario: Invalid method error includes valid alternatives
      Given a decision document with method "extract types"
      When generating documentation
      Then error includes "Unknown extraction method: extract types"
      And error suggests "@extract-shapes tag"

    @acceptance-criteria @integration
    Scenario: Extraction error includes source context
      Given a decision document referencing valid file
      And extraction fails due to syntax error in source
      When generating documentation
      Then error includes source file path
      And error includes line number if available
      And error includes parsing context

  # ============================================================================
  # RULE 5: Backward Compatibility
  # ============================================================================

  Rule: Existing decision documents continue to work

    **Invariant:** Valid existing decision documents generate without new errors.
    **Rationale:** Robustness improvements must be backward compatible.
    **Verified by:** @acceptance-criteria scenarios below.

    The robustness improvements must not break existing valid decision
    documents that worked with the PoC.

    @acceptance-criteria @integration @regression
    Scenario: PoC decision document still generates
      Given the doc-generation-proof-of-concept.feature decision document
      When generating documentation with robustness enabled
      Then generation succeeds
      And output matches expected structure
      And no new errors are introduced

    @acceptance-criteria @integration @regression
    Scenario: Process Guard decision document still generates
      Given a decision document for Process Guard
      When generating documentation with robustness enabled
      Then generation succeeds
      And PROCESS-GUARD.md is generated correctly
