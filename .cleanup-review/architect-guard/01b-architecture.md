# Architecture Review — `@libar-dev/architect-guard`

Anchored to ADR-003 (Source-First Pattern Architecture), ADR-006 (Single Read Model + stage-1 named-exception carve-outs), ADR-007 (Coordinated Taxonomy Redesign — 4-value `ProcessStatusValue`, 6-value `ProcessGuardRuleId`), and PDR-005 (Process Guard FSM).

Verified via the Data API: `ProcessGuardLinter` is `active` and depends on `FSMValidator`, `DeriveProcessState`, `DetectChanges`, `ProcessGuardDecider`. `FSMValidator` lives in `@libar-dev/architect-core` and is the single source of FSM transition semantics — guard imports it, never re-derives it.

Severity legend: **High** = breaks an ADR invariant or doctrine; **Medium** = layering / cohesion drift that will compound; **Low** = local cleanup with architectural rationale.

---

## High severity

### H1. Single public barrel re-exports the entire internal surface (`*` re-exports leak implementation modules)

- **Severity:** High
- **Architectural impact / anchor:** Single-public-barrel hygiene; ADR-006 (Single Read Model) — the barrel is the only contract a consumer can rely on. Today the barrel pulls in every internal module via `export *`, so any non-exported helper or type added to `lint/`, `lint/process-guard/`, `validation/`, `cli/shared.js` becomes public by accident. There is no `.internal` discipline in `architect-guard` parallel to what exists in `architect-projection`.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/index.ts:1-24`
- **Recommended improvement:** Replace the wildcard re-exports with an explicit allowlist of the public symbols the consumers actually need (per-package, this is roughly: the four `runXxxCli` runners, `GitModule`, the `process-guard/types.ts` types, the public `validateChanges` / `deriveProcessState` / `detect*Changes` surface, `runStepLint`, `runIdeaTierLint`, `compareDanglingBaseline` / `writeDanglingBaseline` / `DANGLING_BASELINE_SOURCE_PATH`, `applyTierABaseline`, `formatAntiPatternReport`). Adopt the `*.internal.ts` convention already in use in `architect-projection` for the helpers that should NOT escape (e.g. `tier-a-baseline.ts` internals, `detect-changes.ts`'s `DiffFileParseState`, `idea-tier/idea-tier-checks.ts` low-level helpers).
- **Trade-offs:** A one-time `BREAKING` change at pre-1.0; matches the no-BC doctrine perfectly. Saves much larger breakage later. Risk: a downstream consumer in the dogfood graph was importing a helper that we now narrow — surfaceable by typecheck and easy to either re-add to the allowlist or relocate.

### H2. Direct `*` re-export of `./lint/engine.js` and `./lint/rules.js` from the package root double-publishes the engine

- **Severity:** High
- **Architectural impact / anchor:** Layering / single public surface. `./lint/index.js` already re-exports the lint engine and rules under a curated set (`lint/index.ts:22-46`). `index.ts:9-11` then re-exports `lint/index.js`, `lint/engine.js`, AND `lint/rules.js` separately, so the same symbols enter the package surface through three doors. That makes the package's public type graph ambiguous (which import is canonical for `LintRule`?) and pins more surface than necessary.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/index.ts:9-11`
- **Recommended improvement:** Drop `export * from './lint/engine.js';` and `export * from './lint/rules.js';` at the package root. Force consumers through `./lint/index.js`'s curated set. If a symbol is missing from the curated set, add it there.
- **Trade-offs:** Same as H1 — a pre-1.0 break is the right move; saves consumers a future churn.

### H3. `ProcessStatusValue` boundary is honored, but one comment+literal pair contradicts the type

- **Severity:** High
- **Architectural impact / anchor:** ADR-007 — `ProcessStatusValue` has exactly 4 values (`roadmap | active | completed | deferred`); `candidate` is exempt and uses `AcceptedStatusValue` (5 values). The type boundary IS preserved in the FSM-facing code (`StatusTransition.from`/`.to` are `ProcessStatusValue`; the decider operates only on that), but `derive-state.ts:126` reads `pattern.status` of type `AcceptedStatusValue` and explicitly tests for the string `'candidate'`. That string comparison is correct *only* because `FileState.status: AcceptedStatusValue` is intentionally the wider 5-value type. The wider field is currently uncommented and easy to mis-narrow on next refactor — the implicit contract "FileState carries the wider type so candidate can be excluded from FSM enforcement" is doctrine, not code.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/types.ts:66`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/derive-state.ts:126`
- **Recommended improvement:** Add a one-line JSDoc on `FileState.status` stating "intentionally widened to `AcceptedStatusValue` (5 values) so the `candidate` short-circuit in `derive-state.ts` is type-correct — FSM-bound code must immediately project via `normalizeStatus` or narrow on `status === 'candidate'`." Optionally introduce a tiny helper `isFsmTrackedStatus(status: AcceptedStatusValue): status is ProcessStatusValue` and use it at the protection-level call site instead of the bare literal `=== 'candidate'`. That makes the invariant explicit and grep-able.
- **Trade-offs:** Pure documentation + one tiny helper; no runtime change. Cost: a few lines. Benefit: turns a tribal-knowledge invariant into compiler-checked intent.

### H4. `tier-a-baseline.ts` ships a 1000-line in-code allowlist of cross-package violations — a hidden coupling that defeats the layer boundary

- **Severity:** High
- **Architectural impact / anchor:** Dependency direction + cohesion. `architect-guard` is the *policy* package; it should not name files inside `architect-cli`, `architect-core`, `architect-mcp`, or `architect-projection` (it currently does — ~250 entries). The same file already has a *companion* on-disk baseline mechanism (`dangling-baseline.json` + `compareDanglingBaseline`) that is the principled mechanism for this exact use case. Carrying the second allowlist in a hand-edited TS literal is the **Lossy Local Type** anti-pattern in everything but name — drift will silently accumulate because the format is invisible to the schema layer.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/tier-a-baseline.ts:19-1034`
- **Recommended improvement:** Move `TIER_A_LINT_BASELINE` out of source code into a JSON file (`packages/architect-guard/src/lint/tier-a-baseline.json`) wrapped by a Zod schema, mirroring the dangling-baseline pattern (read+compare+write+strict gate). Bonus: each entry becomes a real diff in PRs that add or remove a known-good exemption, and the same `--update-baseline` UX applies. The package then exposes `applyTierABaseline` + a generic comparator, not a frozen list of cross-package paths.
- **Trade-offs:** One-time JSON migration. Cost: a small migration script (or a `pnpm architect:query` verb that writes the initial file). Benefit: the cross-package coupling becomes data, not code; the carve-out becomes a tracked deliverable, not a buried constant.

---

## Medium severity

### M1. `validate-patterns.ts` is a 938-line CLI doing multiple business pipelines — orchestration, cross-source validation, DoD validation, anti-pattern detection, and dangling-baseline enforcement

- **Severity:** Medium
- **Architectural impact / anchor:** Layering — "CLI should be a thin composition root over lint/validation/git" (review brief). `validatePatterns()` (the actual business function) is *exported* from this CLI file (line 423), which means a consumer wanting just cross-source validation has to import from `cli/validate-patterns.ts`. The CLI module owns argument parsing, business logic, dangling-baseline enforcement, and pretty/JSON formatting at once.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/validate-patterns.ts:423-578` (business function inside the CLI); `:686-713` (dangling enforcement inside the CLI)
- **Recommended improvement:** Move `validatePatterns` and `enforceDanglingBaseline` out of `cli/validate-patterns.ts` into `validation/cross-source-validator.ts` and `lint/dangling-enforcement.ts` respectively. The CLI then becomes argument parsing + composition + formatting. Same shape as `lint-process.ts` (which already delegates correctly — note how its core logic lives in `lint/process-guard/decider.ts`, not in the CLI).
- **Trade-offs:** Cost: a single file split; imports update. Benefit: the package exposes named domain functions rather than CLI-shaped functions, which is the correct boundary for the dogfood + downstream-consumer use cases (Studio, MCP, programmatic invocations).

### M2. `validate-patterns` is the only consumer reaching for `scanPatterns` / `scanGherkinFiles` raw — but it's NOT a named stage-1 carve-out exception

- **Severity:** Medium
- **Architectural impact / anchor:** ADR-006 §Anti-patterns — only `lint-patterns.ts`, `AntiPatternDetector`, `CoverageAnalyzer`, `SessionStateReader` are named stage-1 exceptions in this package. `validate-patterns.ts:864-875` calls `scanPatterns` + `scanGherkinFiles` again to feed `detectAntiPatterns`. That's a *duplicate* scan: the canonical scan already happened inside `buildPatternGraph` upstream (line 777). The reason for the second scan is that `detectAntiPatterns` is a stage-1 consumer that needs raw `ScannedFile[]` / `ScannedGherkinFile[]`, not the read model.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/validate-patterns.ts:858-887`
- **Recommended improvement:** Either (a) thread the raw scan results through the pipeline output so guard does not duplicate the scan (preferred — the pipeline already runs it, just doesn't surface it), or (b) explicitly add `ValidatePatternsCLI` to ADR-006's stage-1 list and document why the second scan is necessary. The current state is "implicit stage-1 use" — the carve-out exists in practice but is not named in the ADR.
- **Trade-offs:** Path (a) needs `architect-core`'s `buildPatternGraph` to optionally return the underlying scan results — a small API addition, no schema churn. Path (b) is documentation-only. Path (a) is the correct fix because re-scanning the entire workspace twice per `validate:all` run is also a perf hit.

### M3. The barrel inlines a flag CLI runner export — `cli/index.ts` enumerates symbols, but `index.ts` does both inline export AND re-export-everything

- **Severity:** Medium
- **Architectural impact / anchor:** Single source of truth for what's public. `src/index.ts:3-8` lists the four `runXxxCli` runners by name, but the next line (`export * from './cli/index.js'` is absent) — the package root knows about CLI runners, while `cli/index.ts:1-4` also exports them. The double registration is harmless today but means there are two equally authoritative "list of CLI runners" lines that can drift.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/index.ts:3-8`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/index.ts:1-4`
- **Recommended improvement:** Pick one. After H1's fix (explicit allowlist), root `index.ts` should `export { runLintPatternsCli, runLintProcessCli, runLintStepsCli, runValidatePatternsCli } from './cli/index.js';` — single line, single owner.
- **Trade-offs:** None.

### M4. `detect-changes.ts` carries two parsers (status-tag + deliverable-table) inside one 668-line file — high in-file coupling

- **Severity:** Medium
- **Architectural impact / anchor:** Cohesion within `lint/process-guard/`. The file owns three concerns: git invocation (delegated cleanly to `git/helpers`), status-transition diff parsing (docstring-aware, hunk-aware), and deliverable-table diff parsing. Each parser is a non-trivial state machine. The decider is pure, but the change-detection layer is where future correctness bugs will land.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/detect-changes.ts:1-668`
- **Recommended improvement:** Split into `detect-changes/index.ts` (entry points: `detectStagedChanges`, `detectBranchChanges`, `detectFileChanges`), `detect-changes/status-transitions.ts` (the docstring-aware parser + `DiffFileParseState`), `detect-changes/deliverable-changes.ts` (the table-context state machine). Public surface stays identical; the test surface gets sharper.
- **Trade-offs:** Cost: file split, ~3 imports updated. Benefit: each parser becomes individually testable and visually scoped.

### M5. `ProcessGuardDecider` is pure (good!) but the rule list inside `validateChanges` is hard-wired

- **Severity:** Medium
- **Architectural impact / anchor:** Decider purity (review checklist) + ADR-007 cardinality (`ProcessGuardRuleId` = 6 values, the brief warns against phantom additions). The decider is correctly pure: it takes `(state, changes, options) => result`, with all I/O in `derive-state`/`detect-changes`. But the rule list is inlined as an array of closures (`decider.ts:177-195`) and the 6 rule IDs are scattered across both `types.ts:210-216` (the union) and `decider.ts:179-194` (the implementation map). A future contributor adding a 7th rule has to remember to touch both — a phantom addition becomes plausible.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/decider.ts:177-195`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/types.ts:210-216`
- **Recommended improvement:** Define a single `RULES: Record<ProcessGuardRule, RuleFn>` table where `ProcessGuardRule` is the closed union. TypeScript's `Record<...>` exhaustiveness then forces a compile error if a new rule ID is added without a function, and an `Object.keys(RULES)` mismatch would fail typecheck. Today the same effect is achieved by convention only.
- **Trade-offs:** Trivial refactor, no runtime change. Eliminates the "phantom additions" failure mode mechanically.

### M6. `idea-tier` and `steps` runners read globs+files directly rather than going through any shared file-discovery utility

- **Severity:** Medium
- **Architectural impact / anchor:** Stage-1 read-model carve-out — these are sub-runners, not named exceptions in ADR-006. They use raw `globSync` + `readFileSync` because idea-tier and step-lint operate on file *text* (line budgets, scenario boundaries, magic comments) — that's legitimately not in the PatternGraph. But the package has *two* parallel file-discovery utilities (`idea-tier/runner.ts:40-47` and `steps/runner.ts:114-122`) doing identical work. Future audit ("which files does guard scan?") has to look in N places.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/idea-tier/runner.ts:40-47`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/steps/runner.ts:114-122`
- **Recommended improvement:** Extract a single `discoverFiles(globs, baseDir): readonly string[]` into `lint/_shared/discover-files.ts` (or `validation/_shared/`). Both runners use it. Optional follow-up: add `architect-base` §11 stage-1 wording naming idea-tier/steps as text-shape consumers (parallel to anti-patterns), since they share the same justification.
- **Trade-offs:** Trivial dedup; almost zero cost.

---

## Low severity

### L1. `lint-process.ts` printed help text references PDR-005 but the FSM source of truth is `validateTransition` in `architect-core`

- **Severity:** Low
- **Architectural impact / anchor:** Decision lineage. The help text on `cli/lint-process.ts:174` says "Status transition must follow PDR-005 FSM" — accurate, but the implementation imports `validateTransition` / `getValidTransitionsFrom` / `isTerminalState` from `@libar-dev/architect-core`. The link to PDR-005 is conceptual but the user has no way to discover *what's authoritative* — the ADR document, or the core function?
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/lint-process.ts:174`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/decider.ts:33,58`
- **Recommended improvement:** In the suggestion text inside the decider (when emitting `invalid-status-transition`), append `(see PDR-005 / architect/decisions/pdr-005-process-guard-fsm.feature)`. The CLI already says PDR-005 — make the runtime violation message do the same so the user lands on the canonical reference.
- **Trade-offs:** One string change. No runtime impact.

### L2. `dangling-baseline.ts` mechanizes the gate end-to-end — confirmed wired into CI

- **Severity:** Low (this is a positive finding worth recording, not a defect)
- **Architectural impact / anchor:** Graph-integrity gate (review checklist). Verified: `.github/workflows/ci.yml:31` and `publish.yml:36` both run `pnpm architect:query -- arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict`. The companion `--update-baseline` flag on `validate-patterns` is the local-dev counterpart, and `compareDanglingBaseline` (the comparator that builds added/removed sets) is properly Zod-validated. The pattern is sound — this is the model H4's tier-A baseline should follow.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/dangling-baseline.ts:7-13` (Zod schema), `:120-139` (comparator), `/Users/darkomijic/dev-projects/architect/.github/workflows/ci.yml:31`
- **Recommended improvement:** Document this end-to-end mechanization in `architect-guard`'s package README so the dangling-baseline pattern is discoverable as the reference implementation when adding new graph-integrity gates.
- **Trade-offs:** None — documentation-only.

### L3. `GitBranchDiff` and `GitHelpers` declare `@architect-bounded-context:generator` but live in `architect-guard`

- **Severity:** Low
- **Architectural impact / anchor:** Bounded-context coherence. `git/branch-diff.ts:6` and `git/helpers.ts` carry `@architect-bounded-context:generator` — but the package they sit in is `architect-guard`, and the rest of the package uses `:lint`, `:process-guard`, `:validation`, `:cli`. The "generator" tag is a legacy reference back to when `branch-diff` lived in the generators layer (the JSDoc on `branch-diff.ts:11-15` literally says so). Now that the file is in guard, the bounded context should follow.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/git/branch-diff.ts:6`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/git/helpers.ts:6`, `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/git/index.ts:6`
- **Recommended improvement:** Rename the bounded context tag to `:git` (or `:lint` if you want to roll up under the consumer layer). Update the three annotations and the README of the bounded-context inventory (`pnpm architect:query arch bounded-context generator` to see what else lands in the same bucket).
- **Trade-offs:** None — tag-only, no code change. Cross-check with `arch bounded-context` after the change.

### L4. `ChangeDetectionOptions.featurePatterns` defaults are package-shipped — risks divergence from the project config

- **Severity:** Low
- **Architectural impact / anchor:** Configuration source of truth. `DEFAULT_PROCESS_GUARD_SPEC_PATTERNS = ['architect/**/*.feature', 'specs/**/*.feature']` (derive-state.ts:54-57) is intentionally generic for consumer reuse, but `lint-process.ts` already passes `projectConfig.project.sources.features` in (`lint-process.ts:322-323`), making the default unreachable in dogfood. Defaults that are unreachable in the primary call path tend to silently rot.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/lint/process-guard/derive-state.ts:54-57`
- **Recommended improvement:** Either (a) make `featurePatterns` required on `ChangeDetectionOptions` so every caller passes the config-derived value explicitly, or (b) keep the default but add a unit test that asserts the default still matches what the dogfood config would feed in. (a) is the safer pre-1.0 choice given the no-BC doctrine.
- **Trade-offs:** Option (a) is a tiny BC break in the function signature for consumers; option (b) leaves a smell. Choose (a).

### L5. `cli/shared.ts` reads `package.json` via a fragile relative path

- **Severity:** Low
- **Architectural impact / anchor:** Distribution robustness. `cli/shared.ts:7-10` uses `join(dirPath, '..', '..', '..', 'package.json')` from `dist/cli/`. That works under the published layout but breaks the moment the dist structure changes (a real risk during a tooling refactor). The function silently returns `{}` on any error (`shared.ts:11-13`), so a packaging bug would surface as `v unknown` in the CLI version output rather than a build failure.
- **File\:line:** `/Users/darkomijic/dev-projects/architect/packages/architect-guard/src/cli/shared.ts:5-14`
- **Recommended improvement:** Replace the runtime read with a build-time injected constant — vitest-cucumber-style `define`, or a `version.ts` written by the build, or `import packageJson from '../../package.json' assert { type: 'json' }`. At minimum, replace the silent catch with a log so packaging regressions surface.
- **Trade-offs:** Minor build-time work; matches what `architect-cli` already does for its version helper.

---

## Cross-cutting architectural themes

1. **The public-barrel hygiene is the biggest single issue.** `architect-guard` has a clear internal layering (cli over lint+validation over git) but no boundary discipline on what leaves the package. The wildcard re-exports in `src/index.ts` turn every internal symbol into a contract. The `.internal.ts` convention already proven in `architect-projection` should be adopted here too, and the barrel should enumerate. H1 + H2 + M3 are the same theme.

2. **Two baseline mechanisms coexist; only one is mechanized.** `dangling-baseline.ts` is the principled pattern — Zod-validated JSON, comparator, CI gate, local `--update-baseline` UX. `tier-a-baseline.ts` is the *exact same problem* solved by hand-editing a TS literal of cross-package violations. The discipline gap is the most leveraged refactor in the package — closing it gives a single way to track "known exemptions" across the whole guard layer (H4).

3. **The stage-1 carve-out is honored in spirit, not always in name.** No raw `scanner/` or `extractor/` imports — verified. But `validate-patterns.ts` quietly re-scans the workspace to feed `detectAntiPatterns` (M2), because the pipeline doesn't surface scan results. ADR-006's named-exception list covers the *detectors* but doesn't cover the *driver*, so the carve-out is technically incomplete at the driver layer. Either thread scan results through the pipeline output or extend the named list.

4. **The FSM type boundary holds — barely.** ADR-007 is preserved: `ProcessStatusValue` (4) is what the FSM operates on; `candidate` lives on `AcceptedStatusValue` (5) and is excluded by a single string compare in `derive-state.ts:126`. `ProcessGuardRule` still has exactly 6 values. The mechanical exhaustiveness check (M5) would convert this from "respected by convention" to "enforced by tsc". Cheap, high leverage.

5. **CLI layer is mostly thin — except `validate-patterns.ts`.** Three of the four CLI runners (`lint-patterns`, `lint-process`, `lint-steps`) correctly delegate to lint/process-guard/validation modules. `validate-patterns.ts` is the outlier: it both *exports* the core business function (`validatePatterns()`) and orchestrates dangling-baseline enforcement inline. Moving those into named domain modules brings it back in line with the rest of the package and makes the business surface reachable from non-CLI consumers (Studio, MCP, programmatic).

6. **Decider purity is preserved.** `validateChanges(input): output` is genuinely pure: no I/O, no global state, events-as-data. The rules array is the only structural risk (M5). The cleanest in the package — leave the shape as-is, just tighten the rule table to a `Record<ProcessGuardRule, RuleFn>` so the cardinality invariant becomes tsc-enforced.

7. **The dogfood pattern is internally consistent and the right design — make it discoverable.** The dangling-baseline end-to-end mechanization (L2) is the model. Document it as such in the package README so the next graph-integrity gate (e.g. a future tier-B baseline, or an FSM-violation baseline) follows the same shape automatically.
