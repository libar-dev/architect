@libar-docs
@libar-docs-pattern:ProcessApiCliSubcommands
@libar-docs-implements:ProcessApiCli
@libar-docs-status:completed
@libar-docs-unlock-reason:'Split-from-original'
@libar-docs-product-area:DataAPI
@cli @process-api
Feature: Process API CLI - Discovery Subcommands
  Discovery subcommands: list, search, context assembly, tags/sources, extended arch, unannotated.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 9: List Subcommand
  # ============================================================================

  Rule: CLI list subcommand filters patterns

    @happy-path
    Scenario: List all patterns returns JSON array
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list"
      Then exit code is 0
      And stdout is valid JSON with key "success"

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
      And stdout contains "CompletedPattern"

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
      And stdout contains "PROGRESS"

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
      And stdout is valid JSON with key "data"

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
