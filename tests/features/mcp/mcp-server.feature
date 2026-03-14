@libar-docs
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
    Rebuild replaces session atomically,
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

    Scenario: Rebuild replaces session atomically
      Given a PipelineSessionManager initialized with test data
      When rebuild is called
      Then a new session is returned
      And the new session has a different build time than the original

    Scenario: isRebuilding flag lifecycle
      Given a PipelineSessionManager initialized with test data
      Then isRebuilding returns false before rebuild
      When rebuild is started without awaiting
      Then isRebuilding returns true during rebuild
      When the rebuild completes
      Then isRebuilding returns false after rebuild completes

  Rule: Tool registration creates correctly named tools with schemas

    **Invariant:** Every CLI subcommand is registered as an MCP tool with
    dp_ prefix, non-empty description, and Zod input schema.

    **Rationale:** Verifies tool registration correctness via MockMcpServer
    that records registerTool calls.

    **Verified by:** All tools registered with dp_ prefix,
    Each tool has a non-empty description,
    dp_overview returns formatted text,
    dp_pattern returns error for unknown pattern,
    dp_list filters apply cumulatively

    Scenario: All tools registered with dp_ prefix
      Given an McpServer mock with registered tools
      Then at least 25 tools are registered
      And each tool name starts with "dp_"

    Scenario: Each tool has a non-empty description
      Given an McpServer mock with registered tools
      Then each registered tool has a non-empty description

    Scenario: dp_overview returns formatted text
      Given an McpServer mock with registered tools
      When the dp_overview handler is called
      Then the result contains text content
      And the result is not an error

    Scenario: dp_pattern returns error for unknown pattern
      Given an McpServer mock with registered tools
      When the dp_pattern handler is called with name "NonExistentPattern"
      Then the result is an error
      And the error message contains "not found"

    Scenario: dp_list filters apply cumulatively
      Given a session with patterns of mixed status and phase
      And an McpServer mock with registered tools using that session
      When dp_list is called with status "active" and phase 46
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
    --watch with short forms and handles -- separator and unknown args.

    **Rationale:** Verifies the exported parseCliArgs function directly.

    **Verified by:** Input flag with long form,
    Input flag with short form,
    Features flag with long form,
    Watch flag enables watching,
    Base-dir flag sets directory,
    Multiple input globs accumulate,
    Double-dash separator is skipped,
    Unknown flags produce no crash

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

  Rule: Tool output format matches expected content type

    **Invariant:** Session-aware tools return formatted text. Data query
    tools return JSON. Error results have isError flag set.

    **Rationale:** Verifies the output shape contract for tool handlers.

    **Verified by:** Session-aware tools return text content,
    Data query tools return valid JSON,
    dp_status returns JSON with counts

    Scenario: Session-aware tools return text content
      Given an McpServer mock with registered tools
      When the dp_overview handler is called
      Then the result content type is "text"

    Scenario: Data query tools return valid JSON
      Given an McpServer mock with registered tools
      When the dp_status handler is called
      Then the result content is valid JSON

    Scenario: dp_status returns JSON with counts
      Given an McpServer mock with registered tools
      When the dp_status handler is called
      Then the JSON result contains "counts" key
      And the JSON result contains "distribution" key

  Rule: Tool output correctness for edge cases

    **Invariant:** dp_rules without a pattern filter returns a compact summary
    instead of the full rules corpus. dp_pattern returns rich metadata including
    deliverables and dependencies.

    **Rationale:** Unfiltered dp_rules returned 889K chars which breaks MCP clients.
    dp_pattern must match its description ("full metadata") to enable accurate tool selection.

    **Verified by:** dp_rules without pattern returns compact summary,
    dp_pattern returns deliverables and dependencies

    Scenario: dp_rules without pattern returns compact summary
      Given an McpServer mock with registered tools
      When the dp_rules handler is called without pattern
      Then the result contains totalRules and allRuleNames
      And the result contains a hint about using pattern parameter
      And the result does not contain full rule details

    Scenario: dp_pattern returns deliverables and dependencies
      Given a session with a pattern that has deliverables and dependencies
      And an McpServer mock with registered tools using that session
      When dp_pattern is called for that pattern
      Then the result contains deliverables array
      And the result contains dependencies object
