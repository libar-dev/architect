@libar-docs
@libar-docs-pattern:QueryResultEnvelopeDecision
@libar-docs-status:roadmap
@libar-docs-adr:007
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-depends-on:DataAPIOutputShaping
Feature: ADR-007 QueryResult Envelope at CLI Layer Only

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

  Background: Decision Context
    Given the following options were considered:
      | Option | Approach | Impact |
      | A | API-level envelope | Breaking change to all ProcessStateAPI consumers |
      | B | CLI-level envelope | No breaking change, presentation-only concern |

  Rule: QueryResult envelope is a CLI presentation concern

    @acceptance-criteria @happy-path
    Scenario: Successful CLI query returns envelope
      Given the CLI receives a valid query result from ProcessStateAPI
      When the result is formatted for output
      Then the output is wrapped in a QueryResult envelope with success true
      And the envelope includes metadata with timestamp and pattern count

    @acceptance-criteria @error-handling
    Scenario: CLI error returns structured error envelope
      Given a CLIQueryError is thrown with code "PATTERN_NOT_FOUND"
      When the error is caught at the main() boundary
      Then the output is a QueryError envelope with the error code
      And the exit code is 1

  Rule: ProcessStateAPI returns remain unchanged

    @acceptance-criteria @happy-path
    Scenario: Programmatic API returns raw typed values
      Given a programmatic consumer calls getPattern on the API
      When the pattern exists
      Then the return value is ExtractedPattern directly
      And there is no QueryResult wrapper
