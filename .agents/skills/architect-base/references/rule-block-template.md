# Rule-block template

Reference for the structured `Rule:` block convention used in both design specs and executable Gherkin. Used by the `architect-sessions` plan, design, implement, and review-spec references and by `architect-refactor-session`.

## Rule blocks are optional

Rule blocks are **not mandatory**. Use them when the feature defines business invariants that benefit from structured tracking. Skip them for plain behavior verification. Forcing Rule blocks onto features that aren't invariant-driven adds noise without information.

A feature whose intent is "verify this UI button shows the right text in three states" needs scenarios, not invariants. A feature whose intent is "the planning state machine never allows X → Y without unlock-reason" is exactly what Rule blocks were designed for.

## 4-field template (when Rule blocks are used)

```gherkin
Rule: <one-line rule name>

  **Invariant:** <1-2 sentence statement of what must always be true>

  **Rationale:** <why this invariant exists, not a mechanical restatement of the invariant>

  **Verified by:** <comma-separated list of Scenario names in this Rule>
```

The four fields:

1. **Rule line.** Short, descriptive, one rule per Rule block.
2. **Invariant.** 1-2 sentences. State the rule, do not justify it.
3. **Rationale.** Why the invariant exists. Reference ADRs or business context. Avoid restating the invariant.
4. **Verified by.** Comma-separated list of Scenario names from this Rule block. The back-link from invariant to test.

## Verified-by is the back-link

`**Verified by:**` lets a reader (or query) walk from invariant to the specific scenarios that prove it holds. Renaming a scenario without updating Verified-by silently breaks this trace. The trace appears intact but resolves to nothing.

When you rename a scenario, grep for the old name in `**Verified by:**` lines and update.

## Distillation (no transcription)

The `**Rationale:**` and `**Verified by:**` fields are where redundancy accretes. Guard them:

- A `**Rationale:**` that inverts or re-states its `**Invariant:**` carries no information. Drop it (the field is optional). Keep it only when it gives a **why** the invariant doesn't: an ADR link, a business constraint, a rejected alternative.
- A `**Verified by:**` repeated **verbatim across multiple rules** is a boilerplate smell (the backfill failure mode, e.g. an ADR with the same string on every rule). Each rule's Verified-by names the scenarios that prove **that** rule, so identical strings mean the back-link is fake.

This is the rule-authoring sibling of the value-transfer **Transcription bloat** anti-pattern ([`../../architect-sessions/references/ephemeral-spec-deletion.md`](../../architect-sessions/references/ephemeral-spec-deletion.md)) and the `review-spec.md` density check.

## Tier guidance

| Tier       | Rule-block fields                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------- |
| Idea       | `**Invariant:**` only. No rationale, no verified-by (no scenarios exist yet)                   |
| Candidate  | `**Invariant:**` only. Open questions and 1-2 happy-path scenarios live OUTSIDE the Rule block |
| Plan       | All four fields                                                                                |
| Design     | All four fields                                                                                |
| Executable | All four fields (transferred from the design tier at implement time)                           |

For the full tier table see [`./four-tier-ladder.md`](./four-tier-ladder.md).

## Sibling references

- [`./four-tier-ladder.md`](./four-tier-ladder.md). Tier table for when to add `**Rationale:**` + `**Verified by:**`.
- [`../SKILL.md`](../SKILL.md) §"Anti-anecdote". The live PatternGraph via `pnpm architect:q` is canonical. A stale skill paraphrase is not.

## Provenance (informational)

The 4-field convention is codified in `formal-spec/05-feature-spec-format.md`. The kernel statement above is the canonical reference for plugin-internal use.
