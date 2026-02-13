### Data API CLI

Query delivery process state directly from the terminal. **Use this instead of reading generated markdown or launching explore agents** — targeted queries use 5-10x less context.

**Run `pnpm process:query -- --help` for the full command reference**, including workflow recipes, session types, architecture queries, output modifiers, and available API methods.

#### Session Start Recipe

1. `pnpm process:query -- overview` — project health (progress, active phases, blockers)
2. `pnpm process:query -- scope-validate <pattern> <session-type>` — pre-flight check (FSM, deps, prereqs)
3. `pnpm process:query -- context <pattern> --session <type>` — curated context bundle

Session types: `planning` (minimal), `design` (full: stubs + deps + deliverables), `implement` (focused: deliverables + FSM + tests).

#### Key Commands

| Command                 | When to Use                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `scope-validate`        | **Highest impact** — prevents wasted sessions by catching violations before you start |
| `context --session`     | Primary context gathering — replaces manual file reads                                |
| `dep-tree <pattern>`    | Understand dependency chains before implementation                                    |
| `list --status roadmap` | Find available patterns to work on                                                    |
| `arch blocking`         | Find patterns stuck on incomplete dependencies                                        |
| `stubs --unresolved`    | Find design stubs missing implementations                                             |
| `handoff --pattern`     | Capture session-end state for multi-session work                                      |

#### Tips

- `pattern <name>` returns ~66KB for completed patterns — prefer `context --session` for interactive sessions.
- Output modifiers (`--names-only`, `--count`, `--fields`) compose with any list/query command.
- `pnpm` outputs a banner to stdout. For clean JSON piping, use `npx tsx src/cli/process-api.ts` directly.
