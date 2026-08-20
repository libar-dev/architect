# architect-cli — Package PRD

> Boundary contract. Describes the **code as it is**, not the annotations. Source-primary: `package.json` `bin` map, `src/cli/graph-cli.ts` (the graph-handle CLI, ADR-014), and `src/handle/*` (the two-surface handle library).

## Purpose

The thin **CLI composition root** for Libar Architect. It owns every non-MCP executable bin and wires already-built projections from `architect-core` / `architect-projection` / `architect-guard` to a terminal. It parses argv at a Zod trust boundary, dispatches to a command, builds or projects over the PatternGraph, and writes text or JSON. It contains **almost no domain logic of its own** — the substantial exceptions are the graph-handle library (`src/handle/`) and doc-generation orchestration in `generate-docs.ts`.

## Public interface

### Bins (`package.json` → `bin`)

| Bin                       | Entry (`src/cli/…`)    | Nature                                                                                       |
| ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `architect`               | `graph-cli.ts`         | The graph-handle CLI (`architect q '<js>'` + named demos + the `dangling` gate). Real logic. |
| `architect-generate`      | `generate-docs.ts`     | Regenerates `docs-live/` from the PatternGraph. Real logic (~670 LOC).                       |
| `architect-guard`         | `lint-process.ts`      | One-line re-export of `runLintProcessCli` from `architect-guard`.                            |
| `architect-lint-patterns` | `lint-patterns.ts`     | One-line re-export of `runLintPatternsCli`.                                                  |
| `architect-lint-steps`    | `lint-steps.ts`        | One-line re-export of `runLintStepsCli`.                                                     |
| `architect-validate`      | `validate-patterns.ts` | One-line re-export of `runValidatePatternsCli`.                                              |

All bins are 3-line shims under `bin/*.js` that call `runArchitectCliEntrypoint` (`runtime-bridge.js` → `runBuiltPackageEntrypoint` in core), which enforces "build before run".

Package `exports` expose only the bin entrypoints (`./bin/*`) and `package.json` — this package is **not** a library surface. The handle is reached via the `architect` bin (`q` / named commands), not via a published `import`.

### The `architect` bin (ADR-014)

The retired 24-verb CLI is **deleted**, not deprecated. What remains:

| Kind                                       | Surface                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Agent front door                           | `q '<js>'` (argv expression or statement body) or `q < script.js` (stdin function body) — eval against live handle `g`                |
| Named demos (runnable docs, not contracts) | `census` · `diff` · `blast [ref]` · `fan-in [min]` · `drift` · `maturity` · `find` · `file` · `symbol` · `invariants` · `specs [ref]` |
| Frozen machine gate                        | `dangling [--baseline <path>] [--write-baseline] [--strict]` — the CI graph-integrity gate                                            |
| UX                                         | `help` / `--help` / `-h` · `version` / `--version` / `-v`                                                                             |

`g.api` is the canonical `PatternGraphAPI` (ADR-006). Deterministic reads that used to be verbs (`getStatusCounts`, `isValidTransition`, …) are one `q` script away. Stable typed tools for Studio / burst-mode remain on **MCP** (`architect_scope_validate`, `architect_handoff`, …) — not this bin.

## Enumerated functionality

**`architect` graph-handle CLI** (`graph-cli.ts`, ADR-014): `--base-dir` resolution, the `q` eval front door (`node:vm`-compiled function body with `g` / `inspect` / `execFileSync` / `REPO_ROOT` injected), named demo commands over the handle, and the one frozen machine contract — `dangling --baseline --strict`. The handle library lives in `src/handle/`: schema (discovery shapes), extract (mechanical substrate), authored (live curated core via `buildCliContext`), views (pure view functions), graph (`Graph` + `loadGraph`, incl. `g.api`).

**Shared pipeline** (`cli-runtime.ts` + `cli-types.ts`): `buildCliContext` resolves workspace sources, builds the PatternGraph, and returns graph + API + the build's validation summary. Used by the handle and by the dangling gate.

**`architect-generate`** — builds the PatternGraph and renders the documentation registry to `docs-live/`; maintains the generated-docs manifest; supports `--all`, `--list-generators`, output-dir + overwrite, disclosure level, and projection filter. The determinism-gate producer (`pnpm docs:all`).

**`architect-guard` / `architect-lint-patterns` / `architect-lint-steps` / `architect-validate`** — pass argv straight through to the corresponding runtime function exported by `architect-guard`. No local logic.

## Dependencies

Intra-repo (all `workspace:*`, direction = cli → dep):

- `@libar-dev/architect-core` — boundary parsing, config loaders, PatternGraph build (`buildPatternGraph`), `PatternGraphAPI`, runtime-path helpers.
- `@libar-dev/architect-projection` — documentation registry + projection functions used by `architect-generate` and (indirectly) MCP-owned sinks.
- `@libar-dev/architect-guard` — lint/validate/guard CLI runtimes (re-exported wholesale) plus dangling-baseline compare/write used by `architect dangling`.

External: `zod` (^4) only (runtime). Dev: `vitest` + `@amiceli/vitest-cucumber` for the executable features.

## Consumers

- **Agents (primary)** — the graph handle (`architect q '<js>'` / dogfood `pnpm architect:q`) is the agent context-gathering tool; scripts return conclusions, not envelopes (ADR-014).
- **Humans** — same handle interactively, plus named demo commands (`pnpm architect:graph <cmd>`).
- **Dogfood scripts / root `package.json`** — `pnpm architect:q`, `pnpm architect:graph`, `pnpm docs:all` (→ `architect-generate`), `pnpm validate:all`, `pnpm architect:guard --staged`.
- **Pre-push / CI gates** — `architect-guard` (FSM), `architect-validate` (DoD/anti-patterns), `architect dangling --strict --baseline` (graph drift via `ci:verify`), the `docs-live` determinism diff.
- **MCP server** — does _not_ go through this package; `architect-mcp` calls the projections directly. Scope-validate / handoff / overview tools live there.

## Load-bearing vs incidental (cut-list)

### Load-bearing (keep)

- **The composition root** — `graph-cli.ts` argv parse + Zod flag boundary + dispatch, the `src/handle/` library, `error-handler.ts`, `runtime-bridge.js`.
- **The bin wiring** — six bins; the four lint/validate/guard shims stay (published entry points even though logic lives in `architect-guard`).
- **`architect-generate` (`generate-docs.ts`)** — produces the git-tracked `docs-live/` determinism target.
- **`dangling`** — the only frozen CLI machine contract with a second machine consumer (`ci:verify`). Baseline compare/write stays here.
- **`buildCliContext`** — the single bootstrap for live PatternGraph construction used by the handle and the dangling gate.

### Incidental

- **Named demo commands** — runnable documentation over the handle; any cut they don't pre-bake is one `q` script away. Not machine contracts (ADR-014).

**Cut summary (post ADR-014):** the verb wall is gone. The right end-state is the scriptable handle + one frozen dangling gate + generate/guard bins. Deterministic readiness/handoff gates that still need a stable typed surface live on MCP, not this package.

## Size signal

- **Source files:** 17 `.ts` under `src/` (`cli/` composition + `handle/` library).
- **Approx LOC:** ~2.3k across `src/handle/` + `graph-cli.ts` + shared runtime/types; `generate-docs.ts` is the largest single file (~670).
- **Dispatchable surfaces on `architect`:** 1 eval front door (`q`) + 11 named demos + 1 machine gate (`dangling`) + help/version.
- **Bins:** 6 (1 graph-handle router + 1 generator + 4 thin guard/validate re-exports).
- **Patterns owned (live graph):** GraphHandle, GraphHandleCli, GraphHandleShapes, GraphHandleViews, AuthoredCoreBuilder, MechanicalSubstrateExtractor, CLIContextTypes, CLIErrorHandler, CLIRuntimePaths, plus package executable-test features.
