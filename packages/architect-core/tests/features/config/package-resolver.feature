@architect
@architect-pattern:PackageResolverExecutableTests
@architect-implements:PackageResolver
@architect-status:active
@architect-product-area:Configuration
@behavior @config @package
Feature: Package Resolver — config-driven workspace package classification
  The PackageResolver maps a `pattern.source.file` to its workspace
  Package using config-supplied `{ id, displayName, match }` entries.

  **Problem:**
  - Path-regex classifiers in projection code drift from delivery layout.
  - Two configured projects (Studio + architect-pkg) need different mappings.
  **Solution:**
  - Pure function over a config-supplied entry list, first match wins.
  - Per-source-file resolution cache for repeat lookups.
  - D-5 = A: unmatched files raise `UNMAPPED_PACKAGE` — no silent
    `_other` bucket.

  Background:
    Given a package-resolver test context

  Rule: Resolver returns the configured Package for a matching path

    **Invariant:** A source file matching a configured entry resolves to
    that entry's `{ id, displayName }` pair.
    **Verified by:** RegExp match resolves, prefix match resolves, first-match-wins ordering

    @happy-path
    Scenario: RegExp match resolves to the configured Package
      Given a resolver configured with entry "architect-core" matching regex "^\.\./architect-core/"
      When resolving the source file "../architect-core/src/index.ts"
      Then the resolved package id should be "architect-core"
      And the resolved package displayName should be "Architect Core"

    @happy-path
    Scenario: String prefix match resolves to the configured Package
      Given a resolver configured with entry "architect-dev" matching prefix "tests/features/"
      When resolving the source file "tests/features/projections/governance/business-rules.feature"
      Then the resolved package id should be "architect-dev"

    @happy-path
    Scenario: First match wins when multiple entries could match
      Given a resolver configured with two entries
      """
      first  | architect-cli         | ^\.\./architect-cli/
      second | architect-projection  | ^\.\./architect-
      """
      When resolving the source file "../architect-cli/src/cli.ts"
      Then the resolved package id should be "architect-cli"

  Rule: Unmatched files raise UNMAPPED_PACKAGE per D-5 = A

    **Invariant:** Files matching no configured entry raise a typed
    `ProjectionError('UNMAPPED_PACKAGE', …)` naming the unmatched file
    and listing the configured matchers. No silent `_other` bucket.
    **Verified by:** unmatched path raises, error message names file and matchers

    @validation
    Scenario: Unmatched path raises UNMAPPED_PACKAGE
      Given a resolver configured with entry "architect-core" matching regex "^\.\./architect-core/"
      When resolving the source file "apps/desktop/src/main.ts"
      Then the resolution should raise ProjectionError with code "UNMAPPED_PACKAGE"
      And the error message should mention the source file "apps/desktop/src/main.ts"
      And the error message should list the matcher for "architect-core"

    @validation
    Scenario: Empty config raises UNMAPPED_PACKAGE on the first call
      Given a resolver configured with no entries
      When resolving the source file "anywhere/main.ts"
      Then the resolution should raise ProjectionError with code "UNMAPPED_PACKAGE"

  Rule: Resolution is cached per source file

    **Invariant:** Repeat lookups for the same source file return the
    same Package instance from the cache without re-walking the entry
    list.
    **Verified by:** repeat resolution returns cached value

    @performance
    Scenario: Repeat resolution returns cached value
      Given a resolver configured with entry "architect-core" matching regex "^\.\./architect-core/"
      When resolving the source file "../architect-core/src/a.ts"
      And resolving the source file "../architect-core/src/a.ts" again
      Then both resolutions should return the same Package object reference
