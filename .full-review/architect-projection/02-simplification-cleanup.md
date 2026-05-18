# architect-projection — Phase 2 Consolidated: Simplification & Cleanup

**Sources:** `raw/2A-simplification.md` + `raw/2B-cleanup.md`. Replaces orchestrator's default Security+Performance phase per user instruction.

## Executive Summary

Phase 2 produced one **finding that sharpens a Phase 1 Critical** and three High-leverage simplifications that close large stretches of code:

1. **C-PROJ-3 is more actionable than Phase 1 framed it.** The perf gate isn't merely "rhetorical" — it's **fully implemented but never invoked**. `tests/perf/compare-baseline.mjs` is a real `min(hardBudget, baseline × 1.5)` gate over 26 metrics with a committed `tests/perf/baselines/business-rule-set.baseline.json`. The current evidence file at `.sisyphus/evidence/task-3-business-rule-set-perf-report.json` shows `project.avgMs = 2.05 ms` exceeding the 1.5 ms hard budget — **the gate would currently fail if wired**. The fix is one line in `package.json:65`: prepend `node tests/perf/compare-baseline.mjs &&` to the test script. This single change unblocks H-CORE-8's downstream measurement.
2. **The 2,227-LOC `render-markdown.ts` split is mechanical** — 9 files, no semantic change. Concrete layout: `routed-paths.ts`, `splitting.ts`, `document-types.ts`, `trusted-markdown.ts`, `block-rendering.ts`, `generic-fragment.ts`, plus 10 `normalizers/<kind>.ts` files. `TRUSTED_MARKDOWN` stays renderer-private; extend the lint rule glob.
3. **`projectionBundleSchema<T>(fragmentSchema)` factory closes ~100 LOC of hand-coded validators.** `BundleRouting`/`ProjectionBundle<T>` derived via `z.infer`; `isBundle`/`isRoutingLike` collapse to `.safeParse(value).success`.

Phase 2B also found that **the package's custom `options-schema-barrel-audit.mjs` script has a gap that misses C-PROJ-2 by ~15 lines of regex extension**. The audit currently only matches `*OptionsSchema` exports; it doesn't verify the `parseAndProject*` body shape. The outlier `parseAndProjectOpenQuestionList` would be caught mechanically if the audit added a `parseAndProject` call-site regex.

Doctrine compliance audited: **clean**. Zero `@ts-ignore`, zero `eslint-disable`, zero `TODO`/`FIXME`, zero `void X`, zero `console.*` in `src/`, zero `as unknown as`, zero `z.object`, zero `.skip`/`.only`, zero `from 'fs'` legacy imports. **Dependency hygiene is clean** — all 5 family-wide pins verified (`zod ^4.1.11`, `vitest ^4.1.4`, `@types/node ^24.12.0`, `typescript ^5.8.2`, `eslint ^9.17.0`). No phantom deps; no devDep leaks into `src/`; zero `node:` imports in `src/` (data-layer purity confirmed).

The same family-wide CL-CORE-3 problem applies: **290 of 582 published files are `.map` files (50%)**. Same one-line fix in `tsconfig.architect-base.json` covers all packages.

## Critical (P0)

### Cleanup-C-PROJ-1. Perf gate IS implemented — just never invoked **[2B]** (sharpens Phase 1 C-PROJ-3)

`tests/perf/compare-baseline.mjs` is the real gate: loads `tests/perf/baselines/business-rule-set.baseline.json`, compares against `.sisyphus/evidence/task-3-business-rule-set-perf-report.json`, applies `min(hardBudget, baseline × 1.5)` per metric across 26 metrics, exits non-zero on regression. The Phase 1 framing called this "rhetorical" — Phase 2B confirms it's **fully written but unwired**. `package.json:65` runs `vitest run` then exits successfully without ever invoking the comparator. `docs/PERF.md:16` documents it as a local command only.

**Current state:** the latest evidence (regenerated 2026-05-17T13:34) shows `project.avgMs = 2.05 ms` against a 1.5 ms hard budget → **active regression that would fail the gate if wired**. Phase 1 listed this as Critical assuming no gate; it's actually MORE critical because there's a real gate detecting a real regression, and the package is shipping anyway.

**Recipe (one line):**

```diff
- "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts",
+ "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts && node tests/perf/compare-baseline.mjs",
```

Then investigate the 2.05 ms regression. H-CORE-8 (27× `structuredClone` in `PatternGraphAPI`) and H-PROJ-Q-6 (`filterPatterns` unconditional `[...patterns]` copy) are the two likeliest contributors per Phase 1.

## High (P1)

### Cleanup-H-PROJ-1. `summarizeTaxonomyDigest` re-exported through 3 barrels **[2B]** (extends Phase 1 H-PROJ-A-3, H-PROJ-A-10)

Triple re-export: `fragments/governance/index.ts:14`, `fragments/index.ts:43`, `projections/index.ts:50`. Publicly addressable via both `./fragments` AND `./projections` subpath exports — same symbol claims two ownership barrels. **Recipe:** moves with H-PROJ-A-3 (relocate to `projections/governance/taxonomy-digest.ts`); delete both fragments-side re-exports.

### Cleanup-H-PROJ-2. `vitest.perf-report.config.mjs` near-duplicates `vitest.config.ts` **[2B]**

The two configs differ only in their `include` pattern. **Recipe:** collapse to one config + CLI override (`vitest run --config vitest.config.ts --testNamePattern='@perf'` or similar). Eliminates a maintenance fork.

### Cleanup-H-PROJ-3. `documentation-type-registry.ts` is a self-described deletion target shipping 174 LOC of Proxy facade **[2B]** (confirms Phase 1 H-PROJ-A-9)

The file's own comment at `:55-63` says it's "campaign deletion target for W-DOCS-1" — yet it ships a `createLazyReadonlyArrayFacade` Proxy + 4-file decomposition for a 12-entry static registry. **Recipe:** if W-DOCS-1 is reasonable to land this cycle, the whole module + the dual-schema H-PROJ-A-8 dissolves. If not, replace Proxy with `let cached; export function getRegistry() {...}` (8 lines).

### Phase 2A high-leverage recipes (full code in `raw/2A-simplification.md`)

| Recipe       | Refs             | Summary                                                                                                                                                                                                                                                                                                 |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **H-SIMP-1** | H-PROJ-A-5       | **9-file split of `render-markdown.ts`** — `routed-paths.ts`, `splitting.ts`, `document-types.ts`, `trusted-markdown.ts`, `block-rendering.ts`, `generic-fragment.ts`, `normalizers/<kind>.ts` × 10. `TRUSTED_MARKDOWN` stays renderer-private; lint rule glob extends to new path. No semantic change. |
| **H-SIMP-2** | H-PROJ-A-4       | **`projectionBundleSchema<T>(fragmentSchema)` factory** — full Zod schema replacing the hand-coded `isBundle`/`isRoutingLike` chain (~100 LOC drop). Uses `z.lazy` to break the `base.ts`/`fragment-schema.internal.ts` cycle.                                                                          |
| **H-SIMP-3** | H-PROJ-Q-4       | **`createStatusCounts` single-pass tally** — 4 sequential `.filter().length` → one accumulator loop. On perf-gate path; fires 20-40× per gate run.                                                                                                                                                      |
| **H-SIMP-4** | H-PROJ-Q-6       | **`filterPatterns` no-filter copy elimination** — return input array when `filter === undefined`; type return as `readonly ExtractedPattern[]`. Affects 14 hot call sites.                                                                                                                              |
| **H-SIMP-5** | M-PROJ-3         | **`dependency-tree` Set-clone → mutate+backtrack** via `try…finally` — O(n) → O(1) per frame.                                                                                                                                                                                                           |
| **H-SIMP-6** | M-PROJ-8         | **`patternSatisfiesTag` 24-case switch → `Map<tag, accessor>` table** — data-driven lookup.                                                                                                                                                                                                             |
| **H-SIMP-7** | Phase 1 (8 dups) | **8 in-package duplication consolidations** — one `_shared/` file per pair: `_shared/status-counts.internal.ts`, `_shared/business-rule-annotations.internal.ts`, `_shared/getPatternName` consolidation, `renderers/_shared/tabular.ts`, `renderers/_shared/primitives.ts`.                            |
| **H-SIMP-8** | M-PROJ-A-4       | **Split `operational-insights/index.ts` (1,200 LOC) and `delivery-reporting/index.ts` (742 LOC) by project\* function** — match the `pattern-relations/`/`execution-context/` sibling convention.                                                                                                       |
| **H-SIMP-9** | M-PROJ-A-3       | **Split `pattern-helpers.internal.ts` (515 LOC) into 4 concern-specific files** — pattern lookup, relationship normalization, rule-annotation parsing (then deletes after H-PROJ-Q-2), description extraction. Drop fuzzy-match + extractFirstSentenceRaw entirely once core CL-CORE-16/17 lands.       |

## Medium (P2)

### Audit-script gap closes C-PROJ-2 **[2B]**

**M-PROJ-Cleanup-1.** `scripts/options-schema-barrel-audit.mjs:12-14` matches only `*OptionsSchema` export names. Does NOT verify the `parseAndProject*` body shape. The outlier `parseAndProjectOpenQuestionList` (Phase 1 C-PROJ-2) bypasses `parseAndProject` and the audit doesn't notice. **Recipe:** add a second pass (~15 LOC) — for each export starting with `parseAndProject`, regex the source for `parseAndProject(<Schema>, project<Name>` to confirm it routes through the shared wrapper. Catches C-PROJ-2 mechanically.

### Other medium cleanups [2B]

| #                | Issue                                                                                                                                                                                                                                    | Recipe                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| M-PROJ-Cleanup-2 | `vitest.perf-report.config.mjs` is a maintenance fork (see Cleanup-H-PROJ-2)                                                                                                                                                             | Collapse.                                 |
| M-PROJ-Cleanup-3 | `audit.script tests/perf/baselines/business-rule-set.baseline.json` is the real baseline file Phase 1 said was missing — exists, committed, never used                                                                                   | Wire into test script (Cleanup-C-PROJ-1). |
| M-PROJ-Cleanup-4 | `.sisyphus/evidence/` is the perf output target. Cleanup of this directory is not handled by any script in projection.                                                                                                                   | Document or scope per cleanup convention. |
| M-PROJ-Cleanup-5 | Per family-wide drift (CL-CORE-10/11): projection's `lint` IS `eslint src tests` (good); `typecheck` is **only** `tsconfig.test.json` (drift — should chain both per family); `test` chain is the most disciplined in the family (good). | Align `typecheck` to family.              |
| M-PROJ-Cleanup-6 | `scripts/options-schema-barrel-audit.mjs` and `scripts/jsdoc-boilerplate-audit.mjs` are useful audits — projection is the only package with this discipline. Worth promoting one or both to family-wide.                                 | Note for master report.                   |

### Phase 2A medium recipes (full code in `raw/2A-simplification.md`)

| #         | Refs       | Summary                                                                                                                                                     |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-SIMP-1  | M-PROJ-1   | `session-context.internal.ts:264` cast → `isValidProcessStatus` type-guard from core. Same recipe for `scope-readiness.internal.ts:164`. Needs core export. |
| M-SIMP-2  | M-PROJ-2   | `requirement-routes.ts:72` `LogicalRouteId` cast → `LogicalRouteIdSchema.parse()` validation.                                                               |
| M-SIMP-3  | M-PROJ-7   | `bundle.internal.ts:57-112` resolve pattern once; hoist out of `buildBundleEntry`.                                                                          |
| M-SIMP-4  | M-PROJ-9   | `parseAndProject` helper signature constrains `schema` via runtime assertion that catchall is `ZodNever`.                                                   |
| M-SIMP-5  | M-PROJ-A-1 | `BlockSchema` discriminated-union + `z.lazy` pattern from `section-block.ts` recipe in core.                                                                |
| M-SIMP-6  | M-PROJ-A-7 | Pick one of `DocumentationTypeMetadata` / `SupportedDocumentationTypeMetadata`.                                                                             |
| M-SIMP-7  | M-PROJ-A-8 | `LogicalRouteId` type + schema + parser collapse via `z.string().pipe(z.transform(...))`.                                                                   |
| M-SIMP-8  | H-PROJ-A-7 | Slug canonicalization — keep `slugForFilename`; delete governance copy + core's `slugify` aliases.                                                          |
| M-SIMP-9  | Sweep      | `parseAndProject` `NO_DEFAULT_RAW_OPTIONS` Symbol sentinel — drop for options-object default.                                                               |
| M-SIMP-10 | Sweep      | `StrictKindTable`'s `Kinds` type parameter should derive from `z.discriminatedUnion` kind-literals so normalizer additions are compile-enforced.            |

## Low (P3)

Phase 2A: regex hoisting in `escapePlainMarkdownText` chain, `Array.from({length})` → `new Array(n)` in Levenshtein (dissolves with core import), `_internal/` → `shared/` promotion of `format-utils.ts`/`slug.ts` for cross-module use.

Phase 2B: triple barrel re-export of `summarizeTaxonomyDigest` already covered as Cleanup-H-PROJ-1; `tests/.DS_Store`/build-artifact gitignore confirmed clean for projection; no `.only`/`.skip`/`.todo`/`xtest`/etc.

## Configuration audit (vs family base configs)

| Setting                         | Projection                                                                                                              | Verdict                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `prepack` location              | scripts ✓                                                                                                               | Correct (only core was broken).                                                       |
| `prepack` command               | `pnpm clean && pnpm build`                                                                                              | Aligned with siblings.                                                                |
| `lint` glob                     | `eslint src tests`                                                                                                      | Aligned.                                                                              |
| `typecheck` scope               | only `tsconfig.test.json`                                                                                               | **Drift** — guard/cli run both. Same as core CL-CORE-11.                              |
| `test` chain                    | `pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts` | **Most disciplined in family.** Misses only the perf-gate wire-up (Cleanup-C-PROJ-1). |
| `package.json:exports`          | 7 subpath exports                                                                                                       | All resolve to real artifacts; no `./roles`-style breakage.                           |
| `eslint` in devDeps             | explicit ✓                                                                                                              | Aligned.                                                                              |
| Test include pattern            | `tests/features/**/*.steps.ts`                                                                                          | Diverges from core's `tests/steps/**`. Pick family convention.                        |
| `vitest.perf-report.config.mjs` | exists                                                                                                                  | Near-duplicate (Cleanup-H-PROJ-2).                                                    |

## Dependency audit verdict

All five family-wide shared deps pinned identically (`zod ^4.1.11`, `vitest ^4.1.4`, `@types/node ^24.12.0`, `typescript ^5.8.2`, `eslint ^9.17.0`). No declared dep is unused in `src/`. No devDep is imported from `src/`. Zero `node:fs`/`node:path` imports in `src/` — **data-layer purity is genuinely held** (projection runs no filesystem or network I/O at runtime, only at test fixture load).

## Files that should not be in `dist/`

| Pattern                                                                      | Count                                    | Action                                                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `dist/**/*.{js,d.ts}.map`                                                    | 290/582 (50%)                            | Same family-wide fix as CL-CORE-3 — disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json`. |
| `dist/projections/documentation-composition/documentation-type-registry.*`   | 4 files (incl. 4-way decomposition)      | Delete file after W-DOCS-1 lands (Cleanup-H-PROJ-3 / H-PROJ-A-9).                                           |
| `dist/projections/documentation-composition/documentation-bundle.internal.*` | 2 files                                  | Reduces with the dual-schema fix (H-PROJ-A-8).                                                              |
| `vitest.perf-report.config.mjs`                                              | (not in dist, but is a maintenance fork) | Collapse (Cleanup-H-PROJ-2).                                                                                |

## Recommended landing order (Phase 2 angle, combined with Phase 1)

1. **Cleanup-C-PROJ-1** (1 line) — wire the perf gate. Reveals the 2.05 ms regression as a CI failure, not silent debt.
2. **H-SIMP-4 (`filterPatterns`) + H-SIMP-3 (`createStatusCounts`)** — mechanical perf-gate fixes; no callers affected.
3. **Cleanup-M-PROJ-1** (~15 LOC audit-script regex) — closes C-PROJ-2 mechanically.
4. **C-PROJ-2 (the outlier itself)** — once the audit catches it, the fix is a 3-line rewrite to use `parseAndProject`.
5. **C-PROJ-1 (Zod 4 `.extend()` strictness)** — 2 files; matches core F4A-H-6 recipe (`z.strictObject({...Shape.shape, ...new})`).
6. **8 in-package duplication consolidations** (H-SIMP-7) — `_shared/` extraction passes.
7. **`pattern-helpers.internal.ts` split** (H-SIMP-9) — depends on core CL-CORE-16/17 landing first.
8. **`projectionBundleSchema<T>` factory** (H-SIMP-2) — closes ~100 LOC across `fragments/base.ts`.
9. **`operational-insights` + `delivery-reporting` per-projection split** (H-SIMP-8).
10. **`render-markdown.ts` 9-file split** (H-SIMP-1) — last; every prior step trims its surface.
11. **`documentation-type-registry.ts` deletion or facade simplification** (Cleanup-H-PROJ-3) — independent.
12. **Sweep cleanups** — slug canonicalization, regex hoisting, `_internal/` → `shared/` promotion, `vitest.perf-report.config.mjs` collapse.

## What's already clean (preserve)

[2A] flagged 5 modules as exemplary: `_shared/filter.ts` (10-line dispatcher; clean composition), `renderers/_shared/dispatch.ts` (`StrictKindTable`/`KindTable` typing), `render-json.ts` (exhaustive defensive validation; reference for JSON serializers), `routing/route-id.ts` (template-literal types + schema + parser in one file; sets the standard despite M-PROJ-A-8 noting the parts could collapse further), `disclosure/spec.ts` (right shape modulo H-PROJ-A-2 layering inversion).

[2B] additions: **`options-schema-barrel-audit.mjs` and `jsdoc-boilerplate-audit.mjs` are the only mechanical surface audits in the family** — promote one or both to workspace-level once the audit scope gap (Cleanup-M-PROJ-1) is closed. The `parseAndProject` + `parseAtBoundary` shared helper is the doctrine reference for the family.

## Critical context for Phase 3

- **Tests against the real perf baseline exist** — projection has `tests/perf/baselines/business-rule-set.baseline.json` and a comparator. Phase 3 test review should NOT recommend adding a perf gate; it should verify the wire-up after Cleanup-C-PROJ-1 lands.
- **`.sisyphus/evidence/task-3-business-rule-set-perf-report.json` is regenerated by every `pnpm test` run** — useful operational signal, even pre-wire-up.
- **Audit-script gap (Cleanup-M-PROJ-1)** is the right model for catching C-PROJ-2 and similar outliers — Phase 3 should note that audit-script extension is itself a test surface.
- **`tests/features/perf/` vs `tests/perf/`** — perf scenarios live in two directories. Phase 3 should clarify whether one is the gate driver and the other is the report generator, or whether they overlap.
