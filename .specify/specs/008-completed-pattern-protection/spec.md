# Feature: Completed-Pattern Protection

## Status
✅ COMPLETE — `completed` patterns carry `ProtectionLevel = 'hard'` (`states.ts:18-23`); modification is blocked by ProcessGuard rule `completed-protection` unless the change carries `@architect-unlock-reason "<reason>"`.

## Overview

A pattern that reaches the `completed` state is shipped, value-transferred, and load-bearing. Allowing arbitrary edits to such patterns silently re-opens scope that the FSM, the design spec, and prior reviews already closed. The platform therefore enforces a **hard lock** on `completed` patterns: any modification to a `completed` pattern's annotations, deliverables, or executable Gherkin is rejected at `architect-guard` time unless the offending change explicitly carries an `@architect-unlock-reason "<reason>"` annotation.

The unlock annotation is intentionally textual rather than boolean. It forces the change author — human or agent — to articulate *why* the lock is being broken. The reason becomes part of the commit's audit trail and is surfaced in the guard report. This is the same protection model used for the `no-suppressions` doctrine: the cost of suppression is visibility, not impossibility.

Hard-lock semantics complement the broader FSM (`007-fsm-lifecycle-enforcement`) by treating `completed` as terminal rather than just "the last cell in a transition table." Re-entry from `completed` is not in the transition table at all; an unlock attempt produces a *new* transition (typically `completed → active`) which itself must be justified.

Reference: `functional-specification.md` FR-008, business rule #3; `data-architecture.md` §1e Protection levels; `decision-rationale.md` "Deletion over deprecation" principle.

## User Stories

- As an **AI-augmented developer**, I want the pre-commit guard to reject edits to a `completed` pattern so I do not silently re-open shipped scope.
- As an **AI coding agent**, I want a clear path to override the lock (`@architect-unlock-reason`) so I can perform legitimate maintenance on shipped code with the override recorded in the commit.
- As an **architect maintainer**, I want every unlock reason captured in the audit trail so I can review which patterns are being re-opened and why.
- As a **review reader**, I want the guard report to surface every `@architect-unlock-reason` value so unlocks are visible at PR review time, not just at commit time.

## Acceptance Criteria

- [x] `ProtectionLevel = 'none' | 'scope' | 'hard'` declared in `packages/architect-core/src/validation/fsm/states.ts:18-23`.
- [x] `completed` is mapped to `'hard'`; `active` to `'scope'`; `roadmap` and `deferred` to `'none'`.
- [x] `ProcessGuard` rule `completed-protection` (`packages/architect-guard/src/lint/process-guard/types.ts:210-216`) detects modifications to `completed` patterns.
- [x] Modifications are detected against the staged diff (`--staged`) or full tree (`--all`); both modes enforce equally.
- [x] Presence of `@architect-unlock-reason "<reason>"` on the modified pattern suppresses the rule for that commit only.
- [x] Empty unlock reasons (`@architect-unlock-reason ""`) are rejected; the annotation must carry a quoted reason string.
- [x] The unlock reason is captured in the guard report output (pretty and `--format json` modes).
- [x] An unlock does not bypass other rules; `scope-creep`, `invalid-status-transition`, and `session-excluded` still apply.
- [x] Architect-state files (`architect/specs/`, `architect/decisions/`) are excluded from `completed-protection` — they are not "the pattern."

## Technical Requirements

- **Architecture**: Rule lives in `@libar-dev/architect-guard` (lint engine); state-value mapping owned by `@libar-dev/architect-core`. Guard consumes core's `ProtectionLevel` enum and `getProtectionLevel(status)` helper.
- **Inputs**: `architect-guard --staged` reads `git diff --staged` for the file list; per file, the lint engine looks up the owning pattern via PatternGraph and consults `ProtectionLevel`.
- **Outputs**: Guard violations of shape `{ ruleId: 'completed-protection', severity: 'error', pattern, file, line, unlockReason?: string | null }`.
- **Performance**: Single PatternGraph build per guard run (cached); per-file lookup is O(1).
- **Invariants** (from `constitution.md` §II Principle 6, §IV.A):
  - `completed` is terminal-unless-unlocked.
  - Unlocks must be explicit and reasoned.
  - The protection level is a function of FSM state, not of file path or directory.

## Implementation Status

**Completed:**
- ✅ Protection-level mapping: `packages/architect-core/src/validation/fsm/states.ts:18-23`.
- ✅ Guard rule: `packages/architect-guard/src/lint/process-guard/types.ts:210-216` (`completed-protection`).
- ✅ Pre-commit binding: `pnpm architect:guard --staged` in `package.json`.
- ✅ Annotation grammar: `@architect-unlock-reason` registered as a `quoted-value` tag in the metadata-tag registry (`packages/architect-core/src/taxonomy/registry-builder.ts:152-291`).
- ✅ Json + pretty report formats include the unlock-reason field.
- ✅ Executable Gherkin coverage in `packages/architect-guard/tests/features/` for: protected-edit-without-unlock, protected-edit-with-unlock, empty-unlock-rejected, unlock-does-not-bypass-scope-creep.

## Dependencies

- `007-fsm-lifecycle-enforcement` — `completed` is the terminal state in the FSM table.
- `003-pattern-graph-read-api` — `ProtectionLevel` is exposed via the read API.
- `013-pre-commit-guard` — composition root that runs the rule in CI / pre-commit.
- External: none (no shell, no network).

## Related Specifications

- ADR-003 — Source-First Pattern Architecture (`@architect-unlock-reason` is an annotation, not a sidecar).
- ADR-006 — Single Read Model (protection state lives on `PatternGraph` nodes).
- ADR-009 — Projection Trust Boundary (annotation parsing happens at the trust boundary).
- Executable Gherkin: `packages/architect-guard/tests/features/process-guard-completed-protection*.feature`.
- See also: `.specify/specs/007-fsm-lifecycle-enforcement/spec.md`, `.specify/specs/009-scope-creep-detection/spec.md`, `.specify/specs/014-no-suppression-enforcement/spec.md`.
