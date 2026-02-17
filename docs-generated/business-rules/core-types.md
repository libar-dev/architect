# CoreTypes Business Rules

**Purpose:** Business rules for the CoreTypes product area

---

**22 rules** from 5 features. 22 rules have explicit invariants.

---

## Phase 44

### Kebab Case Slugs

*As a documentation generator*

---

#### CamelCase names convert to kebab-case

> **Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase.

**Verified by:**
- Convert pattern names to readable slugs

---

#### Edge cases are handled correctly

> **Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs.

**Verified by:**
- Handle edge cases in slug generation

---

#### Requirements include phase prefix

> **Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned.

**Verified by:**
- Requirement slugs include phase number
- Requirement without phase uses phase 00

---

#### Phase slugs use kebab-case for names

> **Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided.

**Verified by:**
- Phase slugs combine number and kebab-case name
- Phase without name uses "unnamed"

*kebab-case-slugs.feature*

---

## Uncategorized

### Error Factories

*Error factories create structured, discriminated error types with consistent*

---

#### createFileSystemError produces discriminated FILE_SYSTEM_ERROR types

> **Invariant:** Every FileSystemError must have type "FILE_SYSTEM_ERROR", the source file path, a reason enum value, and a human-readable message derived from the reason.
>
> **Rationale:** File system errors are the most common failure mode in the scanner; discriminated types enable exhaustive switch/case handling in error recovery paths.

**Verified by:**
- createFileSystemError generates correct message for each reason
- createFileSystemError includes optional originalError
- createFileSystemError omits originalError when not provided

---

#### createDirectiveValidationError formats file location with line number

> **Invariant:** Every DirectiveValidationError must include the source file path, line number, and reason, with the message formatted as "file:line" for IDE-clickable error output.

**Verified by:**
- createDirectiveValidationError includes line number in message
- createDirectiveValidationError includes optional directive snippet
- createDirectiveValidationError omits directive when not provided

---

#### createPatternValidationError captures pattern identity and validation details

> **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.

**Verified by:**
- createPatternValidationError formats pattern name and file
- createPatternValidationError includes validation errors array
- createPatternValidationError omits validationErrors when not provided

---

#### createProcessMetadataValidationError validates Gherkin process metadata

> **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.

**Verified by:**
- createProcessMetadataValidationError formats file and reason
- createProcessMetadataValidationError includes readonly validation errors

---

#### createDeliverableValidationError tracks deliverable-specific failures

> **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.

**Verified by:**
- createDeliverableValidationError formats file and reason
- createDeliverableValidationError includes optional deliverableName
- createDeliverableValidationError omits deliverableName when not provided
- createDeliverableValidationError includes validation errors

*error-factories.feature*

### Error Handling Unification

*- Raw errors lack context (no file path, line number, or pattern name)*

---

#### isDocError type guard classifies errors correctly

> **Invariant:** isDocError must return true for valid DocError instances and false for non-DocError values including null and undefined.

**Verified by:**
- isDocError detects valid DocError instances
- isDocError rejects non-DocError objects
- isDocError rejects null and undefined

---

#### formatDocError produces structured human-readable output

> **Invariant:** formatDocError must include all context fields (error type, file path, line number) and render validation errors when present on pattern errors.

**Verified by:**
- formatDocError includes structured context
- formatDocError includes validation errors for pattern errors

---

#### Gherkin extractor collects errors without console side effects

> **Invariant:** Extraction errors must include structured context (file path, pattern name, validation errors) and must never use console.warn to report warnings.
>
> **Rationale:** console.warn bypasses error collection, making warnings invisible to callers and untestable. Structured error objects enable programmatic handling across all consumers.

**Verified by:**
- Errors include structured context
- No console.warn bypasses error collection
- Skip feature files without @libar-docs opt-in

---

#### CLI error handler formats unknown errors gracefully

> **Invariant:** Unknown error values (non-DocError, non-Error) must be formatted as "Error: {value}" strings for safe display without crashing.

**Verified by:**
- handleCliError formats unknown errors

*error-handling.feature*

### Result Monad

*The Result type provides explicit error handling via a discriminated union.*

---

#### Result.ok wraps values into success results

> **Invariant:** Result.ok always produces a result where isOk is true, regardless of the wrapped value type (primitives, objects, null, undefined).

**Verified by:**
- Result.ok wraps a primitive value
- Result.ok wraps an object value
- Result.ok wraps null value
- Result.ok wraps undefined value

---

#### Result.err wraps values into error results

> **Invariant:** Result.err always produces a result where isErr is true, supporting Error instances, strings, and structured objects as error values.

**Verified by:**
- Result.err wraps an Error instance
- Result.err wraps a string error
- Result.err wraps a structured error object

---

#### Type guards distinguish success from error results

> **Invariant:** isOk and isErr are mutually exclusive: exactly one returns true for any Result value.

**Verified by:**
- Type guards correctly identify success results
- Type guards correctly identify error results

---

#### unwrap extracts the value or throws the error

> **Invariant:** unwrap on a success result returns the value; unwrap on an error result always throws an Error instance (wrapping non-Error values for stack trace preservation).

**Verified by:**
- unwrap extracts value from success result
- unwrap throws the Error from error result
- unwrap wraps non-Error in Error for proper stack trace
- unwrap serializes object error to JSON in message

---

#### unwrapOr extracts the value or returns a default

> **Invariant:** unwrapOr on a success result returns the contained value (ignoring the default); on an error result it returns the provided default value.

**Verified by:**
- unwrapOr returns value from success result
- unwrapOr returns default from error result
- unwrapOr returns numeric default from error result

---

#### map transforms the success value without affecting errors

> **Invariant:** map applies the transformation function only to success results; error results pass through unchanged. Multiple maps can be chained.

**Verified by:**
- map transforms success value
- map passes through error unchanged
- map chains multiple transformations

---

#### mapErr transforms the error value without affecting successes

> **Invariant:** mapErr applies the transformation function only to error results; success results pass through unchanged. Error types can be converted.

**Verified by:**
- mapErr transforms error value
- mapErr passes through success unchanged
- mapErr converts error type

*result-monad.feature*

### String Utils

*String utilities provide consistent text transformations across the codebase.*

---

#### slugify generates URL-safe slugs

> **Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.
>
> **Rationale:** URL slugs appear in file paths and links across all generated documentation; inconsistent slugification would break cross-references.

**Verified by:**
- slugify converts text to URL-safe format
- slugify handles empty-ish input
- slugify handles single word

---

#### camelCaseToTitleCase generates readable titles

> **Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP, XML, API, DoD, AST, GraphQL).
>
> **Rationale:** Pattern names stored as PascalCase identifiers appear as human-readable titles in generated documentation; incorrect splitting would produce unreadable headings.

**Verified by:**
- camelCaseToTitleCase converts to title case
- camelCaseToTitleCase handles all-uppercase acronym
- camelCaseToTitleCase handles lowercase word

*string-utils.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
