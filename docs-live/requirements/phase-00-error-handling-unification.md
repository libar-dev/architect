# ✅ Error Handling Unification

**Purpose:** Detailed requirements for the Error Handling Unification feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | CoreTypes |

## Description

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

## Acceptance Criteria

**isDocError detects valid DocError instances**

- Given a DocError of type "FILE_PARSE_ERROR" with file "/test.ts"
- When I check if it is a DocError
- Then isDocError should return true

**isDocError rejects non-DocError objects**

- Given a plain Error with message "Something went wrong"
- When I check if it is a DocError
- Then isDocError should return false

**isDocError rejects null and undefined**

- Given a null value
- When I check if it is a DocError
- Then isDocError should return false

**formatDocError includes structured context**

- Given a DocError of type "FILE_PARSE_ERROR" with:
- When I format the DocError
- Then the formatted output should contain the error type "[FILE_PARSE_ERROR]"
- And the formatted output should contain the file path "File: /path/to/src.ts"
- And the formatted output should contain the line number "Line: 42"

| field | value |
| --- | --- |
| file | /path/to/src.ts |
| line | 42 |
| reason | Syntax error |

**formatDocError includes validation errors for pattern errors**

- Given a DocError of type "GHERKIN_PATTERN_VALIDATION_ERROR" with:
- When I format the DocError
- Then the formatted output should contain the pattern name "Pattern: TestPattern"
- And the formatted output should contain "Validation errors:"
- And the formatted output should contain the first validation error "id: Required"

| field | value |
| --- | --- |
| file | test.feature |
| patternName | TestPattern |
| reason | Schema failed |
| validationErrors | id: Required, category: Invalid enum |

**Errors include structured context**

- Given a Gherkin feature file with invalid pattern data
- When the feature is extracted with invalid schema data
- Then the extraction result should contain errors
- And each error should include file path
- And each error should include pattern name
- And each error should include validation errors

**No console.warn bypasses error collection**

- Given a Gherkin feature file that would trigger validation warning
- When I extract patterns from the feature file
- Then the extraction result errors array should contain the warning
- And console.warn should not have been called

**Skip feature files without @libar-docs opt-in**

- Given a Gherkin feature file without @libar-docs opt-in marker
- When patterns are extracted from Gherkin files
- Then no patterns should be extracted

**handleCliError formats unknown errors**

- Given an unknown error value "string error"
- When handleCliError formats the error
- Then the output should contain "Error: string error"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
