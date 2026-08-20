@architect
@architect-pattern:CliFlagParsingExecutableTests
@architect-status:completed
@architect-unlock-reason:Rewired-to-the-graph-handle-bin-after-ADR-014-verb-CLI-replacement
@architect-product-area:DataAPI
@architect-implements:GraphHandleCli
@architect-bounded-context:cli
Feature: Architect CLI flag parsing

  Verifies that the `architect` bin validates its flag values through
  strict Zod schemas at the CLI boundary before any handler runs.
  (`q` bodies are code, the sanctioned exception — they compile, they
  are not schema-parsed.)

  Rule: Flags are parsed and validated at the CLI boundary

    **Invariant:** Flag values are validated through a strict schema at the
    boundary. A flag missing its required value, and an unknown flag on the
    dangling gate, exit non-zero with a diagnostic naming the problem.

    **Rationale:** Single-parse-at-the-boundary mirrors the repo-wide
    Zod-first invariant. Letting handlers re-parse strings would re-derive
    the trust boundary internally and risk silent coercion drift.

    **Verified by:** `architect --base-dir` without a value is rejected;
    `architect dangling --not-a-flag` is rejected with the unknown flag named.

    @validation
    Scenario: --base-dir without a value is rejected
      When I run "architect --base-dir"
      Then the exit code is non-zero
      And stderr mentions "base-dir"

    @validation
    Scenario: dangling rejects an unknown flag
      When I run "architect dangling --not-a-flag"
      Then the exit code is non-zero
      And stderr mentions "not-a-flag"
