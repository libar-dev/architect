# Cleanup Review — `@libar-dev/architect-guard`

## Target

`packages/architect-guard/src/**` — process-guard FSM, bespoke linters,
DoD validation, anti-pattern detection, git helpers. The enforcement layer
that gates `pnpm architect:guard --staged` and `pnpm validate:all`.

- **TS files**: 38
- **Lines of code**: ~9,149
- **Subtree distribution**:
  - `cli/` — `validate-patterns`, `lint-patterns`, `lint-process`, `lint-steps`, `shared`
  - `git/` — `helpers`, `branch-diff`, `name-status`
  - `lint/` — `engine`, `rules`, `tier-a-baseline`, `dangling-baseline`
    - `lint/idea-tier/` — idea-tier checks + runner
    - `lint/steps/` — feature-checks, step-checks, cross-checks, pair-resolver, utils, runner
    - `lint/process-guard/` — `derive-state`, `detect-changes`, `decider`, `session-state-reader`, `types`
  - `validation/` — `dod-validator`, `anti-patterns`, `types`

## Package facts

- Public surface: `.` (barrel) only — single export.
- Runtime deps: `@libar-dev/architect-core`, `glob`, `zod`.
- `sideEffects: false`.
- Has a packed-baseline smoke (`scripts/packed-dangling-baseline-smoke.mjs`).

## Architectural responsibilities

`architect-guard` is the **policy and enforcement** layer. It owns:

- The **4-state FSM** (`ProcessStatusValue`: roadmap / active / completed / deferred) — distinct from `architect-core`'s 5-value `AcceptedStatusValue` per ADR-007.
- Process-guard transition validation, protection levels, `@architect-unlock-reason` enforcement.
- Anti-pattern detection (ADR-006 §Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship — itself a stage-1 named-exception consumer).
- DoD validation; tier-A baseline.
- Step / feature / cross-checks for executable Gherkin under `tests/features/`.
- Idea-tier soft-cap checks (warn-only ≤30 line budget per `architect-base` §9).
- Dangling-reference baseline (`dangling-baseline.ts`), referenced from CI.
- Git helpers for `--staged` mode.

## ADRs that bind this package

- **ADR-003** — single-definition constraint; `@architect-implements` realization rules.
- **ADR-006** — `lint-patterns.ts`, `AntiPatternDetector`, `CoverageAnalyzer`, `SessionStateReader` are **named stage-1 exceptions** allowed to read raw scanner / extractor output. This package *is* the negative-space exception holder. Validators outside that list must consume `PatternGraph`.
- **ADR-007** — `ProcessStatusValue` (4 values) is what FSM uses. `candidate` is exempt from FSM enforcement. `ProcessGuardRuleId` has 6 values (no phantom additions).
- **PDR-005** — Process Guard FSM (not loaded but referenced).

## Review plan

1. **Phase 1 — three parallel agents (each loads the bootstrap):**
   - `code-reviewer` — FSM correctness, git helper safety, lint engine reliability
   - `architect-review` — ADR-006 named-exception adherence, ADR-007 FSM type boundary, ADR-003 single-definition
   - `code-simplifier` — simplification opportunities (read-only)
2. **Phase 2 — consolidated final report** at `02-final-report.md`.

## Output files

- `.cleanup-review/architect-guard/00-scope.md` (this file)
- `.cleanup-review/architect-guard/01-cleanup-findings.md`
- `.cleanup-review/architect-guard/02-final-report.md`
- `.cleanup-review/architect-guard/state.json`
