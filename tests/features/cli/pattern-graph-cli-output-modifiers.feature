@architect
@architect-pattern:PatternGraphCliOutputModifiers
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Output Modifiers
  Output modifiers (--count, --names-only, --fields), parent filters, open-questions, and bundle composition.

  Background:
    Given a temporary working directory

  Rule: Output modifiers work when placed after the subcommand

    **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.

    **Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.

    **Verified by:** Count modifier after list subcommand returns count, Names-only modifier after list subcommand returns names, Count modifier combined with list filter, Parent filter with names-only returns child names, Parent filter with count returns child count, Parent filter returns empty for parent without children, Open questions parent filter returns only descendants with questions, Open questions empty parent returns an empty document, Open questions unknown parent fails deterministically, Bundle include blocks return a composite payload, Bundle mode default include set returns heuristic token estimates, Bundle unknown root pattern fails deterministically, Bundle accumulates repeated include flags, Unknown parent filter fails deterministically

    @happy-path
    Scenario: Count modifier after list subcommand returns count
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --count"
      Then exit code is 0
      And stdout is a JSON number

    @happy-path
    Scenario: Names-only modifier after list subcommand returns names
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --names-only"
      Then exit code is 0
      And stdout is a JSON string array

    @happy-path
    Scenario: Count modifier combined with list filter
      Given TypeScript files with pattern annotations
      When running "pattern-graph-cli -i 'src/**/*.ts' list --status completed --count"
      Then exit code is 0
      And stdout is a JSON number

    @happy-path
    Scenario: Parent filter with names-only returns child names
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' list --parent ParentEpic --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the list names-only result equals "ChildAlpha, ChildBeta"

    @happy-path
    Scenario: Parent filter with count returns child count
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' list --parent ParentEpic --count"
      Then exit code is 0
      And stdout is a JSON number
      And the list count equals 2

    @edge-case
    Scenario: Parent filter returns empty for parent without children
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' list --parent EmptyEpic --names-only"
      Then exit code is 0
      And stdout is an empty JSON string array

    @happy-path
    Scenario: Open questions parent filter returns only descendants with questions
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' --format json open-questions --parent ParentEpic"
      Then exit code is 0
      And the open question result contains patterns "ChildAlpha, ChildBeta"
      And every open question result entry has at least one question

    @edge-case
    Scenario: Open questions empty parent returns an empty document
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' --format json open-questions --parent EmptyEpic"
      Then exit code is 0
      And the open question result is empty

    @validation
    Scenario: Open questions unknown parent fails deterministically
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' open-questions --parent UnknownParent"
      Then parent filter fails with "Parent pattern not found: UnknownParent"

    @happy-path
    Scenario: Bundle include blocks return a composite payload
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' bundle ParentEpic --include rules,scenarios,deps,open-questions --format json"
      Then exit code is 0
      And stdout is valid JSON
      And the bundle result contains children "ChildAlpha, ChildBeta"
      And the bundle result includes requested block families "rules, scenarios, deps, open-questions"
      And the bundle result preserves the ChildAlpha dependency on ChildBeta

    @happy-path
    Scenario: Bundle mode default include set returns heuristic token estimates
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' bundle ParentEpic --mode implement --estimate-tokens --format json"
      Then exit code is 0
      And stdout is valid JSON
      And the bundle root mode is "implement"
      And the bundle result includes requested block families "docstring, rules, scenarios, deps, open-questions"
      And the bundle token estimates use the "char/4" heuristic

    @validation
    Scenario: Bundle unknown root pattern fails deterministically
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' bundle NoSuchPattern --include rules"
      Then parent filter fails with "Pattern not found:"

    @happy-path
    Scenario: Bundle accumulates repeated include flags
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' bundle ParentEpic --include rules --include deps --format json"
      Then exit code is 0
      And stdout is valid JSON
      And the bundle result includes requested block families "rules, deps"

    @validation
    Scenario: Unknown parent filter fails deterministically
      Given Gherkin feature files with parent hierarchy
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' list --parent UnknownParent"
      Then parent filter fails with "Parent pattern not found: UnknownParent"

    @validation
    Scenario: Malformed projection bundle JSON is rejected
      When serializing malformed projection bundle data
      Then serialization fails with "Received malformed projection bundle"
