# 📋 Query Result Envelope Decision

**Purpose:** Detailed documentation for the Query Result Envelope Decision pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |

## Description

**Context:**
  The ProcessStateAPI (27 methods) returns raw typed values (ExtractedPattern[],
  StatusCounts, PhaseProgress, etc.). The CLI dumps these as JSON. QueryResult<T>
  types (QuerySuccess, QueryError, QueryErrorCode) exist in src/api/types.ts
  with createSuccess() and createError() helpers, but are not wired anywhere.

  **Problem:**
  Where should the QueryResult<T> envelope wrapping happen? Two options:
  1. Change ProcessStateAPI methods to return QueryResult<T> (API-level)
  2. Wrap results at the CLI output layer only (CLI-level)

  **Decision:**
  Wire QueryResult<T> envelope at the CLI layer only. ProcessStateAPI
  methods continue returning raw typed values.

  **Rationale:**
  - ProcessStateAPI is consumed programmatically by the monorepo.
    Changing return types to QueryResult<T> breaks all programmatic consumers.
  - The envelope is a presentation concern (JSON output formatting), not
    a domain concern (querying delivery state).
  - Programmatic users already get typed returns and handle errors via
    Result monads. They don't need envelope metadata (timestamp, patternCount).
  - The CLIQueryError class provides structured error codes that map cleanly
    to QueryErrorCode at the output boundary.

  **Consequences:**
  - ProcessStateAPI remains a clean, typed query interface
  - CLI error handling changes from process.exit(1) to throw CLIQueryError
  - main() becomes the single point of envelope wrapping
  - Future MCP server can decide its own envelope format independently

## Dependencies

- Depends on: DataAPIOutputShaping

## Acceptance Criteria

**Successful CLI query returns envelope**

- Given the CLI receives a valid query result from ProcessStateAPI
- When the result is formatted for output
- Then the output is wrapped in a QueryResult envelope with success true
- And the envelope includes metadata with timestamp and pattern count

**CLI error returns structured error envelope**

- Given a CLIQueryError is thrown with code "PATTERN_NOT_FOUND"
- When the error is caught at the main() boundary
- Then the output is a QueryError envelope with the error code
- And the exit code is 1

**Programmatic API returns raw typed values**

- Given a programmatic consumer calls getPattern on the API
- When the pattern exists
- Then the return value is ExtractedPattern directly
- And there is no QueryResult wrapper

## Business Rules

**QueryResult envelope is a CLI presentation concern**

_Verified by: Successful CLI query returns envelope, CLI error returns structured error envelope_

**ProcessStateAPI returns remain unchanged**

_Verified by: Programmatic API returns raw typed values_

---

[← Back to Pattern Registry](../PATTERNS.md)
