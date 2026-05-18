# architect-projection — Phase 3A: Test Coverage & Quality

**Sources examined:** 83 test files, 37 feature files, `tests/perf/compare-baseline.mjs`, `tests/perf/baselines/business-rule-set.baseline.json`, `scripts/options-schema-barrel-audit.mjs`, `scripts/jsdoc-boilerplate-audit.mjs`, `vitest.config.ts`, `vitest.perf-report.config.mjs`, relevant `src/` modules.

---

## 1. Executive Summary

The test posture is among the strongest in the family. The BDD coverage is broad and intentional: every subdomain has at least one full-behavior feature plus a smoke feature, the renderer-smoke outline parametrically fires all four renderers against 39 of the 47 fragment kinds, and the security property coverage of `render-markdown.ts` is exceptional. Three risks remain material.

**Risk 1 — Perf gate unwired.** `tests/perf/compare-baseline.mjs` is a correctly implemented comparator — it reads the committed baseline, applies `min(hardBudget, baseline × 1.5)` across 26 metrics, and exits non-zero — but `pnpm test` never invokes it. The current baseline (`project.avgMs = 0.544 ms`) puts the gate well below budget, so wiring is low-risk right now. That margin could shrink quickly as H-SIMP-3/4 candidates (Phase 2) land; without the gate in CI the regression from Phase 2's evidence file (`2.05 ms`) would repeat silently.

**Risk 2 — `parseAndProjectOpenQuestionList` is the lone `parseAndProject*` function that bypasses the shared `parseAndProject` factory and is not tested at its trust boundary.** All 14 other `parseAndProject*` entrypoints have at least one test exercising option-validation rejection. `parseAndProjectOpenQuestionList` calls `OpenQuestionListOptionsSchema.parse()` directly and has no test confirming it rejects invalid options (e.g., an unknown parent name passed as a raw unknown).

**Risk 3 — Three fragment kinds excluded from every parametric gate.** `RoadmapTimeline`, `PatternBundleEntry`, and `BusinessRuleReference` are absent from both `fragment-schemas.feature` (parse/round-trip) and `renderer-smoke.feature` (all-four-renderers check). They are exercised only incidentally through projection-level tests. This means no schema-level regression detection if a field is accidentally dropped or a schema invariant changes.

The perf gate verdict: **mechanically correct, currently silenced, and must be wired.**

---

## 2. Module Coverage Map

| `src/` directory                                                                  | Primary test file(s)                                                                                                                                                                                                                     | Coverage level                         | Notes                                                                                                                                                                 |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_internal/format-utils.ts`, `_internal/slug.ts`                                  | None directly                                                                                                                                                                                                                            | Indirect                               | Exercised through renderers and projections. No dedicated unit feature.                                                                                               |
| `blocks/schema.ts`                                                                | `scaffold.feature`                                                                                                                                                                                                                       | Minimal — 9 blocks confirmed parseable | No negative-path or composition tests beyond the smoke.                                                                                                               |
| `context/projection-context.ts`                                                   | All projection step files                                                                                                                                                                                                                | Strong                                 | Used as shared fixture; shape tested by every projection.                                                                                                             |
| `disclosure/` (levels, spec)                                                      | `render-markdown.feature` (disclosure scenarios), `parity-renderer-reuse.feature`                                                                                                                                                        | Moderate                               | All four disclosure levels exercised in markdown rendering and JSON/UI invariance checks; the `ProgressiveDisclosurePolicy` constant itself has no dedicated feature. |
| `fragments/delivery-reporting/` (5 schemas + supporting)                          | `fragment-schemas.feature`                                                                                                                                                                                                               | Strong schema level                    | `RoadmapTimeline` excluded from schema parametric runner — see finding TC-H-1.                                                                                        |
| `fragments/documentation-composition/` (4 schemas + supporting)                   | `fragment-schemas.feature`                                                                                                                                                                                                               | Strong                                 | All 4 kinds covered.                                                                                                                                                  |
| `fragments/execution-context/` (7 schemas + supporting)                           | `fragment-schemas.feature`                                                                                                                                                                                                               | Strong                                 | All 7 kinds covered.                                                                                                                                                  |
| `fragments/governance/` (6 schemas + supporting)                                  | `fragment-schemas.feature`, `business-rule-set-package-scope.feature`                                                                                                                                                                    | Strong                                 | `BusinessRuleReference` excluded from schema parametric runner — see finding TC-H-1.                                                                                  |
| `fragments/operational-insights/` (9 schemas + supporting)                        | `fragment-schemas.feature`                                                                                                                                                                                                               | Strong                                 | All 9 kinds covered.                                                                                                                                                  |
| `fragments/pattern-relations/` (11 schemas + supporting)                          | `fragment-schemas.feature`                                                                                                                                                                                                               | Moderate                               | `PatternBundleEntry` excluded — see finding TC-H-1.                                                                                                                   |
| `fragments/fragment-schema.internal.ts`                                           | `fragment-schemas.feature` (discriminated-union scenarios)                                                                                                                                                                               | Good                                   | Unknown-kind rejection tested; known-kind acceptance tested.                                                                                                          |
| `projections/_shared/parse-and-project.internal.ts`                               | Implicit — covered via all `parseAndProject*` tests                                                                                                                                                                                      | Good                                   | No isolated unit test; shared behavior verified across 14 callers.                                                                                                    |
| `projections/_shared/filter.ts`                                                   | `business-rules.feature` (ProjectionFilter scenarios)                                                                                                                                                                                    | Good                                   | `filterPatterns` + `resolveProjectionFilter` exercised with maturity and status axis combinations.                                                                    |
| `projections/_shared/pattern-helpers.internal.ts`                                 | `pattern-detail.feature`, `pattern-summary.feature`, others                                                                                                                                                                              | Good indirect                          | No dedicated feature; 515 LOC file fully exercised through domain projections.                                                                                        |
| `projections/delivery-reporting/index.ts`                                         | `phase-progress-status.feature`, `release-notes.feature`, `roadmap-timeline.feature`, `traceability-matrix.feature`, `smoke-status-distribution.feature`                                                                                 | Strong                                 | All 5 public `project*` functions tested.                                                                                                                             |
| `projections/documentation-composition/` (7 files)                                | `config-documentation.feature`, `smoke-documentation-bundle.feature`, `registry-contract.feature`, `roadmap-markdown.feature`                                                                                                            | Strong                                 | All public entrypoints tested; `parseAndProjectDocumentationBundle` rejection for dropped types verified.                                                             |
| `projections/execution-context/` (7 files)                                        | `context-session.feature`, `smoke-session-context.feature`                                                                                                                                                                               | Strong                                 | All 6 public `project*`/`parseAndProject*` functions exercised with option-rejection scenarios.                                                                       |
| `projections/governance/` (6 files)                                               | `business-rules.feature`, `decision-records.feature`, `validation-taxonomy.feature`, `smoke-business-rules.feature`                                                                                                                      | Strong                                 | All grouping modes (product-area, phase, package, feature) tested; option-rejection for invalid grouping tested.                                                      |
| `projections/operational-insights/index.ts`                                       | `reporting.feature`, `smoke-overview.feature`                                                                                                                                                                                            | Strong                                 | All 7 sub-projections tested; duplicate-feature-name edge cases tested.                                                                                               |
| `projections/pattern-relations/` (10 files)                                       | `architecture-neighborhood.feature`, `dependency-edges.feature`, `dependency-tree.feature`, `open-question-list.feature`, `pattern-bundle.feature`, `pattern-detail.feature`, `pattern-summary.feature`, `smoke-dependency-tree.feature` | Strong                                 | 14/15 `parseAndProject*` callers tested; `parseAndProjectPatternBundle` not directly exercised — see finding TC-M-1.                                                  |
| `renderers/render-markdown.ts` (2,227 LOC)                                        | `render-markdown.feature` (21 scenarios)                                                                                                                                                                                                 | Strong                                 | Security paths, H2 splitting, disclosure, routed output, disambiguation all covered. See §3 for remaining gap.                                                        |
| `renderers/render-compact-text.ts`                                                | `renderer-smoke.feature` (parametric over 39 kinds)                                                                                                                                                                                      | Smoke only                             | No semantic or edge-case feature. Compact text output never compared to expected content; only "non-empty" assertion. See TC-M-2.                                     |
| `renderers/render-json.ts`                                                        | `render-json.feature` (8 scenarios)                                                                                                                                                                                                      | Good                                   | Stable-order, round-trip, bundle structure, forbidden-value errors, plain-object discriminator.                                                                       |
| `renderers/render-ui.ts`                                                          | `render-ui.feature` (3 scenarios)                                                                                                                                                                                                        | Thin                                   | PatternDetail section order and bundle children tested. No multi-kind rendering, no section-count comparison for non-PatternDetail kinds. See TC-M-3.                 |
| `renderers/markdown-paths.ts`                                                     | Implicit via `render-markdown.feature`                                                                                                                                                                                                   | Moderate                               | `resolveLogicalRoutePath` branches covered by routing scenarios; no explicit unit-level feature.                                                                      |
| `renderers/_shared/dispatch.ts`                                                   | `contract.feature` (dispatchByKind fallback scenario)                                                                                                                                                                                    | Minimal                                | Fallback handler tested; no exhaustive kind-dispatch test.                                                                                                            |
| `routing/route-id.ts`                                                             | Implicit via `render-markdown.feature` routing scenarios                                                                                                                                                                                 | Moderate                               | Parser branches exercised indirectly — see TC-M-4.                                                                                                                    |
| `shared/plain-object.ts`                                                          | `render-json.feature` (plain-object scenarios)                                                                                                                                                                                           | Good                                   |                                                                                                                                                                       |
| `projections/documentation-composition/documentation-type-registry*.ts` (4 files) | `registry-contract.feature`                                                                                                                                                                                                              | Good                                   | Identity, output-routing, disclosure, and CLI-surface axes all pinned.                                                                                                |
| `projections/errors.ts`                                                           | `decision-records.feature`, `pattern-summary.feature`, `dependency-edges.feature`                                                                                                                                                        | Good                                   | `DECISION_NOT_FOUND`, `PATTERN_NOT_FOUND` error shapes tested.                                                                                                        |

---

## 3. Findings by Severity

### High (P1)

#### TC-H-1. Three fragment kinds excluded from schema parametric runner and renderer smoke outline

**Files:** `tests/fixtures/fragments.ts`, `tests/features/fragments/fragment-schemas.feature`, `tests/features/renderers/renderer-smoke.feature`

`RoadmapTimeline`, `PatternBundleEntry`, and `BusinessRuleReference` are the only fragment kinds with `kind: z.literal(...)` schema definitions that are absent from:

- `fragment-schemas.feature` — the 41-kind parse/reject/round-trip outline
- `renderer-smoke.feature` — the 39-kind all-four-renderers outline
- `tests/fixtures/fragments.ts` — the `FRAGMENT_VALID_FIXTURES` record used by both

`RoadmapTimeline` (`src/fragments/delivery-reporting/roadmap-timeline.ts`) is a projection output kind exercised only indirectly through `roadmap-markdown.feature.steps.ts` and `roadmap-timeline.feature`, but its schema is never directly parsed or round-tripped. `PatternBundleEntry` (`src/fragments/pattern-relations/pattern-bundle-entry.ts`) appears only in the pattern-bundle step file. `BusinessRuleReference` (`src/fragments/governance/business-rule-reference.ts`) appears in the `fragments.ts` fixture map at line 128 but is deliberately excluded from `PublicFragmentKind` — the union type at line 48 stops at `OrphanPatternList`, leaving `BusinessRuleReference` unreachable by the parametric runners.

The impact: a silent schema field deletion or Zod constraint tightening on any of these three kinds would not be caught by any parametric gate. Only a functional projection test that happened to materialize the affected field would detect the breakage.

**Recipe:** Add `RoadmapTimeline`, `PatternBundleEntry`, and `BusinessRuleReference` to `PublicFragmentKind`, add valid fixtures to `FRAGMENT_VALID_FIXTURES`, add them to the `fragment-schemas.feature` examples tables, and (for the first two) add them to `renderer-smoke.feature`. `BusinessRuleReference` is a child reference type unlikely to need renderer coverage individually, but schema round-trip coverage is appropriate.

---

#### TC-H-2. Perf gate not wired into `pnpm test` — active regression goes undetected

**Files:** `package.json:65` (`test` script), `tests/perf/compare-baseline.mjs`, `tests/perf/baselines/business-rule-set.baseline.json`

As confirmed by Phase 2B (`Cleanup-C-PROJ-1`), the comparator is fully implemented and correct (see §4 below), but the `test` script terminates after `vitest run --config vitest.config.ts` without ever invoking `node tests/perf/compare-baseline.mjs`. The current baseline shows `project.avgMs = 0.544 ms` — well inside the 1.5 ms hard budget — so the gate would pass today. However:

1. The earlier evidence file cited in Phase 2B showed `2.05 ms`, which would fail.
2. Any of the H-SIMP-3/4 candidates landing without performance verification could re-introduce the regression.
3. The `vitest.perf-report.config.mjs` that runs the report-writer also exists as a separate config, creating a maintenance fork (Phase 2B `Cleanup-H-PROJ-2`).

**Recipe (from Phase 2B, one line):**

```diff
- "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts",
+ "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts && node tests/perf/compare-baseline.mjs",
```

Note: the comparator reads from `.sisyphus/evidence/task-3-business-rule-set-perf-report.json` which is written by `business-rule-set-report.feature`. That feature runs under `vitest.perf-report.config.mjs`, not under the main `vitest.config.ts`. Wiring requires either (a) including the perf-report feature in the main test run (folding the two configs) or (b) explicitly running the perf-report step before the comparator. The current two-config separation means the report file may be stale when the comparator reads it. This is the primary sequencing gap: the gate script silently fails with `Unable to read perf report` if the evidence file is not present.

---

#### TC-H-3. `parseAndProjectOpenQuestionList` bypasses the shared factory and has no option-rejection test

**Files:** `src/projections/pattern-relations/open-question-list.ts:34-39`, `tests/features/projections/pattern-relations/open-question-list.steps.ts`

Every other `parseAndProject*` function is created via the `parseAndProject()` factory in `parse-and-project.internal.ts` and tested at the trust boundary — typically with at least one "rejects invalid options" scenario. `parseAndProjectOpenQuestionList` instead calls `OpenQuestionListOptionsSchema.parse(rawOptions)` directly (Phase 2B `M-PROJ-Cleanup-1` / Phase 1 `C-PROJ-2`). The test steps import `projectOpenQuestionList` only (line 6), not `parseAndProjectOpenQuestionList`. No scenario exercises what happens when `rawOptions` carries an invalid parent name or unexpected extra property at the raw-unknown boundary.

This is both a production code smell (Phase 1 C-PROJ-2) and a test gap: the boundary-rejection contract that callers depend on is undocumented by any test.

**Recipe:** Add a scenario "parseAndProjectOpenQuestionList rejects invalid option shape" to `open-question-list.feature`, exercising the function with an unknown key or wrong type for `parentPattern`. Simultaneously fix the production code per C-PROJ-2.

---

### Medium (P2)

#### TC-M-1. `parseAndProjectPatternBundle` not directly tested

**File:** `tests/features/projections/pattern-relations/pattern-bundle.steps.ts`

The step file imports and calls `projectPatternBundle` for all three scenarios. `parseAndProjectPatternBundle` is the public-facing boundary function (exported from `src/projections/pattern-relations/bundle.ts` via `parseAndProject()` factory) but is not exercised in any test. Unlike `parseAndProjectOpenQuestionList`, this one is correctly wired through the factory, so the mechanism is sound. The gap is that option-schema rejection is never tested — if `PatternBundleOptionsSchema` accidentally becomes permissive, no test catches it.

**Recipe:** Add one scenario "parseAndProjectPatternBundle rejects an invalid mode" to `pattern-bundle.feature`.

---

#### TC-M-2. `renderCompactText` has smoke-only coverage with no semantic assertions

**Files:** `tests/features/renderers/renderer-smoke.feature.steps.ts:83,96,116`

`renderCompactText` is checked only for "non-empty output" (line 116: `compactText.length > 0`). No feature tests the format of compact text output for any fragment kind. A silent regression that produces `"[object Object]"` for every kind would pass the smoke check. The renderer-contract feature (`contract.feature`) verifies the type signature (`expectTypeOf`) but not output content.

This is lower priority than the schema gaps because compact text is the least structured renderer (flat string) and correctness is harder to pin without becoming overly brittle, but the complete absence of any content assertion is a gap. At minimum, a single representative kind (e.g., `BusinessRuleSet`) should have a scenario confirming key fields appear in the output string.

---

#### TC-M-3. `renderUi` tested for PatternDetail only — no multi-kind behavioral coverage

**File:** `tests/features/renderers/render-ui.feature`

Three scenarios cover `PatternDetail` section hierarchy, section order, and bundle child addressing. No scenario exercises `renderUi` with any other fragment kind. The renderer-smoke outline confirms non-throw and non-empty for all 39 kinds, but the structural contract (sections, section types, field mapping) is only verified for `PatternDetail`. A drift in how `BusinessRuleSet`, `RequirementDigest`, or any governance kind maps to UI sections would go undetected.

**Recipe:** Add at least one scenario for a second structurally distinct kind (e.g., `BusinessRuleSet` or `DecisionCatalog`) verifying section count and key field presence in the UI output.

---

#### TC-M-4. `routing/route-id.ts` has no dedicated feature for parser edge cases

**File:** `src/routing/route-id.ts`

`parseLogicalRouteId`, `createIndexRouteId`, `createEntityRouteId`, `createChildRouteId` are tested only indirectly through `render-markdown.feature` routing scenarios. The parser's branch coverage (2-segment entity, 2-segment index, 4-segment child, invalid length, invalid segment characters) is exercised incidentally but not pinned. Key unverified edges:

- A 3-segment route id (currently falls to the `default` branch returning `undefined`, which causes `parseLogicalRouteId` to throw — this throw path is never explicitly asserted).
- A segment starting with a non-alphanumeric character (the `ROUTE_SEGMENT_PATTERN` validates `^[A-Za-z0-9]`).
- A zero-length segment produced by double-colon input (`foo::index`).

None of these is a current regression; they are specification gaps that a future template-literal route-id change could silently break.

---

#### TC-M-5. Disclosure-level filtering: not all four levels tested across all renderers

**Files:** `tests/features/parity/parity-renderer-reuse.feature`, `tests/features/renderers/render-markdown.feature`

The parity feature verifies JSON and UI output are invariant across all four disclosure levels (essential/important/useful/advanced) for a `BusinessRuleSet` bundle. The markdown feature tests essential vs. important vs. useful vs. advanced column counts for `BusinessRuleSet`. However:

- The "advanced" level's filter behavior (candidate-rule inclusion at advanced, tested in `config-documentation.feature` line 81) is tested only through the full documentation-bundle projection, not at the renderer level.
- No test verifies disclosure-level filtering for `RequirementDigest`, `DecisionCatalog`, or any governance projection other than `BusinessRuleSet`.

This is a documentation-projection concern more than a renderer concern, but the disclosure matrix (`registry-contract.feature`) pins the current values without asserting their runtime effect on projections outside the business-rules surface.

---

#### TC-M-6. `tests/.DS_Store` committed to the repository

**File:** `tests/.DS_Store`

A macOS directory metadata file is committed under `tests/`. This has no runtime impact but should be added to `.gitignore` and removed from the tree.

---

### Low (P3)

#### TC-L-1. Audit scripts test their success path only — failure behavior is untested

**Files:** `scripts/options-schema-barrel-audit.mjs`, `scripts/jsdoc-boilerplate-audit.mjs`

Both scripts are invoked by `pnpm test` via `test:barrel-audit` and `test:jsdoc-boilerplate-audit`. They exit non-zero on failure and print structured error messages. However, no test confirms that the audit scripts correctly detect the failure conditions they are designed to catch (e.g., a deliberate schema export removed from the barrel would confirm `missingExports` is caught; a deliberate boilerplate phrase injected into a source file would confirm the JSDoc audit fires). The scripts themselves are short and readable, but their regression-prevention value depends on them actually failing when they should — which is not currently verified.

This is low priority because the scripts run on the live codebase, so false negatives would only manifest if someone introduced a drift and re-ran tests without noticing the audit script was still passing. The gap is theoretical today.

---

#### TC-L-2. `fragment-schema.internal.ts` — `FragmentSchema` tested only with one known kind and one unknown kind

**File:** `tests/features/fragments/fragment-schemas.feature:170-181`

The discriminated-union parse is tested with `PatternCatalog` (valid) and `NotARealKind` (invalid). This is a minimal pinning rather than a behavioral specification. Given that all 41 member schemas are tested individually in the outline above, this is acceptable, but the "accepts a known kind" scenario relies on a single representative — any drift in the discriminated-union construction that accidentally excludes 40 of 41 kinds would still pass.

---

#### TC-L-3. `blocks/schema.ts` — block-level error paths untested

**File:** `tests/features/scaffold.feature`

Only the happy path (all nine block builders produce valid schema output) is tested. No test verifies that `block.parse(invalidInput)` fails for each block type, or that block builders enforce their parameter contracts (e.g., a heading with `level: 7`, a table with no columns). Because blocks are pure Zod schemas and Zod's own validation is not in scope per doctrine, this is low priority, but the builders' parameter-constraint behavior (e.g., `z.union([z.literal(1), ..., z.literal(6)])` for heading level) is not covered.

---

## 4. Perf Gate Verdict

### Comparator correctness

`tests/perf/compare-baseline.mjs` is mechanically correct. The logic:

1. Reads both the committed baseline (`baselines/business-rule-set.baseline.json`) and the live evidence file (`.sisyphus/evidence/task-3-business-rule-set-perf-report.json`) in parallel.
2. For each metric, computes `effectiveBudget = Math.min(hardBudget, baselineValue × 1.5)`.
3. Sets `process.exitCode = 1` (not `process.exit(1)`) if any metric exceeds its effective budget, allowing remaining checks to complete before the process exits.
4. Throws (uncaught, causing exit code 1 via unhandled rejection) if either file is missing or if a metric field is absent.

One behavioral note: the script uses `process.exitCode = 1` rather than `process.exit(1)`. This means the script continues running through all checks before exiting, which is intentional and correct — it produces a full failure list rather than stopping at the first failure. This is good practice for a gate script.

### Metric coverage

The gate covers 26 metrics across four categories:

| Category                | Metrics covered                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core projections        | `project.avgMs`, `renderObject.avgMs`, `renderPretty.avgMs`                                                                                                                                                               |
| Scalar                  | `isBundleP50Micros`                                                                                                                                                                                                       |
| Hot paths               | `sessionContextBundle`, `scopeReadinessReport`, `documentationView`, `requirementDigestAllAreas`, `requirementDigestExecutable`, `patternSatisfiesTag`, `buildBoundedContext`, `graphBuild` (8 sub-metrics, each `avgMs`) |
| Render-markdown bundles | `patterns`, `decisions`, `requirements-executable` (3 sub-metrics, each `avgMs`)                                                                                                                                          |

### What the baseline covers well

The fixture is realistic: 36 patterns, 108 rules, 6 bounded contexts, 4 layers, 27 required coverage tags, 10 warmup iterations. Hot-path budgets cover the governance, operational-insights, and pattern-relations projections that Phase 2 identified as perf-sensitive.

### Gaps in baseline coverage

Three metrics are absent from the gate that Phase 1/2 identified as perf-sensitive:

1. **`filterPatterns` hot path.** `H-PROJ-Q-6` (Phase 1) flagged unconditional `[...patterns]` copy on 14 call sites. `filterPatterns` is not a named metric in the baseline. It contributes to every hot-path measurement, but a targeted `filterPatterns` micro-benchmark would detect the specific allocation.

2. **`render-markdown` for `RequirementDigest` and `DecisionCatalog`.** The `renderMarkdownBundles` section covers `patterns`, `decisions`, and `requirements-executable` — but `decisions` maps to `projectDecisionCatalog`, not to the separate `renderMarkdownBundles['decisions']` key. `RequirementDigest`'s markdown rendering (potentially the heaviest consumer given its structured blocks and business-rule reference resolution) has no dedicated baseline metric.

3. **No p99 or max-sample check.** The baseline stores `samples` (40 iterations with per-iteration `projectMs`, `renderObjectMs`, `renderPrettyMs`, `isBundleMicros`) but the comparator only checks `avgMs`. A single spike to 10 ms with a 0.3 ms average would pass. A `p99Ms` metric would detect tail latency regressions.

### Sequencing issue

The perf-report writer runs under `vitest.perf-report.config.mjs` which is not included in `vitest.config.ts`. The comparator reads `.sisyphus/evidence/task-3-business-rule-set-perf-report.json`. If `pnpm test` is run without first running `vitest run --config vitest.perf-report.config.mjs`, the comparator throws `Unable to read perf report` and exits 1. This is not a silent failure, but it means the two-step invocation must be documented or collapsed into a single step.

**Recommended wiring:**

```diff
- "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts",
+ "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts && vitest run --config vitest.perf-report.config.mjs && node tests/perf/compare-baseline.mjs",
```

Or, per Phase 2B `Cleanup-H-PROJ-2`, collapse the two Vitest configs into one with a tag filter, then run the comparator at the end.

---

## 5. Test Residue Cleanup

| Item                                                                | File                     | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.DS_Store`                                                         | `tests/.DS_Store`        | Delete; add `tests/.DS_Store` to `.gitignore` (`.gitignore` already lists `**/.DS_Store` per Phase 2B audit — confirm the committed file was added before that rule was in place and remove it with `git rm --cached tests/.DS_Store`).                                                                                                                                                                                                                           |
| `src/.DS_Store`                                                     | `src/.DS_Store`          | Same as above — confirmed present by directory listing.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `vitest.perf-report.config.mjs`                                     | Package root             | Near-duplicate of `vitest.config.ts`; collapse per Phase 2B `Cleanup-H-PROJ-2`.                                                                                                                                                                                                                                                                                                                                                                                   |
| `tests/features/renderers/contract.feature` documentation scenarios | `contract.feature:53-76` | Three scenarios test that a Markdown fixture file (`tests/fixtures/renderers/progressive-disclosure.md`) contains specific prose. This couples tests to fixture content that might drift. The fixture is not generated — it is hand-authored. The scenarios exist to enforce contract documentation decisions remain explicit. This is intentional, but the coupling should be noted: if the Markdown is restructured, these tests break without any code change. |

No orphaned fixture files were found. The two fixture files (`tests/fixtures/renderers/progressive-disclosure.md`, `tests/fixtures/documentation-composition/documentation-types.md`) are both referenced by step files.

---

## 6. CI Gate Gaps

Phase 2B correctly noted that projection's `test` script is the most disciplined in the family. Remaining gaps:

| Gap                                                                                                                                      | Current state                                                                                                                          | Recommended fix                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Perf gate not wired                                                                                                                      | `pnpm test` ends after `vitest run`                                                                                                    | Add perf-report run + comparator invocation (see §4)                                                                                |
| `typecheck` uses only `tsconfig.test.json`                                                                                               | Phase 2B `M-PROJ-Cleanup-5`: drift from family baseline which chains both tsconfigs                                                    | Align `typecheck` to run both `tsconfig.json` and `tsconfig.test.json` per family convention                                        |
| `parseAndProject*` body-shape audit not implemented                                                                                      | `options-schema-barrel-audit.mjs` matches `*OptionsSchema` exports but not `parseAndProject*` body shape (Phase 2B `M-PROJ-Cleanup-1`) | Add 15-LOC second pass to audit script to regex-verify each `parseAndProject*` export routes through the `parseAndProject(` factory |
| No check that `OpenQuestionList` / `RoadmapTimeline` / `PatternBundleEntry` / `BusinessRuleReference` are in the smoke parametric tables | Not enforced                                                                                                                           | Could be a lint-rule or a TypeScript assertion in `fragments.ts` that `FRAGMENT_VALID_FIXTURES` covers all schema kinds             |

---

## 7. What Is Well-Tested

### 7a. `render-markdown.ts` security paths

`tests/features/renderers/render-markdown.feature` has 21 scenarios, of which 10 are security-tagged (`@security`, `@routing`, `@disclosure`). The fixture in `render-markdown.feature.steps.ts` at lines 147–275 injects 22 distinct hostile link inputs covering:

- `javascript:` scheme
- Protocol-relative `//` prefix
- HTML-entity-encoded scheme letters (`&#x61;`)
- Named HTML entities (`&colon;`, `&sol;`, `&Tab;`, `&NewLine;`)
- Decimal HTML entities (`&#115;`)
- Semicolonless entity form (`&#58alert`)
- Control characters (tab, LF via entity)
- Path traversal (`../`, `%2f`, `%5c`, `%2e`)
- Encoded control bytes (`%0a`, `%1f`)
- Non-`.md` extension rejection
- Leading/trailing whitespace stripping

Each is asserted explicitly in a step. This is the highest trust-boundary security coverage in the package.

### 7b. `business-rules.feature` filter semantics

`tests/features/projections/governance/business-rules.feature` has 12 scenarios covering: annotation parsing, product-area grouping, phase grouping (with rejection of unphased rules), package grouping, source-agnostic fragment shape, and the full `ProjectionFilter` axis matrix (maturity × status, runtime override, maturity-only narrowing, combined override). The `filterPatterns` utility is called directly in step code (`line 523`) to verify filter behavior independent of the full projection pipeline. This is the correct approach: testing the shared primitive directly, then the projection that depends on it.

### 7c. `operational-insights/reporting.feature` duplicate-feature-name coverage

`tests/features/projections/operational-insights/reporting.feature` has 11 scenarios including 3 specifically for duplicate feature names across packages (`aggregate duplicate-feature business-rule references deterministically`, `executable requirement package and detail children should keep only local business-rule references`, `requirements-specs child routes should stay package-stable for duplicate planned feature names`). This tests a cross-cutting correctness property — that package scoping of child routes does not leak cross-package business-rule references — that would be invisible in a simpler smoke check. This is strong behavioral coverage of an intrinsically complex domain rule.

---

## Summary Table

| Finding                                                                   | Severity | Files                                                                               |
| ------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| TC-H-1: 3 fragment kinds excluded from schema + renderer parametric gates | High     | `tests/fixtures/fragments.ts`, `fragment-schemas.feature`, `renderer-smoke.feature` |
| TC-H-2: Perf gate not wired into `pnpm test`                              | High     | `package.json:65`                                                                   |
| TC-H-3: `parseAndProjectOpenQuestionList` trust-boundary untested         | High     | `open-question-list.ts:34-39`, `open-question-list.steps.ts`                        |
| TC-M-1: `parseAndProjectPatternBundle` option-rejection untested          | Medium   | `pattern-bundle.steps.ts`                                                           |
| TC-M-2: `renderCompactText` smoke-only — no content assertions            | Medium   | `renderer-smoke.feature.steps.ts`                                                   |
| TC-M-3: `renderUi` tested for PatternDetail only                          | Medium   | `render-ui.feature`                                                                 |
| TC-M-4: `routing/route-id.ts` parser edges not pinned                     | Medium   | `route-id.ts`                                                                       |
| TC-M-5: Disclosure-level filtering not tested outside BusinessRuleSet     | Medium   | `registry-contract.feature`, various                                                |
| TC-M-6: `tests/.DS_Store` committed                                       | Medium   | `tests/.DS_Store`                                                                   |
| TC-L-1: Audit script failure paths untested                               | Low      | `scripts/options-schema-barrel-audit.mjs`                                           |
| TC-L-2: `FragmentSchema` union tested with one representative             | Low      | `fragment-schemas.feature:170-181`                                                  |
| TC-L-3: Block-level error paths untested                                  | Low      | `scaffold.feature`                                                                  |
