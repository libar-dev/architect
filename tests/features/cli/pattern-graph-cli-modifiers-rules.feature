@architect
@architect-pattern:PatternGraphCliModifiersAndRules
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Output Modifiers and Rules
  Output modifiers, arch health, and rules subcommand.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 15: Output Modifier Position Independence
  # ============================================================================

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

  # ============================================================================
  # RULE 16: Graph Health Subcommands
  # ============================================================================

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

  # ============================================================================
  # RULE 17: Rules Subcommand
  # ============================================================================

  Rule: CLI rules subcommand queries business rules and invariants

    **Invariant:** The rules subcommand returns structured business rules extracted from Gherkin Rule: blocks via the projection layer.

    **Rationale:** Live business rule queries replace static generated markdown, enabling on-demand filtering by product area, pattern, package, feature path, and invariant presence.

    **Verified by:** Rules returns business rules from feature files, Rules filters by product area, Rules with names-only returns flat array, Rules with count returns a JSON number, Rules filters by canonical package name, Rules package filter works with count, Rules feature path filter works with count, Rules feature glob filter works with names-only, Rules rejects retired phase filter

    @happy-path
    Scenario: Rules returns business rules from feature files
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @contract
    Scenario: Rules with --format json preserves routed bundle metadata
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' --format json rules"
      Then exit code is 0
      And stdout is valid JSON for a routed BusinessRuleSet bundle
      And routed rules JSON keeps canonical bundle key ordering
      And raw routed rules JSON keeps canonical serializer order on the wire
      And the bundle root validates against FragmentSchema

    @happy-path
    Scenario: Rules filters by product area
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --product-area Validation"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @happy-path
    Scenario: Rules with names-only returns flat array
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --names-only"
      Then exit code is 0
      And stdout is a JSON string array

    @happy-path
    Scenario: Rules with count returns a JSON number
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 4

    @validation
    Scenario: Rules filters by pattern name
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --pattern CoreUtilsTest"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @validation
    Scenario: Rules with only-invariants excludes rules without invariants
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --only-invariants"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @edge-case
    Scenario: Rules product area filter excludes non-matching areas
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --product-area Validation"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @edge-case
    Scenario: Rules combines product area and only-invariants filters
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --product-area CoreTypes --only-invariants"
      Then exit code is 0
      And stdout contains "BusinessRuleSet"

    @happy-path
    Scenario: Rules filters by canonical package name
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --package @libar-dev/architect-cli"
      Then exit code is 0
      And stdout contains "CoreUtilsTest"
      And stdout does not contain "ValidationRulesTest"

    @happy-path
    Scenario: Rules package filter works with count
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --package @libar-dev/architect-cli --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 2

    @happy-path
    Scenario: Rules feature path filter works with count
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --feature packages/architect-cli/specs/core-utils.feature --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 2

    @happy-path
    Scenario: Rules feature glob filter works with names-only
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --feature 'packages/architect-core/**/*.feature' --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the rules names-only result has 2 entries

    @happy-path
    Scenario: Rules feature path filter accepts package-host repo-relative path
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' rules --feature packages/architect/tests/features/cli/package-host-rules.feature --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 1

    @happy-path
    Scenario: Rules feature glob filter accepts package-host repo-relative glob
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' rules --feature 'packages/architect/tests/features/cli/*.feature' --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the rules names-only result has 1 entries

    @validation
    Scenario: Rules rejects retired phase filter
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --phase 5"
      Then exit code is 1
      And output contains "Unknown option: --phase"

    @validation
    Scenario: Rules rejects conflicting pattern and product-area filters
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --pattern CoreUtilsTest --product-area Validation"
      Then exit code is 1
      And output contains "--pattern, --product-area, --package, and --feature cannot be combined"
