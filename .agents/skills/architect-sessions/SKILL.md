---
name: architect-sessions
description: MANDATORY context and execution guide for any spec-driven session in this Architect repo — load it whenever the work is to capture or refine a spec, design a pattern, implement from a design spec, review a spec or a completed implementation, or hand a session off. Triggers on session-intent verbs (plan / planning / ideate / brainstorm / capture an idea / refine a candidate / promote / design / implement / review / review-implementation / verify value transfer / handoff) applied to an Architect pattern, and on mentions of `architect/specs/`, `architect/stubs/`, `scope-validate`, FSM transitions, `dep-tree`, `pnpm architect:query`, the four-tier ladder, the qualified phrases "idea inbox" / "idea tier" / "architectural slice", "are these specs safe to delete", or transferring value from stubs to executable Gherkin. Routes to the right per-session reference by work shape — there is no separate router skill. Load AFTER architect-base + architect-data-api and BEFORE any architect-scoped Read / Glob / Grep. Do NOT use for: refactoring shipped code that has no design spec (route to architect-refactor-session — the non-spec-driven carve-out), generic PR code review with no Architect spec involved, sprint planning / project management, OpenAPI / REST design, or bare prose mentions of "epic" / "slice" / "candidate" with no Architect context (too broad on their own).
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Sessions

The spec-driven delivery lifecycle in one skill: capture → design → implement → review → handoff. This body is the **context every session needs**; the per-session execution detail lives behind progressive disclosure in [`references/`](references/). Load [`architect-base`](../architect-base/SKILL.md) (vocabulary + doctrine) and [`architect-data-api`](../architect-data-api/SKILL.md) (the query surface) first — this skill builds on both and does not repeat them.

The one shape that is **not** here: refactoring shipped code that has no design spec. That is the non-spec-driven carve-out and lives in [`architect-refactor-session`](../architect-refactor-session/SKILL.md).

## Sessions in this repo

The lifecycle recognizes a small number of work shapes. Knowing which one you are in tells you **which reference to open** — it does not change the Data API verbs you run (see "State-driven" below).

- **Idea / candidate authoring** — drafting a new pattern, sharpening invariants, refining open questions. The lightest two rungs. → [`references/plan.md`](references/plan.md)
- **Design** — promoting a plan-level spec: deliverables, stubs, exhaustive scenarios, ADR refs. → [`references/design.md`](references/design.md)
- **Implement** — building from a design spec; transferring value to annotated production code + executable Gherkin. → [`references/implement.md`](references/implement.md)
- **Review (spec)** — gap-finding on a design spec *before* implementation. Output is a gap list, not a rewrite. → [`references/review-spec.md`](references/review-spec.md)
- **Review (implementation)** — verifying value transfer on *completed* work and deciding whether design specs are safe to delete. → [`references/review-implementation.md`](references/review-implementation.md)
- **Handoff** — end-of-session state capture so the next session resumes clean. → [`references/handoff.md`](references/handoff.md)

`architect-base` §9–§13 carries the maturity ladder, FSM lifecycle, spec↔pattern bipartite relationship, and value-transfer doctrine that make these shapes legible.

## State-driven, not intent-driven

What the Data API returns is determined by the pattern's **state on disk**, not by your stated intent. A pattern that is `active` with all dependencies completed answers the same way whether you are about to design, implement, or review — only your downstream action differs.

In practice:

- The same handful of verbs (`overview`, `bundle`, `pattern`, `dep-tree`, `files`, `rules`, `scope-validate`) covers every shape above. `bundle <Pattern>` is the default pre-flight.
- The work shape tells you which reference to read and which gate to honor — not a different command set.
- The `--mode` flag on `bundle` / `context` nudges which blocks are included by default, but defaults are good and the returned data is dominated by what the pattern actually *is*. Do not over-rely on intent flags; they are receding over time.

Run the pre-flight from [`architect-data-api`](../architect-data-api/SKILL.md) before any architect-scoped `Read` / `Glob` / `Grep`. File scanning to learn pattern state is a smell — there is a verb for it.

## The spec is a scaffold (value transfer)

The single idea every session type must hold: **design-level specs and stubs are ephemeral scaffolds, not permanent documentation.** They exist to carry intent from planning into implementation; once the code stands, the scaffold comes down. The lifecycle ends in **value transfer** — the spec's invariants move into executable Gherkin (`tests/features/`, canonical) and its rationale into `@architect-*` JSDoc on production code (additive) — followed by **deletion** of the spec.

This is why no session "leaves the spec around as docs," why retroactive plan-level specs for shipped code are forbidden, and why the implement and review-implementation references end in a deletion gate rather than an archive step. The execution detail — the transfer checklist, the five-criterion pre-deletion gate, deletion timing (ask first; defer-to-code-review is the common path) — lives in [`references/ephemeral-spec-deletion.md`](references/ephemeral-spec-deletion.md).

## Universal session rules

Three rules hold for every session here (the campaign-coordination rules — decisions-before-code, scope-discovery classification, learnings propagation — are refactor/campaign-flavored and live in [`architect-refactor-session`](../architect-refactor-session/references/multi-session-coordination.md)):

1. **Data API first.** Every pattern-state question goes through `pnpm architect:query` (or the `architect_*` MCP twins) before any file read. It is faster and more accurate, and its output is the canonical signal. `architect-base` §15 is the bootstrap discipline.
2. **Gates are non-negotiable.** The validation sequence (`pnpm typecheck && pnpm test && pnpm validate:all`, plus `pnpm architect:guard --staged` for FSM) runs before any commit or handoff. A failing gate is stop-and-surface — never `--no-verify`, never silence it.
3. **Commit hygiene.** Stage explicit files (never `git add -A` on a multi-commit branch); `type(scope): imperative summary`; commit/push only when the user asks.

## Disclosure map — pick your reference

| You are about to… | Open | Note |
| --- | --- | --- |
| capture a new idea / refine a candidate / decide what to build | [`references/plan.md`](references/plan.md) | lightest tiers; no `scope-validate` target |
| promote a plan-level spec to design (stubs, deliverables, ADRs) | [`references/design.md`](references/design.md) | writes specs + stubs only, never production code |
| build a design spec end-to-end | [`references/implement.md`](references/implement.md) | FSM → active, value transfer, deletion gate |
| find gaps in a spec **before** implementing | [`references/review-spec.md`](references/review-spec.md) | output is a gap list, not a rewrite |
| verify value transfer on **completed** work / batch-delete specs | [`references/review-implementation.md`](references/review-implementation.md) | per-pattern verdict; deletion is opt-in |
| wrap a session for the next one | [`references/handoff.md`](references/handoff.md) | forward-looking note, not a recap |
| modify shipped code with **no** design spec | [`architect-refactor-session`](../architect-refactor-session/SKILL.md) | separate skill — the carve-out |

### Disambiguation (the old router rules, kept)

- **`review` ≠ `review-implementation`.** The first reviews **specs before** implementation (gap-finding); the second reviews **implementations after** merge (value-transfer verification + batched deletion). Pick by lifecycle phase.
- **Qualified four-tier phrases route to planning.** "idea inbox", "idea tier", and "architectural slice" mean the lightest tier — open [`references/plan.md`](references/plan.md), not `design.md`, even when the user is asking about slice scope.
- **Bare words do not route.** "epic", "slice", "candidate" alone are too broad in everyday English ("epic refactor", "take a slice of the array"). Only the qualified Architect phrases or an explicit pattern context belong here.
- **If intent is genuinely ambiguous, ask once** before opening a reference. Do not guess.

## Each reference is self-sufficient

Every file in [`references/`](references/) leads with a short context-gathering step, the lean execution sequence anchored to the Data API, and a one-line pointer to the natural next session. They cite `architect-base/references/*` for doctrine depth rather than restating it. Open exactly the one your work shape needs.
