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

    @happy-path
    Scenario: Arch layer lists layers with counts
      Given TypeScript files with architecture annotations
      When running "process-api -i 'src/**/*.ts' arch layer"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch graph returns dependency data
      Given TypeScript files with architecture annotations and dependencies
      When running "process-api -i 'src/**/*.ts' arch graph ScannerService"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "ScannerService"

  # ============================================================================
  # RULE 7: Error Handling for Missing Arguments
  # ============================================================================

  Rule: CLI shows errors for missing subcommand arguments

    @validation
    Scenario: Query without method name shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' query"
      Then exit code is 1
      And output contains "Usage:"

    @validation
    Scenario: Pattern without name shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' pattern"
      Then exit code is 1
      And output contains "Usage:"

    @validation
    Scenario: Unknown subcommand shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' foobar"
      Then exit code is 1
      And output contains "Unknown subcommand"

  # ============================================================================
  # RULE 8: Edge Cases
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

  # ============================================================================
  # RULE 9: List Subcommand
  # ============================================================================

  Rule: CLI list subcommand filters patterns

    @happy-path
    Scenario: List all patterns returns JSON array
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list"
      Then exit code is 0
      And stdout is valid JSON

    @validation
    Scenario: List with invalid phase shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list --phase abc"
      Then exit code is 1
      And output contains "Invalid --phase"

  # ============================================================================
  # RULE 10: Search Subcommand
  # ============================================================================

  Rule: CLI search subcommand finds patterns by fuzzy match

    @happy-path
    Scenario: Search returns matching patterns
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' search Completed"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Search without query shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' search"
      Then exit code is 1
      And output contains "Usage:"

  # ============================================================================
  # RULE 11: Context Assembly Subcommands
  # ============================================================================

  Rule: CLI context assembly subcommands return text output

    @happy-path
    Scenario: Context returns curated text bundle
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' context CompletedPattern"
      Then exit code is 0
      And stdout is non-empty

    @validation
    Scenario: Context without pattern name shows error
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' context"
      Then exit code is 1
      And output contains "Usage:"

    @happy-path
    Scenario: Overview returns executive summary text
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' overview"
      Then exit code is 0
      And stdout is non-empty

    @happy-path
    Scenario: Dep-tree returns dependency tree text
      Given TypeScript files with architecture annotations and dependencies
      When running "process-api -i 'src/**/*.ts' dep-tree ScannerService"
      Then exit code is 0
      And stdout is non-empty

  # ============================================================================
  # RULE 12: Tags and Sources Subcommands
  # ============================================================================

  Rule: CLI tags and sources subcommands return JSON

    @happy-path
    Scenario: Tags returns tag usage counts
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' tags"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Sources returns file inventory
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' sources"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 13: Extended Arch Subcommands
  # ============================================================================

  Rule: CLI extended arch subcommands query architecture relationships

    @happy-path
    Scenario: Arch neighborhood returns pattern relationships
      Given TypeScript files with architecture annotations and dependencies
      When running "process-api -i 'src/**/*.ts' arch neighborhood ScannerService"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "ScannerService"

    @happy-path
    Scenario: Arch compare returns context comparison
      Given TypeScript files with two architecture contexts
      When running "process-api -i 'src/**/*.ts' arch compare scanner codec"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch coverage returns annotation coverage
      Given TypeScript files with architecture annotations
      When running "process-api -i 'src/**/*.ts' arch coverage"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 14: Unannotated Subcommand
  # ============================================================================

  Rule: CLI unannotated subcommand finds files without annotations

    @happy-path
    Scenario: Unannotated finds files missing libar-docs marker
      Given TypeScript files with mixed annotations
      When running "process-api -i 'src/**/*.ts' unannotated"
      Then exit code is 0
      And stdout is valid JSON
