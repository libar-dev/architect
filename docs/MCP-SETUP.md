# MCP Server Setup

> delivery-process MCP server exposes ProcessStateAPI as native Claude Code tools with sub-millisecond dispatch.

## Quick Start

### Claude Code (`.mcp.json`)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "delivery-process": {
      "command": "npx",
      "args": ["dp-mcp-server"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "delivery-process": {
      "command": "npx",
      "args": ["dp-mcp-server"],
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
    "delivery-process": {
      "command": "npx",
      "args": ["dp-mcp-server", "--watch"],
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
    "delivery-process": {
      "command": "npx",
      "args": [
        "dp-mcp-server",
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

| Tool                   | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `dp_overview`          | Project health summary (start here)                  |
| `dp_context`           | Session-aware context bundle for a pattern           |
| `dp_pattern`           | Full pattern metadata                                |
| `dp_list`              | List patterns with filters (status, phase, category) |
| `dp_search`            | Fuzzy search patterns by name                        |
| `dp_status`            | Status counts and completion percentage              |
| `dp_files`             | File reading list for a pattern                      |
| `dp_dep_tree`          | Dependency chain with status                         |
| `dp_scope_validate`    | Pre-flight check for implementation                  |
| `dp_handoff`           | Session-end state for continuity                     |
| `dp_rules`             | Business rules and invariants                        |
| `dp_tags`              | Tag usage report                                     |
| `dp_sources`           | Source file inventory                                |
| `dp_stubs`             | Design stubs with resolution status                  |
| `dp_decisions`         | Design decisions from stubs                          |
| `dp_arch_context`      | Bounded contexts with members                        |
| `dp_arch_layer`        | Architecture layers with members                     |
| `dp_arch_neighborhood` | Pattern uses/used-by/peers                           |
| `dp_arch_blocking`     | Patterns blocked by dependencies                     |
| `dp_arch_dangling`     | Broken pattern references                            |
| `dp_arch_coverage`     | Annotation coverage analysis                         |
| `dp_unannotated`       | Files missing @libar-docs                            |
| `dp_rebuild`           | Force dataset rebuild                                |
| `dp_config`            | Show current configuration                           |
| `dp_help`              | List all tools                                       |

## CLI Options

```text
dp-mcp-server [options]

  -i, --input <glob>       TypeScript source globs (repeatable)
  -f, --features <glob>    Gherkin feature globs (repeatable)
  -b, --base-dir <dir>     Base directory (default: cwd)
  -w, --watch              Watch source files for changes
  -h, --help               Show help
  -v, --version            Show version
```

## Troubleshooting

### Server fails to start

Check that `delivery-process.config.ts` exists in your project root, or provide explicit `--input` and `--features` globs.

### Tools return stale data

Call `dp_rebuild` to force a dataset refresh, or start the server with `--watch` for automatic rebuilds.

### Config not found in monorepo

Use `--base-dir` to point to the package root and `--input`/`--features` for explicit glob patterns.
