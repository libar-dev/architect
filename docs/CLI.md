# Data API CLI

> **Deprecated:** The full CLI documentation is now auto-generated. See [CLI Reference Tables](../docs-live/reference/CLI-REFERENCE.md) and [CLI Recipes & Workflow Guide](../docs-live/reference/CLI-RECIPES.md). This file retains only quick-start guidance and operational reference (JSON envelope, exit codes).
>
> Query the pattern graph directly from annotated source code.

> **For AI coding agents:** Start every session with these three commands:
>
> 1. `overview` — project health
> 2. `scope-validate <pattern> <session-type>` — catches blockers before you start
> 3. `context <pattern> --session <type>` — curated context bundle

---

## Generated References

> This document retains operational reference (JSON envelope, exit codes, piping).
> For full CLI documentation, see the generated references below.

- **[CLI Reference Tables](../docs-live/reference/CLI-REFERENCE.md)** — all flags, options, filters, and modifiers
- **[CLI Recipes & Workflow Guide](../docs-live/reference/CLI-RECIPES.md)** — command descriptions, usage examples, and common recipes

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

`pnpm` outputs a banner line to stdout (`> @libar-dev/...`). For clean JSON piping, use `npx tsx src/cli/pattern-graph-cli.ts` directly:

```bash
npx tsx src/cli/pattern-graph-cli.ts list --status roadmap --names-only | jq '.data[]'
```
