### MCP Server — Native AI Context Tools

When the MCP server is running, **use `architect_*` tools instead of CLI commands** (`pnpm architect:query --`). The MCP server keeps the PatternGraph in memory — tool calls dispatch in sub-milliseconds vs 2-5 seconds for CLI subprocess invocations. All 25 tools wrap the same PatternGraphAPI methods available via CLI.

#### Session Start (MCP Protocol)

Use these tools at the start of every PR or implementation session, in order:

| Step | MCP Tool                   | What You Get                                | CLI Equivalent                                      |
| ---- | -------------------------- | ------------------------------------------- | --------------------------------------------------- |
| 1    | `architect_overview`       | Project health, active phases, blockers     | `pnpm architect:query -- overview`                  |
| 2    | `architect_scope_validate` | Pre-flight: FSM violations, missing deps    | `pnpm architect:query -- scope-validate <p> <type>` |
| 3    | `architect_context`        | Curated context bundle for the session      | `pnpm architect:query -- context <p> --session <t>` |
| 4    | `architect_files`          | File reading list with implementation paths | `pnpm architect:query -- files <p> --related`       |

Steps 1-2 can run in parallel (no dependencies between them).

#### Tool Reference

**Session-Aware Tools** — text output, use for workflow:

| Tool                       | Input               | Description                                    |
| -------------------------- | ------------------- | ---------------------------------------------- |
| `architect_overview`       | _(none)_            | Progress %, active phases, blocking chains     |
| `architect_context`        | `name`, `session?`  | Curated context (planning/design/implement)    |
| `architect_files`          | `name`              | Ordered file list with roles                   |
| `architect_dep_tree`       | `name`, `maxDepth?` | Dependency chain with status per dep           |
| `architect_scope_validate` | `name`, `session`   | PASS/BLOCKED/WARN pre-flight verdict           |
| `architect_handoff`        | `name`, `session?`  | Session-end state for multi-session continuity |

**Data Query Tools** — JSON output, use for structured lookups:

| Tool                  | Input                                                    | Description                                        |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `architect_status`    | _(none)_                                                 | Pattern counts by status, completion %             |
| `architect_pattern`   | `name`                                                   | Full metadata: deliverables, relationships, shapes |
| `architect_list`      | `status?`, `phase?`, `category?`, `namesOnly?`, `count?` | Filtered pattern listing                           |
| `architect_search`    | `query`                                                  | Fuzzy name search with similarity scores           |
| `architect_rules`     | `pattern?`, `onlyInvariants?`                            | Business rules from Gherkin Rule: blocks           |
| `architect_tags`      | _(none)_                                                 | Tag usage counts across all sources                |
| `architect_sources`   | _(none)_                                                 | File inventory by type (TS, Gherkin, stubs)        |
| `architect_stubs`     | `unresolved?`                                            | Design stubs with resolution status                |
| `architect_decisions` | `name?`                                                  | AD-N/DD-N design decisions from stubs              |

**Architecture Tools** — JSON output, use for dependency and structure analysis:

| Tool                          | Input    | Description                                 |
| ----------------------------- | -------- | ------------------------------------------- |
| `architect_arch_context`      | `name?`  | Bounded contexts with member patterns       |
| `architect_arch_layer`        | `name?`  | Architecture layers with member patterns    |
| `architect_arch_neighborhood` | `name`   | Uses, used-by, same-context peers           |
| `architect_arch_blocking`     | _(none)_ | Patterns blocked by incomplete dependencies |
| `architect_arch_dangling`     | _(none)_ | Broken references to nonexistent patterns   |
| `architect_arch_coverage`     | `path?`  | Annotation coverage % and unused taxonomy   |
| `architect_unannotated`       | `path?`  | Files missing @architect annotations        |

**Server Management:**

| Tool                | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `architect_rebuild` | Force PatternGraph rebuild from current source files   |
| `architect_config`  | Show source globs, base dir, build time, pattern count |
| `architect_help`    | List all available tools with descriptions             |

#### Common Recipes

| Goal                               | Tools                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| What patterns are blocking?        | `architect_arch_blocking`                                                        |
| Understand a pattern before coding | `architect_context` (name, session) + `architect_scope_validate` (name, session) |
| Find business rules for a feature  | `architect_rules` with `pattern` filter                                          |
| Check annotation gaps              | `architect_arch_coverage` or `architect_unannotated`                             |
| Explore a bounded context          | `architect_arch_context` with name                                               |
| Find what depends on a pattern     | `architect_arch_neighborhood` with name                                          |
| List all roadmap patterns          | `architect_list` with `status: "roadmap"`                                        |
| Search by partial name             | `architect_search` with query                                                    |

#### Configuration

The MCP server is configured via `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": ["architect-mcp", "--watch"]
    }
  }
}
```

For monorepo setups with explicit source globs:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": [
        "architect-mcp",
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

The `--watch` flag enables auto-rebuild when `.ts` or `.feature` files change (500ms debounce). Without it, use `architect_rebuild` after annotation changes.

#### Tips

- `architect_rules` without a `pattern` filter returns a compact summary (totals + rule names + per-area counts) — unfiltered output is capped to prevent context overflow.
- `architect_pattern` returns full metadata (~66KB for completed patterns) — prefer `architect_context` with a session type for interactive sessions.
- `architect_search` uses fuzzy matching — partial names work (e.g., "MCP" matches all MCP-related patterns).
- `architect_list` filters compose: `status` + `phase` + `category` narrow results cumulatively.
- Session-aware tools return formatted text (like CLI output). Data and architecture tools return JSON.
