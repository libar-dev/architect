@libar-docs
@libar-docs-pattern:ErrorHandlingUnification
@libar-docs-status:completed
@libar-docs-product-area:CoreTypes
@libar-docs-include:core-types
@libar-docs-depends-on:ResultMonad,ErrorFactories
@behavior @error-handling
Feature: Error Handling Unification
  All CLI commands and extractors should use the DocError discriminated
  union pattern for consistent, structured error handling.

  **Problem:**
  - Raw errors lack context (no file path, line number, or pattern name)
  - Inconsistent error formats across CLI, scanner, and extractor
  - console.warn bypasses error collection, losing validation warnings
  - Unknown errors produce unhelpful messages

  **Solution:**
  - DocError discriminated union with structured context (type, file, line, reason)
  - isDocError type guard for safe error classification
  - formatDocError for human-readable output with all context fields
  - Error collection pattern that captures warnings without console output

  Background: Error handling context
    Given an error handling context

  Rule: isDocError type guard classifies errors correctly

      **Invariant:** isDocError must return true for valid DocError instances and false for non-DocError values including null and undefined.

      **Verified by:** isDocError detects valid DocError instances, isDocError rejects non-DocError objects, isDocError rejects null and undefined

    @happy-path @cli
    Scenario: isDocError detects valid DocError instances
      Given a DocError of type "FILE_PARSE_ERROR" with file "/test.ts"
      When I check if it is a DocError
      Then isDocError should return true

    @happy-path @cli
    Scenario: isDocError rejects non-DocError objects
      Given a plain Error with message "Something went wrong"
      When I check if it is a DocError
      Then isDocError should return false

    @happy-path @cli
    Scenario: isDocError rejects null and undefined
      Given a null value
      When I check if it is a DocError
      Then isDocError should return false

  Rule: formatDocError produces structured human-readable output

      **Invariant:** formatDocError must include all context fields (error type, file path, line number) and render validation errors when present on pattern errors.

      **Verified by:** formatDocError includes structured context, formatDocError includes validation errors for pattern errors

    @happy-path @cli
    Scenario: formatDocError includes structured context
      Given a DocError of type "FILE_PARSE_ERROR" with:
        | field   | value           |
        | file    | /path/to/src.ts |
        | line    | 42              |
        | reason  | Syntax error    |
      When I format the DocError
      Then the formatted output should contain the error type "[FILE_PARSE_ERROR]"
      And the formatted output should contain the file path "File: /path/to/src.ts"
      And the formatted output should contain the line number "Line: 42"

    @happy-path @cli
    Scenario: formatDocError includes validation errors for pattern errors
      Given a DocError of type "GHERKIN_PATTERN_VALIDATION_ERROR" with:
        | field            | value           |
        | file             | test.feature    |
        | patternName      | TestPattern     |
        | reason           | Schema failed   |
        | validationErrors | id: Required, category: Invalid enum |
      When I format the DocError
      Then the formatted output should contain the pattern name "Pattern: TestPattern"
      And the formatted output should contain "Validation errors:"
      And the formatted output should contain the first validation error "id: Required"

  Rule: Gherkin extractor collects errors without console side effects

      **Invariant:** Extraction errors must include structured context (file path, pattern name, validation errors) and must never use console.warn to report warnings.

      **Rationale:** console.warn bypasses error collection, making warnings invisible to callers and untestable. Structured error objects enable programmatic handling across all consumers.

      **Verified by:** Errors include structured context, No console.warn bypasses error collection, Skip feature files without @libar-docs opt-in

    @acceptance-criteria @extractor
    Scenario: Errors include structured context
      Given a Gherkin feature file with invalid pattern data
      When the feature is extracted with invalid schema data
      Then the extraction result should contain errors
      And each error should include file path
      And each error should include pattern name
      And each error should include validation errors

    @acceptance-criteria @extractor
    Scenario: No console.warn bypasses error collection
      Given a Gherkin feature file that would trigger validation warning
      When I extract patterns from the feature file
      Then the extraction result errors array should contain the warning
      And console.warn should not have been called

    @edge-case @extractor @opt-in-required
    Scenario: Skip feature files without @libar-docs opt-in
      Given a Gherkin feature file without @libar-docs opt-in marker
      When patterns are extracted from Gherkin files
      Then no patterns should be extracted

  Rule: CLI error handler formats unknown errors gracefully

      **Invariant:** Unknown error values (non-DocError, non-Error) must be formatted as "Error: {value}" strings for safe display without crashing.

      **Verified by:** handleCliError formats unknown errors

    @edge-case @cli
    Scenario: handleCliError formats unknown errors
      Given an unknown error value "string error"
      When handleCliError formats the error
      Then the output should contain "Error: string error"
