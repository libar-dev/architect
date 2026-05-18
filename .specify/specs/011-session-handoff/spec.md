# Feature: Session Handoff (`handoff`)

## Status
✅ COMPLETE — CLI `architect handoff --pattern <p> [--session <…>] [--modified-file <path>]…`; MCP `architect_handoff` with `{ name, session?, modifiedFiles? }`; emits a `HandoffRecord` Fragment for the next agent session.

## Overview

A typical Architect session — design, implementation, refactor — runs across multiple agent turns and may span multiple model conversations. When a session ends (intentionally or because context fills), the platform must hand off enough state to the next session that work resumes without ambiguity: which pattern was the focus, what session type, what FSM state, which files changed, what blockers remain, and what the recommended next steps are.

`handoff` is the verb that emits that record. It is the symmetric counterpart to `scope-validate`: scope-validate gates the *opening* of a session, handoff captures the *closing* state. The result is a `HandoffRecord` Fragment — a typed, Zod-validated structure that the next agent (or the next human) can re-ingest deterministically. Like scope-validate, handoff's domain is pure: it reads `PatternGraph` and (optionally, via `--git`) the modified-files list, and emits the record. No shell calls live in the domain layer.

The handoff record's `session` field carries the four-valued `HandoffSessionType` (`SessionType + 'review'`), reflecting that a review pass can also produce a handoff at its conclusion. The `modifiedFiles` argument is capped at 200 entries — a deliberate, schema-enforced bound to keep records compact and the next session's bootstrap fast.

Reference: `functional-specification.md` FR-011; `data-architecture.md` §3 Execution context (`HandoffRecord`); `decision-rationale.md` PDR-001 DD-2 (pure domain); `integration-points.md` CLI + MCP tables.

## User Stories

- As an **AI coding agent** ending a session, I want `architect_handoff` to emit a structured handoff record so the next session can resume without context loss.
- As an **AI coding agent** opening a session, I want to ingest the prior session's `HandoffRecord` so I know the pattern, the prior session type, and the modified-file set without re-reading the conversation.
- As an **AI-augmented developer**, I want `architect handoff --modified-file <path>` to accept explicit overrides so I can shape the record when git status is misleading (e.g., uncommitted reverts).
- As an **architect maintainer**, I want the handoff record to be a Zod-validated Fragment so consumers can rely on its shape across versions.

## Acceptance Criteria

- [x] CLI verb: `architect handoff --pattern <p> [--session planning|design|implement|review] [--modified-file <path>]…`.
- [x] MCP tool: `architect_handoff` with shape `{ name: string, session?: HandoffSessionType, modifiedFiles?: string[] (max 200) }` (`integration-points.md` §MCP Surface).
- [x] `HandoffSessionType` = `SessionType` ∪ `{ 'review' }` (declared in `packages/architect-core/src/domain-enums.ts:13-23`).
- [x] Output: a `HandoffRecord` Fragment validated by Zod.
- [x] Session type defaults to the FSM-inferred value (PDR-001 DD-3); `--session` overrides.
- [x] Domain layer (`projectHandoffRecord` / `requireProjectedHandoff`) makes zero shell, filesystem, or network calls (PDR-001 DD-2; NFR-006).
- [x] `--git` opt-in adapter (outside the domain) can populate `modifiedFiles` from `git status`.
- [x] `modifiedFiles` array is capped at 200 entries by schema validation; excess inputs produce a clear validation error.
- [x] CLI and MCP surfaces emit identical `HandoffRecord` bytes for identical inputs.
- [x] Trust boundary: `parseAndProjectHandoffRecord` validates input once; internal `project*` does not re-validate (ADR-009).
- [x] Record is deterministic: re-running over the same source produces byte-identical output.

## Technical Requirements

- **Architecture**: Fragment owned by `@libar-dev/architect-projection` (`fragments/execution-context/`); CLI dispatch in `@libar-dev/architect-cli` (`pattern-graph-cli.ts` calls `requireProjectedHandoff`); MCP tool in `@libar-dev/architect-mcp`.
- **Inputs**: `{ name: string, session?: HandoffSessionType, modifiedFiles?: string[] }` validated via Zod `strictObject`.
- **Outputs**: `HandoffRecord` Fragment containing pattern, session type, FSM state, modified-file list, recommended next steps.
- **Performance**: O(patterns) on a single PatternGraph pass.
- **Invariants** (from `constitution.md` §II Principles 4, 7; §IV.D):
  - Pure-function domain.
  - Schema-enforced bounds (200-file cap).
  - CLI and MCP parity.
  - Parse once at the trust boundary.

## Implementation Status

**Completed:**
- ✅ `HandoffSessionType` enum: `packages/architect-core/src/domain-enums.ts:13-23`.
- ✅ Fragment schema: `packages/architect-projection/src/fragments/execution-context/handoff-record.ts`.
- ✅ Domain builder: `projectHandoffRecord` + `requireProjectedHandoff`.
- ✅ CLI verb: `architect handoff` in `packages/architect-cli/src/cli/pattern-graph-cli-commands.ts:17-42`.
- ✅ MCP tool: `architect_handoff` in `ARCHITECT_MCP_TOOLS` (`packages/architect-mcp/src/tool-metadata.ts:1-71`).
- ✅ Pure-function domain — no shell in `projection/` (audited).
- ✅ Git adapter is opt-in via `--git`; lives outside the projection layer.
- ✅ 200-entry cap enforced via Zod schema validation.
- ✅ Executable Gherkin coverage in `packages/architect-projection/tests/features/` for: emit-record, fsm-inferred-session, explicit-session-override, modified-file-cap, byte-identical-cli-vs-mcp, deterministic-rerun.

## Dependencies

- `003-pattern-graph-read-api` — handoff reads FSM state via `PatternGraphAPI`.
- `004-fragment-projection-pipeline` — `HandoffRecord` is a Fragment.
- `002-trust-boundary-validation` — Zod boundary at `parseAndProjectHandoffRecord`.
- `007-fsm-lifecycle-enforcement` — session-type inference uses FSM state (PDR-001 DD-3).
- `010-scope-readiness-validation` — symmetric counterpart at session open.
- `005-cli-surface` and `006-mcp-server` — parity surfaces.
- External: `zod`.

## Related Specifications

- ADR-005 — Codec / Renderer Separation (record is a Fragment).
- ADR-006 — Single Read Model.
- ADR-009 — Projection Trust Boundary.
- PDR-001 DD-1 — Text output with `=== SECTION ===` markers (CLI text mode).
- PDR-001 DD-2 — Pure-function domain; `--git` opt-in adapter.
- PDR-001 DD-3 — Session-type inference from FSM status.
- Executable Gherkin: `packages/architect-projection/tests/features/handoff-record-*.feature`.
- See also: `.specify/specs/010-scope-readiness-validation/spec.md`, `.specify/specs/007-fsm-lifecycle-enforcement/spec.md`.
