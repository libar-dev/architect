# Data API CLI

> **Deprecated:** The full CLI story now lives in generated package docs. This file keeps only quick-start guidance and operational reference for the package host.
>
> Query the pattern graph directly from annotated source code.

> **For AI coding agents:** Start every session with these three commands:
>
> 1. `overview` — project health
> 2. `scope-validate <pattern> <session-type>` — catches blockers before you start
> 3. `context <pattern> --session <type>` — curated context bundle
>
> `context <pattern> --session <type>` remains the top-level session-context bundle command. The bounded-context architecture query was the surface that changed: use `arch bounded-context [name]`, not `arch context`.

---

## Generated References

> This document retains operational reference for the package host. For the
> generated CLI story, start at the package docs index and then jump to the CLI
> pattern pages that are actually emitted today.

- **[Generated Docs Index](../docs-live/INDEX.md)** — current generated package-doc entrypoint
- **[PatternGraphAPICLI](../docs-live/patterns/pattern-graph-apicli.md)** — CLI runtime surface and linked executable coverage
- **[PatternGraphCliSubcommands](../docs-live/patterns/pattern-graph-cli-subcommands.md)** — subcommand inventory and behavior coverage
- **[DataAPICLIErgonomics](../docs-live/patterns/data-apicli-ergonomics.md)** — session-start workflow and CLI ergonomics rationale

## Package-host wrapper

From the monorepo root, the package-host wrapper is:

```bash
pnpm pkg:query -- <subcommand>
```

Inside `packages/architect/` itself, use the local script instead:

```bash
pnpm architect:query -- <subcommand>
```

Use the direct runtime entrypoint only when you need banner-free JSON piping,
or when you are working directly on the CLI runtime surface.

---

## Output Reference

### JSON Envelope

All JSON commands wrap output in a `QueryResult` envelope:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-02-21T04:31:31.633Z",
    "patternCount": 318
  }
}
```

On error:

```json
{
  "success": false,
  "error": "Pattern not found: \"Orchestrator\"\nDid you mean: OrchestratorPipelineFactoryMigration?",
  "code": "PATTERN_NOT_FOUND"
}
```

### Exit Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| `0`  | Success                        |
| `1`  | Error (with message on stderr) |

### JSON Piping

`pnpm` outputs a banner line to stdout (`> @libar-dev/...`). For clean JSON
piping from `packages/architect/`, use the direct CLI runtime instead of the
wrapper scripts:

```bash
pnpm exec architect --base-dir . list --status roadmap --names-only | jq '.data[]'
```
