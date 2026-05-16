@architect
@architect-pattern:CliCommandResolutionExecutableTests
@architect-status:candidate
@architect-product-area:DataAPI
@architect-implements:PatternGraphCLI
@architect-bounded-context:cli
Feature: Architect CLI command resolution

  Verifies that `pattern-graph-cli` parses positional arguments per the
  COMMAND_NAMES catalogue and dispatches to the documented subcommand
  handler. This is a starter feature scaffold authored by M4 Part E to
  set the convention; step-definition wiring is deferred to a follow-up
  PR that introduces vitest-cucumber to the architect-cli package.

  Rule: Known command names dispatch to their handler

    **Invariant:** Every name in `COMMAND_NAMES` resolves to exactly one
    handler. Unknown names produce a non-zero exit and a "command not
    found" diagnostic on stderr.

    **Rationale:** The CLI is the deterministic surface for the Data API;
    silent fall-through on a typo would let a misnamed command appear to
    succeed (e.g., empty stdout) while actually doing nothing.

    **Verified by:** `architect overview` returns the overview-digest text;
    `architect arch dangling` returns the dangling-reference document;
    `architect not-a-real-command` exits non-zero with a helpful diagnostic.

    @happy-path
    Scenario: overview subcommand resolves to overview handler
      When I run "architect overview"
      Then the exit code is zero
      And stdout begins with the overview-digest header

    @happy-path
    Scenario: arch dangling subcommand resolves to dangling handler
      When I run "architect arch dangling"
      Then the exit code is zero
      And stdout parses as JSON
      And the JSON document has key "metadata.validation.warningCount"

    @negative
    Scenario: unknown command name produces a diagnostic
      When I run "architect not-a-real-command"
      Then the exit code is non-zero
      And stderr mentions "command" and "not-a-real-command"
