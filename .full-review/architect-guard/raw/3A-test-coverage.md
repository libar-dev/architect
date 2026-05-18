# architect-guard — Phase 3A: Test Coverage

## Executive Summary

`architect-guard` has the worst test-to-source ratio in the family: 2 step files (610 LOC) drive 3 feature files (83 scenarios + narrative) against 9,135 SLOC across 38 source modules. The existing tests are well-structured — `guard-runtime.steps.ts` exercises 8 of the package's 10 callable entry-points and has `AfterEachScenario` cleanup — but coverage is almost entirely happy-path integration smoke. Zero tests exist for the FSM rejection path, the scope-creep rule, the session-scope rule, `dangling-baseline.ts`'s in-process comparison logic, or any of the 934-LOC `validate-patterns.ts` pipeline. The most critical gap is the cross-package FSM chain: `detect-changes.ts:440,452` casts unchecked regex captures to `ProcessStatusValue`, `decider.ts:300` calls core's `validateTransition`, and core's `getValidTransitionsFrom` can return `undefined` for garbage input, causing a runtime `TypeError` on `.join(', ')` — and this entire production path has zero tests on either side (also core TD-CORE-3). `process-guard-rules.feature:43-48` defers FSM-validity testing to a "phase-state-machine feature suite" that does not exist anywhere in the workspace. `scripts/packed-dangling-baseline-smoke.mjs` is the only post-pack publish-contract test in the family and is wired only as an optional `test:pack-smoke` script, never invoked by `test`, `prepack`, or CI.

---

## Module Coverage Map

| Module (path under `src/`) | SLOC | Tested? | Test coverage |
|---|---|---|---|
| `lint/process-guard/detect-changes.ts` | 649 | Partial | `detectFileChanges` integration via `guard-runtime` scenario "Detect status transitions for added files in files mode". Only the happy-path added-file branch. FSM cast sites (lines 414, 440, 452) untested. Inner functions `detectStatusTransitions`, `detectDeliverableChanges`, `detectBranchChanges`, `detectStagedChanges` have zero direct tests. |
| `lint/process-guard/decider.ts` | 518 | Partial | `validateChanges` called in one scenario (completed-protection rule only). `checkStatusTransitions` (decider:286) not reached by any test. `checkScopeCreep` (decider:343) not reached. `checkSessionScope` (decider:385) not reached. Helpers `hasErrors`, `hasWarnings`, `getAllIssues`, `getViolationsByRule`, `summarizeResult` untested. |
| `lint/tier-a-baseline.ts` | 1,138 | None | Zero tests. Deletion-bound per Cleanup-C-GUARD-2; do not add tests. |
| `cli/validate-patterns.ts` | 934 | None | `validatePatterns` (934 LOC, the package's largest validation function), `parseArgs`, `printHelp`, `runValidatePatternsCli` — zero tests. |
| `validation/anti-patterns.ts` | 437 | Partial | `detectAntiPatterns` and `detectProcessInCode` covered via 2 guard-runtime scenarios. `detectRemovedTags`, `detectMagicComments`, `detectScenarioBloat`, `detectMegaFeature`, `formatAntiPatternReport`, `toValidationIssues` — zero tests. |
| `validation/dod-validator.ts` | 263 | Partial | `validateDoDForPhase` covered by one scenario (happy path: DoD met). `validateDoD`, `getDeliverableWorkflowPatterns`, `isDeliverableComplete`, `hasAcceptanceCriteria` — zero tests. Failure paths (missing deliverables, missing acceptance-criteria) untested. |
| `lint/dangling-baseline.ts` | 139 | None | `readDanglingBaseline`, `writeDanglingBaseline`, `compareDanglingBaseline`, `normalizeDanglingBaselineEntries` — zero in-process tests. Only exercised by the unwired `packed-dangling-baseline-smoke.mjs`. |
| `lint/idea-tier/idea-tier-checks.ts` | 278 | Partial | `runIdeaTierChecks` indirectly via 5 `runIdeaTierLint` scenarios. Individual check functions (`checkLineBudget`, `checkNoScenarios`, `checkNoBackground`, `checkRuleHasInvariant`, `checkTagMinimum`, `detectIdeaTier`) have no direct unit tests; threshold edges untested. |
| `lint/idea-tier/runner.ts` | 94 | Partial | `runIdeaTierLint` covered via the 5 idea-tier scenarios in `guard-runtime.feature`. |
| `lint/engine.ts` | 300 | Partial | `runLintEngine` reached transitively via `runStepLint`. JSON output path, `formatLintOutput`, `filterRules` untested. |
| `lint/rules.ts` | ~150 | Partial | `hierarchyParentLevelMismatch` has 2 direct scenarios (positive + negative). Other rules (`defaultRules`, `missingStat`, `missingRelationshipTarget`, etc.) untested. |
| `lint/steps/runner.ts` | 175 | Partial | `runStepLint` covered by one happy-path scenario. Error paths (missing step file, unpaired feature) untested. |
| `lint/steps/pair-resolver.ts` | 90 | None | `resolveFeatureStepPairs` — zero direct tests. |
| `lint/steps/cross-checks.ts` | ~100 | None | Cross-check rules — zero tests. |
| `lint/steps/feature-checks.ts` | ~100 | None | Feature-file check rules — zero tests. |
| `lint/steps/step-checks.ts` | ~100 | None | Step-file check rules — zero tests. |
| `lint/process-guard/derive-state.ts` | 172 | None | `deriveProcessState` — zero tests. This is the read-model builder upstream of `validateChanges`. |
| `lint/process-guard/session-state-reader.ts` | 241 | None | Session state reading — zero tests. |
| `git/branch-diff.ts` | 59 | None | Zero tests. |
| `git/helpers.ts` | 72 | None | `execGitSafe`, `sanitizeBranchName` — zero tests. |
| `git/name-status.ts` | 77 | None | `parseGitNameStatus` — zero tests. |
| `cli/lint-patterns.ts` | ~389 | None | `runLintPatternsCli` — zero tests. |
| `cli/lint-process.ts` | ~391 | None | `runLintProcessCli` — zero tests. |
| `cli/lint-steps.ts` | ~223 | None | `runLintStepsCli` — zero tests. |
| `validation/types.ts` | ~50 | Partial | Types consumed; `AntiPatternThresholdsSchema` open `z.object` per Cleanup-M-GUARD-1. |
| `scripts/packed-dangling-baseline-smoke.mjs` | 81 | Unwired | Present; exercises `readDanglingBaseline` + missing-resource negative path. Not in `test`, `prepack`, or CI. |

---

## Findings by Severity

### Critical (P0)

#### TC-C-GUARD-1. FSM rejection path — zero tests across the entire production chain

**File:line:** `detect-changes.ts:414,440,452`; `decider.ts:286-333`; core `validation/fsm/validator.ts:88-105`

**Gap:** The three `as ProcessStatusValue` casts in `detect-changes.ts` accept any lowercase string that passes an `Array.includes` guard at line 414. Lines 440 and 452 re-cast the raw captured string without re-validation. These feed into `decider.ts:300` which calls core's `validateTransition`. If the FSM rejects the transition, `decider.ts:303` calls `getValidTransitionsFrom(transition.from)` — which returns `undefined` for an unknown state — and `decider.ts:314` calls `.join(', ')` on the `undefined` result: runtime `TypeError`. The entire path from a bad `@architect-status` tag in a git diff to a thrown TypeError has zero test coverage. `process-guard-rules.feature:43-48` explicitly defers coverage of this path to "the upstream `phase-state-machine` feature suite" which does not exist in any package.

**Recipe (lands with core TD-CORE-3, per Phase 2 Sweep 3):**

Add `tests/features/validation/fsm-transitions-via-guard.feature`:

```gherkin
Feature: FSM transition validation via guard decider

  Rule: Legal transitions are accepted

    Scenario Outline: Legal FSM transition is not flagged
      Given a process state with file "spec.feature" at status "<from>"
      And a change set with a status transition from "<from>" to "<to>"
      When I validate the changes
      Then no "invalid-status-transition" violation is reported

      Examples:
        | from     | to       |
        | roadmap  | active   |
        | active   | completed|
        | active   | parked   |
        | parked   | active   |

  Rule: Illegal transitions are rejected

    Scenario Outline: Illegal FSM transition emits a violation
      Given a process state with file "spec.feature" at status "<from>"
      And a change set with a status transition from "<from>" to "<to>"
      When I validate the changes
      Then one "invalid-status-transition" violation is reported

      Examples:
        | from      | to       |
        | roadmap   | completed|
        | completed | active   |
        | parked    | completed|

  Rule: Invalid status input does not throw

    Scenario: Garbage "from" status does not cause a TypeError
      Given a process state with file "spec.feature" at status "completed"
      And a change set with a status transition from "not-a-real-status" to "active"
      When I validate the changes
      Then the validation returns a result without throwing
      And one "invalid-status-transition" violation is reported
```

The step file must construct `ProcessState` and `ChangeDetection` directly (same pattern as guard-runtime's completed-protection scenario) — no I/O needed. This also requires core to export `getValidTransitionsFrom` safely (guarded return) per core C-CORE-5 recipe.

---

#### TC-C-GUARD-2. `validate-patterns.ts` 934 LOC — zero tests

**File:line:** `src/cli/validate-patterns.ts:419` (`validatePatterns`), `:155` (`parseArgs`)

**Gap:** `validatePatterns` is the primary cross-source validation engine. It calls `detectAntiPatterns`, `validateDoD`, and baseline comparison. Zero behavioral assertions exist for any of its code paths. The three sentinel behaviors — "missing in Gherkin", "missing in TypeScript", "dangling baseline regression" — are untested. `runValidatePatternsCli` is one of the 9 live barrel symbols; it runs against the real filesystem and is exercised only by manual invocation.

**Recipe:** Add `tests/features/validation/validate-patterns-engine.feature` with a Scenario Outline over `RuntimePatternGraph` fixtures:
- Matched TS+Gherkin pattern pair → no issues.
- TS pattern with no matching Gherkin file → one "missing-in-gherkin" issue.
- Gherkin with no TS counterpart → one "missing-in-typescript" issue.
- Pattern with `@acceptance-criteria` scenario and complete deliverable → DoD met.
- Pattern without acceptance-criteria → DoD violation reported.

Use `buildPatternGraph` with inline fixture strings rather than real files to keep the test pure.

---

### High (P1)

#### TC-H-GUARD-1. `decider.ts` scope-creep and session-scope rules — untested

**File:line:** `decider.ts:343` (`checkScopeCreep`), `decider.ts:385` (`checkSessionScope`)

**Gap:** `process-guard-rules.feature` claims these rules are "verified by: session-scope step bindings in the guard test suite" and "scope-creep step bindings in guard-runtime fixtures" — but `guard-runtime.steps.ts` contains no such bindings. The single `validateChanges` call in tests passes `deliverableChanges: new Map()` (empty), so scope-creep is never triggered. `ignoreSession: false` is set but `changes.modifiedFiles` only contains the completed-spec file, which is caught by protection-level before reaching session-scope. Both rules have zero scenarios that actually fire them.

**Recipe:** Add two `RuleScenario` blocks to `guard-runtime.feature` + steps:
1. `Scope creep: active spec with added deliverable → scope-creep violation`. Build a `ProcessState` with one `active` file; `ChangeDetection` with `deliverableChanges` containing `{ added: ['src/new.ts'] }`.
2. `Session scope: file modified outside session boundary → session-scope warning`. Build `ProcessState` with a session constraint; `changes.modifiedFiles` includes a file outside it.

These are pure-function tests — same pattern as completed-protection. No I/O needed.

---

#### TC-H-GUARD-2. `dangling-baseline.ts` in-process logic — zero tests

**File:line:** `src/lint/dangling-baseline.ts:84` (`readDanglingBaseline`), `:120` (`compareDanglingBaseline`), `:106` (`writeDanglingBaseline`)

**Gap:** The three externally consumed functions (`compareDanglingBaseline`, `writeDanglingBaseline`, `DANGLING_BASELINE_SOURCE_PATH`) are the live barrel symbols. Their behavior — key comparison logic in `createDanglingEntryKey`, `compareDanglingEntries`, new-entries and removed-entries detection — has zero in-process test coverage. The smoke script tests only `readDanglingBaseline` + the missing-file error path; it does not exercise `compareDanglingBaseline` or `writeDanglingBaseline`.

**Recipe:** Add `tests/features/lint/dangling-baseline.feature`:
- Empty baseline + zero current entries → `newEntries: []`, `removedEntries: []`.
- Baseline with one entry, current with same entry → no diff.
- Baseline with entry A, current with entry A+B → `newEntries: [B]`, `removedEntries: []`.
- Baseline with entry A+B, current with entry A → `newEntries: []`, `removedEntries: [B]`.
- Missing baseline file → `readDanglingBaseline` throws with expected message.

All scenarios use `writeFile` to a temp dir for the baseline JSON; no pack step needed.

---

#### TC-H-GUARD-3. Anti-pattern sub-detectors — partially untested

**File:line:** `validation/anti-patterns.ts:148` (`detectRemovedTags`), `:204` (`detectMagicComments`), `:255` (`detectScenarioBloat`), `:287` (`detectMegaFeature`)

**Gap:** `detectAntiPatterns` is called in two scenarios but with empty `features: []`, so `detectRemovedTags`, `detectMagicComments`, `detectScenarioBloat`, and `detectMegaFeature` are never reached. Four of five sub-detectors have zero coverage. `formatAntiPatternReport` and `toValidationIssues` are also untested.

**Recipe:** Extend `guard-runtime.feature` with four scenarios (or add `tests/features/validation/anti-patterns.feature`):
- `detectRemovedTags`: a `ScannedGherkinFile` fixture file with `@architect-brief` tag → one `removed-tag` violation.
- `detectMagicComments`: fixture file with 6 `# GENERATOR:` lines, threshold 5 → one `magic-comments` warning.
- `detectScenarioBloat`: fixture with 21 scenarios, threshold 20 → one `scenario-bloat` warning.
- `detectMegaFeature`: fixture with 501 lines, threshold 500 → one `mega-feature` warning.
- `formatAntiPatternReport` on a mix of errors+warnings → output contains "Errors" and "Warnings" sections.

---

#### TC-H-GUARD-4. `derive-state.ts` — zero tests

**File:line:** `src/lint/process-guard/derive-state.ts:1` (172 LOC)

**Gap:** `deriveProcessState` is the read-model builder. It parses `@architect-status`, protection levels, and deliverable tables from Gherkin files to construct `ProcessState`. Zero tests exist for it. It is called before `validateChanges` in all real usage paths.

**Recipe:** Add 3 scenarios: (a) file with `@architect-status:completed` → `protection: 'hard'`; (b) file with `@architect-status:active` + deliverable table → deliverable list populated; (c) file with no `@architect-status` tag → defaults to `roadmap`.

---

#### TC-H-GUARD-5. DoD failure paths — untested

**File:line:** `validation/dod-validator.ts:96` (`validateDoDForPhase`), `:187` (`validateDoD`)

**Gap:** One happy-path scenario covers `validateDoDForPhase` (DoD met, all deliverables complete, acceptance criteria present). The failure paths — missing deliverables, non-terminal deliverable status, missing acceptance-criteria tag — are untested. `validateDoD` (the full-graph sweep) has zero coverage.

**Recipe:** Add two `RuleScenario` entries to `guard-runtime.feature`:
- Pending deliverable → `isDoDMet: false`, `pendingDeliverables` non-empty.
- No acceptance-criteria scenario → `missingAcceptanceCriteria: true`.

---

#### TC-H-GUARD-6. `validate-patterns.ts` `parseArgs` — untested

**File:line:** `cli/validate-patterns.ts:155` (`parseArgs`)

**Gap:** 120 LOC of argv parsing with flag handling (`--strict`, `--update-baseline`, `--output`, `--verbose`, `--json`, `--base-dir`, etc.) has zero test coverage. This is an unvalidated trust boundary (C-GUARD-4) with no `parseAtBoundary`; testing the raw parser at least catches flag-name changes before they reach users.

**Recipe:** Add a Scenario Outline over `parseArgs` for 6 flag combinations: default (no flags), `--strict`, `--json`, `--update-baseline`, `--base-dir ./foo`, and an unknown flag. Verify the returned `ValidateCLIConfig` shape.

---

### Medium (P2)

#### TC-M-GUARD-1. `process-guard-rules.feature:43-48` phantom suite reference — must be resolved

**File:line:** `tests/features/process-guard-rules.feature:43-48`

**Gap:** Line 46 reads: "the FSM-validity rejection path is covered by the upstream `phase-state-machine` feature suite." This suite does not exist. The feature is narrative-only and exercises no code directly (no step bindings at all beyond what `guard-runtime.feature` already covers). The phantom reference creates a false sense of coverage.

**Recipe:** One of two actions:
- (a) Delete the deferral sentence and replace it with "Verified by: `fsm-transitions-via-guard.feature`" once TC-C-GUARD-1 lands.
- (b) If the intent is a separate FSM-only feature file, create `tests/features/validation/fsm-transitions-via-guard.feature` (TC-C-GUARD-1 recipe) and update the reference to point there.

Do not create a file named `phase-state-machine.feature` — the concept is FSM-transitions-via-guard, not a standalone FSM suite.

---

#### TC-M-GUARD-2. `lint/steps/` sub-modules — untested

**File:line:** `src/lint/steps/pair-resolver.ts:1`, `src/lint/steps/cross-checks.ts:1`, `src/lint/steps/feature-checks.ts:1`, `src/lint/steps/step-checks.ts:1`

**Gap:** `runStepLint` is covered by one happy-path scenario with a trivially minimal fixture (1 scenario, 1 step). All four sub-modules that implement the actual lint rules have zero direct test coverage. The error paths (missing step file, unpaired feature, step definition present but wrong count) are untested.

**Recipe:** Extend `guard-runtime.feature` with two failure-path scenarios:
- Feature file with no matching steps file → `errorCount > 0`.
- Steps file with no matching feature file → `errorCount > 0`.

Then add a `tests/features/lint/step-lint-rules.feature` with one scenario per rule sub-module (cross-check, feature-check, step-check) to provide a targeted regression surface.

---

#### TC-M-GUARD-3. `git/` module — zero tests

**File:line:** `src/git/helpers.ts:1`, `src/git/name-status.ts:1`, `src/git/branch-diff.ts:1`

**Gap:** `parseGitNameStatus` and `sanitizeBranchName` are pure string-parsing functions with zero tests. `execGitSafe` wraps `child_process.spawnSync` and is never mocked or directly tested. These are consumed by `detectStagedChanges` and `detectBranchChanges`, both of which also have zero tests.

**Recipe:** Add `tests/features/git/git-helpers.feature` with:
- `parseGitNameStatus` Scenario Outline over M/A/D/R status codes.
- `sanitizeBranchName` with branch names containing slashes and special chars.

These are pure functions; no real git repo needed.

---

#### TC-M-GUARD-4. `session-state-reader.ts` — zero tests

**File:line:** `src/lint/process-guard/session-state-reader.ts:1` (241 LOC)

**Gap:** Session state reading is called upstream of session-scope checking. No test initializes a session state from config. The module reads config files from disk; it needs a temp-dir fixture like the `runStepLint` scenario already uses.

**Recipe:** One integration scenario: write a minimal `architect.config.ts`-style fixture to a temp dir; call `readSessionState` on it; verify the returned scope matches the config.

---

#### TC-M-GUARD-5. `process-guard-rules.feature` scope-creep and session-scope claim false verification

**File:line:** `tests/features/process-guard-rules.feature:62-77`

**Gap:** The feature claims scope-creep and session-scope rules are "verified by: existing scope-creep step bindings in `guard-runtime` fixtures" and "session-scope step bindings in the guard test suite." Neither binding exists (confirmed by grep). This is the same phantom-suite problem as TC-M-GUARD-1 but for two additional rules.

**Recipe:** Update the "Verified by" lines once TC-H-GUARD-1 lands.

---

### Low (P3)

#### TC-L-GUARD-1. `guard-runtime.steps.ts` uses `as never` casts in test inputs

**File:line:** `tests/steps/guard-runtime.steps.ts:78`, `:107`, `:137`, `:165`

**Gap:** Four `as never` casts suppress type errors on fixture data. This evades compile-time validation of test inputs. If the production type changes, the test continues to compile silently with wrong shape.

**Recipe:** Build fixtures using the actual Zod schemas or explicit `satisfies` checks. Replace `as never` with properly typed fixture builders.

---

#### TC-L-GUARD-2. `.DS_Store` in tests/

**File:line:** `tests/.DS_Store`

**Gap:** macOS metadata file committed. Confirmed by Phase 2 Low item.

**Recipe:** Add `**/.DS_Store` to `.gitignore`; delete the file.

---

#### TC-L-GUARD-3. `vitest.config.ts` include pattern family drift

**File:line:** `vitest.config.ts:7`

**Gap:** `tests/**/*.steps.ts` catches step files only. Feature files are not in the include glob. This matches core's drift (Cleanup-M-GUARD-3). Projection and mcp use `tests/features/**`. Pick one family convention; the pattern `tests/**/*.{feature,steps}.ts` would be wrong (features aren't `.ts`). The current pattern is functional but inconsistent.

**Recipe:** Align with family — document the chosen convention in the workspace-level normalization PR (core CI-1 sweep).

---

## FSM Integrated Coverage Plan (cross-package)

**Problem:** The FSM enforcement chain spans two packages and has zero tests on either side. Core's `validateTransition` (C-CORE-5) and guard's consumer path are the only production-code caller in the workspace.

**Target state:** After landing, the chain from git-diff input through `validateTransition` to `ProcessViolation` output has at least one positive + one negative + one invalid-input scenario.

**Step 1 — Core (lands first):**
- Add `tests/features/validation/fsm-transitions.feature` per core TD-CORE-3 recipe.
- Fix `validateTransition` to return discriminated `TransitionValidationResult` (not a cast shape).
- Export `isValidProcessStatus(value: unknown): value is ProcessStatusValue` type-guard.
- Fix `getValidTransitionsFrom` to return `readonly ProcessStatusValue[] | undefined` (already typed that way in FSM table) — guard null-check at call site.

**Step 2 — Guard (lands in same PR as core or immediately after):**
- Add `tests/features/validation/fsm-transitions-via-guard.feature` (TC-C-GUARD-1 recipe above — 10 scenarios across 3 Rules).
- Step bindings: construct `ProcessState` + `ChangeDetection` directly; call `validateChanges`; assert `violations` array.
- Replace the three `as ProcessStatusValue` casts in `detect-changes.ts:414,440,452` with `parseAtBoundary(StatusValueSchema, captured, 'parseFsmDiff')` — casts disappear, FSM tests become the regression guard.
- Update `process-guard-rules.feature:46` to cite the new feature file.

**Step 3 — Smoke:**
- The "Garbage from status does not cause TypeError" scenario (Rule 3 in the recipe) is the regression test for the runtime crash. It must pass before Step 2 merges.

**Coordination note:** Steps 1+2 should land in the same PR or back-to-back PRs. Core's TD-CORE-3 recipe already lists this. The guard FSM feature file cannot be written as a pure guard test without core exporting the `isValidProcessStatus` guard first.

---

## `packed-dangling-baseline-smoke.mjs` Wire-Up Plan

**Current state:** The script is functional (packs tarball, untars, symlinks zod, imports dist, exercises missing-file error path). It is wired only as `test:pack-smoke` in `package.json` — an opt-in manual invocation. It does not run on `pnpm test`, `prepack`, or in any CI.

**Wire-up recipe:**

1. **Add to `prepack`:** Change `"prepack": "pnpm clean && pnpm build"` to `"prepack": "pnpm clean && pnpm build && node scripts/packed-dangling-baseline-smoke.mjs"`. This runs the smoke after every pack, before publish. Zero CI needed — `pnpm publish` already calls `prepack`.

2. **Extend to cover `tier-a-baseline.ts` deletion (Cleanup-C-GUARD-2):** Once `tier-a-baseline.ts` is replaced with a JSON loader, extend the smoke to also import `dist/lint/tier-a-baseline.js`, call `loadTierABaseline()`, and assert it returns an array. Two smoke assertions for the price of one.

3. **Workspace promotion (Cleanup-H-GUARD-4):** Create `scripts/pack-smoke.mjs` at workspace root. It calls each package's individual smoke script in sequence (or in parallel with `Promise.all`). Wire to workspace-level `test:pack-smoke` script. This would have caught core's broken `./roles` export (C-CORE-1) before publish.

4. **CI integration (deferred — no CI exists today):** When the family CI workflow lands (core CI-1), add `pnpm run test:pack-smoke` as a separate job step after `pnpm test`. Keep it separate so test failures and pack-smoke failures are reported independently.

**Immediate action (no CI required):** Steps 1+2 are single-package, 5-minute changes. Step 3 is cross-package. Step 4 depends on CI existing.

---

## Test Residue Cleanup

| Item | File:line | Action |
|---|---|---|
| `.DS_Store` | `tests/.DS_Store` | Delete; add to `.gitignore`. |
| `as never` × 4 | `tests/steps/guard-runtime.steps.ts:78,107,137,165` | Replace with typed fixtures or `satisfies`. |
| Phantom suite reference | `tests/features/process-guard-rules.feature:46` | Update to cite real feature file once TC-C-GUARD-1 lands. |
| False "scope-creep step bindings" claim | `tests/features/process-guard-rules.feature:70-72` | Update once TC-H-GUARD-1 lands. |
| False "session-scope step bindings" claim | `tests/features/process-guard-rules.feature:75-77` | Update once TC-H-GUARD-1 lands. |
| `vitest.include` pattern | `vitest.config.ts:7` | Align with family in normalization PR. |

No `.skip` or `.only` present in either step file (confirmed by grep).

---

## What Is Well-Tested

**`guard-runtime.steps.ts` has the right shape:** `AfterEachScenario` with state reset and temp-dir cleanup is present and correct — the family reference for test hygiene (core TC-M-6 flags 4 files that lack this). The temp-dir pattern (`mkdtempSync` + tracking array + `rmSync` cleanup) is exemplary.

**`hierarchy-parent-level-mismatch.steps.ts` is at reference quality for its scope:** Two scenarios (positive + negative), `AfterEachScenario` cleanup, direct unit-test of the rule function in isolation with no I/O. This is what every `lint/rules.ts` rule should look like.

**`detectFileChanges` integration test is realistic:** The "Detect status transitions for added files in files mode" scenario initializes a real git repo via `execFileSync('git', ['init'])`, writes a genuine Gherkin fixture, and asserts on `statusTransitions`. It catches regressions in the full `detect-changes` integration path.

**`detectAntiPatterns` + `detectProcessInCode` basic coverage:** Two scenarios verify the `process-in-code` detector fires correctly for custom tag prefixes and that the removed `tag-duplication` id is no longer emitted. These are behavioral regression guards, not just smoke.

**`validateDoDForPhase` happy path:** The DoD happy path confirms the function returns `{ isDoDMet: true, missingAcceptanceCriteria: false }` for a valid input. Catches signature regressions.

None of the above reaches projection's reference quality (83 test files, 3-fragment-kind parametric gates, CI perf gate). Guard would need TC-C-GUARD-1, TC-C-GUARD-2, TC-H-GUARD-1, and TC-H-GUARD-2 landed before it approaches the midpoint of projection's coverage density.
