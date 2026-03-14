@libar-docs
@libar-docs-pattern:ProcessApiCliHelp
@libar-docs-implements:DataAPICLIErgonomics
@libar-docs-status:active
@libar-docs-product-area:DataAPI
@cli @process-api @help
Feature: Process API CLI - Per-Subcommand Help
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
      When running "process-api context --help"
      Then exit code is 0
      And stdout contains context usage and session flag
      And stdout contains "Usage:"

    @happy-path
    Scenario: Global help still works
      When running "process-api --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @validation
    Scenario: Unknown subcommand help
      When running "process-api foobar --help"
      Then exit code is 0
      And stdout contains "No detailed help"
