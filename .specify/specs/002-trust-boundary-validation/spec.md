# Feature: Trust Boundary Validation

## Status
✅ COMPLETE — Every CLI / MCP / cross-package input is validated against a Zod `strictObject` schema at exactly one boundary. Internal code assumes typed inputs.

## Overview

This is the structural guarantee that holds the platform together: **parse once at the trust boundary, never re-parse inside.** Every CLI argument vector, every MCP tool input, and every cross-package contract is a Zod `z.strictObject` schema. Extra properties fail validation rather than silently passing through. Types are inferred from schemas (`type X = z.infer<typeof XSchema>`) — hand-written aliases that drift are bugs.

This is FR-002 in `functional-specification.md` and the structural principle of ADR-009. Inside the projection pipeline, `parseAndProject*` functions are the only entry points that re-validate; internal `project*` functions assume Zod-validated inputs and skip re-checking for performance.

The platform exposes a single validation primitive — `parseAtBoundary` in `@libar-dev/architect-core` — that raises a `BoundaryParseError` with a formatted Zod error on rejection. Downstream code never catches Zod errors directly.

## User Stories

- As an AI coding agent, I want CLI / MCP inputs to fail loudly with structured errors when I pass the wrong shape, so I can self-correct without producing silent garbage downstream.
- As an architect maintainer, I want one canonical boundary primitive (`parseAtBoundary`), so I never see ad-hoc `try { schema.parse(x) } catch {...}` patterns leak into the codebase.
- As a downstream tool author, I want internal `project*` functions to assume Zod-validated inputs, so the hot path doesn't pay the re-validation cost on every call.
- As an AI-augmented developer, I want `z.strictObject` everywhere so a typo in an MCP arg name is rejected at the boundary, not absorbed silently.

## Acceptance Criteria

- [x] Every `ARCHITECT_MCP_TOOLS` input schema is `z.strictObject(...).readonly()` (`tool-input-schemas.ts:26-30`).
- [x] CLI flag schemas (`CLI_SCHEMA` in `@libar-dev/architect-core`) reject unknown flags.
- [x] `parseAtBoundary(schema, value, context)` is the single entry point for boundary validation.
- [x] `BoundaryParseError` carries the formatted Zod error (`formatZodError`) with field paths and rejection reasons.
- [x] `parseAndProject*` functions exist as the boundary-validated public projection entry points (ADR-009).
- [x] Internal `project*` functions accept typed inputs and do not re-validate.
- [x] Types are inferred via `z.infer<typeof ...>`; there are no hand-written type aliases that diverge from their schemas in production code.
- [x] All cross-package contracts (e.g., `ProjectionContext`, `PerspectiveHint`, `ProjectionFilter`) ship a Zod schema.
- [x] Pre-commit `architect-guard --staged` checks that production code does not bypass the boundary.

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-core`. Public exports: `parseAtBoundary`, `BoundaryParseError`, `formatZodError`. Companion assertion helpers: `assertHasValue`, `assertNoNullBytes`.
- **Inputs**: A Zod schema (`z.strictObject(...)`), an `unknown` value, and a context string for the error message.
- **Outputs**: The Zod-validated typed value (on success); a thrown `BoundaryParseError` (on rejection).
- **Performance**: Validation is paid exactly once per boundary crossing. The hot path inside the projection pipeline runs without re-validation (ADR-009).
- **Invariants** (from Constitution §III.B): Zod `strictObject` everywhere; types flow from schemas; parse once at the trust boundary; no `z.object()` in production code.

## Implementation Status

**Completed:**
- ✅ `parseAtBoundary` + `BoundaryParseError` in `packages/architect-core/src/index.ts`.
- ✅ `formatZodError` produces structured error output for CLI / MCP responses.
- ✅ All 21 MCP tool input schemas are `z.strictObject(...).readonly()` (`packages/architect-mcp/src/tool-input-schemas.ts`).
- ✅ `parseAndProject*` boundary entry points exist for every projection (e.g., `parseAndProjectPatternBundle`, `parseAndProjectScopeReadinessReport`, `parseAndProjectHandoffRecord`).
- ✅ Cross-package contracts (`ProjectionFilterSchema`, `BundleIncludeSchema`, `BundleModeSchema`, etc.) are exported from `@libar-dev/architect-projection`.

## Dependencies

- `zod` (`^4.1.11`) — strict-object schemas and inference.
- Consumed by: every CLI verb, every MCP tool, every cross-package contract. Effectively all of `005-cli-surface`, `006-mcp-server`, `004-fragment-projection-pipeline`.

## Related Specifications

- ADR-009 — Projection Trust Boundary
- Constitution §III.B — Zod-first boundaries; §III.A — No-BC
- `003-pattern-graph-read-api` — graph read methods accept typed inputs by construction
- `004-fragment-projection-pipeline` — `parseAndProject*` vs `project*` split
- Executable specs covering boundary errors in `packages/architect-core/tests/features/`
