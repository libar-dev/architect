# Cleanup Review — `@libar-dev/architect-cli`

## Review Target

`packages/architect-cli/src/**` — 26 TS files, ~3.85k LOC. The thin composition
root that wires `architect-core` + `architect-projection` + `architect-guard`
into 6 bins (`architect`, `architect-generate`, `architect-guard`,
`architect-lint-patterns`, `architect-lint-steps`, `architect-validate`).
Detailed agent reports:
[`01a-code-quality.md`](./01a-code-quality.md) · [`01b-architecture.md`](./01b-architecture.md) · [`01c-simplification.md`](./01c-simplification.md) · [`01-cleanup-findings.md`](./01-cleanup-findings.md).

## Executive summary

The 49 findings across the three agents reduce to **seven structural root
causes**, four of which are cross-package echoes (re-parse / stringify-a-string;
silent fallthrough; helper duplication; "convention without mechanism" for
Zod-first). Action plan is organised by root cause.

The package's **thin-composition-root mandate is broadly honored** — lint/validate
bins are 5-LOC shims, no reaches into `architect-core/src/scanner/` or
`src/extractor/`, ADR-006 carve-out list intact. The damage is concentrated in
one outlier file (`generate-docs.ts`, 662 LOC, its own argv parser + config
loader + filter parsers + version printer + `process.chdir` mutation) and in
three localized boundary slips where typed values get round-tripped through
serialisation.

Raw counts: **4 Critical · 12 High · 13 Medium · 5 Low** (quality + arch) +
**6 High · 9 Medium · 6 Low** simplification opportunities.

---

## What the package gets right (front-load)

- **Thin composition root** — lint/validate bins are clean 5-LOC shims. `architect-guard/src/cli/validate-patterns.ts` (938 LOC) hosts the actual logic; the CLI counterpart is correctly thin. The cross-package layering RC-GUARD-5 flags is *guard-side*, not CLI-side.
- **No ADR-006 carve-out violations** — no direct imports from `architect-core/src/scanner/` or `src/extractor/`.
- **Zod-first / strict-TS / no-BC discipline** consistently applied in the main router.
- **Output discipline** mostly sound (PDR-001 DD-1 honored — text with `=== SECTION ===` markers, JSON path separate).
- **The `--include` repeated-flag bug noted in the data-api skill is fixed**; the skill is stale.

---

## Root causes (the synthesis)

### RC-CLI-1 — `generate-docs.ts` (662 LOC) is a parallel CLI implementation

**Pattern.** A second CLI grew up next to `pattern-graph-cli.ts`. It has its own argv parser, its own config loader (with global-state mutation), its own filter parsers (duplicated verbatim), its own version printer, its own error differentiation, its own source-plan resolver. Every other duplication in the package traces back through this file at least once.

**Findings this explains.**
- Architecture H2 / Quality H1 — `process.chdir` global mutation in `generate-docs.ts:172-181`. **The same anti-pattern was already removed from MCP in commit `676a916`** — this one was missed in that pass.
- Architecture H3 — `parseDisclosureLevel` / `parseFilterValue` / `mergeProjectionFilter` duplicated verbatim between `generate-docs.ts:136-170` and `commands/read.ts:62-99`.
- Architecture H4 — Source-plan / config-load logic in two parallel implementations (`pattern-graph-cli-runtime.ts:34-81` vs `generate-docs.ts:183-213`) with slightly different precedence rules.
- Simplification H1 — Three parallel argv parsers reimplementing the same loop (~300 LOC dup); one of the three is `generate-docs.ts`.
- Simplification H2 — `parseFilterValue` + `mergeProjectionFilter` copy-pasted between `read.ts` and `generate-docs.ts`.
- Architecture L3 / Simplification — its own version printer.
- Architecture Low — its own help printer.

**ADR anchor.** ADR-006 (single read model), implicitly — the parallel `generate-docs.ts` source-plan resolver and config loader are a parallel pipeline of CLI infrastructure. Plus engineering doctrine ("no parallel implementations behind a flag").

**Structural fix.** Convert `generate-docs.ts` from a parallel CLI into a composition over `_shared/` and `pattern-graph-cli-runtime.ts`. Specifically:
1. Replace its argv parser with the shared parser registry (see RC-CLI-5).
2. Replace its config loader with `pattern-graph-cli-runtime.ts`'s loader; remove the `process.chdir` mutation.
3. Delete the duplicated filter parsers; import from `commands/_shared/`.
4. Delete its version / help printers; use the shared ones.
5. Adopt the same error-handler / exit-code mapping as the main CLI.

After this refactor, the package has one CLI shape with multiple entry points instead of two CLI shapes.

### RC-CLI-2 — Re-parse / "stringify-a-string" boundary slips

**Pattern.** ADR-009 + engineering doctrine: parse once at the trust boundary, trust typed values internally. Three concrete sites violate this in different shapes:

**Findings this explains.**
- Quality C1 — Argv goes through Zod **twice** at `pattern-graph-cli.ts:255` then `:266`. Two full validation passes per command.
- Architecture C1 / Quality H2 — `output.ts:44-51` does `JSON.parse(renderPrettyJson(bundle))` to splice a pre-rendered bundle into a JSON envelope. The exact "stringify-a-string" anti-pattern; correctness risk for any non-JSON-safe value the renderer emits.
- Architecture H5 — `documentation` command routes through `parseAndProjectDocumentationBundle` even though `disclosureLevel` is already typed at the flag-parser layer.
- Quality M2 — `PatternGraphSchema.parse` of an empty graph (defensive parse of an internally-produced typed value).
- Quality M3 — `CommandNameSchema.parse` after `isCommandName` already narrowed the type.
- Quality L1 — `parseArgs` defensive re-parse.

**ADR anchor.** ADR-009 §"Parse once at external projection boundaries" — `parseAndProject*` are the trust boundary; internal callers use typed `project*` helpers. The CLI is the *external* boundary; it should parse once and trust thereafter.

**Structural fix.**
1. Argv: parse once at `pattern-graph-cli.ts:255`; delete the second pass.
2. `output.ts`: write a `renderJsonEnvelope(envelope, alreadyRenderedBundle: object)` that takes the bundle as a typed object, not a string. Or — better — render the envelope directly without splicing.
3. `documentation` command: invoke the internal `project*` helper with the typed `disclosureLevel` instead of `parseAndProjectDocumentationBundle`. ADR-009 says exactly this.
4. Defensive `.parse(...)` on internal types: delete; trust the type system.

### RC-CLI-3 — Hand-rolled type-guards / whitelists where Zod schemas exist

**Pattern.** Several files maintain `is*` discriminator functions and `knownTypes` whitelists that duplicate (and will drift from) the Zod schemas already defined in `architect-core`. Zod-first doctrine, not mechanized.

**Findings this explains.**
- Quality H3 — `generated-docs-manifest.ts` hand-rolls `is*` type-guards.
- Quality H4 — `error-handler.ts:74-89` maintains a `knownTypes` whitelist; silently degrades when core adds `DocError` variants.
- Simplification H4 — same `knownTypes` array drifts from the `DocError` union.
- Simplification L4 — defensive `isReadonlyStringArray` on a typed field.
- Simplification L5 — hand-written `isGeneratedDocsManifest` instead of Zod.

**Structural fix.**
1. Replace every hand-rolled `is*` predicate with `Schema.safeParse(...).success` or with TS's typed discriminator.
2. ESLint rule scoped to `packages/architect-cli/src/**` banning custom `is*` predicates outside of `architect-core/src/validation-schemas/` — they MUST be a Zod schema.
3. Cross-package: this same pattern exists in `architect-core` (RC-CORE-2's z.object→z.strictObject sweep); bundle the lint rule with that work.

### RC-CLI-4 — Bin entries don't share a uniform composition shape

**Pattern.** Six bin entry points exist; four lint/validate bins skip the uniform error wrapper. The composition shape (parse argv → run handler → map errors → emit exit code) is implemented six different ways.

**Findings this explains.**
- Quality C3 — Four bin entries (`lint-patterns.ts`, `lint-process.ts`, `lint-steps.ts`, `validate-patterns.ts`) use bare top-level `await` and bypass `handleCliError`.
- Quality H5 — Main CLI collapses all errors to exit 1; `generate-docs.ts` already differentiates Zod parse failures → exit 2.
- Quality H6 — Lint/validate shims have no `--help` / `--version` parity with the rest of the family.

**Structural fix.** Single `binMain(handler)` wrapper exporting `(parseArgv, runHandler, mapErrors, exitCode)`. Every bin entry becomes 3-5 lines. Standardise exit codes:
- 0 = success
- 1 = generic failure
- 2 = invalid argv / Zod parse failure (already done in `generate-docs.ts`)
- 3 = validation BLOCKED (lint/validate)
- 4 = WARN with `--strict`

**Trade-off.** Standardising exit codes is a breaking CI change for anyone wrapping these bins externally. Pre-1.0; acceptable.

### RC-CLI-5 — Argv parser triplication (cross-package echo of helper-duplication theme)

**Pattern.** Three argv parsers exist in this package. Same root cause as projection's RC-PROJ-5 (helper duplication) — parallel implementations accumulate without a CI audit.

**Findings this explains.**
- Simplification H1 — Three parallel argv parsers reimplement the same loop (~300 LOC dup).
- Simplification H5 — Flag-table boilerplate (`{ kind: 'boolean', key: 'x' }` repeated ~30×) — needs a builder or camelCase-from-flag default.
- Simplification H6 — `output.ts`'s 4-tier defensive bundle-shape guards on internally-produced typed data.
- Simplification M (various) — repeated `requireFirstPositional`, repeated `validationErrors` rendering 3×.

**Structural fix.** Single parser registry under `commands/_shared/parser.ts`. Generates flag tables from a schema; auto-derives camelCase from kebab-case; produces typed `parsed` records that consumers don't need to cast. Goes hand-in-hand with RC-CLI-1 (generate-docs.ts adopts the shared parser).

### RC-CLI-6 — Infrastructure accreted in CLI that belongs upstream

**Pattern.** When infrastructure lives in the CLI layer, parallel CLIs (RC-CLI-1) need parallel infrastructure. The structural fix is to push the infrastructure up.

**Findings this explains.**
- Architecture H1 — Full sha1/mtime file-cache layer lives in `pattern-graph-cli-runtime.ts:103-142`; belongs next to `buildPatternGraph` in `architect-core` so MCP gets it too.
- Architecture H4 — Source-plan / config-load logic in two parallel implementations (already in RC-CLI-1; also a symptom of this root cause — the CLI hosts logic that's not CLI logic).

**Structural fix.** Lift the file-cache to `architect-core/src/generators/pipeline/` (next to `build-pipeline.ts`); expose via a stable interface. `architect-cli` and `architect-mcp` both consume it. Cross-package coordinated commit with the `architect-core` refactor.

### RC-CLI-7 — Silent fallthrough (cross-package echo of RC-CORE-1 / RC-GUARD-2)

**Pattern.** Same family as the silent-drop clusters in core (extraction) and guard (FSM perimeter). Different surface, same shape.

**Findings this explains.**
- Quality C2 — `pattern <Name>` silently falls through when the pattern is absent without a parse failure. The data-api skill explicitly notes this disambiguation gap (parse-failure vs truly-absent).
- Quality M6 — REPL `requireFirstPositional` swallows missing-positional.
- Quality M7 — REPL aborts on first thrown error (silent for the rest of the session).

**Structural fix.** `pattern <Name>` returns a discriminated result: `{ kind: 'found', pattern }` | `{ kind: 'parse-failure', provenance }` | `{ kind: 'not-found', suggestions }`. The CLI text-formatter renders all three distinctly. Workspace-shared diagnostic discipline (joint with RC-CORE-1 and RC-GUARD-2).

### RC-CLI-8 — REPL is structurally second-class

**Pattern.** The REPL is advertised but not maintained at the same fidelity as scripted CLI invocations.

**Findings this explains.**
- Quality H7 — `printReplHelp` lists 8 commands; dispatcher accepts 24.
- Quality M7 — REPL aborts on first thrown error.
- Architecture / Simplification L3 — `repl` listed without caveat.

**Structural fix.** Three options:
- **Promote** — autogenerate REPL help from the dispatcher registry; trap errors per-command, not per-session.
- **Demote** — mark `repl` as experimental in help output; remove from advertised verb list.
- **Delete** — no current downstream consumer uses it (verify via Studio).

Make the decision; the current half-maintained state is the worst position.

---

## Findings the synthesis does NOT explain (genuinely independent)

- **M1 (quality)** — `-f` global-flag asymmetry. Standalone UX cleanup.
- **M5 (quality)** — pattern-resolution UX inconsistency across siblings. Three different "pattern not found" UX shapes — partially captured by RC-CLI-7 but with its own UX surface.
- **L2 (quality)** — sync `fs.statSync` storm on cold-start. Perf; independent of RC-CLI-2.

---

## Recommended Action Plan (root-cause ordered)

| Order | Root cause | Fix | Findings collapsed |
| ----- | ---------- | --- | ------------------ |
| 1 | RC-CLI-1 | Refactor `generate-docs.ts` to consume `_shared/` | ~6 findings across 3 agents (H1-arch, H2-arch, H3-arch, H4-arch, L3-arch, H1-quality, H2-sim) |
| 2 | RC-CLI-2 | Single-parse argv + render-envelope-directly + invoke `project*` not `parseAndProject*` | C1-arch, C1-quality, H2-quality, H5-arch + 3 M/L re-parses |
| 3 | RC-CLI-4 | `binMain(handler)` wrapper + standardised exit codes | C3, H5, H6 |
| 4 | RC-CLI-3 | Replace hand-rolled type guards with Zod; ESLint rule | H3, H4, H4-sim, L4-sim, L5-sim |
| 5 | RC-CLI-5 | Parser registry; flag-table generator | H1-sim, H5-sim, H6-sim + M-cluster |
| 6 | RC-CLI-6 | Lift file-cache to `architect-core` (coordinated with core team) | H1-arch + unlocks MCP |
| 7 | RC-CLI-7 | Discriminated `pattern <Name>` result | C2, M6, M7-partial (workspace-shared with core/guard) |
| 8 | RC-CLI-8 | Decide REPL fate; act on the decision | H7, M7 |
| — | independent | `-f` asymmetry, statSync storm | individual |

Ordering rationale: 1 has to land first because it deletes the parallel CLI that hosts the other duplications. 2 is the next-largest correctness improvement. 3 + 4 + 5 are parallel mechanical refactors. 6 is cross-package coordination. 7 + 8 are smaller decisions.

## Verification Suggestions

- After RC-CLI-1: `pnpm architect:generate-docs --help` produces same output as before; `pnpm docs:all` round-trip identical; CWD-leak test (run `architect:generate-docs` from a subdir, assert `process.cwd()` unchanged after).
- After RC-CLI-2: `pnpm test` and `pnpm typecheck`; argv-double-parse benchmark (cold-start should improve).
- After RC-CLI-4: every bin tested for `--help`, `--version`, invalid-flag (exit 2), success (exit 0), validation-blocked (exit 3 for lint bins).
- After RC-CLI-7: regression test feeding `pattern <Name>` with (a) a real pattern, (b) a pattern that parses but is absent, (c) a pattern in a broken file. Three distinct output shapes.

## Review Metadata

- Phase 1 agents: `cleanup-review:code-reviewer`, `cleanup-review:architect-review`,
  `cleanup-review:code-simplifier` (parallel)
- Bootstrap: `architect-base` + `architect-data-api` loaded for every agent
- ADR anchors used: 006, 009, PDR-001
- Read-only review — no source modifications
- **Synthesis note**: organised by root cause. RC-CLI-2, RC-CLI-3, RC-CLI-5, RC-CLI-6, RC-CLI-7 are cross-package echoes of root causes already named in core / projection / guard — see suite final report for joint resolution.
