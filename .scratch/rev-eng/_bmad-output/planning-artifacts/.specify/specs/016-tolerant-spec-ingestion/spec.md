# Feature: Tolerant Spec Ingestion

## Status

✅ COMPLETE — Malformed Gherkin / annotation parse failures land in `PatternGraph.featureParseFailures` rather than crashing the build; never silent drops.

## Overview

The build pipeline (`buildPatternGraph` in `@libar-dev/architect-core`) ingests two kinds of source: annotated TypeScript files and Gherkin `.feature` files (architect-state specs in `architect/specs/`, decisions in `architect/decisions/`, executable features in `tests/features/`). At repo scale (329 TypeScript files, 128 `.feature` files at the pinned commit), the probability that _every_ source file is well-formed at every commit is near zero — files in progress, mid-rename, mid-promotion are normal.

Tolerant ingestion is the policy that the build pipeline **must not crash** on a malformed file. Instead, the failure is captured into structured diagnostic fields on the resulting `PatternGraph`:

- `featureParseFailures` — Gherkin files that could not be parsed.
- `MalformedPattern[]` — pattern annotations that violated the schema.
- `PipelineWarning[]` / `PipelineError[]` — soft / hard problems short of crashes.
- `DanglingReference[]` (per spec 015) — references that resolved to no target.

The constitution names this as the inverse of silent drops: **failures are visible**. An agent calling `architect_overview` sees not just the well-formed nodes but also the diagnostic counts, and can drill into any specific failure via `architect diagnostics`.

This is the runtime realization of FR-016 and a load-bearing piece of the source-first invariant (ADR-003): if ingestion crashed on bad input, the maintainer would have to choose between "fix every file before any work continues" or "exclude files I don't want to fix yet" — both of which corrode source-first identity. Tolerant ingestion preserves the invariant while keeping operators in control.

## User Stories

- As an architect maintainer, I want a malformed `.feature` file to land in `featureParseFailures` rather than crash `pnpm architect:overview` so I can keep working while I fix it.
- As an AI coding agent, I want to call `architect_overview` on a half-finished worktree without choosing between "all-or-nothing" failure modes.
- As an architect maintainer, I want `architect diagnostics` to enumerate every parse failure with the file path and the parser's error message so I can fix the root cause.
- As an AI-augmented developer, I want pattern-graph queries to keep returning the well-formed subset while diagnostics report the rest so I can iterate locally.
- As a CI maintainer, I want a separate gate (`arch dangling --strict`, `validate:all`) to convert these diagnostics into a hard CI failure when I am ready to enforce zero tolerance.

## Acceptance Criteria

- [x] `PatternGraph.featureParseFailures` field carries Gherkin parse failures with file path + parser error.
- [x] `MalformedPattern` records carry annotation-level schema violations.
- [x] `PipelineWarning` and `PipelineError` types are exported from `@libar-dev/architect-core`.
- [x] `buildPatternGraph` never throws on malformed source; it always returns a `BuildResult`.
- [x] `architect diagnostics` enumerates these diagnostic fields.
- [x] Well-formed patterns remain query-able while malformed siblings are diagnosed (no all-or-nothing failure).
- [x] No silent drops — every dropped file is named in one of the diagnostic fields.
- [x] Tolerant ingestion does not paper over schema errors in well-formed-shaped files: a file that _parses_ but violates Zod still produces a `MalformedPattern` record.
- [x] `architect-mcp --watch` rebuilds tolerantly on file changes (500ms debounce) and surfaces new failures in subsequent tool calls.

## Technical Requirements

- **Surface**: `BuildResult` (`@libar-dev/architect-core`), `architect diagnostics` CLI verb, `architect_rebuild` MCP tool.
- **Diagnostic types**: `MalformedPattern`, `PipelineError`, `PipelineWarning`, `featureParseFailures` (a typed array on the PatternGraph).
- **Parser**: `parseFeatureFile` (Gherkin entry point in `architect-core`) wraps `@cucumber/gherkin` in a try/catch that captures into `featureParseFailures` rather than throwing.
- **Error surface**: every captured failure includes `filePath`, `parserError` (string), and the byte offset where the parser stopped.
- **Invariants**:
  - `buildPatternGraph` returns; never throws on source-level malformations.
  - `featureParseFailures` is never `undefined` — at minimum an empty array.
  - A file that produced a parse failure does **not** also produce a phantom node (no half-state in the graph).
  - Re-running build on identical source produces identical diagnostics (deterministic per Principle 5).

## Implementation Status

**Completed:**

- ✅ `featureParseFailures` field on `PatternGraph` (`data-architecture.md` §1a).
- ✅ `MalformedPattern`, `PipelineError`, `PipelineWarning`, `BuildResult` types exported from `architect-core`.
- ✅ `parseFeatureFile` wraps `@cucumber/gherkin` with capture-on-failure semantics.
- ✅ `architect diagnostics` and `architect_rebuild` surface the diagnostic counts.
- ✅ MCP `--watch` (500ms debounce) keeps diagnostic counts fresh on filesystem changes.

## Dependencies

- Spec 001 (`pattern-graph-construction`) — tolerant ingestion is the build pipeline's failure mode.
- Spec 015 (`dangling-reference-tracking`) — complementary diagnostic surface: dangling targets vs. unparseable sources.
- Spec 006 (`mcp-server`) — `--watch` and `architect_rebuild` integrate tolerant ingestion with the long-running server.
- External: `@cucumber/gherkin` (the parser whose failures are caught).

## Related Specifications

- `data-architecture.md` §1a (`PatternGraph` schema with diagnostic fields).
- ADR-003 — Source-First Pattern Architecture (tolerance protects the invariant).
- ADR-009 — Projection Trust Boundary (validation discipline; tolerant ingestion is the upstream complement).
- AGENTS.md §"Two Gherkin parsers — distinguish them" — the `@cucumber/gherkin` side is the one wrapped by tolerant ingestion.
- `functional-specification.md` FR-016.
