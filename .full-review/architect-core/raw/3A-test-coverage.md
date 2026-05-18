# architect-core — Phase 3A: Test Coverage & Quality

**Reviewer:** test-automation agent (Phase 3A)
**Date:** 2026-05-17
**Source root:** `packages/architect-core/src/` (106 files, ~12,360 SLOC)
**Test root:** `packages/architect-core/tests/` (51 files: 24 feature files + 24 step files + 2 support files + 1 fixture)

---

## 1. Executive Summary

The test suite uses `@amiceli/vitest-cucumber` exclusively — every test is a BDD step definition paired with a `.feature` file. This is a 100% BDD surface with zero plain Vitest unit tests and zero scale/performance integration tests. The tier coverage is severely skewed: the outermost layer (config, types, validation schemas, scanner surface) is well-exercised, but the innermost pipeline (`src/generators/pipeline/`, `src/validation/fsm/`), the entire read-API method surface, and all utility modules are either untouched or only exercised indirectly through end-to-end scenarios.

Three paths carry the highest-risk uncovered logic. First, `src/validation/fsm/` — the FSM transition table with `validateTransition`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, and `isScopeLocked` — has exactly zero test imports; the only reason those symbols are not dead is that `architect-guard` calls `validateTransition` and `getProtectionLevel` at runtime. Second, `extractPatternsFromGherkinAsync` (135 LOC) is exported, is the "async" half of the sync/async near-clone flagged in H-CORE-6, is never called in any production path, and has no tests. Third, `src/read-api/pattern-graph-api.ts` exposes a 25-method interface of which only two methods (`getPatternRelationships`, `getPatternDependencies`) are checked, with no test touching `getPatternGraph`, `getStatusDistribution`, `findPatternByName`, `getRecentlyCompleted`, or any of the 20 remaining methods.

Two test-quality patterns are worth fixing across the suite: the `dual-source-merge.steps.ts` file uses an orphaned module-level `patternCounter` that is never reset between scenarios, creating an ID-ordering assumption; and four step files (`edge-classification`, `external-relationship-tags`, `pattern-graph-api`, `shape-extraction-types`) omit `AfterEachScenario` state cleanup, relying on vitest-cucumber's own isolation rather than explicit teardown.

---

## 2. Module Coverage Map

| `src/` directory              | Test files             | Assessment        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/`                     | 8 step files           | **Well-covered**  | `config-loader`, `resolve-config`, `define-config`, `merge-sources`, `package-resolver`, `configuration-api`, `source-merging`, `project-config-loader` all have dedicated scenarios. `defaults`, `factory`, `role-constants`, `self-hosting`, `cli-schema`, `presentation-contracts` not directly imported but covered incidentally or slated for deletion.                                                                                                                                                                           |
| `scanner/`                    | 3 step files           | **Partial**       | `pattern-scanner` (file discovery), `gherkin-ast-parser` (parse + tag extraction), `gherkin-scanner` (indirect via `buildPatternGraph`). `ast-parser.ts` (the TypeScript JSDoc parser) has **zero direct tests** — the `scanner-core.steps.ts` exercises `scanPatterns` end-to-end, which internally calls `ast-parser`, but `parseDirective` (170-line, 5-concern function, H-CORE-14) is never targeted in isolation.                                                                                                                |
| `extractor/`                  | 6 step files           | **Partial**       | `shape-extractor`, `gherkin-extractor` (sync path only), `dual-source-extractor` (`combineSources`, `validateDualSource`) are covered. `doc-extractor` is indirectly covered via `extractPatterns` in `pattern-reference-validation.steps.ts` (one narrow path: invalid name + graph-build), but `buildPattern`, `inferPatternName`, `hasAggregationTag`, `getAggregationTags` are untested. `extractPatternsFromGherkinAsync` (async path) has **zero tests**. `layer-inference.ts` has no tests (slated for deletion per H-CORE-11). |
| `generators/pipeline/`        | 0 dedicated step files | **Sparse**        | `buildPatternGraph` is exercised indirectly by `pattern-reference-validation.steps.ts` but only through the happy path with a temp workspace. `transformToPatternGraph`, `mergePatterns` (conflict resolution), `resolveRelationships`, `inferContext` are never tested in isolation. The merge-conflict and dangling-reference paths beyond the one tested scenario are uncovered.                                                                                                                                                    |
| `read-api/`                   | 1 step file            | **Sparse**        | `createPatternGraphAPI` is exercised for 2 of 25 interface methods. `architecture-inspection.computeNeighborhood` has 1 scenario. `graph-inventory` (3 exported functions) has **zero tests**. `pattern-classification.classifyEdgeExternality` has 4 scenarios including an important spy test. `compareContexts` (145-line function, L-CORE-5) has zero tests.                                                                                                                                                                       |
| `validation/fsm/`             | 0 step files           | **None**          | All 3 files (`transitions.ts`, `states.ts`, `validator.ts`) have zero test imports. See Section 4.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `validation/` (boundary)      | 0 step files           | **None**          | `parseAtBoundary` and `BoundaryParseError` from `validation/boundary.ts` are not imported by any test. See Finding TC-C-1.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `validation-schemas/`         | 3 step files           | **Partial**       | `tag-registry.ts`, `workflow-config.ts`, `codec-utils.ts` are covered. `extracted-pattern.ts`, `extracted-shape.ts`, `pattern-graph.ts`, `feature.ts`, `output-schemas.ts`, `doc-directive.ts`, `lint.ts`, `scenario-ref.ts`, `dual-source.ts`, `export-info.ts`, `config.ts`, `pattern-contract.ts` have no dedicated scenarios.                                                                                                                                                                                                      |
| `taxonomy/`                   | 0 direct step files    | **None**          | `buildRegistry` is tested via `tag-registry-builder.steps.ts` which imports through `src/index.js`. The 18 individual taxonomy value files (`status-values.ts`, `maturity-values.ts`, etc.) and `registry-builder.ts` have no direct tests; covered only transitively when the registry is constructed.                                                                                                                                                                                                                                |
| `types/`                      | 2 step files           | **Well-covered**  | `result.ts` (22 scenarios), `errors.ts` (14 scenarios) are among the best-covered modules. `branded.ts` has partial coverage via `error-factories.steps.ts` (`asSourceFilePath`); `asModuleId` and other branded constructors are untested.                                                                                                                                                                                                                                                                                            |
| `utils/`                      | 0 step files           | **None**          | `fuzzy-match.ts`, `string-utils.ts`, `collection-utils.ts`, `argv-hygiene.ts`, `session-helpers.ts`, `id-utils.ts`, `parse-markdown-table-rows.ts` all have zero test imports. `markdown-parser.ts` has zero tests (and is slated for deletion per CL-CORE-5 #1).                                                                                                                                                                                                                                                                      |
| `package/`                    | 1 step file            | **Partial**       | `package-resolver.steps.ts` covers `createPackageResolver` and `ProjectionError`. `package-config.ts`, `package.ts` not directly tested.                                                                                                                                                                                                                                                                                                                                                                                               |
| `domain-enums.ts`, `index.ts` | —                      | Tested indirectly | Barrel-level coverage via other step files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---

## 3. Findings by Severity

### Critical

#### TC-C-1. `parseAtBoundary` — zero test coverage for the package's own trust-boundary primitive

**File:** `src/validation/boundary.ts`
**Cross-ref:** Phase 1 H-CORE-3

`parseAtBoundary` is the single helper that the package exports as the canonical trust-boundary enforcement point. Phase 1 confirmed it is unused inside `src/` itself. The test surface does not import it either — no step file calls `parseAtBoundary` with a schema. This means the combination of "not called in production" and "not called in tests" creates a dead-but-exported symbol with zero behavioral verification. If a consumer imports and uses `parseAtBoundary`, they get no test signal from this package that it works.

**Recipe:** Either add a feature file `tests/features/validation/boundary-parse.feature` with 3 scenarios (happy path, schema rejection, unknown-input) — or, as Phase 1 H-CORE-3 recommends, use `parseAtBoundary` at `buildPatternGraph`'s entry point and cover it through the existing `pattern-reference-validation.steps.ts`. The second option is preferred: it produces real production usage AND test coverage in one move.

#### TC-C-2. `extractPatternsFromGherkinAsync` — 135 LOC async path with zero tests and zero production callers

**File:** `src/extractor/gherkin-extractor.ts` lines 517–652
**Cross-ref:** Phase 1 H-CORE-6, Phase 2 H-SIMP-1

The async variant is exported from `src/extractor/index.ts` and from the barrel `src/index.ts`, but `grep` across the entire package family confirms it is called nowhere in production code. The build pipeline (`build-pipeline.ts`) calls the sync `extractPatternsFromGherkin`, not the async variant. The async path has no tests. Phase 1/2 recommend collapsing both into a single async entry; if that refactor lands before Phase 3 test additions, the problem self-resolves. If not, the async path should at minimum get a single integration scenario reusing the `pattern-reference-validation` infrastructure.

**Recipe:** Treat as a deletion candidate (H-SIMP-1) with higher priority precisely because it is untested. Add a `@skip-until:H-SIMP-1` note in the feature file tracking list, not a new feature file, so the team doesn't invest in testing code earmarked for deletion.

#### TC-C-3. `src/validation/fsm/` — entire module cluster (296 LOC) untested

**File:** `src/validation/fsm/transitions.ts`, `states.ts`, `validator.ts`
**Cross-ref:** Phase 2 CL-CORE-5 items 4-8

The FSM module (`validateTransition` + `validateStatus` + `validateCompletionMetadata` + `validatePatternStatus` + `isFullyEditable` + `isScopeLocked` + `getProtectionSummary` + the transitions table) is entirely untested. `architect-guard` calls `validateTransition` and `getProtectionLevel` in production, so the module is not dead — but the tests validating guard behavior don't live here. Section 4 gives the full symbol-by-symbol analysis. The transition table (`VALID_TRANSITIONS`) has four statuses and specific legal/illegal pairs; none of these invariants are verified at this layer. If Phase 2's delete recommendations are accepted for five of the seven symbols, that still leaves `validateTransition` and `getProtectionLevel`/`getProtectionSummary` as production-path code requiring coverage.

**Recipe:** Add `tests/features/validation/fsm-transitions.feature` with at minimum: one positive scenario per valid transition (4 pairs), one negative scenario per invalid transition (targeting terminal + skip-step + deferred-to-active), and an invalid-input scenario (non-status string). These 8-10 scenarios can be expressed concisely with `Scenario Outline`.

---

### High

#### TC-H-1. `PatternGraphAPI` — 23 of 25 interface methods have zero behavioral assertions

**File:** `tests/steps/read-api/pattern-graph-api.steps.ts`
**Cross-ref:** Phase 1 H-CORE-8 (structuredClone), L-CORE-14 (getPatternsByQuarter)

The 4 scenarios in `pattern-graph-api.feature` check `getPatternRelationships`, `getPatternDependencies`, and `computeNeighborhood` — and all three are specifically about the reverse-lookup correction (stale/missing `relationshipIndex`), which is an important edge case but not the primary API contract. Untested methods include `getPatternGraph`, `getPatternsByStatus`, `getPatternsByNormalizedStatus`, `getStatusCounts`, `getStatusDistribution`, `getCompletionPercentage`, `getPatternsByPhase`, `getPhaseProgress`, `getActivePhases`, `getAllPhases`, `findPatternByName`, `getRecentlyCompleted`, `getCurrentWork`, `getRoadmapItems`, `listRoles`, `getPatternsByRole`, `getPatternsByQuarter`, `getQuarters`, `checkTransition`, `isValidTransition`, `getProtectionInfo`, `getPatternDeliverables`.

The `getStatusDistribution` percentage math (divide-by-zero guard at line 144) and `getCompletionPercentage` (same guard at line 158-161) are particularly risky uncovered paths. Both compute `deliveryTotal = counts.total - counts.candidate` and substitute 1 when zero — an invariant that is easy to silently break.

**Recipe:** Extend `pattern-graph-api.feature` with a second Rule block: "Status and distribution queries return correct aggregates." Verify at least `getStatusCounts`, `getStatusDistribution` (including the all-candidate edge case), `getCompletionPercentage`, and `getPatternsByStatus`. Use the existing `makeGraph` helper — these are pure-function scenarios requiring no I/O.

#### TC-H-2. `src/generators/pipeline/` — pipeline internals tested only through one narrow integration path

**Files:** `src/generators/pipeline/transform-dataset.ts`, `merge-patterns.ts`, `context-inference.ts`, `relationship-resolver.ts`

`buildPatternGraph` is called in one test file (`pattern-reference-validation.steps.ts`) with a minimal temp workspace. The merge-conflict path (`mergeConflictStrategy: 'fatal'`) is used but never tested for the `'warn'` or `'last-wins'` strategies. `mergePatterns` (which enforces single-definition invariants) is never tested for duplicate pattern names. `contextInference` (which populates `byRole`, `byPhase`, `byProductArea`) contributes to the graph shape that downstream `PatternGraphAPI` relies on but which tests construct by hand.

No test exercises `buildPatternGraph` with both TypeScript and Gherkin inputs simultaneously — the `pattern-reference-validation` test always passes `features: []`.

**Recipe:** Add one scenario to `pattern-reference-validation.feature`: "Building a graph with both TypeScript and Gherkin inputs produces a combined pattern list." This exercises the full pipeline path including the Gherkin scan branch (lines 198-250 of `build-pipeline.ts`) which is currently unreachable from tests.

#### TC-H-3. `src/utils/` — all utility modules have zero tests

**Files:** `src/utils/fuzzy-match.ts`, `string-utils.ts`, `session-helpers.ts`, `collection-utils.ts`, `parse-markdown-table-rows.ts`

`fuzzy-match.ts` is praised in Phases 1 and 2 as "clean and correct" yet has no tests. It is called in production for pattern-name suggestions and by `find-best-match` in the read API. `camelCaseToTitleCase` in `string-utils.ts` has a latent acronym-ceiling bug (Phase 2 M-SIMP-12). `extractFirstSentenceRaw` in `session-helpers.ts` has a known regex gap (Phase 1 L-CORE-3). None of these are verified.

**Recipe:** `fuzzy-match.ts` is pure functions on string inputs — add `tests/features/utils/fuzzy-match.feature` with edge cases: empty string, exact match, transposition, distance-2, no match. This is a 6-scenario file with no I/O. For `string-utils.ts`, add the known-failing case for acronyms with the bug from M-SIMP-12 as a failing-first TDD marker.

#### TC-H-4. `src/read-api/graph-inventory.ts` — 3 exported functions, zero tests

**File:** `src/read-api/graph-inventory.ts`

`aggregateTagUsage`, `buildSourceInventory`, and `findOrphanPatterns` are untested. `aggregateTagUsage` has a latent defect (Phase 2 M-SIMP-14: `'arch-context'` lookup vs `boundedContext` field mismatch). `findOrphanPatterns` (which identifies patterns with no relationships) is a consumer-facing query method that has no behavioral verification.

**Recipe:** Add `tests/features/read-api/graph-inventory.feature` with 3 Rules: one scenario each for `aggregateTagUsage` (verify count for a known tag), `buildSourceInventory` (verify typescript vs gherkin split), and `findOrphanPatterns` (one isolated pattern returns as orphan). All three can use the same `makeGraph` builder already present in `edge-classification.steps.ts`.

#### TC-H-5. `compareContexts` (145-line architecture comparison function) — zero tests

**File:** `src/read-api/architecture-inspection.ts` lines 185-329
**Cross-ref:** Phase 1 L-CORE-5

`compareContexts` is the larger of two functions in `architecture-inspection.ts`. `computeNeighborhood` (the simpler one) has one scenario. `compareContexts` — which compares role sets, relationship directions, and layer membership between two pattern names — is entirely uncovered. Phase 1 identified a double-fetch of relationships per pattern; that defect is impossible to detect without a test.

**Recipe:** Add a second Rule to `pattern-graph-api.feature` or a new `architecture-inspection.feature`. One scenario: two patterns with different roles and relationship directions — assert the returned comparison flags the role mismatch. One scenario: identical patterns — assert comparison returns no differences.

---

### Medium

#### TC-M-1. `extractProcessMetadata` and `extractDeliverables` untested individually

**File:** `src/extractor/dual-source-extractor.ts` lines 48-193
**Cross-ref:** Phase 2 CL-CORE-13 (console.warn in this function)

`dual-source-merge.steps.ts` calls `combineSources` and `validateDualSource` only. `extractProcessMetadata` and `extractDeliverables` (the two inner functions that parse Gherkin table rows and tag values) are never called directly in tests. Phase 2 CL-CORE-13 notes `console.warn` calls in `extractProcessMetadata` — currently unverifiable without a direct test that can assert diagnostic surfacing.

**Recipe:** Add 2 RuleScenarios inside `dual-source-merge.feature`: one testing `extractProcessMetadata` with a valid feature file (assert phase/status fields), one with a malformed tag value (assert diagnostic emission once CL-CORE-13 is resolved).

#### TC-M-2. `src/scanner/ast-parser.ts` — `parseDirective` (170 LOC) untested in isolation

**File:** `src/scanner/ast-parser.ts` lines 225-401
**Cross-ref:** Phase 1 M-CORE-11, H-CORE-14

`parseDirective` is invoked via `scanPatterns` (covered by `scanner-core.steps.ts`), but the 5 internal jobs it performs — enum dispatch, multi-value CSV, quoted-value, number, flag — are never targeted individually. In particular the `unrecognizedEnums` handling (which has drifted between the sync and async Gherkin paths per H-CORE-6) is not validated.

**Recipe:** Extend `scanner/gherkin-parser.feature` or `behavior/scanner-core.feature` with a Rule targeting each tag format: one scenario per format type (`value`, `enum`, `csv`, `flag`, `quoted-value`). These can use inline TypeScript source in docstrings, same pattern as `scanner-core.steps.ts`.

#### TC-M-3. No scale-realism integration test against the 318-pattern dogfood graph

**Cross-ref:** Phase 2 note on 318-pattern fixture, Phase 1 H-CORE-8

The package's self-hosted Architect State (annotated with `@architect-pattern` tags across `src/`) IS the realistic 318-pattern fixture, but no test exercises `buildPatternGraph` against the live `src/` directory. `architect-projection` has a CI performance gate exercising a 36-pattern fixture. `architect-core` has nothing comparable. The `PatternGraphAPI` `structuredClone` cost (H-CORE-8) is undetectable in the current test surface.

**Recipe:** Add one integration test file `tests/steps/integration/self-hosted-graph.steps.ts` that calls `buildPatternGraph({ input: ['src/**/*.ts'], ... })` pointing at the package's own `src/` and asserts: (a) result is ok, (b) pattern count is above a threshold (e.g., 50), (c) `getPatternsByStatus('active').length > 0`. This is not a perf gate — it is a build-smoke test at realistic scale. It also validates the `self-hosting.ts` workspace-root calculation against the real file tree.

#### TC-M-4. `dual-source-merge.steps.ts:23` — `patternCounter` never reset between scenarios

**File:** `tests/steps/extractor/dual-source-merge.steps.ts` line 23
**Severity:** Medium (latent ordering dependency)

`let patternCounter = 0` is a module-level counter incremented in `createCodePattern`. It is never reset in `AfterEachScenario` (which only nulls `state`). Each scenario receives IDs continuing from where the previous scenario left off (`pattern-00000001`, `pattern-00000002`, ...). This is currently benign because the IDs are only used for uniqueness within a scenario, but it creates an ordering dependency: if a test branches on the ID value, it will fail if run in isolation vs. as part of the full suite.

**Recipe:** Add `patternCounter = 0;` inside the `AfterEachScenario` callback at line 120.

#### TC-M-5. `formatCodecError` tested for a symbol recommended for deletion

**File:** `tests/steps/validation/codec-utils.steps.ts` lines 176-220
**Cross-ref:** Phase 2 CL-CORE-5 item 10

`formatCodecError` has two dedicated scenarios. Phase 2 identified it as a dead export with zero non-test callers. The tests are correct — but they are tests for code that should be deleted. These scenarios should be deleted along with the production symbol (not preserved "for documentation").

**Recipe:** When CL-CORE-5 deletion lands, delete the `Rule: formatCodecError formats errors for display` block from `codec-utils.feature` and the corresponding `RuleScenario` blocks from `codec-utils.steps.ts`. The `createJsonInputCodec` scenarios above are genuinely useful and should be kept.

#### TC-M-6. Four step files missing explicit `AfterEachScenario` cleanup

**Files:**

- `tests/steps/extractor/edge-classification.steps.ts` (no AfterEachScenario)
- `tests/steps/extractor/external-relationship-tags.steps.ts` (no AfterEachScenario)
- `tests/steps/read-api/pattern-graph-api.steps.ts` (no AfterEachScenario)
- `tests/steps/extractor/shape-extraction-types.steps.ts` (no AfterEachScenario)

Each uses a module-level `let state: State` (non-nullable) initialized in `Background`. If vitest-cucumber runs scenarios in the same module scope (which it does for the same feature's step definitions), a missing teardown means state set in scenario N is visible to scenario N+1's `Given`. The Background re-initializes state, but only if the Background step runs before each scenario — this is the expected behavior of `@amiceli/vitest-cucumber`, so the risk is low today but becomes significant if any scenario skips its Background.

**Recipe:** Add `AfterEachScenario(() => { state = null as unknown as State; })` to each of the four files, matching the pattern used in the other 20 step files. This is a 3-line addition per file.

---

### Low

#### TC-L-1. `vitest.config.ts` include pattern diverges from sibling convention

**File:** `packages/architect-core/vitest.config.ts` line 6
**Cross-ref:** Phase 2 configuration audit

Core uses `include: ['tests/steps/**/*.steps.ts']`. `architect-projection` uses `include: ['tests/features/**/*.steps.ts']`. The pattern is functionally equivalent (both match the step files) but creates a search-path inconsistency. When new step files are added, the divergence may cause confusion about where to put them.

**Recipe:** Align to `tests/features/**/*.steps.ts` (projection's convention) or pick one family-wide standard. Low risk; cosmetic.

#### TC-L-2. Weak `.toBeDefined()` assertions in tag-registry-builder tests

**File:** `tests/steps/types/tag-registry-builder.steps.ts` lines 80, 93-94, 108-109, 118-119

`expect(tag!.default).toBeDefined()` and `expect(tag!.transform).toBeDefined()` assert presence without checking value. A tag with `default: null` passes these checks. The default values and transform functions are load-bearing for the extraction pipeline.

**Recipe:** Replace `toBeDefined()` with explicit value assertions: `expect(tag!.default).toBe('active')` for the status tag, or `expect(typeof tag!.transform).toBe('function')` for transform presence. Not blocking.

#### TC-L-3. `edge-classification.steps.ts` uses `vi.spyOn` to test internal caching behavior

**File:** `tests/steps/extractor/edge-classification.steps.ts` lines 148-155
**Cross-ref:** Phase 1 H-CORE-2

The spy on `buildDeclaredPatternIndex` (line 148) tests that the index is built exactly once per classification call sequence — an internal caching invariant, not a behavior-observable outcome. This is a London-school interaction test on a pipeline internal. If the caching is refactored (e.g., moved out of `pattern-classification.ts` per Phase 1 M-CORE-6), this test breaks without any behavioral change.

**Recipe:** This test is acceptable given the explicit performance concern documented in the scenario description. Flag for deletion if Phase 1 M-CORE-6 refactoring moves the index build. Do not promote to more internals spying.

#### TC-L-4. `dual-source-merge.steps.ts:57` uses `as unknown as ExtractedPattern` bypass

**File:** `tests/steps/extractor/dual-source-merge.steps.ts` line 57

`createCodePattern` builds a partial object and escapes type checking with `as unknown as ExtractedPattern`. This means the test data does not satisfy `ExtractedPatternSchema` and would fail a `safeParse` call. The fixture is used to exercise `combineSources` which accesses only `patternName`, `status`, and `phase` — so the cast is functionally safe today but will silently break if `combineSources` starts accessing other required fields.

**Recipe:** Replace the cast with `ExtractedPatternSchema.parse({ ... })`, using the same pattern as `makePattern` in `edge-classification.steps.ts`. This requires filling in the missing required fields (`id`, `name`, `directive`, `code`, `source`, `exports`, `extractedAt`).

---

## 4. Tested-but-Not-Consumed — FSM Symbol Investigation

Phase 2 CL-CORE-5 flagged five FSM symbols as "tested but not consumed." The Phase 3 investigation reveals a more nuanced picture:

### Findings

**`validateTransition`** (`src/validation/fsm/validator.ts:88`)

- Production callers: `architect-guard/src/lint/process-guard/decider.ts:300`. **Actively used.**
- Test callers: **zero**.
- Recommendation: **Promote to tested.** Add FSM transition scenarios (TC-C-3 above). Do NOT delete. Phase 2 was correct that it has zero non-test callers _within `architect-core`_, but the family-wide scan shows it is consumed by `architect-guard`. This is a cross-package dependency that grep limited to `src/` missed.

**`validateStatus`** (`src/validation/fsm/validator.ts:60`)

- Production callers in any package: **zero** (confirmed by full workspace grep, excluding test files and `src/validation/fsm/` itself).
- Internal callers: called by `validatePatternStatus` (line 155) — which is itself uncalled.
- Test callers: **zero**.
- Recommendation: **Delete.** `validateStatus` is called only by `validatePatternStatus`. If `validatePatternStatus` is deleted (see below), `validateStatus` becomes dead. The behavior it encodes (is-status-valid check + terminal-state warning) is already available through `PROCESS_STATUS_VALUES.includes()` + `isTerminalState()` at any call site.

**`validateCompletionMetadata`** (`src/validation/fsm/validator.ts:121`)

- Production callers in any package: **zero**.
- Internal callers: called by `validatePatternStatus` (line 156) — which is itself uncalled.
- Test callers: **zero**.
- Recommendation: **Delete.** Same chain as `validateStatus`. The completion-metadata warning logic (missing `@architect-completed`, missing `@architect-effort-actual`) belongs in `architect-guard`'s DoD checker, not in `architect-core`.

**`validatePatternStatus`** (`src/validation/fsm/validator.ts:146`)

- Production callers in any package: **zero**.
- Test callers: **zero**.
- Recommendation: **Delete.** This is a compositor of `validateStatus` + `validateCompletionMetadata` — both of which are themselves dead. Phase 2 CL-CORE-5 was correct.

**`isFullyEditable`** (`src/validation/fsm/states.ts:33`)

- Production callers in any package: **zero** (confirmed; `architect-guard` uses `getProtectionLevel` directly, not this wrapper).
- Test callers: **zero**.
- Recommendation: **Delete.** `getProtectionLevel(status) === 'none'` at the call site is one character shorter and clearer. The wrapper adds nothing.

**`isScopeLocked`** (`src/validation/fsm/states.ts:37`)

- Production callers in any package: **zero**.
- Test callers: **zero**.
- Recommendation: **Delete.** Same as `isFullyEditable`.

### Additional symbol: `getProtectionSummary`

- Production callers: `src/read-api/pattern-graph-api.ts:207` — **actively used** inside `createPatternGraphAPI`.
- Test callers: **zero** (the `getProtectionInfo` method that calls it is not exercised in `pattern-graph-api.steps.ts`).
- Recommendation: **Promote to tested** as part of TC-H-1 (`PatternGraphAPI` method coverage). Not a deletion candidate.

### Summary table

| Symbol                       | File               | Production caller?      | Test caller? | Action             |
| ---------------------------- | ------------------ | ----------------------- | ------------ | ------------------ |
| `validateTransition`         | `validator.ts:88`  | Yes — `architect-guard` | No           | Add tests (TC-C-3) |
| `validateStatus`             | `validator.ts:60`  | No                      | No           | Delete             |
| `validateCompletionMetadata` | `validator.ts:121` | No                      | No           | Delete             |
| `validatePatternStatus`      | `validator.ts:146` | No                      | No           | Delete             |
| `isFullyEditable`            | `states.ts:33`     | No                      | No           | Delete             |
| `isScopeLocked`              | `states.ts:37`     | No                      | No           | Delete             |
| `getProtectionSummary`       | `validator.ts:167` | Yes — `read-api`        | No           | Add tests (TC-H-1) |

---

## 5. Test Residue Cleanup

### No snapshot files

`find tests -name "*.snap"` returned nothing. Zero snapshot debt.

### Single fixture file — correctly used

`tests/fixtures/legacy-taxonomy/invalid-pattern-name.ts` is the only fixture file. It is imported by `pattern-reference-validation.steps.ts` (line 99). Not dead.

### No `.only` / `.skip` / `it.todo`

A full grep across all test files found zero occurrences of `.only`, `.skip`, `it.todo`, `test.todo`, `xit`, `xdescribe`, `fdescribe`, `fit`. The suite has no committed test-control cruft.

### No `// TODO` / `FIXME` / suppression comments

Zero occurrences in `tests/`. Clean.

### Orphaned `patternCounter` (already reported as TC-M-4)

`tests/steps/extractor/dual-source-merge.steps.ts:23` — module-level counter that is never reset. Not a snapshot or fixture issue, but residue of an incomplete test helper.

### `tests/.DS_Store`

`tests/.DS_Store` is present in the test directory. This should be added to `.gitignore` if not already present.

---

## 6. Test-Script / CI Gate Gaps

### `pnpm test` lacks typecheck guard

`packages/architect-core/package.json:44`:

```json
"test": "vitest run"
```

Every sibling has a typecheck guard before the run:

- `architect-guard`: `pnpm typecheck && vitest run --config vitest.config.ts`
- `architect-mcp`: `pnpm typecheck && vitest run --config vitest.config.ts`
- `architect-projection`: `pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts`
- `architect-cli`: `pnpm build && vitest run --config vitest.config.ts`

The risk is concrete: a type error introduced in a test file will not block `pnpm test` in `architect-core`. The `typecheck` script (`tsc --noEmit -p tsconfig.test.json`) exists but is not chained. Currently `tests/` is not linted either (CL-CORE-10), so a bad import or type-unsafe cast in a step file is catchable only by hand.

**Recipe:**

```json
"test": "pnpm typecheck && vitest run"
```

This is a one-line change that brings core in line with its siblings. Given that `tests/` is 51 files of TypeScript, the typecheck pass is worth the extra ~2 seconds.

### `lint` script does not cover `tests/`

`packages/architect-core/package.json:43`:

```json
"lint": "eslint src"
```

All four sibling packages use `eslint src tests`. The 51 test step files are not linted. Phase 2 CL-CORE-10 already flagged this. The practical consequence: the `as unknown as ExtractedPattern` cast in `dual-source-merge.steps.ts:57` (TC-L-4) and any future unsafe cast in test code will not be caught by CI.

**Recipe:**

```json
"lint": "eslint src tests"
```

### `typecheck` covers only `tsconfig.test.json`

`packages/architect-core/package.json:42`:

```json
"typecheck": "tsc --noEmit -p tsconfig.test.json"
```

`architect-guard` and `architect-cli` run both `tsconfig.json` and `tsconfig.test.json`:

```json
"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json"
```

If a type error is introduced in `src/` (not in tests), `pnpm typecheck` in `architect-core` will not catch it unless the test-config also covers the full `src/` path. This is a Phase 2 CL-CORE-11 finding that directly affects test-gate reliability.

### `vitest.config.ts` include pattern diverges from siblings

`packages/architect-core/vitest.config.ts:6`: `tests/steps/**/*.steps.ts`
`packages/architect-projection/vitest.config.ts:7`: `tests/features/**/*.steps.ts`

The functional result is identical (both resolve to the same files) but the pattern differs. A developer copying the pattern from one package to the other will get different behavior if they add steps in a non-standard subdirectory.

### `prepack` still misplaced (Phase 2 CL-CORE-1 not yet fixed)

Confirmed: `packages/architect-core/package.json:66` has `"prepack": "pnpm build"` at JSON root. This is still present. The test gate impact: if a fresh publish runs `npm pack` without a prior `pnpm build`, the `dist/` contains stale type output, which can cause test failures in consumers. Not a test-script issue per se, but worth reconfirming as a CI gate gap.

---

## 7. What's Well-Tested

### `src/types/result.ts` — exemplary coverage

`tests/features/types/result-monad.feature` + `result-monad.steps.ts`: 22 scenarios across 6 Rules covering `Result.ok`, `Result.err`, type guards, `unwrap` (including the non-Error-wrapping path and object-serialization path), `unwrapOr`, `map`, and `mapErr`. Every logical branch of the 82-line `result.ts` is exercised. Assertions are concrete value checks, not `.toBeDefined()`. The `AfterEachScenario` cleanup is correct. This is the reference for "what good looks like" in the codebase.

### `src/types/errors.ts` — complete factory coverage

`tests/features/types/error-factories.feature` + `error-factories.steps.ts`: 14 scenarios covering all 5 error factory functions with named-field assertions on every output property. The feature file uses `Rule` blocks with explicit `**Invariant:**` and `**Rationale:**` annotations — the best-documented feature file in the suite. Assertions check discriminant fields (`type`), messages, and structured sub-fields, not just shape existence.

### `tests/steps/extractor/edge-classification.steps.ts` — correct use of spying

The spy scenario (TC-L-3) is the only mock in the suite. It is surgically scoped: `vi.spyOn` on a named export, assertion on call count, `spy.mockRestore()` in a `finally` block. The other three scenarios are pure behavior assertions. This file demonstrates how to use mocking conservatively when an internal caching invariant matters.
