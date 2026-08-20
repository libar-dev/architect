---
name: architect-sessions
description: MANDATORY for any spec-driven session in this Architect repo — capturing or refining a spec, designing a pattern, implementing from a design spec, reviewing a spec or implementation, or handing off. Triggers on session-intent verbs (plan/ideate/capture/refine/promote/design/implement/review/verify-value-transfer/handoff) on an Architect pattern, and on `architect/specs/`, `architect/stubs/`, `architect_scope_validate`, FSM transitions, or the four-tier ladder. Load after architect-base + architect-graph-handle. Do NOT use for refactoring shipped code with no design spec (route to architect-refactor-session), generic PR review, or sprint planning.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Architect Sessions

The spec-driven delivery lifecycle in one skill: capture → design → implement → review → handoff. This body is the **context every session needs**; the per-session execution detail lives behind progressive disclosure in [`references/`](references/). Load [`architect-base`](../architect-base/SKILL.md) (vocabulary + doctrine) and [`architect-graph-handle`](../architect-graph-handle/SKILL.md) (the read surface, ADR-014) first — this skill builds on both and does not repeat them.

The one shape that is **not** here: refactoring shipped code that has no design spec. That is the non-spec-driven carve-out and lives in [`architect-refactor-session`](../architect-refactor-session/SKILL.md).

## Sessions in this repo

The lifecycle recognizes a small number of work shapes. Knowing which one you are in tells you **which reference to open** — it does not change the graph reads you run (see "State-driven" below).

- **Idea / candidate authoring** — drafting a new pattern, sharpening invariants, refining open questions. The lightest two rungs. → [`references/plan.md`](references/plan.md)
- **Design** — promoting a plan-level spec: deliverables, stubs, exhaustive scenarios, ADR refs. → [`references/design.md`](references/design.md)
- **Implement** — building from a design spec; transferring value to annotated production code + executable Gherkin. → [`references/implement.md`](references/implement.md)
- **Review (spec)** — gap-finding on a design spec _before_ implementation. Output is a gap list, not a rewrite. → [`references/review-spec.md`](references/review-spec.md)
- **Review (implementation)** — verifying value transfer on _completed_ work and deciding whether design specs are safe to delete. → [`references/review-implementation.md`](references/review-implementation.md)
- **Handoff** — end-of-session state capture so the next session resumes clean. → [`references/handoff.md`](references/handoff.md)

`architect-base` §9–§13 carries the maturity ladder, FSM lifecycle, spec↔pattern bipartite relationship, and value-transfer doctrine that make these shapes legible.

## State-driven, not intent-driven

What the graph handle returns is determined by the pattern's **state on disk**, not by your stated intent. A pattern that is `active` with all dependencies completed answers the same way whether you are about to design, implement, or review — only your downstream action differs.

In practice:

- The same handful of graph reads covers every shape above: status counts (`g.graph.counts`), the pattern node (`g.pattern("<P>")`), direct dependency context (`g.graph.relationshipIndex["<P>"]`), realizing files (`p?.sourceFile` / `p?.implementedBy`), invariants (`g.invariantsOf("<P>")`), plus the `architect_scope_validate` MCP gate. The default pre-flight is one handle call: `pnpm architect:q 'const p = g.pattern("<P>"); return {p, invariants: g.invariantsOf("<P>"), reverifies: g.specsReverifying(["<P>"]).length}'`.
- The work shape tells you which reference to read and which gate to honor — not a different command set.
- Typed context bundles remain as the `architect_bundle` / `architect_context` MCP tools; their mode/session inputs nudge which blocks are included by default, but defaults are good and the returned data is dominated by what the pattern actually _is_. Do not over-rely on intent flags; they are receding over time.

Run the pre-flight from [`architect-graph-handle`](../architect-graph-handle/SKILL.md) — the read surface (ADR-014) — before any architect-scoped `Read` / `Glob` / `Grep`. File scanning to learn pattern state is a smell — one `pnpm architect:q` script answers it.

## The spec is a scaffold (value transfer)

The single idea every session type must hold: **a design-level spec is an ephemeral scaffold, not permanent documentation — but the scaffold coming down never destroys value.** It exists to carry intent from planning into implementation; once the code stands, every piece of its value has already moved to a durable home, and only the now-redundant copy is removed. **Deletion ≠ loss** — "what did we delete?" is a `git log` question. The lifecycle ends in **value transfer**: the spec's invariants move into executable Gherkin (`tests/features/`, canonical) and its rationale into `@architect-*` JSDoc on production code (additive), followed by **deletion** of the design `.feature`. Not everything under `architect/` is deleted, though — a **code/contract stub** (`architect/stubs/`) is **promoted to `src/`**, its `@architect-pattern` identity persisting with the code (ADR-003), only the staging copy removed; a **step-definition stub** becomes the executable feature's step wiring. See [`references/ephemeral-spec-deletion.md`](references/ephemeral-spec-deletion.md) for which artifact goes where.

This is why no session "leaves the spec around as docs," why retroactive plan-level specs for shipped code are forbidden, and why the implement and review-implementation references end in a deletion gate rather than an archive step. The execution detail — the transfer checklist, the five-criterion pre-deletion gate, deletion timing (ask first; defer-to-code-review is the common path) — lives in [`references/ephemeral-spec-deletion.md`](references/ephemeral-spec-deletion.md).

## Universal session rules

Three rules hold for every session here (the campaign-coordination rules — decisions-before-code, scope-discovery classification, learnings propagation — are refactor/campaign-flavored and live in [`architect-refactor-session`](../architect-refactor-session/references/multi-session-coordination.md)):

1. **Graph handle first.** Every pattern-state question goes through `pnpm architect:q '<js>'` (or the `architect_*` MCP tools) before any file read. It is faster and more accurate, and its output is the canonical signal. `architect-base` §15 is the bootstrap discipline.
2. **Gates are non-negotiable.** The validation sequence (`pnpm typecheck && pnpm test && pnpm validate:all`, plus `pnpm architect:guard --staged` for FSM) runs before any commit or handoff. A failing gate is stop-and-surface — never `--no-verify`, never silence it.
3. **Commit hygiene.** Stage explicit files (never `git add -A` on a multi-commit branch); `type(scope): imperative summary`; commit/push only when the user asks.

## Disclosure map — pick your reference

| You are about to…                                                | Open                                                                         | Note                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| capture a new idea / refine a candidate / decide what to build   | [`references/plan.md`](references/plan.md)                                   | lightest tiers; no scope gate target             |
| promote a plan-level spec to design (stubs, deliverables, ADRs)  | [`references/design.md`](references/design.md)                               | writes specs + stubs only, never production code |
| build a design spec end-to-end                                   | [`references/implement.md`](references/implement.md)                         | FSM → active, value transfer, deletion gate      |
| find gaps in a spec **before** implementing                      | [`references/review-spec.md`](references/review-spec.md)                     | output is a gap list, not a rewrite              |
| verify value transfer on **completed** work / batch-delete specs | [`references/review-implementation.md`](references/review-implementation.md) | per-pattern verdict; deletion is opt-in          |
| wrap a session for the next one                                  | [`references/handoff.md`](references/handoff.md)                             | forward-looking note, not a recap                |
| modify shipped code with **no** design spec                      | [`architect-refactor-session`](../architect-refactor-session/SKILL.md)       | separate skill — the carve-out                   |

### Disambiguation (the old router rules, kept)

- **`review` ≠ `review-implementation`.** The first reviews **specs before** implementation (gap-finding); the second reviews **implementations after** merge (value-transfer verification + batched deletion). Pick by lifecycle phase.
- **Qualified four-tier phrases route to planning.** "idea inbox", "idea tier", and "architectural slice" mean the lightest tier — open [`references/plan.md`](references/plan.md), not `design.md`, even when the user is asking about slice scope.
- **Bare words do not route.** "epic", "slice", "candidate" alone are too broad in everyday English ("epic refactor", "take a slice of the array"). Only the qualified Architect phrases or an explicit pattern context belong here.
- **If intent is genuinely ambiguous, ask once** before opening a reference. Do not guess.

## Each reference is self-sufficient

Every file in [`references/`](references/) leads with a short context-gathering step, the lean execution sequence anchored to the graph handle, and a one-line pointer to the natural next session. They cite `architect-base/references/*` for doctrine depth rather than restating it. Open exactly the one your work shape needs.
