@architect
@architect-pattern:ProcessApiCliCore
@architect-implements:ProcessApiCli
@architect-status:completed
@architect-unlock-reason:'Split-from-original'
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Process API CLI - Core Infrastructure
  Core CLI infrastructure: help, version, input validation, status, query, pattern, arch basics, missing args, edge cases.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    **Invariant:** The CLI must always provide discoverable usage and version information via standard flags.
    **Rationale:** Without accessible help and version output, users cannot self-serve CLI usage or report issues with a specific version.

    @happy-path
    Scenario: Display help with --help flag
      When running "pattern-graph-cli --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "pattern-graph-cli -v"
      Then exit code is 0

    @validation
    Scenario: No subcommand shows help
      When running "pattern-graph-cli -i 'src/**/*.ts'"
      Then exit code is 1
      And output contains "Usage:"

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input flag for subcommands

    **Invariant:** Every data-querying subcommand must receive either an explicit `--input` glob or a project config that provides source globs.
    **Rationale:** Without an input source, the pipeline has no files to scan and would produce empty or misleading results instead of a clear error, but project config auto-detection should remove that boilerplate when the repo is configured.

    @validation
    Scenario: Fail without --input flag when running status
      When running "pattern-graph-cli status"
      Then exit code is 1
      And output contains "--input"

    @happy-path
    Scenario: Use architect.config.js sources when --input is omitted
      Given TypeScript files with pattern annotations
      And an architect.config.js with TypeScript sources
      When running "pattern-graph-cli status"
      Then exit code is 0
      And stdout is valid JSON with key "success"

    @validation
    Scenario: Reject unknown options
      When running "pattern-graph-cli --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"

  # ============================================================================
  # RULE 3: Status Subcommand
  # ============================================================================

  Rule: CLI status subcommand shows delivery state

    **Invariant:** The status subcommand must return structured JSON containing delivery progress derived from the PatternGraph.
    **Rationale:** Consumers depend on machine-readable status output for scripting and CI integration; unstructured output breaks downstream automation.

    @happy-path
    Scenario: Status shows counts and completion percentage
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' status"
      Then exit code is 0
      And stdout is valid JSON with key "success"

  # ============================================================================
  # RULE 4: Query Subcommand
  # ============================================================================

  Rule: CLI query subcommand executes API methods

    **Invariant:** The query subcommand must dispatch to any public Data API method by name and pass positional arguments through.
    **Rationale:** The CLI is the primary interface for ad-hoc queries; failing to resolve a valid method name or its arguments silently drops the user's request.

    @happy-path
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

    @validation
    Scenario: Unknown API method shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query nonExistentMethod"
      Then exit code is 1
      And output contains "Unknown"

  # ============================================================================
  # RULE 5: Pattern Subcommand
  # ============================================================================

  Rule: CLI pattern subcommand shows pattern detail

    **Invariant:** The pattern subcommand must return the full JSON detail for an exact pattern name match, or a clear error if not found.
    **Rationale:** Pattern lookup is the primary debugging tool for annotation issues; ambiguous or silent failures waste investigation time.

    @happy-path
    Scenario: Pattern lookup returns full detail
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' pattern CompletedPattern"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Pattern not found shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' pattern NonExistent"
      Then exit code is 1
      And output contains "not found"

  # ============================================================================
  # RULE 6: Arch Subcommand
  # ============================================================================

  Rule: CLI arch subcommand queries architecture

    **Invariant:** The arch subcommand must expose role, bounded context, and layer queries over the PatternGraph's architecture metadata.
    **Rationale:** Architecture queries replace manual exploration of annotated sources; missing or incorrect results lead to wrong structural assumptions during design sessions.

    @happy-path
    Scenario: Arch roles lists roles with counts
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch roles"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch context filters to bounded context
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch context testctx"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch layer lists layers with counts
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch layer"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 7: Error Handling for Missing Arguments
  # ============================================================================

  Rule: CLI shows errors for missing subcommand arguments

    **Invariant:** Subcommands that require arguments must reject invocations with missing arguments and display usage guidance.
    **Rationale:** Silent acceptance of incomplete input would produce confusing pipeline errors instead of actionable feedback at the CLI boundary.

    @validation
    Scenario: Query without method name shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query"
      Then exit code is 1
      And output contains "Usage:"

    @validation
    Scenario: Pattern without name shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' pattern"
      Then exit code is 1
      And output contains "Usage:"

    @validation
    Scenario: Unknown subcommand shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' foobar"
      Then exit code is 1
      And output contains "Unknown subcommand"

  # ============================================================================
  # RULE 8: Edge Cases
  # ============================================================================

  Rule: CLI handles argument edge cases

    **Invariant:** The CLI must gracefully handle non-standard argument forms including numeric coercion and the `--` pnpm separator.
    **Rationale:** Real-world invocations via pnpm pass `--` separators and numeric strings; mishandling these causes silent data loss or crashes in automated workflows.

    @edge-case
    Scenario: Integer arguments are coerced for phase queries
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' query getPatternsByPhase 1"
      Then exit code is 0

    @edge-case
    Scenario: Double-dash separator is handled gracefully
      When running "pattern-graph-cli -- --help"
      Then exit code is 0
