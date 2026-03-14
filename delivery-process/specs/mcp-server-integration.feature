@libar-docs
@libar-docs-pattern:MCPServerIntegration
@libar-docs-status:active
@libar-docs-phase:46
@libar-docs-product-area:DataAPI
@libar-docs-effort:3d
@libar-docs-priority:high
@libar-docs-depends-on:DataAPICLIErgonomics
@libar-docs-see-also:DataAPIPlatformIntegration,DataAPICLIErgonomics
@libar-docs-business-value:native-claude-code-tool-integration-with-zero-subprocess-overhead
@libar-docs-sequence-orchestrator:mcp-server
Feature: MCP Server Integration

  **Problem:**
  Claude Code accesses ProcessStateAPI through subprocess calls to the process-api
  CLI. Each invocation runs the full 8-step pipeline (config, scan, extract, merge,
  hierarchy, workflow, transform, validate), taking 2-5 seconds. During a typical
  session with 10-20 queries, this adds 30-90 seconds of pure pipeline overhead.
  The subprocess model prevents stateful interaction -- there is no way to keep the
  MasterDataset in memory between queries.

  **Solution:**
  Implement an MCP (Model Context Protocol) server that wraps ProcessStateAPI:
  1. Load the pipeline ONCE and keep MasterDataset in memory
  2. Expose ProcessStateAPI methods and CLI subcommands as MCP tools
  3. Allow Claude Code to call them as native tools with sub-millisecond dispatch
  4. Optionally watch source files and rebuild the dataset on changes

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | MCP server entry point and lifecycle | complete | src/mcp/server.ts |
      | Tool registry with JSON Schema generation | complete | src/mcp/tool-registry.ts |
      | Pipeline session manager | complete | src/mcp/pipeline-session.ts |
      | File watcher with debounced rebuild | complete | src/mcp/file-watcher.ts |
      | MCP server bin entry | complete | src/cli/mcp-server.ts |
      | MCP configuration documentation | complete | docs/MCP-SETUP.md |

  @libar-docs-sequence-step:1
  @libar-docs-sequence-module:pipeline-session
  Rule: MCP server starts via stdio transport and manages its own lifecycle

    **Invariant:** The MCP server communicates over stdio using JSON-RPC. It builds
    the pipeline once during initialization, then enters a request-response loop.
    No non-MCP output is written to stdout (no console.log, no pnpm banners).

    **Rationale:** MCP defines stdio as the standard transport for local tool
    servers. Claude Code spawns the process and communicates over stdin/stdout pipes.
    Any extraneous stdout output corrupts the JSON-RPC stream. Loading the pipeline
    during initialization ensures the first tool call is fast.

    **Input:** SessionOptions -- input, features, baseDir, watch

    **Output:** PipelineSession -- dataset, api, registry, baseDir, sourceGlobs, buildTimeMs

    **Verified by:** Server starts and responds to initialize,
    Server handles shutdown cleanly

    @acceptance-criteria @happy-path
    Scenario: MCP server starts and responds to initialize
      Given the MCP server is started with config auto-detection
      When the client sends an MCP initialize request
      Then the server responds with capabilities including tools
      And the pipeline has been built with MasterDataset in memory

    @acceptance-criteria @happy-path
    Scenario: Server handles shutdown cleanly
      Given the MCP server is running with an active file watcher
      When the client closes the connection
      Then the file watcher is stopped
      And the process exits with code 0

    @acceptance-criteria @edge-case @libar-docs-sequence-error
    Scenario: Server starts with explicit input globs
      Given the MCP server is started with args "--input src/**/*.ts --features specs/**/*.feature"
      When the client sends an MCP initialize request
      Then the pipeline uses the explicit globs instead of config auto-detection

  @libar-docs-sequence-step:2
  @libar-docs-sequence-module:tool-registry
  Rule: ProcessStateAPI methods and CLI subcommands are registered as MCP tools

    **Invariant:** Every CLI subcommand is registered as an MCP tool with a JSON
    Schema describing its input parameters. Tool names use snake_case with a "dp_"
    prefix to avoid collisions with other MCP servers.

    **Rationale:** MCP tools are the unit of interaction. Each tool needs a name,
    description (for LLM tool selection), and JSON Schema for input validation.
    The "dp_" prefix prevents collisions in multi-server setups.

    **Input:** PipelineSession -- dataset, api, registry

    **Output:** RegisteredTools -- 25 tools with dp_ prefix, Zod input schemas, handler functions

    **Verified by:** All CLI subcommands appear as MCP tools,
    Tool schemas validate input parameters

    @acceptance-criteria @happy-path
    Scenario: All CLI subcommands appear as MCP tools
      Given the MCP server is initialized
      When the client requests the tool list
      Then at least 19 tools are registered
      And each tool name starts with "dp_"
      And each tool has a non-empty description

    @acceptance-criteria @happy-path
    Scenario: Tool call executes successfully
      Given the MCP server is initialized
      When the client calls "dp_overview"
      Then the response contains the overview text with progress and phases

    @acceptance-criteria @edge-case @libar-docs-sequence-error
    Scenario: Tool call with missing required parameter returns error
      Given the MCP server is initialized
      When the client calls "dp_pattern" without the required "name" parameter
      Then the response is an MCP error indicating invalid params

  @libar-docs-sequence-step:3
  @libar-docs-sequence-module:pipeline-session
  Rule: MasterDataset is loaded once and reused across all tool invocations

    **Invariant:** The pipeline runs exactly once during server initialization. All
    subsequent tool calls read from in-memory MasterDataset. A manual rebuild can
    be triggered via a "dp_rebuild" tool.

    **Rationale:** The pipeline costs 2-5 seconds. Running it per tool call negates
    MCP benefits. Pre-computed views provide O(1) access ideal for a query server.

    **Input:** ToolCallRequest -- tool name, arguments

    **Output:** ToolCallResult -- content, isError

    **Verified by:** Multiple tool calls share one pipeline build,
    Rebuild refreshes the dataset

    @acceptance-criteria @happy-path
    Scenario: Multiple tool calls share one pipeline build
      Given the MCP server is initialized
      When the client calls "dp_status" then "dp_list" then "dp_overview"
      Then all three return results
      And the pipeline was built exactly once

    @acceptance-criteria @happy-path
    Scenario: Rebuild refreshes the dataset
      Given the MCP server is running with a loaded dataset
      When the client calls "dp_rebuild"
      Then the pipeline runs again
      And subsequent tool calls use the new dataset

    @acceptance-criteria @edge-case @libar-docs-sequence-error
    Scenario: Concurrent reads during rebuild use previous dataset
      Given a rebuild is in progress
      When a tool call arrives for "dp_status"
      Then the call uses the previous dataset
      And the call completes successfully with the previous data

  @libar-docs-sequence-step:4
  @libar-docs-sequence-module:file-watcher
  Rule: Source file changes trigger automatic dataset rebuild with debouncing

    **Invariant:** When --watch is enabled, changes to source files trigger an
    automatic pipeline rebuild. Multiple rapid changes are debounced into a single
    rebuild (default 500ms window).

    **Rationale:** During implementation sessions, source files change frequently.
    Without auto-rebuild, agents must manually call dp_rebuild. Debouncing prevents
    redundant rebuilds during rapid-fire saves.

    **Input:** FileChangeEvent -- filePath, eventType

    **Output:** PipelineSession -- rebuilt dataset with updated patterns

    **Verified by:** File change triggers rebuild,
    Rapid changes are debounced

    @acceptance-criteria @happy-path
    Scenario: File change triggers rebuild
      Given the MCP server is running with --watch enabled
      When a TypeScript source file is modified
      Then the pipeline rebuilds automatically
      And subsequent tool calls reflect the updated source

    @acceptance-criteria @happy-path
    Scenario: Rapid changes are debounced
      Given the MCP server is running with --watch enabled
      When 5 files are modified within 200ms
      Then the pipeline rebuilds exactly once after the debounce window

    @acceptance-criteria @edge-case @libar-docs-sequence-error
    Scenario: Rebuild failure during watch does not crash server
      Given the MCP server is running with --watch enabled
      When a source file change introduces a parse error
      Then the server continues using the previous valid dataset
      And an MCP notification indicates rebuild failure

  @libar-docs-sequence-step:5
  @libar-docs-sequence-module:mcp-server
  Rule: MCP server is configurable via standard client configuration

    **Invariant:** The server works with .mcp.json (Claude Code), claude_desktop_config.json
    (Claude Desktop), and any MCP client. It accepts --input, --features, --base-dir
    args and auto-detects delivery-process.config.ts.

    **Rationale:** MCP clients discover servers through configuration files. The
    server must work with sensible defaults (config auto-detection) while supporting
    explicit overrides for monorepo setups.

    **Input:** CLIArgs -- input, features, baseDir, watch, help, version

    **Output:** McpServerOptions -- parsed options merged with config defaults

    **Verified by:** Default config auto-detection,
    Server works when started via npx

    @acceptance-criteria @happy-path
    Scenario: Default config auto-detection
      Given a project with delivery-process.config.ts
      When the MCP server is started without explicit arguments
      Then it loads globs from the config file
      And the pipeline builds successfully

    @acceptance-criteria @happy-path
    Scenario: Server works when started via npx
      Given the package is installed
      When running "npx @libar-dev/delivery-process dp-mcp-server"
      Then the server process starts and awaits MCP initialize
      And no extraneous output appears on stdout

    @acceptance-criteria @edge-case @libar-docs-sequence-error
    Scenario: No config file and no explicit globs
      Given a directory without delivery-process.config.ts
      When the MCP server is started without arguments
      Then the server exits with a clear error message
