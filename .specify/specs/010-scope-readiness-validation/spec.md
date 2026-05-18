# Feature: Scope-Readiness Validation (`scope-validate`)

## Status

✅ COMPLETE — Deterministic verdict gate returning `PASS` / `BLOCKED` / `WARN`; CLI `architect scope-validate`, MCP `architect_scope_validate`, projection `projectScopeReadinessReport()` returning `ScopeReadinessReport` (`fragments/execution-context/scope-readiness-report.ts:17-22`); pure-function domain (PDR-001 DD-2, NFR-006).

## Overview

`scope-validate` is the pre-flight readiness check every agent (human or AI) runs before opening a design or implementation session for a pattern. It answers a single question: _"Is it safe to start this session on this pattern right now?"_ The answer is one of three deterministic verdict words — **`PASS`**, **`BLOCKED`**, **`WARN`** — aligned with ProcessGuard severity (PDR-001 DD-4). `PASS` permits the FSM transition the session intent implies; `BLOCKED` does not; `WARN` is informational unless `--strict` is passed, in which case it promotes to `BLOCKED`.

The check is composed of multiple `ScopeReadinessCheck` entries — open questions resolved? dependencies in the right state? deliverables enumerated? FSM transition legal? — and the report aggregates them. The verdict is `PASS` only if no check has `severity: 'error'` and (in `--strict` mode) no check has `severity: 'warning'`. The composition is pure: the domain layer reads `PatternGraph` and returns the report. It never invokes the shell, the filesystem, or the network. Git integration is opt-in via `--git` and lives in an adapter outside the domain (PDR-001 DD-2).

`scope-validate` is the gate the entire delivery process pivots on. Every architect-\* session skill calls it before doing real work. Because the domain is pure and the verdict vocabulary is small, both the CLI and MCP surfaces emit byte-identical `ScopeReadinessReport` JSON — agents and humans see the same report.

Reference: `functional-specification.md` FR-010; `data-architecture.md` §3 Execution context + §4c JSON shape; `decision-rationale.md` PDR-001 DD-2 + DD-4; `integration-points.md` MCP tool table.

## User Stories

- As an **AI coding agent**, I want a single `architect_scope_validate` call to tell me `PASS` / `BLOCKED` / `WARN` so I never start work the project guard will later reject.
- As an **AI coding agent**, I want individual check entries (`checkId`, `label`, `severity`, `passed`, `details`) so I can act on a `BLOCKED` verdict programmatically rather than re-reading source.
- As an **AI-augmented developer**, I want `architect scope-validate <pattern> design --strict` in CI so my pipeline fails fast on readiness issues.
- As an **architect maintainer**, I want the verdict words to match ProcessGuard severity so the vocabulary is consistent across the platform.
- As a **session-skill author**, I want the domain to be pure so the rule can be unit-tested without git fixtures.

## Acceptance Criteria

- [x] CLI verb: `architect scope-validate <pattern> <design|implement> [--type <…>] [--strict]` (`integration-points.md` §CLI Surface).
- [x] MCP tool: `architect_scope_validate` with input shape `{ name: string, session: 'design'|'implement', strict?: boolean }` (`integration-points.md` §MCP Surface).
- [x] Output: `ScopeReadinessReport` (`packages/architect-projection/src/fragments/execution-context/scope-readiness-report.ts:17-22`).
- [x] `verdict` field is one of `'PASS' | 'BLOCKED' | 'WARN'`; enum declared in `supporting.ts:18`.
- [x] `verdict === 'PASS'` iff all checks pass at their declared severity threshold.
- [x] `--strict` promotes `WARN` → `BLOCKED` (PDR-001 DD-4).
- [x] Domain layer (`projectScopeReadinessReport`) makes zero shell, filesystem, or network calls (PDR-001 DD-2; NFR-006).
- [x] `--git` opt-in flag enables git-aware checks via an adapter outside the domain.
- [x] CLI and MCP surfaces emit the same Fragment shape; JSON-mode CLI output is byte-identical to MCP tool response.
- [x] Session intent is inferred from FSM status when omitted (PDR-001 DD-3); `--session` overrides.
- [x] Per-check shape: `{ kind: 'ScopeReadinessCheck', checkId, label, severity: 'error'|'warning'|'info', passed, details? }`.
- [x] Report is built deterministically: re-running over the same source produces byte-identical output.
- [x] Trust boundary: `parseAndProjectScopeReadinessReport(...)` validates input once and passes to internal `projectScopeReadinessReport(...)` (ADR-009).

## Technical Requirements

- **Architecture**: Domain owned by `@libar-dev/architect-projection` (`fragments/execution-context/`); CLI dispatch in `@libar-dev/architect-cli`; MCP tool in `@libar-dev/architect-mcp`. Git-aware adapter (opt-in) sits outside the domain.
- **Inputs**: `{ name: string, session: 'design'|'implement', strict?: boolean }` parsed via Zod `strictObject` at the boundary.
- **Outputs**: `ScopeReadinessReport` fragment; verdict `PASS` / `BLOCKED` / `WARN`.
- **Performance**: O(patterns + checks) on a single PatternGraph pass; budgeted under the perf-regression gate (NFR-004).
- **Invariants** (from `constitution.md` §II Principles 4, 5, 7; §IV.D):
  - Parse once at the trust boundary; internal `project*` does not re-validate (ADR-009).
  - Verdict vocabulary is `PASS` / `BLOCKED` / `WARN` only.
  - Domain layer is pure-function (no shell, no IO).
  - CLI and MCP parity: same Fragment, same bytes.

## Implementation Status

**Completed:**

- ✅ Fragment schema: `packages/architect-projection/src/fragments/execution-context/scope-readiness-report.ts:17-22`.
- ✅ Verdict enum: `packages/architect-projection/src/fragments/execution-context/supporting.ts:18`.
- ✅ Domain builder: `projectScopeReadinessReport` + `parseAndProjectScopeReadinessReport`.
- ✅ CLI verb: `architect scope-validate` in `packages/architect-cli/src/cli/pattern-graph-cli-commands.ts:17-42`.
- ✅ MCP tool: `architect_scope_validate` in `ARCHITECT_MCP_TOOLS` (`packages/architect-mcp/src/tool-metadata.ts:1-71`).
- ✅ `--strict` flag implemented and tested.
- ✅ Pure-function domain — no shell calls in `projection/` (audited).
- ✅ Executable Gherkin coverage in `packages/architect-projection/tests/features/` for: pass-verdict, blocked-on-error, warn-without-strict, warn-promoted-with-strict, byte-identical-cli-vs-mcp, deterministic-rerun.

## Dependencies

- `003-pattern-graph-read-api` — readiness checks consume `PatternGraphAPI`.
- `004-fragment-projection-pipeline` — readiness report is a Fragment built by the projection pipeline.
- `002-trust-boundary-validation` — `parseAndProjectScopeReadinessReport` is the Zod-validated entrypoint.
- `007-fsm-lifecycle-enforcement` — session-type inference relies on FSM state.
- `005-cli-surface` and `006-mcp-server` — parity surfaces.
- External: `zod` (boundary validation).

## Related Specifications

- ADR-005 — Codec / Renderer Separation (readiness report is a Fragment, not a string).
- ADR-006 — Single Read Model.
- ADR-009 — Projection Trust Boundary (`parseAndProject*` discipline).
- PDR-001 DD-2 — Pure-function domain; `--git` is an opt-in adapter.
- PDR-001 DD-3 — Session-type inference from FSM status.
- PDR-001 DD-4 — `PASS` / `BLOCKED` / `WARN` severity alignment.
- Executable Gherkin: `packages/architect-projection/tests/features/scope-readiness-*.feature`.
- See also: `.specify/specs/011-session-handoff/spec.md`, `.specify/specs/007-fsm-lifecycle-enforcement/spec.md`.
