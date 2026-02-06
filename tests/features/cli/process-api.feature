@libar-docs-implements:ProcessStateAPICLI
@cli @process-api
Feature: process-api CLI
  Command-line interface for querying delivery process state via ProcessStateAPI.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    @happy-path
    Scenario: Display help with --help flag
      When running "process-api --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "process-api -v"
      Then exit code is 0

    @validation
    Scenario: No subcommand shows help
      When running "process-api -i 'src/**/*.ts'"
      Then exit code is 1
      And output contains "Usage:"

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input flag for subcommands

    @validation
    Scenario: Fail without --input flag when running status
      When running "process-api status"
      Then exit code is 1
      And output contains "--input"

    @validation
    Scenario: Reject unknown options
      When running "process-api --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"

  # ============================================================================
  # RULE 3: Status Subcommand
  # ============================================================================

  Rule: CLI status subcommand shows delivery state

    @happy-path
    Scenario: Status shows counts and completion percentage
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' status"
      Then exit code is 0
      And stdout contains "counts"
      And stdout is valid JSON

  # ============================================================================
  # RULE 4: Query Subcommand
  # ============================================================================

  Rule: CLI query subcommand executes API methods

    @happy-path
    Scenario: Query getStatusCounts returns count object
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' query getStatusCounts"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Query isValidTransition with arguments
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' query isValidTransition roadmap active"
      Then exit code is 0
      And stdout is valid JSON

    @validation
    Scenario: Unknown API method shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' query nonExistentMethod"
      Then exit code is 1
      And output contains "Unknown"

  # ============================================================================
  # RULE 5: Pattern Subcommand
  # ============================================================================

  Rule: CLI pattern subcommand shows pattern detail

    @happy-path
    Scenario: Pattern lookup returns full detail
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' pattern CompletedPattern"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Pattern not found shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' pattern NonExistent"
      Then exit code is 1
      And output contains "not found"

  # ============================================================================
  # RULE 6: Arch Subcommand
  # ============================================================================

  Rule: CLI arch subcommand queries architecture

    @happy-path
    Scenario: Arch roles lists roles with counts
      Given TypeScript files with architecture annotations
      When running "process-api -i 'src/**/*.ts' arch roles"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch context filters to bounded context
      Given TypeScript files with architecture annotations
      When running "process-api -i 'src/**/*.ts' arch context testctx"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 7: Edge Cases
  # ============================================================================

  Rule: CLI handles argument edge cases

    @edge-case
    Scenario: Integer arguments are coerced for phase queries
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' query getPatternsByPhase 1"
      Then exit code is 0

    @edge-case
    Scenario: Double-dash separator is handled gracefully
      When running "process-api -- --help"
      Then exit code is 0
