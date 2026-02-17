@libar-docs
@libar-docs-pattern:ErrorFactories
@libar-docs-status:completed
@libar-docs-product-area:CoreTypes
@libar-docs-include:core-types
@types @errors
Feature: Error Factory Functions
  Error factories create structured, discriminated error types with consistent
  message formatting. Each error type has a unique discriminator for exhaustive
  pattern matching in switch statements.

  **Why typed errors matter:**
  - Compile-time exhaustiveness checking in error handlers
  - Consistent message formatting across the codebase
  - Structured data for logging and reporting
  - Type narrowing via discriminator field

  Background:
    Given an error factory test context

  Rule: createFileSystemError produces discriminated FILE_SYSTEM_ERROR types

    **Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason.
    **Rationale:** File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths.
    **Verified by:** createFileSystemError generates correct message for each reason, createFileSystemError includes optional originalError, createFileSystemError omits originalError when not provided

    @function:createFileSystemError @happy-path
    Scenario Outline: createFileSystemError generates correct message for each reason
      When I create a FileSystemError for "<file>" with reason "<reason>"
      Then the error type should be "FILE_SYSTEM_ERROR"
      And the error file should be "<file>"
      And the error reason should be "<reason>"
      And the error message should contain "<expected_text>"

      Examples:
        | file              | reason        | expected_text             |
        | /path/to/file.ts  | NOT_FOUND     | File not found            |
        | /etc/secret       | NO_PERMISSION | Permission denied         |
        | /some/directory   | NOT_A_FILE    | Not a file                |
        | /unknown/path     | OTHER         | File system error         |

    @function:createFileSystemError
    Scenario: createFileSystemError includes optional originalError
      When I create a FileSystemError for "/test.ts" with reason "NOT_FOUND" and original error "ENOENT"
      Then the error should have originalError
      And the originalError message should contain "ENOENT"

    @function:createFileSystemError
    Scenario: createFileSystemError omits originalError when not provided
      When I create a FileSystemError for "/test.ts" with reason "NOT_FOUND"
      Then the error should not have originalError property

  Rule: createDirectiveValidationError formats file location with line number

    **Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output.
    **Verified by:** createDirectiveValidationError includes line number in message, createDirectiveValidationError includes optional directive snippet, createDirectiveValidationError omits directive when not provided

    @function:createDirectiveValidationError @happy-path
    Scenario: createDirectiveValidationError includes line number in message
      When I create a DirectiveValidationError for "src/utils.ts" at line 42 with reason "Missing required tags"
      Then the error type should be "DIRECTIVE_VALIDATION_ERROR"
      And the error file should be "src/utils.ts"
      And the error line should be 42
      And the error reason should be "Missing required tags"
      And the error message should contain "src/utils.ts:42"

    @function:createDirectiveValidationError
    Scenario: createDirectiveValidationError includes optional directive snippet
      When I create a DirectiveValidationError with directive "@libar-docs-"
      Then the error should have directive "@libar-docs-"

    @function:createDirectiveValidationError
    Scenario: createDirectiveValidationError omits directive when not provided
      When I create a DirectiveValidationError without directive
      Then the error should not have directive property

  Rule: createPatternValidationError captures pattern identity and validation details

    **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.
    **Verified by:** createPatternValidationError formats pattern name and file, createPatternValidationError includes validation errors array, createPatternValidationError omits validationErrors when not provided

    @function:createPatternValidationError @happy-path
    Scenario: createPatternValidationError formats pattern name and file
      When I create a PatternValidationError for pattern "UserAuth" in "src/auth.ts" with reason "Invalid structure"
      Then the error type should be "PATTERN_VALIDATION_ERROR"
      And the error patternName should be "UserAuth"
      And the error message should contain all of:
        | text        |
        | UserAuth    |
        | src/auth.ts |

    @function:createPatternValidationError
    Scenario: createPatternValidationError includes validation errors array
      When I create a PatternValidationError with validation errors:
        | error                     |
        | tags: Required            |
        | description: Must be set  |
      Then the error validationErrors should have 2 items
      And validationErrors should contain all:
        | error                     |
        | tags: Required            |
        | description: Must be set  |

    @function:createPatternValidationError
    Scenario: createPatternValidationError omits validationErrors when not provided
      When I create a PatternValidationError without validationErrors
      Then the error should not have validationErrors property

  Rule: createProcessMetadataValidationError validates Gherkin process metadata

    **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.
    **Verified by:** createProcessMetadataValidationError formats file and reason, createProcessMetadataValidationError includes readonly validation errors

    @function:createProcessMetadataValidationError @happy-path
    Scenario: createProcessMetadataValidationError formats file and reason
      When I create a ProcessMetadataValidationError for "specs/test.feature" with reason "Schema validation failed"
      Then the error type should be "PROCESS_METADATA_VALIDATION_ERROR"
      And the error file should be "specs/test.feature"
      And the error reason should be "Schema validation failed"
      And the error message should contain "specs/test.feature"

    @function:createProcessMetadataValidationError
    Scenario: createProcessMetadataValidationError includes readonly validation errors
      When I create a ProcessMetadataValidationError with validation errors:
        | error                        |
        | status: Invalid enum value   |
        | phase: Expected number       |
      Then the error validationErrors should have 2 items
      And validationErrors should contain "status: Invalid enum value"

  Rule: createDeliverableValidationError tracks deliverable-specific failures

    **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.
    **Verified by:** createDeliverableValidationError formats file and reason, createDeliverableValidationError includes optional deliverableName, createDeliverableValidationError omits deliverableName when not provided, createDeliverableValidationError includes validation errors

    @function:createDeliverableValidationError @happy-path
    Scenario: createDeliverableValidationError formats file and reason
      When I create a DeliverableValidationError for "specs/feature.feature" with reason "Invalid deliverable data"
      Then the error type should be "DELIVERABLE_VALIDATION_ERROR"
      And the error file should be "specs/feature.feature"
      And the error reason should be "Invalid deliverable data"

    @function:createDeliverableValidationError
    Scenario: createDeliverableValidationError includes optional deliverableName
      When I create a DeliverableValidationError for deliverable "MyDeliverable"
      Then the error deliverableName should be "MyDeliverable"
      And the error message should contain "MyDeliverable"

    @function:createDeliverableValidationError
    Scenario: createDeliverableValidationError omits deliverableName when not provided
      When I create a DeliverableValidationError without deliverableName
      Then the error should not have deliverableName property

    @function:createDeliverableValidationError
    Scenario: createDeliverableValidationError includes validation errors
      When I create a DeliverableValidationError with validation errors:
        | error                 |
        | name: Required        |
        | tests: Expected number|
      Then the error validationErrors should have 2 items
