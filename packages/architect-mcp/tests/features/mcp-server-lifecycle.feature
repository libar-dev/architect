@architect
@architect-pattern:MCPServerLifecycleExecutableTests
@architect-status:active
@architect-product-area:DataAPI
@architect-implements:MCPServer,MCPPipelineSession,MCPFileWatcher
@mcp @integration
Feature: Architect MCP server lifecycle, pipeline coalescing, and file watching
  Split from architect-mcp-integration.feature (M4 Part B.1). Covers the
  stdio transport, rebuild coalescing, watch-mode debouncing, and CLI
  configurability invariants. These four Rules are documentation-anchored
  contracts whose implementations are exercised by manual smoke; the
  scenarios here pin the source-side commitment through static checks.

  Background:
    Given a test session manager seeded with a rich pattern graph

  Rule: MCP server starts via stdio transport and manages its own lifecycle

    **Invariant:** The MCP server communicates over stdio using JSON-RPC, builds the pipeline once during initialization, then enters a request-response loop. No non-MCP output reaches stdout.
    **Rationale:** MCP defines stdio as the standard transport; any stray stdout (console.log, pnpm banners) corrupts the JSON-RPC stream and breaks Claude Code's spawn-based integration.
    **Verified by:** manual smoke (Claude Code session connecting through `.mcp.json`) + JSDoc on packages/architect-mcp/src/server.ts + JSDoc on packages/architect-mcp/src/cli/mcp-server.ts

    @contract
    Scenario: stdio server lifecycle wiring is documented in source
      Then the MCP server source wires stdio transport and signal shutdown

  Rule: PatternGraph rebuild requests coalesce under concurrent load

    **Invariant:** Overlapping `architect_rebuild` calls coalesce so the final in-memory session reflects the newest completed build; concurrent reads during a rebuild use the previous dataset until the new one is published.
    **Rationale:** Naive serialization would block reads; naive parallelism would publish a stale dataset after a newer one. The PipelineSessionManager owns this invariant.
    **Verified by:** architect_rebuild advances buildTimeMs and returns a compact config projection + JSDoc on packages/architect-mcp/src/pipeline-session.ts (PipelineSessionManager.rebuild)

    @contract
    Scenario: rebuild coalescing is documented in source
      Then the pipeline session source documents coalesced rebuild publication

  Rule: Source file changes trigger automatic dataset rebuild with debouncing

    **Invariant:** When `--watch` is enabled, source file changes trigger an automatic pipeline rebuild; rapid changes within the debounce window (default 500ms) coalesce into one rebuild; rebuild failure does not crash the server.
    **Rationale:** During implementation sessions files change in bursts; a rebuild per save would saturate the pipeline. The watcher must debounce and survive parse errors.
    **Verified by:** manual smoke (running architect-mcp --watch in a live edit session) + JSDoc on packages/architect-mcp/src/file-watcher.ts (McpFileWatcher debounce + error isolation)

    @contract
    Scenario: watch mode rebuilds are debounced and isolated
      Then the MCP file watcher source wires debounced rebuild error isolation

  Rule: MCP server is configurable via standard client configuration

    **Invariant:** The server works with `.mcp.json`, `claude_desktop_config.json`, and any MCP client; accepts `--input`, `--features`, `--base-dir`, `--watch`; auto-detects `architect.config.ts`; reports the package version through `--version`; exits with a clear error when no config and no globs are present.
    **Rationale:** MCP clients discover servers through configuration files; sensible defaults plus explicit overrides cover the monorepo + standalone-package matrix without forcing wrappers.
    **Verified by:** docs/MCP-SETUP.md + JSDoc on packages/architect-mcp/src/server.ts (HELP_TEXT, SessionOptionsSchema parsing) + JSDoc on packages/architect-mcp/src/cli/mcp-server.ts (bin entry)

    @contract
    Scenario: CLI options cover standard MCP client configuration
      Then the MCP server source documents standard CLI client options
