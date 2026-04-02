@architect
@architect-pattern:PatternGraphCliSubcommands
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Discovery Subcommands
  Discovery subcommands: list, search, context assembly, tags/sources, extended arch, unannotated.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 9: List Subcommand
  # ============================================================================

  Rule: CLI list subcommand filters patterns

    **Invariant:** The list subcommand must return a valid JSON result for valid filters and a non-zero exit code with a descriptive error for invalid filters.
    **Rationale:** Consumers parse list output programmatically; malformed JSON or silent failures cause downstream tooling to break without diagnosis.

    @happy-path
    Scenario: List all patterns returns JSON array
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list"
      Then exit code is 0
      And stdout is valid JSON with key "success"

    @validation
    Scenario: List with invalid phase shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --phase abc"
      Then exit code is 1
      And output contains "Invalid --phase"

  # ============================================================================
  # RULE 10: Search Subcommand
  # ============================================================================

  Rule: CLI search subcommand finds patterns by fuzzy match

    **Invariant:** The search subcommand must require a query argument and return only patterns whose names match the query.
    **Rationale:** Missing query validation would produce unfiltered result sets, defeating the purpose of search and wasting context budget in AI sessions.

    @happy-path
    Scenario: Search returns matching patterns
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' search Completed"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Search without query shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' search"
      Then exit code is 1
      And output contains "Usage:"

  # ============================================================================
  # RULE 11: Context Assembly Subcommands
  # ============================================================================

  Rule: CLI context assembly subcommands return text output

    **Invariant:** Context assembly subcommands (context, overview, dep-tree) must produce non-empty human-readable text containing the requested pattern or summary, and require a pattern argument where applicable.
    **Rationale:** These subcommands replace manual file reads in AI sessions; empty or off-target output forces expensive explore-agent fallbacks that consume 5-10x more context.

    @happy-path
    Scenario: Context returns curated text bundle
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' context CompletedPattern"
      Then exit code is 0
      And stdout is non-empty
      And stdout contains "CompletedPattern"

    @validation
    Scenario: Context without pattern name shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' context"
      Then exit code is 1
      And output contains "Usage:"

    @happy-path
    Scenario: Overview returns executive summary text
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' overview"
      Then exit code is 0
      And stdout is non-empty
      And stdout contains "PROGRESS"

    @happy-path
    Scenario: Dep-tree returns dependency tree text
      Given TypeScript files with architecture annotations and dependencies
      When running "pattern-graph-cli -i 'src/**/*.ts' dep-tree ScannerService"
      Then exit code is 0
      And stdout is non-empty

  # ============================================================================
  # RULE 12: Tags and Sources Subcommands
  # ============================================================================

  Rule: CLI tags and sources subcommands return JSON

    **Invariant:** The tags and sources subcommands must return valid JSON with the expected top-level structure (data key for tags, array for sources).
    **Rationale:** Annotation exploration depends on machine-parseable output; invalid JSON prevents automated enrichment workflows from detecting unannotated files and tag gaps.

    @happy-path
    Scenario: Tags returns tag usage counts
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' tags"
      Then exit code is 0
      And stdout is valid JSON with key "data"

    @happy-path
    Scenario: Sources returns file inventory
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' sources"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 13: Extended Arch Subcommands
  # ============================================================================

  Rule: CLI extended arch subcommands query architecture relationships

    **Invariant:** Extended arch subcommands (neighborhood, compare, coverage) must return valid JSON reflecting the actual architecture relationships present in the scanned sources.
    **Rationale:** Architecture queries drive design-session decisions; stale or structurally invalid output leads to incorrect dependency analysis and missed coupling between bounded contexts.

    @happy-path
    Scenario: Arch neighborhood returns pattern relationships
      Given TypeScript files with architecture annotations and dependencies
      When running "pattern-graph-cli -i 'src/**/*.ts' arch neighborhood ScannerService"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "ScannerService"

    @happy-path
    Scenario: Arch compare returns context comparison
      Given TypeScript files with two architecture contexts
      When running "pattern-graph-cli -i 'src/**/*.ts' arch compare scanner codec"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Arch coverage returns annotation coverage
      Given TypeScript files with architecture annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch coverage"
      Then exit code is 0
      And stdout is valid JSON

  # ============================================================================
  # RULE 14: Unannotated Subcommand
  # ============================================================================

  Rule: CLI unannotated subcommand finds files without annotations

    **Invariant:** The unannotated subcommand must return valid JSON listing every TypeScript file that lacks the `@architect` opt-in marker.
    **Rationale:** Files missing the opt-in marker are invisible to the scanner; without this subcommand, unannotated files silently drop out of generated documentation and validation.

    @happy-path
    Scenario: Unannotated finds files missing architect marker
      Given TypeScript files with mixed annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' unannotated"
      Then exit code is 0
      And stdout is valid JSON
