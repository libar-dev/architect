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

    **Invariant:** The list subcommand must return a valid JSON result for valid filters and a non-zero exit code with a descriptive error for invalid filters. The `--status` filter speaks the consumer-facing status vocabulary: the FSM authored words (candidate/roadmap/active/completed/deferred) exact-match, and the normalized bucket word `planned` matches the roadmap ∪ deferred union — so every word an agent reads in `overview` is a legal filter.
    **Rationale:** Consumers parse list output programmatically; malformed JSON or silent failures cause downstream tooling to break without diagnosis. Accepting the normalized bucket word `planned` removes the trap where an agent reads `planned` in the digest but cannot filter on it.
    **Verified by:** List all patterns returns JSON array, List filters candidate status, List filters by normalized planned bucket, List with removed phase flag shows error, List with removed maturity flag shows error

    @happy-path
    Scenario: List all patterns returns JSON array
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list"
      Then exit code is 0
      And stdout is valid JSON

    @validation
    Scenario: List filters candidate status
      Given TypeScript files with candidate and delivery pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --status candidate"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "CandidatePattern"
      And stdout does not contain "RoadmapPattern"

    @validation
    Scenario: List filters by normalized planned bucket
      Given TypeScript files with candidate and delivery pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --status planned"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "RoadmapPattern"
      And stdout does not contain "CandidatePattern"

    @validation
    Scenario: List with removed phase flag shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --phase abc"
      Then exit code is 1
      And output contains "Unknown option: --phase"

    @validation
    Scenario: List with removed maturity flag shows error
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --maturity plan"
      Then exit code is 1
      And output contains "Unknown option: --maturity"

  # ============================================================================
  # RULE 10: Search Subcommand
  # ============================================================================

  Rule: CLI search subcommand finds patterns by fuzzy match

    **Invariant:** The search subcommand must require a query argument and return only patterns whose names match the query.
    **Rationale:** Missing query validation would produce unfiltered result sets, defeating the purpose of search and wasting context budget in AI sessions.
    **Verified by:** Search returns matching patterns, Search without query shows error

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

    **Invariant:** Context assembly subcommands (context, overview, dep-tree) must produce non-empty human-readable text containing the requested pattern or summary, and require a pattern argument where applicable. The dep-tree subcommand is a focal-rooted bidirectional dependency-context view: the focal pattern is the root of two transitively-expanded forests — DEPENDS ON (upstream) and REQUIRED BY (downstream) — never re-rooted at a dependency.
    **Rationale:** These subcommands replace manual file reads in AI sessions; empty or off-target output forces expensive explore-agent fallbacks that consume 5-10x more context. A single focal-rooted bidirectional view answers both "what does X need" and "what breaks if X changes" without the consumer reasoning about graph internals or passing a direction flag.
    **Verified by:** Context returns curated text bundle, Context without pattern name shows error, Overview returns executive summary text, Dep-tree returns focal-rooted bidirectional dependency context

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
    Scenario: Dep-tree returns focal-rooted bidirectional dependency context
      Given TypeScript files with architecture annotations and dependencies
      When running "pattern-graph-cli -i 'src/**/*.ts' dep-tree ContextFormatterImpl"
      Then exit code is 0
      And stdout is non-empty
      And stdout is a focal-rooted bidirectional dependency context for "ContextFormatterImpl" with upstream "ContextAssemblerImpl"

  # ============================================================================
  # RULE 11B: Diagnostics Subcommand
  # ============================================================================

  Rule: CLI diagnostics subcommand returns extraction diagnostics

    **Invariant:** The diagnostics subcommand must expose structured extraction diagnostics from the current build.
    **Rationale:** Missing extraction diagnostics force users to infer silent drops from absent patterns instead of receiving direct pipeline feedback.
    **Verified by:** Diagnostics returns extraction failures from feature files

    @happy-path
    Scenario: Diagnostics returns extraction failures from feature files
      Given TypeScript files with pattern annotations
      And feature files with extraction diagnostics
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'architect/specs/**/*.feature' diagnostics"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "missing-status"

  # ============================================================================
  # RULE 12: Tags, Taxonomy, and Sources Subcommands
  # ============================================================================

  Rule: CLI tags, taxonomy, and sources subcommands return JSON

    **Invariant:** The tags, taxonomy, and sources subcommands must return valid JSON with the expected top-level structure. `tags` projects `TagUsageMatrix` (operational-insights), `taxonomy` projects `TaxonomyDigest` (governance) -- they are sibling verbs from sibling DDD subdomains, not aliases.
    **Rationale:** Annotation exploration depends on machine-parseable output; invalid JSON prevents automated enrichment workflows from detecting unannotated files and tag gaps. Surfacing `tags` and `taxonomy` as distinct verbs makes the projection package's subdomain split visible at the CLI surface.
    **Verified by:** Tags returns tag usage counts, Taxonomy returns taxonomy digest, Taxonomy count returns compact text, Taxonomy JSON count returns four numeric keys, Sources returns file inventory

    @happy-path
    Scenario: Tags returns tag usage counts
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' tags"
      Then exit code is 0
      And stdout contains "TagUsageMatrix"

    @happy-path
    Scenario: Taxonomy returns taxonomy digest
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' taxonomy --format json"
      Then exit code is 0
      And stdout contains "TaxonomyDigest"
      And stdout is valid JSON

    @happy-path
    Scenario: Taxonomy count returns compact text
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' taxonomy --count"
      Then exit code is 0
      And stdout is a single taxonomy count line

    @happy-path
    Scenario: Taxonomy JSON count returns four numeric keys
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' taxonomy --format json --count"
      Then exit code is 0
      And stdout is a taxonomy count JSON object

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
    **Verified by:** Arch neighborhood returns pattern relationships, Arch compare returns bounded-context comparison, Arch coverage returns annotation coverage

    @happy-path
    Scenario: Arch neighborhood returns pattern relationships
      Given TypeScript files with architecture annotations and dependencies
      When running "pattern-graph-cli -i 'src/**/*.ts' arch neighborhood ContextFormatterImpl"
      Then exit code is 0
      And stdout is valid JSON
      And stdout contains "ContextFormatterImpl"

    @happy-path
    Scenario: Arch compare returns bounded-context comparison
      Given TypeScript files with two bounded contexts
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
    **Verified by:** Unannotated finds files missing architect marker

    @happy-path
    Scenario: Unannotated finds files missing architect marker
      Given TypeScript files with mixed annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' unannotated"
      Then exit code is 0
      And stdout contains "AnnotationCoverage"
