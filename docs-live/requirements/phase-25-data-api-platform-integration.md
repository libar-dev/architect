# 📋 Data API Platform Integration

**Purpose:** Detailed requirements for the Data API Platform Integration feature

---

## Overview

| Property       | Value                                               |
| -------------- | --------------------------------------------------- |
| Status         | planned                                             |
| Product Area   | DeliveryProcess                                     |
| Business Value | native claude code integration and monorepo support |
| Phase          | 25                                                  |

## Description

**Problem:**
The process-api CLI requires subprocess invocation for every query, adding
shell overhead and preventing stateful interaction. Claude Code's native tool
integration mechanism is Model Context Protocol (MCP), which the process API
does not support. Additionally, in the monorepo context, queries must specify
input paths for each package manually -- there is no cross-package view or
package-scoped filtering.

**Solution:**
Two integration capabilities:

1. **MCP Server Mode** -- Expose ProcessStateAPI as an MCP server that Claude
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

## Acceptance Criteria

**MCP server exposes ProcessStateAPI tools**

- Given the MCP server is started with input globs
- When Claude Code requests tool listing
- Then all ProcessStateAPI methods appear as MCP tools
- And each tool has typed input and output schemas

**MCP tool invocation returns structured result**

- Given the MCP server is running with loaded dataset
- When Claude Code invokes the "getCurrentWork" tool
- Then the response contains active patterns in summary format
- And the response includes metadata (pattern count, cache status)

**MCP tool invocation with invalid parameters returns error**

- Given the MCP server is running with loaded dataset
- When Claude Code invokes a tool with invalid parameters
- Then the response contains a structured error with code and message
- And the MCP server remains operational for subsequent requests

**Generate CLAUDE.md context layer for bounded context**

- Given annotated patterns in the "orders" bounded context
- When running "process-api generate-context-layer --context orders"
- Then a CLAUDE.md section is generated with pattern metadata
- And the section includes relationship summaries
- And the section includes a file reading list

**Context layer reflects current process state**

- Given a pattern transitioned from "roadmap" to "active"
- When regenerating the context layer
- Then the CLAUDE.md section shows the updated status
- And the session workflow section reflects the new state

**Context layer for bounded context with no annotations**

- Given a bounded context directory with no @libar-docs annotations
- When running "process-api generate-context-layer --context empty-context"
- Then the output indicates no patterns found in the context
- And the CLAUDE.md section contains a placeholder with discovery guidance

**Cross-package dependency view**

- Given patterns across "platform-core" and "platform-bc" packages
- When running "process-api cross-package"
- Then the output shows which packages depend on which patterns
- And completed vs roadmap dependencies are distinguished

**Package-scoped query filtering**

- Given patterns from multiple packages in the dataset
- When running "process-api list --package platform-core --status active"
- Then only patterns from "platform-core" are returned
- And the package filter composes with other filters

**Query for non-existent package returns empty result**

- Given patterns from "platform-core" and "platform-bc" packages
- When running "process-api list --package non-existent-package"
- Then the output is an empty result set
- And no error is raised

**Pre-commit validates annotation consistency**

- Given a staged file adds a uses tag referencing "NonExistentPattern"
- When the pre-commit hook runs
- Then validation fails with "dangling reference" error
- And the error identifies the invalid reference

**Watch mode re-generates on file change**

- Given watch mode is running with "process-api watch --generate architecture"
- When a source file is modified
- Then the architecture docs are regenerated automatically
- And only affected doc sections are updated

**Pre-commit on clean commit with no annotation changes**

- Given staged files contain no @libar-docs annotations
- When the pre-commit hook runs
- Then validation passes without errors
- And no annotation warnings are emitted

## Business Rules

**ProcessStateAPI is accessible as an MCP server for Claude Code**

**Invariant:** The MCP server exposes all ProcessStateAPI methods as MCP tools
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
        "delivery-process": {
          "command": "npx",
          "args": ["tsx", "src/mcp/server.ts", "--input", "src/**/*.ts", ...]
        }
      }
    }
    ```

    **Verified by:** MCP server starts, MCP tool invocation, Auto-refresh on change

_Verified by: MCP server exposes ProcessStateAPI tools, MCP tool invocation returns structured result, MCP tool invocation with invalid parameters returns error_

**Process state can be auto-generated as CLAUDE.md context sections**

**Invariant:** Generated CLAUDE.md sections are additive layers that provide
pattern metadata, relationships, and reading lists for specific scopes.

    **Rationale:** CLAUDE.md is the primary mechanism for providing persistent
    context to Claude Code sessions. Auto-generating CLAUDE.md sections from
    process state ensures the context is always fresh and consistent with the
    source annotations. This applies the "code-first documentation" principle
    to AI context itself.

    **Verified by:** Generate context layer, Context layer is up-to-date

_Verified by: Generate CLAUDE.md context layer for bounded context, Context layer reflects current process state, Context layer for bounded context with no annotations_

**Cross-package views show dependencies spanning multiple packages**

**Invariant:** Cross-package queries aggregate patterns from multiple
input sources and resolve cross-package relationships.

    **Rationale:** In the monorepo, patterns in `platform-core` are used by
    patterns in `platform-bc`, which are used by the example app. Understanding
    these cross-package dependencies is essential for release planning and
    impact analysis. Currently each package must be queried independently
    with separate input globs.

    **Verified by:** Cross-package dependency view, Package-scoped filtering

_Verified by: Cross-package dependency view, Package-scoped query filtering, Query for non-existent package returns empty result_

**Process validation integrates with git hooks and file watching**

**Invariant:** Pre-commit hooks validate annotation consistency. Watch mode
re-generates docs on source changes.

    **Rationale:** Git hooks catch annotation errors at commit time (e.g., new
    `uses` reference to non-existent pattern, invalid `arch-role` value, stub
    `@target` to non-existent directory). Watch mode enables live documentation
    regeneration during implementation sessions.

    **Verified by:** Pre-commit annotation validation, Watch mode re-generation

_Verified by: Pre-commit validates annotation consistency, Watch mode re-generates on file change, Pre-commit on clean commit with no annotation changes_

## Deliverables

- MCP server entry point (pending)
- MCP tool definitions (pending)
- MCP session state management (pending)
- CLAUDE.md context layer generator (pending)
- Cross-package dependency analyzer (pending)
- Package-scoped filter flag (pending)
- Multi-package config support (pending)
- Per-package coverage report (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
