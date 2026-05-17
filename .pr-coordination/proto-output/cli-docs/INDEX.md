# Architect CLI — Generated Reference (prototype)

> **Status:** prototype output of `scripts/proto/cli-catalog.ts`. Generated from CLI Zod command schemas + editorial framing aggregated in the script. Validates the documentation-projection design.

**24 verbs, 21 parity rows, 6 intent bundles, 3 deterministic gates.**

## Find what you need

| If you want to… | Go to |
| --- | --- |
| Look up a verb by what your session is doing | [Verbs by session intent](#verbs-by-session-intent) |
| Find the MCP twin of a CLI verb (or vice versa) | [CLI ↔ MCP parity table](#cli--mcp-parity-table) |
| Know which verbs produce deterministic verdicts | [Deterministic gates](#deterministic-gates) |
| Read every verb shape, ordered alphabetically | [Per-verb reference](#per-verb-reference) |
| Avoid the known traps | [Known quirks](#known-quirks) |

## Verbs by session intent

### planning

Capture a new idea, refine a candidate, decide what to build next.

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `list` | `--status candidate --names-only` |  |
| `open-questions` | `[--parent <Epic>]` | candidate readiness signal |
| `context` | `<Pattern> --session planning` |  |

### design

Promote a candidate to design tier — deliverables, stubs, ADRs, scenarios.

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `scope-validate` | `<Pattern> design` | deterministic gate |
| `bundle` | `<Pattern> --mode design --format json` |  |
| `dep-tree` | `<Pattern>` |  |
| `rules` | `--pattern <Pattern>` |  |

### implement

Build a design-tier spec end-to-end; transfer value to code + executable specs.

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `scope-validate` | `<Pattern> implement` | must be PASS |
| `bundle` | `<Pattern> --mode implement --format json` |  |
| `files` | `<Pattern>` |  |
| `rules` | `--pattern <Pattern> --only-invariants` |  |
| `query` | `isValidTransition <from> active` | FSM gate before status flip |

### review

Read a design-tier spec for implementation readiness, find gaps.

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `scope-validate` | `<Pattern> implement` | PASS / WARN / BLOCKED is the gate |
| `bundle` | `<Pattern> --mode review --format json` |  |
| `dep-tree` | `<Pattern>` |  |
| `arch` | `blocking` | global blocker view |
| `files` | `<Pattern> --related` |  |

### refactor

Modify shipped code that has no design spec (refactoring carve-out).

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `context` | `<Pattern> --session implement` | current surface |
| `files` | `<Pattern>` |  |
| `dep-tree` | `<Pattern>` | blast radius |
| `arch` | `blocking` |  |
| `arch` | `dangling --baseline <path> --strict` | graph-integrity gate |

### handoff

Wrap a session; capture state, list blockers, prepare continuation.

| Verb | Flags | Notes |
| --- | --- | --- |
| `overview` | `` |  |
| `context` | `<Pattern> --session <intent>` |  |
| `arch` | `blocking` |  |
| `open-questions` | `[--parent <X>]` | forward-looking signal |
| `handoff` | `--pattern <Pattern> --session <intent> [--modified-file <p>]...` |  |

## CLI ↔ MCP parity table

Every CLI subcommand has an MCP twin. **MCP names use underscores end-to-end** — `architect_scope_validate`, not `architect_scope-validate`.

| CLI subcommand | MCP tool name |
| --- | --- |
| `overview` | `architect_overview` |
| `status` | `architect_status` |
| `context` | `architect_context` |
| `dep-tree` | `architect_dep_tree` |
| `files` | `architect_files` |
| `scope-validate` | `architect_scope_validate` |
| `handoff` | `architect_handoff` |
| `pattern` | `architect_pattern` |
| `bundle` | `architect_bundle` |
| `list` | `architect_list` |
| `open-questions` | `architect_open_questions` |
| `search` | `architect_search` |
| `rules` | `architect_rules` |
| `taxonomy` | `architect_taxonomy` |
| `arch neighborhood` | `architect_arch_neighborhood` |
| `arch blocking` | `architect_arch_blocking` |
| `arch coverage` | `architect_coverage` |
| `documentation` | `architect_documentation` |
| `(CLI-only)` | `architect_rebuild` |
| `(CLI-only)` | `architect_config` |
| `(CLI-only)` | `architect_help` |

## Deterministic gates

### `scope-validate <Pattern> <design|implement>`

**Purpose.** Pre-flight check before starting design or implement work. Only design/implement accepted.

**Verdict shape.** Per-criterion [PASS] / [WARN] / [BLOCKED]; final verdict READY / READY (with warnings) / BLOCKED.

### `query isValidTransition <from> <to>`

**Purpose.** FSM gate before flipping @architect-status.

**Verdict shape.** JSON { success: true, data: boolean }.

### `arch dangling --baseline <path> --strict`

**Purpose.** Graph-integrity check against committed baseline.

**Verdict shape.** Exits non-zero on any drift; without --strict prints current drift as JSON.

## Per-verb reference

Sorted alphabetically. Each entry shows the signature from the live Zod schema; flags and quirks are in the dedicated sections.

### `arch`

```
pnpm architect:query arch roles|bounded-context [name]|neighborhood <pattern>|compare <bounded-context-a> <bounded-context-b>|coverage|dangling [--baseline <path>] [--write-baseline] [--strict]|orphans|blocking
```

### `bundle`

```
pnpm architect:query bundle <pattern> [--mode <plan|design|implement|review>] [--include <block[,block...]>] [--estimate-tokens]
```

Include blocks: rules, scenarios, deps, open-questions, docstring
Mode default include sets are used only when --include is omitted.
Token estimation is heuristic in this wave: chars / 4.

**Examples:**

```
architect bundle ParentEpic --include rules,scenarios,deps,open-questions --format json
architect bundle ParentEpic --mode implement --estimate-tokens --format json
```

### `context`

```
pnpm architect:query context <pattern> [--session planning|design|implement]
```

**Examples:**

```
architect context ConfigurationAPI --session implement
```

### `dep-tree`

```
pnpm architect:query dep-tree <pattern> [--depth <n>]
```

### `diagnostics`

```
pnpm architect:query diagnostics
```

### `documentation`

```
pnpm architect:query documentation <document-type> [--disclosure <level>] [--filter <status=csv>]...
```

### `files`

```
pnpm architect:query files <pattern> [--related]
```

**Examples:**

```
architect files ConfigurationAPI
architect files ConfigurationAPI --related
```

### `handoff`

```
pnpm architect:query handoff --pattern <pattern> [--session planning|design|implement|review] [--modified-file <path>]...
```

**Examples:**

```
architect handoff --pattern ConfigurationAPI
architect handoff --pattern ConfigurationAPI --session review --modified-file src/index.ts
```

### `help`

```
pnpm architect:query help
```

### `list`

```
pnpm architect:query list [--status <value>] [--role <tag>] [--parent <PatternName>] [--count] [--names-only]
```

### `open-questions`

```
pnpm architect:query open-questions [--parent <PatternName>]
```

### `overview`

```
pnpm architect:query overview
```

### `pattern`

```
pnpm architect:query pattern <name>
```

### `query`

```
pnpm architect:query query <method> [args...]
```

Whitelisted methods:
  getStatusCounts
  isValidTransition <from> <to>
  getPatternsByStatus <status>
  getPatternsByPhase <phase>

**Examples:**

```
architect query getStatusCounts
architect query isValidTransition roadmap active
```

### `repl`

```
pnpm architect:query repl
```

### `rules`

```
pnpm architect:query rules [--product-area <name>] [--pattern <name>] [--package <workspace-name>] [--feature <path-or-glob>] [--only-invariants] [--count] [--names-only]
```

### `scope-validate`

```
pnpm architect:query scope-validate <pattern> <design|implement> [--type <design|implement>] [--strict]
```

**Examples:**

```
architect scope-validate ConfigurationAPI implement
architect scope-validate ConfigurationAPI --type design --strict
```

### `search`

```
pnpm architect:query search <query>
```

### `sources`

```
pnpm architect:query sources
```

### `status`

```
pnpm architect:query status
```

### `tags`

```
pnpm architect:query tags
```

### `taxonomy`

```
pnpm architect:query taxonomy [--count]
```

### `unannotated`

```
pnpm architect:query unannotated
```

### `version`

```
pnpm architect:query version
```

## Known quirks

### MCP names use underscores end-to-end

`architect_scope_validate`, not `architect_scope-validate`. Hyphenated forms 404 against the registry.

### `scope-validate` rejects `planning` and `review`

Error message: `Scope type must be design or implement`. Idea/candidate readiness has no CLI gate — it is structural.

### `pattern <Name>` "not found" is two distinct error paths

First checks getPattern; if that misses, probes findPatternParseFailure and re-throws with provenance. Cross-check with `search` or `list --names-only` before concluding the pattern does not exist.

### `bundle --include` repeated flag keeps only the last value

`--include rules --include deps` silently keeps only `deps`. Use the comma form: `--include rules,deps,open-questions`.

### CLI vs MCP latency tradeoff

CLI 2–5s cold, 0.5s warm; one Bash result. MCP sub-millisecond per call but each call is its own round trip. Default to CLI; reach for MCP when bursting ≥5 verbs.

## Provenance

Source aggregates composed by `scripts/proto/cli-catalog.ts`: (1) Zod command schemas in `packages/architect-cli/src/cli/commands/`; (2) editorial intent-bundle framing hand-coded in the prototype script (lifted from `.agents/skills/architect-data-api/SKILL.md`); (3) deterministic-gate + quirk catalog hand-coded in the script. The production projection would source (2) and (3) from `_shared/` doctrine modules or per-command JSDoc.
