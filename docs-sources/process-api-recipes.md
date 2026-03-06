## Why Use This

Traditional approach: read generated Markdown, parse it mentally, hope it's current. This CLI queries the **same annotated sources** that generate those docs -- in real time, with typed output.

| Approach                 | Context Cost | Accuracy              | Speed   |
| ------------------------ | ------------ | --------------------- | ------- |
| Parse generated Markdown | High         | Snapshot at gen time  | Slow    |
| **Data API CLI**         | **Low**      | Real-time from source | Instant |

The CLI has two output modes:

- **Text commands** (6) -- formatted for terminal reading or AI context. Use `===` section markers for structure.
- **JSON commands** (12+) -- wrapped in a `QueryResult` envelope. Pipeable to `jq`.

Run `process-api --help` for the full command reference with all flags and 26 available API methods.

## Quick Start

The recommended session startup is three commands:

```bash
pnpm process:query -- overview
pnpm process:query -- scope-validate MyPattern implement
pnpm process:query -- context MyPattern --session implement
```

Example `overview` output:

```text
=== PROGRESS ===
318 patterns (224 completed, 47 active, 47 planned) = 70%

=== ACTIVE PHASES ===
Phase 24: ProcessStateAPIRelationshipQueries (1 active)
Phase 25: DataAPIStubIntegration (1 active)

=== BLOCKING ===
StepLintExtendedRules blocked by: StepLintVitestCucumber

=== DATA API ===
pnpm process:query -- <subcommand>
  overview, context, scope-validate, dep-tree, list, stubs, files, rules, arch blocking
```

## Session Types

The `--session` flag tailors output to what you need right now:

| Type        | Includes                                     | When to Use                        |
| ----------- | -------------------------------------------- | ---------------------------------- |
| `planning`  | Pattern metadata and spec file only          | Creating a new roadmap spec        |
| `design`    | Full: metadata, stubs, deps, deliverables    | Making architectural decisions     |
| `implement` | Focused: deliverables, FSM state, test files | Writing code from an existing spec |

**Decision tree:** Starting to code? `implement`. Complex decisions? `design`. New pattern? `planning`. Not sure? Run `overview` first.
