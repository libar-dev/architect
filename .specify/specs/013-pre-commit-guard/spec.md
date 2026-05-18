# Feature: Pre-Commit Process Guard

## Status
✅ COMPLETE — `pnpm architect:guard --staged` blocks commits that violate FSM doctrine; shipped as `architect-guard` bin with rule registry, exit codes, and parity with `--all` / `--files` modes.

## Overview

The pre-commit process guard is the doctrinal gatekeeper of the architect lifecycle. Before any commit lands, `architect-guard --staged` reads the staged files, derives the implied FSM state changes (status transitions, deliverable changes, scope edits), and runs the registered `ProcessGuardRule` set against them. Violations produce structured `ProcessViolation` records with severity (`error` / `warning`) and a stable `rule` ID. Errors abort the commit; warnings pass unless `--strict` is set. This is the runtime enforcement of FR-013 in `functional-specification.md` and the load-bearing enforcement surface for ADR-003 (Source-First) and PDR-001 (Session Workflow Commands).

The guard is **session-aware**: it understands which session intent (`planning` / `design` / `implement` / `review`) the agent declared via the `architect handoff` record, and applies session-scoped rules (`session-scope`, `session-excluded`) so an agent in `planning` cannot accidentally edit `completed` production code, and an agent in `implement` cannot edit `architect/specs/` without going through the design tier first.

The guard never invokes the shell from its domain layer (NFR-006 / PDR-001 DD-2). Git integration is opt-in via the runner; the rule engine is pure-function and trivially testable.

## User Stories

- As an AI-augmented developer, I want `pnpm architect:guard --staged` to block commits that skip FSM states so I cannot accidentally promote a pattern from `roadmap` straight to `completed`.
- As an AI coding agent, I want session-scoped guard rules to fire when I touch files outside my declared session intent so I stay on-spec across long sessions.
- As an architect maintainer, I want a stable JSON output (`--format json`) so CI consumers can parse violations without screen-scraping pretty output.
- As an AI-augmented developer, I want `completed-protection` to require an `@architect-unlock-reason` JSDoc tag before I can modify a hard-locked pattern so the act of reopening is auditable.
- As a CI maintainer, I want `--strict` to escalate warnings into errors so I can run the same gate in CI with zero tolerance for drift.

## Acceptance Criteria

- [x] Bin `architect-guard` exposes `--staged` (default), `--all`, and `--files` modes per `lint-process.ts:142-190`.
- [x] Bin accepts `-f/--file <path>` (repeatable), `-b/--base-dir <dir>`, `--strict`, `--ignore-session`, `--show-state`, `--format pretty|json`.
- [x] Rule IDs `completed-protection`, `invalid-status-transition`, `scope-creep`, `session-excluded` produce `error` severity.
- [x] Rule IDs `session-scope`, `deliverable-removed` produce `warning` severity.
- [x] Exit code `0` on clean run or warn-only run without `--strict`.
- [x] Exit code `1` on errors, or warnings combined with `--strict`.
- [x] `completed`-status patterns are hard-locked (`ProtectionLevel = 'hard'`); modification requires `@architect-unlock-reason "<reason>"` JSDoc.
- [x] Session intent is read from the latest `handoff` record; `--ignore-session` disables session-scoped rules.
- [x] All `ProcessViolation` records carry a stable `rule` ID, `severity`, `file`, and human-readable `message`.
- [x] Domain logic is pure-function: no shell, no filesystem reads beyond the staged-file list, no network (PDR-001 DD-2).
- [x] `pnpm architect:guard` is wired in root `package.json` as the pre-commit command.

## Technical Requirements

- **Surface**: bin `architect-guard` (`packages/architect-cli/src/cli/...` re-exporting `packages/architect-guard/src/cli/lint-process.ts`).
- **Rule engine**: `ProcessGuard` in `@libar-dev/architect-guard` consumes `DeciderInput { state: ProcessState, sessionState?: SessionState, changes: DeliverableChange[], transitions: StatusTransition[] }` and yields `DeciderOutput { violations: ProcessViolation[] }`.
- **Rule types**: `ProcessGuardRule`, `ProcessGuardRuleDefinition`, `ViolationSeverity = 'error' | 'warning'` (re-exported from `@libar-dev/architect-guard`).
- **Git adapter**: lives in `@libar-dev/architect-guard/git/index.js`; only invoked by the CLI runner, never by the rule engine.
- **Performance**: no committed budget; runs once per commit on the staged set (typically <100 files). Pure-function rules execute in microseconds.
- **Invariants**:
  - Domain layer never calls the shell (PDR-001 DD-2 / NFR-006).
  - Severity vocabulary is exactly `error` / `warning` (no other strings).
  - Verdict words for the surrounding `scope-validate` workflow are `PASS` / `BLOCKED` / `WARN` (Principle 5).

## Implementation Status

**Completed:**
- ✅ `architect-guard` bin entry at `packages/architect-guard/src/cli/lint-process.ts:391`.
- ✅ Rule IDs and severity enum at `packages/architect-guard/src/lint/process-guard/types.ts:210-216`.
- ✅ Session-aware mode reading handoff records.
- ✅ `--format json` machine-readable output.
- ✅ Wired into `pnpm architect:guard` script and Section V quality gate of the constitution.

## Dependencies

- Spec 007 (`fsm-lifecycle-enforcement`) — guard rules derive transitions against the FSM defined in `architect-core/validation/fsm/`.
- Spec 008 (`completed-pattern-protection`) — `completed-protection` rule enforces the hard-lock semantics.
- Spec 009 (`scope-creep-detection`) — `scope-creep` rule fires here.
- Spec 011 (`session-handoff`) — handoff records supply the session intent the guard reads.
- External: `@libar-dev/architect-core` (FSM types), git CLI (via opt-in adapter for `--staged`).

## Related Specifications

- ADR-003 — Source-First Pattern Architecture.
- PDR-001 — Session Workflow Commands (`DD-2` pure-function domain logic; `DD-4` deterministic verdict words).
- AGENTS.md §"No-BC" — the doctrine the guard ultimately enforces.
- Executable Gherkin: `packages/architect-guard/tests/features/` ProcessGuard scenarios.
- `functional-specification.md` FR-013, NFR-006, NFR-007.
