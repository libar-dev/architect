@architect
@architect-pattern:ProcessApiCliCache
@architect-implements:DataAPICLIErgonomics
@architect-status:active
@architect-product-area:DataAPI
@cli @process-api @cache
Feature: Process API CLI - Dataset Cache
  PatternGraph caching between CLI invocations: cache hits, mtime invalidation, and --no-cache bypass.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Cache Hit on Unchanged Sources
  # ============================================================================

  Rule: PatternGraph is cached between invocations

    **Invariant:** When source files have not changed between CLI invocations, the second invocation must use the cached PatternGraph and report cache.hit as true alongside pipeline timing metadata.
    **Rationale:** The pipeline rebuild costs 2-5 seconds per invocation. Caching eliminates this cost for repeated queries against unchanged sources, which is the common case during interactive AI sessions.

    @happy-path
    Scenario: Second query uses cached dataset
      Given TypeScript files with pattern annotations
      When running status and capturing the first result
      And running status and capturing the second result
      Then the second result metadata has cache.hit true
      And both results report pipeline timing metadata

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
