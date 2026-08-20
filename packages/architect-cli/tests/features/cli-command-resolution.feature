@architect
@architect-pattern:CliCommandResolutionExecutableTests
@architect-status:completed
@architect-unlock-reason:Rewired-to-the-graph-handle-bin-after-ADR-014-verb-CLI-replacement
@architect-product-area:DataAPI
@architect-implements:GraphHandleCli
@architect-bounded-context:cli
Feature: Architect CLI command resolution

  Verifies that the `architect` bin (the graph-handle CLI) dispatches its
  command table deterministically: known commands resolve to their handler,
  unknown commands fail loud. Runs the COMPILED bin (`bin/architect.js`) —
  the shipped product path, not the tsx source path the dogfood suite uses.

  Rule: Known command names dispatch to their handler

    **Invariant:** Every name in the command table resolves to exactly one
    handler. Unknown names produce a non-zero exit and a diagnostic naming
    the unrecognized command on stderr.

    **Rationale:** The bin is the agent's front door; silent fall-through on
    a typo would let a misnamed command appear to succeed (e.g., empty
    stdout) while actually doing nothing.

    **Verified by:** `architect version` prints the package version;
    `architect dangling` returns the dangling-reference JSON document;
    `architect not-a-real-command` exits non-zero with a helpful diagnostic.

    @happy-path
    Scenario: version command resolves to the metadata handler
      When I run "architect version"
      Then the exit code is zero
      And stdout is a semver version

    @happy-path
    Scenario: dangling command resolves to the graph-integrity gate
      When I run "architect dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json"
      Then the exit code is zero
      And stdout parses as JSON
      And the JSON document has key "drift"

    @negative
    Scenario: unknown command name produces a diagnostic
      When I run "architect not-a-real-command"
      Then the exit code is non-zero
      And stderr mentions "command" and "not-a-real-command"
