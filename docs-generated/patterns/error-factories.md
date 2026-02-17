# ✅ Error Factories

**Purpose:** Detailed documentation for the Error Factories pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Types |

## Description

Error factories create structured, discriminated error types with consistent
  message formatting. Each error type has a unique discriminator for exhaustive
  pattern matching in switch statements.

  **Why typed errors matter:**
  - Compile-time exhaustiveness checking in error handlers
  - Consistent message formatting across the codebase
  - Structured data for logging and reporting
  - Type narrowing via discriminator field

## Implementations

Files that implement this pattern:

- [`errors.ts`](../../src/types/errors.ts) - ## Error Factories - Type Definitions

## Acceptance Criteria

**createFileSystemError generates correct message for each reason**

- When I create a FileSystemError for "<file>" with reason "<reason>"
- Then the error type should be "FILE_SYSTEM_ERROR"
- And the error file should be "<file>"
- And the error reason should be "<reason>"
- And the error message should contain "<expected_text>"

**createFileSystemError includes optional originalError**

- When I create a FileSystemError for "/test.ts" with reason "NOT_FOUND" and original error "ENOENT"
- Then the error should have originalError
- And the originalError message should contain "ENOENT"

**createFileSystemError omits originalError when not provided**

- When I create a FileSystemError for "/test.ts" with reason "NOT_FOUND"
- Then the error should not have originalError property

**createDirectiveValidationError includes line number in message**

- When I create a DirectiveValidationError for "src/utils.ts" at line 42 with reason "Missing required tags"
- Then the error type should be "DIRECTIVE_VALIDATION_ERROR"
- And the error file should be "src/utils.ts"
- And the error line should be 42
- And the error reason should be "Missing required tags"
- And the error message should contain "src/utils.ts:42"

**createDirectiveValidationError includes optional directive snippet**

- When I create a DirectiveValidationError with directive "@libar-docs-"
- Then the error should have directive "@libar-docs-"

**createDirectiveValidationError omits directive when not provided**

- When I create a DirectiveValidationError without directive
- Then the error should not have directive property

**createPatternValidationError formats pattern name and file**

- When I create a PatternValidationError for pattern "UserAuth" in "src/auth.ts" with reason "Invalid structure"
- Then the error type should be "PATTERN_VALIDATION_ERROR"
- And the error patternName should be "UserAuth"
- And the error message should contain all of:

| text |
| --- |
| UserAuth |
| src/auth.ts |

**createPatternValidationError includes validation errors array**

- When I create a PatternValidationError with validation errors:
- Then the error validationErrors should have 2 items
- And validationErrors should contain all:

| error |
| --- |
| tags: Required |
| description: Must be set |

| error |
| --- |
| tags: Required |
| description: Must be set |

**createPatternValidationError omits validationErrors when not provided**

- When I create a PatternValidationError without validationErrors
- Then the error should not have validationErrors property

**createProcessMetadataValidationError formats file and reason**

- When I create a ProcessMetadataValidationError for "specs/test.feature" with reason "Schema validation failed"
- Then the error type should be "PROCESS_METADATA_VALIDATION_ERROR"
- And the error file should be "specs/test.feature"
- And the error reason should be "Schema validation failed"
- And the error message should contain "specs/test.feature"

**createProcessMetadataValidationError includes readonly validation errors**

- When I create a ProcessMetadataValidationError with validation errors:
- Then the error validationErrors should have 2 items
- And validationErrors should contain "status: Invalid enum value"

| error |
| --- |
| status: Invalid enum value |
| phase: Expected number |

**createDeliverableValidationError formats file and reason**

- When I create a DeliverableValidationError for "specs/feature.feature" with reason "Invalid deliverable data"
- Then the error type should be "DELIVERABLE_VALIDATION_ERROR"
- And the error file should be "specs/feature.feature"
- And the error reason should be "Invalid deliverable data"

**createDeliverableValidationError includes optional deliverableName**

- When I create a DeliverableValidationError for deliverable "MyDeliverable"
- Then the error deliverableName should be "MyDeliverable"
- And the error message should contain "MyDeliverable"

**createDeliverableValidationError omits deliverableName when not provided**

- When I create a DeliverableValidationError without deliverableName
- Then the error should not have deliverableName property

**createDeliverableValidationError includes validation errors**

- When I create a DeliverableValidationError with validation errors:
- Then the error validationErrors should have 2 items

| error |
| --- |
| name: Required |
| tests: Expected number |

## Business Rules

**createFileSystemError produces discriminated FILE_SYSTEM_ERROR types**

**Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason.
    **Rationale:** File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths.
    **Verified by:** createFileSystemError generates correct message for each reason, createFileSystemError includes optional originalError, createFileSystemError omits originalError when not provided

_Verified by: createFileSystemError generates correct message for each reason, createFileSystemError includes optional originalError, createFileSystemError omits originalError when not provided_

**createDirectiveValidationError formats file location with line number**

**Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output.
    **Verified by:** createDirectiveValidationError includes line number in message, createDirectiveValidationError includes optional directive snippet, createDirectiveValidationError omits directive when not provided

_Verified by: createDirectiveValidationError includes line number in message, createDirectiveValidationError includes optional directive snippet, createDirectiveValidationError omits directive when not provided_

**createPatternValidationError captures pattern identity and validation details**

**Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.
    **Verified by:** createPatternValidationError formats pattern name and file, createPatternValidationError includes validation errors array, createPatternValidationError omits validationErrors when not provided

_Verified by: createPatternValidationError formats pattern name and file, createPatternValidationError includes validation errors array, createPatternValidationError omits validationErrors when not provided_

**createProcessMetadataValidationError validates Gherkin process metadata**

**Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.
    **Verified by:** createProcessMetadataValidationError formats file and reason, createProcessMetadataValidationError includes readonly validation errors

_Verified by: createProcessMetadataValidationError formats file and reason, createProcessMetadataValidationError includes readonly validation errors_

**createDeliverableValidationError tracks deliverable-specific failures**

**Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.
    **Verified by:** createDeliverableValidationError formats file and reason, createDeliverableValidationError includes optional deliverableName, createDeliverableValidationError omits deliverableName when not provided, createDeliverableValidationError includes validation errors

_Verified by: createDeliverableValidationError formats file and reason, createDeliverableValidationError includes optional deliverableName, createDeliverableValidationError omits deliverableName when not provided, createDeliverableValidationError includes validation errors_

---

[← Back to Pattern Registry](../PATTERNS.md)
