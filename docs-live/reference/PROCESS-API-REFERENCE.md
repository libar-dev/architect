# Process API CLI Reference

> Auto-generated from CLI schema. See [Process API Guide](../../docs/PROCESS-API.md) for usage examples and recipes.

## Global Options

| Flag                   | Short | Description                          | Default                      |
| ---------------------- | ----- | ------------------------------------ | ---------------------------- |
| `--input <pattern>`    | `-i`  | TypeScript glob pattern (repeatable) | from config or auto-detected |
| `--features <pattern>` | `-f`  | Gherkin glob pattern (repeatable)    | from config or auto-detected |
| `--base-dir <dir>`     | `-b`  | Base directory                       | cwd                          |
| `--workflow <file>`    | `-w`  | Workflow config JSON                 | default                      |
| `--help`               | `-h`  | Show help                            | ---                          |
| `--version`            | `-v`  | Show version                         | ---                          |

**Config auto-detection:** If `--input` and `--features` are not provided, the CLI loads defaults from `delivery-process.config.ts` in the current directory. If no config file exists, it falls back to filesystem-based detection. If neither works, `--input` is required.

---

## Output Modifiers

Composable with `list`, `arch context/layer`, and pattern-array `query` methods.

| Output Modifier        | Description                                   |
| ---------------------- | --------------------------------------------- |
| `--names-only`         | Return array of pattern name strings          |
| `--count`              | Return integer count                          |
| `--fields <f1,f2,...>` | Return only specified fields per pattern      |
| `--full`               | Bypass summarization, return raw patterns     |
| `--format <fmt>`       | `json` (default, pretty-printed) or `compact` |

Valid fields for `--fields`: `patternName`, `status`, `category`, `phase`, `file`, `source`.

Precedence: `--count` > `--names-only` > `--fields` > default summarize.

**Note on summarization:** By default, pattern arrays are summarized to ~100 bytes per pattern (from ~3.5KB raw). Use `--full` to get complete pattern objects.

---

## List Filters

For the `list` subcommand. All filters are composable.

| List Filter             | Description                                                 |
| ----------------------- | ----------------------------------------------------------- | --------------------- |
| `--status <status>`     | Filter by FSM status (roadmap, active, completed, deferred) |
| `--phase <number>`      | Filter by roadmap phase number                              |
| `--category <name>`     | Filter by category                                          |
| `--source <ts           | gherkin>`                                                   | Filter by source type |
| `--arch-context <name>` | Filter by architecture context                              |
| `--product-area <name>` | Filter by product area                                      |
| `--limit <n>`           | Maximum results                                             |
| `--offset <n>`          | Skip first n results                                        |
