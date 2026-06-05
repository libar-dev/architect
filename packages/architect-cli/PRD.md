# architect-cli — Package PRD

> Boundary contract recorded post-PR-#15. Describes the **code as it is**, not the annotations. Source-primary: `package.json` `bin` map, `src/cli/pattern-graph-cli-commands.ts` (the `COMMAND_NAMES` enum), the five `src/cli/commands/*.ts` modules, and `src/cli/commands/_shared/structured.ts` (the `arch`/`query` sub-verb dispatch).

## Purpose

The thin **CLI composition root** for Libar Architect. It owns every non-MCP executable bin and wires already-built projections from `architect-core` / `architect-projection` / `architect-guard` to a terminal. It parses argv at a Zod trust boundary, dispatches to a command, asks the read side for a projection, and writes JSON or compact text. It contains **almost no domain logic of its own** — the one substantial exception is the doc-generation orchestration in `generate-docs.ts`. Everything else is argument plumbing over the PatternGraph read model.

## Public interface

### Bins (`package.json` → `bin`)

| Bin                       | Entry (`src/cli/…`)    | Nature                                                                 |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `architect`               | `pattern-graph-cli.ts` | The verb router (`architect:query <verb>`). Real logic.                |
| `architect-generate`      | `generate-docs.ts`     | Regenerates `docs-live/` from the PatternGraph. Real logic (~670 LOC). |
| `architect-guard`         | `lint-process.ts`      | One-line re-export of `runLintProcessCli` from `architect-guard`.      |
| `architect-lint-patterns` | `lint-patterns.ts`     | One-line re-export of `runLintPatternsCli`.                            |
| `architect-lint-steps`    | `lint-steps.ts`        | One-line re-export of `runLintStepsCli`.                               |
| `architect-validate`      | `validate-patterns.ts` | One-line re-export of `runValidatePatternsCli`.                        |

All bins are 3-line shims under `bin/*.js` that call `runArchitectCliEntrypoint` (`runtime-bridge.js` → `runBuiltPackageEntrypoint` in core), which enforces "build before run".

### Verbs (the `architect` bin — `COMMAND_NAMES`, 24 entries)

Grouped by source module:

- **reporting** (`commands/reporting.ts`): `overview` · `status` · `context` · `dep-tree` · `files` · `diagnostics`
- **read** (`commands/read.ts`): `pattern` · `documentation` · `bundle` · `list` · `open-questions` · `search` · `arch` · `tags`
- **planning** (`commands/planning.ts`): `scope-validate` · `handoff` · `query`
- **meta** (`commands/meta.ts`): `rules` · `taxonomy` · `sources` · `unannotated`
- **lifecycle** (`commands/lifecycle.ts`): `repl` · `help` · `version`

Two verbs are **namespaces** with their own sub-verbs (dispatched in `commands/_shared/structured.ts`):

- `arch <sub>`: `roles · bounded-context · neighborhood · graph · compare · coverage · dangling · orphans · blocking · packages` (10)
- `query <method>`: typed `PatternGraphAPI` passthrough, including methods such as `getStatusCounts`, `getCompletionPercentage`, `getPatternsByStatus`, and `isValidTransition`

## Enumerated functionality

**`architect` verb router** (`pattern-graph-cli.ts`): global flag parse (`--format`, `--session`, `--depth`, `--base-dir`, `--dry-run`, `--no-cache`, `-h/-v`), per-command Zod-validated positional/flag parsing, `--dry-run` source planning, a `repl` read-loop, and dispatch to a command's `execute`. Each verb's `execute` calls one projection and writes it through `writeProjectionOutput`/`writeJson`.

- **reporting** — progress digest (`overview`), status histogram (`status`), session context bundle (`context`), dependency tree (`dep-tree`), file reading list (`files`), raw build diagnostics (`diagnostics`).
- **read** — full pattern detail (`pattern`, with parse-failure provenance), documentation bundle by document-type (`documentation`), composite pattern bundle by mode (`bundle`), pattern catalog with filters (`list`), open-questions slice (`open-questions`), fuzzy name match (`search`), architecture views namespace (`arch`), tag-usage digest (`tags`).
- **planning** — scope readiness gate (`scope-validate`, design/implement only), handoff report (`handoff`), and the whitelisted-method namespace (`query`) including the FSM transition gate.
- **meta** — business-rule set (`rules`), taxonomy digest (`taxonomy`), source inventory (`sources`), annotation-coverage gaps (`unannotated`).
- **lifecycle** — interactive REPL, global/per-command help text, version.

**`architect-generate`** — builds the PatternGraph and renders the documentation registry to `docs-live/`; maintains the generated-docs manifest; supports `--all`, `--list-generators`, output-dir + overwrite, disclosure level, and projection filter. The determinism-gate producer (`pnpm docs:all`).

**`architect-guard` / `architect-lint-patterns` / `architect-lint-steps` / `architect-validate`** — pass argv straight through to the corresponding `runtime` function exported by `architect-guard`. No local logic.

## Dependencies

Intra-repo (all `workspace:*`, direction = cli → dep):

- `@libar-dev/architect-core` — boundary parsing (`parseAtBoundary`, Zod error formatting), config loaders, PatternGraph build (`buildPatternGraph`), `PatternGraphAPI`, runtime-path helpers. The read-model + boundary toolkit.
- `@libar-dev/architect-projection` — every `project*` function and the documentation registry. The CLI's actual payload source.
- `@libar-dev/architect-guard` — the lint/validate/guard CLI runtimes (re-exported wholesale) plus dangling-baseline compare/write used by `arch dangling`.

External: `zod` (^4) only (runtime). Dev: `vitest` + `@amiceli/vitest-cucumber` for the executable features. No other production deps — confirms the "thin" intent.

## Consumers

- **Agents (primary)** — the `architect:query <verb>` surface is the agent context-gathering tool; `--format json` is the machine path.
- **Humans** — same verbs interactively, plus `repl`.
- **Dogfood scripts / `package.json`** — `pnpm docs:all` (→ `architect-generate`), `pnpm validate:all`, `pnpm architect:guard --staged`, `pnpm architect:overview`/`:status`.
- **Pre-push / CI gates** — `architect-guard` (FSM), `architect-validate` (DoD/anti-patterns), `arch dangling --strict --baseline` (graph drift), the `docs-live` determinism diff.
- **MCP server** — does _not_ go through this package; `architect-mcp` calls the projections directly. This package is the human/agent-CLI surface only.

## Load-bearing vs incidental (cut-list)

### Load-bearing (keep)

- **The composition root itself** — `pattern-graph-cli.ts` argv parse + Zod boundary + dispatch, the `CommandDef`/`COMMAND_NAMES` registry, `error-handler.ts`, `runtime-bridge.js`, `_shared/output.ts`. This is the package's reason to exist.
- **The bin wiring** — six bins; the four lint/validate/guard shims are one line each and stay (they're the published entry points even though the logic lives in `architect-guard`).
- **`architect-generate` (`generate-docs.ts`)** — produces the git-tracked `docs-live/` determinism target. Not a verb-sprawl candidate.
- **Deterministic gate verbs that must stay server-side** (an agent cannot re-derive these from a raw emission — they encode the FSM/validation rules):
  - `scope-validate` — PASS/WARN/BLOCKED readiness gate.
  - `query isValidTransition` — the FSM legality boolean.
  - `arch dangling` (with `--baseline`/`--strict`/`--write-baseline`) — graph-drift gate with non-zero exit; owns baseline compare/write.
  - `handoff` — composed transition/readiness report (judgment-bearing, not a flat slice).

### Incidental / deletion-candidate (per-verb)

Lens: a verb is a **deletion-candidate** if it is a projection/slice/filter an agent could compute locally from **one naked typed read-model emission** (the PatternGraph + relationship index). It **survives** only if it encodes a server-side deterministic gate or non-trivial cross-graph computation.

| Verb / sub-verb                       | Verdict               | One-line reason                                                                                                |
| ------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `overview`                            | deletion-candidate    | Progress + blocker digest; derivable from status counts + blocking edges in a raw emission.                    |
| `status`                              | deletion-candidate    | Pure status histogram over patterns.                                                                           |
| `list`                                | deletion-candidate    | Filter/projection over the node set (`--status/--role/--parent/--package/--count/--names-only`) — all local.   |
| `search`                              | deletion-candidate    | Fuzzy match over `catalog.names`; agent can match locally.                                                     |
| `pattern`                             | deletion-candidate    | Single node lookup (parse-failure provenance is the only non-trivial bit; keep that surfaced in the emission). |
| `context`                             | deletion-candidate    | Session bundle = curated subset of nodes; composition an agent can do.                                         |
| `bundle`                              | deletion-candidate    | Mode-driven include-set composition over one pattern's blocks; pure selection.                                 |
| `dep-tree`                            | deletion-candidate    | Graph walk to depth N over `uses` edges; trivial from a raw graph.                                             |
| `files`                               | deletion-candidate    | Reading list = file fields of a node (± related); local slice.                                                 |
| `rules`                               | deletion-candidate    | Rule-block slice with filters/`--count`/`--names-only`; projection only.                                       |
| `open-questions`                      | deletion-candidate    | Filter of nodes carrying open-questions; local.                                                                |
| `tags`                                | deletion-candidate    | Tag-usage histogram; derivable.                                                                                |
| `taxonomy`                            | deletion-candidate    | Generated taxonomy digest; ship once in the emission (or read `docs-live/TAXONOMY.md`).                        |
| `sources`                             | deletion-candidate    | Source-file inventory list; flat data.                                                                         |
| `unannotated`                         | deletion-candidate    | Annotation-coverage gap list; derivable from node annotation presence.                                         |
| `diagnostics`                         | deletion-candidate    | Echoes `build.diagnostics`; already part of a full emission.                                                   |
| `arch roles`                          | deletion-candidate    | Enumerates roles present; local over nodes.                                                                    |
| `arch bounded-context`                | deletion-candidate    | Group-by bounded-context slice.                                                                                |
| `arch neighborhood`                   | deletion-candidate    | 1-hop edge slice around a node; trivial graph walk.                                                            |
| `arch graph`                          | deletion-candidate    | The graph itself — _this is the raw emission_ the others should derive from.                                   |
| `arch compare`                        | deletion-candidate    | Diff of two bounded-context slices; local set ops.                                                             |
| `arch coverage`                       | deletion-candidate    | Same annotation-coverage projection as `unannotated`.                                                          |
| `arch orphans`                        | deletion-candidate    | Nodes with no edges; derivable.                                                                                |
| `arch blocking`                       | deletion-candidate    | Re-reads `overview.blocking`; duplicate slice.                                                                 |
| `arch packages`                       | deletion-candidate    | Group-by-package over `archIndex.byPackage`; local.                                                            |
| `query getStatusCounts`               | deletion-candidate    | Status tally; same as `status`.                                                                                |
| `query getPatternsByStatus`           | deletion-candidate    | Status filter; same as `list --status`.                                                                        |
| `query getPatternsByNormalizedStatus` | deletion-candidate    | Normalized status filter over nodes; local.                                                                    |
| `documentation`                       | deletion-candidate    | Renders a doc-type bundle for markdown; the _markdown_ sink is a minor consumer, the data is in the emission.  |
| `repl` / `help` / `version`           | survives (incidental) | UX shims, not verb-sprawl; keep but trivially cheap.                                                           |
| `scope-validate`                      | **survives**          | Deterministic readiness gate (FSM-aware).                                                                      |
| `query isValidTransition`             | **survives**          | Deterministic FSM legality boolean.                                                                            |
| `arch dangling`                       | **survives**          | Graph-drift gate with baseline compare + strict exit code.                                                     |
| `handoff`                             | **survives**          | Composed, judgment-bearing transition report.                                                                  |

**Cut summary:** the right end-state is one naked typed PatternGraph emission (`arch graph` is essentially it) plus the four deterministic gates. The ~24 other verbs/sub-verbs are convenience projections that re-derive what the agent could slice locally — they exist because there is no single raw emission yet, not because the CLI needs to own them.

## Size signal

- **Source files:** 26 `.ts` under `src/` (router + 5 command modules + 8 `_shared` helpers + `generate-docs.ts` + 4 one-line bin shims + runtime/types/error-handler/version).
- **Approx LOC:** ~3,950 across `src/` (`generate-docs.ts` is the largest single file at ~670; `read.ts` ~408; `structured.ts` ~336).
- **Verbs:** 24 top-level (`COMMAND_NAMES`); 10 `arch` sub-verbs + 4 `query` methods → **~38 dispatchable surfaces**.
- **Bins:** 6 (1 real router + 1 real generator + 4 thin guard/validate re-exports).
- **Patterns owned (live graph):** 8 — 4 production (`PatternGraphCLI`, `CLIErrorHandler`, `CLIRuntimePaths`, `CLIVersionHelper`) + 4 `*ExecutableTests`.
