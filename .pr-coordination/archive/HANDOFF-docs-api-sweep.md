# Handoff — docs-live + Data API sweep (WS-5 / WS-6 / WS-7)

**Branch:** `campaign/docs-and-skills-consolidation` · **Date:** 2026-05-26
**Source plan:** `~/.claude/plans/please-review-and-plan-sprightly-piglet.md`
**Findings of record:** `.full-review/04-deep-architecture-review.md`

This doc is self-contained: a fresh session needs only this file + the codebase to
continue. It captures what shipped, the **premises that were corrected by the live
CLI**, and the remaining workstreams with file anchors + implementation guidance.

---

## Shipped this session (committed, all gates green)

| Commit    | What                                                                                                                                                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `06bfd91` | **WS-1 B-A + WS-2 GLIMPSE.** Un-escaped renderer-authored markdown (DECISIONS.md dead ADR links fixed; arch titles/description/legend; validation-rule IDs; taxonomy/validation bold overviews). `overview` doc-types now derive from the registry (8→12). docs-live re-baselined. |
| `014f5ca` | **WS-3 API ergonomics & `--format` discoverability** (last-session E1/hook/tour folded in).                                                                                                                                                                                        |
| `dbefc37` | **WS-4 `arch graph` verb (N1)** — whole-graph dump (161 nodes, 666 edges) in one call.                                                                                                                                                                                             |

**Uncommitted, left for the maintainer:** `FEEDBACK.md` (open in editor). Its
last-session "`--format json` gaps" entry is now **outdated** — see corrected premise #1.

**Gate baseline (all green at `dbefc37`):** `pnpm typecheck` · package tests (core 1075,
projection 1630, guard 39, mcp 172, cli 27) · help-contract 24 · dogfood 1061 · perf ×1.5 ·
determinism clean · `check:skills`.

---

## Corrected premises (READ FIRST — the live CLI overruled the review)

1. **E2 was wrong: `--format json` is NOT missing.** It is a **global** flag
   (`pattern-graph-cli.ts:136`, default `compact`) that already works on every data verb
   (`overview`, `status`, `dep-tree`, `scope-validate`, `rules`, `pattern`, `context`,
   `files`, `handoff`, `tags`, `arch *`). The gap was _documentation_: it was missing from
   `--help` and the skill falsely tagged those verbs "text-only today". Fixed in `014f5ca`.
   **Do not re-plan E2 as new plumbing.**

2. **B-A "5 docs / 94+54+18+18+13 escape hits" OVER-COUNTED.** Most TAXONOMY/VALIDATION
   escapes are _legitimate_ — they protect **sourced data** (tag examples like
   `@architect-uses:`, identifiers with `_`/`*`). Only **renderer-authored** markdown was
   fixable (ADR links, arch titles/description/legend, a few `**bold**` overview lines,
   backtick-wrapped IDs). CHANGELOG needed **zero** changes. The fix vehicle is the existing
   renderer-private trusted hatch (`render-markdown.ts:101-154,1917-1943` + new
   `trustAuthoredBlock`). **Any future renderer escaping work: trust ONLY renderer-authored
   strings; sourced fragment text stays escaped (ADR-009). The over-trust tripwire = diff
   must touch only links/backticks/bold.**

3. **Two JSON envelope shapes** (caused the tour step-8 `.uses`→null bug): structured verbs
   (`query`, `arch neighborhood`/`blocking`/`dangling`, `diagnostics`) wrap as
   `{ success, data, metadata }` → read **`.data`**; bundle-style verbs (`bundle`,
   `overview`, `status`, `pattern`, `dep-tree`, `arch graph`) return the bundle directly →
   read **`.root`** / top-level. Documented in the skill now.

---

## WS-5 — `package` as a first-class API dimension (N2) · MODERATE

**Already true (don't redo):** package is resolved in the projection layer via
`ProjectionContext.packageResolver` and is now surfaced per node in `arch graph`
(`node.package`). `collectArchitectureNodes` (`projections/_shared/architecture-graph.internal.ts:108`)
calls `resolvePackageLabel`.

**Remaining work — expose package in the read API surface:**

- `list --package <workspace-name>` filter — command def in `packages/architect-cli/src/cli/commands/read.ts` (`list` ~251-306); flag plumbing mirrors existing `--role`/`--status`.
- `package` field on `pattern` / `arch neighborhood` output.
- `arch packages` summary subcommand (follow the `arch graph` pattern just added in
  `structured.ts`: add to `ARCH_SUBCOMMANDS` + a `case`).

**Schema decision (the fork):** `ExtractedPattern`
(`packages/architect-core/src/validation-schemas/extracted-pattern.ts`) has **no** package
field today — it's resolved dynamically. Two options:
(a) Resolve package into the `PatternGraph`/`archIndex` at transform time (one resolve,
read API serves it cheaply) — preferred for a first-class dimension; touches core
transform + schema.
(b) Resolve per-verb in the projection layer (no core schema change) — lighter, but
re-resolves and keeps package out of the core read model.
Recommend (a) if package is meant to be a true graph dimension; (b) if it's just a CLI
convenience. **Update the frozen help-contract** (`tests/steps/cli/data-api-help.steps.ts`)
for any new flag/subcommand.

---

## WS-6 — `docs-live/ARCHITECTURE.md` decomposition (D-1/2/3 + tree) · LARGER, SPEC-ANCHORED

The generated doc is faithful but structure-only. **This is new projection behavior — route
through `architect-sessions` (design → implement) anchored to the candidate-tier
`DocumentationProjection` epic (`architect/specs/documentation-projection/`), not an ad-hoc
generator hack.**

- **D-3 fan-in/hub (quick win, can ship first).** `PatternGraph` renders as an edgeless leaf
  though it has 9 consumers. `usedBy` data exists (`relationshipIndex`;
  `getRelationships()` at `projections/_shared/pattern-helpers.internal.ts:~95`). Add a
  "top-N fan-in" section in `architecture-diagram.internal.ts`. **Verified:**
  `arch neighborhood PatternGraph` returns `usedBy: 9` — and `arch graph` (now shipped)
  already exposes the full edge set to compute fan-in.
- **D-1 package seam.** Reuse `buildGroups(nodes, 'package')` (already exists, used by
  overview) for a package-seam diagram. No schema change needed.
- **D-2 cross-package-context signal.** Annotate nodes whose bounded-context spans packages
  (`validation` splits core/guard; also `rendering`, `cli`).
- **architecture/ tree.** Split into `docs-live/architecture/{index,context-map,<context>,
package-seam,layered}.md` via the registry's `childDirectory` + `entityPathLayout`
  (`documentation-type-registry.ts:~17-34`; precedent: `business-rules/`, `decisions/`).

Manual `docs/ARCHITECTURE.md` retirement stays orthogonal (`.pr-coordination/DOCS-IA-FINDINGS.md`).

---

## WS-7 — `@architect-shape` annotation tier (W-1) · WORKSTREAM

`@architect-shape` is absent (0 in production src), so the field-table / API-reference half
of the W-DOCS-1 doc-gen vision projects empty (`ShapeExtractor` → `extractedShapes[]` has no
source). Run a shape-annotation pass over contract/schema modules (`@param`/`@returns`/
property JSDoc). Sequence **after** WS-6's architecture tree (the shape detail fills its
API-reference pages). The next annotation tier, not a regression.

---

## Doctrine reminders for the fresh session

- **No-BC:** no shims/aliases/`@ts-ignore`/`@deprecated`-to-soften; break + migrate. Never `--no-verify`.
- **Zod-first:** `z.strictObject`, types via `z.infer`, parse once at the boundary.
- **`@architect-uses` must be import-backed** (the E-1 nit). Don't invent edges.
- **Determinism gate:** after any generator/renderer change, `pnpm docs:all && git diff --exit-code docs-live`.
- **Perf gate:** `pnpm --filter @libar-dev/architect-projection run test:perf:baseline` (×1.5).

### Open follow-up created this session

**`ArchitectureGraphProjection` is an orphan** (`pattern-relations/architecture-graph.ts`):
its only dependency is the unannotated `_shared/architecture-graph.internal.ts` collection,
so no honest forward `@architect-uses` edge exists. **Clean fix:** promote that shared
collection to a named support pattern that `ArchitectureDiagramProjection`,
`OverviewProjection`, and `ArchitectureGraphProjection` all `@architect-uses` — connects all
three and removes the orphan. Small refactor; deferred.

---

## Verification recipe (every PR)

```bash
pnpm typecheck && pnpm build && pnpm test && pnpm test:dogfood
pnpm docs:all && git diff --exit-code docs-live/      # determinism
pnpm --filter @libar-dev/architect-projection run test:perf:baseline
pnpm check:skills
npx vitest run tests/steps/cli/data-api-help.steps.ts # frozen help contract (update inventory FIRST for new verbs/flags)
bash scripts/api-capability-tour.sh                   # smoke (exits non-zero on any verb regression)
```
