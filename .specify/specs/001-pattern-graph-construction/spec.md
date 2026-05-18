# Feature: Pattern Graph Construction

## Status
✅ COMPLETE — Build pipeline scans annotated TypeScript + Gherkin sources and produces a typed in-memory `PatternGraph`. Fully implemented in `@libar-dev/architect-core`.

## Overview

The pattern graph is the **single source of truth** for what the codebase actually is. It is built by scanning annotated TypeScript files (`@architect-pattern`, `@architect-implements`, etc.) and Gherkin specs (architect state + executable features) into a typed in-memory graph of patterns plus their relationships (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`).

This is FR-001 in `functional-specification.md`. Every downstream surface (CLI, MCP, projection pipeline, ProcessGuard, doc generators) reads from this graph via the read API (`003-pattern-graph-read-api`). Per ADR-003, pattern identity travels with the code, not a sidecar database — the graph is fully reconstructible from source on every build.

Construction is tolerant of malformed input: parse failures land in `featureParseFailures` and `MalformedPattern` collections rather than aborting the build, so a single broken spec never breaks the rest of the graph (FR-016, see `016-tolerant-spec-ingestion`).

## User Stories

- As an AI-augmented developer, I want to annotate a TypeScript file with `@architect-pattern:Foo` and have the agent see `Foo` in `architect overview` immediately, so the agent knows the codebase structure without re-reading every file.
- As an AI coding agent, I want a typed, deterministic graph object on every cold start, so my reasoning is grounded in a stable model rather than free-form file reads.
- As an architect maintainer, I want one canonical build pipeline (`buildPatternGraph`), so every consumer (CLI, MCP, generators) sees the same graph by construction.
- As a downstream tool author, I want `BuildResult` to carry `DanglingReference`, `MalformedPattern`, `PipelineError`, `PipelineWarning`, and `ScanMetadata`, so I can render warnings without re-walking the source.

## Acceptance Criteria

- [x] `buildPatternGraph(config)` scans the configured input globs and produces a `RuntimePatternGraph` plus `ScanMetadata`.
- [x] All seven relation kinds are extracted: `depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref` (per Tech-debt #3 — CLAUDE.md's "four edges" framing is the high-level model; the projection layer enumerates seven).
- [x] Tolerant ingestion: malformed Gherkin lands in `featureParseFailures`, malformed annotations land in `MalformedPattern`; the build never aborts on a single bad file.
- [x] One `@architect-pattern` per TypeScript file is enforced.
- [x] Pattern names must match `^[A-Z][A-Za-z0-9]+$` (PascalCase) — enforced by `PatternIdentifier`.
- [x] Build output passes `parseAtBoundary` Zod validation before the graph is returned (`transformToPatternGraphWithValidation`).
- [x] CLI verb `architect overview` produces a `projectOverviewDigest` of the freshly built graph.
- [x] Re-running `buildPatternGraph` over the same source produces a deterministic graph (re-running `pnpm docs:all` yields byte-identical output).

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-core`. Entry point `buildPatternGraph` in `src/index.ts`; supporting types `BuildResult`, `RuntimePatternGraph`, `RawDataset`, `ScanMetadata`, `PipelineOptions`. Scanner / extractor modules under `architect-core/src/scanner` and `architect-core/src/extractor`.
- **Inputs**: TypeScript source files with `@architect-*` JSDoc; Gherkin `.feature` files under architect state folders (`architect/specs/`, `architect/decisions/`, `formal-spec/`) and executable folders (`tests/features/`, `packages/*/tests/features/`).
- **Outputs**: `RuntimePatternGraph` (in-memory typed model), `featureParseFailures` (`FeatureParseFailure[]`), `malformedPatterns` (`MalformedPattern[]`), `pipelineWarnings` (`PipelineWarning[]`), `pipelineErrors` (`PipelineError[]`), `danglingReferences` (`DanglingReference[]`).
- **Performance**: Cold build on the dogfood workspace (~329 source files) targets ≤ ~2s for MCP cold-start (NFR-005, not a committed budget).
- **Invariants** (from Constitution §II): Source-First (Principle 1), Architect State Is Code (Principle 2), one `@architect-pattern` per file, deterministic output.

## Implementation Status

**Completed:**
- ✅ `buildPatternGraph` and `transformToPatternGraph(WithValidation)` in `packages/architect-core/src/index.ts`.
- ✅ Scanner + extractor modules under `packages/architect-core/src/scanner/` and `/extractor/`.
- ✅ `PatternIdentifier` regex in `pattern-contract.ts:3,12-16`.
- ✅ Two-parser Gherkin pipeline: `@cucumber/gherkin` for architect state, `@amiceli/vitest-cucumber` for executable (see `data-architecture.md` §1a).
- ✅ Diagnostic codes via `EXTRACTION_DIAGNOSTIC_CODES` and `createDiagnostic`.
- ✅ Tolerant ingestion fields on `PatternGraph` (`featureParseFailures`, `malformedPatterns`).

## Dependencies

- `@cucumber/gherkin` — parse architect state `.feature` files at build time.
- `zod` (`^4.1.11`) — validate `BuildResult` and `RuntimePatternGraph` at the boundary.
- Consumed by: `003-pattern-graph-read-api`, `004-fragment-projection-pipeline`, `006-mcp-server`, `012-doc-generation-pipeline`, `005-cli-surface`.

## Related Specifications

- ADR-003 — Source-First Pattern Architecture
- ADR-009 — Projection Trust Boundary
- `002-trust-boundary-validation` — Zod validation that gates the graph output
- `003-pattern-graph-read-api` — the read-side projection of this graph
- `016-tolerant-spec-ingestion` — failure-collection semantics
- Executable specs under `packages/architect-core/tests/features/`
