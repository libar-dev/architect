# Design Review: MCPServerIntegration

**Purpose:** Design review with sequence and component diagrams for the MCP server
**Detail Level:** Design review artifact from sequence annotations

---

**Pattern:** MCPServerIntegration | **Phase:** Phase 46 | **Status:** active | **Orchestrator:** mcp-server | **Steps:** 5 | **Participants:** 4

**Source:** `delivery-process/specs/mcp-server-integration.feature`

---

## Annotation Convention

This design review is generated from the following annotations:

| Tag                   | Level    | Format | Purpose                            |
| --------------------- | -------- | ------ | ---------------------------------- |
| sequence-orchestrator | Feature  | value  | Identifies the coordinator module  |
| sequence-step         | Rule     | number | Explicit execution ordering        |
| sequence-module       | Rule     | csv    | Maps Rule to deliverable module(s) |
| sequence-error        | Scenario | flag   | Marks scenario as error/alt path   |

Description markers: `**Input:**` and `**Output:**` in Rule descriptions define data flow types for sequence diagram call arrows and component diagram edges.

---

## Sequence Diagram — Runtime Interaction Flow

Generated from: `@libar-docs-sequence-step`, `@libar-docs-sequence-module`, `@libar-docs-sequence-error`, `**Input:**`/`**Output:**` markers, and `@libar-docs-sequence-orchestrator` on the Feature.

```mermaid
sequenceDiagram
    participant Client as "Claude Code / MCP Client"
    participant mcp_server as "mcp-server.ts"
    participant pipeline_session as "pipeline-session.ts"
    participant tool_registry as "tool-registry.ts"
    participant file_watcher as "file-watcher.ts"

    Client->>mcp_server: spawn process

    Note over mcp_server: Step 1 — Server starts via stdio transport.<br/>Builds pipeline once during initialization.<br/>No non-MCP output on stdout.

    mcp_server->>+pipeline_session: SessionOptions (input, features, baseDir, watch)
    pipeline_session->>pipeline_session: loadConfig() + buildMasterDataset() + createProcessStateAPI()
    pipeline_session-->>-mcp_server: PipelineSession (dataset, api, registry, sourceGlobs, buildTimeMs)

    alt No config file and no explicit globs
        mcp_server-->>Client: error
        mcp_server->>mcp_server: exit(1)
    end

    Note over mcp_server: Step 2 — Register all CLI subcommands as MCP tools.<br/>25 tools with dp_ prefix and Zod input schemas.

    mcp_server->>+tool_registry: PipelineSession (dataset, api, registry)
    tool_registry->>tool_registry: registerTool() x 25 with Zod schemas
    tool_registry-->>-mcp_server: RegisteredTools (25 tools)

    Note over mcp_server: Step 3 — Tool call dispatch.<br/>Pipeline loaded once, all calls read in-memory dataset.

    Client->>mcp_server: tools/call (e.g., dp_overview)
    mcp_server->>+tool_registry: dispatch(toolName, args, session)
    tool_registry->>tool_registry: handler calls ProcessStateAPI / assembler
    tool_registry-->>-mcp_server: ToolCallResult (content, isError)
    mcp_server-->>Client: JSON-RPC response

    alt Tool call with missing required parameter
        mcp_server-->>Client: MCP error (invalid params)
    end

    alt dp_rebuild called
        mcp_server->>+pipeline_session: rebuild()
        pipeline_session-->>-mcp_server: new PipelineSession (atomic swap)
    end

    Note over mcp_server: Step 4 — File watcher (optional, --watch flag).<br/>500ms debounce, auto-rebuild on .ts/.feature changes.

    opt --watch enabled
        mcp_server->>+file_watcher: start(globs, baseDir, sessionManager)
        file_watcher->>file_watcher: chokidar.watch() with debounce

        file_watcher-->>file_watcher: onChange → debounced rebuild
        file_watcher->>+pipeline_session: rebuild()
        pipeline_session-->>-file_watcher: new PipelineSession
        file_watcher-->>-mcp_server: rebuild complete (logged to stderr)

        alt Rebuild failure during watch
            file_watcher->>file_watcher: keep previous dataset, log error
        end
    end

    Note over mcp_server: Step 5 — Configuration and shutdown.<br/>Auto-detects delivery-process.config.ts.<br/>Supports --input, --features, --base-dir overrides.

    Client->>mcp_server: close connection
    mcp_server->>file_watcher: stop()
    mcp_server->>mcp_server: server.close()
    mcp_server-->>Client: exit(0)
```

---

## Component Diagram — Types and Data Flow

Generated from: `@libar-docs-sequence-module` (nodes), `**Input:**`/`**Output:**` (edges and type shapes), deliverables table (locations), and `sequence-step` (grouping).

```mermaid
graph LR
    subgraph phase_1["Phase 1: Initialization"]
        pipeline_session["pipeline-session.ts"]
    end

    subgraph phase_2["Phase 2: Tool Registration"]
        tool_registry["tool-registry.ts"]
    end

    subgraph phase_3["Phase 3: Request Loop"]
        tool_registry_dispatch["tool-registry.ts (dispatch)"]
    end

    subgraph phase_4["Phase 4: File Watching"]
        file_watcher["file-watcher.ts"]
    end

    subgraph orchestrator["Orchestrator"]
        mcp_server["mcp-server.ts"]
    end

    subgraph types["Key Types"]
        SessionOptions{{"SessionOptions\n-----------\ninput\nfeatures\nbaseDir\nwatch"}}
        PipelineSession{{"PipelineSession\n-----------\ndataset\napi\nregistry\nbaseDir\nsourceGlobs\nbuildTimeMs"}}
        RegisteredTools{{"RegisteredTools\n-----------\n25 tools\ndp_ prefix\nZod schemas\nhandler functions"}}
        ToolCallResult{{"ToolCallResult\n-----------\ncontent\nisError"}}
    end

    mcp_server -->|"SessionOptions"| pipeline_session
    pipeline_session -->|"PipelineSession"| mcp_server
    mcp_server -->|"PipelineSession"| tool_registry
    tool_registry -->|"RegisteredTools"| mcp_server
    mcp_server -->|"ToolCallRequest"| tool_registry_dispatch
    tool_registry_dispatch -->|"ToolCallResult"| mcp_server
    mcp_server -->|"globs, sessionManager"| file_watcher
    file_watcher -->|"rebuild trigger"| pipeline_session
```

---

## Key Type Definitions

| Type               | Fields                                                    | Produced By            | Consumed By                             |
| ------------------ | --------------------------------------------------------- | ---------------------- | --------------------------------------- |
| `SessionOptions`   | input, features, baseDir, watch                           | CLI arg parser         | pipeline-session                        |
| `PipelineSession`  | dataset, api, registry, baseDir, sourceGlobs, buildTimeMs | pipeline-session       | tool-registry, file-watcher, mcp-server |
| `RegisteredTools`  | 25 tools with dp\_ prefix, Zod schemas, handler functions | tool-registry          | mcp-server (via McpServer)              |
| `ToolCallResult`   | content, isError                                          | tool-registry handlers | mcp-server (→ JSON-RPC response)        |
| `FileChangeEvent`  | filePath, eventType                                       | chokidar               | file-watcher                            |
| `McpServerOptions` | input, features, baseDir, watch, version                  | CLI arg parser         | mcp-server                              |

---

## Design Questions

Verify these design properties against the diagrams above:

| #    | Question                           | Auto-Check                      | Diagram   |
| ---- | ---------------------------------- | ------------------------------- | --------- |
| DQ-1 | Is the execution ordering correct? | 5 steps in monotonic order      | Sequence  |
| DQ-2 | Are all interfaces well-defined?   | 6 distinct types across 5 steps | Component |
| DQ-3 | Is error handling complete?        | 5 error paths identified        | Sequence  |
| DQ-4 | Is data flow unidirectional?       | Review component diagram edges  | Component |
| DQ-5 | Does the server isolate stdout?    | console.log redirected at load  | Sequence  |

---

## Design Decisions Summary

| #     | Decision                                                  | Rationale                                                                                                                      |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| DD-1  | Atomic dataset swap on rebuild                            | During rebuild, tool calls read from previous PipelineSession. New session replaces it atomically after successful build.      |
| DD-2  | Config auto-detection mirrors CLI                         | Uses same applyProjectSourceDefaults() function, then falls back to filesystem detection.                                      |
| DD-3  | No caching layer                                          | CLI uses dataset-cache.ts for inter-process caching, but in-process memory is sufficient for long-lived server.                |
| DD-4  | Text output for session-aware tools                       | context, overview, scope-validate return formatted text matching CLI output — what Claude Code expects for direct consumption. |
| DD-5  | JSON output for data tools                                | pattern, list, status return JSON for structured querying.                                                                     |
| DD-6  | Synchronous handlers where possible                       | MCP SDK ToolCallback accepts both sync and async returns. Avoids require-await lint violations.                                |
| DD-7  | dp\_ tool prefix                                          | Per spec invariant. Avoids collision with other MCP servers in multi-server setups.                                            |
| DD-8  | Stdout isolation via console.log redirect                 | MCP JSON-RPC uses stdout exclusively. console.log → console.error at module load time.                                         |
| DD-9  | Chokidar EventEmitter cast for Node 20                    | chokidar v5 typed EventEmitter requires Node 22+ @types/node. Cast to plain EventEmitter.                                      |
| DD-10 | Pipeline failure fatal at startup, non-fatal during watch | Startup with bad config exits immediately. File-watch rebuild failure keeps previous dataset.                                  |

---

## Findings

Record design observations from reviewing the diagrams above. Each finding should reference which diagram revealed it and its impact on the spec.

| #   | Finding                                                                                                                                                                                                                                                  | Diagram Source | Impact on Spec                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------- |
| F-1 | The tool-registry appears twice in the component diagram (registration + dispatch) because it serves two roles: static registration at startup and dynamic dispatch at runtime. This is correct — a single module handles both.                          | Component      | None — intentional dual-role design               |
| F-2 | File watcher triggers rebuild on pipeline-session directly, bypassing mcp-server. This is correct — the watcher has a reference to the sessionManager, so the new dataset is available to the next tool call without orchestrator involvement.           | Sequence       | None — by-design for simplicity                   |
| F-3 | No tool for query (the raw ProcessStateAPI method dispatcher). The CLI has a `query` subcommand that calls arbitrary API methods. The MCP server exposes each method as a dedicated tool instead, providing better discoverability and input validation. | Both           | DD-4 captures this — no generic query tool needed |

---

## Summary

The MCPServerIntegration design review covers 5 sequential steps across 4 participants (mcp-server, pipeline-session, tool-registry, file-watcher) with 6 key data types and 5 error paths. The architecture is a thin transport layer — all business logic delegates to existing ProcessStateAPI methods and CLI assembler functions. The 10 design decisions document key trade-offs around stdout isolation, output format selection, rebuild atomicity, and Node.js compatibility.
