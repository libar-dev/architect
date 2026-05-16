@architect
@architect-pattern:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-phase:24
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Core Infrastructure

  **Problem:**
  The PatternGraphAPI provides 27 typed query methods for efficient state queries, but
  Claude Code sessions cannot use it directly:
  - Import paths require built packages with correct ESM resolution
  - No CLI command exposes the API for shell invocation
  - Current workaround requires regenerating markdown docs and reading them
  - Documentation claims API is "directly usable" but practical usage is blocked

  **Solution:**
  Add a CLI command `pnpm architect:query` that exposes key PatternGraphAPI methods
  with JSON and text output formats, enabling direct programmatic access from AI sessions.

  Core CLI infrastructure: help, version, input validation, status, query, pattern, arch basics, missing args, edge cases.

  Background:
    Given a temporary working directory
      | Deliverable                    | Status   | Tests | Location                                                |
      | PatternGraph CLI core routing   | complete | Yes   | packages/architect-cli/src/cli/pattern-graph-cli.ts     |
      | CLI core behavior specification | complete | Yes   | packages/architect/tests/features/cli/pattern-graph-cli-core.feature |
      | CLI core step coverage          | complete | Yes   | packages/architect/tests/steps/cli/pattern-graph-cli-core.steps.ts |

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    **Invariant:** The CLI must always provide discoverable usage and version information via standard flags.
    **Rationale:** Without accessible help and version output, users cannot self-serve CLI usage or report issues with a specific version.

    @acceptance-criteria @happy-path
    Scenario: Display help with --help flag
      When running "pattern-graph-cli --help"
      Then exit code is 0
      And stdout contains "arch roles"
      And stdout does not contain "arch-roles"

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

    @acceptance-criteria @happy-path
    Scenario: Use architect.config.js sources when --input is omitted
      Given TypeScript files with pattern annotations
      And an architect.config.js with TypeScript sources
      When running "pattern-graph-cli status"
      Then exit code is 0
      And stdout contains "StatusDistribution"

    @validation
    Scenario: Reject unknown options
      When running "pattern-graph-cli --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"

    @validation
    Scenario: Handoff rejects too many modified-file flags
      Given TypeScript files with pattern annotations
      When I run handoff for "ActivePattern" with too many modified-file flags
      Then exit code is 1
      And output contains "Usage: architect handoff"

    @happy-path
    Scenario: Handoff accepts positional pattern with modified file
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' handoff ActivePattern --modified-file src/active.ts"
      Then exit code is 0
      And stdout contains "HANDOFF: ActivePattern"

    @validation
    Scenario: Scope-validate rejects conflicting scope values
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' scope-validate ActivePattern design --type implement"
      Then exit code is 1
      And output contains "Scope type conflict"

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
      And stdout contains "StatusDistribution"

  # ============================================================================
  # RULE 4: Query Subcommand
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
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Pattern not found shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' pattern NonExistent"
      Then exit code is 1
      And output contains "not found"

    @validation
    Scenario: Broken feature-backed pattern reports parser attribution
      Given TypeScript files with pattern annotations
      And a broken feature spec for BrokenSpecPattern
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'features/**/*.feature' pattern BrokenSpecPattern"
      Then exit code is 1
      And output contains parse attribution for "features/broken-spec-pattern.feature"

    @validation
    Scenario: Truly missing pattern does not report parser attribution
      Given TypeScript files with pattern annotations
      And a broken feature spec for BrokenSpecPattern
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'features/**/*.feature' pattern TrulyMissingPattern"
      Then exit code is 1
      And output contains "not found"
      And output does not contain "spec-parse-failed"

  # ============================================================================
  # RULE 6: Arch Subcommand
  # ============================================================================

  Rule: CLI arch subcommand queries architecture

    **Invariant:** The arch subcommand must expose role and bounded-context queries over the PatternGraph's architecture metadata and reject retired architecture verbs.
    **Rationale:** Architecture queries replace manual exploration of annotated sources; stale aliases or incorrect results lead to wrong structural assumptions during design sessions.
    **Verified by:** Arch roles lists roles with counts, Arch bounded-context filters to bounded context, Arch layer reports unknown subcommand

    @happy-path
    Scenario: Arch roles lists roles with counts
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch roles"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch bounded-context filters to bounded context
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch bounded-context testctx"
      Then exit code is 0
      And stdout is valid JSON

    @validation
    Scenario: Arch layer reports unknown subcommand
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch layer"
      Then exit code is 1
      And output contains "Unknown arch subcommand: layer"

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

    @validation
    Scenario: Legacy category filter is rejected with role guidance
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --category service"
      Then exit code is 1
      And output contains "Legacy --category is no longer supported. Use --role <tag> instead."
