# Idea Inbox

Captures ideas at the lightest possible Gherkin tier — ≤30 lines (warn-only soft budget), six authored tags (the five baseline + explicit `@architect-maturity:idea`, the guard's idea-tier opt-in), one user story, one or more invariant-only Rules. Ideas are under consideration, not committed to delivery.

**Format reference:** `formal-spec/08-spec-evolution.md` § "Idea Tier — Lightweight Pre-Candidate" and `formal-spec/05-feature-spec-format.md`. The plugin-internal canonical form lives in [`../../../.agents/skills/architect-base/references/four-tier-ladder.md`](../../../.agents/skills/architect-base/references/four-tier-ladder.md).

**Parent epic convention:** Every idea carries `@architect-parent:<EpicName>`. The parent epic spec lives alongside the ideas it groups (e.g. `lifecycle-mvp-epic.feature`) and lists members in a human-facing `**Members:**` block. Epic and slice variants (`@architect-level:epic|slice`) are exempt from the `@architect-parent` requirement.

**Promotion:** When an idea matures, `git mv` the file to `../candidates/`, drop `@architect-maturity:idea` (maturity derives to `idea` from `status:candidate`, which releases the spec from idea-tier gating), add an `**Open Questions:**` block, and add 1–2 happy-path scenarios per the candidate-tier delta in `formal-spec/08-spec-evolution.md` § "Promotion: Idea → Candidate". `@architect-status` stays `candidate` until the acceptance gate promotes the spec past candidate.
