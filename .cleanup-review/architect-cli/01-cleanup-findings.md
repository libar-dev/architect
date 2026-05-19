# architect-cli — Phase 1 Consolidated Findings

Three parallel reviews complete. Detailed per-agent reports:

- Code quality: [`01a-code-quality.md`](./01a-code-quality.md) — 19 findings (3 Critical, 7 High, 7 Medium, 2 Low)
- Architecture: [`01b-architecture.md`](./01b-architecture.md) — 14 findings (1 Critical, 5 High, 6 Medium, 3 Low)
- Simplification: [`01c-simplification.md`](./01c-simplification.md) — 16 opportunities (6 High, 9 Medium, 6 Low)

## What the package gets right (verification baseline)

Independent positives that bound the scope of the criticisms below:

- **Thin composition root mandate is broadly honored.** The lint/validate bins are clean 5-LOC shims into `architect-guard`. `architect-guard/src/cli/validate-patterns.ts` hosts the 938-LOC business logic; the CLI counterpart is correctly thin. No layering inversion across packages.
- **No direct reach-throughs** into `architect-core/src/scanner/` or `src/extractor/`. ADR-006 stage-1 carve-out list is intact.
- **Zod-first / strict-TS / no-BC** discipline consistently applied in the main CLI router.
- **Output discipline** is mostly sound (PDR-001 DD-1 text-with-markers honored).
- **`--include` repeated-flag merge** has been fixed (data-api skill notes a stale quirk; no longer present).

The findings concentrate in three architecturally narrow surfaces: **`generate-docs.ts` is a parallel CLI implementation** that duplicates infrastructure; **re-parse / "stringify-a-string" boundary slips** at three sites; and **hand-rolled type-guards** in the same files where Zod schemas would be one import away.

## Cross-cutting themes

### T-CLI-1 — `generate-docs.ts` (662 LOC) is the package's outlier

It has its own argv parser, its own config loader (with `process.chdir` mutation — the exact anti-pattern just removed from MCP in commit `676a916`), its own filter parsers, its own version printer, its own error differentiation. Every duplication in this package traces back through `generate-docs.ts` at least once. ONE refactor — make it consume `_shared/` like every other command — collapses ~6 findings across all three agents.

### T-CLI-2 — Re-parse / stringify-a-string boundary slips

Three concrete sites where typed values are converted to/from text needlessly:

- Quality C1 — every argv goes through Zod twice (`pattern-graph-cli.ts:255` then `:266`).
- Architecture C1 / Quality H2 — `output.ts:44-51` does `JSON.parse(renderPrettyJson(bundle))` to splice a pre-rendered bundle into the envelope. Stringify-a-string.
- Architecture H5 — `documentation` command goes through `parseAndProjectDocumentationBundle` even though `disclosureLevel` is already typed at the flag-parser layer. ADR-009 violation by re-parse.

Plus three smaller cases of redundant `.parse(` on already-typed inputs (Quality M2, M3, L1).

### T-CLI-3 — Hand-rolled type-guards / whitelists instead of Zod

`generated-docs-manifest.ts` hand-rolls `is*` discriminators (Quality H3); `error-handler.ts` maintains a `knownTypes` whitelist that will silently degrade when core adds DocError variants (Quality H4 / Simplification H4); `isDocError`, `isReadonlyStringArray`, `isGeneratedDocsManifest` repeat the pattern. The Zod-first doctrine is in the room; these files don't know it.

### T-CLI-4 — Bin entries don't share a uniform composition shape

Four lint/validate bins (`lint-patterns.ts`, `lint-process.ts`, `lint-steps.ts`, `validate-patterns.ts`) use bare top-level `await` and bypass `handleCliError` (Quality C3). They have no `--help` / `--version` parity (Quality H6). The main CLI collapses errors to exit 1; `generate-docs.ts` already differentiates (Quality H5). One `binMain(handler)` wrapper exporting (parseArgv, runHandler, mapErrors, exitCode) unifies all 6 bins.

### T-CLI-5 — Argv parser triplication (echo of cross-package helper-duplication theme)

Simplification H1: three parallel argv parsers (`pattern-graph-cli.ts`, `generate-docs.ts`, `pattern-graph-cli-commands.ts`) reimplement the same loop. ~300 LOC dup. Same shape as projection's helper-duplication theme — pick one canonical implementation.

### T-CLI-6 — Infrastructure accreted in CLI that belongs upstream

Architecture H1: sha1/mtime file-cache layer lives in `pattern-graph-cli-runtime.ts:103-142`; belongs in `architect-core` next to `buildPatternGraph` so MCP gets it too. Architecture H4: source-plan / config-load logic exists in two parallel implementations with slightly different precedence rules. The structural reason `generate-docs.ts` parallels `pattern-graph-cli.ts` is that when infrastructure lives in the CLI layer, parallel CLIs need parallel infrastructure.

### T-CLI-7 — Silent fallthrough (cross-package echo of RC-CORE-1 / RC-GUARD-2)

Quality C2 — `pattern <Name>` silently falls through when the pattern is absent without a parse failure. The data-api skill explicitly calls out that "not found" can mean parse failure OR missing pattern; the CLI is the surface that should disambiguate, and it doesn't. Quality M6 (REPL `requireFirstPositional` swallows missing-positional) is the same shape.

### T-CLI-8 — REPL is structurally second-class

Quality H7 (printReplHelp lists 8 commands; dispatcher accepts 24); Quality M7 (REPL aborts on first thrown error); Architecture / Simplification L3 (`repl` listed without caveat in help). The REPL is referenced but not maintained at the same fidelity as scripted CLI invocations.
