# `@libar-dev/architect-projection` — Consolidated Review Report

**Package:** `@libar-dev/architect-projection@2.0.0-pre.1`
**Path:** `/Users/darkomijic/dev-projects/architect/packages/architect-projection/`
**Size:** 145 source files, ~15,238 SLOC, 83 test files, 1 perf fixture + comparator + committed baseline.
**Role:** Fragment/Projection/Renderer pipeline; depends on architect-core; consumed by architect-mcp and downstream tooling.
**Source phases:** `01-quality-architecture.md`, `02-simplification-cleanup.md`, `03-testing-documentation.md`, `04-best-practices.md`. Raw outputs from 8 agents in `./raw/`.

## Executive Summary

**`architect-projection` is the family's doctrine reference.** It demonstrates concretely that the engineering posture core preaches is achievable: 107 `z.strictObject` sites and zero open `z.object`; zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`/`void X`/`console.*`/`as unknown as` in `src/`; the only `parseAtBoundary` consumer in the workspace (closing the gap core's TD-CORE-1 left open); `TRUSTED_MARKDOWN` correctly module-private with 5-AST-selector lint enforcement; 60% `@architect-pattern` annotation coverage (vs core's 26%); two custom audit scripts (`options-schema-barrel-audit.mjs`, `jsdoc-boilerplate-audit.mjs`) that are the only mechanical surface audits in the family; and a real `min(hardBudget, baseline × 1.5)` perf gate over 26 metrics with a committed baseline.

The findings divide into two classes:

**Class A — implementation gaps in projection's own surface (5 Critical, 12 High):**

1. **C-PROJ-1 (Zod 4 `.extend()`/`.omit()` strictness loss) — Phase 4A sharpened.** Phase 1 caught `.extend()` at `pattern-detail.ts:24` and `supporting.ts:54-58`. Phase 4A traced the chain upstream: **`.omit()` at `pattern-summary.ts:28` strips strictness one step earlier.** Zod 4 reset `unknownKeys: 'strip'` on `extend`/`omit`/`pick`/`partial`/`required`. Compounded loss feeds the most-consumed fragment (`PatternDetailSchema`).
2. **C-PROJ-2 (one projection bypasses `parseAndProject` wrapper).** `parseAndProjectOpenQuestionList` at `open-question-list.ts:38` calls `OptionsSchema.parse()` directly and throws raw `ZodError` instead of `BoundaryParseError`. The 14 sibling entrypoints route through the shared helper. The custom audit script `options-schema-barrel-audit.mjs` would have caught this with a ~15-LOC regex extension.
3. **C-PROJ-3 sharpened (Phase 2 + Phase 3 confirmed): perf gate exists but is unwired.** `tests/perf/compare-baseline.mjs` is mechanically sound (26 budgets, committed baseline, correct comparator), but `package.json:65` never invokes it. Phase 2B observed a 2.05 ms regression in the evidence file; Phase 3A confirmed the current measurement passes (0.544 ms). **One-line fix activates a real CI gate.**
4. **TD-PROJ-1: README usage example doesn't compile.** `ProjectionContext.packageResolver` is a required field; the quickstart constructs `{ graph }` only. Any TypeScript consumer following the README gets `TS2322`.
5. **TD-PROJ-2 + TD-PROJ-3: README/docs contain two outright falsehoods.** `docs/MIGRATION.md:62` claims "perf gate is now live in CI" (it isn't). README claims "Renderers cannot import `PatternGraph` or `ProjectionContext`. They operate on `Fragment`s only" — contradicted by `render-markdown.ts:39` importing `summarizeTaxonomyDigest` from the fragments runtime layer and 10 fragment-kind-specific normalizers (ADR-005 Rule 5 violation).

**Class B — structural debt in load-bearing modules (10 High):**

- `render-markdown.ts` at 2,227 LOC mixing 8 concerns + 10 fragment-aware normalizers (H-PROJ-A-1, A-5) — codec-agnostic violation.
- `BundleRouting`/`ProjectionBundle<T>` hand-written interfaces, not `z.infer` (H-PROJ-A-4) — projection's analogue of core's `PatternGraph` drift.
- `ProjectionContext` hand-written interface (H-PROJ-F-2).
- `disclosure/spec.ts:9` imports `ProjectionFilterSchema` from `projections/_shared/filter.ts` (H-PROJ-A-2) — layering inversion making the supposed-primitive layer drag application code.
- `summarizeTaxonomyDigest` is a runtime helper inside `fragments/` contracts layer (H-PROJ-A-3); triple barrel re-export (Cleanup-H-PROJ-1).
- `documentation-type-registry.ts` (174-LOC Proxy facade) is a self-described "campaign deletion target" — replace with `let cached; export function getRegistry()` or land W-DOCS-1 (H-PROJ-A-9).
- `operational-insights/index.ts` 1,200 LOC + `delivery-reporting/index.ts` 742 LOC (M-PROJ-A-4) — single-file overloads not matching the sibling per-`project*` convention.
- `pattern-helpers.internal.ts` 515 LOC, 13 exports, 7 unrelated concerns (M-PROJ-A-3).
- Triple-duplicated slug functions producing **cross-renderer parity defects** (H-PROJ-A-7) — `slugForFilename` vs `slugify` produce different anchors in markdown vs UI output for the same pattern.
- `MARKDOWN_NORMALIZERS` covers only 10 of 43 fragment kinds; the type system doesn't say which 10 are first-class vs generic-fallback (H-PROJ-F-1).

Cross-package confirmations from core: **CL-CORE-16/17** (fuzzy-match + extractFirstSentenceRaw duplicates in `pattern-helpers.internal.ts:432-514, :274-286`), **F4A-H-6 + the omit() compound** (Zod 4 strictness-loss), **H-CORE-8 downstream** (`filterPatterns` defensive copy is the projection-side analogue), **C-CORE-5 pattern** (`Set.has` cast issues at 3 sites — needs core to export `isProcessStatusValue`).

## Findings by Priority

### Critical (P0)

| ID | Title | Locations |
|----|-------|-----------|
| C-PROJ-1 + CP4A-Sharpened-1 | Zod 4 strict-loss chain: `.omit() → .extend()` through PatternDetail | `pattern-summary.ts:28`, `pattern-detail.ts:24`, `supporting.ts:54-58` |
| C-PROJ-2 | `parseAndProjectOpenQuestionList` bypasses shared trust-boundary wrapper | `pattern-relations/open-question-list.ts:38` |
| C-PROJ-3 + Cleanup-C-PROJ-1 | Perf gate fully implemented but unwired | `package.json:65`, `tests/perf/compare-baseline.mjs`, `tests/perf/baselines/business-rule-set.baseline.json` |
| TD-PROJ-1 | README quickstart fails to compile | `README.md:29` (missing required `packageResolver`) |
| TD-PROJ-2 + TD-PROJ-3 | Documentation falsehoods: "perf gate live in CI" + "renderers operate on Fragments only" | `docs/MIGRATION.md:62`, `README.md:74-75` |

### High (P1) — 22 items

**Architecture (10 — from Phase 1 1B):**

| ID | Title |
|----|-------|
| H-PROJ-A-1 | Renderer not codec-agnostic (ADR-005 Rule 5 violation) — 10 fragment-kind normalizers + `summarizeTaxonomyDigest` import in `render-markdown.ts` |
| H-PROJ-A-2 | `disclosure/spec.ts:9` imports `ProjectionFilterSchema` from `projections/_shared/filter.ts` — layering inversion |
| H-PROJ-A-3 | `summarizeTaxonomyDigest` is a runtime helper inside fragments contracts layer |
| H-PROJ-A-4 | `BundleRouting`/`ProjectionBundle<T>` hand-written interfaces, not `z.infer` |
| H-PROJ-A-5 | `render-markdown.ts` 2,227 LOC mixing 8 concerns |
| H-PROJ-A-6 | Duplicates of `architect-core` utils (CL-CORE-16/17 confirmed at `_shared/pattern-helpers.internal.ts:432-514` + `:274-286`) |
| H-PROJ-A-7 | Triple-duplicated slug functions — cross-renderer parity defect |
| H-PROJ-A-8 | Dual schema for `ProjectDocumentationBundleOptions` |
| H-PROJ-A-9 | `documentation-type-registry.ts` Proxy facade — self-described deletion target |
| H-PROJ-A-10 | `summarizeTaxonomyDigest` re-exported through both `fragments/` and `projections/` barrels |

**Code quality (8 — from Phase 1 1A):**

| ID | Title |
|----|-------|
| H-PROJ-Q-2 | `parseBusinessRuleAnnotations` + `deduplicateScenarioNames` duplicated; both on perf-gate path; already drifted |
| H-PROJ-Q-3 | `getPatternName` exists 3 times within projection |
| H-PROJ-Q-4 | `createStatusCounts` duplicated + 4-pass filter on perf-gate hot path |
| H-PROJ-Q-5 | Renderer tabular helpers duplicated verbatim between markdown + UI |
| H-PROJ-Q-6 | `filterPatterns` unconditional `[...patterns]` copy on no-filter path; 14 hot call sites; projection-side analogue of H-CORE-8 |
| H-PROJ-Q-7 | Two error styles: 16 raw `Error` vs 9 typed `ProjectionError` with discriminated codes |

**Cleanup + tests + docs + language (additive):**

| ID | Title |
|----|-------|
| Cleanup-H-PROJ-1 | Triple barrel re-export of `summarizeTaxonomyDigest` (extends H-PROJ-A-10) |
| Cleanup-H-PROJ-2 | `vitest.perf-report.config.mjs` near-duplicates `vitest.config.ts` |
| Cleanup-H-PROJ-3 | `documentation-type-registry.ts` Proxy facade (174 LOC) for 12-entry static registry — extends H-PROJ-A-9 |
| TC-PROJ-H-1 | 3 fragment kinds excluded from parametric gates (`RoadmapTimeline`, `PatternBundleEntry`, `BusinessRuleReference`) |
| TC-PROJ-H-2 | Perf gate sequencing issue (perf-report writer under different vitest config than comparator reads) |
| TC-PROJ-H-3 | `parseAndProjectOpenQuestionList` trust-boundary path untested (compounds C-PROJ-2) |
| DOC-PROJ-H-1 | `ddd-inventory.md` missing 9 fragment kinds present in `FragmentSchema` |
| DOC-PROJ-H-2 | 23 non-internal, non-barrel files have public exports without `@architect-pattern` (most load-bearing: `blocks/schema.ts`, `context/projection-context.ts`, `routing/route-id.ts`, `projections/errors.ts`, `_shared/filter.ts`) |
| H-PROJ-F-1 | `StrictKindTable.Kinds` hand-typed subset — `MarkdownNormalizerKind` 10 of 43 kinds, no compile-time exhaustiveness |
| H-PROJ-F-2 | `ProjectionContext` hand-written interface — projection's analogue of core's `PatternGraph` drift |

### Medium (P2) — abbreviated

Phase 1: 10 (1A) + 10 (1B); Phase 2: 17 simplification recipes + 6 cleanup; Phase 3: 4 tests + 7 docs; Phase 4: 7 language + 3 CI. Highlights: dependency-tree Set-clone-per-frame (M-PROJ-3); `patternSatisfiesTag` 24-case switch (M-PROJ-8); `parseAndProject` doesn't constrain `schema` to strict object (M-PROJ-9); 4 step files missing `AfterEachScenario` (TC-M-6); audit-script gap not catching `parseAndProject*` outliers (M-PROJ-Cleanup-1).

### Low (P3) — abbreviated

Combined ~35 items across all 4 phases. Mostly regex hoisting, fix small TS idiom slips, `.DS_Store` cleanup, alias consolidation, stale changeset entries.

## Action plan — ordered by leverage and dependency

### Sweep 1: Wire automation (1-2 hours)

1. **Cleanup-C-PROJ-1** (1 line) — wire perf gate in `package.json:65`.
2. **Cleanup-H-PROJ-2** (~20 LOC) — collapse `vitest.perf-report.config.mjs` into `vitest.config.ts`. Resolves TC-PROJ-H-2 sequencing.
3. **`options-schema-barrel-audit.mjs` extension** (~15 LOC) — verifies every `parseAndProject*` body routes through the shared helper. Catches C-PROJ-2 mechanically.
4. **Add `tests/.DS_Store` + `src/.DS_Store` to `.gitignore`**; delete from git.

### Sweep 2: Zod 4 strict-chain fix (1-2 hours, ~20 LOC)

5. **C-PROJ-1 + CP4A-Sharpened-1** — `z.strictObject({ ...Base.shape, ... })` recipe at `pattern-summary.ts:28`, `pattern-detail.ts:24`, `supporting.ts:54-58`. Add a `parseAtBoundary(PatternDetailSchema, { ...valid, extraField })` regression test.
6. **C-PROJ-2** — rewrite `parseAndProjectOpenQuestionList` to use `parseAndProject()` wrapper (3-line change). Audit script from step 3 now keeps it from recurring.

### Sweep 3: Documentation truth (1 hour)

7. **TD-PROJ-1** — correct README quickstart to include `packageResolver`.
8. **TD-PROJ-2** — either land Sweep 1 step 1 first (making MIGRATION.md true) or rewrite MIGRATION.md.
9. **TD-PROJ-3** — either land H-PROJ-A-1 (move per-fragment composition out of renderer) and the README claim becomes true; OR rewrite the README to acknowledge fragment-aware renderer shape. Update ADR-005 if option 2.
10. **DOC-PROJ-H-1** — regenerate or add 9 missing `ddd-inventory.md` entries; ideally automate via script extracting from `FragmentKind` union.

### Sweep 4: In-package consolidation (1-2 days)

11. **H-PROJ-Q-2 through H-PROJ-Q-5** — 8 duplications consolidated into `_shared/` files (status-counts, business-rule-annotations, getPatternName, renderers/_shared/tabular, renderers/_shared/primitives).
12. **H-PROJ-Q-6** — `filterPatterns` no-copy. After landing, re-baseline perf gate.
13. **H-PROJ-A-7** — slug canonicalization. Pick `slugForFilename`; delete others. Fixes cross-renderer parity defect.

### Sweep 5: Module restructuring (1 week-ish)

14. **M-PROJ-A-4** — split `operational-insights/index.ts` (1,200 LOC) and `delivery-reporting/index.ts` (742 LOC) per-`project*` matching sibling convention.
15. **M-PROJ-A-3** — split `pattern-helpers.internal.ts` (515 LOC) by concern. Drop fuzzy-match + extractFirstSentenceRaw after core CL-CORE-16/17 lands.
16. **H-PROJ-A-4** — `projectionBundleSchema<T>(fragmentSchema)` factory; derive `BundleRouting`/`ProjectionBundle` via `z.infer`. ~100 LOC drop in `fragments/base.ts`.
17. **H-PROJ-A-5** — 9-file split of `render-markdown.ts`. Mechanical, no semantic change.
18. **H-PROJ-A-1** — move per-fragment composition out of renderer (closes ADR-005 Rule 5).

### Sweep 6: Cross-package cleanup (after core fixes land)

19. **CL-CORE-16/17 confirmation** — delete `fuzzy-match` + `extractFirstSentenceRaw` from projection after core's canonical implementations land.
20. **C-CORE-5 sweep** — drop 3 `Set.has` cast sites in projection after core exports `isProcessStatusValue` (M-PROJ-1, M-PROJ-F-4).
21. **H-PROJ-A-3** — move `summarizeTaxonomyDigest` to projections; delete from fragments. Resolves Cleanup-H-PROJ-1 + H-PROJ-A-10 + DOC-PROJ-M-1.

### Sweep 7: Family-wide normalization (master report)

22. **CL-CORE-3** — disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json` (family-wide; halves projection's tarball 582 → ~290 files).
23. **CL-CORE-10/11 (family-wide)** — align `typecheck` to cover both configs.
24. **Audit-script promotion** — `jsdoc-boilerplate-audit.mjs` + `options-schema-barrel-audit.mjs` workspace-level.
25. **CI workflows** — `.github/workflows/{ci,publish}.yml` family-wide.
26. **Provenance attestation** — once publish workflow exists, `publishConfig.provenance: true` becomes real.

## What's healthy (preserve)

- **`parseAndProject` + `parseAtBoundary` chain** — projection is the live consumer giving core's helper test coverage.
- **`renderJson` defensive validation** — exhaustive rejection of unsafe values with JSON path in every error. Family reference for serializers.
- **`sanitizeMarkdownLinkTarget` + `normalizeRoutedOutputPath`** — defense-in-depth done right. The 22-hostile-input test fixture is the strongest security test suite in the family.
- **`TRUSTED_MARKDOWN` firewall** — module-private, 5-AST-selector lint enforcement.
- **`FragmentSchema` discriminated union** — 43 kinds in one `z.discriminatedUnion`.
- **`StrictKindTable<Out, Options, Kinds>`** — compile-time exhaustive dispatch (needs H-PROJ-F-1 fix to be fully self-enforcing).
- **`options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs`** — only mechanical surface audits in the family. Promote.
- **6-subdomain partition** — real and observable across `fragments/`, `projections/`, disclosure tagging.
- **`DependencyTreeNodeSchema = z.ZodType<...>: z.strictObject({...z.lazy(...)})`** — correct Zod 4 recursive idiom.
- **`as const satisfies T` discipline** + 147 `import type` declarations + zero `node:` unprefixed legacy imports — ESM hygiene reference.
- **107 `z.strictObject` callsites; zero `z.object`; zero suppressions; zero `as unknown as`; zero `console.*` in src.** Family reference for doctrine adherence.
- **`@architect-pattern` annotation rate 60%** — 2× core's.
- **Real `min(hard, baseline × 1.5)` perf gate over 26 metrics with committed baseline.** Just needs wiring.

## Cross-package implications for master report

1. **Projection is the family reference for TS/Zod 4 idioms** — master report should explicitly recommend cross-package promotion of `parseAndProject`/`parseAtBoundary` pattern, `StrictKindTable`, `renderJson` defensive validation, `as const satisfies` discipline.
2. **The Zod 4 `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` strictness-loss bug is family-wide.** Master report should propose a single audit script scanning all packages (~15 LOC).
3. **The audit-script promotion opportunity** — 4 of 5 packages lack the surface audits projection has.
4. **`validateTransition`/`fuzzy-match`/`extractFirstSentenceRaw` duplications** — core CL-CORE-16/17 closes from one direction; projection from the other.
5. **`MCP` consumer impact** — when MCP review runs, expect projection's `parseAndProjectOpenQuestionList` (C-PROJ-2) error-shape inconsistency to surface as MCP-side handling debt.
6. **Cross-renderer slug parity defect (H-PROJ-A-7)** is the bite-waiting-to-happen — same pattern produces different anchors in markdown vs UI. Could surface as user-reported "broken link" issue.
7. **`MarkdownNormalizerKind` not exhaustive (H-PROJ-F-1)** is the kind of finding that bites silently — a future fragment addition won't break the build, just silently falls through to generic-fragment normalizer.

## Numbers

- **Findings logged:** 5 Critical + 22 High + ~40 Medium + ~35 Low.
- **Cross-cutting recipes** closing multiple findings: 8 (Zod 4 strict-chain sweep, audit-script extension, render-markdown.ts split, slug canonicalization, deletion of dead Proxy facade, in-package duplication consolidation, family-wide tsconfig fix).
- **Estimated tarball reduction:** 582 → ~290 files after CL-CORE-3 disable maps.
- **Estimated perf budget headroom after H-PROJ-Q-6:** another 5-15% on top of current 64% margin.
- **Test fixtures to add:** 3 fragment kinds added to parametric gates; option-rejection scenario for `parseAndProjectOpenQuestionList`.

## Overall verdict

`architect-projection` is **the disciplined exemplar of the family's engineering doctrine**. The findings are not breaches of doctrine but **gaps in completion** — wiring the gate that exists, fixing the Zod 4 strictness-chain that's a family-wide library bug, correcting the README so the example compiles, eliminating in-package duplication, and bringing the codec-agnostic renderer claim back into doctrine (or updating the doctrine).

Compared to core, **the priority distribution is inverted**: core has 7 Critical / 37 High / ~25 Medium reflecting widespread doctrine inconsistency. Projection has 5 Critical / 22 High but **none of the Criticals are doctrine breaches** — they're operational gaps (perf-gate wire-up, broken README example, docs falsehoods) and one Zod 4 library-bug case study. The package is in good shape for stable release once Sweeps 1-3 land (estimated 1-2 days of focused work).

The most pressing structural finding crosses package boundaries: **the perf gate is the only enforced quality measurement in the family.** Wiring it AND landing core's H-CORE-8 in lockstep is the highest-leverage move for the family's release-readiness story.
