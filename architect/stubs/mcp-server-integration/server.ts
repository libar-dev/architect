/**
 * @architect
 * @architect-status completed
 * @architect-implements MCPServerIntegration
 * @architect-uses MCPPipelineSession, MCPToolRegistry, MCPFileWatcher
 * @architect-used-by MCPServerBin
 * @architect-target src/mcp/server.ts
 * @architect-since DS-MCP
 *
 * ## MCPServer — Entry Point and Lifecycle Manager
 *
 * Main entry point for the Architect MCP server. Wires together
 * the pipeline session, tool registry, file watcher, and stdio transport.
 *
 * ### Lifecycle (5 phases)
 *
 * 1. Parse CLI args (--input, --features, --base-dir, --watch)
 * 2. Initialize PipelineSessionManager (loads config, builds pipeline)
 * 3. Create McpServer and register all tools
 * 4. Optionally start file watcher
 * 5. Connect via StdioServerTransport (enters JSON-RPC loop)
 *
 * ### Design Decisions
 *
 * DD-1: Stdout isolation via console.log redirect - MCP protocol uses JSON-RPC
 * over stdout exclusively. console.log is redirected to console.error at module
 * load time (before any imports). All application logging uses console.error
 * via a log() helper that prefixes messages with [architect-mcp].
 *
 * DD-2: Graceful shutdown with cleanup - SIGINT/SIGTERM handlers stop the file
 * watcher, close the McpServer, then exit. Prevents dangling watchers and ensures
 * the server process terminates cleanly when Claude Code closes the connection.
 *
 * DD-3: CLI arg parsing without commander.js - matches the project convention
 * (manual arg parsing with for loop + switch). Supports --input/-i, --features/-f,
 * --base-dir/-b, --watch/-w, --help/-h, --version/-v.
 *
 * DD-4: Config auto-detection with override - explicit --input/--features override
 * config file detection. When no args are provided, the server auto-detects
 * architect.config.ts using the same applyProjectSourceDefaults() as CLI.
 *
 * DD-5: Pipeline failure at startup is fatal - if the pipeline fails during
 * initialization (bad config, scan errors), the server exits with code 1.
 * Pipeline failures during file-watch rebuilds are non-fatal (previous dataset stays).
 *
 * ### When to Use
 *
 * - When starting the MCP server from the CLI bin entry
 * - When programmatically creating an MCP server instance
 */

export interface McpServerOptions {
  readonly input?: readonly string[] | undefined;
  readonly features?: readonly string[] | undefined;
  readonly baseDir?: string | undefined;
  readonly watch?: boolean | undefined;
  readonly version?: string | undefined;
}

export declare function startMcpServer(
  argv?: string[],
  options?: McpServerOptions,
): Promise<void>;
