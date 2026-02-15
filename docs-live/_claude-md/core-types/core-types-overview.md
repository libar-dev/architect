=== CORETYPES OVERVIEW ===

Purpose: CoreTypes product area overview
Detail Level: Compact summary

**What foundational types exist?** Foundation types used across all other areas. The Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. DocError provides structured error context with type, file, line, and reason fields.

=== KEY INVARIANTS ===

- Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled
- DocError discriminated union: Structured errors with type, file, line, reason. `isDocError` type guard for safe classification

=== BEHAVIOR SPECIFICATIONS ===

--- StringUtils ---

| Rule                                           | Description                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| slugify generates URL-safe slugs               | **Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.... |
| camelCaseToTitleCase generates readable titles | **Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP,...  |

--- ResultMonad ---

--- ErrorFactories ---

| Rule                                                                          | Description                                                                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| createFileSystemError produces discriminated FILE_SYSTEM_ERROR types          | **Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value,...  |
| createDirectiveValidationError formats file location with line number         | **Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the...   |
| createPatternValidationError captures pattern identity and validation details | **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an...     |
| createProcessMetadataValidationError validates Gherkin process metadata       | **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which... |
| createDeliverableValidationError tracks deliverable-specific failures         | **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional...         |

--- KebabCaseSlugs ---

| Rule                                  | Description |
| ------------------------------------- | ----------- |
| CamelCase names convert to kebab-case |             |
| Edge cases are handled correctly      |             |
| Requirements include phase prefix     |             |
| Phase slugs use kebab-case for names  |             |

--- ErrorHandlingUnification ---
