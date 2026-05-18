# architect-core — Phase 3 Consolidated: Testing & Documentation

**Sources:** `raw/3A-test-coverage.md` (codebase-cleanup:test-automator) + `raw/3B-documentation.md` (code-documentation:docs-architect).
Findings tagged **[3A]**, **[3B]**, or **[3A+3B]** when both reviewers flagged the same theme.

## Executive Summary

Two parallel doctrine breaches stand out across both reviews:

1. **The package's own trust-boundary primitive (`parseAtBoundary`) is invisible from every angle.** Phase 1 H-CORE-3 noted it's exported but unused inside `src/`. Phase 3A confirms it has **zero test coverage** [TC-C-1]. Phase 3B confirms it has **no `@architect-pattern` annotation** so it doesn't appear in the PatternGraph, generated docs, or MCP tool results [DOC-M-4]. The package preaches "parse once at the trust boundary" while not parsing at its own boundary, not testing the helper that does, and not making it discoverable in its own metadata system.
2. **Both reviewers independently caught the package documenting/testing code Phase 1+2 already slated for deletion.** The README points to symbols in the CL-CORE-5 dead-export list [DOC-C-2]; the test suite has 2 scenarios for `formatCodecError` (also CL-CORE-5) [TC-M-5]. Phase 1/2 deletions and Phase 3 cleanups should land in the same sweep so we don't pay for the same code twice.

Beyond those, the **test posture is uneven and the documentation posture is bimodal**. The test suite is 100% BDD (24 feature files, 24 step files, zero plain Vitest unit tests, zero scale/performance integration tests) and the tier coverage is severely skewed: `types/` and `config/` are well-exercised; the `generators/pipeline/` internal surface, the entire `validation/fsm/` module (296 LOC), and 23 of 25 `PatternGraphAPI` methods are untested. The documentation has 28 of 106 files annotated with `@architect-pattern` (26%), but the algorithmic core — `transformToPatternGraph`, the entire `taxonomy/` module (19 files, 0%), the entire `utils/` module (10 files, 0%) — is invisible to the system that's _meant_ to track patterns. For a package whose doctrine is "Architect State is Code," that's a structural contradiction.

Three highest-impact actions:

1. **Add FSM transition tests** [TC-C-3]. `validateTransition` is consumed by `architect-guard` in production but has zero coverage anywhere. One `Scenario Outline` covering ~8 transitions closes the gap.
2. **Rewrite the package README** [DOC-C-1, DOC-C-2, DOC-H-1]. Current README is 18 lines, names `src/zod-primitives.ts` (doesn't exist), three of four trust-boundary bullets are wrong, and the two primary consumer entry points (`buildPatternGraph`, `createPatternGraphAPI`) are never mentioned.
3. **Annotate and document `transformToPatternGraph`** [DOC-H-4]. Phase 1 called the single-pass design "the strongest architectural choice" — it has no annotation, no JSDoc, and no consumer-facing documentation.

The Phase 3 investigation also **rectifies a Phase 2 framing error**. CL-CORE-5 flagged 5 FSM symbols as "tested but not consumed" — Phase 3 verified that **none of the five have tests at all**, they are "exported but not consumed." `validateTransition` (which Phase 2 didn't flag) is the actually consumed one (by `architect-guard`), and it's the one that _needs_ tests. Section 4 below has the full investigation.

## Critical (P0 — fix immediately)

### TD-CORE-1. `parseAtBoundary` is invisible from every angle **[3A+3B]** (extends Phase 1 H-CORE-3, Phase 2 CL-CORE-9)

`src/validation/boundary.ts`. Exported as the canonical trust-boundary primitive. **Not used in core's own src/. Not imported by any test [TC-C-1]. No `@architect-pattern` annotation [DOC-M-4]. Doesn't appear in `docs-live/PATTERNS.md`. Not mentioned in the README (which instead lists dead alternatives, DOC-C-2).** Combined effect: a primitive that the package's doctrine treats as load-bearing is essentially invisible.

**Recipe (single integrated landing):**

- Use `parseAtBoundary` at `buildPatternGraph`'s entry to parse `PipelineOptionsSchema` (closes H-CORE-3 trust-boundary inconsistency).
- That call site exercises `parseAtBoundary` through the existing `pattern-reference-validation.steps.ts` test path (closes TC-C-1).
- Add `@architect-pattern BoundaryValidator` + `@architect-see-also:ADR009ProjectionTrustBoundary` annotation to `src/validation/boundary.ts` (closes DOC-M-4 + DOC-H-5 partial).
- Rewrite the README trust-boundary section to point to `validation/boundary.ts` as the actual primitive, not to dead `utils/errors.ts` symbols (closes DOC-C-2).

One feature touching four findings.

### TD-CORE-2. README points consumers to nonexistent files and dead symbols **[3B]** (extends Phase 2 CL-CORE-7, CL-CORE-9)

`packages/architect-core/README.md`. Phase 3B audit reproduced the full 18-line README and dissected it:

- Line 14 — `src/zod-primitives.ts` does not exist (Phase 2 CL-CORE-7 confirmed).
- Lines 15-17 — three of four trust-boundary bullets are wrong: `formatZodError`/`parseOrThrow` are not exported names; `formatUserZodError` is in the CL-CORE-5 dead-export list; `validation/boundary.ts` is the real primitive and isn't mentioned.
- **The README never mentions `buildPatternGraph()` or `createPatternGraphAPI()`** — the two primary consumer entry points of the package. A new consumer reading the README cannot tell what to import.
- No install instructions, no Node version note, no ESM-only note, no public-API surface description, no ADR pointers, no dependency-direction statement.

**Recipe:** rewrite the README from scratch covering: install, quick-start with `buildPatternGraph` + `createPatternGraphAPI`, intended public API vs leaked internals (cross-link to Phase 1 H-CORE-1 barrel curation), correct trust-boundary section, ADR pointers (ADR-003/006/007/009), dependency direction.

### TD-CORE-3. `validation/fsm/` — 296 LOC, used by `architect-guard` in production, zero test coverage **[3A]** (extends Phase 2 CL-CORE-5)

`src/validation/fsm/{transitions,states,validator}.ts`. The Phase 3A investigation rectified Phase 2's "tested but not consumed" framing: the 5 symbols Phase 2 flagged have **zero tests AND zero non-test callers** in any package — "exported but not consumed." `validateTransition` (not on the Phase 2 list, but the actually consumed function — used by `architect-guard/src/lint/process-guard/decider.ts:300`) has **zero tests** despite being production-path code.

**Recipe:**

- Add `tests/features/validation/fsm-transitions.feature` with a `Scenario Outline` covering: one positive scenario per valid transition (4 legal pairs), one negative per invalid transition (terminal + skip-step + deferred-to-active), one invalid-input scenario. 8-10 scenarios total.
- Delete the 5 unused symbols flagged by Phase 2 CL-CORE-5 #4-#8 in the same PR.
- Add tests for `getProtectionSummary` as part of TD-CORE-4 (PatternGraphAPI coverage), since it's actually consumed by `read-api/pattern-graph-api.ts:207`.

### TD-CORE-4. `src/index.ts` has no header — the package's public contract is undocumented at its source **[3B]**

`src/index.ts:1`. 273 lines, 140+ named exports, 7 wildcard re-exports. No header comment explaining what the file is or which exports are the intended consumer surface vs leaked internals. The single most consumer-impactful file in the package has zero meta-documentation. Compounds Phase 1 H-CORE-1 (barrel curation).

**Recipe:** even before the barrel is curated, add a header comment block stating: "This file is the public contract of `@libar-dev/architect-core`. The intended consumer surface is `buildPatternGraph`, `createPatternGraphAPI`, `parseAtBoundary`, and the schemas in `validation-schemas/`. Other re-exports are consumed by family packages (`architect-projection`, `architect-guard`, `architect-cli`, `architect-mcp`) and are not part of the stable consumer API." Then carry out H-CORE-1 curation.

## High (P1 — fix before next release)

### Test coverage gaps

| #      | Source | Location                                          | Issue                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-H-1 | 3A     | `tests/steps/read-api/pattern-graph-api.steps.ts` | 23 of 25 `PatternGraphAPI` methods have no assertions. Notably untested: `getPatternGraph`, `getStatusDistribution` (divide-by-zero guard), `getCompletionPercentage`, `findPatternByName`, `getRecentlyCompleted`, `checkTransition`, `isValidTransition`, `getProtectionInfo`, `getPatternDeliverables`. **Recipe:** extend the feature with a second Rule covering status/distribution queries (pure functions, no I/O). |
| TC-H-2 | 3A     | `src/generators/pipeline/`                        | `buildPatternGraph` exercised only through one happy-path scenario. `mergePatterns` merge-conflict strategies, `transformToPatternGraph`, `contextInference`, `resolveRelationships` never directly tested. No scenario passes both TypeScript and Gherkin inputs simultaneously. **Recipe:** one combined-input scenario in `pattern-reference-validation.feature`.                                                        |
| TC-H-3 | 3A     | `src/utils/`                                      | All utility modules have zero tests. `fuzzy-match.ts` was praised in Phase 1 as "clean and correct" but is unverified. `string-utils.camelCaseToTitleCase` has a known latent acronym ceiling bug (Phase 2 M-SIMP-12) — currently passes silently. **Recipe:** `tests/features/utils/fuzzy-match.feature` (6 scenarios, pure functions, no I/O), plus a failing-first test for the acronym bug.                             |
| TC-H-4 | 3A     | `src/read-api/graph-inventory.ts`                 | 3 exported functions, zero tests. `aggregateTagUsage` has a latent defect (Phase 2 M-SIMP-14: `'arch-context'` lookup vs `boundedContext` field mismatch). **Recipe:** 3-scenario feature using the existing `makeGraph` builder.                                                                                                                                                                                           |
| TC-H-5 | 3A     | `src/read-api/architecture-inspection.ts:185-329` | `compareContexts` (145 LOC) has no tests; its smaller sibling `computeNeighborhood` has one scenario. The double-fetch defect Phase 1 L-CORE-5 identified is undetectable without coverage. **Recipe:** 2 scenarios (different patterns + identical patterns).                                                                                                                                                              |

### Documentation gaps

| #       | Source | Location                                            | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-H-1 | 3B     | `build-pipeline.ts:124`, `pattern-graph-api.ts:110` | `buildPatternGraph` and `createPatternGraphAPI` — the two primary consumer entry points — have no function-level JSDoc. Module-level `@architect-pattern` blocks exist but don't document the function signatures. `PipelineOptions` fields (input, features, mergeConflictStrategy, contextInferenceRules, tagRegistry, failOnScanErrors) are undocumented. **Recipe:** add function-level JSDoc with @param tags for each field.                                                                                                                                                                 |
| DOC-H-2 | 3B     | `pattern-graph-api.ts:47-109`                       | `PatternGraphAPI` interface declares 20+ methods, **none have JSDoc**. Critical behavioral questions unanswered: difference between `getPatternsByStatus` (5-state) and `getPatternsByNormalizedStatus` (?), quarter format accepted by `getPatternsByQuarter`, return shape of `checkTransition` for unknown statuses. **Recipe:** one-line JSDoc per method describing return semantics + parameter contract.                                                                                                                                                                                    |
| DOC-H-3 | 3B     | 16 annotated files                                  | Identical boilerplate "As a typed contract / data shape consumed by projection or render layers" appears as "When to Use" text in 16 files. **Wrong for 14 of them** — `ast-parser.ts` is a scanner, `pattern-graph-api.ts` is a query service, `validator.ts` is a state-machine enforcer, `build-pipeline.ts` is the graph construction entry point. Only `package-resolver.ts` and `pattern-graph.ts` are actually typed contracts. **Recipe:** replace with role-appropriate text per file. The extractors (`doc-extractor.ts:14-17`, `gherkin-extractor.ts:13-17`) show what good looks like. |
| DOC-H-4 | 3B     | `transform-dataset.ts:88-92`                        | `transformToPatternGraph` and `transformToPatternGraphWithValidation` — Phase 1 called the single-pass design "the strongest architectural choice" — have **no annotation, no module block, no JSDoc**. The algorithmic heart of the package is invisible. **Recipe:** add `@architect-pattern PatternGraphTransform` module block + function-level JSDoc covering why the single pass exists, what `RuntimePatternGraph` adds over `PatternGraph`, what the pre-computed views are, what invariants the relationship/name indices maintain.                                                       |
| DOC-H-5 | 3B     | ADRs missing from all consumer-facing locations     | ADR-003 referenced in **zero** `src/` files. ADR-006 referenced in **one** (`validation-schemas/pattern-graph.ts:12`). ADR-007 referenced in zero. ADR-009 referenced in zero. README and CONTRIBUTING.md have no ADR pointers. **Recipe:** see section "ADR Linkage Plan" below.                                                                                                                                                                                                                                                                                                                  |
| DOC-H-6 | 3B     | `validation-schemas/extracted-pattern.ts`           | `ExtractedPatternSchema` and `ExtractedPattern` (the primary data shape every consumer works with) have no annotation, no module-level JSDoc, no field-level documentation across 40+ fields. `BusinessRuleSchema` (line 13) — what `scenarioCount`, `scenarioNames`, `tags` mean in context — undocumented. **Recipe:** add module-level block + per-field JSDoc on the schema definitions.                                                                                                                                                                                                       |

### Phase 1 ADR Linkage Plan (from 3B)

| ADR                                         | Add reference at                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-003 (Source-First Pattern Architecture) | `src/generators/pipeline/build-pipeline.ts` module block; `src/generators/pipeline/merge-patterns.ts`; README; CONTRIBUTING.md                     |
| ADR-006 (Single Read Model)                 | `src/read-api/pattern-graph-api.ts` module block; `src/generators/pipeline/build-pipeline.ts` module block; README                                 |
| ADR-007 (Coordinated Taxonomy Redesign)     | `src/taxonomy/status-values.ts` (where the `AcceptedStatusValue`/`ProcessStatusValue` split lives); `src/validation/fsm/validator.ts` module block |
| ADR-009 (Projection Trust Boundary)         | `src/validation/boundary.ts` (the file that implements it) — combine with TD-CORE-1                                                                |

The custom `@architect-decision core-deps` tag on `build-pipeline.ts:8` is **not a real annotation** (not in the tag registry, not parsed by the extractor) — replace with `@architect-see-also:ADR003SourceFirstPatternArchitecture` [DOC-M-3].

## Medium (P2)

### Test quality and CI gates

| #      | Source | Location                                              | Issue                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-M-1 | 3A     | `dual-source-extractor.ts:48-193`                     | `extractProcessMetadata` and `extractDeliverables` never tested individually. Phase 2 CL-CORE-13 `console.warn` calls unverifiable without a direct test. **Recipe:** 2 RuleScenarios in `dual-source-merge.feature`.                                                                                                                                                                |
| TC-M-2 | 3A     | `scanner/ast-parser.ts:225-401`                       | `parseDirective` (170 LOC, 5 jobs, Phase 1 M-CORE-11/H-CORE-14) covered only via `scanPatterns` end-to-end. The 5 tag format dispatches (`value`/`enum`/`csv`/`flag`/`quoted-value`/`number`) and `unrecognizedEnums` handling — which already drifted between sync/async — never targeted. **Recipe:** one scenario per format in `scanner-core.feature`.                           |
| TC-M-3 | 3A     | (no scale test)                                       | No integration test against the realistic 318-pattern dogfood graph. `architect-projection` has a perf gate at 36 patterns; `architect-core` has nothing. **Recipe:** `tests/steps/integration/self-hosted-graph.steps.ts` calling `buildPatternGraph({ input: ['src/**/*.ts'] })` against the package's own src; assert ok + pattern count threshold. Build-smoke, not a perf gate. |
| TC-M-4 | 3A     | `dual-source-merge.steps.ts:23`                       | Module-level `let patternCounter = 0` never reset between scenarios — latent ordering dependency. **Recipe:** add `patternCounter = 0` to `AfterEachScenario`.                                                                                                                                                                                                                       |
| TC-M-5 | 3A     | `tests/steps/validation/codec-utils.steps.ts:176-220` | 2 scenarios for `formatCodecError` — symbol slated for deletion per CL-CORE-5 #10. **Recipe:** delete in same PR as the symbol.                                                                                                                                                                                                                                                      |
| TC-M-6 | 3A     | 4 step files                                          | `edge-classification`, `external-relationship-tags`, `pattern-graph-api`, `shape-extraction-types` omit `AfterEachScenario` cleanup while the other 20 step files have it. **Recipe:** add the 3-line teardown matching the family convention.                                                                                                                                       |
| CI-1   | 3A+2B  | `package.json:44`                                     | `"test": "vitest run"` — no typecheck guard. Every sibling chains `pnpm typecheck && vitest run`. **Recipe:** `"test": "pnpm typecheck && vitest run"`.                                                                                                                                                                                                                              |
| CI-2   | 3A+2B  | `package.json:43`                                     | `"lint": "eslint src"` — siblings lint `src tests`. **Recipe:** `"lint": "eslint src tests"`.                                                                                                                                                                                                                                                                                        |
| CI-3   | 3A+2B  | `package.json:42`                                     | `typecheck` covers only `tsconfig.test.json`. **Recipe:** `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` matching `architect-guard`/`architect-cli`.                                                                                                                                                                                                          |

### Documentation deepens

| #       | Source | Location                    | Issue                                                                                                                                                                                                                                                                               |
| ------- | ------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-M-1 | 3B     | `PipelineOptions` interface | 9 fields undocumented — see DOC-H-1.                                                                                                                                                                                                                                                |
| DOC-M-2 | 3B     | Per-package README          | Cross-package dependency direction not stated at the package level — only at family level.                                                                                                                                                                                          |
| DOC-M-3 | 3B     | `build-pipeline.ts:8`       | `@architect-decision core-deps` is not a valid registry tag. **Recipe:** replace with `@architect-see-also:ADR003SourceFirstPatternArchitecture`.                                                                                                                                   |
| DOC-M-4 | 3B     | `validation/boundary.ts`    | No `@architect-pattern` annotation despite being a load-bearing public export. **Combined with TD-CORE-1.**                                                                                                                                                                         |
| DOC-M-5 | 3B     | `CONTRIBUTING.md:60`        | References "four-stage pipeline (Scanner, Extractor, Transformer, Codec)" — Codec was removed in W7. **Recipe:** update to `Scanner → Extractor → Transformer → PatternGraph`.                                                                                                      |
| DOC-M-6 | 3B     | `docs-live/PATTERNS.md`     | Generated docs confirm the annotation gap: `architect-core` contributes 28 entries while having 106 source files. **Cause:** taxonomy (0%), utils (0%), generators/pipeline (14%) annotation rates. **Effect:** PatternGraph cannot answer "what does the taxonomy module contain?" |
| DOC-M-7 | 3B     | `MIGRATION.md`              | Does not document the ~20 symbols being removed in Phase 1/2 cleanup. Needs a "removed in 2.0.0-pre.X" section once the deletions land.                                                                                                                                             |

## Low (P3)

| #       | Source | Issue                                                                                                                                                                                           |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-L-1  | 3A     | `vitest.config.ts` include uses `tests/steps/**` vs sibling `tests/features/**`.                                                                                                                |
| TC-L-2  | 3A     | `tag-registry-builder.steps.ts` uses `.toBeDefined()` weak assertions on `tag.default` and `tag.transform`.                                                                                     |
| TC-L-3  | 3A     | `edge-classification.steps.ts` uses `vi.spyOn` to assert an internal caching invariant — will break if M-CORE-6 refactors the cache. Acceptable today; flag for deletion if the refactor lands. |
| TC-L-4  | 3A     | `dual-source-merge.steps.ts:57` uses `as unknown as ExtractedPattern` bypass — replace with `ExtractedPatternSchema.parse({...})`.                                                              |
| TC-L-5  | 3A     | `tests/.DS_Store` is checked in (or present in working tree). Add to gitignore.                                                                                                                 |
| DOC-L-1 | 3B     | `BoundaryParseError` class members (`details.path`, `details.input`, `details.expected`, `details.received`) have no documentation.                                                             |
| DOC-L-2 | 3B     | `@architect-role:utility` on `PatternGraphApi` is semantically inaccurate — it's the primary read API, should be `service` or `contract`.                                                       |
| DOC-L-3 | 3B     | `.changeset/config.json:19` ignores `architect-self-host-example` — a removed package. Stale config.                                                                                            |
| DOC-L-4 | 3B     | `CONTRIBUTING.md` has no pointer to `architect/decisions/` for contributors making architectural changes.                                                                                       |

## Tested-but-not-consumed FSM symbols — Phase 3 resolution

Phase 2 CL-CORE-5 flagged 5 FSM symbols as "tested but not consumed." Phase 3A's full-workspace investigation rectified the framing — none of the 5 have tests at all; they're "exported but not consumed." Additionally, `validateTransition` (NOT on Phase 2's list) is the one actually consumed by `architect-guard`, and it's the one that _needs_ tests.

| Symbol                       | File               | Production caller?                          | Test caller? | Action                    |
| ---------------------------- | ------------------ | ------------------------------------------- | ------------ | ------------------------- |
| `validateTransition`         | `validator.ts:88`  | **Yes — architect-guard**                   | No           | **Add tests (TD-CORE-3)** |
| `validateStatus`             | `validator.ts:60`  | No                                          | No           | Delete                    |
| `validateCompletionMetadata` | `validator.ts:121` | No                                          | No           | Delete                    |
| `validatePatternStatus`      | `validator.ts:146` | No                                          | No           | Delete                    |
| `isFullyEditable`            | `states.ts:33`     | No                                          | No           | Delete                    |
| `isScopeLocked`              | `states.ts:37`     | No                                          | No           | Delete                    |
| `getProtectionSummary`       | `validator.ts:167` | **Yes — read-api/pattern-graph-api.ts:207** | No           | **Add tests (TC-H-1)**    |

The completion-metadata-warning logic encoded by `validateCompletionMetadata` (missing `@architect-completed` / `@architect-effort-actual`) belongs in **architect-guard's DoD checker**, not in core. Cross-package finding: surface this when the guard review runs.

## Architect State coverage by area (from 3B)

Coverage rate of `@architect-pattern` module annotations:

| Area                      | Files | Annotated | Rate    | Assessment                                                                                                                                                            |
| ------------------------- | ----- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extractor/`              | 7     | 6         | **86%** | Well-covered (only `index.ts` barrel unannotated).                                                                                                                    |
| `scanner/`                | 5     | 4         | **80%** | Well-covered.                                                                                                                                                         |
| `read-api/`               | 7     | 5         | 71%     | Partial — `types.ts` (15+ query types) and `index.ts` unannotated.                                                                                                    |
| `validation/` (incl. fsm) | 5     | 3         | 60%     | `transitions.ts`, `states.ts`, **`boundary.ts`** unannotated despite being public exports.                                                                            |
| `types/`                  | 4     | 2         | 50%     | `branded.ts` unannotated.                                                                                                                                             |
| `package/`                | 5     | 1         | 20%     | Only `package-resolver.ts` annotated.                                                                                                                                 |
| `config/`                 | 19    | 3         | 16%     | Sparse — but several files are slated for deletion. Core configs (`project-config-schema.ts`, `factory.ts`, `defaults.ts`, `workflow-loader.ts`) should be annotated. |
| `generators/pipeline/`    | 7     | 1         | **14%** | **Sparse.** Only `build-pipeline.ts` annotated. `transform-dataset.ts` (the algorithmic heart) unannotated [DOC-H-4].                                                 |
| `validation-schemas/`     | 16    | 2         | **12%** | Only `pattern-graph.ts` and `codec-utils.ts` annotated. `extracted-pattern.ts` (primary shape) unannotated [DOC-H-6].                                                 |
| `taxonomy/`               | 19    | 0         | **0%**  | **None.** All 19 taxonomy files (status, maturity, roles, format types, etc.) invisible to the PatternGraph.                                                          |
| `utils/`                  | 10    | 0         | **0%**  | None. `argv-hygiene.ts` is named in the README as a trust-boundary primitive but has no annotation.                                                                   |

**Overall:** 28/106 files = 26%. Well-covered in the extractor/scanner layers; essentially absent in foundational layers (taxonomy, utils, validation-schemas, pipeline internals).

## What's well-tested (reference examples to preserve)

[3A] flagged three modules as exemplary:

- **`src/types/result.ts`** — `result-monad.feature` has 22 scenarios across 6 Rules; every logical branch covered; concrete value assertions, not `.toBeDefined()`; correct `AfterEachScenario` teardown. **Reference for "what good looks like" in this codebase.**
- **`src/types/errors.ts`** — `error-factories.feature` has 14 scenarios for all 5 factories; the use of `**Invariant:**` and `**Rationale:**` annotations in Rule descriptions is the best documentation pattern in the suite.
- **`tests/steps/extractor/edge-classification.steps.ts`** — only mock in the entire suite (`vi.spyOn` on `buildDeclaredPatternIndex`), surgically scoped, restored in `finally`. Demonstrates conservative mocking for internal caching invariants.

## Cross-package implications surfaced by Phase 3

1. **`validateTransition` consumed by `architect-guard`** — when reviewing guard, confirm that its `decider.ts:300` call site has its own integration tests covering the consume side of the FSM contract.
2. **`completion-metadata` logic belongs in `architect-guard`** — the dead `validateCompletionMetadata`/`validatePatternStatus` chain in core encodes DoD-style validation that's correctly placed in `architect-guard`. The guard review should verify it has its own implementation.
3. **`getProtectionSummary`/`getProtectionLevel` consumed by `read-api/pattern-graph-api.ts:207`** — internal consumer; tests should cover via PatternGraphAPI surface, not in isolation.

## Critical context for Phase 4

Phase 4 (Best Practices & Standards) should know:

- **Family-wide config drift list** is shaping up: `prepack` location, `lint` glob, `typecheck` scope, `test` typecheck guard, `module` field redundancy, vitest include pattern, eslint as explicit devDep. Phase 4's CI/DevOps review should consider whether a workspace-level config normalization (a single shared base script set) would be cheaper than fixing each package individually.
- **No CI perf gate in `architect-core`** despite the `PatternGraphAPI`'s 27× `structuredClone` directly affecting `architect-projection`'s perf gate. Phase 4 should weigh whether to recommend a perf-smoke for core.
- **TypeScript strictness is consistent across the family** (`tsconfig.base.json` + `tsconfig.architect-base.json`). Phase 4 should verify no per-package overrides loosen the strictness flags.
- **Zod is at `^4.1.11` across the family** — a recent major (Zod 4). Phase 4 best-practices review should verify the code uses Zod 4 patterns correctly (`.extend()` strictness behavior changed in v4; `z.function()` runtime shape; the `discriminatedUnion` typing). Phase 1 L-CORE-11 already flagged the `.extend` caveat.
