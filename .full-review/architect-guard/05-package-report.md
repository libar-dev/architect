# `@libar-dev/architect-guard` — Consolidated Review Report

**Package:** `@libar-dev/architect-guard@2.0.0-pre.1`
**Size:** 38 source files, ~9,135 SLOC. Test surface: **3 feature files / 5 step files / 14 scenarios / 610 LOC of step code** — worst test-to-source ratio in the family.
**Role:** Policy, validation, process-guard (FSM enforcement), step-lint, DoD, anti-pattern detection, git helpers. Depends on `@libar-dev/architect-core`; consumed by `@libar-dev/architect-cli`.
**Source phases:** `01`-`04`. Raw outputs from 8 agents in `./raw/`.

## Executive Summary

**Guard sits between core and projection on the doctrine spectrum — closer to core.** The package whose anti-pattern detector enforces doctrine on siblings is itself the **second-most doctrine-inconsistent in the family**. Headline measurements: 1 `z.strictObject` vs 1 open `z.object`; 55% `@architect-pattern` annotation rate; zero suppressions; **no package README at all**; phantom PDR-005 referenced **11 times** (including user-visible CLI help); FSM trust-boundary collapse compounds C-CORE-5 with three additional fresh casts.

The single highest-leverage finding across the entire family review is a **one-line edit in core** discovered by Phase 4A:

**`isValidStatusValue` already exists at `architect-core/src/validation/fsm/validator.ts:52` as a non-exported local function. `ProcessStatusSchema = z.enum(PROCESS_STATUS_VALUES)` exists at `domain-enums.ts:26` but isn't re-exported as `StatusValueSchema`. Adding `export` to one function + 2 re-export lines unblocks:**
- Guard's 3 `as ProcessStatusValue` casts at `detect-changes.ts:414,440,452` (C-GUARD-1)
- Projection's 3 `Set.has` narrowing sites (M-PROJ-F-4)
- Core's own C-CORE-5 FSM trust-boundary recipe

**The infrastructure for closing the family's most critical cross-package finding is already written. It just isn't exported.**

The Critical findings reveal **a single cross-package contract failure made worse on both sides** (the FSM trust-boundary collapse — guard casts BEFORE feeding core's validator; core casts AFTER its type guard rejects), **the family's worst dogfood leakage** (`tier-a-baseline.ts` ships 1,138 LOC of hardcoded in-repo paths through the public barrel as `TIER_A_LINT_BASELINE`), **94% dead barrel surface** (only 9 of ~150 exports are externally consumed), **no package README at all**, and **11 phantom PDR-005 references** (5 in guard source, 1 in core source, 5 in docs/docs-sources — including `lint-process.ts:170` which puts PDR-005 in `architect-guard --help` user output).

The cleanup-agent rebalanced Phase 1's `git/` re-homing direction: Phase 1 H-GUARD-3 said move to core because "consumed by core" — Phase 2B grep showed `git/` is only consumed by `process-guard/detect-changes.ts` inside guard. Correct refactor: **demote** to `src/lint/process-guard/_git/`, not promote to core. Phase 2 supersedes Phase 1.

Guard has **no `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chains anywhere** — it does NOT expose to the family-wide Zod 4 strictness-loss bug that projection (C-PROJ-1, CP4A-Sharpened-1) and core (F4A-H-6) carry. Preserve by using `z.strictObject({ ...Base.shape, ... })` spread during the upcoming sweep.

**Total cost of full doctrine compliance for guard: ~+200 net LOC** (from 4A reframe). Plus ~1,150 LOC deletion (Phase 2 simplification). Net: substantial deletion + small additive doctrine fixes.

## Findings by Priority

### Critical (P0)

| ID | Title | Locations |
|----|-------|-----------|
| **F4A-G-1** | **One-line core export of `isValidStatusValue` + `StatusValueSchema`** unblocks family's most critical FSM cross-package finding | `architect-core/src/validation/fsm/{validator,index}.ts` |
| C-GUARD-1 + C-CORE-5 | FSM trust-boundary collapse — guard adds 3 fresh `as ProcessStatusValue` casts on raw regex captures; consumes core's lying `validateTransition`; zero FSM transition tests anywhere | `detect-changes.ts:414,440,452`, `decider.ts:300`, `decider.ts:314` (can throw `TypeError`) |
| C-GUARD-2 / Cleanup-C-GUARD-2 | `tier-a-baseline.ts` 1,138 LOC dogfood leak in published barrel as `TIER_A_LINT_BASELINE` (45.8 KB / 7.8% of tarball; zero consumers can override) | `src/lint/tier-a-baseline.ts` |
| C-GUARD-3 | Doctrine-enforcing package doesn't follow doctrine: 14 hand-written interfaces in `process-guard/types.ts`, zero `z.infer`; `AntiPatternThresholdsSchema` open `z.object` + parallel data literal | `src/lint/process-guard/types.ts`, `src/validation/types.ts:81-99` |
| C-GUARD-4 | `parseAtBoundary` never used despite 3 trust boundaries (git diff text, CLI argv, `dangling-baseline.json`) | `detect-changes.ts`, `cli/*.ts`, `dangling-baseline.ts:102` |
| Cleanup-C-GUARD-1 | **94% dead barrel surface** — only 9 of ~150 exports externally consumed | `src/index.ts` (12 wildcards) |
| Cleanup-C-GUARD-3 / CI-G-C-1 | `packed-dangling-baseline-smoke.mjs` implemented but never invoked. Local-CI equivalent of projection's perf-gate wire-up. | `package.json#prepack` |
| DOC-C-GUARD-1 | Phantom PDR-005 in user-visible `architect-guard --help` output | `cli/lint-process.ts:170` |
| DOC-C-GUARD-2 | **No package README** — only publishable package without one | `packages/architect-guard/README.md` (absent) |
| CI-G-C-2 / DOC-H-GUARD-1 | `@architect-bounded-context:generator` annotation on all 4 `git/` files (wrong — should be `:process-guard`) | `src/git/index.ts:6` + 3 sibling files |

### High (P1) — 25 items

**Architecture / Code quality (15 from Phase 1):**

| ID | Title |
|----|-------|
| H-GUARD-1 | `src/index.ts` 12 `export *` wildcards — public contract unidentifiable |
| H-GUARD-2 | `validate-patterns.ts` 935 LOC mixing 8 concerns |
| H-GUARD-3 | `git/` module re-homing — **Phase 2 supersedes:** demote to `process-guard/_git/`, don't promote to core |
| H-GUARD-4 | Two config-loading APIs (`loadConfig` and `loadProjectConfig`) — consolidate |
| H-GUARD-5 | `getDeliverableWorkflowPatterns` belongs in core's `PatternGraphAPI` |
| H-GUARD-6 | `dangling-baseline.ts` dual-write can silently corrupt consumer `node_modules` |
| H-GUARD-7 | `process-guard-rules.feature:43-48` defers to nonexistent feature suite |
| H-GUARD-8 | Phantom PDR-005 references (now 11 total — see DOC inventory below) |
| H-GUARD-9 | `validateCompletionMetadata` core deletion creates DoD gap — guard has no equivalent |
| H-GUARD-10 | `package.json#exports` only `.` + `./package.json` — no curated subpaths |
| H-GUARD-11 | `tier-a-baseline.ts` family-wide structural lock |
| H-GUARD-12 | Dual `console.*` paths + raw `Error` throws vs typed `ProjectionError`-style |
| H-GUARD-13 | `dangling-baseline.json` build-time copy fragile to consumer-side absence |
| H-GUARD-14 | `lint/` no shared error/diagnostic type across the 3 sub-modules |
| Cleanup-H-GUARD-1 | Replace 12 wildcards in `src/index.ts` with 9 explicit named exports |

**Testing / Documentation (10):**

| ID | Title |
|----|-------|
| TC-C-GUARD-1 | FSM transition tests on combined core+guard path (Scenario Outline: 4 legal + 3 illegal + 1 garbage) |
| TC-C-GUARD-2 | `cli/validate-patterns.ts` 934 LOC zero tests |
| TC-H-GUARD-1 | `checkScopeCreep`, `checkSessionScope` zero scenarios despite false "Verified by step bindings" claim |
| TC-H-GUARD-2 | `dangling-baseline.ts` in-process functions zero tests |
| TC-H-GUARD-3 | **4 of 5 anti-pattern sub-detectors NEVER REACHED** (`features: []` in tests) |
| TC-H-GUARD-4 | `derive-state.ts` (172 LOC) zero tests |
| TC-H-GUARD-5 | DoD failure paths zero tests |
| TC-H-GUARD-7 | Wire `packed-dangling-baseline-smoke.mjs` to `prepack` (one line) — same as Cleanup-C-GUARD-3 |
| DOC-H-GUARD-2 | `lint/steps/` (7 of 8 files) + `lint/idea-tier/` (4 of 4) unannotated |
| DOC-H-GUARD-5 | `AGENTS.md:165` cites `ProcessGuard` — symbol doesn't exist in barrel |

**Language / Framework (3 net-new from 4A):**

| ID | Title |
|----|-------|
| F4A-G-H-2 | Zero `.brand<>()` declarations across 38 files; `sanitizeBranchName` should be a brand constructor (family-wide gap) |
| F4A-G-H-3 | 4 CLI bins parse argv by hand into hand-rolled interfaces (~360 LOC, zero Zod at trust boundary); `parseInt + isNaN` × 5 |
| F4A-G-H-5 | 3 `void main()` async-call sites evade `no-suppression-comments` (same hazard as core F4A-H-9) |

### Medium (P2) — ~25 items abbreviated

`node:` prefix inconsistent in 7 files; vitest `include` pattern family-wide drift; 4 step files missing `AfterEachScenario`; `loadConfig` deletion (12-line wrapper, 4 of 6 callers already migrated); DOC-M ADR mis-citation (`anti-patterns.ts:51` cites ADR-001 should be ADR-007); anti-pattern detector emits via `console.log` instead of diagnostic channel; `tier-a-baseline` JSON empty `[]`; `docs/VALIDATION.md` + `docs/PROCESS-GUARD.md` carry "deprecated — superseded by auto-generated docs" but replacement is gitignored.

### Low (P3) — ~12 items abbreviated

Regex hoisting; error-message capitalization; dead exports; W7/W1.5 stale comments; `tests/.DS_Store`; `Array.from`/`new Array` micro-optimizations; `as never` in test fixture (`guard-runtime.steps.ts:78`).

## Phantom PDR-005 inventory (11 sites)

| Location | Type | Visibility |
|----------|------|-----------|
| `architect-guard/src/lint/process-guard/index.ts:14` | source | low |
| `architect-guard/src/lint/process-guard/types.ts:29` | source | low |
| `architect-guard/src/lint/process-guard/decider.ts:33,58` | source (×2) | low |
| `architect-guard/src/cli/lint-process.ts:170` | **CLI help output** | **HIGH (user-visible)** |
| `architect-core/src/taxonomy/registry-builder.ts:162` | source | low |
| `architect-guard/docs/VALIDATION.md` | doc | medium |
| `architect-guard/docs/GHERKIN-PATTERNS.md` | doc | medium |
| `architect-guard/docs-sources/gherkin-patterns.md` | **doc source feeding generator** | **HIGH (propagates)** |
| (3 additional low-priority sites per 3B grep) | | |

**Decision: author PDR-005 (the FSM enforcement IS decision-worthy) or strip all 11 references in one coordinated PR.**

## Action Plan — ordered by leverage and dependency

### Sweep 1: Single-line cross-package unblock (1 hour)

1. **F4A-G-1** — `export function isValidStatusValue` in core + add `StatusValueSchema` re-export. **Highest leverage in entire family review** — unblocks 3 guard sites + 3 projection sites + core's C-CORE-5.

### Sweep 2: Wire local CI (1 hour)

2. **CI-G-C-1 / TC-H-GUARD-7** — wire `prepack` to run `packed-dangling-baseline-smoke.mjs`. One line. Catches dist-resource regressions before every publish.

### Sweep 3: Quick doctrine fixes (1-2 hours)

3. **C-GUARD-3 / F4A-G-2** — `AntiPatternThresholdsSchema` → `z.strictObject`; `DEFAULT_THRESHOLDS = Schema.parse({})`.
4. **CI-G-C-2 / DOC-H-GUARD-1** — change `git/` `@architect-bounded-context:generator` → `:process-guard` on 4 files.
5. **Phantom PDR-005 cleanup** — decide (author or strip); land all 11 references in one coordinated PR.

### Sweep 4: FSM trust-boundary integration (2-4 hours, depends on Sweep 1)

6. **C-GUARD-1** — apply `parseAtBoundary(StatusValueSchema, captured)` at `detect-changes.ts:414,440,452`; drop 3 casts.
7. **C-GUARD-4** — apply `parseAtBoundary` at CLI argv + `dangling-baseline.ts:102`.
8. **TC-C-GUARD-1** — add `tests/features/validation/fsm-transitions-via-guard.feature` (8 scenarios). Land coordinated with core TD-CORE-3.

### Sweep 5: Barrel curation + deletions (4-8 hours)

9. **Cleanup-H-GUARD-1 + H-GUARD-1** — `src/index.ts` 12 wildcards → 9 named exports.
10. **C-GUARD-2 / Cleanup-C-GUARD-2** — `tier-a-baseline.ts` deletion + JSON migration following `dangling-baseline.ts` template.
11. **C-GUARD-3 / F4A-G-H-1** — `process-guard/types.ts` 14 interfaces → `z.infer` sweep.

### Sweep 6: Documentation (4 hours)

12. **DOC-C-GUARD-2** — create `packages/architect-guard/README.md` using projection's README as template.
13. **DOC-H-GUARD-5** — fix `AGENTS.md:165` to cite actual exports.
14. **DOC-H-GUARD-2** — annotate `lint/steps/` + `lint/idea-tier/` modules.
15. **DOC-H-GUARD-7/8** — document CLI `--all` `main` hardcoding + `tier-a` baseline override (post-Phase 2).
16. **DOC-H-GUARD-6** — either ungitignore `docs-live/` or remove deprecation banners from `docs/`.

### Sweep 7: Module restructuring (1 week)

17. **H-SIMP-1 / H-GUARD-2 / TC-C-GUARD-2** — split `validate-patterns.ts` 935 LOC into 6 files; add tests for each pure helper.
18. **H-SIMP-2 / H-GUARD-4** — delete `loadConfig`, migrate 2 remaining callers.
19. **H-SIMP-5 / H-GUARD-5** — move `getDeliverableWorkflowPatterns` to core's `PatternGraphAPI`.
20. **Cleanup-H-GUARD-3 / H-GUARD-3** — demote `git/` to `lint/process-guard/_git/` (Phase 2 supersedes Phase 1 direction).
21. **TC-H-GUARD-1 through TC-H-GUARD-5** — coverage backfill for the 4 unreachable anti-pattern sub-detectors, `dangling-baseline` in-process tests, `derive-state`, DoD failure paths, scope-creep/session-scope.

### Sweep 8: Family-wide normalization (master report)

22. **F4A-G-H-3** — CLI argv Zod-first sweep (4 bins, ~360 LOC → Zod argv schemas).
23. **F4A-G-H-2** — adopt core's brands in `git/`; consume `BranchName`/`StagedFile` types.
24. **F4A-G-H-5** — `no-restricted-syntax` ESLint rule banning `void main()` (also closes core F4A-H-9).
25. **CI-G-H-4** — promote `packed-dangling-baseline-smoke.mjs` to workspace-level `pack-smoke.mjs`.
26. **CL-CORE-3 (family)** — disable `sourceMap`/`declarationMap`. 583 KB → ~392 KB tarball.
27. **CL-CORE-11 (family)** — align `typecheck` scope across all packages. **Guard already correct.**
28. **CI workflows** — `.github/workflows/{ci,publish}.yml`. Provenance attestation activates after.

## What's healthy (preserve)

- Zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`/`void X` in src — matches family.
- **Most disciplined `typecheck` posture in family** (covers both `tsconfig.json` AND `tsconfig.test.json`; only `architect-cli` matches).
- **`dangling-baseline.ts:7-15`** is the **projection-reference-quality template** for the `tier-a-baseline` migration.
- **No `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` chains** — guard does NOT expose to the family-wide Zod 4 strictness-loss bug.
- `scripts/copy-dangling-baseline.mjs` build copier — robust, model for `tier-a-baseline` migration.
- `scripts/packed-dangling-baseline-smoke.mjs` — excellent infrastructure, just needs wire-up + workspace promotion.
- `Result<T, E>` discipline at internal boundaries — matches family.
- Dependencies pristine (zero drift across family-wide pins).
- `hierarchy-parent-level-mismatch.steps.ts` — reference quality for its scope.
- `vitest-cucumber` harness shape in `guard-runtime.steps.ts:50-62` — correct temp-dir + `AfterEachScenario`.

## Cross-package implications for master report

1. **F4A-G-1 is the single highest-leverage edit in the entire review.** One-line core export unblocks C-CORE-5 + C-GUARD-1 + M-PROJ-F-4. Master report should call this out prominently.
2. **The FSM trust-boundary collapse spans core + guard.** Both packages defer testing to "the other side" — a process finding, not just a code finding. Master report should propose the integrated test plan.
3. **`tier-a-baseline.ts` is a family-wide structural lock** — projection's H-PROJ-A-5 (split `render-markdown.ts`) and similar refactors cannot land without guard's baseline update in the same PR. Make baseline external (JSON + override).
4. **`validateCompletionMetadata` deletion in core leaves a DoD gap in guard.** Either preserve the logic in guard before core deletes, or accept the deletion as a feature loss.
5. **Phantom PDR-005 (11 sites) is a single PR spanning 3 packages.** Coordinated cleanup.
6. **The `git/` module bounded-context defect** (`:generator` should be `:process-guard`) is the first such defect found — Phase 4 should audit family-wide for similar annotation correctness.
7. **`packed-dangling-baseline-smoke.mjs` workspace promotion** is the local-CI complement to projection's perf-gate wire-up. Both are 1-line fixes today; both should land before GitHub Actions.
8. **README absence** is unique to guard among publishable packages. Family-wide doc audit should check for similar gaps (architect-mcp, architect-cli — flag for upcoming reviews).
9. **Zero `.extend()`/`.omit()` chains in guard** is reference quality — preserve. The family-wide Zod 4 strictness-loss audit script (proposed in projection) should NOT flag guard.
10. **Custom audit scripts**: projection has 2; guard has 0 (but consumes guard's smoke-test infrastructure differently); core has 0. Family-wide promotion opportunity.
11. **94% dead barrel surface** is unique to guard's severity. Family-wide audit needed in master report — cli and mcp may also have substantial dead surface.
12. **Test-to-source ratio worst in family** (14 scenarios / 9,135 SLOC) is structural finding. Master report should set a coverage target.

## Numbers

- **Findings logged:** 10 Critical (8 net-new + 2 reconfirmed from core's C-CORE-5) + 25 High + ~25 Medium + ~12 Low.
- **Cross-cutting recipes** closing multiple findings: 6 (F4A-G-1 one-line edit; `tier-a-baseline` migration; barrel curation + dead-export deletion; FSM transition tests; phantom PDR-005 cleanup; family-wide tsconfig fix).
- **Total cost of doctrine compliance:** ~+200 net LOC (additive, after deletions).
- **Total deletion estimate:** ~1,150 LOC.
- **Tarball reduction:** 583 KB → ~392 KB (46%) after Phase 2 + family-wide sourcemap fix.
- **Test scenarios to add:** ~15 across FSM transitions, `validate-patterns` engine, anti-pattern sub-detectors, `dangling-baseline` in-process, `derive-state`, DoD failure paths.

## Overall verdict

`architect-guard` is **structurally consistent with core** (same doctrine debt cluster) but **operationally disciplined** (build pipeline, typecheck scope, smoke-test infrastructure are family-reference quality — they just aren't all wired or applied uniformly). The package whose anti-pattern detector enforces doctrine on siblings doesn't fully follow doctrine in its own contracts, but the gap is **closable** with the recipes already in the codebase (`dangling-baseline.ts` template) and the family reference (projection's patterns).

The most pressing finding is **F4A-G-1: one-line core export unblocks the family's most critical FSM cross-package finding.** Once that lands, guard's path to doctrine compliance is mechanical sweeps + the `tier-a-baseline` migration + barrel curation. Total cost: 1 week of focused work, ~1,150 LOC deletion, ~+200 LOC of doctrine-aligned additions.

The README absence is the most user-impacting defect. Combined with the phantom PDR-005 in user-visible CLI help, the package's external surface is currently misaligned with what a consumer needs.
