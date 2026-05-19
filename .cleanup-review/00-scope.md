# Cleanup Review Suite — Scope

## Target

Five-package review of the `@libar-dev/architect-*` family in this monorepo.
Reviews run **sequentially in dependency order** so later packages benefit
from findings on the packages they depend on. Each per-package run launches
three parallel agents (code quality, architecture, simplification) inside
its own subdirectory; a final suite report consolidates cross-package themes.

## Packages and run order

| # | Package                              | TS files | Role |
| - | ------------------------------------ | -------- | ---- |
| 1 | `packages/architect-core/`           | 106      | PatternGraph composition, extractor, taxonomy, config |
| 2 | `packages/architect-projection/`     | 146      | Fragment / projection / renderer pipeline |
| 3 | `packages/architect-guard/`          | 38       | FSM process guard, bespoke linters, DoD validation |
| 4 | `packages/architect-cli/`            | 26       | CLI composition root (`architect:query`) |
| 5 | `packages/architect-mcp/`            | 9        | MCP server + file watcher (CLI verb twins) |

`packages/architect/` is bin-only (meta package) and is not separately reviewed.

## Output layout

```
.cleanup-review/
├── 00-scope.md                       # this file
├── state.json                        # suite state
├── architect-core/
│   ├── 00-scope.md                   # per-package scope
│   ├── 01-cleanup-findings.md        # consolidated 3-agent findings
│   ├── 02-final-report.md            # severity-grouped report
│   └── state.json
├── architect-projection/  …
├── architect-guard/       …
├── architect-cli/         …
├── architect-mcp/         …
└── 00-suite-final-report.md          # cross-package synthesis
```

## Flags

- Strict Mode: no

## Mandatory agent bootstrap

Every per-package agent prompt embeds this preamble verbatim so the
context model is identical across the suite:

> Before reviewing, load the `architect-base` and `architect-data-api`
> skills — mandatory context for understanding this codebase's
> conventions, taxonomy, FSM, value-transfer doctrine, and validation
> gates.
>
> CRITICAL: Use the Architect Data API (`pnpm architect:query <verb>`)
> to verify pattern state, dependencies, and architectural claims.
> Do NOT infer pattern status from file scanning. File scanning
> architect-scoped paths to learn pattern state is a smell — every
> "what's the status of X?" question has a verb on the CLI or MCP.

## Load-bearing ADRs every agent must respect

- **ADR-003** — Source-First Pattern Architecture (annotated TS + executable Gherkin are the source of truth; tier-1 specs ephemeral)
- **ADR-005** — Codec / Renderer Separation (pure codecs in, RenderableDocument IR, format-agnostic renderer)
- **ADR-006** — Single Read Model (no parallel pipelines; everything reads from `PatternGraph`)
- **ADR-007** — Coordinated Taxonomy Redesign (status / maturity / role unification; AcceptedStatusValue vs ProcessStatusValue type boundary)
- **ADR-009** — Projection Trust Boundary (`parseAndProject*` is the raw-input boundary; markdown content-safety contract; canonical public names)
- **PDR-001** — Session Workflow Commands (`scope-validate` + `handoff` design decisions; text output with `===` markers; status → session inference)

## Engineering doctrine the suite enforces

From `CLAUDE.md` / `AGENTS.md`:

- **No-BC**: no `@ts-ignore`, no `// eslint-disable*`, no `@deprecated` softening removal, no parallel-impl shims. Pre-1.0 — break and migrate, never alias.
- **Zod-first boundaries**: every cross-package contract and every CLI / MCP input is a `z.strictObject` schema. Parse once at the trust boundary; never re-parse internally on hot paths.
- **TS strictness**: `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`. No circular imports.
- **Perf regression gate**: `architect-projection` ships a 36-pattern / 108-rule fixture; latency drift over `baseline × 1.5` fails CI.

## Review plan (per package)

1. **Phase 1 — three parallel agents:**
   - `code-reviewer` → code quality, correctness, security, performance, reliability
   - `architect-review` → architectural integrity, boundary correctness, ADR conformance, dependency direction
   - `code-simplifier` → simplification opportunities (read-only; no edits)
2. **Phase 2 — consolidated final report** for that package (severity-grouped, file:line evidence, action plan).
3. After all five packages are reported, write `00-suite-final-report.md` synthesizing cross-cutting themes (no fresh agent runs).

## PatternGraph health snapshot

- 256 delivery patterns (116 completed, 121 active, 19 planned) = 45%.
- 14 candidate patterns excluded from delivery progress.
- 17 blocking edges across the graph (per `arch blocking`); notable: `PatternBundleProjection blocked by PatternRelationsFragmentContracts`, `OpenQuestionListProjection` similarly blocked, multiple Process Guard subgraph blockers.

These will be referenced by package-level reviews but are **not** themselves review targets.
