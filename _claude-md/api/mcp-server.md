### MCP Server — Native AI Context Tools

When the MCP server is running, **use `dp_*` tools instead of CLI commands** (`pnpm process:query --`). The MCP server keeps the MasterDataset in memory — tool calls dispatch in sub-milliseconds vs 2-5 seconds for CLI subprocess invocations. All 25 tools wrap the same ProcessStateAPI methods available via CLI.

#### Session Start (MCP Protocol)

Use these tools at the start of every PR or implementation session, in order:

| Step | MCP Tool            | What You Get                                | CLI Equivalent                                    |
| ---- | ------------------- | ------------------------------------------- | ------------------------------------------------- |
| 1    | `dp_overview`       | Project health, active phases, blockers     | `pnpm process:query -- overview`                  |
| 2    | `dp_scope_validate` | Pre-flight: FSM violations, missing deps    | `pnpm process:query -- scope-validate <p> <type>` |
| 3    | `dp_context`        | Curated context bundle for the session      | `pnpm process:query -- context <p> --session <t>` |
| 4    | `dp_files`          | File reading list with implementation paths | `pnpm process:query -- files <p> --related`       |

Steps 1-2 can run in parallel (no dependencies between them).

#### Tool Reference

**Session-Aware Tools** — text output, use for workflow:

| Tool                | Input               | Description                                    |
| ------------------- | ------------------- | ---------------------------------------------- |
| `dp_overview`       | _(none)_            | Progress %, active phases, blocking chains     |
| `dp_context`        | `name`, `session?`  | Curated context (planning/design/implement)    |
| `dp_files`          | `name`              | Ordered file list with roles                   |
| `dp_dep_tree`       | `name`, `maxDepth?` | Dependency chain with status per dep           |
| `dp_scope_validate` | `name`, `session`   | PASS/BLOCKED/WARN pre-flight verdict           |
| `dp_handoff`        | `name`, `session?`  | Session-end state for multi-session continuity |

**Data Query Tools** — JSON output, use for structured lookups:

| Tool           | Input                                                    | Description                                        |
| -------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `dp_status`    | _(none)_                                                 | Pattern counts by status, completion %             |
| `dp_pattern`   | `name`                                                   | Full metadata: deliverables, relationships, shapes |
| `dp_list`      | `status?`, `phase?`, `category?`, `namesOnly?`, `count?` | Filtered pattern listing                           |
| `dp_search`    | `query`                                                  | Fuzzy name search with similarity scores           |
| `dp_rules`     | `pattern?`, `onlyInvariants?`                            | Business rules from Gherkin Rule: blocks           |
| `dp_tags`      | _(none)_                                                 | Tag usage counts across all sources                |
| `dp_sources`   | _(none)_                                                 | File inventory by type (TS, Gherkin, stubs)        |
| `dp_stubs`     | `unresolved?`                                            | Design stubs with resolution status                |
| `dp_decisions` | `name?`                                                  | AD-N/DD-N design decisions from stubs              |

**Architecture Tools** — JSON output, use for dependency and structure analysis:

| Tool                   | Input    | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `dp_arch_context`      | `name?`  | Bounded contexts with member patterns       |
| `dp_arch_layer`        | `name?`  | Architecture layers with member patterns    |
| `dp_arch_neighborhood` | `name`   | Uses, used-by, same-context peers           |
| `dp_arch_blocking`     | _(none)_ | Patterns blocked by incomplete dependencies |
| `dp_arch_dangling`     | _(none)_ | Broken references to nonexistent patterns   |
| `dp_arch_coverage`     | `path?`  | Annotation coverage % and unused taxonomy   |
| `dp_unannotated`       | `path?`  | Files missing @libar-docs annotations       |

**Server Management:**

| Tool         | Description                                            |
| ------------ | ------------------------------------------------------ |
| `dp_rebuild` | Force dataset rebuild from current source files        |
| `dp_config`  | Show source globs, base dir, build time, pattern count |
| `dp_help`    | List all available tools with descriptions             |

#### Common Recipes

| Goal                               | Tools                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| What patterns are blocking?        | `dp_arch_blocking`                                                 |
| Understand a pattern before coding | `dp_context` (name, session) + `dp_scope_validate` (name, session) |
| Find business rules for a feature  | `dp_rules` with `pattern` filter                                   |
| Check annotation gaps              | `dp_arch_coverage` or `dp_unannotated`                             |
| Explore a bounded context          | `dp_arch_context` with name                                        |
| Find what depends on a pattern     | `dp_arch_neighborhood` with name                                   |
| List all roadmap patterns          | `dp_list` with `status: "roadmap"`                                 |
| Search by partial name             | `dp_search` with query                                             |

#### Configuration

The MCP server is configured via `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "delivery-process": {
      "command": "npx",
      "args": ["dp-mcp-server", "--watch"]
    }
  }
}
```

For monorepo setups with explicit source globs:

```json
{
  "mcpServers": {
    "delivery-process": {
      "command": "npx",
      "args": [
        "dp-mcp-server",
        "--watch",
        "--input",
        "packages/core/src/**/*.ts",
        "--input",
        "packages/api/src/**/*.ts",
        "--features",
        "specs/**/*.feature"
      ]
    }
  }
}
```

The `--watch` flag enables auto-rebuild when `.ts` or `.feature` files change (500ms debounce). Without it, use `dp_rebuild` after annotation changes.

#### Tips

- `dp_rules` without a `pattern` filter returns a compact summary (totals + rule names + per-area counts) — unfiltered output is capped to prevent context overflow.
- `dp_pattern` returns full metadata (~66KB for completed patterns) — prefer `dp_context` with a session type for interactive sessions.
- `dp_search` uses fuzzy matching — partial names work (e.g., "MCP" matches all MCP-related patterns).
- `dp_list` filters compose: `status` + `phase` + `category` narrow results cumulatively.
- Session-aware tools return formatted text (like CLI output). Data and architecture tools return JSON.
