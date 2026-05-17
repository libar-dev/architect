# Candidate Specs

Holds specs that have been promoted from idea tier (`../ideas/`) but have not yet passed the acceptance gate to plan tier. Files here carry an `**Open Questions:**` block, 1–2 happy-path scenarios, and `@architect-status:candidate`. Line budget: 30–80 lines.

**Format reference:** `formal-spec/08-spec-evolution.md` § "Level 1: Candidate Spec" and § "Promotion: Idea → Candidate". The plugin-internal canonical form lives in [`../../../.agents/skills/_shared/four-tier-ladder.md`](../../../.agents/skills/_shared/four-tier-ladder.md).

**Promotion to plan:** The acceptance gate flips `@architect-status:candidate` → `@architect-status:roadmap`, the file moves to `../` (i.e., `architect/specs/<name>.feature`), and the plan-tier deliverables/rationale/verified-by content is added in place. See [`../../../.agents/skills/architect-plan-session/SKILL.md`](../../../.agents/skills/architect-plan-session/SKILL.md) for the promotion mechanics; the plan-session skill is scoped to **idea → candidate** only — the candidate → plan transition is a separate session.

**Rejection:** Candidates that don't make the gate are deleted (or archived in a `rejected/` subfolder if the team wants the trail). No "deferred forever" entries — that's what idea-tier is for.
