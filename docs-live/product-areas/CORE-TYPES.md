# CoreTypes Overview

**Purpose:** CoreTypes product area overview
**Detail Level:** Full reference

---

**What foundational types exist?** CoreTypes provides the foundational type system used across all other areas. Three pillars enforce discipline at compile time: the Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. The DocError discriminated union provides structured error context with type, file, line, and reason fields, enabling exhaustive pattern matching in error handlers. Branded types create nominal typing from structural TypeScript — `PatternId`, `CategoryName`, and `SourceFilePath` are compile-time distinct despite all being strings. String utilities handle slugification and case conversion with acronym-aware title casing.

## Key Invariants

- Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled. `isOk`/`isErr` type guards enable safe narrowing
- DocError discriminated union: 12 structured error types with `type` discriminator field. `isDocError` type guard for safe classification. Specialized union aliases (`ScanError`, `ExtractionError`) scope error handling per operation
- Branded nominal types: `Branded<T, Brand>` creates compile-time distinct types from structural TypeScript. Prevents mixing `PatternId` with `CategoryName` even though both are `string` at runtime
- String transformation consistency: `slugify` produces URL-safe identifiers, `camelCaseToTitleCase` preserves acronyms (e.g., "APIEndpoint" becomes "API Endpoint"), `toKebabCase` handles consecutive uppercase correctly

---

## Contents

- [Key Invariants](#key-invariants)
- [Core Type System](#core-type-system)
- [Error Handling Flow](#error-handling-flow)
- [API Types](#api-types)
- [Business Rules](#business-rules)

---

## Core Type System

Scoped architecture diagram showing component relationships:

```mermaid
C4Context
    title Core Type System
    System(ResultMonad, "ResultMonad")
    System(ErrorFactories, "ErrorFactories")
    System(StringUtils, "StringUtils")
    System(KebabCaseSlugs, "KebabCaseSlugs")
    System(ErrorHandlingUnification, "ErrorHandlingUnification")
    Rel(KebabCaseSlugs, StringUtils, "depends on")
    Rel(ErrorHandlingUnification, ResultMonad, "depends on")
    Rel(ErrorHandlingUnification, ErrorFactories, "depends on")
```

---

## Error Handling Flow

Scoped architecture diagram showing component relationships:

```mermaid
graph LR
    ResultMonad["ResultMonad"]
    ErrorFactories["ErrorFactories"]
    StringUtils["StringUtils"]
    KebabCaseSlugs["KebabCaseSlugs"]
    ErrorHandlingUnification["ErrorHandlingUnification"]
    KebabCaseSlugs -.->|depends on| StringUtils
    ErrorHandlingUnification -.->|depends on| ResultMonad
    ErrorHandlingUnification -.->|depends on| ErrorFactories
```

---

## API Types

### BaseDocError (interface)

```typescript
/**
 * Base error interface for all documentation errors
 *
 */
```

```typescript
interface BaseDocError {
  /** Error type discriminator for pattern matching */
  readonly type: string;
  /** Human-readable error message */
  readonly message: string;
}
```

| Property | Description |
| --- | --- |
| type | Error type discriminator for pattern matching |
| message | Human-readable error message |

### Result (type)

```typescript
/**
 * Result type representing either success (Ok) or failure (Err)
 *
 * @typeParam T - The success value type
 * @typeParam E - The error type (defaults to Error)
 */
```

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;
```

### DocError (type)

```typescript
/**
 * Discriminated union of all possible errors
 *
 * **Benefits**:
 * - Exhaustive pattern matching in switch statements
 * - Type narrowing based on `type` field
 * - Compile-time verification of error handling
 *
 */
```

```typescript
type DocError =
  | FileSystemError
  | FileParseError
  | DirectiveValidationError
  | PatternValidationError
  | RegistryValidationError
  | MarkdownGenerationError
  | FileWriteError
  | FeatureParseError
  | ConfigError
  | ProcessMetadataValidationError
  | DeliverableValidationError
  | GherkinPatternValidationError;
```

---

## Business Rules

5 patterns, 22 rules with invariants (22 total)

### Error Factories

| Rule | Invariant | Rationale |
| --- | --- | --- |
| createFileSystemError produces discriminated FILE_SYSTEM_ERROR types | Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason. | File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths. |
| createDirectiveValidationError formats file location with line number | Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output. | The "file:line" format enables click-to-navigate in IDEs and terminals, turning validation errors into actionable links rather than requiring manual file/line lookup. |
| createPatternValidationError captures pattern identity and validation details | Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics. | Pattern names appear across many source files; without the pattern name and file path in the error, developers cannot locate which annotation triggered the validation failure. |
| createProcessMetadataValidationError validates Gherkin process metadata | Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation. | Process metadata (status, phase, deliverables) drives FSM validation and documentation generation; silent metadata errors propagate incorrect state across all downstream consumers. |
| createDeliverableValidationError tracks deliverable-specific failures | Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation. | Features often contain multiple deliverables; without the deliverable name in the error, developers must manually inspect the entire Background table to find the failing row. |

### Error Handling Unification

| Rule | Invariant | Rationale |
| --- | --- | --- |
| isDocError type guard classifies errors correctly | isDocError must return true for valid DocError instances and false for non-DocError values including null and undefined. | Without a reliable type guard, error handlers cannot safely narrow unknown caught values to DocError, forcing unsafe casts or redundant field checks at every catch site. |
| formatDocError produces structured human-readable output | formatDocError must include all context fields (error type, file path, line number) and render validation errors when present on pattern errors. | Omitting context fields forces developers to cross-reference logs with source files manually; including all fields in a single formatted message makes errors actionable on first read. |
| Gherkin extractor collects errors without console side effects | Extraction errors must include structured context (file path, pattern name, validation errors) and must never use console.warn to report warnings. | console.warn bypasses error collection, making warnings invisible to callers and untestable. Structured error objects enable programmatic handling across all consumers. |
| CLI error handler formats unknown errors gracefully | Unknown error values (non-DocError, non-Error) must be formatted as "Error: {value}" strings for safe display without crashing. | CLI commands can receive arbitrary thrown values (strings, numbers, objects); coercing them to a safe string prevents the error handler itself from crashing on unexpected types. |

### Kebab Case Slugs

| Rule | Invariant | Rationale |
| --- | --- | --- |
| CamelCase names convert to kebab-case | CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase. | Generated file names and URL fragments must be human-readable and URL-safe; unsplit CamelCase produces opaque slugs that are difficult to scan in directory listings. |
| Edge cases are handled correctly | Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs. | Unhandled edge cases produce malformed file names (double hyphens, leading dashes) that break cross-platform path resolution and make generated links inconsistent. |
| Requirements include phase prefix | Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned. | Phase prefixes enable lexicographic sorting of requirement files by delivery order, so directory listings naturally reflect the roadmap sequence. |
| Phase slugs use kebab-case for names | Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided. | A consistent "phase-NN-name" format ensures phase files sort numerically and remain identifiable even when the phase number alone would be ambiguous across roadmap versions. |

### Result Monad

| Rule | Invariant | Rationale |
| --- | --- | --- |
| Result.ok wraps values into success results | Result.ok always produces a result where isOk is true, regardless of the wrapped value type (primitives, objects, null, undefined). | Consumers rely on isOk to branch logic; if Result.ok could produce an ambiguous state, every call site would need defensive checks beyond the type guard. |
| Result.err wraps values into error results | Result.err always produces a result where isErr is true, supporting Error instances, strings, and structured objects as error values. | Supporting multiple error value types allows callers to propagate rich context (structured objects) or simple messages (strings) without forcing a single error representation. |
| Type guards distinguish success from error results | isOk and isErr are mutually exclusive: exactly one returns true for any Result value. | If both guards could return true (or both false), TypeScript type narrowing would break, leaving the value/error branch unreachable or unsound. |
| unwrap extracts the value or throws the error | unwrap on a success result returns the value; unwrap on an error result always throws an Error instance (wrapping non-Error values for stack trace preservation). | Wrapping non-Error values in Error instances ensures stack traces are always available for debugging, preventing the loss of call-site context when string or object errors are thrown. |
| unwrapOr extracts the value or returns a default | unwrapOr on a success result returns the contained value (ignoring the default); on an error result it returns the provided default value. | Providing a safe fallback path avoids forcing callers to handle errors explicitly when a sensible default exists, reducing boilerplate in non-critical error recovery. |
| map transforms the success value without affecting errors | map applies the transformation function only to success results; error results pass through unchanged. Multiple maps can be chained. | Skipping the transformation on error results enables chained pipelines to short-circuit on the first failure without requiring explicit error checks at each step. |
| mapErr transforms the error value without affecting successes | mapErr applies the transformation function only to error results; success results pass through unchanged. Error types can be converted. | Allowing error-type conversion at boundaries (e.g., low-level I/O errors to domain errors) keeps success paths untouched and preserves the original value through error-handling layers. |

### String Utils

| Rule | Invariant | Rationale |
| --- | --- | --- |
| slugify generates URL-safe slugs | slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens. | URL slugs appear in file paths and links across all generated documentation; inconsistent slugification would break cross-references. |
| camelCaseToTitleCase generates readable titles | camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP, XML, API, DoD, AST, GraphQL). | Pattern names stored as PascalCase identifiers appear as human-readable titles in generated documentation; incorrect splitting would produce unreadable headings. |

---
