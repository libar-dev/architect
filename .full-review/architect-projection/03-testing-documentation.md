# architect-projection — Phase 3 Consolidated: Testing & Documentation

**Sources:** `raw/3A-test-coverage.md` + `raw/3B-documentation.md`. Findings tagged **[3A]**, **[3B]**, or **[3A+3B]**.

## Executive Summary

`architect-projection`'s test suite is **the most disciplined in the family by every measurable standard**: every subdomain has full-behavior + smoke features, parametric `renderer-smoke.feature` fires all four renderers against 39 of the 47 fragment kinds, and `render-markdown.ts`'s security paths assert 22 distinct hostile link inputs individually (entity-encoding, control characters, path traversal, percent-encoded bypass forms). `jsdoc-boilerplate-audit.mjs` passes — the boilerplate "When to Use" problem (core DOC-H-3) does NOT recur here. `@architect-pattern` annotation coverage is **87 of 145 files = 60%, more than 2× core's 26%**.

Documentation, however, has **two outright falsehoods and one compilation error**:

1. **The README's quickstart example doesn't compile.** `README.md:29` constructs `ProjectionContext` as `{ graph }`, but `ProjectionContext.packageResolver` is a required (non-optional) field at `src/context/projection-context.ts:35`. Any consumer copying the example gets a TS2322. Both examples in the README repeat the mistake.
2. **`docs/MIGRATION.md:62` claims "The projection perf gate is now live in CI."** Phase 2B established this is false — the gate is implemented but unwired. `docs/PERF.md` correctly documents a local-only procedure. The two documents contradict each other.
3. **`README.md:74-75` claims "Renderers cannot import `PatternGraph` or `ProjectionContext`. They operate on `Fragment`s only."** But `render-markdown.ts:39` imports `summarizeTaxonomyDigest` from the fragments runtime layer (Phase 1 H-PROJ-A-3), and the `MARKDOWN_NORMALIZERS` table at `:208-219` has 10 fragment-kind-specific normalizer entries (Phase 1 H-PROJ-A-1). The README's absolute claim does not match the code — this is the documentation expression of the ADR-005 Rule 5 violation.

Plus one **inventory drift**: the fragment-schema discriminated union has 43 members (scope said "47" — the scope was slightly off, but more importantly the `ddd-inventory.md` catalog has only 41 entries with **9 fragment kinds existing on disk and in the union but absent from the inventory**: `business-rule-reference`, `open-question-list`, `dependency-edge-set`, `architecture-comparison`, `architecture-context`, `orphan-pattern-list`, `pattern-bundle-entry`, `role-profile-collection`, `source-inventory-digest`. The doc is silently out of date.

Three Highest-risk test gaps:

1. **3 fragment kinds excluded from parametric gates** — `RoadmapTimeline`, `PatternBundleEntry`, `BusinessRuleReference` are absent from `fragment-schemas.feature` (parse/round-trip) AND `renderer-smoke.feature` (all-four-renderers). `BusinessRuleReference` has a valid fixture but isn't in the `PublicFragmentKind` union the parametric runners consume. A silent schema field deletion on any of these three goes undetected.
2. **Perf gate correct but unwired** (compounds Cleanup-C-PROJ-1) — comparator is mechanically sound: reads committed baseline, applies `min(hardBudget, baseline × 1.5)` across 26 metrics, sets `process.exitCode = 1` on failure. But `pnpm test` never invokes it. Additional sequencing issue: the perf-report writer runs under `vitest.perf-report.config.mjs`, not `vitest.config.ts`, so running the comparator without first generating the report file throws `Unable to read perf report` immediately. Current baseline (`project.avgMs = 0.544 ms`) passes, but the 2.05 ms regression Phase 2B caught would have failed — **the gate is guarding an already-regressed state in a never-fail mode**.
3. **`parseAndProjectOpenQuestionList` trust boundary untested** (compounds Phase 1 C-PROJ-2) — the lone outlier that bypasses the shared `parseAndProject` wrapper has no test that confirms invalid `rawOptions` are rejected. The 14 sibling entrypoints all have option-rejection scenarios.

## Critical (P0)

### TD-PROJ-1. README quickstart example doesn't compile **[3B]**

`packages/architect-projection/README.md:29` and the second example a few lines below both construct `ProjectionContext` as `{ graph }`. The type is `{ graph; packageResolver; }` (no optional marker on `packageResolver`) per `src/context/projection-context.ts:35`. **Any TypeScript consumer following the quickstart gets `TS2322` immediately.**

**Recipe:** correct both examples to `const context: ProjectionContext = { graph, packageResolver: createPackageResolver(...) };` and import `createPackageResolver` from `@libar-dev/architect-core`. While there, weaken or strengthen the "graph only" claim consistent with reality (see TD-PROJ-3).

### TD-PROJ-2. `docs/MIGRATION.md:62` falsely claims CI gate is live **[3B]** (compounds Cleanup-C-PROJ-1)

The doc says: "The projection perf gate is now live in CI." Phase 2B confirmed the gate is implemented but unwired. `docs/PERF.md` describes a local two-step procedure. Two source-of-truth documents in the same `docs/` directory contradict each other on a load-bearing operational fact.

**Recipe:** correct MIGRATION.md, OR land Cleanup-C-PROJ-1 (wire the gate in `package.json:65`) — preferred. Then the MIGRATION.md statement becomes accurate.

### TD-PROJ-3. README's "renderers operate on Fragments only" contradicts code **[3B]** (documentation expression of Phase 1 H-PROJ-A-1)

`README.md:74-75` makes an absolute claim. `render-markdown.ts:39` imports `summarizeTaxonomyDigest` from the fragments runtime layer. `render-markdown.ts:208-219` has 10 fragment-kind-specific normalizer entries. The README's claim is the ADR-005 Rule 5 guarantee — and the code violates it.

**Recipe:** either land H-PROJ-A-1 (move per-fragment composition out of renderer) and the README claim becomes true, OR rewrite the README's "renderers operate on Fragments only" to acknowledge the current fragment-aware shape. The current state is doctrinally wrong AND documented wrong — **the documentation expression is more damaging because it's what consumers read**.

## High (P1)

### Test coverage gaps

| # | Source | Issue | Recipe |
|---|--------|-------|--------|
| TC-PROJ-H-1 | 3A | 3 fragment kinds (`RoadmapTimeline`, `PatternBundleEntry`, `BusinessRuleReference`) excluded from both `fragment-schemas.feature` and `renderer-smoke.feature` | Add the three kinds to `PublicFragmentKind` union; `BusinessRuleReference` has a valid fixture that needs to be referenced. |
| TC-PROJ-H-2 | 3A | Perf gate correct but unwired + sequencing issue (perf-report writer runs under different vitest config than the comparator reads) | Cleanup-C-PROJ-1 wires the gate; also resolve Cleanup-H-PROJ-2 (collapse `vitest.perf-report.config.mjs`) for clean sequencing. |
| TC-PROJ-H-3 | 3A | `parseAndProjectOpenQuestionList` trust-boundary untested — no scenario confirms invalid options are rejected | Add an option-rejection scenario after C-PROJ-2 is fixed (when the function routes through `parseAndProject`); the existing pattern from sibling features applies. |

### Documentation gaps

| # | Source | Issue |
|---|--------|-------|
| DOC-PROJ-H-1 | 3B | **`ddd-inventory.md` has 41 of 43 fragment kinds — 9 absent on disk** (some entries in the inventory cover supporting/base files, but 9 distinct fragment files exist in the discriminated union without inventory entries): `business-rule-reference`, `open-question-list`, `dependency-edge-set`, `architecture-comparison`, `architecture-context`, `orphan-pattern-list`, `pattern-bundle-entry`, `role-profile-collection`, `source-inventory-digest`. **Recipe:** regenerate or add the 9 entries; ideally automate via a script extracting from `FragmentKind` union. |
| DOC-PROJ-H-2 | 3B | 23 non-internal, non-barrel files have public exports without `@architect-pattern` annotation — invisible to PatternGraph and generated docs. Most load-bearing: `blocks/schema.ts` (entire Block hierarchy), `context/projection-context.ts` (`ProjectionContext` itself), `routing/route-id.ts` (route ID contract), `projections/errors.ts` (public error surface — confirms L-PROJ-A-5), `projections/_shared/filter.ts`. **Recipe:** add `@architect-pattern` module blocks. |
| DOC-PROJ-H-3 | 3B | README has no section telling `cli`/`mcp` consumers what NOT to import. `_internal/` directory vs `.internal.ts` suffix conventions are mentioned only obliquely in lint rule descriptions. **Recipe:** add an "Internal vs. public API" section to README. |
| DOC-PROJ-H-4 | 3B | ADR-005, ADR-006, ADR-009 referenced by name in README and MIGRATION.md but **no link** to actual `architect/decisions/*.feature` files. **Recipe:** add `[ADR-005]: ../../architect/decisions/ADR005CodecRendererSeparation.feature` references at end of README. |

## Medium (P2)

| # | Source | Issue |
|---|--------|-------|
| TC-PROJ-M-1 | 3A | Perf gate metric gaps — `filterPatterns` allocation (H-PROJ-Q-6, 14 hot-call-sites) has no named metric; `RequirementDigest` markdown rendering has no `renderMarkdownBundles` entry; no `p99`/`maxMs` check (comparator uses `avgMs` only, so a spike with low average passes silently). |
| TC-PROJ-M-2 | 3A | Test residue: `tests/.DS_Store` and `src/.DS_Store` are committed. Add to `.gitignore`. |
| TC-PROJ-M-3 | 3A | `vitest.perf-report.config.mjs` near-duplicates `vitest.config.ts` — fold (Cleanup-H-PROJ-2). The sequencing issue in TC-PROJ-H-2 dissolves when this lands. |
| DOC-PROJ-M-1 | 3B | `summarizeTaxonomyDigest` documented as fragments-side (per re-export) but runtime helper — H-PROJ-A-3 fix repositions both code and docs. |
| DOC-PROJ-M-2 | 3B | `docs/MIGRATION.md` is a v1 codec→projection mapping document but doesn't note which v1 codec symbols are now deleted vs renamed. |
| DOC-PROJ-M-3 | 3B | `docs/PERF.md` opening sentence calls the gate "CI gate" then describes a local procedure — internally contradictory. Rewrite once C-PROJ-1 lands. |
| DOC-PROJ-M-4 | 3B | The renderer trust-boundary code paths (`sanitizeMarkdownLinkTarget`, `normalizeRoutedOutputPath`, `escapePlainMarkdownText`) are well-tested but the *security invariants* are not documented anywhere except as code comments. The README acknowledges them at a high level but doesn't catalog them (I3 is named once without explanation). |

## Architect State coverage (annotation rate) [3B]

| Area | Coverage | Notes |
|------|----------|-------|
| Overall | 87/145 = 60% | More than 2× core's 26%. |
| `.internal.ts` files | unannotated by convention | ~27 files; expected. |
| Barrel `index.ts` files | unannotated | ~12 files; expected. |
| Public-export files without annotation | 23 files | The 23 above include the load-bearing primitives (Block schema, ProjectionContext, RouteId, errors, filter). |

## Perf-gate verdict (consolidated)

**The gate is real but never fires.** Phase 2B confirmed implementation exists; Phase 3A confirmed comparator logic is correct (`min(hardBudget, baseline × 1.5)` across 26 metrics, `process.exitCode = 1` on failure). Two outstanding issues beyond the wire-up:

1. **Sequencing.** Perf-report writer runs under `vitest.perf-report.config.mjs`; comparator reads what that writer produces. Running the comparator without first running the writer throws `Unable to read perf report`. Cleanup-H-PROJ-2 (collapse the configs) resolves this.
2. **Coverage gaps in the baseline.** Three signals not captured: `filterPatterns` allocation, `RequirementDigest` rendering, `p99/max` (only `avgMs` checked). Worth a follow-up after the gate is live.

When wired AND `filterPatterns` (H-PROJ-Q-6) lands, projection has a real, self-defending perf budget that protects against H-CORE-8 regression upstream.

## Test residue cleanup [3A]

| Item | Recipe |
|------|--------|
| `tests/.DS_Store`, `src/.DS_Store` | Remove from git; add to `.gitignore`. |
| `vitest.perf-report.config.mjs` | Fold into `vitest.config.ts` per Cleanup-H-PROJ-2; eliminates sequencing issue (TC-PROJ-H-2). |
| `tests/perf/baselines/business-rule-set.baseline.json` | Keep — this is the real baseline. Regenerate after H-CORE-8 fix lands; pin updated values. |
| `tests/perf/compare-baseline.mjs` | Keep — the real gate. Wire into test script. |
| `.sisyphus/evidence/` | Operational artifact; cleanup convention should be documented or scoped (Phase 2 Cleanup M-PROJ-Cleanup-4). |

## What's well-tested (preserve)

[3A] flagged 3 modules as reference quality:

1. **`render-markdown.ts` security paths** — 22 hostile link inputs individually asserted (entity-encoding, control characters, path traversal, percent-encoded bypass). The trust-boundary firewall test suite is the **strongest in the family** and a reference for any future security-critical code path elsewhere in the codebase.
2. **`business-rules.feature`** — `filterPatterns` called directly in step code to verify filter semantics independent of the projection pipeline. Demonstrates how to test cross-cutting helpers without over-mocking.
3. **`operational-insights/reporting.feature`** — 3 scenarios specifically for duplicate feature-name scoping. Tests a correctness invariant that would be invisible in any smoke check.

## Cross-package implications

1. **The README's broken example example** (TD-PROJ-1) is also a regression-test gap — there's no compile-time test that exercises the README's code. Recommend a `tests/features/readme-examples.feature` that copies each example block verbatim and asserts compilation + runtime success. Same recommendation should apply to core (which has CL-CORE-7 README rot from a different angle).
2. **Annotation coverage 60% vs core's 26%** — projection demonstrates that disciplined documentation is achievable in this codebase. Worth promoting to master report.
3. **`jsdoc-boilerplate-audit.mjs` is the right mechanism to ban the core DOC-H-3 boilerplate.** Promote to family-wide once consolidated into a workspace-level audit script.
4. **Test residue** — `.DS_Store` in `tests/` is also in core (TC-L-5). Repo-level `.gitignore` should catch it.

## Critical context for Phase 4

- **Perf gate compatibility with CI** — Phase 4 (CI/DevOps) should treat the perf-gate wire-up (Cleanup-C-PROJ-1) as a P0 because CI absence (core CI-1/CI-2) means even a wired gate runs only locally until `.github/workflows/` exists.
- **The `jsdoc-boilerplate-audit.mjs` and `options-schema-barrel-audit.mjs` scripts** in this package's `scripts/` directory are the **only mechanical surface audits in the family**. Phase 4 should consider promoting both to workspace-level.
- **Documentation-as-source** — the README falsehoods and the MIGRATION.md/PERF.md contradiction suggest documentation is hand-maintained and drifts. Phase 4 should consider whether a doc-regeneration step (similar to the family's `docs:all` script that consumes the PatternGraph) should cover the package-level READMEs too.
- **`@architect-pattern` annotation rate 60%** is a meaningful threshold but lacks an enforcement mechanism. Consider extending one of the audit scripts to fail on un-annotated public-export files outside of barrels/internals.
