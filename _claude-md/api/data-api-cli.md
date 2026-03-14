### Data API CLI

Query delivery process state directly from the terminal. **Use this instead of reading generated markdown or launching explore agents** — targeted queries use 5-10x less context.

**Run `pnpm architect:query -- --help` for the full command reference**, including workflow recipes, session types, architecture queries, output modifiers, and available API methods.

See the **Context Gathering Protocol** section above for mandatory session start commands and query recipes.

#### Tips

- `pattern <name>` returns ~66KB for completed patterns — prefer `context --session` for interactive sessions.
- `query getPattern <name>` shows raw JSON including `extractedShapes` — use for debugging shape extraction.
- Output modifiers (`--names-only`, `--count`, `--fields`) compose with any list/query command.
- `pnpm` outputs a banner to stdout. For clean JSON piping, use `npx tsx src/cli/process-api.ts` directly.
