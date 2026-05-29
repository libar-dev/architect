@architect
@architect-pattern:PatternGraphCliRulesSubcommand
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Split-from-original
@architect-product-area:DataAPI
@cli @pattern-graph-cli
Feature: Pattern Graph CLI - Rules Subcommand
  The rules subcommand queries business rules and invariants extracted from Gherkin Rule: blocks.

  Background:
    Given a temporary working directory

  Rule: CLI rules subcommand queries business rules and invariants

    **Invariant:** The rules subcommand returns structured business rules extracted from Gherkin Rule: blocks via the projection layer.

    **Rationale:** Live business rule queries replace static generated markdown, enabling on-demand filtering by product area, pattern, package, feature path, and invariant presence.

    **Verified by:** Rules returns business rules from feature files, Rules filters by product area, Rules with names-only returns flat array, Rules with count returns a JSON number, Rules filters by canonical package id, Rules package filter works with count, Rules rejects an unknown package with the accepted set, Rules aggregates a decision across enforcing patterns, Rules decision filter accepts the ADR id form, Rules decision filter accepts the canonical pattern name, Rules decision filter excludes unrelated rules, Rules rejects an unknown decision with the accepted set, Rules rejects conflicting decision and pattern filters, Rules feature path filter works with count, Rules feature glob filter works with names-only, Rules rejects retired phase filter

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
    Scenario: Rules filters by canonical package id
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --package architect-cli"
      Then exit code is 0
      And stdout contains "CoreUtilsTest"
      And stdout does not contain "ValidationRulesTest"

    @happy-path
    Scenario: Rules package filter works with count
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --package architect-cli --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 2

    @validation
    Scenario: Rules rejects an unknown package with the accepted set
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --package @libar-dev/architect-cli"
      Then exit code is 1
      And output is a fail-loud package error enumerating the accepted set

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
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' rules --feature tests/features/cli/package-host-rules.feature --count"
      Then exit code is 0
      And stdout is a JSON number
      And the rules count equals 1

    @happy-path
    Scenario: Rules feature glob filter accepts package-host repo-relative glob
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'tests/features/**/*.feature' rules --feature 'tests/features/cli/*.feature' --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the rules names-only result has 1 entries

    @happy-path
    Scenario: Rules aggregates a decision across enforcing patterns
      Given Gherkin feature files enforcing a decision
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' -f 'architect/decisions/**/*.feature' rules --decision 777 --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the names-only result aggregates the decision rule and its enforcing rule

    @happy-path
    Scenario: Rules decision filter accepts the ADR id form
      Given Gherkin feature files enforcing a decision
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' -f 'architect/decisions/**/*.feature' rules --decision ADR-777 --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the names-only result aggregates the decision rule and its enforcing rule

    @happy-path
    Scenario: Rules decision filter accepts the canonical pattern name
      Given Gherkin feature files enforcing a decision
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' -f 'architect/decisions/**/*.feature' rules --decision ADR777Sample --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And the names-only result aggregates the decision rule and its enforcing rule

    @validation
    Scenario: Rules decision filter excludes unrelated rules
      Given Gherkin feature files enforcing a decision
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' -f 'architect/decisions/**/*.feature' rules --decision 777 --names-only"
      Then exit code is 0
      And stdout is a JSON string array
      And stdout does not contain "Unrelated rule is excluded from the decision set"

    @validation
    Scenario: Rules rejects an unknown decision with the accepted set
      Given Gherkin feature files enforcing a decision
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' -f 'architect/decisions/**/*.feature' rules --decision NONSENSE"
      Then exit code is 1
      And output is a fail-loud decision error enumerating the accepted set

    @validation
    Scenario: Rules rejects conflicting decision and pattern filters
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "pattern-graph-cli -i 'src/**/*.ts' -f 'packages/**/specs/**/*.feature' rules --decision 777 --pattern CoreUtilsTest"
      Then exit code is 1
      And output contains "--pattern, --product-area, --package, --feature, and --decision cannot be combined"

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
      And output contains "--pattern, --product-area, --package, --feature, and --decision cannot be combined"
