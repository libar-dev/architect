# Slices

Holds slice-tier files — multi-pattern lateral views that group existing patterns to answer a specific question. Slices are a **structural variant** of the idea tier, not a separate maturity rung. They use `@architect-level:slice` (which exempts them from `@architect-parent`) and carry a `**Members:**` list plus a `**Usage:**` line stating the question the slice answers.

**Format reference:** `formal-spec/05-feature-spec-format.md` and the slice template in [`../../.agents/skills/architect-sessions/references/plan.md`](../../.agents/skills/architect-sessions/references/plan.md) § "Epic / slice variants". The plugin-internal canonical form lives in [`../../.agents/skills/architect-base/references/four-tier-ladder.md`](../../.agents/skills/architect-base/references/four-tier-ladder.md) § "Epic and slice variants".

**Line budget:** ≤30 lines (same warn-only soft budget as idea-tier).

**Why a separate folder:** Slices reference patterns from multiple parents; they don't fit the parent-edge invariant that idea-tier files in `../specs/ideas/` carry. Keeping them out of `specs/ideas/` keeps lint rules honest. Epic files (`@architect-level:epic`) follow the same logic but conventionally live alongside the patterns they group (typically in `../specs/`) rather than here.
