# Implement — design spec → code

The design-level `.feature` is your implementation prompt; the stubs encode shape decisions. Together they specify exactly what to build. This session ends with the spec's value living in production code + executable Gherkin; **deleting the design spec is a separate decision** (see "Deletion" below).

**The spec IS the prompt — do not create a wrapper "context" or "session-prep" document.** If the design has a major gap that needs new architectural decisions (not just clarifications), stop and route back to [`design.md`](design.md) / [`review-spec.md`](review-spec.md) rather than papering over it.

**This is execution, not (re-)planning.** The design is settled: do not reopen decisions or re-derive an implementation map — blast radius, consumer list, sequencing — that already exists. The `.feature` deliberately holds only the **durable invariants**; the **volatile `file:line` consumer/blast-radius map** is kept _out_ of it (so it can't rot) and parked in a companion under `plans/` (or `.pr-coordination/`, `.sisyphus/plans/`). So before any `Grep`/Explore to learn _what to touch_, **look for that companion** — `plans/<pattern>-*.md` is the common name — and read it. Use `Grep`/Explore only to **verify** the map against the live tree, never to rebuild it from scratch. Re-deriving a map that already exists (e.g. fanning out search agents to re-discover the blast radius) is wasted work and a sign the companion read was skipped; independent re-confirmation is corroboration, not a reason to keep deliberating instead of building.

Doctrine depth: the value-transfer concept is in [`../SKILL.md`](../SKILL.md) §"The spec is a scaffold"; the **execution detail** (transfer checklist + pre-deletion gate) is [`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md). Split-ownership (realizing code uses `@architect-implements`, not a duplicate `@architect-pattern`; but a code-originated pattern — incl. a promoted stub — owns its own `@architect-pattern` on the `.ts`; JSDoc is additive) is [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md); the bipartite naming + forward/reverse link pair is [`../../architect-base/references/spec-pattern-relationships.md`](../../architect-base/references/spec-pattern-relationships.md); the FSM table + `@architect-unlock-reason:` rules are [`../../architect-base/references/fsm-transitions.md`](../../architect-base/references/fsm-transitions.md).

## Pre-flight

Run the pre-flight from [`../../architect-graph-handle/SKILL.md`](../../architect-graph-handle/SKILL.md) — the read surface (ADR-014): the status overview (`pnpm architect:q 'return {counts: g.graph.counts, active: g.patterns.filter(p => p.status === "active").map(p => p.name)}'`), the `architect_scope_validate` gate for `<Pattern>` `implement`, the implement-mode composite (`pnpm architect:q 'const p = g.pattern("<Pattern>"); return {p, invariants: g.invariantsOf("<Pattern>"), reverifies: g.specsReverifying(["<Pattern>"]).length}'`), the file view (`pnpm architect:q 'const p = g.pattern("<Pattern>"); return {file: p?.sourceFile, realizing: p?.implementedBy}'`), and the FSM gate (`pnpm architect:q 'g.fsm.isValidTransition("<from>","<to>")'`). **Then check `plans/` (and `.pr-coordination/`, `.sisyphus/plans/`) for a companion impact/assessment doc** — if one exists it carries the `file:line` consumer map the `.feature` omits; read it before grepping (see "execution, not (re-)planning" above).

If `architect_scope_validate` for `<pattern>` `implement` is not PASS, **stop**: either the design is incomplete (→ [`design.md`](design.md)) or a dependency is blocked (→ [`review-spec.md`](review-spec.md) to find the blocker).

## Implementation order (strict)

1. **Transition FSM to `active` before any code change.** Verify first: `pnpm architect:q 'g.fsm.isValidTransition("<currentState>","active")'` — proceed only on a confirming verdict. For a design spec entering implement, `<currentState>` is `roadmap`; `isValidTransition` speaks only the four process statuses (`roadmap`/`active`/`completed`/`deferred`), not tier words. Then bump `@architect-status` `roadmap` → `active` in the spec. Unusual transitions need `@architect-unlock-reason:` (the FSM reference).
2. **Read all deliverable target files** listed in the spec's `Background:` table.
3. **Read the stubs** — they encode design decisions (DD-N) and "When to Use" guidance.
4. **Implement deliverables in the order listed**, guided by Rules + Scenarios.
5. **After each deliverable:** run the closest targeted typecheck/test slice for the files you touched, then `pnpm typecheck` before the next phase boundary. Before any commit or handoff: `pnpm typecheck && pnpm test && pnpm validate:all`. Do not batch verification to the end.
6. **Author / refine executable Gherkin** under `tests/features/` as you go — transfer the design Scenarios, carrying the `**Invariant:**` verbatim but **distilling** the rest: keep `**Rationale:**` only where it states a why beyond the invariant, and make `**Verified by:**` name the real `Scenario:` titles (never one boilerplate string copied across rules — see [`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md) §"Transcription bloat"). Enumerate what must land with `pnpm architect:q 'g.invariantsOf("<pattern>")'`.
7. **Add `@architect-*` JSDoc** to every production file you create or modify — at minimum `@architect-implements:<Pattern>` (the realization edge). Do **not** author `@architect-pattern:X` for a pattern `X` a feature file already owns — that duplicates identity; use `@architect-implements:X` instead. **A code-originated pattern keeps its own identity on the `.ts`, though:** when you promote a stub to `src/` it **retains** its `@architect-pattern:<ContractName>` + `@architect-role:<role>` (identity travels from stub through production, ADR-003 — do not strip it). Its `@architect-status` is the opposite — it **advances with the FSM** (`roadmap` → `active` → `completed`) as you build it; **never ship a promoted stub still marked `@architect-status:roadmap`** (that leaves shipped code stale and miscounts delivery progress). A codec/contract/utility defined directly in code likewise owns `@architect-pattern` there. Add `@architect-uses` / `@architect-usecase` / `@architect-decision` / `@architect-role` / `@architect-bounded-context` as additive enrichment. `@architect-uses` is one comma-separated line — extend it, never add a second line. Reverse edges derive; never author them. Keep that JSDoc **local** — this file's how / why / gotcha — never a paraphrase of what the pattern _is_ or why it exists (that lives once on the owning feature; restating it per file denormalizes the canonical node — see [`../../architect-base/references/annotation-ownership.md`](../../architect-base/references/annotation-ownership.md) §"Critical: do not duplicate explanation").
8. **When ALL deliverables complete:** transition the spec to `completed` — and advance **every code-originated pattern you promoted from a stub** to `completed` too (verify none still reads `@architect-status:roadmap` on shipped `src/`: `pnpm architect:q 'g.patterns.filter(p => p.status === "roadmap").map(p => p.name)'` should not list a pattern whose file is now under `src/`). Then regenerate docs and run the value-transfer-and-delete step below.

## Value transfer (verify before deletion)

Walk the five-criterion **pre-deletion gate** in [`ephemeral-spec-deletion.md`](ephemeral-spec-deletion.md) (forward link present + resolves; reverse link present; rich content landed; architecturally significant rationale in JSDoc where Gherkin can't carry it). When a deterministic `value-transfer` check ships on the read surface it returns the same gate as a deterministic `deletionReady` — until then, walk it manually. Every line of the design spec that won't transfer is dead weight — either it transfers, or it was never worth writing.

## Deletion (ask the user first)

Two valid outcomes; **default: ask which applies.**

- **Delete now** — when this session reviewed the value transfer thoroughly and the pattern is the only one in scope.
- **Defer to code review** (more common) — when several related implementations are reviewed together; the reviewer batches deletions via [`review-implementation.md`](review-implementation.md).

Phrase it like: "Value transfer is verified for `<Pattern>`. Delete the design spec now, or defer to code review where related implementations are batched (the more common path)?"

If the user authorizes deletion now:

```bash
git rm architect/specs/<pattern>.feature      # delete the design spec (behavioral identity)
git rm -r architect/stubs/<pattern>/          # remove the staging copy — a code stub's identity now lives in src/ (promoted in step 7, not discarded)
pnpm architect:q 'g.pattern("<pattern>")?.status'   # confirm the pattern shows completed
pnpm docs:all                                 # regenerate docs
```

If the user defers: leave the spec + stubs in place, and name [`review-implementation.md`](review-implementation.md) as the next step in your handoff. If you _cannot_ transfer value because something still depends on the spec, that is a **zombie spec** smell — investigate; either the dependency is wrong or the spec is doing something durable it shouldn't.

## Anti-patterns (stop and redirect)

- **Wrapper documents.** The spec is the prompt; do not create a parallel context markdown.
- **Retroactive specs at any tier.** Discovering code that already implements the pattern → tag an existing executable feature with `@architect-implements:<Pattern>` and enrich it; never author a fresh idea/candidate/plan/design spec for shipped behavior (the refactoring carve-out backfills via a `*ExecutableTests` feature at executable-tier, never via plan).
- **Zombie design specs.** Leaving the design spec after implementation is a lie at worst, noise at best.
- **Half-transferred value.** Rules to executable specs but not to annotations (or vice versa) where both should carry weight.
- **Backward-compat shims.** No `@deprecated`, `// eslint-disable`, `@ts-expect-error`, or re-export aliases — the No-BC guard fails CI.

## Do not

- Do not skip the FSM transition to `active` before coding.
- Do not delay annotations to a follow-up PR — they are part of the implementation.
- Do not declare done without value transfer (+ deletion, or an explicit deferral).

**Next session:** if deletion was deferred, [`review-implementation.md`](review-implementation.md) verifies value transfer and batches the deletion. Otherwise capture state with [`handoff.md`](handoff.md).
