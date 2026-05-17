# Idea Inbox

Captures ideas at the lightest possible Gherkin tier — ≤30 lines (warn-only soft budget), five authored tags, one user story, one or more invariant-only Rules. Ideas are under consideration, not committed to delivery.

**Format reference:** `formal-spec/08-spec-evolution.md` § "Idea Tier — Lightweight Pre-Candidate" and `formal-spec/05-feature-spec-format.md`. The plugin-internal canonical form lives in [`../../../.agents/skills/_shared/four-tier-ladder.md`](../../../.agents/skills/_shared/four-tier-ladder.md).

**Parent epic convention:** Every idea carries `@architect-parent:<EpicName>`. The parent epic spec lives alongside the ideas it groups (e.g. `lifecycle-mvp-epic.feature`) and lists members in a human-facing `**Members:**` block. Epic and slice variants (`@architect-level:epic|slice`) are exempt from the `@architect-parent` requirement.

**Promotion:** When an idea matures, `git mv` the file to `../candidates/`, add an `**Open Questions:**` block, and add 1–2 happy-path scenarios per the candidate-tier delta in `formal-spec/08-spec-evolution.md` § "Promotion: Idea → Candidate". `@architect-status` stays `candidate` until the acceptance gate promotes the spec past candidate.
