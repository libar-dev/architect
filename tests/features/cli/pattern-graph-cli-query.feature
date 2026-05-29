@architect
@architect-pattern:PatternGraphCliQueryPassthrough
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-phase:24
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Query Passthrough

  **Problem:**
  The `query <method>` passthrough exposes the PatternGraphAPI read kernel. Several
  kernel methods return the raw `ExtractedPattern[]` (full scenarios + rules), which
  produces enormous JSON payloads that blow an AI agent's context window. List-shaped
  passthrough methods must instead return the same compact summary shape as the
  primary `list` verb.

  **Solution:**
  Route the list-shaped passthrough methods through a compaction helper that maps each
  pattern to `{ patternName, status, role, file }`, while single-pattern and
  scalar/object/FSM methods continue to return their full shapes unchanged.

  Query passthrough behavior: method dispatch, argument coercion, enum validation, and
  compact list output.

  Background:
    Given a temporary working directory
      | Deliverable                    | Status   | Tests | Location                                                |
      | Query passthrough compaction    | complete | Yes   | packages/architect-cli/src/cli/commands/_shared/structured.ts |
      | CLI query behavior specification | complete | Yes   | tests/features/cli/pattern-graph-cli-query.feature |
      | CLI query step coverage          | complete | Yes   | tests/steps/cli/pattern-graph-cli-query.steps.ts |

  # ============================================================================
  # RULE 1: Query Subcommand
  # ============================================================================

  Rule: CLI query subcommand executes API methods

    **Invariant:** The query subcommand must dispatch to any public Data API method by name, pass positional arguments through, and reject invalid enum arguments with a clear error.
    **Rationale:** The CLI is the primary interface for ad-hoc queries; failing to resolve a valid method name or its arguments silently drops the user's request.

    @acceptance-criteria @happy-path
    Scenario: Query getStatusCounts returns count object
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getStatusCounts"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query isValidTransition with arguments
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query isValidTransition roadmap active"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query getStatusDistribution returns a structured object
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getStatusDistribution"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query getPatternDependencies resolves a pattern's edges
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternDependencies CompletedPattern"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query getPatternsByNormalizedStatus accepts the normalized enum
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByNormalizedStatus completed"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query checkTransition returns a transition check for raw statuses
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query checkTransition roadmap completed"
      Then exit code is 0
      And stdout is valid JSON

    @validation
    Scenario: Invalid normalized status argument shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByNormalizedStatus invalid-status"
      Then exit code is 1
      And output contains "normalized status value"

    @validation
    Scenario: Missing pattern-name argument shows usage
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternDependencies"
      Then exit code is 1
      And output contains "Usage:"

    @validation
    Scenario: Unknown API method shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query nonExistentMethod"
      Then exit code is 1
      And output contains "Unknown"

    @validation
    Scenario: Invalid accepted status argument shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByStatus invalid-status"
      Then exit code is 1
      And output contains "accepted status value"

    @validation
    Scenario: Invalid phase query argument shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByPhase not-a-number"
      Then exit code is 1
      And output contains "Phase must be an integer"

  # ============================================================================
  # RULE 2: Compact List Output
  # ============================================================================

  Rule: CLI query list methods return compact summaries

    **Invariant:** Pattern-list passthrough methods must return compact summaries with exactly the keys `patternName`, `status`, `role`, and `file` — never the kernel's full `ExtractedPattern` objects with `scenarios`, `rules`, or `directive`.
    **Rationale:** The raw kernel array embeds every scenario and rule for every pattern, producing payloads that blow an AI agent's context window; the compact shape matches the primary `list` verb and stays an order of magnitude smaller.
    **Verified by:** Query getPatternsByStatus returns compact entries, Query getCurrentWork returns compact entries

    @acceptance-criteria @happy-path
    Scenario: Query getPatternsByStatus returns compact entries
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByStatus roadmap"
      Then exit code is 0
      And stdout is valid JSON
      And the data array is non-empty
      And every data item has only compact summary keys
      And no data item carries full-pattern keys

    @happy-path
    Scenario: Query getCurrentWork returns compact entries
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getCurrentWork"
      Then exit code is 0
      And stdout is valid JSON
      And the data array is non-empty
      And every data item has only compact summary keys
      And no data item carries full-pattern keys
