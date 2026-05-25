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

| WS       | Workstream                                                                                                                                                                                                                                                     | Status                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **WS-0** | Finalize hygiene — `parseMarkdownToBlocks` export restore; deterministic docs manifest; CI hardening (`format:check`, `typecheck:dogfood`, `test:dogfood`, docs-live freshness); prettier sweep; untrack ephemeral `.scratch`/`.cleanup-review`/`.full-review` | **DONE** (unstaged in tree) |
| **WS-1** | **Annotation re-enablement** — restore graph connectivity (edges → classification → shapes → invariants), pilot on projection then expand                                                                                                                      | **THIS PLAN**               |
| **WS-2** | Skills — full updates for remaining skill bodies                                                                                                                                                                                                               | scoped, detail TBD          |
| **WS-3** | Docs — doc updates / regeneration aligned to the re-enabled graph                                                                                                                                                                                              | scoped, detail TBD          |

WS-1 is detailed below; WS-2/WS-3 get their own sessions once WS-1's pilot proves
the method and the graph is queryable enough to drive doc generation.

## 3. WS-1 strategy

1. **Subsystem-first, not boil-the-ocean.** Pilot on the projection/doc-gen
   pipeline (49 orphans, highest density, and the subsystem most needed for the
   doc-gen vision). Prove the method, measure, then expand to core → guard →
   cli → mcp.
2. **Four enrichment dimensions, prioritized by leverage:**
   1. **Edges** (`@architect-uses`) — biggest unlock, lowest cost.
   2. **Classification** (`@architect-role`, `@architect-bounded-context`) — cheap; mostly present in projection.
   3. **Shapes** (`@architect-shape`) — high value for "what are the data contracts."
   4. **Invariants** (`Rule:` blocks in executable features) — most effort; add **only where architecturally significant** (no ceremonial rules).
3. **Additive, under the refactoring carve-out** (`architect-refactor-session`).
   Shipped code, no design specs → enrich `.ts` JSDoc additively; never move a
   behavioral pattern's identity; edges authored (reverse edges derive); No-BC;
   gates non-negotiable.
4. **Two work types, kept separate:**
   - **(A) Enrich existing patterns** — the 107 orphans. Pure additive, ~90% of effort.
   - **(B) New code-originated identity** — for genuinely un-patterned shipped
     abstractions (`ExtractedPattern`, `BlockSchema`, un-patterned codecs).
     Smaller; identity surface decided in DECISIONS D-3.

## 4. Projection pipeline reference (self-contained)

The data flow the pilot connects:

```
.ts JSDoc ─┐
           ├─► DocExtractor ─┐
.feature ──┴─► GherkinExtractor ─► DualSourceExtractor ─► ExtractedPattern (read model, ~60 fields)
                ShapeExtractor ─┘                              │
                                                               ▼
                                            42 Fragment kinds (Zod, role:contract)
                                            grouped in 6 bounded-contexts:
                                              pattern-relations · governance ·
                                              execution-context · operational-insights ·
                                              delivery-reporting · documentation-composition
                                                               │
                              ProjectionFragmentSchema (discriminated union of all kinds)
                                                               │
                          FragmentRendererDispatch (role:codec, dispatchByKind)
                                                               │
                       ┌────────────┬───────────┬──────────────┐
                  MarkdownRenderer JsonRenderer UiRenderer CompactTextRenderer
                       (each consumes the union; Markdown also renders BlockSchema primitives)

BlockSchema (blocks/schema.ts): heading·paragraph·separator·table·list·code·mermaid·link-out·collapsible
  — inline content primitives used inside prose-carrying fragments (e.g. DecisionRecord.decision: Block[])
```

## 5. WS-1 Phase 1 — projection pilot (grounded against real files)

All targets verified on HEAD. Files are under `packages/architect-projection/src/`.

### Cluster A — Renderer spine (DONE; verified edges per-file)

Edges are **per-file verified, not uniform** — `render-json.ts` serializes
generically and does NOT import `dispatchByKind`, so it must NOT declare
`FragmentRendererDispatch`. Syntax: `@architect-uses A, B` (space, no colon).

| File                               | Pattern                  | `@architect-uses`                                               |
| ---------------------------------- | ------------------------ | --------------------------------------------------------------- |
| `renderers/render-markdown.ts`     | MarkdownRenderer         | FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema |
| `renderers/render-ui.ts`           | UiRenderer               | FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema |
| `renderers/render-compact-text.ts` | CompactTextRenderer      | FragmentRendererDispatch, ProjectionFragmentSchema              |
| `renderers/render-json.ts`         | JsonRenderer             | ProjectionFragmentSchema (no dispatch)                          |
| `renderers/_shared/dispatch.ts`    | FragmentRendererDispatch | ProjectionFragmentSchema                                        |

- **Acceptance (met):** `dep-tree MarkdownRenderer` and `arch neighborhood ProjectionFragmentSchema` return a connected graph; `FragmentRendererDispatch` consumers are markdown/ui/compact (correctly **not** json).

### Cluster B — Block primitives (new code-originated identity + edges)

- `blocks/schema.ts` → add `@architect-pattern BlockSchema` (`@architect-role:contract`,
  `@architect-bounded-context:rendering`, `@architect-status:active`). (D-3 → code-originated.)
- Prose-carrying fragments (`governance/decision-record.ts` `DecisionRecord`, plus any
  fragment whose schema carries `Block[]`) → `@architect-uses:BlockSchema`.
- **Acceptance:** `pattern BlockSchema` resolves; `arch neighborhood BlockSchema` shows fragment consumers.

### Cluster C — Fragment union membership (modeling call — see D-4)

- `fragments/fragment-schema.internal.ts` (`ProjectionFragmentSchema`) is a flat
  ~44-member discriminated union.
- **Recommended (D-4): light model** — edge the union only into the renderer spine
  (Cluster A already does this); do **not** author 44 `uses` edges. Rely on
  `bounded-context` for "what fragments live in context X."

### Cluster D — Read-model bridge (optional pull-in from core)

- `architect-core/src/validation-schemas/extracted-pattern.ts` → create
  `@architect-pattern ExtractedPattern` (code-originated; `role:read-model` or `contract`).
- Edge fragments / projection functions `@architect-uses:ExtractedPattern`.
- Defer to expansion unless we want the data root connected during the pilot.

### Cluster E — Fragment kinds via producers (Session 02+, see D-7)

The ~40 orphan fragment kinds (`PatternDetail`, `BusinessRule`, …) are connected
through their **producer**, not the re-export barrel. Each `<X>Projection`
function returns `ProjectionBundle<X>` and builds `kind: 'X'`, so
`<X>Projection @architect-uses <X>` is the true producer→product edge.
**Rejected:** `<Context>FragmentContracts uses <members>` — the barrel is a pure
re-export surface; that edge inverts the dependency (D-7). One context per
session (pattern-relations first). Some functions produce >1 fragment — verify
each against the return type + `kind:` literals.

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

WS-0 (done) → **WS-1 Phase 1 pilot (A → B → C, D optional)** → measure →
WS-1 expansion (core → guard → cli → mcp) → WS-2 skills → WS-3 docs → PR finalize.
WS-2/WS-3 can begin once the graph is queryable enough to drive them.
