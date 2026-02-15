# CoreTypes Overview

**Purpose:** CoreTypes product area overview
**Detail Level:** Full reference

---

**What foundational types exist?** Foundation types used across all other areas. The Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. DocError provides structured error context with type, file, line, and reason fields.

## Key Invariants

- Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled
- DocError discriminated union: Structured errors with type, file, line, reason. `isDocError` type guard for safe classification

---

## Behavior Specifications

### StringUtils

[View StringUtils source](tests/features/utils/string-utils.feature)

String utilities provide consistent text transformations across the codebase.
These functions handle URL slugification and case conversion with proper
handling of edge cases like acronyms and special characters.

**Covered functions:**

- `slugify` - Convert text to URL-safe slugs (lowercase, alphanumeric, hyphens)
- `camelCaseToTitleCase` - Convert CamelCase to "Title Case" with spaces

**Note:** `toKebabCase` is already tested in kebab-case-slugs.feature

### ResultMonad

[View ResultMonad source](tests/features/types/result-monad.feature)

The Result type provides explicit error handling via a discriminated union.
This eliminates thrown exceptions in favor of type-safe error propagation.

**Why Result over try/catch:**

- Compile-time verification that errors are handled
- Type narrowing via isOk/isErr guards
- Chainable transformations via map/mapErr
- No hidden control flow from thrown exceptions

### ErrorFactories

[View ErrorFactories source](tests/features/types/error-factories.feature)

Error factories create structured, discriminated error types with consistent
message formatting. Each error type has a unique discriminator for exhaustive
pattern matching in switch statements.

**Why typed errors matter:**

- Compile-time exhaustiveness checking in error handlers
- Consistent message formatting across the codebase
- Structured data for logging and reporting
- Type narrowing via discriminator field

### KebabCaseSlugs

[View KebabCaseSlugs source](tests/features/behavior/kebab-case-slugs.feature)

As a documentation generator
I need to generate readable, URL-safe slugs from pattern names
So that generated file names are discoverable and human-friendly

The slug generation must handle:

- CamelCase patterns like "DeciderPattern" → "decider-pattern"
- Consecutive uppercase like "APIEndpoint" → "api-endpoint"
- Numbers in names like "OAuth2Flow" → "o-auth-2-flow"
- Special characters removal
- Proper phase prefixing for requirements

<details>
<summary>CamelCase names convert to kebab-case (1 scenarios)</summary>

#### CamelCase names convert to kebab-case

**Verified by:**

- Convert pattern names to readable slugs

</details>

<details>
<summary>Edge cases are handled correctly (1 scenarios)</summary>

#### Edge cases are handled correctly

**Verified by:**

- Handle edge cases in slug generation

</details>

<details>
<summary>Requirements include phase prefix (2 scenarios)</summary>

#### Requirements include phase prefix

**Verified by:**

- Requirement slugs include phase number
- Requirement without phase uses phase 00

</details>

<details>
<summary>Phase slugs use kebab-case for names (2 scenarios)</summary>

#### Phase slugs use kebab-case for names

**Verified by:**

- Phase slugs combine number and kebab-case name
- Phase without name uses "unnamed"

</details>

### ErrorHandlingUnification

[View ErrorHandlingUnification source](tests/features/behavior/error-handling.feature)

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

---
