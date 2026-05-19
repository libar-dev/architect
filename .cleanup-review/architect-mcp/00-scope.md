# Cleanup Review — `@libar-dev/architect-mcp`

## Target

`packages/architect-mcp/src/**` — the MCP server that exposes architect verbs
to LLM tooling (Claude Code / agents). 21 MCP tools per the data-api skill.

- **TS files**: 9
- **Lines of code**: ~1,587
- **File-by-file** (smallest package, individual file sizes matter):
  - `tool-registry.ts` — 666 LOC (largest; the registry of MCP tool handlers)
  - `server.ts` — 253 LOC (MCP server bootstrap)
  - `pipeline-session.ts` — 252 LOC (session-cached pipeline; per-session SHA1/mtime cache)
  - `file-watcher.ts` — 120 LOC (chokidar-based watcher for file change events)
  - `tool-input-schemas.ts` — 117 LOC (Zod schemas for MCP tool inputs)
  - `tool-metadata.ts` — 104 LOC (tool descriptions and arg metadata)
  - `runtime-helpers.ts` — 34 LOC
  - `cli/mcp-server.ts` — 27 LOC (bin entry)
  - `index.ts` — 14 LOC (barrel)

## Package facts

- Public surface: `.` (barrel — but expected to be near-empty since MCP is consumed by transport) + `./bin/architect-mcp` (one bin).
- Workspace deps: `architect-core`, `architect-projection`. Notably **no `architect-guard` dep** — MCP exposes read verbs, not lint verbs.
- External deps: `@modelcontextprotocol/sdk`, `chokidar`, `zod`.
- Recent commit `676a916` — "fix(mcp): remove global cwd mutation" — relevant; the same anti-pattern was just fixed here.

## Architectural responsibilities

`architect-mcp` is the **MCP twin of `architect-cli`**:
- Same verbs (the data-api skill lists 21 callable tools).
- Same `parseAndProject*` trust boundary (ADR-009).
- Snake-case end-to-end naming (`architect_scope_validate`, NOT `architect_scope-validate`).
- File watcher invalidates the pipeline session cache.

## ADRs that bind this package

- **ADR-006** — MCP must consume `PatternGraph` via `PatternGraphAPI`; NOT on stage-1 carve-out.
- **ADR-009** — `parseAndProject*` trust boundary at every MCP tool input.
- **ADR-007** — taxonomy: `ProcessStatusValue` boundary respected.
- **PDR-001** — although primarily about CLI session commands, MCP twin output shape matters (text vs JSON; `handoff` / `scope-validate` outputs).

## Review plan

1. **Phase 1 — three parallel agents (each loads the bootstrap):**
   - `code-reviewer` — input validation at MCP boundary, server lifecycle, file-watcher safety, cache invalidation correctness
   - `architect-review` — CLI/MCP twin discipline, ADR-009 boundary, tool registry composition shape, no business logic
   - `code-simplifier` — simplification opportunities (read-only)
2. **Phase 2 — consolidated final report** at `02-final-report.md`.

## Output files

- `.cleanup-review/architect-mcp/00-scope.md` (this file)
- `.cleanup-review/architect-mcp/01-cleanup-findings.md`
- `.cleanup-review/architect-mcp/02-final-report.md`
- `.cleanup-review/architect-mcp/state.json`
