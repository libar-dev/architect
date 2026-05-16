@architect
@architect-pattern:CliOutputFormattingExecutableTests
@architect-status:candidate
@architect-product-area:DataAPI
@architect-implements:PatternGraphCLI
@architect-bounded-context:cli
Feature: Architect CLI output formatting

  Verifies stdout / stderr behavior across the supported `--format`
  values (json / text / markdown). This is a starter feature scaffold
  authored by M4 Part E; step-definition wiring is deferred to a
  follow-up PR that introduces vitest-cucumber to the architect-cli
  package.

  Rule: Format flag selects the renderer; stdout carries the payload, stderr carries diagnostics

    **Invariant:** `--format json` emits JSON-parseable bytes on stdout
    and nothing on stderr for the success path. `--format text` (the
    default) emits human-readable lines. `--format markdown` emits a
    document with markdown headings. Diagnostics, warnings, and errors
    always go to stderr regardless of format.

    **Rationale:** Pipe-friendliness depends on stdout staying clean for
    the chosen format. Any banner, deprecation notice, or warning leaking
    onto stdout in JSON mode would break downstream `jq` and any
    automation that pipes the CLI output.

    **Verified by:** `architect overview --format json` emits empty stderr
    and JSON-parseable stdout; `architect overview --format markdown`
    emits a markdown heading on stdout; deprecation warnings (when any)
    appear only on stderr.

    @happy-path
    Scenario: json format emits parseable bytes on stdout, nothing on stderr
      When I run "architect overview --format json"
      Then the exit code is zero
      And stderr is empty
      And stdout parses as JSON

    # Skipped: current CLI accepts only --format compact|json. Markdown renderer is
    # aspirational; the projection package emits markdown but the CLI does not yet expose it.
    @skip @happy-path
    Scenario: markdown format emits a markdown heading on stdout
      When I run "architect overview --format markdown"
      Then the exit code is zero
      And stdout begins with "#"

    # Skipped: no CLI invocation currently triggers a deprecation warning. Aspirational
    # contract scenario reserved for the first deprecated flag/subcommand.
    @skip @contract
    Scenario: deprecation warnings appear only on stderr
      When I run a CLI invocation that triggers a deprecation warning
      Then stdout does not mention "deprecated" or "deprecation"
      And stderr mentions "deprecat"
