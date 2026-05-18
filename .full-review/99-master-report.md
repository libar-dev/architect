# `@libar-dev/architect` Family — Master Aggregate Report

**Target:** 6-package monorepo at `/Users/darkomijic/dev-projects/architect/`
**Family:** `architect-core` + `architect-projection` + `architect-guard` + `architect-cli` + `architect-mcp` + `architect` (meta)
**Status:** v2.0 pre-release (each split at `2.0.0-pre.1`; root `0.0.0` private workspace)
**Total surface:** 333 publishable source files; ~42,233 SLOC; 153 test files; 1 perf gate; 4 trust-boundary lint rules; 28 ADRs.
**Review depth:** 4 phases × 6 packages = 24 phase reports + 6 per-package consolidated reports = **30 review artifacts** plus this master.

## Executive Summary

The `@libar-dev/architect` family is **structurally sound, doctrine-aligned in principle, and inconsistently doctrine-aligned in practice**. The same engineering discipline reaches different ceilings in different packages: `architect-projection` and `architect-mcp` are doctrine-clean (zero `z.object`, zero `.extend()/.omit()` chains, zero suppressions), while `architect-core` and `architect-guard` carry the bulk of doctrine debt. The family's idioms are correct; the application of those idioms is uneven.

**The single highest-leverage finding across the entire 30-artifact review is a one-line edit in core** (Phase 4A of architect-guard, finding F4A-G-1):

> `isValidStatusValue` already exists at `architect-core/src/validation/fsm/validator.ts:52` as a non-exported local function. Adding `export` to one function + 2 re-export lines in core unblocks: (a) guard's 3 `as ProcessStatusValue` casts at `detect-changes.ts:414,440,452` (C-GUARD-1), (b) projection's 3 `Set.has` narrowing sites (M-PROJ-F-4), (c) core's own C-CORE-5 FSM trust-boundary recipe. **The infrastructure for closing the family's most critical cross-package finding is already written — it just isn't exported.**

The family has **four cross-package contract failures that span 2+ packages**:

1. **FSM trust-boundary collapse** (core C-CORE-5 + guard C-GUARD-1) — core's `validateTransition` casts strings to `ProcessStatusValue` after the type guard rejected them; guard's consumer at `decider.ts:300` is the only production caller AND adds 3 fresh casts on raw regex captures from git diff text. Both packages defer FSM-transition testing to "the other side"; **zero FSM tests exist anywhere.** The `process-guard-rules.feature:43-48` even cites a "phase-state-machine feature suite" that doesn't exist in any package. One coordinated PR closes both.

2. **Zod 4 strictness-loss bug — family-wide** (core F4A-H-6 + projection C-PROJ-1 + projection CP4A-Sharpened-1 with `.omit()` upstream of `.extend()`). Zod 4 changed `extend`/`omit`/`pick`/`partial`/`required` to no longer carry through `unknownKeys` — strict schemas silently become open. Confirmed in core (`PackageConfigSchema`), confirmed in projection at three sites in `pattern-relations/`. **Guard has zero such chains (preserve by spread pattern); mcp has zero; cli has zero.** Single audit script (~15 LOC) scans all packages.

3. **`parseAtBoundary` adoption is family-wide inconsistent.** Core exports it but never uses it inside `src/` (TD-CORE-1). Guard never uses it despite 3 trust boundaries (C-GUARD-4). Projection uses it correctly via `parseAndProject` (closes the gap for projection's consumers). Cli is the family reference with 12 sites. MCP has 1 universal site. The `parseCommandInput` template at `architect-cli/src/cli/pattern-graph-cli-commands.ts:113-198` is the family pattern; core + guard should adopt.

4. **94% dead barrel surface in guard + dead `src/index.ts` JS API in cli + 10 additional dead exports in core (CL-CORE-5)** combine to ~150 publicly-exported symbols with zero workspace consumers. Coordinated barrel curation lands a ~50% reduction in public surface across the family.

Three further cross-package corrections from later phases:

- **C-CLI-3 supersedes core's H-CORE-5.** Phase 1 said move `cli-schema.ts` (610 LOC) from core to cli. Phase 1 cli review verified via grep: **zero consumers anywhere**. Recipe is **delete from core, not move**. Single grep-and-delete sweep.
- **Phase 2 cleanup re-rebalanced Phase 1 H-GUARD-3 (`git/` re-homing).** Phase 1 said move to core because "consumed by core." Phase 2 grep showed it's only consumed inside guard. **Demote to `process-guard/_git/`, not promote to core.**
- **Phase 5 of mcp re-framed CL-CORE-8 (`package-resolver` Map cache).** Phase 1 called it a "leak vector" for MCP. MCP measurement shows the cache is bounded by source-file count and reset on every rebuild. **Down-rank from leak vector to memory-utilization observation.**

The release-readiness ordering across the family:

1. **`architect-mcp`** — half a day to stable. Already cleanest by SLOC-adjusted doctrine ratio.
2. **`architect` (meta)** — release-ready as soon as the family is.
3. **`architect-projection`** — 1-2 days to stable after Sweeps 1-3 of its action plan.
4. **`architect-cli`** — 1 week after the test-coverage backfill (22 untested commands).
5. **`architect-guard`** — 1 week after the F4A-G-1 core edit unblocks + Phase 2 cleanup lands.
6. **`architect-core`** — last to ship. The richest doctrine debt cluster; one disciplined release cycle to land all sweeps.

**The most pressing structural finding across the entire family is the absence of CI/CD.** No `.github/workflows/` directory exists. `publishConfig.provenance: true` is declared by every publishable package with no workflow to issue attestations. Every quality finding in this review becomes a developer-discipline question rather than an automation question. **The doctrine is preached; the enforcement is manual.** The two custom audit scripts in projection (`options-schema-barrel-audit.mjs`, `jsdoc-boilerplate-audit.mjs`) and one in guard (`packed-dangling-baseline-smoke.mjs`) are the only mechanical surface audits in the family — promoting them workspace-wide is the highest-leverage family-wide automation move.

## Findings synthesis across packages

### Critical findings per package (28 total)

| Package              | Count | Examples                                                                                                                                                                                                                                                                                           |
| -------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| architect-core       | 7     | `./roles` broken export; `PatternGraphSchema` open + drifted hand-typed interface; duplicate `TagRegistry` type-of-record; `isProjectConfig` triple-validation; `validateTransition` casts after type-guard rejection; `prepack` misplaced; `z.function().optional()`                              |
| architect-projection | 5     | `.omit()/.extend()` chain feeds `PatternDetailSchema`; `parseAndProjectOpenQuestionList` outlier; perf gate unwired; README quickstart doesn't compile; documentation falsehoods                                                                                                                   |
| architect-guard      | 10    | FSM trust-boundary collapse; `tier-a-baseline.ts` 1,138-LOC dogfood leak; doctrine-enforcing package isn't doctrine-compliant; `parseAtBoundary` unused; 94% dead barrel surface; smoke test unwired; phantom PDR-005 in user-visible CLI help; no README; `git/` wrong bounded-context annotation |
| architect-cli        | 6+    | `CLI_SCHEMA` should be deleted (supersedes core H-CORE-5); 100-LOC hand-rolled argv; `src/index.ts` dead; 22 of 24 commands untested; no README; `runtime-bridge.js` Windows bug                                                                                                                   |
| architect-mcp        | 4     | `runtime-bridge.js` same Windows bug; "18 tools" vs 21 registered; no README; `process.chdir` not signal-safe                                                                                                                                                                                      |
| architect (meta)     | 0     | Only `.DS_Store` cleanup and inherited family items                                                                                                                                                                                                                                                |

### High findings per package (~100 total)

| Package              | Count                                                     |
| -------------------- | --------------------------------------------------------- |
| architect-core       | 37 (16 quality+arch + 8 testing+docs + 8 language + 5 CI) |
| architect-projection | 22 (10 arch + 8 quality + 4 cleanup/test/lang)            |
| architect-guard      | 25+ (14 arch + 9 quality + 10 test+doc + 3 language)      |
| architect-cli        | 18+ from Phase 1                                          |
| architect-mcp        | 8                                                         |
| architect (meta)     | 2                                                         |

### Medium + Low

Combined: ~120 medium, ~60 low across the family. Most cluster into 6 family-wide sweep patterns (see below).

## Cross-package findings (the master report's main contribution)

### CP-1: The FSM trust-boundary collapse spans core + guard

**Recipe (1 PR, ~50 LOC across both packages):**

1. `architect-core/src/validation/fsm/validator.ts:52` — change `function isValidStatusValue` → `export function isValidStatusValue`.
2. `architect-core/src/validation/fsm/index.ts` — add `export { isValidStatusValue } from './validator.js';` + `export { ProcessStatusSchema as StatusValueSchema } from '../../domain-enums.js';`.
3. `architect-core/src/validation/fsm/validator.ts:88-105` — discriminated `TransitionValidationResult` union; drop 3 `as ProcessStatusValue` lines.
4. `architect-guard/src/lint/process-guard/detect-changes.ts:414,440,452` — replace 3 casts with `parseAtBoundary(StatusValueSchema, ...)`.
5. Add `tests/features/validation/fsm-transitions-via-guard.feature` in guard AND `tests/features/validation/fsm-transitions.feature` in core. Both use Scenario Outline with 4 legal + 3 illegal + 1 garbage scenarios.

**Closes:** core C-CORE-5, guard C-GUARD-1, projection M-PROJ-F-4 (3 `Set.has` sites), core TD-CORE-3, guard TC-C-GUARD-1.

### CP-2: Zod 4 strictness-loss bug — family-wide audit

**Recipe:** add a script that scans all 5 publishable packages for `.extend(` / `.omit(` / `.pick(` / `.partial(` / `.required(` call sites. For each, emit a warning unless the chain ends in `.strict()`. Confirmed problem sites:

- core `package-config.ts:10`
- projection `pattern-summary.ts:28` (`.omit()`)
- projection `pattern-detail.ts:24` (`.extend()`)
- projection `supporting.ts:54-58` (`.omit().extend()`)

Confirmed clean: guard, cli, mcp.

**Recipe at every problem site:** replace with `z.strictObject({ ...Base.shape, ...newFields })` spread.

### CP-3: `cli-schema.ts` deletion (supersedes Phase 1 H-CORE-5)

**Recipe:** delete `architect-core/src/config/cli-schema.ts` (610 LOC) + remove barrel re-exports. Cli already has its own help system in `commands/_shared/help.ts`. No consumers anywhere. **Single-step, no migration.**

**Closes:** core H-CORE-5, core M-CORE-3 (CLI option enums in core barrel), cli C-CLI-3.

### CP-4: `runtime-bridge.js` duplicate + Windows bug

cli `runtime-bridge.js:6` and mcp `runtime-bridge.js:6` both have `path.dirname(new URL(import.meta.url).pathname)` which breaks Windows (leading `/` in drive paths). Two near-identical copies differing only in function name + error string.

**Recipe:** fix once (`fileURLToPath(new URL('.', import.meta.url))`); convert to `.ts` under `src/`; promote to workspace template; cli + mcp both import.

**Closes:** cli F4A-CLI-H-4/H-5, cli C-MCP-1 mirror.

### CP-5: Family-wide barrel curation (~50% public-surface reduction)

- guard: 12 wildcards → 9 named exports (~141 dead symbols removed).
- cli: `src/index.ts` entire JS API surface dead — drop (cli becomes bin-only).
- core: 10 additional dead exports per CL-CORE-5 + the entire `presentation-contracts.ts` + the 6 BC alias schemas in `feature.ts` + `cli-schema.ts` (per CP-3) + `self-hosting.ts` (per H-CORE-10).
- projection: triple barrel re-export of `summarizeTaxonomyDigest` resolved by H-PROJ-A-3 (move to projections, delete from fragments).

### CP-6: `parseAtBoundary` family adoption

Family reference is `architect-cli/src/cli/pattern-graph-cli-commands.ts:113-198 parseCommandInput`. Adopt at:

- core: `buildPatternGraph` entry (closes TD-CORE-1).
- guard: 3 trust boundaries (closes C-GUARD-4).
- projection: 1 outlier `parseAndProjectOpenQuestionList` rewrite (closes C-PROJ-2).

### CP-7: CI/CD absence is the multiplier

No `.github/workflows/` exists at the repo level. Family-wide gap (core CI-1, CI-2). Every quality finding in this review becomes a developer-discipline question.

**Recipe (combined across packages):**

- `.github/workflows/ci.yml` — pnpm install + lint + typecheck + test on PR/push, matrix `node: [20, 22]`.
- `.github/workflows/publish.yml` — tag-push trigger with OIDC provenance for `npm publish`; `changeset publish` orchestration.
- Promote `jsdoc-boilerplate-audit.mjs` workspace-wide (with `--skip-unannotated` for packages at lower annotation rates).
- Promote `options-schema-barrel-audit.mjs` workspace-wide with ~15-LOC extension catching `parseAndProject*`-style outliers + Zod 4 strictness-loss audit.
- Promote `packed-dangling-baseline-smoke.mjs` + `tests/support/run-cli.ts` workspace-wide as `pack-smoke.mjs`. Catches `./roles`-style broken exports + dist-resource regressions before every publish.

### CP-8: Family-wide tarball reduction via CL-CORE-3

`tsconfig.architect-base.json` currently sets `sourceMap: true, declarationMap: true`. Disabling cuts each package's tarball ~46-50%:

| Package              | Before                                         | Projected after                                         |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| architect-core       | 426 files / 195.8 KB packed / 1.5 MB unpacked  | ~170-180 files / under 100 KB packed / ~600 KB unpacked |
| architect-projection | 582 files / ~250 KB packed                     | ~290 files / ~125 KB packed                             |
| architect-guard      | 583 KB unpacked / 155 files                    | ~315 KB / ~80 files                                     |
| architect-cli        | 52.1 KB packed / 253.7 KB unpacked / 112 files | ~37 KB packed                                           |
| architect-mcp        | (per family pattern)                           | (same ~50% reduction)                                   |
| architect (meta)     | N/A (no dist)                                  | N/A                                                     |

**One line in the family base tsconfig. Halves the install footprint family-wide.**

### CP-9: Family-wide script normalization

Single PR aligns across all 5 publishable packages:

- `prepack` location/command (core was broken; rest aligned).
- `lint` glob (core missed `tests`; rest aligned).
- `typecheck` scope (guard + cli are best-in-family covering both configs; core/projection/mcp need to catch up).
- `test` chain with typecheck guard (guard + cli + projection have variants; standardize).
- `module` field removal (family-wide cosmetic).
- `eslint` in devDeps (core relies on root hoist; siblings explicit).
- `vitest.include` pattern (3-way drift: `tests/steps/**`, `tests/features/**`, `tests/**/*.steps.ts` — pick one).
- `node:` prefix sweep (7 inconsistent files in guard; check core too).

### CP-10: Family-wide phantom reference cleanup

Phantom PDR-005 referenced **11 times** across 3 packages:

| Location                                                                  | Type                             | Visibility              |
| ------------------------------------------------------------------------- | -------------------------------- | ----------------------- |
| `architect-guard/src/lint/process-guard/{index,types,decider,decider}.ts` | source                           | low                     |
| `architect-guard/src/cli/lint-process.ts:170`                             | **CLI help output**              | **HIGH (user-visible)** |
| `architect-core/src/taxonomy/registry-builder.ts:162`                     | source                           | low                     |
| `architect-guard/docs/VALIDATION.md` + `docs/GHERKIN-PATTERNS.md`         | doc                              | medium                  |
| `architect-guard/docs-sources/gherkin-patterns.md`                        | **doc source feeding generator** | **HIGH (propagates)**   |
| (3+ low-priority sites)                                                   |                                  |                         |

**Decision: author PDR-005 (process-guard FSM enforcement IS decision-worthy) or strip all 11 references in one coordinated PR.**

## Per-package summary table

| Package              | SLOC   | Tests         | Critical | High | Annotation | strictObject sites                             | Doctrine grade                                                       |
| -------------------- | ------ | ------------- | -------- | ---- | ---------- | ---------------------------------------------- | -------------------------------------------------------------------- |
| architect-core       | 12,360 | 51 step files | 7        | 37   | 26%        | 28 mixed (28 z.object drift)                   | **B-** doctrine-aligned in principle, uneven in application          |
| architect-projection | 15,238 | 83 step files | 5        | 22   | 60%        | 107 / 0 (Zod 4 strict-chain issues at 3 sites) | **A-** family reference for Zod 4 + ESM + TS strictness              |
| architect-guard      | 9,135  | 5 step files  | 10       | 25+  | 55%        | 1 / 1 (one open `z.object`)                    | **C** doctrine-enforcing package least doctrine-compliant            |
| architect-cli        | 3,870  | 9 files       | 6+       | 18+  | 15%        | 13 / 0                                         | **B** family reference for CLI trust boundaries; worst test coverage |
| architect-mcp        | 1,630  | 5 files       | 4        | 8    | 55%        | All strict                                     | **A** cleanest by SLOC-adjusted ratio; closest to release            |
| architect (meta)     | ~14    | 0             | 0        | 2    | N/A        | N/A                                            | **A+** smallest possible package shape                               |

## Family numbers

| Metric                                                    | Value                                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Total source files (publishable)                          | 333                                                                               |
| Total SLOC                                                | ~42,233                                                                           |
| Total test files                                          | 153                                                                               |
| `parseAtBoundary` call sites across family                | 13 + 1 (cli + mcp); core 0; guard 0; projection N (via `parseAndProject`)         |
| `z.strictObject` sites total                              | ~250                                                                              |
| `z.object` sites total                                    | ~30 (28 in core + 1 in guard + 1 in projection's L-PROJ-A; rest zero)             |
| `.extend()/.omit()/.pick()/.partial()/.required()` chains | 4 confirmed problem sites (1 core + 3 projection)                                 |
| `.brand<>()` declarations                                 | 6 (all in core); 0 in guard/cli/mcp/projection consumers                          |
| Suppressions (`@ts-ignore`/`eslint-disable`/`void X`)     | 6 total — all in core (3 `void X` + 3 dead suppressions; rest of family is clean) |
| Phantom PDR/ADR references                                | 11 (phantom PDR-005 across guard + core + projection docs)                        |
| Packages without README                                   | 3 (guard, cli, mcp)                                                               |
| Packages with `prepack` correctly placed                  | 5 of 6 (core was broken; now fixable)                                             |
| Packages with `typecheck` covering both configs           | 2 of 6 (guard + cli)                                                              |
| Custom audit scripts                                      | 3 (2 in projection + 1 in guard)                                                  |
| Tests for the FSM                                         | 0 (across core + guard combined)                                                  |
| CI workflows                                              | **0** (none at repo level)                                                        |
| `publishConfig.provenance: true` declarations             | 5 (one per publishable package) — none active                                     |

## Recommended landing order (master)

### Sweep M1: Cross-package unblocks (one PR, ~2 hours)

1. **F4A-G-1 (the one-line core edit):** export `isValidStatusValue` + `StatusValueSchema` from core. **Unblocks the FSM trust-boundary collapse across core + guard + projection in one stroke.**
2. **CP-3 — delete `cli-schema.ts`** from core (610 LOC). Zero consumers verified.
3. **CP-4 — fix `runtime-bridge.js:6` Windows bug** in cli + mcp; convert to `.ts`; promote to workspace template.
4. **Core CL-CORE-1 + CL-CORE-2:** move core's misplaced `prepack` to scripts; delete broken `./roles` export.

### Sweep M2: Family normalization (one PR, ~4 hours, family-wide)

5. **CL-CORE-3** — `sourceMap: false, declarationMap: false` in `tsconfig.architect-base.json`. **Halves family tarball.**
6. **CP-9 — family-wide script normalization PR.** Align `lint`/`typecheck`/`test`/`prepack`/`module`/`eslint`/`node:`/vitest patterns across all 5 publishable packages.
7. **CP-10 — phantom PDR-005 cleanup.** Decide (author the PDR or strip all 11 references); land in one PR.

### Sweep M3: FSM trust-boundary integration (one PR after M1, ~6 hours)

8. **C-CORE-5 + C-GUARD-1** — discriminated `TransitionValidationResult`; drop 3 core + 3 guard casts; add FSM transition tests in both packages.
9. **Projection M-PROJ-F-4** — use the now-exported `isValidStatusValue` at 3 `Set.has` sites; drop 3 casts.
10. **C-GUARD-4** — `parseAtBoundary` at 3 guard trust boundaries.

### Sweep M4: Doctrine sweep (one PR per package, ~2 weeks)

11. **Core**: 28-site `z.object → z.strictObject` sweep; replace 9 hand-written `PatternGraph`/`StatusGroups`/etc. interfaces with `z.infer`; consolidate `TagRegistry` type-of-record (C-CORE-3); delete dead surface per CL-CORE-5.
12. **Projection**: fix Zod 4 `.omit().extend()` chain feeding `PatternDetailSchema`; wire perf gate; fix C-PROJ-2 outlier; correct README falsehoods.
13. **Guard**: delete `tier-a-baseline.ts` → JSON migration; Zod-first sweep of `process-guard/types.ts`; barrel curation (94% dead surface); fix `git/` annotation; wire `packed-dangling-baseline-smoke.mjs`.
14. **CLI**: rewrite `generate-docs.ts` argv as Zod schema; extract `commands/_shared/projection-filter.ts`; drop dead `src/index.ts`; backfill 22 untested command coverage.
15. **MCP**: `withWorkingDirectory` signal safety; cache projection context on session (H-MCP-1); chokidar `awaitWriteFinish`; in-flight tool-call shutdown handling; create README.

### Sweep M5: CI/CD (one PR, ~1 day)

16. **`.github/workflows/ci.yml`** — lint + typecheck + test on PR/push, matrix `[20, 22]`, pnpm-store cache.
17. **`.github/workflows/publish.yml`** — tag-push trigger with OIDC provenance for `npm publish`; `changeset publish` orchestration.
18. **Promote 3 custom audit scripts to workspace level**: `jsdoc-boilerplate-audit.mjs`, `options-schema-barrel-audit.mjs` (extended for `parseAndProject*` + Zod 4 strictness audit), `pack-smoke.mjs` (combining cli + guard infrastructure).
19. **Promote `runtime-bridge.ts`** to workspace template (post CP-4).

### Sweep M6: Documentation (one PR per missing README)

20. **architect-guard/README.md** — using projection's as long-form template.
21. **architect-cli/README.md** — same.
22. **architect-mcp/README.md** — same. **Highest priority of the three** because MCP clients integrate via tool-discovery and depend on accurate metadata.
23. **`docs/MIGRATION.md` updates** — add per-package removal sections (Phase 1+2 deletions per CL-CORE-5).
24. **`AGENTS.md:165`** — fix the cited `ProcessGuard` symbol that doesn't exist (DOC-H-GUARD-5).
25. **`docs/PERF.md`** — accurate after Cleanup-C-PROJ-1 wires the gate.

## What's healthy and worth preserving (family-wide reference patterns)

Modules and patterns identified by the reviews as **family-reference quality**:

1. **`parseAndProject` + `parseAtBoundary` chain** (projection's `_shared/parse-and-project.internal.ts`) — trust-boundary pattern.
2. **`parseCommandInput`** (cli `pattern-graph-cli-commands.ts:113-198`) — `parseAtBoundary` reference with `BoundaryParseError.cause` preserved.
3. **`StrictKindTable<Out, Options, Kinds>` + `dispatchByKind`** (projection `renderers/_shared/dispatch.ts`) — compile-time exhaustive dispatch.
4. **`renderJson` defensive validation** (projection `renderers/render-json.ts`) — exhaustive rejection of unsafe values with JSON path in every error.
5. **`DependencyTreeNodeSchema = z.ZodType<...>: z.strictObject({...z.lazy(...)})`** (projection `supporting.ts:85-92`) — correct Zod 4 recursive idiom.
6. **`branded.ts`** (core `types/branded.ts`) — 6 brands via `z.string().brand<...>()`. Reference for the family; guard + cli + mcp should consume.
7. **`commands/_shared/schemas.ts`** (cli) — 10 strict flag schemas; Zod 4 reference for CLI argv.
8. **`tool-input-schemas.ts`** (mcp) — 21 strict-object schemas. Reference.
9. **`createStrictReadonlyObjectSchema` helper** (mcp) — promote family-wide.
10. **`defineToolHandler<TSchema>` builder** (mcp) — TS reference for type-preserving definers.
11. **`Result<T, E>` discipline** at internal boundaries — family-wide, preserve.
12. **`dangling-baseline.ts:7-15`** (guard) — projection-reference template for the family's dogfood-baseline pattern.
13. **`packed-dangling-baseline-smoke.mjs`** (guard) + **`tests/support/run-cli.ts`** (cli) — family's only post-pack contract test infrastructure.
14. **`options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs`** (projection) — only mechanical surface audits.
15. **`as const satisfies T` discipline** — used correctly in 8+ sites across the family.
16. **`import type` discipline** + zero `node:`-unprefixed legacy imports in projection + cli — ESM hygiene reference.
17. **`z.discriminatedUnion('kind', [...])`** in projection's `FragmentSchema` over 43 kinds — reference for tagged unions.
18. **The 6-subdomain partition** in projection (`fragments/` + `projections/` mirrored) — clean modularization.
19. **Frozen-inventory tests** (mcp's 21-tool registry test) — guards against accidental drift.
20. **Trust-boundary lint rules** (projection's 4 architecture rules in repo-root `eslint.config.mjs`) — mechanical enforcement.

## What's structurally weak (worth a release-cycle conversation)

Themes that span multiple packages and suggest structural rather than tactical refactors:

1. **Two Gherkin parsers** — `@cucumber/gherkin` (doc-gen + pattern-graph build time) and `@amiceli/vitest-cucumber` (test runner). Both ship in the family; both must not be confused. AGENTS.md documents the distinction. Worth a developer-onboarding callout.
2. **The `git/` module** lives in guard, was annotated `:generator`, is actually consumed only by guard's process-guard subsystem (Phase 2 supersedes Phase 1). Suggests an `architect-git` sub-package may eventually emerge — or the demote-to-internal recipe is sufficient.
3. **The dogfood-baseline pattern** (`dangling-baseline.ts` + `tier-a-baseline.ts`) — guard's `tier-a-baseline.ts` is the worst dogfood leak in the family. Master report recommends following `dangling-baseline.ts` shape for both.
4. **Cross-renderer slug parity defect** in projection (H-PROJ-A-7) — `slugForFilename` vs `slugify` produce different anchors in markdown vs UI output for the same pattern. A bite-waiting-to-happen.
5. **The `parseAtBoundary` adoption rate** — projection (universal via `parseAndProject`) and cli (12 sites, family-reference template) are correct. Core (0 sites in own src) and guard (0 sites despite 3 trust boundaries) are doctrine breaches. MCP (1 universal site at request boundary) is correct.
6. **`@architect-pattern` annotation rate** ranges from 15% (cli) to 60% (projection) to 0% in some core subsystems (taxonomy, utils). Master suggests promotion to a workspace-level lint rule.

## Verdict

The `@libar-dev/architect` family is **pre-1.0 ready for an intentional cleanup cycle** rather than ad-hoc fixes. The doctrine is correct, the patterns exist in the codebase to copy from, the test infrastructure is partly built (just unwired in projection's perf gate and guard's smoke test), and the deletions outnumber the additions by a comfortable margin.

**Estimated cost to bring the family to stable release (`2.0.0-pre.X` → `2.0.0`):**

- ~3,500 LOC deletion across the family (dead exports + `tier-a-baseline.ts` → JSON migration + `cli-schema.ts` deletion + dead surface curation).
- ~+200 LOC additive (CI workflows + audit scripts + READMEs + missing test scenarios).
- ~50 new test scenarios (FSM transitions + 22 cli commands + 4 unreachable anti-pattern detectors + projection's parametric gates).
- ~50% tarball reduction family-wide.
- 1 release cycle (2-3 weeks of focused work) for one disciplined engineer or 1-2 weeks for a pair.

**The one-line core edit (F4A-G-1) is the single highest-leverage change in the entire 30-artifact review.** Land it first. Everything else follows.

**MCP ships first. Meta ships when MCP ships. Projection ships second. CLI follows after coverage backfill. Guard follows after the core edit unblocks. Core ships last as the foundation.**
