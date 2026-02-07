@libar-docs
@libar-docs-pattern:DataAPICLIErgonomics
@libar-docs-status:roadmap
@libar-docs-phase:25d
@libar-docs-product-area:DeliveryProcess
@libar-docs-effort:2d
@libar-docs-priority:medium
@libar-docs-business-value:fast-interactive-cli-for-repeated-queries
Feature: Data API CLI Ergonomics - Performance and Interactive Mode

  **Problem:**
  The process-api CLI runs the full pipeline (scan, extract, transform) on every
  invocation, taking 2-5 seconds. During design sessions with 10-20 queries, this
  adds up to 1-2 minutes of waiting. There is no way to keep the pipeline loaded
  between queries. Per-subcommand help is missing -- `process-api context --help`
  does not work. FSM-only queries (like `isValidTransition`) run the full pipeline
  even though FSM rules are static.

  **Solution:**
  Add performance and ergonomic improvements:
  1. **Pipeline caching** -- Cache MasterDataset to temp file with mtime invalidation
  2. **REPL mode** -- `process-api repl` keeps pipeline loaded for interactive queries
  3. **FSM short-circuit** -- FSM queries skip the scan pipeline entirely
  4. **Per-subcommand help** -- `process-api <subcommand> --help` with examples
  5. **Dry-run mode** -- `--dry-run` shows what would be scanned without running
  6. **Validation summary** -- Include pipeline health in response metadata

  **Business Value:**
  | Benefit | Impact |
  | Cached queries | 2-5s to <100ms for repeated queries |
  | REPL mode | Interactive exploration during sessions |
  | FSM short-circuit | Instant transition checks |
  | Per-subcommand help | Self-documenting for AI agents |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | MasterDataset cache with mtime invalidation | planned | src/cli/dataset-cache.ts | Yes | unit |
      | REPL mode handler | planned | src/cli/repl.ts | Yes | integration |
      | FSM short-circuit for static queries | planned | src/cli/process-api.ts | Yes | unit |
      | Per-subcommand help system | planned | src/cli/process-api.ts | Yes | integration |
      | Dry-run mode | planned | src/cli/process-api.ts | Yes | integration |
      | Validation summary in metadata | planned | src/cli/process-api.ts | Yes | unit |

  # ============================================================================
  # RULE 1: Pipeline Caching
  # ============================================================================

  Rule: MasterDataset is cached between invocations with file-change invalidation

    **Invariant:** Cache is automatically invalidated when any source file
    (TypeScript or Gherkin) has a modification time newer than the cache.

    **Rationale:** The pipeline (scan -> extract -> transform) runs fresh on every
    invocation (~2-5 seconds). Most queries during a session don't need fresh data
    -- the source files haven't changed between queries. Caching the MasterDataset
    to a temp file with file-modification-time invalidation makes subsequent
    queries instant while ensuring staleness is impossible.

    **Verified by:** Cache hit on unchanged files, Cache invalidation on file change

    @acceptance-criteria @happy-path
    Scenario: Second query uses cached dataset
      Given a previous query has cached the MasterDataset
      And no source files have been modified since
      When running "process-api status"
      Then the query completes in under 200ms
      And the response metadata indicates cache hit

    @acceptance-criteria @happy-path
    Scenario: Cache invalidated on source file change
      Given a cached MasterDataset exists
      And a source TypeScript file has been modified
      When running "process-api status"
      Then the pipeline runs fresh (cache miss)
      And the new dataset is cached for subsequent queries

  # ============================================================================
  # RULE 2: REPL Mode
  # ============================================================================

  Rule: REPL mode keeps pipeline loaded for interactive multi-query sessions

    **Invariant:** REPL mode loads the pipeline once and accepts multiple queries
    on stdin, with optional tab completion for pattern names and subcommands.

    **Rationale:** Design sessions often involve 10-20 exploratory queries in
    sequence (check status, look up pattern, check deps, look up another pattern).
    REPL mode eliminates per-query pipeline overhead entirely.

    **Verified by:** REPL multi-query session, REPL with reload

    @acceptance-criteria @happy-path
    Scenario: REPL accepts multiple queries
      Given REPL mode is started with "process-api repl"
      When entering "status" then "pattern OrderSaga" then "dep-tree OrderSaga"
      Then each query returns results without pipeline re-initialization
      And "quit" exits the REPL

    @acceptance-criteria @happy-path
    Scenario: REPL reloads on source change notification
      Given REPL mode is running with loaded dataset
      When entering "reload"
      Then the pipeline is re-run with fresh source files
      And subsequent queries use the new dataset

  # ============================================================================
  # RULE 3: Help and Diagnostic Features
  # ============================================================================

  Rule: Per-subcommand help and diagnostic modes aid discoverability

    **Invariant:** Every subcommand supports `--help` with usage, flags, and
    examples. Dry-run shows pipeline scope without executing.

    **Rationale:** AI agents read `--help` output to discover available
    commands and flags. Without per-subcommand help, agents must read external
    documentation. Dry-run mode helps diagnose "why no patterns found?" issues
    by showing what would be scanned.

    **Verified by:** Subcommand help, Dry-run output, Validation summary

    @acceptance-criteria @happy-path
    Scenario: Per-subcommand help output
      When running "process-api context --help"
      Then the output shows the context subcommand usage
      And the output lists available flags (--session, --related)
      And the output includes example commands

    @acceptance-criteria @happy-path
    Scenario: Dry-run shows pipeline scope
      When running "process-api --dry-run status"
      Then the output shows the number of files that would be scanned
      And the output shows the config file being used
      And the output shows input glob patterns
      And no actual pipeline processing occurs

    @acceptance-criteria @happy-path
    Scenario: Validation summary in response metadata
      Given the pipeline detects 2 dangling references
      When running "process-api status"
      Then the response metadata includes pattern count
      And the response metadata includes dangling reference count
      And the response metadata includes any pipeline warnings
