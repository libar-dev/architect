@architect
@architect-pattern:DataAPIPlatformIntegration
@architect-status:completed
@architect-unlock-reason:Split-into-dedicated-specs
@architect-phase:25d
@architect-product-area:DataAPI
@architect-effort:3d
@architect-priority:medium
@architect-business-value:native-claude-code-integration-and-monorepo-support
Feature: Data API Platform Integration - MCP Server and Monorepo Support

  **Problem:**
  The process-api CLI requires subprocess invocation for every query, adding
  shell overhead and preventing stateful interaction. Claude Code's native tool
  integration mechanism is Model Context Protocol (MCP), which the process API
  does not support. Additionally, in the monorepo context, queries must specify
  input paths for each package manually -- there is no cross-package view or
  package-scoped filtering.

  **Solution:**
  Two integration capabilities:
  1. **MCP Server Mode** -- Expose PatternGraphAPI as an MCP server that Claude
     Code connects to directly. Eliminates CLI overhead and enables stateful
     queries (pipeline loaded once, multiple queries without re-scanning).
  2. **Monorepo Support** -- Cross-package dependency views, package-scoped
     filtering, multi-package presets, and per-package coverage reports.

  **Business Value:**
  | Benefit | Impact |
  | MCP integration | Claude Code calls API as native tool |
  | Stateful queries | No re-scanning between calls |
  | Cross-package views | Understand monorepo-wide dependencies |
  | Package-scoped queries | Focus on specific packages |

  **Superseded:** This spec has been split into focused specs:
  - MCPServerIntegration (Phase 46) -- MCP server mode (Rule 1)
  - MonorepoSupport (Phase 100) -- Cross-package queries (Rule 3)
  - Rule 2 (CLAUDE.md context layer) absorbed into existing ClaudeModuleGeneration
  - Rule 4 (git hooks/watch) partially exists in lint-process, watch mode deferred

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | MCP server entry point | superseded | src/mcp/server.ts | Yes | integration |
      | MCP tool definitions | superseded | src/mcp/tools.ts | Yes | unit |
      | MCP session state management | superseded | src/mcp/session.ts | Yes | unit |
      | CLAUDE.md context layer generator | superseded | src/generators/claude-md-generator.ts | Yes | unit |
      | Cross-package dependency analyzer | superseded | src/api/cross-package.ts | Yes | unit |
      | Package-scoped filter flag | superseded | src/cli/process-api.ts | Yes | integration |
      | Multi-package config support | superseded | src/config/multi-package.ts | Yes | unit |
      | Per-package coverage report | superseded | src/api/coverage-analyzer.ts | Yes | unit |

  # ============================================================================
  # RULE 1: MCP Server Mode
  # ============================================================================

  Rule: PatternGraphAPI is accessible as an MCP server for Claude Code

    **Invariant:** The MCP server exposes all PatternGraphAPI methods as MCP tools
    with typed input/output schemas. The pipeline is loaded once on server start
    and refreshed on source file changes.

    **Rationale:** MCP is Claude Code's native tool integration protocol. An MCP
    server eliminates the CLI subprocess overhead (2-5s per query) and enables
    Claude Code to call process queries as naturally as it calls other tools.
    Stateful operation means the pipeline loads once and serves many queries.

    **MCP configuration:**
    ```
    // .mcp.json or claude_desktop_config.json
    {
      "mcpServers": {
        "architect": {
          "command": "npx",
          "args": ["tsx", "src/mcp/server.ts", "--input", "src/**/*.ts", ...]
        }
      }
    }
    ```

    **Verified by:** MCP server starts, MCP tool invocation, Auto-refresh on change

    @acceptance-criteria @happy-path
    Scenario: MCP server exposes PatternGraphAPI tools
      Given the MCP server is started with input globs
      When Claude Code requests tool listing
      Then all PatternGraphAPI methods appear as MCP tools
      And each tool has typed input and output schemas

    @acceptance-criteria @happy-path
    Scenario: MCP tool invocation returns structured result
      Given the MCP server is running with loaded dataset
      When Claude Code invokes the "getCurrentWork" tool
      Then the response contains active patterns in summary format
      And the response includes metadata (pattern count, cache status)

    @acceptance-criteria @edge-case
    Scenario: MCP tool invocation with invalid parameters returns error
      Given the MCP server is running with loaded dataset
      When Claude Code invokes a tool with invalid parameters
      Then the response contains a structured error with code and message
      And the MCP server remains operational for subsequent requests

  # ============================================================================
  # RULE 2: CLAUDE.md Context Layer Generation
  # ============================================================================

  Rule: Process state can be auto-generated as CLAUDE.md context sections

    **Invariant:** Generated CLAUDE.md sections are additive layers that provide
    pattern metadata, relationships, and reading lists for specific scopes.

    **Rationale:** CLAUDE.md is the primary mechanism for providing persistent
    context to Claude Code sessions. Auto-generating CLAUDE.md sections from
    process state ensures the context is always fresh and consistent with the
    source annotations. This applies the "code-first documentation" principle
    to AI context itself.

    **Verified by:** Generate context layer, Context layer is up-to-date

    @acceptance-criteria @happy-path
    Scenario: Generate CLAUDE.md context layer for bounded context
      Given annotated patterns in the "orders" bounded context
      When running "process-api generate-context-layer --context orders"
      Then a CLAUDE.md section is generated with pattern metadata
      And the section includes relationship summaries
      And the section includes a file reading list

    @acceptance-criteria @happy-path
    Scenario: Context layer reflects current process state
      Given a pattern transitioned from "roadmap" to "active"
      When regenerating the context layer
      Then the CLAUDE.md section shows the updated status
      And the session workflow section reflects the new state

    @acceptance-criteria @edge-case
    Scenario: Context layer for bounded context with no annotations
      Given a bounded context directory with no @architect annotations
      When running "process-api generate-context-layer --context empty-context"
      Then the output indicates no patterns found in the context
      And the CLAUDE.md section contains a placeholder with discovery guidance

  # ============================================================================
  # RULE 3: Monorepo Cross-Package Queries
  # ============================================================================

  Rule: Cross-package views show dependencies spanning multiple packages

    **Invariant:** Cross-package queries aggregate patterns from multiple
    input sources and resolve cross-package relationships.

    **Rationale:** In the monorepo, patterns in `platform-core` are used by
    patterns in `platform-bc`, which are used by the example app. Understanding
    these cross-package dependencies is essential for release planning and
    impact analysis. Currently each package must be queried independently
    with separate input globs.

    **Verified by:** Cross-package dependency view, Package-scoped filtering

    @acceptance-criteria @happy-path
    Scenario: Cross-package dependency view
      Given patterns across "platform-core" and "platform-bc" packages
      When running "process-api cross-package"
      Then the output shows which packages depend on which patterns
      And completed vs roadmap dependencies are distinguished

    @acceptance-criteria @happy-path
    Scenario: Package-scoped query filtering
      Given patterns from multiple packages in the dataset
      When running "process-api list --package platform-core --status active"
      Then only patterns from "platform-core" are returned
      And the package filter composes with other filters

    @acceptance-criteria @edge-case
    Scenario: Query for non-existent package returns empty result
      Given patterns from "platform-core" and "platform-bc" packages
      When running "process-api list --package non-existent-package"
      Then the output is an empty result set
      And no error is raised

  # ============================================================================
  # RULE 4: Git Hook and Watch Integration
  # ============================================================================

  Rule: Process validation integrates with git hooks and file watching

    **Invariant:** Pre-commit hooks validate annotation consistency. Watch mode
    re-generates docs on source changes.

    **Rationale:** Git hooks catch annotation errors at commit time (e.g., new
    `uses` reference to non-existent pattern, invalid `arch-role` value, stub
    `@target` to non-existent directory). Watch mode enables live documentation
    regeneration during implementation sessions.

    **Verified by:** Pre-commit annotation validation, Watch mode re-generation

    @acceptance-criteria @happy-path
    Scenario: Pre-commit validates annotation consistency
      Given a staged file adds a uses tag referencing "NonExistentPattern"
      When the pre-commit hook runs
      Then validation fails with "dangling reference" error
      And the error identifies the invalid reference

    @acceptance-criteria @happy-path
    Scenario: Watch mode re-generates on file change
      Given watch mode is running with "process-api watch --generate architecture"
      When a source file is modified
      Then the architecture docs are regenerated automatically
      And only affected doc sections are updated

    @acceptance-criteria @edge-case
    Scenario: Pre-commit on clean commit with no annotation changes
      Given staged files contain no @architect annotations
      When the pre-commit hook runs
      Then validation passes without errors
      And no annotation warnings are emitted
