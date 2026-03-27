@architect
@architect-pattern:SourceMappingValidatorTesting
@architect-implements:SourceMappingValidator
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
Feature: Source Mapping Validator

  **Context:** Source mappings reference files that may not exist, use invalid
  extraction methods, or have incompatible method-file combinations. Without
  pre-flight validation, extraction fails late with confusing errors.

  **Approach:** Validate file existence, extraction method validity, and format
  correctness before extraction begins. Collect all errors rather than stopping
  at the first one, enabling users to fix all issues in a single iteration.

  Background: Validator setup
    Given the source mapping validator is initialized
    And the base path is the project root

  # ============================================================================
  # RULE 1: File Existence Validation
  # ============================================================================

  Rule: Source files must exist and be readable

    **Invariant:** All source file paths in mappings must resolve to existing, readable files.
    **Rationale:** Prevents extraction failures and provides clear error messages upfront.
    **Verified by:** @acceptance-criteria scenarios below.

    @acceptance-criteria @unit
    Scenario: Existing file passes validation
      Given a source mapping referencing "src/types/result.ts"
      And the file exists
      When validating file existence
      Then validation passes
      And no errors are returned

    @acceptance-criteria @validation
    Scenario: Missing file produces error with path
      Given a source mapping referencing "src/nonexistent-file.ts"
      And the file does not exist
      When validating file existence
      Then validation fails
      And error message is "File not found: src/nonexistent-file.ts"
      And error includes the mapping row for context

    @acceptance-criteria @validation
    Scenario: Directory instead of file produces error
      Given a source mapping referencing "src/generators/"
      When validating file existence
      Then validation fails
      And error message contains "Expected file, got directory"

    @acceptance-criteria @edge-case
    Scenario: THIS DECISION skips file validation
      Given a source mapping referencing "THIS DECISION"
      When validating file existence
      Then validation passes
      And no file system check is performed

    @acceptance-criteria @edge-case
    Scenario: THIS DECISION with rule reference skips file validation
      Given a source mapping referencing "THIS DECISION (Rule: Context)"
      When validating file existence
      Then validation passes

  # ============================================================================
  # RULE 2: Extraction Method Validation
  # ============================================================================

  Rule: Extraction methods must be valid and supported

    **Invariant:** Extraction methods must match a known method from the supported set.
    **Rationale:** Invalid methods cannot extract content; suggest valid alternatives.
    **Verified by:** @acceptance-criteria scenarios below.

    @acceptance-criteria @unit
    Scenario Outline: Valid extraction methods pass validation
      Given a source mapping with method "<method>"
      When validating extraction method
      Then validation passes

      Examples:
        | method |
        | @extract-shapes tag |
        | Rule blocks |
        | Decision rule description |
        | JSDoc section |
        | createViolation() patterns |
        | Fenced code block |
        | Scenario Outline Examples |

    @acceptance-criteria @validation
    Scenario: Unknown method produces error with suggestions
      Given a source mapping with method "extract-types"
      When validating extraction method
      Then validation fails
      And error message contains "Unknown extraction method: extract-types"
      And error suggests "@extract-shapes tag" as alternative

    @acceptance-criteria @validation
    Scenario: Empty method produces error
      Given a source mapping with empty extraction method
      When validating extraction method
      Then validation fails
      And error message is "Extraction method is required"

    @acceptance-criteria @edge-case
    Scenario: Method aliases are normalized
      Given a source mapping with method "RULE_BLOCKS"
      When validating extraction method
      Then validation passes
      And method is normalized to "Rule blocks"

  # ============================================================================
  # RULE 3: Method-File Compatibility
  # ============================================================================

  Rule: Extraction methods must be compatible with file types

    **Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).
    **Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.
    **Verified by:** @acceptance-criteria scenarios below.

    @acceptance-criteria @validation
    Scenario: TypeScript method on feature file produces error
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Types | tests/test.feature | @extract-shapes tag |
      When validating method-file compatibility
      Then validation fails
      And error message contains "cannot be used with .feature files"
      And error suggests "Rule blocks" as alternative

    @acceptance-criteria @validation
    Scenario: Gherkin method on TypeScript file produces error
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Rules | src/types.ts | Rule blocks |
      When validating method-file compatibility
      Then validation fails
      And error message contains "requires .feature file"

    @acceptance-criteria @unit
    Scenario: Compatible method-file combination passes
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Types | src/types.ts | @extract-shapes tag |
      When validating method-file compatibility
      Then validation passes

    @acceptance-criteria @validation
    Scenario: Self-reference method on actual file produces error
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Context | src/types/result.ts | Decision rule description |
      When validating method-file compatibility
      Then validation fails
      And error message contains "can only be used with THIS DECISION"

  # ============================================================================
  # RULE 4: Table Format Validation
  # ============================================================================

  Rule: Source mapping tables must have required columns

    **Invariant:** Tables must contain Section, Source File, and Extraction Method columns.
    **Rationale:** Missing columns prevent extraction; alternative column names are mapped.
    **Verified by:** @acceptance-criteria scenarios below.

    @acceptance-criteria @validation
    Scenario: Missing Section column produces error
      Given a source mapping table without "Section" column
      When validating table format
      Then validation fails
      And error message is "Missing required column: Section"

    @acceptance-criteria @validation
    Scenario: Missing Source File column produces error
      Given a source mapping table without "Source File" column
      When validating table format
      Then validation fails
      And error message is "Missing required column: Source File"

    @acceptance-criteria @edge-case
    Scenario: Alternative column names are accepted
      Given a source mapping table with columns:
        | Section | Source | How |
      When validating table format
      Then validation passes
      And "Source" is mapped to "Source File"
      And "How" is mapped to "Extraction Method"

  # ============================================================================
  # RULE 5: Validation Result Aggregation
  # ============================================================================

  Rule: All validation errors are collected and returned together

    **Invariant:** Validation collects all errors before returning, not just the first.
    **Rationale:** Enables users to fix all issues in a single iteration.
    **Verified by:** @acceptance-criteria scenarios below.

    @acceptance-criteria @unit
    Scenario: Multiple errors are aggregated
      Given a source mapping with:
        | Section | Source File | Extraction Method |
        | Types | src/missing.ts | @extract-shapes tag |
        | Rules | src/types/result.ts | invalid-method |
      When validating the full mapping
      Then validation fails with 2 errors
      And first error is about missing file
      And second error is about invalid method

    @acceptance-criteria @unit
    Scenario: Warnings are collected alongside errors
      Given a source mapping that produces warnings
      When validating the full mapping
      Then validation result includes both errors and warnings
      And validation fails if any errors exist
      And validation passes if only warnings exist

