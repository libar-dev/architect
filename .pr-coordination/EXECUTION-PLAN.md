# Execution Plan — Re-enable Architect Core Functionality

> **Self-contained.** This package is the single source of truth for the
> campaign. It does **not** depend on `.scratch/` (the maintainer's tmp,
> `.claudeignore`'d and gitignored — invisible to fresh agent sessions).
> Everything a worker needs to execute is reproduced here.

## 0. Why this campaign exists

Over ~30 deep refactoring PRs the production-code `@architect-*` annotations
were progressively stripped. The PatternGraph survived as a set of pattern
**identities** but lost its **connective tissue** — dependency edges, type
shapes, and most invariants. The result: the Data API (`pnpm architect:query`)
returns islands, so agents and humans cannot use it for context-gathering or
repo understanding, and the documentation-generation surface that projects off
the graph is starved of data.

**Without this work Architect is unusable as a context tool.** This campaign
re-enables core functionality. It lands as **one PR** alongside the finalize
hygiene already done (WS-0) and the skills/docs updates (WS-2/WS-3).

## 1. Diagnosis (measured on HEAD, `campaign/docs-and-skills-consolidation`)

| Signal                        | State                                                                 | Why it blocks the API                                                                    |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Patterns                      | 270 total (121 active, 116 completed, 19 roadmap, 14 candidate)       | —                                                                                        |
| **Orphans** (no edges in/out) | **107 / 270 = 40%** — projection 49, specs/other 32, core 24, guard 2 | `dep-tree`, `arch neighborhood`, `arch blocking`, "how do these connect?" return nothing |
| Role coverage                 | 173 / 270 (64%)                                                       | a third can't be filtered/grouped by kind                                                |
| Bounded-context               | 157 / 270 (58%)                                                       | `arch bounded-context` / `arch compare` partial                                          |
| `@architect-shape` captures   | ~absent                                                               | "what are the data shapes" unanswerable                                                  |
| Missing identities            | `ExtractedPattern`, `BlockSchema`, some codecs                        | the read model + block primitives aren't queryable at all                                |

The refactoring preserved **identity** but dropped **edges, shapes, invariants**.
For the projection layer specifically, role+context are mostly present already —
**edges are the dominant gap**.

## 2. PR scope — workstreams (all land in one PR)

| WS       | Workstream                                                                                               | Status                                                    |
| -------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **WS-0** | Finalize hygiene (manifest determinism, CI hardening, prettier sweep, untrack ephemerals)                | **DONE** (`6f2fc6c`)                                      |
| **WS-1** | **Annotation re-enablement** — restore graph connectivity (edges → classification → shapes → invariants) | **DONE** (Sessions 01–11; orphans 107→27, terminal floor) |
| **WS-2** | Skills — consolidate to the state-driven, progressive-disclosure family                                  | **DONE** (D-21 / D-22 / D-23)                             |
| **WS-3** | Docs — updates / regeneration aligned to the re-enabled graph                                            | **IN PROGRESS** — roadmap in `DOCS-IA-FINDINGS.md`        |

WS-1 strategy + the projection-pilot worklist (the original §3–§5) are archived →
[`archive/EXECUTION-PLAN-WS1-strategy.md`](archive/EXECUTION-PLAN-WS1-strategy.md).
WS-3's docs-IA audit + projection roadmap (R1–R7) → [`DOCS-IA-FINDINGS.md`](./DOCS-IA-FINDINGS.md).

## 3. WS-1 strategy & projection-pilot detail (archived)

WS-1 is complete. Its strategy (subsystem-first enrichment across four dimensions), the
self-contained projection-pipeline reference, and the per-cluster worklist (as executed
across Sessions 01–11) are archived →
[`archive/EXECUTION-PLAN-WS1-strategy.md`](archive/EXECUTION-PLAN-WS1-strategy.md). The
standing rules WS-1 produced live in `DECISIONS.md` (digest). §6 (gates) below is unchanged
and remains the canonical pre-commit sequence for every session.

## 6. Gates (complete list — run before every commit/handoff)

```bash
pnpm build
pnpm format:check
pnpm lint
pnpm typecheck
pnpm typecheck:dogfood
pnpm test
pnpm test:dogfood
pnpm validate:all
pnpm docs:all && git diff --exit-code docs-live
pnpm architect:query -- arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
pnpm --filter @libar-dev/architect-projection test:perf
pnpm audit:subtractive
git add <the session's edited files> && pnpm architect:guard --staged   # FSM/protection gate
```

Additive JSDoc should not move these, but the refactor carve-out **requires**
verifying. A failing gate is stop-and-surface — never `--no-verify`.

- New `@architect-uses` edges referencing yet-uncreated patterns will trip
  `arch dangling` — author the target identity before the edges that point at it
  (or land them in the same commit).
- **Touching `completed` patterns is allowed without `@architect-unlock-reason`**
  for edge-only enrichment (D-6, verified: guard reports 0 status transitions).
  `architect:guard --staged` is the authority — run it on the session's staged
  files. Unlock-reason is required ONLY for a real `completed → active` flip or a
  deliverable/invariant change.

## 7. Progress metrics (deterministic)

| Metric             | Command                                                        | Baseline | Phase-1 target          |
| ------------------ | -------------------------------------------------------------- | -------- | ----------------------- |
| Projection orphans | `arch orphans` (filter projection)                             | 49       | < 5                     |
| Total orphans      | `arch orphans`                                                 | 107      | trends down per package |
| Role coverage      | `tags` (role entry)                                            | 173/270  | rising                  |
| Bounded-context    | `tags` (arch-context)                                          | 157/270  | rising                  |
| Acceptance         | `bundle MarkdownRenderer`, `dep-tree ProjectionFragmentSchema` | islands  | real graph              |

"The API is usable" = the acceptance queries return a connected pipeline.

## 8. Method guardrails (`architect-refactor-session`)

- Additive enrichment only; reverse edges derive from `@architect-uses` (never authored).
- Do not **move** a behavioral pattern's identity into code. New **code-originated**
  identity (Cluster B/D) is legitimate — these are data contracts with no behavioral feature.
- No-BC: no `@ts-ignore`, `eslint-disable`, `@deprecated`, compat aliases.
- Capture any invariant change in `DECISIONS.md` before the edit.
- Stage explicit files; never `git add -A` on this branch.

## 9. Sequencing

WS-0 → WS-1 (Sessions 01–11) → WS-2 → **WS-3 (current)** → PR finalize. WS-0/1/2 are DONE;
WS-3 is the open workstream — the generated-doc projection roadmap (R1–R7) in
`DOCS-IA-FINDINGS.md` §6. Fresh-session read-path: `README.md` → `PREAMBLE.md` →
`DECISIONS.md` digest → `DOCS-IA-FINDINGS.md` §6 → `state.json` `ws3.followUps` → §6 gates.
