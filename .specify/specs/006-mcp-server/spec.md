# Feature: MCP Server

## Status

⚠️ PARTIAL — Server ships 21 tools at the registry; **documentation drift** in two places lists 18 (Tech-debt #2, #12). Code is correct; docs need patching.

## Overview

The MCP server is the **agent-native consumption surface** for the platform (FR-006, FR-017). It exposes the same verbs as the CLI (`005-cli-surface`) via the Model Context Protocol over stdio, so AI coding agents (Claude Code, OpenCode, Cursor) can call `architect_overview`, `architect_scope_validate`, `architect_handoff`, etc. without spawning a CLI subprocess per call. After cold start (~1–2s on the 329-file dogfood workspace), the server dispatches read API calls O(1).

The server registry (`ARCHITECT_MCP_TOOLS` in `tool-metadata.ts:1-71`) currently lists **21 tools** with full CLI parity. MCP tool names follow the underscores-end-to-end convention (`architect_scope_validate`, not `architect_scope-validate`). Every tool input schema is `z.strictObject(...).readonly()` per ADR-009 (`tool-input-schemas.ts:26-30`).

Two documents are stale: the meta-package `description` in `packages/architect/package.json` says **18 tools**, and `docs/MCP-SETUP.md:88-106` enumerates **18 tools** (Tech-debt #2, #12). CLAUDE.md / AGENTS.md says **21**, which matches the registry. The doc drift is a **Quick Win** in the Phase A doc-patch PR.

The `--watch` mode subscribes to filesystem changes with a 500 ms debounce and rebuilds the in-memory graph in place. Manual rebuild is also exposed as `architect_rebuild`.

## User Stories

- As an AI coding agent, I want `architect_overview` and `architect_scope_validate` callable as MCP tools, so I never have to read raw source files or spawn CLI subprocesses to orient myself.
- As an AI-augmented developer, I want one MCP server config block (`{ command: "npx", args: ["architect-mcp"] }`) to wire any consumer project into my agent, so onboarding is one PR.
- As an architect maintainer, I want **CLI / MCP parity** so the agent and the human see the same verbs and the same verdicts.
- As an AI coding agent, I want `--watch` mode to keep the graph fresh as I edit, so my next tool call sees the new state without a manual rebuild.
- As a docs consumer, I want the tool count documented consistently in CLAUDE.md, the meta-package description, and `docs/MCP-SETUP.md`, so I can trust any one of them.

## Acceptance Criteria

- [x] `ARCHITECT_MCP_TOOLS` registry exposes 21 tools (`packages/architect-mcp/src/tool-metadata.ts:1-71`).
- [x] Each tool input schema is `z.strictObject(...).readonly()` (`tool-input-schemas.ts:26-30`).
- [x] MCP names are underscores end-to-end (`architect_scope_validate`, never hyphens).
- [x] Server flags: `--input <glob>` (repeatable), `--features <glob>` (repeatable), `--base-dir <dir>`, `--watch`, `--help`, `--version`.
- [x] `--watch` debounces filesystem changes at 500 ms.
- [x] `architect_rebuild` triggers a manual rebuild without `--watch`.
- [x] Server transport is **stdio** only — no network exposure.
- [x] Server instructions string (`tool-metadata.ts:85-86`) advises: _"Use architect_overview first. Then use architect_scope_validate and architect_context for focused delivery work."_
- [x] Every MCP tool has a CLI parity verb (with two registry-only utilities: `architect_coverage`, `architect_config`).
- [ ] **Drift fix**: meta-package `description` in `packages/architect/package.json` updated to "21 tools" (Tech-debt #2).
- [ ] **Drift fix**: `docs/MCP-SETUP.md:88-106` enumerates all 21 tools (Tech-debt #12).

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-mcp`. Entry bin: `packages/architect-mcp/src/cli/mcp-server.ts`. Tool registry: `tool-metadata.ts`. Input schemas: `tool-input-schemas.ts`. Runtime helpers: `runtime-helpers.ts`.
- **Inputs**: MCP JSON-RPC requests over stdio. Each tool input is validated against its `z.strictObject(...).readonly()` schema.
- **Outputs**: MCP tool responses (Zod-validated fragments rendered as JSON).
- **Performance**: Cold start ~1–2s on the dogfood workspace (NFR-005). Dispatch O(1) after warm-up. `--watch` debounce 500 ms.
- **Invariants** (from Constitution): Trust Boundary Discipline (§II.4); CLI / MCP parity (§IV.E); stdio-only transport — no HTTP server, no remote endpoint, no auth surface (§VII Out of Scope).

## Implementation Status

**Completed:**

- ✅ MCP server entry: `packages/architect-mcp/src/cli/mcp-server.ts`.
- ✅ 21 tools registered in `ARCHITECT_MCP_TOOLS` (`tool-metadata.ts:1-71`).
- ✅ `z.strictObject(...).readonly()` discipline on every input schema.
- ✅ `--watch` mode with 500 ms debounce.
- ✅ `architect_rebuild` manual refresh tool.
- ✅ Server-instructions string in `tool-metadata.ts:85-86`.
- ✅ Wiring snippet documented in `docs/MCP-SETUP.md` (the _wiring_ section is correct; only the tool _list_ is stale).

**Missing / Drift:**

- ⚠️ Tech-debt #2 — `packages/architect/package.json` meta description says "18 tools"; should say 21.
- ⚠️ Tech-debt #12 — `docs/MCP-SETUP.md:88-106` lists 18 tools; should enumerate all 21 and match the registry.
- Both fixes are scheduled for the Phase A doc-patch PR (≈1–2 hours combined; see `technical-debt-analysis.md` §"Suggested Migration Phases").

## Dependencies

- `001-pattern-graph-construction` — pipeline boot loads the graph.
- `003-pattern-graph-read-api` — every tool reads through `PatternGraphAPI`.
- `004-fragment-projection-pipeline` — tool responses are projected fragments.
- `002-trust-boundary-validation` — `z.strictObject(...).readonly()` schemas.
- `@modelcontextprotocol/sdk` (transitive) — MCP server framework.
- Consumed by: AI coding agents (Claude Code, OpenCode, Cursor); `018-agent-skills-system`.

## Related Specifications

- ADR-006 — Single Read Model (the source of CLI/MCP parity)
- ADR-009 — Projection Trust Boundary (`strictObject` discipline)
- Constitution §IV.E — Default to CLI; reach for MCP only for bursts
- Constitution §VII — Out of Scope (no HTTP, no auth, stdio only)
- `005-cli-surface` — CLI parity verbs
- `021-doctrine-doc-drift-fixes` — bundles the tool-count drift fixes (Tech-debt #2, #12)
- Executable specs under `packages/architect-mcp/tests/features/`
