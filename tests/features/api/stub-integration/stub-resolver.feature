@libar-docs
@libar-docs-pattern:StubResolverTests
@libar-docs-status:active
@libar-docs-product-area:API
Feature: Stub Resolver - Design Stub Discovery and Resolution

  **Problem:**
  Design session stubs need structured discovery and resolution
  to determine which stubs have been implemented and which remain.

  **Solution:**
  StubResolver functions identify, resolve, and group stubs from
  the MasterDataset with filesystem existence checks.

  Rule: Stubs are identified by path or target metadata

    @acceptance-criteria @happy-path
    Scenario: Patterns in stubs directory are identified as stubs
      Given patterns where some have file paths containing "/stubs/"
      When finding stub patterns from the dataset
      Then only patterns from the stubs directory are returned

    @acceptance-criteria @happy-path
    Scenario: Patterns with targetPath are identified as stubs
      Given patterns where some have a targetPath field
      When finding stub patterns from the dataset
      Then patterns with targetPath are included in results

  Rule: Stubs are resolved against the filesystem

    @acceptance-criteria @happy-path
    Scenario: Resolved stubs show target existence status
      Given stub patterns with target paths
      And some target files exist on disk
      When resolving stubs against the filesystem
      Then each resolution shows whether the target exists
      And resolved stubs have targetExists true
      And unresolved stubs have targetExists false

    @acceptance-criteria @happy-path
    Scenario: Stubs are grouped by implementing pattern
      Given resolved stubs for 2 different patterns
      When grouping stubs by pattern
      Then the result contains 2 groups
      And each group has correct resolved and unresolved counts

  Rule: Decision items are extracted from descriptions

    @acceptance-criteria @happy-path
    Scenario: AD-N items are extracted from description text
      Given a description containing AD-1 and AD-2 decision items
      When extracting decision items
      Then 2 decision items are returned
      And the first has id "AD-1" and a PDR reference
      And the second has id "AD-2" without a PDR reference

    @edge-case
    Scenario: Empty description returns no decision items
      Given a stub pattern with empty description
      When extracting decision items from the stub description
      Then 0 decision items are returned

    @edge-case
    Scenario: Malformed AD items are skipped
      Given a stub pattern with description "AD-X: not a number and AD-: missing"
      When extracting decision items from the stub description
      Then 0 decision items are returned

  Rule: PDR references are found across patterns

    @acceptance-criteria @happy-path
    Scenario: Patterns referencing a PDR are found
      Given patterns where some reference PDR-012 in descriptions
      When finding PDR references for "012"
      Then the referencing patterns are returned with source locations

    @acceptance-criteria @validation
    Scenario: No references returns empty result
      Given patterns that do not reference PDR-999
      When finding PDR references for "999"
      Then the result is empty
