# architect-mcp — Package PRD

> Boundary contract recorded post-hoc (PR #15 split the monolith; the per-package contract was never written down). Records what the **code** is as of this commit, not what annotations claim. Verified against `src/`, `package.json`, and the then-current `architect:query list --package architect-mcp` verb (since retired, ADR-014).

## Purpose

`@libar-dev/architect-mcp` is the **thin MCP server / session / file-watcher composition root** for the Architect package family. It owns the `architect-mcp` bin, builds one long-lived in-process `PatternGraph` (the "pipeline session"), registers the snake_case MCP tool surface (the MCP twins of the CLI verbs plus a few MCP-only operations), and optionally watches source files to rebuild that graph live. It holds **no domain logic of its own** — every tool delegates to a `@libar-dev/architect-projection` projection function over a graph built by `@libar-dev/architect-core`. It is transport + lifecycle wiring, nothing more.

## Public interface

**Bin:** `architect-mcp` → `bin/architect-mcp.js` → `runtime-bridge.js` → built `cli/mcp-server.js` → `startMcpServer()`. CLI flags: `-i/--input`, `-f/--features`, `-b/--base-dir`, `-w/--watch`, `-h/--help`, `-v/--version`. Speaks MCP over stdio (`StdioServerTransport`).

**Library entry points (`src/index.ts`):**

- `startMcpServer(argv?, options?)` + `McpServerOptions` — server entry.
- `PipelineSessionManager`, `PipelineSession`, `SessionOptions` — graph lifecycle.
- `McpFileWatcher`, `FileWatcherOptions` — live-rebuild watcher.
- `registerAllTools`, `invokeTool`, `REGISTERED_TOOL_NAMES`, `RegisteredToolName`, `ToolResult` — tool registry. `invokeTool` returns the **typed** `ToolResult<TOut>` (text + projection output) for programmatic callers (e.g. the desktop main process); `registerAllTools` wraps `.text` into the MCP `TextContentResult`.

**MCP tool inventory (21 tools, `src/tool-metadata.ts` is the source of truth):**

- _Inventory / health (4):_ `architect_overview`, `architect_status`, `architect_coverage`, `architect_list`
- _Per-pattern detail (6):_ `architect_pattern`, `architect_context`, `architect_files`, `architect_dep_tree`, `architect_bundle`, `architect_rules`
- _Architecture views (3):_ `architect_arch_neighborhood`, `architect_arch_blocking`, `architect_open_questions`
- _Discovery / meta (4):_ `architect_search`, `architect_taxonomy`, `architect_config`, `architect_help`
- _Gates / session (2):_ `architect_scope_validate`, `architect_handoff`
- _Documentation (1):_ `architect_documentation`
- _Server-only mutation (1):_ `architect_rebuild`

## Enumerated functionality

- **21 MCP tools**, each defined once in `TOOL_HANDLERS` (`tool-registry.ts`) and registered for both the MCP server (`registerAllTools`) and programmatic use (`invokeTool`). Input validated by per-tool Zod schemas composed from shared shapes in `tool-input-schemas.ts`; parse-once at the tool boundary via `parseToolInput`.
- **Pipeline session lifecycle** (`pipeline-session.ts`): `initialize()` resolves sources (explicit globs → workspace sources → `applyProjectSourceDefaults` → hardcoded fallback defaults), builds the graph via `buildPatternGraph`; `rebuild()` coalesces concurrent rebuilds (single in-flight promise + `pendingRebuild` flag) and atomically swaps the session on success; `getSession()` / `isRebuilding()` accessors.
- **File-watch / live rebuild** (`file-watcher.ts`): chokidar watch over input + feature globs + `architect.config.{ts,js}`, 500 ms debounce, filters to `.ts`/`.feature`/config files, delegates to `sessionManager.rebuild()`; on rebuild failure logs and keeps the previous dataset live. Only active with `--watch`.
- **Server bootstrap** (`server.ts`): CLI arg parse (Zod-validated `ParsedCliArgs`), help/version short-circuits, `McpServer` construction with `instructions`, **redirects `console.log` → `console.error`** to keep stdout stdio-protocol-clean, registers tools, optionally starts the watcher, connects stdio transport, wires SIGINT/SIGTERM graceful shutdown.
- **Tool metadata** (`tool-metadata.ts`): the 21-tool name+description table, `REGISTERED_TOOL_NAMES`, `MCP_SERVER_INSTRUCTIONS`, and help-text builders. The `RegisteredToolName` union is derived from this array.
- **Runtime helpers** (`runtime-helpers.ts`): package-metadata read, base-dir arg resolution, base-dir normalization.

## Dependencies

**Intra-repo (runtime, all one-directional — this package is a leaf consumer):**

- `@libar-dev/architect-core` → graph build (`buildPatternGraph`), canonical pattern helpers, config loading/source resolution, package resolver, Zod boundary primitives, runtime/bin helpers.
- `@libar-dev/architect-projection` (incl. `/projections`, `/disclosure` subpaths) → every projection function the tools emit, plus the compact-text / JSON renderers and the option schemas reused as MCP input shapes.

**External:** `@modelcontextprotocol/sdk` (server + stdio transport), `chokidar` (watch), `zod` (input contracts).

> **Note vs the task brief:** the brief listed "core, query/projection, **guard**." The actual `package.json` and `src/` have **no `@libar-dev/architect-guard` dependency** — guard/FSM gating is reached only indirectly through projection functions (e.g. `projectScopeReadinessReport`). This package depends on **core + projection only**.

## Consumers

- **Agentic harnesses** connecting the `architect` MCP server over stdio: Claude Code, Codex, OpenCode + oh-my-openagent. They call the `architect_*` snake_case tools — since ADR-014 the canonical typed verb surface (the CLI twins were retired; the agent CLI is now the graph handle).
- **Libar Studio desktop/cloud main process** (proprietary) — the comment on `TOOL_HANDLERS` calls out that `invokeTool` exists specifically so the desktop main can consume the **typed** `ToolResult` projection output without re-parsing rendered text. This is the load-bearing programmatic consumer.
- This package is **not** imported by other `@libar-dev/architect-*` packages — it is a top-of-stack composition root.

## Load-bearing vs incidental (cut-list)

### Load-bearing (must stay server-side)

- **MCP transport + lifecycle wiring** (`server.ts`, `cli/mcp-server.ts`, `bin` + `runtime-bridge.js`): the stdio `McpServer`, the `console.log → console.error` stdout-protection, SIGINT/SIGTERM shutdown. No CLI verb replaces "be a long-lived MCP process."
- **`PipelineSessionManager`** (`pipeline-session.ts`): the long-lived in-process graph is the entire reason MCP is sub-ms where the CLI is 2–5 s cold. Building once and reusing across calls is the value proposition; cannot be replaced by stateless emission.
- **`architect_rebuild`**: the **only genuinely server-only tool** — it mutates session state (`sessionManager.rebuild()`). It has no naked-emission equivalent because there is no persistent state to refresh in a one-shot CLI invocation. Highest-confidence "must stay."
- **`McpFileWatcher`** (`file-watcher.ts`): only meaningful inside a live server (debounced rebuild of the in-process graph). Stays, but see below — it is small and could arguably live in core if a CLI watch mode ever wants it.
- **`architect_scope_validate` / `architect_handoff`**: gate/session-shaped. They are still pure projections (so technically raw-emission-shaped), but they are the deterministic-gate and session-continuity surface agents lean on, so they stay as named tools even if read tools collapse.

### Incidental / deletion-candidate

- **The ~16 read-only tools are the same "naked emission could replace most read tools" story as the CLI.** Every one of `architect_overview, _status, _coverage, _list, _pattern, _context, _files, _dep_tree, _bundle, _rules, _arch_neighborhood, _open_questions, _taxonomy, _config, _documentation` is a thin `handle: (input, session) => render(projectX(getProjectionContext(session), opts))` with zero MCP-specific logic. If the projection layer grows a single "emit named fragment by query" entry point, this entire block collapses to **one generic tool** + a schema table — the bespoke per-tool handlers are the deletion target.
- **`buildSearchResultsDocument` / `buildBlockingDocument` / `buildHelpDocument`** (`tool-registry.ts`, ~lines 245–357): hand-rolled `SectionedDocument` assembly (paragraphs + tables) for `architect_search`, `architect_arch_blocking`, and `architect_help`. This is **presentation logic that has accreted into the transport layer** — exactly the kind of view-building that belongs in projection, not in the MCP registry. `architect_search` even re-derives a `summariesByPattern` map and calls `fuzzyMatchPatterns` inline; `architect_arch_blocking` re-runs `projectOverviewDigest` just to pull `.blocking`. Strongest in-package cut.
- **`architect_help`**: emits a static table built from the local metadata array — pure client-side convenience, deletable once the generic tool surface is self-describing.
- **`buildToolHelpText` / `MCP_SERVER_INSTRUCTIONS`** (`tool-metadata.ts`): `buildToolHelpText` is exported but unused by the registered tools (`architect_help` uses `buildHelpDocument` instead) — **dead/duplicated help formatting**, deletion candidate. The instructions string referencing a "historical full 25-tool monolith" is stale context that should go with No-BC cleanup.
- **`applyFallbackDefaults`** (`pipeline-session.ts`, ~lines 224–247): hardcoded `src/**/*.ts` / `architect/specs/*.feature` guesses when no config and no workspace sources resolve. This is **accreted "be helpful without config" logic** that duplicates discovery responsibilities already owned by core's `applyProjectSourceDefaults` / `resolveWorkspaceSources`; a leaner contract would fail fast and let core own all source resolution.
- **Three-stage source resolution in `initialize()`** (workspace → project defaults → hardcoded fallback) is more branching than a thin composition root should carry; candidate to push entirely into a single core resolver call.

## Size signal

- **Source files:** 7 `.ts` in `src/` (+ `cli/mcp-server.ts`), ~**1,576 LOC** (`tool-registry.ts` alone is 675 — ~43% of the package, and the bulk of the cut-list lives there).
- **Tools:** **21** registered MCP tools (1 mutating/server-only, ~2 gate/session, ~18 raw read-emission).
- **Patterns (live graph):** **9** owned by the package — 5 production-TS (`MCPServer`, `MCPServerBin`, `MCPToolRegistry`, `MCPPipelineSession`, `MCPFileWatcher`) + 4 executable-test features.
- **External deps:** 3 (`@modelcontextprotocol/sdk`, `chokidar`, `zod`); intra-repo deps: 2 (core, projection).
