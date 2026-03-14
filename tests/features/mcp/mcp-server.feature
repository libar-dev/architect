@architect
Feature: MCP Server Integration Tests

  Verifies the MCP-specific layer: tool registration, pipeline session
  lifecycle, file watcher behavior, CLI argument parsing, and output
  formatting. ProcessStateAPI correctness is tested separately.

  Background: Test infrastructure
    Given a test MasterDataset is initialized for MCP

  Rule: Pipeline session manager loads once and supports atomic rebuild

    **Invariant:** The pipeline runs exactly once during initialization.
    All subsequent calls read from in-memory MasterDataset. Rebuild
    atomically replaces the session.

    **Rationale:** Verifies the core lifecycle contract of PipelineSessionManager
    without requiring real file I/O.

    **Verified by:** Session initializes and contains dataset,
    getSession throws before initialization,
    Config without sources falls back to conventional globs,
    Rebuild replaces session atomically,
    getSession returns the previous session during rebuild,
    Concurrent rebuild requests coalesce to the newest session,
    isRebuilding flag lifecycle

    Scenario: Session initializes and contains dataset
      Given a PipelineSessionManager initialized with test data
      When getSession is called
      Then the session contains a MasterDataset with patterns
      And the session records build time in milliseconds

    Scenario: getSession throws before initialization
      Given a new uninitialized PipelineSessionManager
      When getSession is called without initialization
      Then it throws an error containing "Session not initialized"

    Scenario: Config without sources falls back to conventional globs
      Given a temp project with a config file but no sources and conventional directories
      When the PipelineSessionManager initializes from that temp project
      Then initialization succeeds using fallback source globs
      And the session source globs include conventional TypeScript and feature paths

    Scenario: Rebuild replaces session atomically
      Given a PipelineSessionManager initialized with test data
      When rebuild is called
      Then a new session is returned
      And the new session has a different build time than the original

    Scenario: getSession returns the previous session during rebuild
      Given a PipelineSessionManager initialized with test data
      When rebuild is started without awaiting
      Then getSession still returns the original session during rebuild
      When the rebuild completes
      And getSession returns the rebuilt session after completion

    Scenario: Concurrent rebuild requests coalesce to the newest session
      Given a PipelineSessionManager initialized with test data
      When two rebuild calls are started without awaiting
      Then isRebuilding returns true while concurrent rebuilds are pending
      When both rebuild calls complete
      Then both rebuild calls resolve to the same latest session
      And getSession returns that same latest session

    Scenario: isRebuilding flag lifecycle
      Given a PipelineSessionManager initialized with test data
      Then isRebuilding returns false before rebuild
      When rebuild is started without awaiting
      Then isRebuilding returns true during rebuild
      When the rebuild completes
      Then isRebuilding returns false after rebuild completes

  Rule: Tool registration creates correctly named tools with schemas

    **Invariant:** Every CLI subcommand is registered as an MCP tool with
    architect_ prefix, non-empty description, and Zod input schema.

    **Rationale:** Verifies tool registration correctness via MockMcpServer
    that records registerTool calls.

    **Verified by:** All tools registered with architect_ prefix,
    Each tool has a non-empty description,
    architect_overview returns formatted text,
    architect_pattern returns error for unknown pattern,
    architect_list filters apply cumulatively

    Scenario: All tools registered with architect_ prefix
      Given an McpServer mock with registered tools
      Then at least 25 tools are registered
      And each tool name starts with "architect_"

    Scenario: Each tool has a non-empty description
      Given an McpServer mock with registered tools
      Then each registered tool has a non-empty description

    Scenario: architect_overview returns formatted text
      Given an McpServer mock with registered tools
      When the architect_overview handler is called
      Then the result contains text content
      And the result is not an error

    Scenario: architect_pattern returns error for unknown pattern
      Given an McpServer mock with registered tools
      When the architect_pattern handler is called with name "NonExistentPattern"
      Then the result is an error
      And the error message contains "not found"

    Scenario: architect_list filters apply cumulatively
      Given a session with patterns of mixed status and phase
      And an McpServer mock with registered tools using that session
      When architect_list is called with status "active" and phase 46
      Then only patterns matching both status and phase are returned

  Rule: File watcher filters file types correctly

    **Invariant:** Only .ts and .feature files trigger rebuild.
    Other file types are ignored.

    **Rationale:** Verifies the file type guard extracted as isWatchedFileType.

    **Verified by:** TypeScript files trigger rebuild,
    Feature files trigger rebuild,
    Non-watched file types are ignored

    Scenario: TypeScript files trigger rebuild
      When checking if "src/mcp/server.ts" is a watched file type
      Then the file is watched

    Scenario: Feature files trigger rebuild
      When checking if "specs/mcp-server.feature" is a watched file type
      Then the file is watched

    Scenario Outline: Non-watched file types are ignored
      When checking if <file> is a watched file type
      Then the file is not watched

      Examples:
        | file         |
        | package.json |
        | README.md    |
        | styles.css   |

  Rule: CLI argument parser handles all flag variants

    **Invariant:** The parser supports --input, --features, --base-dir,
    --watch with short forms, handles -- separator, and reports version correctly.

    **Rationale:** Verifies the exported parseCliArgs function directly.

    **Verified by:** Input flag with long form,
    Input flag with short form,
    Features flag with long form,
    Watch flag enables watching,
    Base-dir flag sets directory,
    Multiple input globs accumulate,
    Double-dash separator is skipped,
    Version flag returns package version

    Scenario Outline: CLI flags are parsed correctly
      When parseCliArgs is called with "<args>"
      Then the parsed result has "<option>" set

      Examples:
        | args                          | option   |
        | --input src/**/*.ts           | input    |
        | -i src/**/*.ts                | input    |
        | --features specs/*.feature    | features |
        | -f specs/*.feature            | features |
        | --base-dir /tmp/project       | baseDir  |
        | -b /tmp/project               | baseDir  |
        | --watch                       | watch    |
        | -w                            | watch    |

    Scenario: Multiple input globs accumulate
      When parseCliArgs is called with "--input src/**/*.ts --input lib/**/*.ts"
      Then the parsed input contains 2 globs

    Scenario: Double-dash separator is skipped
      When parseCliArgs is called with "-- --input src/**/*.ts"
      Then the parsed input contains "src/**/*.ts"

    Scenario: Version flag returns package version
      When parseCliArgs is called with "--version"
      Then the version text matches the package version

  Rule: Tool output format matches expected content type

    **Invariant:** Session-aware tools return formatted text. Data query
    tools return JSON. Error results have isError flag set.

    **Rationale:** Verifies the output shape contract for tool handlers.

    **Verified by:** Session-aware tools return text content,
    Data query tools return valid JSON,
    architect_status returns JSON with counts

    Scenario: Session-aware tools return text content
      Given an McpServer mock with registered tools
      When the architect_overview handler is called
      Then the result content type is "text"

    Scenario: Data query tools return valid JSON
      Given an McpServer mock with registered tools
      When the architect_status handler is called
      Then the result content is valid JSON

    Scenario: architect_status returns JSON with counts
      Given an McpServer mock with registered tools
      When the architect_status handler is called
      Then the JSON result contains "counts" key
      And the JSON result contains "distribution" key

  Rule: Tool output correctness for edge cases

    **Invariant:** architect_rules without a pattern filter returns a compact summary
    instead of the full rules corpus. architect_pattern returns full metadata including
    deliverables, dependencies, business rules, and extracted shapes.

    **Rationale:** Unfiltered architect_rules returned 889K chars which breaks MCP clients.
    architect_pattern must match its description ("full metadata") to enable accurate tool selection.

    **Verified by:** architect_rules without pattern returns compact summary,
    architect_pattern returns full metadata including business rules and extracted shapes

    Scenario: architect_rules without pattern returns compact summary
      Given an McpServer mock with registered tools
      When the architect_rules handler is called without pattern
      Then the result contains totalRules and allRuleNames
      And the result contains a hint about using pattern parameter
      And the result does not contain full rule details

    Scenario: architect_pattern returns full metadata including business rules and extracted shapes
      Given a session with a pattern that has deliverables and dependencies
      And an McpServer mock with registered tools using that session
      When architect_pattern is called for that pattern
      Then the result contains deliverables array
      And the result contains dependencies object
      And the result contains directive and source metadata
      And the result contains business rules array
      And the result contains extracted shapes array
