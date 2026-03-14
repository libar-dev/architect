# Core Types Business Rules

**Purpose:** Business rules for the Core Types product area

---

**34 rules** from 9 features. 34 rules have explicit invariants.

---

## Phase 44

### Kebab Case Slugs

_As a documentation generator_

---

#### CamelCase names convert to kebab-case

> **Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase.
>
> **Rationale:** Generated file names and URL fragments must be human-readable and URL-safe; unsplit CamelCase produces opaque slugs that are difficult to scan in directory listings.

**Verified by:**

- Convert pattern names to readable slugs

---

#### Edge cases are handled correctly

> **Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs.
>
> **Rationale:** Unhandled edge cases produce malformed file names (double hyphens, leading dashes) that break cross-platform path resolution and make generated links inconsistent.

**Verified by:**

- Handle edge cases in slug generation

---

#### Requirements include phase prefix

> **Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned.
>
> **Rationale:** Phase prefixes enable lexicographic sorting of requirement files by delivery order, so directory listings naturally reflect the roadmap sequence.

**Verified by:**

- Requirement slugs include phase number
- Requirement without phase uses phase 00

---

#### Phase slugs use kebab-case for names

> **Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided.
>
> **Rationale:** A consistent "phase-NN-name" format ensures phase files sort numerically and remain identifiable even when the phase number alone would be ambiguous across roadmap versions.

**Verified by:**

- Phase slugs combine number and kebab-case name
- Phase without name uses "unnamed"

_kebab-case-slugs.feature_

---

## Uncategorized

### Deliverable Status Taxonomy

_The deliverable status module defines the 6 canonical status values for_

---

#### isDeliverableStatusTerminal identifies terminal statuses for DoD validation

> **Invariant:** Only complete, n/a, and superseded are terminal. Deferred is NOT terminal because it implies unfinished work that should block DoD.
>
> **Rationale:** Marking a pattern as completed when deliverables are merely deferred creates a hard-locked state with incomplete work, violating delivery process integrity.

**Verified by:**

- Terminal status classification

---

#### Status predicates classify individual deliverable states

> **Invariant:** isDeliverableStatusComplete, isDeliverableStatusInProgress, and isDeliverableStatusPending each match exactly one status value.
>
> **Rationale:** Single-value predicates provide type-safe branching for consumers that need to distinguish specific states rather than terminal vs non-terminal groupings.

**Verified by:**

- isDeliverableStatusComplete classification
- isDeliverableStatusInProgress classification
- isDeliverableStatusPending classification

---

#### getDeliverableStatusEmoji returns display emoji for all statuses

> **Invariant:** getDeliverableStatusEmoji returns a non-empty string for all 6 canonical statuses. No status value is unmapped.
>
> **Rationale:** Missing emoji mappings would cause empty display cells in generated documentation tables, breaking visual consistency.

**Verified by:**

- Emoji mapping for all statuses

_deliverable-status.feature_

### Error Factories

_Error factories create structured, discriminated error types with consistent_

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
>
> **Rationale:** The "file:line" format enables click-to-navigate in IDEs and terminals, turning validation errors into actionable links rather than requiring manual file/line lookup.

**Verified by:**

- createDirectiveValidationError includes line number in message
- createDirectiveValidationError includes optional directive snippet
- createDirectiveValidationError omits directive when not provided

---

#### createPatternValidationError captures pattern identity and validation details

> **Invariant:** Every PatternValidationError must include the pattern name, source file path, and reason, with an optional array of specific validation errors for detailed diagnostics.
>
> **Rationale:** Pattern names appear across many source files; without the pattern name and file path in the error, developers cannot locate which annotation triggered the validation failure.

**Verified by:**

- createPatternValidationError formats pattern name and file
- createPatternValidationError includes validation errors array
- createPatternValidationError omits validationErrors when not provided

---

#### createProcessMetadataValidationError validates Gherkin process metadata

> **Invariant:** Every ProcessMetadataValidationError must include the feature file path and a reason describing which metadata field failed validation.
>
> **Rationale:** Process metadata (status, phase, deliverables) drives FSM validation and documentation generation; silent metadata errors propagate incorrect state across all downstream consumers.

**Verified by:**

- createProcessMetadataValidationError formats file and reason
- createProcessMetadataValidationError includes readonly validation errors

---

#### createDeliverableValidationError tracks deliverable-specific failures

> **Invariant:** Every DeliverableValidationError must include the feature file path and reason, with optional deliverableName for pinpointing which deliverable failed validation.
>
> **Rationale:** Features often contain multiple deliverables; without the deliverable name in the error, developers must manually inspect the entire Background table to find the failing row.

**Verified by:**

- createDeliverableValidationError formats file and reason
- createDeliverableValidationError includes optional deliverableName
- createDeliverableValidationError omits deliverableName when not provided
- createDeliverableValidationError includes validation errors

_error-factories.feature_

### Error Handling Unification

_- Raw errors lack context (no file path, line number, or pattern name)_

---

#### isDocError type guard classifies errors correctly

> **Invariant:** isDocError must return true for valid DocError instances and false for non-DocError values including null and undefined.
>
> **Rationale:** Without a reliable type guard, error handlers cannot safely narrow unknown caught values to DocError, forcing unsafe casts or redundant field checks at every catch site.

**Verified by:**

- isDocError detects valid DocError instances
- isDocError rejects non-DocError objects
- isDocError rejects null and undefined

---

#### formatDocError produces structured human-readable output

> **Invariant:** formatDocError must include all context fields (error type, file path, line number) and render validation errors when present on pattern errors.
>
> **Rationale:** Omitting context fields forces developers to cross-reference logs with source files manually; including all fields in a single formatted message makes errors actionable on first read.

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
>
> **Rationale:** CLI commands can receive arbitrary thrown values (strings, numbers, objects); coercing them to a safe string prevents the error handler itself from crashing on unexpected types.

**Verified by:**

- handleCliError formats unknown errors

_error-handling.feature_

### File Cache

_The file cache provides request-scoped content caching for generation runs._

---

#### Store and retrieve round-trip preserves content

> **Invariant:** Content stored via set is returned identically by get. No transformation or encoding occurs.
>
> **Rationale:** File content must survive caching verbatim; any mutation would cause extraction to produce different results on cache hits vs misses.

**Verified by:**

- Store and retrieve returns same content
- Non-existent path returns undefined

---

#### has checks membership without affecting stats

> **Invariant:** has returns true for cached paths and false for uncached paths. It does not increment hit or miss counters.
>
> **Rationale:** has is used for guard checks before get; double-counting would inflate stats and misrepresent actual cache effectiveness.

**Verified by:**

- has returns true for cached path
- has returns false for uncached path

---

#### Stats track hits and misses accurately

> **Invariant:** Every get call increments either hits or misses. hitRate is computed as (hits / total) \* 100 with a zero-division guard returning 0 when total is 0.
>
> **Rationale:** Accurate stats enable performance analysis of generation runs; incorrect counts would lead to wrong caching decisions.

**Verified by:**

- Stats track hits and misses
- Hit rate starts at zero for empty cache
- Hit rate is 100 when all gets are hits

---

#### Clear resets cache and stats

> **Invariant:** clear removes all cached entries and resets hit/miss counters to zero.
>
> **Rationale:** Per-run scoping requires a clean slate; stale entries from a previous run would cause the extractor to use outdated content.

**Verified by:**

- Clear resets everything

_file-cache.feature_

### Normalized Status

_The normalized status module maps raw FSM states (roadmap, active, completed,_

---

#### normalizeStatus maps raw FSM states to display buckets

> **Invariant:** normalizeStatus must map every raw FSM status to exactly one of three display buckets: completed, active, or planned. Unknown or undefined inputs default to planned.
>
> **Rationale:** UI and generated documentation need a simplified status model; the raw 4-state FSM is an implementation detail that should not leak into display logic.

**Verified by:**

- Status normalization
- normalizeStatus defaults undefined to planned
- normalizeStatus defaults unknown status to planned

---

#### Pattern status predicates check normalized state

> **Invariant:** isPatternComplete, isPatternActive, and isPatternPlanned are mutually exclusive for any given status input. Exactly one returns true.
>
> **Rationale:** Consumers branch on these predicates; overlapping true values would cause double-rendering or contradictory UI states.

**Verified by:**

- isPatternComplete classification
- isPatternActive classification
- isPatternPlanned classification

_normalized-status.feature_

### Result Monad

_The Result type provides explicit error handling via a discriminated union._

---

#### Result.ok wraps values into success results

> **Invariant:** Result.ok always produces a result where isOk is true, regardless of the wrapped value type (primitives, objects, null, undefined).
>
> **Rationale:** Consumers rely on isOk to branch logic; if Result.ok could produce an ambiguous state, every call site would need defensive checks beyond the type guard.

**Verified by:**

- Result.ok wraps a primitive value
- Result.ok wraps an object value
- Result.ok wraps null value
- Result.ok wraps undefined value

---

#### Result.err wraps values into error results

> **Invariant:** Result.err always produces a result where isErr is true, supporting Error instances, strings, and structured objects as error values.
>
> **Rationale:** Supporting multiple error value types allows callers to propagate rich context (structured objects) or simple messages (strings) without forcing a single error representation.

**Verified by:**

- Result.err wraps an Error instance
- Result.err wraps a string error
- Result.err wraps a structured error object

---

#### Type guards distinguish success from error results

> **Invariant:** isOk and isErr are mutually exclusive: exactly one returns true for any Result value.
>
> **Rationale:** If both guards could return true (or both false), TypeScript type narrowing would break, leaving the value/error branch unreachable or unsound.

**Verified by:**

- Type guards correctly identify success results
- Type guards correctly identify error results

---

#### unwrap extracts the value or throws the error

> **Invariant:** unwrap on a success result returns the value; unwrap on an error result always throws an Error instance (wrapping non-Error values for stack trace preservation).
>
> **Rationale:** Wrapping non-Error values in Error instances ensures stack traces are always available for debugging, preventing the loss of call-site context when string or object errors are thrown.

**Verified by:**

- unwrap extracts value from success result
- unwrap throws the Error from error result
- unwrap wraps non-Error in Error for proper stack trace
- unwrap serializes object error to JSON in message

---

#### unwrapOr extracts the value or returns a default

> **Invariant:** unwrapOr on a success result returns the contained value (ignoring the default); on an error result it returns the provided default value.
>
> **Rationale:** Providing a safe fallback path avoids forcing callers to handle errors explicitly when a sensible default exists, reducing boilerplate in non-critical error recovery.

**Verified by:**

- unwrapOr returns value from success result
- unwrapOr returns default from error result
- unwrapOr returns numeric default from error result

---

#### map transforms the success value without affecting errors

> **Invariant:** map applies the transformation function only to success results; error results pass through unchanged. Multiple maps can be chained.
>
> **Rationale:** Skipping the transformation on error results enables chained pipelines to short-circuit on the first failure without requiring explicit error checks at each step.

**Verified by:**

- map transforms success value
- map passes through error unchanged
- map chains multiple transformations

---

#### mapErr transforms the error value without affecting successes

> **Invariant:** mapErr applies the transformation function only to error results; success results pass through unchanged. Error types can be converted.
>
> **Rationale:** Allowing error-type conversion at boundaries (e.g., low-level I/O errors to domain errors) keeps success paths untouched and preserves the original value through error-handling layers.

**Verified by:**

- mapErr transforms error value
- mapErr passes through success unchanged
- mapErr converts error type

_result-monad.feature_

### String Utils

_String utilities provide consistent text transformations across the codebase._

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

_string-utils.feature_

### Tag Registry Builder

_The tag registry builder constructs a complete TagRegistry from TypeScript_

---

#### buildRegistry returns a well-formed TagRegistry

> **Invariant:** buildRegistry always returns a TagRegistry with version, categories, metadataTags, aggregationTags, formatOptions, tagPrefix, and fileOptInTag properties.
>
> **Rationale:** All downstream consumers (scanner, extractor, validator) depend on registry structure. A malformed registry would cause silent extraction failures across the entire pipeline.

**Verified by:**

- Registry has correct version
- Registry has expected category count
- Registry has required metadata tags

---

#### Metadata tags have correct configuration

> **Invariant:** The pattern tag is required, the status tag has a default value, and tags with transforms apply them correctly.
>
> **Rationale:** Misconfigured tag metadata would cause the extractor to skip required fields or apply wrong defaults, producing silently corrupt patterns.

**Verified by:**

- Pattern tag is marked as required
- Status tag has default value
- Transform functions work correctly

---

#### Registry includes standard prefixes and opt-in tag

> **Invariant:** tagPrefix is the standard annotation prefix and fileOptInTag is the bare opt-in marker. These are non-empty strings.
>
> **Rationale:** Changing these values without updating all annotated files would break scanner opt-in detection across the entire monorepo.

**Verified by:**

- Registry has standard tag prefix and opt-in tag

_tag-registry-builder.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
