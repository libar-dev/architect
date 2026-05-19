# Cleanup Review — `@libar-dev/architect-cli`

## Target

`packages/architect-cli/src/**` — the thin composition root for the architect
bins (`architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`,
`architect-lint-steps`, `architect-validate`).

- **TS files**: 26
- **Lines of code**: ~3,850
- **Subtree distribution**:
  - `cli/` — `pattern-graph-cli`, `pattern-graph-cli-runtime`, `pattern-graph-cli-types`, `pattern-graph-cli-commands`, `error-handler`, `lint-steps`, `lint-patterns`, `lint-process`, `validate-patterns`, `generate-docs`, `generated-docs-manifest`, `projection-context`, `version`, `runtime-helpers`
  - `cli/commands/` — `read`, `meta`, `reporting`, `planning`, `lifecycle`
  - `cli/commands/_shared/` — `output`, `help`, `projection-options`, `structured`, `schemas`, `runtime`, `handoff`

## Package facts

- **No barrel public surface** — exports are bin entry points only. That is the appropriate design for a thin composition root.
- 6 bin entry points + runtime-bridge.js.
- Workspace deps: `architect-core`, `architect-guard`, `architect-projection`, `zod`.
- `sideEffects: false`.

## Architectural responsibilities

`architect-cli` should be a **thin composition root** that:

- Parses argv (per PDR-001 design decisions).
- Loads `architect.config.ts`.
- Routes subcommands to the appropriate package (`architect-core`'s read API, `architect-projection`'s projections, `architect-guard`'s linters).
- Renders output (text by default with `=== SECTION ===` markers per PDR-001 DD-1; JSON when `--format json`).
- Handles errors uniformly and emits exit codes.
- **No business logic.** No re-parsing of inputs. No relationship-graph reconstruction. No file-scanning that bypasses the read model.

## ADRs that bind this package

- **PDR-001 (Session Workflow Commands)** — text output with `=== SECTION ===` markers (DD-1, not JSON); git integration opt-in via `--git` flag (DD-2); status → session inference (DD-3); three severity levels match Process Guard (DD-4); no `--date` flag (DD-5); positional + flag forms for scope type (DD-6); co-located formatter functions (DD-7).
- **ADR-006** — CLI must consume the `PatternGraph`, not raw scanner/extractor output. Not on the named stage-1 carve-out list.
- **ADR-009** — CLI uses `parseAndProject*` entrypoints for raw options.

## Review plan

1. **Phase 1 — three parallel agents (each loads the bootstrap):**
   - `code-reviewer` — argv parsing, error handling, exit codes, output discipline, fragment routing
   - `architect-review` — thin-composition-root discipline, ADR-009 trust-boundary usage, no business logic, no re-parse
   - `code-simplifier` — simplification opportunities (read-only)
2. **Phase 2 — consolidated final report** at `02-final-report.md`.

## Output files

- `.cleanup-review/architect-cli/00-scope.md` (this file)
- `.cleanup-review/architect-cli/01-cleanup-findings.md`
- `.cleanup-review/architect-cli/02-final-report.md`
- `.cleanup-review/architect-cli/state.json`
