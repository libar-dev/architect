# architect-guard — Package PRD

> Boundary contract recorded post-PR-#15 (monolith split). Describes the **code as it is**, not the `@architect-*` annotations (known low-quality). Code (`src/index.ts`, barrels, `package.json`, key modules) is primary truth.

## Purpose

`@libar-dev/architect-guard` is the **policy / enforcement layer** of the package family. It answers one question deterministically: _"is this proposed change allowed by the process?"_ It owns the FSM transition rules, the staged-change **process guard** (`architect-guard --staged`), the Definition-of-Done check, dangling-reference baselining, and a set of annotation/feature/anti-pattern linters. It is pure-policy over a built `PatternGraph` plus git diffs — it depends on `architect-core` only, and is consumed by the CLI bins. Anything that decides _pass/fail_ against the delivery loop lives here; anything that builds the read model lives in `architect-core`.

## Public interface

The barrel (`src/index.ts`) re-exports everything; there is no `exports` subpath map beyond `.` and `package.json`. Logical groupings of the boundary contract:

- **Process guard (the FSM gate)** — `src/lint/process-guard/`. The pure decider `validateChanges(input) → { result, events }` (`decider.ts`) runs five rules: completed-protection, invalid-status-transition, scope-creep, session-scope, session-excluded. State assembly (`deriveProcessState`, `deriveFileStates`), git-diff change detection (`detectStagedChanges` / `detectBranchChanges` / `detectFileChanges`, `getStatusTransition`, `getDeliverableChanges`), and the active-session reader (`readActiveSession`, `isInSessionScope`, `isSessionExcluded`) are the supporting surface. FSM truth (`validateTransition`, `getValidTransitionsFrom`, `isTerminalState`) is **imported from architect-core**, not defined here.
- **Annotation lint engine** — `src/lint/rules.ts` + `engine.ts`. `defaultRules` (9 rules), `lintFiles` / `lintDirective`, `formatPretty` / `formatJson`, `filterRulesBySeverity`, `hasFailures`.
- **Step lint** — `src/lint/steps/`. `runStepLint`, `STEP_LINT_RULES` plus individual feature/step/cross checks — static analysis of vitest-cucumber feature/step compatibility.
- **Idea-tier soft lint** — `src/lint/idea-tier/`. `runIdeaTierLint` + checks; advisory `warning`-only, never blocks.
- **Validation** — `src/validation/`. `validateDoD` / `validateDoDForPhase` / `formatDoDSummary` (DoD), `detectAntiPatterns` + `toValidationIssues` + `formatAntiPatternReport` (anti-patterns), thresholds schema.
- **Dangling baseline** — `src/lint/dangling-baseline.ts`. `compareDanglingBaseline`, `readDanglingBaseline`, `writeDanglingBaseline` + the checked-in `dangling-baseline.json`.
- **Git helpers** — `src/git/`. `getChangedFilesList`, `parseGitNameStatus`, `execGitSafe`, `sanitizeBranchName`.
- **CLI runners** — `runLintProcessCli`, `runLintPatternsCli`, `runLintStepsCli`, `runValidatePatternsCli` (the functions the CLI bins wrap; the bins themselves live in `architect-cli`).

## Enumerated functionality

- **FSM transition validation** — every `@architect-status` change is validated against the FSM in core, including advisory reopen paths from `completed` back to `active` or `roadmap`.
- **Process-guard checks (5 rules)** — completed-protection (warns by default; `unlock-reason` suppresses the warning), invalid-status-transition (hard), scope-creep / new deliverable on active spec (warn), deliverable-removed (warn), session-scope (warn) and session-excluded (hard).
- **Definition of Done** — phase deliverables all terminal + at least one `@acceptance-criteria` scenario.
- **Dangling-reference baselining** — diff current dangling refs against a checked-in baseline; surfaces new vs removed.
- **Annotation lint (9 rules)** — missing-pattern-name, invalid/missing-status, missing-when-to-use, tautological-description, missing-relationships, pattern-conflict-in-implements, missing-relationship-target, hierarchy-parent-level-mismatch.
- **Step lint** — vitest-cucumber traps: ScenarioOutline `{string}` params, missing `And` destructuring, missing `Rule()` wrapper, `#` in descriptions, regex/`{phrase}` step patterns.
- **Idea-tier soft lint** — line budget ≤30, no Scenario/Background, Rule needs Invariant, ≥5 explicit tags. Advisory only.
- **Anti-pattern detection** — process-in-code, removed-tag, magic-comments, scenario-bloat, mega-feature.
- **Git helpers** — staged/branch name-status parsing, safe `git` exec, branch-name sanitization.

## Dependencies

- **architect-core** (`workspace:*`) — the only intra-repo dep, one-directional. Imports the `PatternGraph` / `RuntimePatternGraph`, scanners (`scanPatterns`, `scanGherkinFiles`, `buildPatternGraph`), the FSM API (`validateTransition`, `getValidTransitionsFrom`, `isTerminalState`), tag taxonomy/registry, config loaders, and `LintSeverity`/`LintViolation`/`DanglingReference` contracts.
- **External** — `glob` (file globbing for lint/validate inputs), `zod` v4 (baseline + thresholds schemas).
- Guard does **not** depend on architect-projection, -cli, or -mcp.

## Consumers

- **architect-cli** (`workspace:*` dep) — wraps the four runners into bins: `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate` (and re-uses guard types in `_shared/structured.ts`).
- **Root dogfood scripts** (`package.json`) — `architect:guard` (`architect-guard --base-dir . --staged`), `architect:guard:all`, `validate:patterns`, `validate:all` (`--dod --anti-patterns`); plus `scripts/api-capability-tour.sh`.
- **Pre-push / CI** — the staged process guard is the loop-protecting gate; `validate:all` runs DoD + anti-patterns.
- **architect-core** references guard only in config defaults/self-hosting and one test step — no runtime cycle.
- **MCP** — no direct dependency observed.

## Load-bearing vs incidental (cut-list)

**Load-bearing — the deterministic gates that protect the loop:**

- **Process guard / FSM transition validation** (`src/lint/process-guard/`) — the core reason the package exists. `validateChanges` + the completed-protection and invalid-status-transition rules keep consequential lifecycle changes visible while preserving a non-skippable FSM. Pure decider, fully testable, wired into `architect:guard`. Keep.
- **DoD validator** (`src/validation/dod-validator.ts`) — the terminal-state gate for "is this phase actually done." Wired into `validate:all`. Keep.
- **Dangling-baseline** (`src/lint/dangling-baseline.ts` + json) — the regression ratchet on broken references; checked-in baseline is the diff target. Keep.
- **Git helpers** (`src/git/`) — thin, no overlap, prerequisite for change detection. Keep.

**Incidental / deletion-or-merge candidates:**

- **Annotation lint engine + 9 rules** (`src/lint/rules.ts`, `engine.ts`) — these enforce _annotation prose quality_ (tautological-description, missing-when-to-use, missing-relationships). The repo itself declares `@architect-*` annotations "known low-quality and disposable," and the read model is rebuilt from code regardless of prose hygiene. `missing-relationship-target` and `pattern-conflict-in-implements` are the only ones that catch _graph-breaking_ errors — and those overlap with dangling-reference detection in core. **Strongest cut candidate: the advisory rules (missing-when-to-use, missing-relationships, tautological-description, missing-status) are accreted doc-style nags that don't protect the loop.**
- **Idea-tier soft lint** (`src/lint/idea-tier/`, ~447 LOC) — entirely advisory (`warning`-only, "never blocks a build"). A non-gating linter in a package whose job is gating. Strong merge-or-delete candidate; if minimum-Gherkin-by-tier guidance is wanted it belongs in authoring docs, not an enforcement package.
- **Anti-pattern detector** (`src/validation/anti-patterns.ts`) — mixed. `process-in-code` and `removed-tag` are real hygiene gates; `scenario-bloat`, `mega-feature`, `magic-comments` are heuristic warnings (threshold-driven, off by default) that overlap conceptually with step-lint and add config surface. Trim to the two error-severity checks, drop the warning heuristics.
- **Step lint** (`src/lint/steps/`, ~1354 LOC) — useful but a _test-tooling_ concern (vitest-cucumber quirks), not process policy. The single largest area after process-guard. Reasonable to keep as a runner but it is the clearest "outside the guard responsibility" body; candidate to move to a test-support location or trim its many individually-exported targeted checks (the granular `check*` exports are surface bloat — only `runStepLint` is consumed).

## Size signal

- **38 TS source files**, **~9,215 LOC** across `src/`. By area: lint ~2,168 + process-guard ~2,048 + steps ~1,354 + idea-tier ~447; cli ~2,003; validation ~941; git ~230.
- **21 patterns** reported by the query API for this package.
- **Rule/check inventory:** 9 annotation lint rules, 5 process-guard rules, 5 anti-pattern checks, 5 idea-tier checks, ~12 step-lint checks.
- **7 test files** under `tests/` (features + step + process-guard suites). Ships one checked-in artifact (`dangling-baseline.json`).
