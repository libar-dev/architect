# Feature: Fragment Projection Pipeline

## Status
✅ COMPLETE — Codec / renderer separation per ADR-005. CI perf-regression gate enforces median latency drift ≤ `baseline × 1.5`.

## Overview

The projection pipeline is the codec / renderer layer (ADR-005) that transforms a `PatternGraph` into typed **Fragments** and renders those into markdown, JSON, or compact output. Every CLI verb, every MCP tool response, and every `pnpm docs:all` output flows through this pipeline (FR-004).

Two public API conventions enforce ADR-009 (trust boundary):

- **`parseAndProject*`** — the boundary entry point. Validates raw inputs against a Zod schema, then projects. Used by external consumers and by the CLI / MCP composition roots.
- **`project*`** — the internal hot path. Accepts pre-validated typed inputs, projects, returns a Zod-validated Fragment. Used inside the pipeline and by consumers that have already crossed the boundary.

Renderers (`render*`) are pure functions over fragments. `RenderMarkdownOptions`, `RenderJsonOptions`, `RenderCompactOptions`, and `RenderUiOptions` govern output shape. Markdown renderers escape labels, validate URL schemes, and reject protocol-relative targets (ADR-009 §Renderer hygiene).

The pipeline is governed by a **perf-regression gate** in CI: a 36-pattern / 108-rule fixture establishes a latency baseline. Drift over `baseline × 1.5` fails the gate (NFR-004). Profile changes that move the needle; do not suppress the test.

## User Stories

- As an AI coding agent, I want every MCP tool response to be a Zod-validated fragment, so I can trust the shape without runtime guards.
- As an architect maintainer, I want one canonical pipeline (`@libar-dev/architect-projection`), so adding a new CLI verb is "add a fragment + a renderer," not "add another rendering path."
- As a doc consumer, I want `pnpm docs:all` to produce byte-identical output on re-runs, so I can diff generated docs in PRs meaningfully.
- As an AI-augmented developer, I want `--format compact|json` parity across CLI verbs, so my downstream tooling never has to scrape markdown.

## Acceptance Criteria

- [x] Codec / renderer separation: projection functions never embed markdown; renderers never re-walk the graph.
- [x] Boundary split: `parseAndProject*` validates raw input; `project*` skips re-validation.
- [x] All fragments are Zod-validated on output (round-tripped through schemas under `fragments/`).
- [x] Markdown renderer escapes labels, validates URL schemes, rejects protocol-relative URLs (ADR-009 §Renderer hygiene).
- [x] Three render formats: markdown, JSON, compact. UI renderer for TTY output.
- [x] Subpath exports usable independently: `@libar-dev/architect-projection/projections`, `/fragments`, `/renderers`, `/disclosure`, `/blocks`.
- [x] Disclosure levels filter fragment depth (e.g., `--disclosure <level>` on `architect-generate`).
- [x] Documentation bundle composer (`projectDocumentationBundle`) aggregates multiple projections into one artifact.
- [x] **Perf gate**: median latency over the 36-pattern / 108-rule fixture stays within `baseline × 1.5`. Failures land in CI, not at runtime.
- [x] Trusted-Inline-Markdown is a deliberate, renderer-private escape hatch (not exposed at the public API).

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-projection`. Six fragment families (`pattern-relations`, `delivery-reporting`, `governance`, `execution-context`, `operational-insights`, `documentation-composition`). Renderer module under `renderers/`. Disclosure and routing modules govern fragment depth and target.
- **Inputs**: A `PatternGraphAPI` (or `ProjectionContext`), plus a fragment-specific options object validated against a Zod `strictObject`.
- **Outputs**: A Zod-validated Fragment object plus optional rendered string (markdown / JSON / compact / UI).
- **Performance**: NFR-004 — median latency ≤ `baseline × 1.5` against the 36-pattern / 108-rule CI fixture. Cold pipeline boot ~1–2s on the 329-file workspace.
- **Invariants** (from Constitution §II, §III): Trust Boundary Discipline (Principle 4); Single Read Model (Principle 3); No-BC; deterministic output.

## Implementation Status

**Completed:**
- ✅ All `project*` and `parseAndProject*` families exported from `packages/architect-projection/src/index.ts` (see `integration-points.md` §JS API).
- ✅ Renderer module with `RenderMarkdownOptions`, `RenderJsonOptions`, `RenderCompactOptions`, `RenderUiOptions`.
- ✅ `MarkdownRenderEvent` event surface for renderer observability.
- ✅ `ProjectionError` + `ProjectionErrorCode` error taxonomy.
- ✅ CI perf-regression gate in `packages/architect-projection/tests/` with the 36-pattern / 108-rule fixture.
- ✅ Disclosure routing and subpath exports.

## Dependencies

- `003-pattern-graph-read-api` — input source.
- `002-trust-boundary-validation` — the `parseAndProject*` / `project*` split.
- `zod` — fragment schemas.
- Consumed by: `005-cli-surface`, `006-mcp-server`, `012-doc-generation-pipeline`.

## Related Specifications

- ADR-005 — Codec / Renderer Separation
- ADR-009 — Projection Trust Boundary
- Constitution §II Principle 4 (Trust Boundary), §III.E (Perf Regression Gate)
- `002-trust-boundary-validation` — boundary primitives
- `012-doc-generation-pipeline` — `pnpm docs:all` consumes fragments + renderers
- Executable specs under `packages/architect-projection/tests/features/`
