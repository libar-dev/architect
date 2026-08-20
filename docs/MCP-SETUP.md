# MCP Server Setup

> Architect MCP server exposes the current split-runtime tool surface as native Claude Code tools with sub-millisecond dispatch.

## Quick Start

### Claude Code (`.mcp.json`)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": ["architect-mcp"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": ["architect-mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### With File Watching

Auto-rebuild the dataset when source files change:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": ["architect-mcp", "--watch"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### With Explicit Globs (Monorepo)

Override config auto-detection for monorepo setups:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": [
        "architect-mcp",
        "--input",
        "packages/core/src/**/*.ts",
        "--features",
        "packages/core/specs/**/*.feature",
        "--base-dir",
        "packages/core"
      ]
    }
  }
}
```

## How It Works

The MCP server:

1. **Loads the pipeline once** — config detection, scanning, extraction, transformation (~1-2s)
2. **Keeps PatternGraph in memory** — all subsequent queries are O(1) lookups
3. **Exposes 21 focused tools** — the current split-runtime workflow surface, not the historical 25-tool monolith
4. **Optionally watches files** — auto-rebuilds on source changes (500ms debounce)

## Available Tools

| Tool                          | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `architect_overview`          | Project health summary (start here)                |
| `architect_coverage`          | Annotation coverage summary for current sources    |
| `architect_context`           | Session-aware context bundle for a pattern         |
| `architect_files`             | File reading list for a pattern                    |
| `architect_dep_tree`          | Dependency chain with status                       |
| `architect_scope_validate`    | Pre-flight check for implementation                |
| `architect_handoff`           | Session-end state for continuity                   |
| `architect_status`            | Status counts and completion percentage            |
| `architect_pattern`           | Full pattern metadata                              |
| `architect_bundle`            | Composite bundle for a pattern and its members     |
| `architect_list`              | List patterns with filters (status, role)          |
| `architect_open_questions`    | Patterns with extracted open questions             |
| `architect_search`            | Fuzzy search patterns by name                      |
| `architect_rules`             | Business rules and invariants                      |
| `architect_taxonomy`          | Current taxonomy digest and tag metadata           |
| `architect_arch_neighborhood` | Pattern neighborhood, declared uses, and peers     |
| `architect_arch_blocking`     | Patterns blocked by dependencies                   |
| `architect_rebuild`           | Force dataset rebuild                              |
| `architect_config`            | Show current configuration                         |
| `architect_documentation`     | Structured documentation view for a supported type |
| `architect_help`              | List all tools                                     |

The split runtime intentionally keeps the tool surface workflow-first.
If you need a lower-level or package-specific detail that is not in this list,
use the CLI subcommands instead of assuming the historical 25-tool monolith
surface still exists.

## CLI Options

```text
architect-mcp [options]

  -i, --input <glob>       TypeScript source globs (repeatable)
  -f, --features <glob>    Gherkin feature globs (repeatable)
  -b, --base-dir <dir>     Base directory (default: cwd)
  -w, --watch              Watch source files for changes
  -h, --help               Show help
  -v, --version            Show version
```

## Troubleshooting

### Server fails to start

Check that `architect.config.ts` exists in your project root, or provide explicit `--input` and `--features` globs.

### Tools return stale data

Call `architect_rebuild` to force a dataset refresh, or start the server with `--watch` for automatic rebuilds.

### Config not found in monorepo

Use `--base-dir` to point to the package root and `--input`/`--features` for explicit glob patterns.
