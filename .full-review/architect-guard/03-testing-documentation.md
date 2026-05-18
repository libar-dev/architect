# architect-guard — Phase 3 Consolidated: Testing & Documentation

**Sources:** `raw/3A-test-coverage.md` + `raw/3B-documentation.md`. Findings tagged **[3A]**, **[3B]**, or **[3A+3B]**.

## Executive Summary

Phase 3 confirms guard is **the least-disciplined package in the family on both test and documentation surfaces**, contradicting its role as the doctrine-enforcement package. Headline measurements:

- **Test surface is 14 scenarios / 610 LOC of step code against 9,135 SLOC of production.** The 3 feature files reduce to 2 actually-executable ones (`guard-runtime.feature` 12 scenarios; `hierarchy-parent-level-mismatch.feature` 2 scenarios). **`process-guard-rules.feature` has no step bindings — it is pure narrative documentation** whose "Verified by step bindings" claims at lines 70-72 and 75-77 + the phantom upstream feature suite at 43-48 are **ALL FALSE** (confirmed by grep).
- **Phase 2 inventoried 6 phantom PDR-005 references; Phase 3B found 11 total** — 5 additional in `docs/VALIDATION.md`, `docs/GHERKIN-PATTERNS.md`, `docs-sources/gherkin-patterns.md`. The `docs-sources/` entry **propagates into generated docs**. The most visible: `architect-guard --help` line 170 (`lint-process.ts:170`) emits PDR-005 in user-visible CLI output.
- **`@libar-dev/architect-guard` is the only publishable package in the family without a package-level README.** Four consumer-facing CLIs and nine externally-consumed JS symbols are entirely undocumented at the package root.
- **JSDoc coverage 55%** but the gap is structural: the entire `lint/steps/` subsystem (7 of 8 files) and entire `lint/idea-tier/` subsystem (4 of 4 files) are unannotated. `dangling-baseline.ts` — containing 3 of the 9 externally-consumed symbols — has no JSDoc header at all.
- **`@architect-bounded-context:generator` on all four `git/` files is a Critical doctrine defect.** Under "Architect State is Code" any PatternGraph query filtering by bounded-context will misclassify these modules.

Three highest-leverage critical gaps:

1. **TC-C-GUARD-1: FSM rejection path is untested across BOTH core and guard.** `detect-changes.ts:440,452` casts raw regex captures to `ProcessStatusValue`; `decider.ts:300` passes them to core's lying `validateTransition`; `decider.ts:314` calls `.join(', ')` on what can be `undefined` for garbage input → runtime `TypeError`. The `process-guard-rules.feature:43-48` "phase-state-machine feature suite" deferred-to does not exist anywhere. **One feature file (Scenario Outline: 4 legal + 3 illegal + 1 garbage) lands the coverage. Pair with core TD-CORE-3 in the same PR.**

2. **TC-C-GUARD-2: `cli/validate-patterns.ts` 934 LOC has zero tests.** The primary cross-source validation engine, the `parseArgs` trust boundary, and `runValidatePatternsCli` are all untested. Phase 2 H-SIMP-1 proposes a 6-file split — splitting first then testing each pure helper is the maintainable order.

3. **DOC-C-GUARD-1: phantom PDR-005 in user-visible CLI help.** `lint-process.ts:170` emits the phantom citation. Highest-severity instance because end-users see it.

## Critical (P0)

### TC-C-GUARD-1. FSM rejection path zero coverage (cross-package) **[3A]**

Combined gap with core TD-CORE-3. **Recipe:**

```gherkin
# tests/features/validation/fsm-transitions-via-guard.feature
Feature: FSM transition validation through guard's process-guard

  Scenario Outline: <case> transitions are validated correctly
    Given a process-guard call with from "<from>" and to "<to>"
    When the transition is checked
    Then the result is "<valid>"
    And no TypeError is thrown

    Examples:
      | case    | from         | to         | valid |
      | legal-1 | candidate    | roadmap    | true  |
      | legal-2 | roadmap      | active     | true  |
      | legal-3 | active       | completed  | true  |
      | legal-4 | active       | rejected   | true  |
      | illegal-1 | candidate  | completed  | false |
      | illegal-2 | rejected   | active     | false |
      | illegal-3 | completed  | active     | false |
      | garbage | not-a-status | active     | false |
```

Land in same PR as core's TD-CORE-3 + Phase 2 Cleanup recipe (parseAtBoundary at `detect-changes.ts:414,440,452`).

### TC-C-GUARD-2. `cli/validate-patterns.ts` 934 LOC untested **[3A]**

Phase 2 H-SIMP-1 proposes 6-file split. **Recipe (sequence):** land the split first; then add `tests/features/validation/validate-patterns-engine.feature` with fixture-based `RuntimePatternGraph` inputs covering matched/unmatched/DoD paths.

### DOC-C-GUARD-1. Phantom PDR-005 in user-visible CLI help **[3B]**

`packages/architect-guard/src/cli/lint-process.ts:170` emits the citation. Combined with Phase 2 Cleanup-H-GUARD-8 (5 source + 1 core references) and Phase 3B (5 additional in `docs/` and `docs-sources/`), **total 11 phantom references**. Recipe: decide (author PDR-005 or strip all 11). Either fix should land in one PR.

### DOC-C-GUARD-2. No package-level README **[3B]**

Only publishable package without one. **Recipe:** create `packages/architect-guard/README.md` with: install, the 4 CLI bins + flags, the 9 externally-consumed JS symbols, baseline override mechanism (post-Phase 2), configuration (`architect.config.ts`), ADR links (ADR-003 enforcement role; ADR-007 taxonomy; ADR-009 trust boundary it should adopt but doesn't). Use projection's README as template.

## High (P1)

### Test coverage

| #            | Title                                                                                                                                                                                   | Action                                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-H-GUARD-1 | `decider.ts:343,385` (`checkScopeCreep`, `checkSessionScope`) have zero scenarios despite `process-guard-rules.feature` claiming "Verified by step bindings" (false)                    | Add 2 scenarios to `guard-runtime.feature` matching the completed-protection test pattern.                                                                                                                                                                 |
| TC-H-GUARD-2 | `dangling-baseline.ts` — `compareDanglingBaseline`/`writeDanglingBaseline`/`normalizeDanglingBaselineEntries` zero in-process tests; smoke script only covers `readDanglingBaseline`    | Add `tests/features/lint/dangling-baseline.feature` (5 scenarios, temp-dir fixtures).                                                                                                                                                                      |
| TC-H-GUARD-3 | **4 of 5 anti-pattern sub-detectors NEVER REACHED** (`detectRemovedTags`, `detectMagicComments`, `detectScenarioBloat`, `detectMegaFeature`) because existing tests pass `features: []` | Add 4 scenarios with feature-content fixtures.                                                                                                                                                                                                             |
| TC-H-GUARD-4 | `derive-state.ts` (172 LOC) zero tests                                                                                                                                                  | Add coverage for the state-derivation paths.                                                                                                                                                                                                               |
| TC-H-GUARD-5 | DoD failure paths zero tests                                                                                                                                                            | Add coverage.                                                                                                                                                                                                                                              |
| TC-H-GUARD-6 | `process-guard-rules.feature:46` (phantom upstream suite), `:70-72`, `:75-77` (phantom step bindings) — load-bearing documentation with false claims                                    | Update references when the corresponding test files land per TC-C-GUARD-1 and TC-H-GUARD-1.                                                                                                                                                                |
| TC-H-GUARD-7 | `packed-dangling-baseline-smoke.mjs` unwired                                                                                                                                            | **Recipe: wire `prepack` to run it: `"prepack": "pnpm clean && pnpm build && node scripts/packed-dangling-baseline-smoke.mjs"`.** No CI required; catches dist-resource regressions before every publish. Workspace promotion (Cleanup-H-GUARD-4) follows. |

### Documentation

| #              | Title                                                                                                                                                      | Action                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| DOC-H-GUARD-1  | `@architect-bounded-context:generator` on all 4 `git/` files — wrong annotation, Critical doctrine defect                                                  | Change to `:process-guard` immediately, independent of Phase 2 Cleanup-H-GUARD-3 demotion decision. |
| DOC-H-GUARD-2  | Entire `lint/steps/` (7 of 8 files) + `lint/idea-tier/` (4 of 4 files) unannotated                                                                         | Add `@architect-pattern` module blocks.                                                             |
| DOC-H-GUARD-3  | `dangling-baseline.ts` (3 externally-consumed symbols) no JSDoc header                                                                                     | Add module + function-level JSDoc.                                                                  |
| DOC-H-GUARD-4  | `src/index.ts` no header — public contract invisible                                                                                                       | Add header (matches core TD-CORE-4 recipe).                                                         |
| DOC-H-GUARD-5  | `AGENTS.md:165` cites `ProcessGuard` — symbol does not exist in the barrel                                                                                 | Replace with `runLintProcessCli` + dangling-baseline functions.                                     |
| DOC-H-GUARD-6  | `docs/VALIDATION.md` + `docs/PROCESS-GUARD.md` carry "Deprecated — superseded by auto-generated docs" banner; replacement lives in gitignored `docs-live/` | Either ungitignore the live docs or remove the deprecation banner.                                  |
| DOC-H-GUARD-7  | All 4 CLIs hardcode `main` as the branch for `--all` mode with no documentation                                                                            | Document the limitation in CLI help text.                                                           |
| DOC-H-GUARD-8  | `architect-lint-patterns --help` doesn't explain tier-A baseline or its absence of override                                                                | Document; flag for update after Phase 2 H-SIMP-6 `--baseline` flag lands.                           |
| DOC-H-GUARD-9  | Zero `@architect-decision`/`@architect-see-also` annotations in guard source despite being ADR-003 enforcement point                                       | Add. `anti-patterns.ts:51` cites ADR-001 — should be ADR-007.                                       |
| DOC-H-GUARD-10 | MIGRATION.md correctly maps the `architect-guard` bin but entirely omits the guard JS API surface                                                          | Add v1→v2 mapping for `runLintProcessCli`/`compareDanglingBaseline`/etc.                            |

## Medium / Low — abbreviated

Phase 3A medium: temp-dir fixtures missing on 3 scenarios; `.skip`/`.only` audit (clean — none found); `tests/fixtures/` directory absent (compared to projection).

Phase 3B medium: docs-sources/gherkin-patterns.md phantom PDR-005 propagation; ADR-001 vs ADR-007 mis-citation; module-level annotations missing on 17 files (45% gap).

## Annotation rate audit (consolidated from Phase 3B)

| Area                  | Annotated / Total               | Notes                                         |
| --------------------- | ------------------------------- | --------------------------------------------- |
| `cli/`                | partial                         | 4 CLI entrypoints annotated; helpers not.     |
| `git/`                | annotated but **wrong context** | All 4 files carry `:generator` annotation.    |
| `lint/process-guard/` | partial                         | Core members annotated; `types.ts` not.       |
| `lint/steps/`         | 1 of 8                          | Subsystem invisible to PatternGraph.          |
| `lint/idea-tier/`     | 0 of 4                          | Subsystem invisible to PatternGraph.          |
| `validation/`         | partial                         | Most files annotated; `types.ts` not.         |
| `src/index.ts`        | no header                       | (DOC-H-GUARD-4)                               |
| **Overall**           | **21 of 38 = 55%**              | Behind projection (60%), ahead of core (26%). |

## The phantom PDR-005 inventory (final)

| Location                                                           | Type                             | Visibility              |
| ------------------------------------------------------------------ | -------------------------------- | ----------------------- |
| `packages/architect-guard/src/lint/process-guard/index.ts:14`      | source                           | low                     |
| `packages/architect-guard/src/lint/process-guard/types.ts:29`      | source                           | low                     |
| `packages/architect-guard/src/lint/process-guard/decider.ts:33,58` | source (×2)                      | low                     |
| `packages/architect-guard/src/cli/lint-process.ts:170`             | **CLI help output**              | **HIGH (user-visible)** |
| `packages/architect-core/src/taxonomy/registry-builder.ts:162`     | source                           | low                     |
| `packages/architect-guard/docs/VALIDATION.md`                      | doc                              | medium                  |
| `packages/architect-guard/docs/GHERKIN-PATTERNS.md`                | doc                              | medium                  |
| `packages/architect-guard/docs-sources/gherkin-patterns.md`        | **doc source feeding generator** | **HIGH (propagates)**   |
| (1-2 more low-priority sites per 3B grep)                          |                                  |                         |

**11 total** vs Phase 2's inventory of 6. Decision: author PDR-005 or strip all 11 in one coordinated PR.

## CLI help-text audit

| Bin                       | Status                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| `architect-guard`         | **Phantom PDR-005 in help output** (DOC-C-GUARD-1).                   |
| `architect-validate`      | Accurate; `--update-baseline` flag correctly documented.              |
| `architect-lint-steps`    | Accurate text; module unannotated (invisible to PatternGraph).        |
| `architect-lint-patterns` | Does not explain tier-A baseline absence-of-override (DOC-H-GUARD-8). |
| All 4                     | Hardcoded `main` branch for `--all`, undocumented (DOC-H-GUARD-7).    |

## ADR linkage table

| ADR                                       | Relevance to guard                                | Currently referenced?                                            |
| ----------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| ADR-003 Source-First Pattern Architecture | **Guard is the enforcement point**                | **Zero `@architect-decision`/`@architect-see-also` annotations** |
| ADR-007 Coordinated Taxonomy Redesign     | `anti-patterns.ts:51` cites this concept          | **Cites ADR-001 incorrectly**                                    |
| ADR-009 Projection Trust Boundary         | Guard violates by omission (no `parseAtBoundary`) | Not cited; should reference + remediate per Phase 2 C-GUARD-4    |
| (Phantom PDR-005)                         | Cited 11 times                                    | **Does not exist**                                               |

## What's well-tested (preserve)

- `hierarchy-parent-level-mismatch.steps.ts` — reference quality for its scope. Direct rule-function unit test, positive + negative scenario, `AfterEachScenario` cleanup.
- `guard-runtime.steps.ts` has the correct **structural shape** (temp-dir tracking, `AfterEachScenario` reset) — it's the right harness applied to too few scenarios.
- `detectFileChanges` integration test initializes a real git repo and is a genuine regression guard for the happy-path detection pipeline.

## Critical context for Phase 4

- **Wiring `packed-dangling-baseline-smoke.mjs` into `prepack`** is a one-line fix (TC-H-GUARD-7) that Phase 4 (CI/DevOps) should treat as the local-CI equivalent of the perf gate wire-up in projection (Cleanup-C-PROJ-1).
- **Phase 4 should audit the rest of the family for `@architect-bounded-context:` annotation correctness** — guard's `git/` wrong-context is the first such defect found.
- **The 11-phantom-PDR-005 cleanup is a single PR** but spans 3 packages (guard, core, projection's docs-sources). Family-level fix.
- **README absence + AGENTS.md drift** suggests guard's documentation has been maintained out-of-sync with the code for some time. Phase 4 should consider whether projection's `jsdoc-boilerplate-audit.mjs` extension could catch missing-README class defects too.
