---
name: architect-session-router
description: Use at the start of work in an architect-managed repo when the user says one of — capture a new idea, promote a candidate spec, design a pattern, implement from a design spec, review a design spec for gaps, review a completed implementation, refactor shipped code without a spec, or wrap a session for handoff. Triggers on mentions of Architect patterns, `scope-validate`, FSM states, `architect/specs/`, `architect/stubs/`, the architect CLI (`pnpm architect:query`), `dep-tree`, the qualified phrases "idea inbox" / "idea tier" / "architectural slice", or session-intent verbs (plan / planning / ideate / brainstorm / design / implement / review / refactor / handoff) applied to an Architect pattern. Detects session intent and routes to the matching downstream skill, then runs the canonical CLI bootstrap. Do NOT use for: generic code review (no Architect spec involved), plain implementation work without an Architect design-level spec, sprint planning / project management, OpenAPI / REST API design, cross-team handoffs that do not involve Architect patterns, React / frontend refactors, rollout planning, git hygiene, or generic database / infrastructure work. Bare prose mentions of "epic", "slice", or "candidate" do NOT route here — those words alone are too broad; only the qualified Architect phrases above do. Invoke before any other Architect skill and before any Read / Glob / Grep on architect-scoped paths — the Architect Data API (CLI / MCP) is the canonical source, file scanning is not.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Session Router

Resolve **session intent** in the first message, then run the canonical CLI bootstrap, then hand off to the matching downstream skill. Do nothing else here.

## Step 1 — Choose session intent (mandatory, exactly one)

| Intent             | Skill                             | When                                                                                                                                                                                       |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `planning`         | `architect-plan-session`          | Capture a new idea, refine a candidate, decide what to build next                                                                                                                          |
| `design`           | `architect-design-session`        | Take a candidate to design-level: deliverables, stubs, ADRs, exhaustive scenarios                                                                                                          |
| `implement`        | `architect-implement-spec`        | Build a design-level spec end-to-end, transition FSM, transfer value (deletion of the design spec is asked, not auto)                                                                      |
| `refactor`         | `architect-refactor-session`      | Modify shipped code that has no design spec (the spec was deleted at original implement-time); evolve the existing executable feature in place; optionally `.pr-coordination/`-coordinated |
| `review`           | `architect-review-spec`           | Read a design-level spec for implementation readiness, find gaps, do not rewrite                                                                                                           |
| `review-implement` | `architect-review-implementation` | Review one or more **completed** implementations: verify value transfer, batch-delete safe-to-remove design specs                                                                          |
| `handoff`          | `architect-verify-handoff`        | Wrap a session, capture state, list blockers, prepare continuation                                                                                                                         |

`review` reviews **specs before implementation** (gap-finding). `review-implement` reviews **implementations after merge** (value-transfer verification + batched spec deletion). They do not overlap.

`refactor` operates on **shipped code with no design spec** (the four-tier ladder's refactoring carve-out — see [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md)). It is distinct from `implement` (which requires a design-level spec and runs `scope-validate <pattern> implement`) and from `review-implement` (which inspects a just-completed implementation against its now-deleted spec). `refactor` evolves the existing executable feature in place, authoring a `<Pattern>ExecutableTests` feature only when the shipped code lacks one — never a retroactive plan-level spec.

If the user's intent is ambiguous, ask once before continuing. Do not guess.

**Qualified four-tier-ladder phrases route to planning.** The qualified phrases "idea inbox", "idea tier", and "architectural slice" route to `planning` intent and hand off to `architect-plan-session`. They are the lightest tier of spec authoring — do not route them to `architect-design-session` even when the user is asking about slice scope or membership.

Bare prose mentions of "epic", "slice", or "candidate" do **not** route. Those words are too broad in everyday English ("epic refactor", "take a slice of the array", "candidate function") and routing them produces too many false positives. If the user means the four-tier ladder sense, they will use the qualified phrase or invoke the planning skill directly. Background on the four tiers (idea / candidate / plan / design) lives in [`../_shared/four-tier-ladder.md`](../_shared/four-tier-ladder.md).

## Step 2 — Run the canonical bootstrap

Run the canonical pre-flight for the chosen intent from
[`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md)
§"Pre-flight by session intent" (one section per intent: Planning, Design tier
authoring, Implement, Review, Refactor, Handoff, Generic inspection). The
bundle-first composite plus the intent-specific drop-down verbs live there.

The same verbs are available via MCP for tool-mediated bursts —
`architect_overview`, `architect_scope_validate`, `architect_context`, etc.
**MCP names use underscores end-to-end**, not hyphens; see
[`../architect-data-api/SKILL.md`](../architect-data-api/SKILL.md)
§"CLI ↔ MCP tool-name mapping" for the full parity table and when CLI vs MCP
is the right surface.

**Do not Read / Glob / Grep architect-scoped files until after the bootstrap runs.** The Data API (CLI / MCP) is faster, more accurate, and more compact than file scanning. This is a discipline, not an enforced gate — keep it.

## Step 3 — Hand off

State which downstream skill you are invoking and why. Then invoke it. Do not duplicate that skill's workflow content here.

## Do not

- Do not invoke another skill before the bootstrap runs.
- Do not skip handoff to a downstream skill — this skill is routing only.
- Do not wrap or paraphrase the downstream skill's content here.
