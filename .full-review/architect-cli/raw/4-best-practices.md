# architect-cli — Phase 4: Best Practices & Standards (combined TS/Zod 4 + CI/DevOps)

**Package:** `@libar-dev/architect-cli@2.0.0-pre.1`
**Path:** `/Users/darkomijic/dev-projects/architect/packages/architect-cli/`
**Size measured:** 26 `.ts` files / 3,870 SLOC src + `runtime-bridge.js` (24 LOC) + 6 bin shims (5 LOC each).
**Family role:** thin composition root; doctrine reference for CLI trust boundaries (12 `parseAtBoundary` call sites — most in the family).

## Executive summary

The cli's **language posture is the second-best in the family after projection** and the **best on CI/DevOps script discipline** (matches guard verbatim on `typecheck`-both-configs, beats it on `test` script — `pnpm build && vitest run` is functionally equivalent to guard's `typecheck && vitest run` and stricter than projection's). Phase 1 already covered the doctrine breach (C-CLI-1 — `generate-docs.ts:214-315` hand-rolled argv) and the duplication (C-CLI-2 — three filter-parsing functions in two files). Phase 4's additive findings are smaller in number than the other packages because **the package's Zod 4 surface is mostly already at family-reference quality**:

- **Zero `z.object` sites** — 13 `strictObject` sites (1 in `commands/_shared/schemas.ts:20` + 10 schemas chained `z.strictObject({...}).readonly()` in the same file + 2 in `pattern-graph-cli-types.ts:14,44`). The 28-site `z.object → z.strictObject` sweep core needs and the 1-site sweep guard needs has **no equivalent in cli**.
- **Zero `.extend()/.omit()/.pick()/.partial()/.required()` chains** — the family-wide Zod 4 strictness-loss bug (projection C-PROJ-1, core F4A-H-6) does **not** affect cli.
- **Zero `z.function()`** — the Zod-3-era idiom (core F4A-C-2) has no instance.
- **Zero `as unknown as`, `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`** in src (`grep` verified).
- **Zero unprefixed legacy `from 'fs'/'path'/'os'/...` imports** — all node-stdlib imports use the `node:` prefix (6 files, all clean — better than guard's CI-G-H-2 7-file inconsistency).
- **`Number.parseInt`** consistently used (`commands/_shared/schemas.ts:124`); no `parseInt`/`isNaN` outliers (core F4A-M-4 has no equivalent here).

The Phase 4 additive findings cluster in five Mediums and a few Lows; the Critical and High items are all Phase 1 reconfirmations plus one new CI/DevOps Critical (CL-CLI-1, sourcemap/declarationMap from base config — same family fix as CL-CORE-3). The single highest-leverage CLI-side win is the **C-CLI-1 fix** (Phase 1) which lands `generate-docs.ts` on the same `parseAtBoundary(...)` exit-pattern as `pattern-graph-cli.ts:160-178` and dissolves three duplicated filter helpers (C-CLI-2) in the same PR.

Two CI/DevOps findings cross-reference family work:

1. **`runtime-bridge.js`** (24 LOC) is the family's unique infrastructure for eager `dist/` existence-checking before any consumer hits a module-resolution error. Phase 1 said promote it to a workspace template; Phase 4 confirms and adds: **convert to `.ts`** (it's the only `.js` file in the package that holds production logic, currently un-type-checked and un-linted), and **fix the POSIX-only `new URL(...).pathname` bug at line 6** that breaks on Windows.
2. **`tests/support/run-cli.ts`** is a real subprocess harness against the build dir — structurally equivalent to guard's `packed-dangling-baseline-smoke.mjs` and projection's perf-gate comparator. **No wired-but-dormant `prepack` smoke test exists** (unlike guard, where Phase 3 TC-H-GUARD-7 and Phase 4 CI-G-C-1 found the file shipped but unwired). Cli has the test harness; what's missing is a packed-tarball smoke variant.

The package has **the disciplined `typecheck` posture** (`tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json`, `package.json:48`) — same family-best score guard has, beats core's CL-CORE-11 and projection's M-PROJ-CI-3.

## Findings by severity

### Critical (P0)

| ID | Source | Title | Location |
|----|--------|-------|----------|
| C-CLI-1 | Phase 1 | `architect-generate` argv parser bypasses `parseAtBoundary` — assembled `ParsedArgs` is hand-typed, not Zod-validated | `src/cli/generate-docs.ts:214-315`, return at `:303-314` |
| C-CLI-2 | Phase 1 | `--filter`/`--disclosure` parsing duplicated across two files (`generate-docs.ts:128-169` + `read.ts:62-99`) with drifted call paths | (cited) |
| C-CLI-3 | Phase 1 | H-CORE-5 (move `cli-schema.ts` to cli) supersedes to **delete** — `CLI_SCHEMA` has zero workspace consumers | `architect-core/src/config/cli-schema.ts` (no cli action) |
| **CL-CLI-1** | **4B (NEW)** | **`sourceMap: true, declarationMap: true` inherited from `tsconfig.base.json:13-15`** — produces 52 `.map` files (26 `.js.map` + 26 `.d.ts.map`) totaling 152 KB of dist (28% of 544 KB). Tarball: 112 files / 52.1 kB packed / 253.7 kB unpacked; map fraction proportional. **Same family fix as CL-CORE-3** — one-line change in `tsconfig.architect-base.json` halves cli's tarball file count to ~58 | `tsconfig.base.json:13-15` (family-wide) |

C-CLI-1 evidence reconfirmed via Phase 4 grep: `generate-docs.ts:303-314` returns a raw object literal typed by the hand-written `ParsedArgs` interface at `:41-52`. Six `if (next === undefined || next.startsWith('-'))` guards at `:249,257,265,273,285,292` — exactly the F4A-G-H-3 anti-pattern, in cli, at one site. **Land the fix using `pattern-graph-cli.ts:160-178` as the template** (assembled object → `parseAtBoundary(GenerateDocsArgsSchema, ...)` at exit).

### High (P1)

#### TS/Zod 4 (language/framework) — additive to Phase 1

| ID | Title | Location |
|----|-------|----------|
| F4A-CLI-H-1 | **Zero `.brand<>()` declarations across 26 files in cli** — family-wide gap (matches guard's F4A-G-H-2, projection's `M-PROJ-F-2 analogous`). Cli passes raw `string`s as filesystem paths, pattern names, and generator IDs throughout. Core owns 6 brands in `types/branded.ts` (`PatternId`, `SourceFilePath`, etc.); cli should consume them — particularly for `baseDir`, `input[]`, `features[]` in `pattern-graph-cli-types.ts:14-29` and `generate-docs.ts:41-52`. Pragmatically smaller benefit than in guard (cli is mostly pass-through, not a long-running service), but the gap is the same shape. | `src/cli/pattern-graph-cli-types.ts:14-29`, `generate-docs.ts:41-52` |
| F4A-CLI-H-2 | **2 `void main().catch(...)` async-call sites** — same hazard as guard F4A-G-H-5 and core F4A-H-9. The cross-family ESLint rule (`no-restricted-syntax` banning `ExpressionStatement > UnaryExpression[operator="void"]`) catches both in one move. Reconfirms Phase 1 H-CLI-Q-3. | `src/cli/pattern-graph-cli.ts:271`, `src/cli/generate-docs.ts:669` |
| F4A-CLI-H-3 | **10 `as { readonly ... }` flag-narrowing casts in command `execute()` bodies + 3 in shared helpers** — the per-command `flags: z.strictObject({...})` schemas at `commands/_shared/schemas.ts` already encode the exact shape, but `CommandDef.flags: z.ZodType<Readonly<Record<string, unknown>>>` (`pattern-graph-cli-commands.ts:78`) erases the per-command type. Recipe: make `CommandDef` generic over the flag schema: `CommandDef<F extends z.ZodType>` with `flags: F` and `execute: (ctx, parsed: { flags: z.infer<F>, ... }) => ...`; the 10+3 casts disappear. Reconfirms H-CLI-Q-1 + M-CLI-11 with a Phase 4-shaped recipe. | `commands/meta.ts:63,72,103`; `commands/read.ts:159,226,284,326`; `commands/reporting.ts:76,110,145`; `commands/_shared/handoff.ts:21`; `commands/_shared/projection-options.ts:11,53` |
| F4A-CLI-H-4 | **`runtime-bridge.js` is a `.js` file holding production logic, un-typechecked and un-linted.** Imports `node:fs`, `node:path`, `node:url`; exports `runArchitectCliEntrypoint`. Lives outside `src/` so `tsconfig.json:23 "include": ["src/**/*"]` excludes it; eslint config at `eslint.config.mjs:6` is `files: ['src/**/*.ts', 'tests/**/*.ts']`. **Convert to `runtime-bridge.ts` under `src/`, compile to `dist/runtime-bridge.js`, update `package.json#files` and the 6 bin shims.** Companion fix to F4A-CLI-H-5. | `runtime-bridge.js`, `package.json:67-71` |
| F4A-CLI-H-5 | **`runtime-bridge.js:6 new URL(import.meta.url).pathname` is POSIX-only.** On Windows the URL path is `/C:/path/...`; `path.dirname('/C:/...')` returns `/C:` (not normalized). Affects every bin invocation on Windows. Companion to Phase 1 M-CLI-4. **Recipe:** `path.dirname(fileURLToPath(import.meta.url))`. Single-line fix; the test harness `tests/support/run-cli.ts:5` already uses `fileURLToPath` correctly and is the in-repo template. | `runtime-bridge.js:6` |

#### CI/DevOps — additive to Phase 1

| ID | Title | Action |
|----|-------|--------|
| CL-CLI-H-1 | **No `prepack`/`prepublishOnly` smoke test exists** despite the test harness shape being ready (`tests/support/run-cli.ts` spawns each bin as a subprocess and captures stdout/stderr/exit-code). Guard has `scripts/packed-dangling-baseline-smoke.mjs` *implemented + unwired* (CI-G-C-1); projection has `tests/perf/compare-baseline.mjs` *implemented + unwired* (Cleanup-C-PROJ-1). **Cli has neither implemented nor wired.** Recipe: add `scripts/packed-cli-smoke.mjs` that runs `npm pack --pack-destination=$TMPDIR`, untars, and invokes each of the 6 bins with `--version` — would catch `runtime-bridge.js` missing from `package.json#files`, missing `dist/` files, shebang corruption, and `chmod +x` regressions. Wire into `prepack` after `pnpm clean && pnpm build`. | `scripts/packed-cli-smoke.mjs` (new); `package.json:52` |
| CL-CLI-H-2 | **`vitest.config.ts:11 root: path.resolve(__dirname)`** uses `__dirname` — undefined in pure ESM. Vitest tolerates this because it pre-processes the file with esbuild, but it's a latent foot-gun that would surface on a vitest major upgrade or a different runner. Sweep with `import.meta.dirname` (Node 20.11+) or `path.dirname(fileURLToPath(import.meta.url))`. | `vitest.config.ts:1,11` |
| CL-CLI-H-3 | **`tests/.DS_Store` + `src/.DS_Store` tracked in working tree** — Phase 1 L-CLI-6 noted `tests/features/.DS_Store`; Phase 4 confirms src/.DS_Store too (`find` output). Mac hygiene defect. Recipe: add `**/.DS_Store` to repo `.gitignore` if not present; `git rm --cached` the existing entries. | `src/.DS_Store`, `tests/.DS_Store`, `tests/features/.DS_Store` |
| CL-CLI-H-4 | **`runtime-bridge.js` is shipped as a `.js` file** at the package root, listed in `package.json#files: ["bin", "dist", "runtime-bridge.js"]`. The 6 bin shims `import { runArchitectCliEntrypoint } from '../runtime-bridge.js'`. This is the *only* shipped `.js` artifact outside `dist/`. Phase 1 said "promote to workspace template"; Phase 4 says **first**: type it as `.ts`, then promote. Bundles with F4A-CLI-H-4. | `runtime-bridge.js`, `package.json:70`, 6 files in `bin/` |

### Medium (P2)

| ID | Source | Issue | Location |
|----|--------|-------|----------|
| M-CLI-1 | Phase 1 | `error-handler.ts` `knownTypes` string array duplicates the `DocError` discriminator set core owns | `error-handler.ts:74-87` |
| M-CLI-2 | Phase 1 | `pattern-graph-cli-runtime.ts` two near-identical config-resolution paths | `pattern-graph-cli-runtime.ts:33-80, 153-173` |
| M-CLI-3 | Phase 1 | 4 guard bin shims bypass `runtime-bridge.js` — they import directly from `@libar-dev/architect-guard` | `src/cli/lint-*.ts`, `validate-patterns.ts` |
| M-CLI-4 | Phase 1 | `generated-docs-manifest.ts` hand-written `isGeneratedDocsManifest`/`isGeneratorManifest`/`isManifestEntry` triple (35 LOC) — same anti-pattern as core's `isProjectConfig` (C-CORE-4). Recipe: `z.strictObject` + `z.infer` (4 lines) | `generated-docs-manifest.ts:157-191` |
| M-CLI-5 | Phase 1 | Three exit-code strategies (`process.exit(1)`, `process.exit(2 if BoundaryParseError else 1)`, `process.exitCode = 1`) | `error-handler.ts:231`, `pattern-graph-cli.ts:236,273`, `generate-docs.ts:671`, `commands/_shared/structured.ts:227`, `version.ts:56` |
| M-CLI-6 | Phase 1 | Two `console.error` vs `process.stderr.write` paths (`error-handler.ts:219,222,224,228` vs everywhere else) | (cited) |
| F4A-CLI-M-1 | 4A (NEW) | **`SourcePlan`/`CliContext` are hand-written interfaces** at `pattern-graph-cli-types.ts:33-41, 52-60` while sibling `ParsedArgsSchema`/`CacheRecordSchema` are `z.strictObject`. Schemas inflow nothing structured (these are runtime composition types holding live function references via `api: PatternGraphAPI`), so `z.custom<CliContext>((v) => isCliContext(v))` is the only Zod option. Acceptable as-is given the type carries a function; matches projection's H-PROJ-F-2 analysis | `pattern-graph-cli-types.ts:33-41, 52-60` |
| F4A-CLI-M-2 | 4A (NEW) | **`Set.has` narrowing — cli has zero affected sites.** All `Set` usage is `Set<string>` (`runtime-helpers.ts:72`, `generate-docs.ts:602,661`, `generated-docs-manifest.ts:126`, `commands/meta.ts:76`) where narrowing is identity. The projection M-PROJ-F-4 family-wide gap does **not** affect cli — preserve | (none) |
| F4A-CLI-M-3 | 4A (NEW) | **`parseSchemaValue` at `commands/_shared/schemas.ts:115-121` swallows the underlying Zod cause** (Phase 1 H-CLI-Q-7). Recipe: drop the inner `try/catch`; let `parseAtBoundary` throw `BoundaryParseError` and let callers re-wrap. This preserves the `BoundaryParseError.cause: ZodError` chain that `pattern-graph-cli-commands.ts:185-191` already knows how to format via `formatZodError` | `commands/_shared/schemas.ts:115-121` |
| F4A-CLI-M-4 | 4A (NEW) | **`COMMANDS` registry composed via spread (`{ ...reportingCommands, ...planningCommands, ...readCommands, ...metaCommands, ...lifecycleCommands }`)** with no disjointness assertion at module init (Phase 1 M-CLI-12). Recipe: assert `Object.keys(COMMANDS).length === COMMAND_NAMES.length` at module load — single-line catch for accidental key collisions across modules | `pattern-graph-cli-commands.ts:97-103` |
| F4A-CLI-M-5 | 4A (NEW) | **`CommandDef.flags: z.ZodType<Readonly<Record<string, unknown>>>` is the root cause of F4A-CLI-H-3.** The 10+3 `as { readonly ... }` casts are a symptom of this typing erasure. Generic `CommandDef<F>` is the structural fix; the casts disappear without per-site changes | `pattern-graph-cli-commands.ts:75-92` |
| F4A-CLI-M-6 | 4A (NEW) | **`pattern-graph-cli-runtime.ts:132 CacheRecordSchema.parse(...)` not via `parseAtBoundary`** (Phase 1 L-CLI-8). Local cache file is package-owned so trust-boundary doctrine technically doesn't apply, but every other parse in cli goes through `parseAtBoundary`. Consistency win. Recipe: `parseAtBoundary(CacheRecordSchema, JSON.parse(...), 'cli cache')` inside the existing `try/catch` | `pattern-graph-cli-runtime.ts:132` |
| CI-CLI-M-1 | 4B (NEW) | **`vitest.include: ['tests/**/*.steps.ts']`** vs projection's `tests/features/**` vs core's `tests/steps/**`. Same family-wide normalization opportunity as guard CI-G-H-3. Cli's include pattern is **closest to the structural truth** (steps live in `tests/steps/cli/*.steps.ts`); could become the family default | `vitest.config.ts:7` |
| CI-CLI-M-2 | 4B (NEW) | **No `scripts/` directory at all.** Projection has 2 audit scripts (`options-schema-barrel-audit.mjs`, `jsdoc-boilerplate-audit.mjs`); guard has 2 (`copy-dangling-baseline.mjs`, `packed-dangling-baseline-smoke.mjs`). Cli has none. The audit-script family-wide promotion (CI-PROJ-4) would land `jsdoc-boilerplate-audit.mjs` in cli — it currently has 4 of 26 files annotated with `@architect-pattern` (Phase 1 M-CLI-2 — lowest in family, 15%), so the audit needs the `--skip-unannotated` flag projection's CI-PROJ-4 already proposed | `packages/architect-cli/scripts/` (missing) |
| CI-CLI-M-3 | 4B (NEW) | **`engines.node: ">=20.0.0"`** correct and aligned with all siblings. `.node-version` pins 22 at repo root. No CI matrix to enforce (family-wide gap CI-1). Action lives in the family-wide CI workflow, not cli | `package.json:72-74` |
| CI-CLI-M-4 | 4B (NEW) | **`publishConfig.provenance: true`** declared (`package.json:18`) without a publish workflow to issue the attestation — same family blocker as core CI-2. Resolved family-wide when publish workflow lands | `package.json:18` |

### Low (P3)

| ID | Source | Issue | Location |
|----|--------|-------|----------|
| L-CLI-1 | Phase 1 | `version.ts:42` fallback returns `'architect'` (meta package) when read fails — cosmetic | `version.ts:42-47` |
| L-CLI-2 | Phase 1 | `pattern-graph-cli-commands.ts:16-41 COMMAND_NAMES` order inconsistency (`help`/`version` at end, `repl` before) | (cited) |
| L-CLI-3 | Phase 1 | `tests/support/run-cli.ts:31` argv split misparses quoted arguments | (cited) |
| F4A-CLI-L-1 | 4A (NEW) | `import type` discipline reference-quality across cli — preserve | (whole package) |
| F4A-CLI-L-2 | 4A (NEW) | 4 `satisfies Pick<Record<CommandName, CommandDef>, ...>` sites (`lifecycle.ts:46`, `meta.ts:141`, `planning.ts:121`, `read.ts:401`, `reporting.ts:166`) — Phase 1 L-CLI-2 noted; same TS 5 idiom as core's `as const satisfies` template; preserve. Could be deduplicated via a generic `CommandModule<K>` helper, but the literal narrowing currently works as intended | command modules |
| F4A-CLI-L-3 | 4A (NEW) | **Zero `z.coerce.number()`** — cli routes `--depth` and `getPatternsByPhase` integer through `Number.parseInt(value, 10) → z.number().int()` via `parseIntegerValue` (`commands/_shared/schemas.ts:123-125`). The `z.coerce.number()` Zod 4 idiom would collapse this to one schema call but `Number.parseInt(value, 10)` is arguably stricter (rejects `'1.5'` cleanly, where `z.coerce.number()` would accept it). Acceptable as-is | `commands/_shared/schemas.ts:123-125` |
| CI-CLI-L-1 | 4B (NEW) | **`package.json#bin` and `package.json#exports` agreement** verified — all 6 bins declared in both blocks; `./bin/<name>` subpath exports resolve to the same files. No drift, no orphans | `package.json:25-45` |
| CI-CLI-L-2 | 4B (NEW) | **6 bin files have correct `#!/usr/bin/env node` shebang + `chmod +x` permissions** (`-rwxr-xr-x@`, verified via `ls -la bin/`). Cross-platform note: shebang ignored on Windows; pnpm/npm generate `.cmd` shims at install time — this works correctly because `package.json#bin` is the source of truth | `bin/*.js` |
| CI-CLI-L-3 | 4B (NEW) | **`prepack: pnpm clean && pnpm build`** correct placement under `scripts` (not at JSON root like core's CL-CORE-1). Aligned with guard/projection/mcp | `package.json:52` |

## Zod 4 audit summary (cli-side)

| Site | API | Verdict |
|------|-----|---------|
| `pattern-graph-cli-types.ts:13-29 ParsedArgsSchema` | `z.strictObject({...}).readonly()` | **Correct** — family-reference quality for argv boundary |
| `pattern-graph-cli-types.ts:43-48 CacheRecordSchema` | `z.strictObject({...}).readonly()` | **Correct** |
| `commands/_shared/schemas.ts:20-113` (10 schemas) | All `z.strictObject({...}).readonly()` | **Correct** — reference recipe for per-command flag schemas |
| `commands/_shared/schemas.ts:115-121 parseSchemaValue` | `try { parseAtBoundary(...) } catch { throw new Error(errorMessage) }` | **Drift** — F4A-CLI-M-3 — swallows `BoundaryParseError.cause` |
| `pattern-graph-cli-commands.ts:113-198 parseCommandInput` | 2 `parseAtBoundary` calls; preserves `BoundaryParseError.cause` for flags | **Reference quality** — recipe for guard's C-GUARD-4 and core's TD-CORE-1 adoption |
| `generate-docs.ts:214-315 parseArgs` | Hand-rolled; assembled object **not** schema-validated | **Drift (Critical, C-CLI-1)** — fix uses `pattern-graph-cli.ts:160-178` as template |
| `pattern-graph-cli.ts:160-178 parseArgs exit` | `parseAtBoundary(ParsedArgsSchema, ...)` | **Reference quality** — the template C-CLI-1 should adopt |
| 12 `parseAtBoundary` call sites | Across 4 files | **Most adoption in family** — preserve and promote |
| Zero `z.object` | — | **Correct** — no strict-sweep needed |
| Zero `.extend()/.omit()/.pick()/.partial()/.required()` | — | **Correct** — does NOT expose to family-wide Zod 4 strictness-loss bug |
| Zero `z.function()` | — | **Correct** — no Zod-3 idiom |
| Zero `.brand<>()` | — | **Gap** — F4A-CLI-H-1, family-wide (matches guard F4A-G-H-2) |
| Zero `z.coerce.number()` | — | **Acceptable** — `Number.parseInt(v, 10) → z.number().int()` is stricter |

## TS strictness audit (cli-side)

| Issue type | Count | Where |
|------------|-------|-------|
| `noPropertyAccessFromIndexSignature` defeated | **0** | |
| `noUncheckedIndexedAccess` evaded | **0** | |
| `Record<string, unknown>` builders | 1 (rawFlags in `parseCommandInput`) | `pattern-graph-cli-commands.ts:115` — required by the dispatcher generic signature; cured by F4A-CLI-H-3 / F4A-CLI-M-5 (`CommandDef<F>` generic) |
| Strictness lies (cast after type-guard rejected) | **0** | Cli does not consume core's C-CORE-5 `validateTransition` cast site |
| `as { readonly ... }` flag-narrowing casts | **13 sites** | F4A-CLI-H-3 — cured by `CommandDef<F>` generic |
| `as keyof typeof` after `Set.has` | **0** | All `Set` usage is `Set<string>` — narrowing is identity |
| `as unknown as X` | **0** | |
| `any` | **0** | |
| `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | **0 in src** | |
| `void X` expression statements | **2** | `pattern-graph-cli.ts:271`, `generate-docs.ts:669` — F4A-CLI-H-2 |
| `parseInt` / `isNaN` | **0** | `Number.parseInt` used consistently |
| `console.*` | **6 sites** | `error-handler.ts:56,104,219,222,224,228` — 4 production-path (M-CLI-6) + 2 in JSDoc `@example` |
| Unprefixed `from 'fs'/'path'/...` | **0** | All `node:` prefix — beats guard CI-G-H-2 |

## CI/DevOps audit summary

| Concern | Status |
|---------|--------|
| `prepack` placement | **Correct** (`scripts.prepack`, not JSON root — unlike core's CL-CORE-1) |
| `prepack` command | `pnpm clean && pnpm build` — aligned with guard/projection/mcp |
| `typecheck` scope | **Family-best** (covers both `tsconfig.json` and `tsconfig.test.json`) — same as guard, beats core CL-CORE-11 and projection M-PROJ-CI-3 |
| `lint` glob | `eslint src tests` — aligned with guard/projection (beats core CL-CORE-10) |
| `test` script | `pnpm build && vitest run --config vitest.config.ts` — functionally guards types (build runs `tsc -b`); slightly different shape from guard's `typecheck && vitest run`, equivalent posture |
| `eslint` in devDependencies | Explicit (`devDependencies` `eslint: ^9.17.0`) — aligned |
| `package.json#exports` | **Curated** — 7 entries: `.`, 6 bin subpaths, `./package.json`. All resolve to real artifacts (verified via `find dist`) — beats core's broken `./roles` (CL-CORE-2) |
| `package.json#bin` | 6 entries, all present + executable (`-rwxr-xr-x@`) + correct shebang |
| `package.json#files` | `["bin", "dist", "runtime-bridge.js"]` — tight, no glob bloat |
| `publishConfig.provenance: true` | Declared, unimplemented (family blocker, see core CI-2) |
| `engines.node: ">=20.0.0"` | Correct, aligned, unenforced (no CI matrix — family gap CI-1) |
| Custom build script | None — `tsc -b` only. No need (no resource-file copy like guard's `copy-dangling-baseline.mjs`) |
| Custom audit/smoke scripts | **None** — see CI-CLI-M-2 (no audit scripts) and CL-CLI-H-1 (no pack-smoke) |
| Tarball | **52.1 kB packed / 253.7 kB unpacked / 112 files**. Map files: 26 `.js.map` + 26 `.d.ts.map` = 52 of 112 files (46%, by file count). Map bytes: 152 KB of 544 KB dist (28% by bytes). CL-CLI-1 fix halves the file count. |
| Module-load side effects | **None** (`"sideEffects": false`, verified — no module-load IIFE chains like core's `self-hosting.ts`) |
| CI workflows | **None at repo level** — family gap (core CI-1) |
| `runtime-bridge.js` | Unique infrastructure; **un-typechecked, un-linted, POSIX-only `.pathname` bug** — see F4A-CLI-H-4 + F4A-CLI-H-5 |
| `tests/support/run-cli.ts` | Real-subprocess harness against build dir; **pack-smoke equivalent missing** (CL-CLI-H-1) |

## Family-wide implications

1. **C-CLI-1 fix lands the doctrine-aligned argv shape across cli's two main bins.** After the fix, `parseAtBoundary` adoption in cli is 13 sites across 4 files — the recipe guard's C-GUARD-4 and core's TD-CORE-1 need to adopt. Master report should call out cli's `pattern-graph-cli-commands.ts:113-198 parseCommandInput` (preserves `BoundaryParseError.cause` for flags via `formatZodError`) as **the family reference for `parseAtBoundary` consumption with structured error fidelity**.

2. **Cli has zero `.extend()/.omit()/.pick()/.partial()/.required()` chains.** This is the second package in the family (after guard) confirmed clean against projection's C-PROJ-1 / core's F4A-H-6 / projection's CP4A-Sharpened-1. Pattern preserved across cli's small but disciplined Zod surface.

3. **The `runtime-bridge.js` infrastructure is unique in the family.** Phase 1 said promote to workspace template; Phase 4 sharpens: **convert to TypeScript first** (F4A-CLI-H-4), **then promote**. The conversion has zero Zod content — it's pure `node:fs`/`node:path` orchestration with one POSIX bug to fix (F4A-CLI-H-5). After conversion, every publishable package's bin entrypoint can adopt the eager `dist/` existence-check via a shared `architect-cli/runtime-bridge` import or a workspace-level template. Comparable to guard's `packed-dangling-baseline-smoke.mjs` workspace-promotion proposal (CI-G-H-4).

4. **CL-CLI-1 / CL-CORE-3 / CI-G-H-6 / M-PROJ-CI-1 collapse into one family-wide PR.** Disable `sourceMap` and `declarationMap` in `tsconfig.architect-base.json`. Cli tarball halves; same for every sibling. Re-measure after Phase 2 sweeps land.

5. **F4A-CLI-H-1 reconfirms F4A-G-H-2 as a family-wide `.brand<>()` adoption gap.** Cli has zero brands; guard has zero; projection has zero; mcp unknown (await Phase 4). Core owns 6 brands in `types/branded.ts`. Cli should consume `SourceFilePath` for `baseDir`/`input[]`/`features[]` rather than treating them as raw `string`s — the brand constructor already normalizes path separators (per core F4A-H-8 recipe). One PR family-wide.

6. **F4A-CLI-H-2 reconfirms F4A-G-H-5 / core F4A-H-9.** The `no-restricted-syntax` ESLint rule banning `ExpressionStatement > UnaryExpression[operator="void"]` should land in the root `eslint.config.mjs` — catches 2 cli sites + 3 core sites + 3 guard sites in one move.

7. **CI-CLI-M-1 fixes vitest include divergence.** Cli's `tests/**/*.steps.ts` pattern (matches the actual file structure) is the cleanest of the three competing conventions (`tests/steps/**` in core, `tests/features/**` in projection). Master report should propose it as the family default.

8. **CL-CLI-H-1 (pack-smoke for cli) complements guard's CI-G-H-4 workspace promotion.** A workspace-level `scripts/pack-smoke.mjs` that:
   - Runs `npm pack --dry-run --json` per package and verifies `files` includes all `exports` subpaths.
   - For each `bin`, untars the packed tarball, sets executable bit, and runs `bin --version`.
   - Validates `dist/` artifacts exist for every `exports` import path.

   Catches: core's broken `./roles` (CL-CORE-2), guard's missing `tier-a-baseline.json` (Phase 3 TC-H-GUARD-7), cli's `runtime-bridge.js` if accidentally dropped from `files`, mcp's bin if `chmod +x` regresses.

9. **C-CLI-3 (`cli-schema.ts` should be deleted from core, not moved to cli) reconfirmed.** Phase 4 grep across all packages: `CLI_SCHEMA`/`showHelp`/`CliReferenceGenerator` produce no callers — the dead-code recommendation stands. Master report should fold core's H-CORE-5 / M-CORE-3 into the deletion sweep.

## What's family-reference quality (preserve)

1. **`commands/_shared/schemas.ts`** — 10 `z.strictObject({...}).readonly()` schemas chained off reused core/projection enums (`SessionTypeSchema`, `RenderFormatSchema`, `ScopeTypeSchema`, `AcceptedStatusSchema`, `BundleIncludeSchema`, `BundleModeSchema`). The recipe for the CLI flag-schema layer that guard's F4A-G-H-3 fix should adopt verbatim.

2. **`pattern-graph-cli-commands.ts:113-198 parseCommandInput`** — `parseAtBoundary` for positional, `parseAtBoundary` for flags, `BoundaryParseError.cause` preserved through `formatZodError`. The family reference for `parseAtBoundary` consumption with structured error fidelity. Core's TD-CORE-1 wants this; guard's C-GUARD-4 needs this.

3. **`pattern-graph-cli.ts:160-178`** — exit-pattern for the `architect` bin: assembled args object → `parseAtBoundary(ParsedArgsSchema, ..., 'Failed to parse CLI arguments')`. The template C-CLI-1's `generate-docs.ts` fix should replicate.

4. **`runtime-bridge.js`** (post F4A-CLI-H-4 / H-5 fix) — eager `fs.existsSync('dist')` check before any consumer hits a module-resolution error. After conversion to `.ts` + Windows fix, **promote to workspace template** (Phase 1 cross-package implication #12).

5. **`tests/support/run-cli.ts`** — real-subprocess CLI test harness using `node:child_process.execFile` against the local build dir. Family-reference shape for end-to-end CLI verification. The cross-package implication is: every publishable package's `bin` set should have a sibling subprocess harness for at least `--version` / `--help` / one happy-path invocation per bin.

6. **`typecheck` script covering both `tsconfig.json` and `tsconfig.test.json`** (`package.json:48`) — same family-best discipline guard has, beats core/projection.

7. **`lint` script covering `src tests`** (`package.json:49`) — beats core's CL-CORE-10 gap.

8. **`prepack` correctly placed under `scripts`** (`package.json:52`) — beats core's CL-CORE-1 misplacement.

9. **`package.json#exports` agreement with `#bin`** — all 6 bins in both blocks resolve to the same files, no drift. Reference for mcp and the meta package.

10. **Zero unprefixed legacy `from 'fs'` imports** — beats guard's CI-G-H-2 7-file inconsistency. Preserve.

11. **`Number.parseInt(value, 10)`** consistently used over global `parseInt` — beats core's F4A-M-4 5-site sweep need.

12. **13 `strictObject` sites + 12 `parseAtBoundary` sites + zero `.extend/.omit/.pick/.partial/.required` chains** — the canonical Zod 4 surface shape for a CLI composition root.

## Recommended landing order (Phase 4 angle)

1. **C-CLI-1** (Phase 1) — `generate-docs.ts:214-315` rewrite using `pattern-graph-cli.ts:160-178` template. Dissolves C-CLI-2 (filter-parser duplication) in the same PR. **Doctrine fix.**
2. **CL-CLI-1 + CL-CORE-3 + CI-G-H-6 + M-PROJ-CI-1** (1 line in `tsconfig.architect-base.json`) — disable `sourceMap` / `declarationMap`. Family-wide. Cli tarball file count halves.
3. **F4A-CLI-H-4 + F4A-CLI-H-5 + CL-CLI-H-4** — convert `runtime-bridge.js` → `runtime-bridge.ts` under `src/`; fix `new URL(...).pathname` Windows bug; rewire bin shims to `dist/runtime-bridge.js`; remove the loose root-level `runtime-bridge.js` from `package.json#files`. **Promote to workspace template after.**
4. **F4A-CLI-H-3 + F4A-CLI-M-5** — `CommandDef<F>` generic over flag schema; 10+3 `as { readonly ... }` casts disappear without per-site changes. Cures Phase 1 H-CLI-Q-1 + M-CLI-11 at the root.
5. **F4A-CLI-H-2 + F4A-G-H-5 + core F4A-H-9** — add `no-restricted-syntax` ESLint rule banning `ExpressionStatement > UnaryExpression[operator="void"]` in root `eslint.config.mjs`. Catches 2 cli + 3 core + 3 guard sites in one PR.
6. **F4A-CLI-M-3** — drop `parseSchemaValue`'s inner try/catch; preserve `BoundaryParseError.cause`. Single-line fix. Improves CLI debug output for downstream consumers.
7. **F4A-CLI-M-4** — disjointness assertion on `COMMANDS` registry composition. Single-line. Catches accidental key collisions across the 5 module records.
8. **M-CLI-4** — `generated-docs-manifest.ts` Zod-first sweep (hand-written validators → `z.strictObject` + `z.infer`). 30 LOC → ~4 LOC. Bundles with core's C-CORE-4 recipe.
9. **M-CLI-1** — `error-handler.ts knownTypes` array → import from core's `DocError` discriminator (after core exposes it).
10. **F4A-CLI-H-1** (family-wide with F4A-G-H-2) — adopt core's brands in cli for `SourceFilePath` on `baseDir`/`input[]`/`features[]`. Lower priority than guard's git/ brand adoption.
11. **CL-CLI-H-1** — add `scripts/packed-cli-smoke.mjs` (real bin-subprocess invocation against the packed tarball) wired into `prepack`. Pairs with guard's CI-G-C-1 wire-up; promote both to workspace-level `scripts/pack-smoke.mjs` (CI-G-H-4) once both exist.
12. **CI-CLI-M-1 + CI-G-H-3** — vitest include normalization, family-wide PR. Cli's `tests/**/*.steps.ts` is the proposed default.
13. **CL-CLI-H-2** — `vitest.config.ts: __dirname → import.meta.dirname` sweep.
14. **CL-CLI-H-3** — `.DS_Store` hygiene (`.gitignore` + `git rm --cached`).
15. **F4A-CLI-M-6** — `pattern-graph-cli-runtime.ts:132` cache read via `parseAtBoundary` for consistency.
16. **CI-1 + CI-2 (family)** — add `.github/workflows/{ci,publish}.yml`. Cli's `test` + `typecheck` scripts are the second-most disciplined template (after projection's `barrel-audit && jsdoc-boilerplate-audit && typecheck && vitest`).

## Critical context for Phase 5

1. **Cli's *doctrine application* is uneven across its two main bins.** `pattern-graph-cli.ts` (the `architect` bin) is family-reference quality; `generate-docs.ts` (the `architect-generate` bin) is the single doctrine breach (C-CLI-1). The cli's posture flips from "best-in-family" to "anti-pattern" by file. The fix is mechanical (replicate the working sibling) and surfaces nowhere else.

2. **The package is operationally sound where it matters externally** (`prepack`, `exports`, `bin` agreement, executable shebangs, `node:` prefix, `files` allowlist tight, no module-load side effects) and uneven on infrastructure that isn't externally visible (`runtime-bridge.js` un-typechecked, 13 `as` casts in flag-narrowing, 2 `void main()` patterns). Phase 4 wins are mostly internal hygiene; Phase 4 doesn't surface a publication blocker beyond the family-wide CL-CORE-3 sourcemap issue.

3. **Cli has the structural ingredients for both a pack-smoke test and a workspace-promotable bin-bridge template, but neither has been productized.** `tests/support/run-cli.ts` is the subprocess harness; `runtime-bridge.js` is the eager-existence resolver; `package.json#exports + #bin` agreement is the discipline. Combining these into a workspace-level `scripts/pack-smoke.mjs` is the highest-leverage CI/DevOps win for the family — catches core's `./roles` (CL-CORE-2), guard's `tier-a-baseline` resource regressions (TC-H-GUARD-7), and the kind of "did anyone build first?" errors that `runtime-bridge.js` already protects against at runtime.

4. **Cli is the family's CLI doctrine reference, but the package's own help system (`commands/_shared/help.ts`) supersedes core's `cli-schema.ts`** — the C-CLI-3 deletion recommendation is correct and the cli has zero migration burden (no import to move). Master report should fold this into the core deletion sweep.

5. **Total cost of full Phase 4 doctrine compliance for cli is ~+50 net LOC.** Smaller than guard (~+200) and projection (~+20-30); larger than the trivial wins because of F4A-CLI-H-3 + F4A-CLI-M-5 (`CommandDef<F>` generic — ~30 LOC + test) and F4A-CLI-H-4 (`runtime-bridge.js` → `.ts` — ~15 LOC). Achievable in one focused PR per cluster (doctrine, infrastructure, hygiene).
