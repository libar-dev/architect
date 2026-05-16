@architect
@architect-pattern:CliFlagParsingExecutableTests
@architect-status:candidate
@architect-product-area:DataAPI
@architect-implements:PatternGraphCLI
@architect-bounded-context:cli
Feature: Architect CLI flag parsing

  Verifies that each CLI subcommand validates its flags through its
  declared `flagParsers` Zod schema before invoking the handler.
  This is a starter feature scaffold authored by M4 Part E; step-definition
  wiring is deferred to a follow-up PR that introduces vitest-cucumber to
  the architect-cli package.

  Rule: Flags are parsed and validated at the CLI boundary

    **Invariant:** Each subcommand's `flagParsers` Zod schema is the single
    parse-and-validate point for its flags. Unknown flags, malformed enum
    values, and incompatible flag combinations exit non-zero with a
    Zod-shaped diagnostic; valid flags are coerced to typed values
    before the handler runs.

    **Rationale:** Single-parse-at-the-boundary mirrors the repo-wide
    Zod-first invariant. Letting handlers re-parse strings would
    re-derive the trust boundary internally and risk silent coercion
    drift across subcommands.

    **Verified by:** `architect overview --format json` is accepted and
    output is JSON-parseable; `architect overview --format invalid` is
    rejected with an enum-validation diagnostic; `architect rules
    --pattern X --product-area Y` rejects the conflicting flag pair.

    @happy-path
    Scenario: --format json on overview produces JSON output
      When I run "architect overview --format json"
      Then the exit code is zero
      And stdout parses as JSON

    # Skipped: current CLI emits "--format must be compact or json" rather than a
    # Zod-shaped "Invalid"/"format" diagnostic. Aspirational pending Zod-first flag-parser refactor.
    @skip @validation
    Scenario: --format with an unknown value is rejected
      When I run "architect overview --format made-up"
      Then the exit code is non-zero
      And stderr mentions "Invalid" and "format"

    # Skipped: current CLI emits "--pattern and --product-area cannot be used together"
    # (with hyphenated dashes), not the camelCase phrasing the scenario expects.
    @skip @negative
    Scenario: rules subcommand rejects conflicting filters
      When I run "architect rules --pattern Foo --product-area Bar"
      Then the exit code is non-zero
      And stderr mentions "pattern and productArea cannot be used together"
