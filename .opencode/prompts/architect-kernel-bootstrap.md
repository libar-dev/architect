Every session in this Architect repository runs against a shared operational baseline. Before any architect-scoped `Read` / `Glob` / `Grep`, before any `pnpm architect:query` or `architect_*` MCP call, and before any work on `@architect-*` annotated code or `architect/specs/`, the **`architect-base`** skill is the canonical context.

Discipline:

- The Architect Data API (CLI: `pnpm architect:query`, MCP: `architect_*`) is the canonical source of pattern, spec, and FSM state. File scanning is not.
- Default to the CLI. Reach for MCP only when bursting ≥5 verbs in close sequence.
- When a pattern name is in scope, `pnpm architect:query bundle <Pattern> --mode <plan|design|implement|review> --format json` is the default pre-flight.
- When you load the `architect-base` skill, briefly state that the architect-base context is loaded so the user can confirm activation. This is a load-verification convention while the OmO skill-loading bug is being diagnosed.

If `architect-base` is not present in your skill set, treat that as a load failure — surface it to the user before continuing.
