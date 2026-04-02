@architect
@architect-pattern:DataAPICLIErgonomics
@architect-status:completed
@architect-unlock-reason:Value-transfer-from-spec
@architect-phase:25d
@architect-product-area:DataAPI
@cli @pattern-graph-cli @help
Feature: Data API CLI Ergonomics - Performance and Interactive Mode
  **Problem:**
  The pattern-graph-cli CLI runs the full pipeline (scan, extract, transform) on every
  invocation, taking 2-5 seconds. During design sessions with 10-20 queries, this
  adds up to 1-2 minutes of waiting. There is no way to keep the pipeline loaded
  between queries. Per-subcommand help is missing -- `pattern-graph-cli context --help`
  does not work. FSM-only queries (like `isValidTransition`) run the full pipeline
  even though FSM rules are static.

  **Solution:**
  Add performance and ergonomic improvements:
  1. Pipeline caching -- Cache PatternGraph to temp file with mtime invalidation
  2. REPL mode -- `pattern-graph-cli repl` keeps pipeline loaded for interactive queries
  3. FSM short-circuit -- FSM queries skip the scan pipeline entirely
  4. Per-subcommand help -- `pattern-graph-cli <subcommand> --help` with examples
  5. Dry-run mode -- `--dry-run` shows what would be scanned without running
  6. Validation summary -- Include pipeline health in response metadata

  Per-subcommand help displays usage, flags, and examples for individual subcommands.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Per-Subcommand Help
  # ============================================================================

  Rule: Per-subcommand help shows usage and flags

    **Invariant:** Running any subcommand with --help must display usage information specific to that subcommand, including applicable flags and examples. Unknown subcommands must fall back to a descriptive message.
    **Rationale:** Per-subcommand help replaces the need to scroll through full --help output and provides contextual guidance for subcommand-specific flags like --session.

    @happy-path
    Scenario: Per-subcommand help for context
      When running "pattern-graph-cli context --help"
      Then exit code is 0
      And stdout contains context usage and session flag
      And stdout contains "Usage:"

    @happy-path
    Scenario: Global help still works
      When running "pattern-graph-cli --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @validation
    Scenario: Unknown subcommand help
      When running "pattern-graph-cli foobar --help"
      Then exit code is 0
      And stdout contains "No detailed help"
