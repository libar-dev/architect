# MCP Server Setup

> Architect MCP server exposes ProcessStateAPI as native Claude Code tools with sub-millisecond dispatch.

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
2. **Keeps MasterDataset in memory** — all subsequent queries are O(1) lookups
3. **Exposes 25 tools** — each wrapping a ProcessStateAPI method or CLI subcommand
4. **Optionally watches files** — auto-rebuilds on source changes (500ms debounce)

## Available Tools

| Tool                          | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `architect_overview`          | Project health summary (start here)                  |
| `architect_context`           | Session-aware context bundle for a pattern           |
| `architect_pattern`           | Full pattern metadata                                |
| `architect_list`              | List patterns with filters (status, phase, category) |
| `architect_search`            | Fuzzy search patterns by name                        |
| `architect_status`            | Status counts and completion percentage              |
| `architect_files`             | File reading list for a pattern                      |
| `architect_dep_tree`          | Dependency chain with status                         |
| `architect_scope_validate`    | Pre-flight check for implementation                  |
| `architect_handoff`           | Session-end state for continuity                     |
| `architect_rules`             | Business rules and invariants                        |
| `architect_tags`              | Tag usage report                                     |
| `architect_sources`           | Source file inventory                                |
| `architect_stubs`             | Design stubs with resolution status                  |
| `architect_decisions`         | Design decisions from stubs                          |
| `architect_arch_context`      | Bounded contexts with members                        |
| `architect_arch_layer`        | Architecture layers with members                     |
| `architect_arch_neighborhood` | Pattern uses/used-by/peers                           |
| `architect_arch_blocking`     | Patterns blocked by dependencies                     |
| `architect_arch_dangling`     | Broken pattern references                            |
| `architect_arch_coverage`     | Annotation coverage analysis                         |
| `architect_unannotated`       | Files missing @architect                             |
| `architect_rebuild`           | Force dataset rebuild                                |
| `architect_config`            | Show current configuration                           |
| `architect_help`              | List all tools                                       |

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
