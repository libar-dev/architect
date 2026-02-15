=== CORETYPES OVERVIEW ===

Purpose: CoreTypes product area overview
Detail Level: Compact summary

**What foundational types exist?** Foundation types used across all other areas. The Result monad replaces try/catch with explicit error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of throwing. DocError provides structured error context with type, file, line, and reason fields.

=== KEY INVARIANTS ===

- Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled
- DocError discriminated union: Structured errors with type, file, line, reason. `isDocError` type guard for safe classification

=== BEHAVIOR SPECIFICATIONS ===

--- StringUtils ---

--- ResultMonad ---

--- ErrorFactories ---

--- KebabCaseSlugs ---

| Rule                                  | Description |
| ------------------------------------- | ----------- |
| CamelCase names convert to kebab-case |             |
| Edge cases are handled correctly      |             |
| Requirements include phase prefix     |             |
| Phase slugs use kebab-case for names  |             |

--- ErrorHandlingUnification ---
