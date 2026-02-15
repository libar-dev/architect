=== CORETYPES OVERVIEW ===

Purpose: CoreTypes product area overview
Detail Level: Compact summary

**What foundational types exist?** CoreTypes provides the foundational type system used across all other areas. Three pillars enforce discipline at compile time: the Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. The DocError discriminated union provides structured error context with type, file, line, and reason fields, enabling exhaustive pattern matching in error handlers. Branded types create nominal typing from structural TypeScript — `PatternId`, `CategoryName`, and `SourceFilePath` are compile-time distinct despite all being strings. String utilities handle slugification and case conversion with acronym-aware title casing.

=== KEY INVARIANTS ===

- Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled. `isOk`/`isErr` type guards enable safe narrowing
- DocError discriminated union: 12 structured error types with `type` discriminator field. `isDocError` type guard for safe classification. Specialized union aliases (`ScanError`, `ExtractionError`) scope error handling per operation
- Branded nominal types: `Branded<T, Brand>` creates compile-time distinct types from structural TypeScript. Prevents mixing `PatternId` with `CategoryName` even though both are `string` at runtime
- String transformation consistency: `slugify` produces URL-safe identifiers, `camelCaseToTitleCase` preserves acronyms (e.g., "APIEndpoint" becomes "API Endpoint"), `toKebabCase` handles consecutive uppercase correctly

=== API TYPES ===

| Type         | Kind      |
| ------------ | --------- |
| BaseDocError | interface |
| Result       | type      |
| DocError     | type      |

=== BEHAVIOR SPECIFICATIONS ===

--- ResultMonadTypes ---

--- ErrorFactoryTypes ---

--- StringUtils ---

| Rule                                           | Description                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| slugify generates URL-safe slugs               | **Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.... |
| camelCaseToTitleCase generates readable titles | **Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP,...  |

--- ResultMonad ---

| Rule                                                          | Description                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Result.ok wraps values into success results                   | **Invariant:** Result.ok always produces a result where isOk is true, regardless of the wrapped value type...            |
| Result.err wraps values into error results                    | **Invariant:** Result.err always produces a result where isErr is true, supporting Error instances, strings, and...      |
| Type guards distinguish success from error results            | **Invariant:** isOk and isErr are mutually exclusive: exactly one returns true for any Result value.<br> \*\*Verified... |
| unwrap extracts the value or throws the error                 | **Invariant:** unwrap on a success result returns the value; unwrap on an error result always throws an Error...         |
| unwrapOr extracts the value or returns a default              | **Invariant:** unwrapOr on a success result returns the contained value (ignoring the default); on an error result it... |
| map transforms the success value without affecting errors     | **Invariant:** map applies the transformation function only to success results; error results pass through unchanged.... |
| mapErr transforms the error value without affecting successes | **Invariant:** mapErr applies the transformation function only to error results; success results pass through...         |

--- ErrorFactories ---

| Rule                                                                          | Description                                                                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| createFileSystemError produces discriminated FILE_SYSTEM_ERROR types          | **Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value,...  |
| createDirectiveValidationError formats file location with line number         | **Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the...   |
| createPatternValidationError captures pattern identity and validation details | **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an...     |
| createProcessMetadataValidationError validates Gherkin process metadata       | **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which... |
| createDeliverableValidationError tracks deliverable-specific failures         | **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional...         |

--- KebabCaseSlugs ---

| Rule                                  | Description                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CamelCase names convert to kebab-case | **Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase....       |
| Edge cases are handled correctly      | **Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens... |
| Requirements include phase prefix     | **Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number,...        |
| Phase slugs use kebab-case for names  | **Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format...           |

--- ErrorHandlingUnification ---
