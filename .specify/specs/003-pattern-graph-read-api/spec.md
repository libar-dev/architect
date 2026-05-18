# Feature: Pattern Graph Read API

## Status
✅ COMPLETE — `createPatternGraphAPI` is the single read model. Every read-side consumer goes through it.

## Overview

The `PatternGraphAPI` is the **one stable read surface** over the constructed pattern graph (FR-003). It is the canonical realization of ADR-006 (Single Read Model): no parallel read paths, no "fast path" caches that bypass the API, no consumer code that walks the raw graph directly. CLI bins, MCP tools, the projection pipeline, ProcessGuard, and the doc generators all read through `createPatternGraphAPI()`.

The API surfaces both direct accessors (`getPatternName`, `findPatternByName`, `allPatternNames`) and graph queries (`getRelationshipsForPattern`, `getCanonicalRelationshipIndex`, `computeNeighborhood`, `compareContexts`, `findOrphanPatterns`). Architecture-level helpers — bounded-context membership, role resolution (`resolveRoleDefinition`, `resolveCanonicalRole`), edge externality (`classifyEdgeExternality`) — are exposed as named functions on the same module.

This API is **read-only**. Mutations to the graph happen only by rebuilding from source (see `001-pattern-graph-construction`).

## User Stories

- As an AI coding agent, I want one stable read API so my MCP tool calls and CLI verbs always see the same graph view.
- As an architect maintainer, I want every downstream consumer (CLI, MCP, projection, generators) to compose with `PatternGraphAPI`, so adding a new query is a one-line export, not a refactor of multiple read paths.
- As a downstream tool author, I want `findPatternByName(name)` and `suggestPattern(query)` to handle near-misses, so typos don't cascade into "pattern not found" failures for the agent.
- As an AI-augmented developer, I want `getRelationships(pattern)` to enumerate all seven relation kinds uniformly, so my edge-filter logic doesn't miss `enables`, `extends`, or `api-ref` (Tech-debt #3).

## Acceptance Criteria

- [x] `createPatternGraphAPI(graph)` returns a `PatternGraphAPI` instance over a `RuntimePatternGraph`.
- [x] Direct accessors are present: `getPatternName`, `findPatternByName`, `findPatternParseFailure`, `allPatternNames`.
- [x] Relationship queries: `getRelationshipsForPattern`, `getRelationships`, `getCanonicalRelationshipIndex`.
- [x] Graph queries: `computeNeighborhood`, `compareContexts`, `findOrphanPatterns`.
- [x] Role / taxonomy: `resolveRoleDefinition`, `resolveCanonicalRole`, `firstImplements`.
- [x] Inventory helpers: `aggregateTagUsage`, `buildSourceInventory`.
- [x] Edge classification: `classifyEdgeExternality`, `buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget`.
- [x] Suggestion: `suggestPattern(query)` for near-miss handling.
- [x] No consumer in `packages/*/src` walks the raw graph directly — all reads go through `PatternGraphAPI`.
- [x] All seven relation kinds (`depends-on`, `uses`, `enables`, `implements`, `extends`, `see-also`, `api-ref`) are reachable through the API.

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-core`. Module-level functions plus a builder factory (`createPatternGraphAPI`). Type re-export: `PatternGraphAPI`.
- **Inputs**: A `RuntimePatternGraph` produced by `buildPatternGraph`.
- **Outputs**: Read-only typed accessors; never mutates. Pattern lookups are O(1) by name; relationship queries are O(1) by canonical index.
- **Performance**: All queries assume an in-memory graph; no I/O on the read path. The MCP server loads the pipeline once (~1–2s cold start) and dispatches read API calls O(1) (`integration-points.md`).
- **Invariants** (from Constitution §II): Single Read Model (Principle 3); reads never mutate; reads never trigger filesystem I/O.

## Implementation Status

**Completed:**
- ✅ `createPatternGraphAPI` + `PatternGraphAPI` type in `packages/architect-core/src/index.ts`.
- ✅ Full set of helpers exposed at the module level (see `integration-points.md` §"Read API").
- ✅ Used by every CLI bin in `packages/architect-cli` and every MCP tool in `packages/architect-mcp`.
- ✅ Used by the projection pipeline in `@libar-dev/architect-projection` as the input source for `project*` functions.
- ✅ Used by `ProcessGuard` in `@libar-dev/architect-guard` for FSM lookups.

## Dependencies

- `001-pattern-graph-construction` — the source of the `RuntimePatternGraph` this API reads.
- Consumed by: `004-fragment-projection-pipeline`, `005-cli-surface`, `006-mcp-server`, `007-fsm-lifecycle-enforcement`, `012-doc-generation-pipeline`, `015-dangling-reference-tracking`.

## Related Specifications

- ADR-006 — Single Read Model
- ADR-003 — Source-First Pattern Architecture (graph identity travels with code)
- Constitution §II Principle 3 — Single Read Model
- `004-fragment-projection-pipeline` — sole projection layer over this API
- Executable specs under `packages/architect-core/tests/features/`
