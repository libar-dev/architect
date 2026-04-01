@architect
@architect-pattern:MCPServerIntegration
@architect-status:active
@architect-phase:46
@architect-product-area:DataAPI
@architect-effort:3d
@architect-priority:high
@architect-depends-on:DataAPICLIErgonomics
@architect-see-also:DataAPIPlatformIntegration,DataAPICLIErgonomics
@architect-business-value:native-claude-code-tool-integration-with-zero-subprocess-overhead
@architect-sequence-orchestrator:mcp-server
Feature: MCP Server Integration

  **Problem:**
  Claude Code accesses PatternGraphAPI through subprocess calls to the pattern-graph-cli
  CLI. Each invocation runs the full 8-step pipeline (config, scan, extract, merge,
  hierarchy, workflow, transform, validate), taking 2-5 seconds. During a typical
  session with 10-20 queries, this adds 30-90 seconds of pure pipeline overhead.
  The subprocess model prevents stateful interaction -- there is no way to keep the
  PatternGraph in memory between queries.

  **Solution:**
  Implement an MCP (Model Context Protocol) server that wraps PatternGraphAPI:
  1. Load the pipeline ONCE and keep PatternGraph in memory
  2. Expose PatternGraphAPI methods and CLI subcommands as MCP tools
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

  @architect-sequence-step:1
  @architect-sequence-module:pipeline-session
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
      And the pipeline has been built with PatternGraph in memory

    @acceptance-criteria @happy-path
    Scenario: Server handles shutdown cleanly
      Given the MCP server is running with an active file watcher
      When the client closes the connection
      Then the file watcher is stopped
      And the process exits with code 0

    @acceptance-criteria @edge-case
    Scenario: Server starts with explicit input globs
      Given the MCP server is started with args "--input src/**/*.ts --features specs/**/*.feature"
      When the client sends an MCP initialize request
      Then the pipeline uses the explicit globs instead of config auto-detection

  @architect-sequence-step:2
  @architect-sequence-module:tool-registry
  Rule: PatternGraphAPI methods and CLI subcommands are registered as MCP tools

    **Invariant:** Every CLI subcommand is registered as an MCP tool with a JSON
    Schema describing its input parameters. Tool names use snake_case with a "architect_"
    prefix to avoid collisions with other MCP servers.

    **Rationale:** MCP tools are the unit of interaction. Each tool needs a name,
    description (for LLM tool selection), and JSON Schema for input validation.
    The "architect_" prefix prevents collisions in multi-server setups.

    **Input:** PipelineSession -- dataset, api, registry

    **Output:** RegisteredTools -- 25 tools with architect_ prefix, Zod input schemas, handler functions

    **Verified by:** All CLI subcommands appear as MCP tools,
    Tool schemas validate input parameters,
    Pattern detail returns full metadata

    @acceptance-criteria @happy-path
    Scenario: All CLI subcommands appear as MCP tools
      Given the MCP server is initialized
      When the client requests the tool list
      Then at least 19 tools are registered
      And each tool name starts with "architect_"
      And each tool has a non-empty description

    @acceptance-criteria @happy-path
    Scenario: Tool call executes successfully
      Given the MCP server is initialized
      When the client calls "architect_overview"
      Then the response contains the overview text with progress and phases

    @acceptance-criteria @edge-case @architect-sequence-error
    Scenario: Tool call with missing required parameter returns error
      Given the MCP server is initialized
      When the client calls "architect_pattern" without the required "name" parameter
      Then the response is an MCP error indicating invalid params

    @acceptance-criteria @happy-path
    Scenario: Pattern detail returns full metadata
      Given the MCP server is initialized
      When the client calls "architect_pattern" for a pattern with rules and extracted shapes
      Then the response contains the full pattern metadata payload
      And the response includes deliverables, dependencies, business rules, and extracted shapes

  @architect-sequence-step:3
  @architect-sequence-module:pipeline-session
  Rule: PatternGraph is loaded once and reused across all tool invocations

    **Invariant:** The pipeline runs exactly once during server initialization. All
    subsequent tool calls read from in-memory PatternGraph. A manual rebuild can
    be triggered via a "architect_rebuild" tool, and overlapping rebuild requests coalesce
    so the final in-memory session reflects the newest completed build.

    **Rationale:** The pipeline costs 2-5 seconds. Running it per tool call negates
    MCP benefits. Pre-computed views provide O(1) access ideal for a query server.

    **Input:** ToolCallRequest -- tool name, arguments

    **Output:** ToolCallResult -- content, isError

    **Verified by:** Multiple tool calls share one pipeline build,
    Rebuild refreshes the dataset,
    Concurrent rebuild requests coalesce

    @acceptance-criteria @happy-path
    Scenario: Multiple tool calls share one pipeline build
      Given the MCP server is initialized
      When the client calls "architect_status" then "architect_list" then "architect_overview"
      Then all three return results
      And the pipeline was built exactly once

    @acceptance-criteria @happy-path
    Scenario: Rebuild refreshes the dataset
      Given the MCP server is running with a loaded dataset
      When the client calls "architect_rebuild"
      Then the pipeline runs again
      And subsequent tool calls use the new dataset

    @acceptance-criteria @happy-path
    Scenario: Concurrent rebuild requests coalesce
      Given the MCP server is running with a loaded dataset
      When two rebuild requests arrive before the first rebuild completes
      Then the server serializes the rebuild work
      And the final in-memory session is the newest rebuilt dataset

    @acceptance-criteria @edge-case
    Scenario: Concurrent reads during rebuild use previous dataset
      Given a rebuild is in progress
      When a tool call arrives for "architect_status"
      Then the call uses the previous dataset
      And the call completes successfully with the previous data

  @architect-sequence-step:4
  @architect-sequence-module:file-watcher
  Rule: Source file changes trigger automatic dataset rebuild with debouncing

    **Invariant:** When --watch is enabled, changes to source files trigger an
    automatic pipeline rebuild. Multiple rapid changes are debounced into a single
    rebuild (default 500ms window).

    **Rationale:** During implementation sessions, source files change frequently.
    Without auto-rebuild, agents must manually call architect_rebuild. Debouncing prevents
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

    @acceptance-criteria @edge-case @architect-sequence-error
    Scenario: Rebuild failure during watch does not crash server
      Given the MCP server is running with --watch enabled
      When a source file change introduces a parse error
      Then the server continues using the previous valid dataset
      And the rebuild failure is logged to stderr

  @architect-sequence-step:5
  @architect-sequence-module:mcp-server
  Rule: MCP server is configurable via standard client configuration

    **Invariant:** The server works with .mcp.json (Claude Code), claude_desktop_config.json
    (Claude Desktop), and any MCP client. It accepts --input, --features, --base-dir
    args, auto-detects architect.config.ts, and reports the package version
    accurately through the CLI.

    **Rationale:** MCP clients discover servers through configuration files. The
    server must work with sensible defaults (config auto-detection) while supporting
    explicit overrides for monorepo setups.

    **Input:** CLIArgs -- input, features, baseDir, watch, help, version

    **Output:** McpServerOptions -- parsed options merged with config defaults

    **Verified by:** Default config auto-detection,
    Config without explicit sources falls back to conventional globs,
    Server works when started via npx,
    Version flag reports package version

    @acceptance-criteria @happy-path
    Scenario: Default config auto-detection
      Given a project with architect.config.ts
      When the MCP server is started without explicit arguments
      Then it loads globs from the config file
      And the pipeline builds successfully

    @acceptance-criteria @happy-path
    Scenario: Config without explicit sources falls back to conventional globs
      Given a project with architect.config.ts but no explicit sources
      When the MCP server is started without explicit arguments
      Then it falls back to the conventional source globs
      And the pipeline builds successfully

    @acceptance-criteria @happy-path
    Scenario: Server works when started via npx
      Given the package is installed
      When running "npx @libar-dev/architect architect-mcp"
      Then the server process starts and awaits MCP initialize
      And no extraneous output appears on stdout

    @acceptance-criteria @happy-path
    Scenario: Version flag reports package version
      Given the package is installed
      When running "npx @libar-dev/architect architect-mcp --version"
      Then the output contains the current package version

    @acceptance-criteria @edge-case @architect-sequence-error
    Scenario: No config file and no explicit globs
      Given a directory without architect.config.ts
      When the MCP server is started without arguments
      Then the server exits with a clear error message
