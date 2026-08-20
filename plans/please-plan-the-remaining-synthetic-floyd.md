# Plan — Playground graph-handle: basic MVP (review · test · address gaps · make discoverable)

## Context

`playground/` is the **gen-2-alternative agent read surface** for the PatternGraph: expose the
raw data shapes + a few trusted view functions and let the agent script the rest, instead of a
30-verb API that hides the shapes. The handle (`graph.ts → loadGraph()`) builds both cores live
(~1.5s, no dump), and last session's self-review (REVIEW-NOTES.md, F1–F4) confirmed the headline
numbers reproduce and fixed the two load-bearing honesty bugs.

But two things make it **not yet an MVP**:

1. **It has never had a real test.** The only validation so far is the author's own review. No
   cold working session has stress-tested the surface against real repo questions, so the actual
   gaps (ergonomics, missing cuts, wrong/missing data) are unknown.
2. **It is undiscoverable.** Grep confirms the playground is referenced _nowhere_ outside its own
   docs except two `package.json` scripts — no skill, no `AGENTS.md`/`CLAUDE.md` pointer. A fresh
   agent session would never know it exists.

Meanwhile the repo is deliberately moving **off** the gen-1 verb API: the SessionStart hook
(`.claude/hooks/architect-api-first.sh`) has been stripped of the API-first contract and the live
`overview` execution, and `architect-data-api` was de-mandated to on-demand (AGENTS.md). The hook's
own comment reserves the slot: _"When the new graph-handle surface is proven, this hook is where its
pointer/skill would be wired in."_ This plan fills that slot.

**Goal:** take the handle from _experimental / self-reviewed / undiscoverable_ → _genuinely tested,
regression-guarded, and discoverable via a new basic skill_. That is the first real MVP step toward
the handle becoming an agent's default read surface (a complement to the verbs, not a replacement).

## Decisions locked (from this session's Q&A)

- **Scope** = review the code, run a genuine first real test, and address the gaps found. NOT
  "ship what's already there" — the user explicitly rejected the near-done framing.
- **Regression guard** = a minimal opt-in smoke script (`pnpm playground:smoke`), **not** wired
  into CI gating.
- **Discoverability** = a **new basic skill** for the handle (the old data-api mandate is removed,
  the hook is drafted), validated, then wired into the hook + AGENTS.md/CLAUDE.md.

## Non-goals (stay future-session unless the test proves them needed)

- The `value-transfer` / `deletionReady` view (CONTEXT §5 #1) — only build it if the first real
  test surfaces it as a blocking gap.
- F1-upstream "promotion" pilot on `reporting.feature` (REVIEW-NOTES §5).
- Graduating to a `packages/architect-*` package (ITERATION.md: "later, not now").
- Wiring the smoke into `ci:verify` (keep playground CI-excluded per doctrine).

---

## Phase 0 — Baseline + code review (read + run; no fixes yet)

**Establish the baseline runs** (first execution step — confirms the surface works before we judge it):

```bash
pnpm playground:cli census          # reproduces ~348 / core ~65% / projection ~80%
pnpm playground:q 'g.patterns.length'
pnpm playground:cli drift           # expect 0 dangling / 0 orphaned
```

**Systematic correctness review** of the 8 source files (already read this session). Catalog gaps —
known candidates to confirm or dismiss:

- `views.ts` vs `graph.ts` `blastRadius` return a **different `atRiskSpecs` shape** (feature-path
  strings vs `AtRiskSpec[]`); `cli.ts blast` uses one, `cli.ts specs` the other. Confirm this is
  intentional layering, not a latent confusion.
- The REVIEW-NOTES §2 "Minor" items: `maturity` ladder undercounts realized invariants
  (`ruleCount>0` only sees directly-carried Rules); `blastRadius`/`specsReverifying` seed only from
  `.ts` files, so editing a `.feature` yields no impact. Decide per item: fix vs document-as-known.
- `q.ts` inspect output is capped (`depth: 4, maxArrayLength: 200`) and truncates **silently** —
  a real agent-ergonomics gap (USAGE asks to report output-size friction). Candidate fix: print a
  "truncated — N more" hint instead of silent cut.

Output of Phase 0: a written gap list (append to REVIEW-NOTES.md findings, or a scratch note).

## Phase 1 — First real test (the core of the ask)

Run a **genuine working session** against the handle, using **real questions an agent hits during
repo work**, scored by the rubric the playground already defines (USAGE.md §"What to report back":
friction · missing cuts · wrong/missing data · latency · handle-vs-verb).

Exercise the full demand map and recipe set:

- **Entry adapters (grep→graph bridge):** `g.byFile("packages/architect-projection/src/fragments/base.ts")`,
  `g.bySymbol("ProjectionBundle")`, `g.findByConcept("taxonomy")`.
- **Spec bridge:** `g.invariantsOf("ProjectionContext")`, `g.specsReverifying([...changed files])`.
- **Impact:** `g.blastRadius(changed)` over a real `git diff`.
- **Recipes (run each as written, verify output):** I1 (downstream walk), A1 (precedent),
  A2 (seam group), DRIFT alarm, COMPOSE (blast→invariants→provenance), ESCAPE HATCH.
- **`q.ts` forms + error paths:** argv expr, stdin pipe, a stray `import` (expect the caught hint),
  a thrown error, usage with no args.
- **`cli.ts` commands:** `diff`, `blast HEAD~8`, `fan-in`, `drift`, `census`, `find`, `file`,
  `symbol`, `invariants`, `specs`, `maturity`.

**Cold-agent pass (the truest discoverability test):** dispatch a fresh subagent (`general-purpose`,
no playground context) handed **only** the new skill + USAGE.md, and ask it to answer 2–3 real repo
questions. What it stumbles on is onboarding friction the full-context author cannot feel — this
directly validates the skill in Phase 4. (Run this once a draft skill exists; it bridges Phase 1↔4.)

Output of Phase 1: a concrete, evidence-backed gap list (every entry = command run + actual output

- what was wrong/awkward/missing).

## Phase 2 — Address the gaps

Fix what Phases 0–1 surface, smallest-diff-first, keeping views pure (IO stays in `cli.ts`/`q.ts`):

- **Pure-view / handle bugs** → `views.ts` / `graph.ts`.
- **Ergonomics** (output truncation hints, error messages, quoting) → `q.ts` / `cli.ts`.
- **Missing cuts** → add a verified recipe to `recipes.md` first; promote to a handle method **only**
  if it clears the freeze-vs-script bar (ITERATION.md: many-consumers AND irreducible-join). Default
  to a recipe — do not grow the surface casually.
- **Wrong/missing data** → annotation gap or real pipeline bug; capture in `FEEDBACK.md` if it's a
  verb/pipeline surprise.

Re-run each affected path to verify the fix (the playground is CI-excluded; `tsx` is the gate).

## Phase 3 — Minimal smoke script

Add `playground/smoke.ts` and a `playground:smoke` script (bakes `--conditions=source`, matching the
`playground:q`/`playground:cli` convention).

**Assert invariants that survive annotation growth — NOT frozen counts** (the no-dump/live-state
doctrine says exact numbers drift; asserting `=== 348` would smuggle in the determinism gate the
playground refuses):

- `g.patterns.length > 0` and a generous sanity floor (e.g. `> 300`).
- `driftFlags` → `dangling.length === 0` (the real invariant; should stay 0 as cleanup completes).
- **F2 coherence** (the bug we fixed): no spec where `provenance==='executable' && maturity!=='executable'`,
  and none where `provenance==='authored' && maturity==='executable'` → both `=== 0`.
- Each entry adapter returns non-empty for a known-stable input (`bySymbol("ProjectionBundle")`,
  `findByConcept("taxonomy")`, `byFile(<a mapped core file>)`).
- `q.ts` argv **and** stdin round-trips produce the expected shape; the three error paths exit
  non-zero with the right hint.
- **Print** (informational, not asserted) the live census numbers so a human sees drift at a glance.

Wire into `package.json` scripts only (opt-in); document in USAGE.md + README.md. Do **not** add to
`ci:verify`.

## Phase 4 — New basic skill (discoverability)

Create `.agents/skills/architect-graph-handle/SKILL.md` (canonical path; name adjustable — parallels
`architect-data-api`). Keep it **basic**: one `SKILL.md`, no `references/` yet — it points to the
playground's own USAGE.md / recipes.md / CONTEXT.md for depth.

- **Frontmatter:** `name`, `description` (when to reach for the handle vs the verbs — the demand
  map in one paragraph), `allowed-tools: [Bash, Read, Glob, Grep]` (model on data-api's).
- **Body (small, always-loaded-safe):** the one command (`pnpm playground:q`), the `g.*` surface
  list, the handle-vs-verb demand map, the freeze-vs-script principle, `--conditions=source` is baked
  into the pnpm scripts, and pointers to USAGE/recipes. **Framing is doctrine-critical:** "complements
  the verbs (canonical, product-facing); the handle is the agent-sink for ad-hoc cross-cuts" — never
  "replaces the API."
- **Symlink wiring:** add symlinks in `.claude/skills/` and `.codex/skills/` (and `.opencode/skills/`
  if it belongs to the Architect domain set), then `pnpm check:skills` must pass. Check
  `scripts/check-skill-symlinks.mjs` for the exact mirror requirement before adding.
- **Validate** (the user's "once validated" gate): the Phase 1 cold-agent pass run against this skill
  must reach a successful query from a standing start. Iterate the skill text until it does.

## Phase 5 — Wire discoverability (only after Phase 4 validates)

- **Hook** (`.claude/hooks/architect-api-first.sh`): fill the reserved slot — add an on-demand
  pointer to the handle skill in the `SKILL_BLOCK` (on-demand, like data-api; not auto-loaded).
- **AGENTS.md** (`CLAUDE.md` symlinks to it): add the new skill to the §Skills section, framed as the
  on-demand agent-sink complement to the verbs.
- Keep both edits doctrine-correct (complement, not replacement).

## Phase 6 — Docs consolidation + commit

- Finish the F3 punch list (REVIEW-NOTES §4): lead all run snippets with `pnpm playground:*`; caveat
  stale inline numbers as illustrative-as-of-SHA (don't chase every number).
- Prune REVIEW-NOTES items that graduated to code/skill/smoke.
- **Commit** on `experiment/annotation-fleet` (not main — safe per global git rules). Suggested split,
  extending REVIEW-NOTES §7:
  - `feat(playground): cohort-honest spec bridge` / `coherent executable maturity` / `playground:q|cli scripts` (the existing F1/F2/F4 work, currently uncommitted)
  - `fix(playground): <gaps found in the first real test>`
  - `test(playground): minimal smoke (playground:smoke)`
  - `feat(skills): architect-graph-handle skill + symlink wiring`
  - `chore(hooks,docs): wire handle skill into SessionStart hook + AGENTS.md; refresh playground docs`
  - Confirm with the user before committing (default per repo convention: batch for review).

---

## Critical files

| File                                                     | Change                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| `playground/{views,graph,q,cli}.ts`                      | Phase 2 gap fixes (pure views in views.ts; IO/ergonomics in q.ts/cli.ts) |
| `playground/smoke.ts` _(new)_                            | Phase 3 invariant smoke                                                  |
| `package.json`                                           | add `playground:smoke` script                                            |
| `.agents/skills/architect-graph-handle/SKILL.md` _(new)_ | Phase 4 skill (+ symlinks in `.claude/`, `.codex/`, maybe `.opencode/`)  |
| `.claude/hooks/architect-api-first.sh`                   | Phase 5 — fill the reserved skill-pointer slot                           |
| `AGENTS.md`                                              | Phase 5 — list the new on-demand skill                                   |
| `playground/{README,USAGE,CONTEXT,REVIEW-NOTES}.md`      | Phase 6 — F3 punch list + prune graduated items                          |

## Reuse (don't reinvent)

- **Test protocol** already exists: USAGE.md §"What to report back" (the 5-point rubric).
- **Commit split** already drafted: REVIEW-NOTES.md §7.
- **Skill template**: `.agents/skills/architect-data-api/SKILL.md` (frontmatter + structure).
- **Smoke parity targets**: ANNOTATION-FLEET-FINDINGS.md (348 / core 65% / projection 80% / 0 dangling) — as the _printed_ reference, not asserted equalities.
- **`--conditions=source` convention**: the `playground:q`/`playground:cli` scripts already bake it; `playground:smoke` follows suit.

## Verification (end-to-end)

1. `pnpm playground:cli census` → numbers reproduce (~348 / 65% / 80%); `pnpm playground:cli drift` → 0/0.
2. Every Phase-1 demand-map command + recipe runs clean via `pnpm playground:q` / `pnpm playground:cli`.
3. `pnpm playground:smoke` → all invariant assertions pass; census numbers printed.
4. **Cold-agent validation**: a fresh subagent given only the new skill + USAGE.md reaches a correct
   answer to a real repo question from a standing start.
5. `pnpm check:skills` passes (symlink wiring intact).
6. `pnpm typecheck` still green (playground is excluded, but confirm no stray import leaked into a
   compiled package; the hook/AGENTS edits don't touch TS).
7. Gaps found in the first real test are either fixed (re-run proves it) or recorded as known/🔭.
