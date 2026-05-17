@architect
@architect-pattern:PatternGraphCliArchHealth
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Architecture Health Subcommands
  Architecture health subcommands: dangling, orphans, blocking.

  Background:
    Given a temporary working directory

  Rule: CLI arch health subcommands detect graph quality issues

    **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.

    **Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.

    **Verified by:** Arch dangling returns broken references, Arch dangling baseline matches current references, Arch dangling strict baseline drift reports added and removed entries, Arch dangling write-baseline rewrites deterministic JSON, Arch orphans returns isolated patterns, Arch blocking returns blocked patterns

    @happy-path
    Scenario: Arch dangling returns broken references
      Given TypeScript files with a dangling reference
      When running "pattern-graph-cli -i 'src/**/*.ts' arch dangling"
      Then exit code is 0
      And stdout JSON data is an array
      And stdout JSON data contains an entry with field "missing"

    @happy-path
    Scenario: Arch dangling baseline matches current references
      Given TypeScript files with a dangling reference
      And a dangling baseline file matching current references
      When running "pattern-graph-cli -i 'src/**/*.ts' arch dangling --baseline dangling-baseline.json"
      Then exit code is 0
      And stdout JSON data reports no dangling baseline drift

    @validation
    Scenario: Arch dangling strict baseline drift reports added and removed entries
      Given TypeScript files with a dangling reference
      And a dangling baseline file with a different reference
      When running "pattern-graph-cli -i 'src/**/*.ts' arch dangling --baseline dangling-baseline.json --strict"
      Then exit code is 1
      And stdout JSON data reports one added and one removed dangling baseline entry

    @happy-path
    Scenario: Arch dangling write-baseline rewrites deterministic JSON
      Given TypeScript files with a dangling reference
      When running "pattern-graph-cli -i 'src/**/*.ts' arch dangling --baseline dangling-baseline.json --write-baseline"
      Then exit code is 0
      And dangling baseline file is deterministic for the current references

    @happy-path
    Scenario: Arch orphans returns isolated patterns
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch orphans"
      Then exit code is 0
      And stdout JSON data is an array
      And stdout JSON data contains an entry with field "pattern"

    @happy-path
    Scenario: Arch blocking returns blocked patterns
      Given TypeScript files with blocked pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' arch blocking"
      Then exit code is 0
      And stdout JSON data is an array
      And stdout JSON data contains an entry with field "pattern"
      And stdout JSON data contains a blocking entry with field "blockedBy"
