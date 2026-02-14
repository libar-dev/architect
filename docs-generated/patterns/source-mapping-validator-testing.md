# ✅ Source Mapping Validator Testing

**Purpose:** Detailed documentation for the Source Mapping Validator Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

**Context:** Source mappings reference files that may not exist, use invalid
  extraction methods, or have incompatible method-file combinations. Without
  pre-flight validation, extraction fails late with confusing errors.

  **Approach:** Validate file existence, extraction method validity, and format
  correctness before extraction begins. Collect all errors rather than stopping
  at the first one, enabling users to fix all issues in a single iteration.

## Acceptance Criteria

**Existing file passes validation**

- Given a source mapping referencing "src/types/result.ts"
- And the file exists
- When validating file existence
- Then validation passes
- And no errors are returned

**Missing file produces error with path**

- Given a source mapping referencing "src/nonexistent-file.ts"
- And the file does not exist
- When validating file existence
- Then validation fails
- And error message is "File not found: src/nonexistent-file.ts"
- And error includes the mapping row for context

**Directory instead of file produces error**

- Given a source mapping referencing "src/generators/"
- When validating file existence
- Then validation fails
- And error message contains "Expected file, got directory"

**THIS DECISION skips file validation**

- Given a source mapping referencing "THIS DECISION"
- When validating file existence
- Then validation passes
- And no file system check is performed

**THIS DECISION with rule reference skips file validation**

- Given a source mapping referencing "THIS DECISION (Rule: Context)"
- When validating file existence
- Then validation passes

**Valid extraction methods pass validation**

- Given a source mapping with method "<method>"
- When validating extraction method
- Then validation passes

**Unknown method produces error with suggestions**

- Given a source mapping with method "extract-types"
- When validating extraction method
- Then validation fails
- And error message contains "Unknown extraction method: extract-types"
- And error suggests "@extract-shapes tag" as alternative

**Empty method produces error**

- Given a source mapping with empty extraction method
- When validating extraction method
- Then validation fails
- And error message is "Extraction method is required"

**Method aliases are normalized**

- Given a source mapping with method "RULE_BLOCKS"
- When validating extraction method
- Then validation passes
- And method is normalized to "Rule blocks"

**TypeScript method on feature file produces error**

- Given a source mapping with:
- When validating method-file compatibility
- Then validation fails
- And error message contains "cannot be used with .feature files"
- And error suggests "Rule blocks" as alternative

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Types | tests/test.feature | @extract-shapes tag |

**Gherkin method on TypeScript file produces error**

- Given a source mapping with:
- When validating method-file compatibility
- Then validation fails
- And error message contains "requires .feature file"

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Rules | src/types.ts | Rule blocks |

**Compatible method-file combination passes**

- Given a source mapping with:
- When validating method-file compatibility
- Then validation passes

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Types | src/types.ts | @extract-shapes tag |

**Self-reference method on actual file produces error**

- Given a source mapping with:
- When validating method-file compatibility
- Then validation fails
- And error message contains "can only be used with THIS DECISION"

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Context | src/types/result.ts | Decision rule description |

**Missing Section column produces error**

- Given a source mapping table without "Section" column
- When validating table format
- Then validation fails
- And error message is "Missing required column: Section"

**Missing Source File column produces error**

- Given a source mapping table without "Source File" column
- When validating table format
- Then validation fails
- And error message is "Missing required column: Source File"

**Alternative column names are accepted**

- Given a source mapping table with columns:
- When validating table format
- Then validation passes
- And "Source" is mapped to "Source File"
- And "How" is mapped to "Extraction Method"

| Section | Source | How |
| --- | --- | --- |

**Multiple errors are aggregated**

- Given a source mapping with:
- When validating the full mapping
- Then validation fails with 2 errors
- And first error is about missing file
- And second error is about invalid method

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Types | src/missing.ts | @extract-shapes tag |
| Rules | src/types/result.ts | invalid-method |

**Warnings are collected alongside errors**

- Given a source mapping that produces warnings
- When validating the full mapping
- Then validation result includes both errors and warnings
- And validation fails if any errors exist
- And validation passes if only warnings exist

## Business Rules

**Source files must exist and be readable**

**Invariant:** All source file paths in mappings must resolve to existing, readable files.
    **Rationale:** Prevents extraction failures and provides clear error messages upfront.
    **Verified by:** @acceptance-criteria scenarios below.

_Verified by: Existing file passes validation, Missing file produces error with path, Directory instead of file produces error, THIS DECISION skips file validation, THIS DECISION with rule reference skips file validation_

**Extraction methods must be valid and supported**

**Invariant:** Extraction methods must match a known method from the supported set.
    **Rationale:** Invalid methods cannot extract content; suggest valid alternatives.
    **Verified by:** @acceptance-criteria scenarios below.

_Verified by: Valid extraction methods pass validation, Unknown method produces error with suggestions, Empty method produces error, Method aliases are normalized_

**Extraction methods must be compatible with file types**

**Invariant:** Method-file combinations must be compatible (e.g., TypeScript methods for .ts files).
    **Rationale:** Incompatible combinations fail at extraction; catch early with clear guidance.
    **Verified by:** @acceptance-criteria scenarios below.

_Verified by: TypeScript method on feature file produces error, Gherkin method on TypeScript file produces error, Compatible method-file combination passes, Self-reference method on actual file produces error_

**Source mapping tables must have required columns**

**Invariant:** Tables must contain Section, Source File, and Extraction Method columns.
    **Rationale:** Missing columns prevent extraction; alternative column names are mapped.
    **Verified by:** @acceptance-criteria scenarios below.

_Verified by: Missing Section column produces error, Missing Source File column produces error, Alternative column names are accepted_

**All validation errors are collected and returned together**

**Invariant:** Validation collects all errors before returning, not just the first.
    **Rationale:** Enables users to fix all issues in a single iteration.
    **Verified by:** @acceptance-criteria scenarios below.

_Verified by: Multiple errors are aggregated, Warnings are collected alongside errors_

---

[← Back to Pattern Registry](../PATTERNS.md)
