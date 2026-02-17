@libar-docs
@libar-docs-pattern:StubResolverTests
@libar-docs-status:active
@libar-docs-product-area:DataAPI
Feature: Stub Resolver - Design Stub Discovery and Resolution

  **Problem:**
  Design session stubs need structured discovery and resolution
  to determine which stubs have been implemented and which remain.

  **Solution:**
  StubResolver functions identify, resolve, and group stubs from
  the MasterDataset with filesystem existence checks.

  Rule: Stubs are identified by path or target metadata

    **Invariant:** A pattern must be identified as a stub if it resides in the stubs directory OR has a targetPath metadata field.
    **Rationale:** Dual identification supports both convention-based (directory) and metadata-based (targetPath) stub detection — relying on only one would miss stubs organized differently.
    **Verified by:** Patterns in stubs directory are identified as stubs, Patterns with targetPath are identified as stubs

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

    **Invariant:** Resolved stubs must show whether their target file exists on the filesystem and must be grouped by the pattern they implement.
    **Rationale:** Target existence status tells developers whether a stub has been implemented — grouping by pattern enables the "stubs --unresolved" command to show per-pattern implementation gaps.
    **Verified by:** Resolved stubs show target existence status, Stubs are grouped by implementing pattern

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

    **Invariant:** AD-N formatted items must be extracted from pattern description text, with empty descriptions returning no items and malformed items being skipped.
    **Rationale:** Decision items (AD-1, AD-2, etc.) link stubs to architectural decisions — extracting them enables traceability from code stubs back to the design rationale.
    **Verified by:** AD-N items are extracted from description text, Empty description returns no decision items, Malformed AD items are skipped

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

    **Invariant:** The resolver must find all patterns that reference a given PDR identifier, returning empty results when no references exist.
    **Rationale:** PDR cross-referencing enables impact analysis — knowing which patterns reference a decision helps assess the blast radius of changing that decision.
    **Verified by:** Patterns referencing a PDR are found, No references returns empty result

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
