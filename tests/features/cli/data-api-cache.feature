@libar-docs
@libar-docs-pattern:ProcessApiCliCache
@libar-docs-implements:DataAPICLIErgonomics
@libar-docs-status:active
@libar-docs-product-area:DataAPI
@cli @process-api @cache
Feature: Process API CLI - Dataset Cache
  MasterDataset caching between CLI invocations: cache hits, mtime invalidation, and --no-cache bypass.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Cache Hit on Unchanged Sources
  # ============================================================================

  Rule: MasterDataset is cached between invocations

    **Invariant:** When source files have not changed between CLI invocations, the second invocation must use the cached MasterDataset and report cache.hit as true with reduced pipelineMs.
    **Rationale:** The pipeline rebuild costs 2-5 seconds per invocation. Caching eliminates this cost for repeated queries against unchanged sources, which is the common case during interactive AI sessions.

    @happy-path
    Scenario: Second query uses cached dataset
      Given TypeScript files with pattern annotations
      When running status and capturing the first result
      And running status and capturing the second result
      Then the second result metadata has cache.hit true
      And the second result pipelineMs is less than 500

    @happy-path
    Scenario: Cache invalidated on source file change
      Given TypeScript files with pattern annotations
      When running status and capturing the first result
      And a source file mtime is updated
      And running status and capturing the second result
      Then the second result metadata has cache.hit false

    @happy-path
    Scenario: No-cache flag bypasses cache
      Given TypeScript files with pattern annotations
      When running status and capturing the first result
      And running status with --no-cache and capturing the second result
      Then the second result metadata has cache.hit false
