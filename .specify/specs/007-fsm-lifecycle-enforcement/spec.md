# Feature: FSM Lifecycle Enforcement

## Status
✅ COMPLETE — FSM contract lives in `@libar-dev/architect-core` (`validation/fsm/`), enforced by `@libar-dev/architect-guard` via the `invalid-status-transition` rule; transitions table at `transitions.ts:22-29`.

## Overview

Every Architect pattern flows through a finite state machine: `roadmap → active → completed`, with a sibling `deferred` branch and a pre-process `candidate` intake state. The transition table is canonical, declared in code, and consulted by both core (`isValidTransition`) and guard (the `invalid-status-transition` rule). There are no advisory states — an attempt to jump from `roadmap` straight to `completed`, or to re-open a `completed` pattern without an explicit unlock, is rejected at validation time.

The FSM is the runtime expression of the four-tier delivery doctrine (idea → candidate → plan → design → executable). It is the load-bearing invariant that lets AI agents and human reviewers trust "this pattern is `active`" as a binding statement about where work currently is, rather than a stale label. Because the FSM contract lives in core — not guard — every read-side consumer (CLI, MCP, projection pipeline) sees the same authoritative state without depending on the lint engine.

The FSM also drives session-type inference (PDR-001 DD-3): `candidate → planning`, `roadmap → design`, `active → implement`, `completed → review`, `deferred → design`. Downstream skills key off the current status to choose the right session shape automatically; agents need not specify `--session` unless overriding.

Reference: `functional-specification.md` FR-007; `data-architecture.md` §1e; `decision-rationale.md` PDR-001 DD-3.

## User Stories

- As an **AI-augmented developer**, I want `pnpm architect:guard --staged` to reject any commit that violates the FSM so I cannot accidentally re-open a completed pattern, skip lifecycle states, or land a forbidden transition.
- As an **AI coding agent**, I want `architect_scope_validate` and `architect_context` to return the FSM state of every pattern so I never start work the project guard will later reject.
- As an **AI coding agent**, I want session type to be inferred from FSM status so I follow the right session shape without having to ask the user.
- As an **architect maintainer**, I want a single declared transition table that both core and guard consume so the FSM contract cannot drift between read and write paths.

## Acceptance Criteria

- [x] Valid transition set declared in one place: `packages/architect-core/src/validation/fsm/transitions.ts:22-29`.
- [x] `isValidTransition(from, to)` exported from `@libar-dev/architect-core` returns `true` for the canonical set and `false` otherwise.
- [x] `architect-guard` consumes core's transition table; no duplicate declaration.
- [x] `roadmap → active`, `active → completed`, `active → roadmap`, `roadmap → deferred`, `deferred → roadmap` succeed.
- [x] Any transition not in the table fails with rule ID `invalid-status-transition` (`packages/architect-guard/src/lint/process-guard/types.ts:210-216`).
- [x] `candidate` is a pre-process intake state (in `ACCEPTED_STATUS_VALUES`); `PROCESS_STATUS_VALUES` excludes it (`packages/architect-core/src/taxonomy/status-values.ts:1`).
- [x] `ProcessGuard` emits `invalid-status-transition` from `architect-guard --staged` at pre-commit.
- [x] `architect_handoff` and `architect_scope_validate` consume FSM state through the read API, not by re-parsing files.
- [x] Session-type inference follows PDR-001 DD-3 mapping in `architect-cli` and the data-api skill.

## Technical Requirements

- **Architecture**: Contract owned by `@libar-dev/architect-core` (`src/validation/fsm/`); consumed by `@libar-dev/architect-guard` (lint engine), `@libar-dev/architect-cli` (`scope-validate`, `handoff`, `context`), and `@libar-dev/architect-mcp` (parity tools).
- **Inputs**: `(from: ProcessStatus, to: ProcessStatus)`.
- **Outputs**: `boolean` from `isValidTransition`; guard rule violations carry `ruleId: 'invalid-status-transition'`, `severity: 'error'`, the offending pattern, and the rejected transition.
- **Performance**: O(1) lookup against a compile-time-frozen table; no I/O.
- **Invariants** (from `constitution.md` §II Principle 6, §IV.A):
  - No skipping states.
  - `completed` is terminal-unless-unlocked.
  - The transition table is the single source of truth.
  - Session-type inference is derived from FSM state, not the other way around.

## Implementation Status

**Completed:**
- ✅ Canonical transition table: `packages/architect-core/src/validation/fsm/transitions.ts:22-29`.
- ✅ States and protection levels: `packages/architect-core/src/validation/fsm/states.ts:18-23`.
- ✅ Guard rule IDs: `packages/architect-guard/src/lint/process-guard/types.ts:210-216`.
- ✅ Pre-commit binding: `pnpm architect:guard --staged` in `package.json`.
- ✅ Read-side consumption through `PatternGraphAPI` — no duplicated FSM logic in CLI/MCP layers.
- ✅ Session-type inference per PDR-001 DD-3 wired in `architect-cli` and surfaced by the data-api skill.
- ✅ Executable Gherkin coverage in `tests/features/` and `packages/architect-guard/tests/features/` for every transition arrow plus rejection cases.

## Dependencies

- `003-pattern-graph-read-api` — consumers reach FSM state through `PatternGraphAPI`.
- `008-completed-pattern-protection` — extends the FSM with hard-lock semantics on the terminal state.
- `009-scope-creep-detection` — operates on patterns in `active` state and depends on FSM-correct labelling.
- `010-scope-readiness-validation` — `scope-validate` reads FSM status to infer session type.
- `011-session-handoff` — `handoff` emits FSM state in its record.
- `013-pre-commit-guard` — composition root for `architect-guard --staged`.
- External: `zod` (state-value schemas); no other runtime dependencies.

## Related Specifications

- ADR-003 — Source-First Pattern Architecture (FSM state is annotation-derived, not sidecar).
- ADR-006 — Single Read Model (`PatternGraphAPI` carries FSM state).
- ADR-009 — Projection Trust Boundary (FSM state surfaces via `parseAndProject*` boundary, never re-parsed).
- PDR-001 DD-3 — Session-type inference mapping.
- PDR-001 DD-4 — `PASS` / `BLOCKED` / `WARN` verdict alignment with FSM-gated readiness checks.
- Executable Gherkin: `packages/architect-guard/tests/features/process-guard-*.feature`; `tests/features/fsm-transitions.feature`.
- See also: `.specify/specs/008-completed-pattern-protection/spec.md`, `.specify/specs/010-scope-readiness-validation/spec.md`.
