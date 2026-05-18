# Feature: CLI Surface

## Status

✅ COMPLETE — 24 subcommands across 7 bins, pinned to commit `b875ff1`. `--json` parity on canonical verbs.

## Overview

The CLI surface is the **default consumption surface** for the platform (FR-005). Seven bins (`architect`, `architect-generate`, `architect-guard`, `architect-validate`, `architect-lint-steps`, `architect-lint-patterns`, `architect-mcp`) expose 24 subcommands that together cover every read-side projection, every doc generator, and every lint / validate / guard verb. The CLI is the **default** surface; the MCP server (`006-mcp-server`) is reached for only when bursting ≥5 verbs in close sequence.

Per AGENTS.md §"Default to CLI; reach for MCP only for bursts," every architect-aware agent session is taught (via the `architect-data-api` kernel skill) to prefer the CLI for discrete queries and the MCP server for high-frequency interactions.

CLI flag parsing flows through `CLI_SCHEMA` (a Zod schema in `@libar-dev/architect-core`). The legacy `--category` flag is **hard-rejected** to prevent silent drift. Every canonical verb supports `--format compact|json`, and `--dry-run` previews effects without writing.

## User Stories

- As an AI-augmented developer, I want `pnpm architect:overview` to surface the project's patterns and FSM state in one command, so I can orient myself in a new repo in seconds.
- As an AI coding agent, I want `--format json` on every canonical verb, so I can pipe CLI output into structured tooling without scraping markdown.
- As an architect maintainer, I want the CLI to be a **thin composition root** over `architect-core` / `-projection` / `-guard`, so the JS API and the CLI stay in lockstep by construction.
- As an AI coding agent, I want `architect query <method>` to invoke whitelisted `PatternGraphAPI` methods, so I can probe specific accessors without learning a new verb each time.
- As an AI-augmented developer, I want `--dry-run` to print what `architect-generate` would write without writing it, so I can preview doc regenerations before committing.

## Acceptance Criteria

- [x] Seven bins ship: `architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`, `architect-mcp`.
- [x] 24 subcommands on `architect`: `overview`, `status`, `context`, `dep-tree`, `files`, `scope-validate`, `handoff`, `query`, `pattern`, `documentation`, `bundle`, `list`, `open-questions`, `search`, `arch`, `rules`, `diagnostics`, `tags`, `taxonomy`, `sources`, `unannotated`, `repl`, `help`, `version`.
- [x] Global flags: `-h`, `-v`, `-b/--base-dir`, `-i/--input`, `-f/--feature`, `--session`, `--depth`, `--dry-run`, `--no-cache`, `--format compact|json`.
- [x] Legacy `--category` flag is **hard-rejected** (`pattern-graph-cli.ts`).
- [x] Each subcommand maps 1:1 to a projection (see `integration-points.md` §"`architect` subcommands → projection mapping").
- [x] `architect arch <verb>` dispatches to `roles`, `bounded-context`, `neighborhood`, `compare`, `coverage`, `dangling`, `orphans`, `blocking`.
- [x] `architect-guard --staged` is the default mode; `--all` and `--files` are alternates.
- [x] `architect-generate` ships 8 default generators (`patterns`, `architecture`, `roadmap`, `changelog`, `requirements-executable`, `requirements-specs`, `decisions`, `taxonomy`).
- [x] `architect repl` provides an interactive REPL over the PatternGraphAPI (`runRepl` in `pattern-graph-cli.ts:166`).
- [x] Exit codes follow Unix convention: `0` clean, non-zero on errors or `--strict`-flagged warnings.

## Technical Requirements

- **Architecture**: Owned by `@libar-dev/architect-cli`. Composition root only — **no JS API** exposed from this package. Entry files under `packages/architect-cli/src/cli/` (`pattern-graph-cli.ts`, `generate-docs.ts`, `lint-patterns.ts`, `lint-steps.ts`, `validate-patterns.ts`). `architect-guard` bin is re-exported from `@libar-dev/architect-guard`. `architect-mcp` bin lives in `@libar-dev/architect-mcp`.
- **Inputs**: Argv + environment. `architect.config.ts` resolved via `loadConfig` / `loadProjectConfig`.
- **Outputs**: Markdown (default), JSON (`--format json`), or compact (`--format compact`). Exit codes per convention.
- **Performance**: Cold start dominated by `buildPatternGraph` (~1–2s on 329-file workspace). Cached after first call via `--no-cache` opt-out.
- **Invariants** (from Constitution): Default-CLI rule (§IV.E); composition-root-only (no JS API on `architect-cli`); legacy flag rejection (No-BC, §III.A).

## Implementation Status

**Completed:**

- ✅ All 7 bins shipped, registered in `packages/architect-cli/package.json` and `packages/architect/package.json` (meta).
- ✅ 24 subcommands wired in `packages/architect-cli/src/cli/pattern-graph-cli-commands.ts` (`COMMAND_NAMES` array, lines 17-42).
- ✅ `CLI_SCHEMA` Zod schema in `@libar-dev/architect-core` validates flags at the boundary.
- ✅ `pnpm exec architect-X` works as the universal invocation pattern across workspaces.
- ✅ `--json` parity on canonical verbs (`overview`, `context`, `scope-validate`, `bundle`, `list`, etc.).
- ✅ `architect-guard --staged` runs in `pnpm architect:guard` as the pre-commit gate.

## Dependencies

- `003-pattern-graph-read-api` — every CLI verb reads through `PatternGraphAPI`.
- `004-fragment-projection-pipeline` — every CLI verb projects through `project*` / `parseAndProject*`.
- `002-trust-boundary-validation` — `CLI_SCHEMA` is the input boundary.
- `007-fsm-lifecycle-enforcement` — `architect-guard` enforces FSM transitions.
- Consumed by: every architect-aware agent harness; `013-pre-commit-guard`; `012-doc-generation-pipeline`.

## Related Specifications

- ADR-005 — Codec / Renderer Separation
- ADR-006 — Single Read Model
- Constitution §IV.E — Default to CLI
- `006-mcp-server` — MCP parity for the same verbs
- `013-pre-commit-guard` — `architect-guard --staged`
- Executable specs under `packages/architect-cli/tests/features/`
