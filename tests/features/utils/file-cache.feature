@libar-docs
@libar-docs-pattern:FileCache
@libar-docs-status:active
@libar-docs-product-area:CoreTypes
@libar-docs-include:core-types
@cache @utils
Feature: File Cache
  The file cache provides request-scoped content caching for generation runs.
  It avoids repeated disk reads for files accessed multiple times during
  extraction and deduplication phases.

  Background:
    Given a file cache test context

  Rule: Store and retrieve round-trip preserves content

    **Invariant:** Content stored via set is returned identically by get. No transformation or encoding occurs.
    **Rationale:** File content must survive caching verbatim; any mutation would cause extraction to produce different results on cache hits vs misses.
    **Verified by:** Store and retrieve returns same content, Non-existent path returns undefined

    @function:createFileCache @happy-path
    Scenario: Store and retrieve returns same content
      When I store content "hello world" at path "/tmp/test.ts"
      Then retrieving path "/tmp/test.ts" returns "hello world"

    @function:createFileCache
    Scenario: Non-existent path returns undefined
      When I retrieve a non-existent path "/tmp/nonexistent.ts"
      Then the retrieved content is undefined

  Rule: has checks membership without affecting stats

    **Invariant:** has returns true for cached paths and false for uncached paths. It does not increment hit or miss counters.
    **Rationale:** has is used for guard checks before get; double-counting would inflate stats and misrepresent actual cache effectiveness.
    **Verified by:** has returns true for cached path, has returns false for uncached path

    @function:createFileCache
    Scenario: has returns true for cached path
      When I store content "data" at path "/tmp/cached.ts"
      Then has returns true for path "/tmp/cached.ts"

    @function:createFileCache
    Scenario: has returns false for uncached path
      Then has returns false for path "/tmp/missing.ts"

  Rule: Stats track hits and misses accurately

    **Invariant:** Every get call increments either hits or misses. hitRate is computed as (hits / total) * 100 with a zero-division guard returning 0 when total is 0.
    **Rationale:** Accurate stats enable performance analysis of generation runs; incorrect counts would lead to wrong caching decisions.
    **Verified by:** Stats track hits and misses, Hit rate starts at zero for empty cache, Hit rate is 100 when all gets are hits

    @function:createFileCache @happy-path
    Scenario: Stats track hits and misses
      When I store content "data" at path "/tmp/a.ts"
      And I perform a get on cached path "/tmp/a.ts"
      And I perform a get on uncached path "/tmp/b.ts"
      Then the stats show 1 hit and 1 miss
      And the stats show size 1

    @function:createFileCache
    Scenario: Hit rate starts at zero for empty cache
      Then the hit rate is 0

    @function:createFileCache
    Scenario: Hit rate is 100 when all gets are hits
      When I store content "data" at path "/tmp/x.ts"
      And I perform a get on path "/tmp/x.ts"
      Then the hit rate is 100

  Rule: Clear resets cache and stats

    **Invariant:** clear removes all cached entries and resets hit/miss counters to zero.
    **Rationale:** Per-run scoping requires a clean slate; stale entries from a previous run would cause the extractor to use outdated content.
    **Verified by:** Clear resets everything

    @function:createFileCache
    Scenario: Clear resets everything
      When I store content "data" at path "/tmp/c.ts"
      And I perform a get on path "/tmp/c.ts"
      And I clear the cache
      Then the stats show 0 hits and 0 misses
      And the stats show size 0
      When I retrieve a non-existent path "/tmp/c.ts"
      Then the retrieved content is undefined
