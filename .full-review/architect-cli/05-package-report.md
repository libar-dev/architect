# `@libar-dev/architect-cli` — Consolidated Review Report

**Package:** `@libar-dev/architect-cli@2.0.0-pre.1`
**Size:** 26 source files, ~3,870 SLOC; 9 test files.
**Role:** Thin composition root for 6 CLI bins (`architect`, `architect-generate`, `architect-guard`, `architect-lint-patterns`, `architect-lint-steps`, `architect-validate`). Depends on architect-core, architect-projection, architect-guard.
**Source phases:** `01-quality-architecture.md`, `02-simplification-cleanup.md`, `03-testing-documentation.md`, `04-best-practices.md`. Raw outputs from 4 combined-agent passes in `./raw/`.

## Executive Summary

Cli is **the family doctrine reference for CLI trust boundaries** (12 `parseAtBoundary` call sites — the most in the workspace) and the **second-cleanest on Zod-first contracts** after projection. Zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`; zero `.extend()/.omit()/.pick()/.partial()/.required()` chains (does NOT expose to the family-wide Zod 4 strictness-loss bug); 13 `z.strictObject` sites + 0 open `z.object`; best-in-family `typecheck` discipline alongside guard (covers both configs). The `parseCommandInput` shape at `pattern-graph-cli-commands.ts:113-198` is the family reference for trust-boundary parsing that core's TD-CORE-1 and guard's C-GUARD-4 should adopt.

The Critical findings cluster in three places:

1. **C-CLI-3 supersedes core's H-CORE-5.** The Phase 1 cli review verified via grep that `CLI_SCHEMA`/`showHelp`/`CliReferenceGenerator` in core (610 LOC) have **zero workspace src consumers**. Cli already has its own self-contained help system in `commands/_shared/help.ts`. Core's H-CORE-5 recommended *moving* — Phase 1 says **delete from core, don't move**. The single highest-leverage cli-side finding that affects core directly.

2. **`src/index.ts` is dead.** Phase 2 grep confirmed: the only matching `handleCliError` import in the workspace resolves to a **separate function** at `architect-guard/src/cli/shared.ts:24`, not to cli's export. **Recommendation: drop the entire JS API surface; cli becomes bin-only.** Net deletion ~60 LOC + the entire barrel.

3. **C-CLI-1 — `generate-docs.ts:214-315` 112-LOC hand-rolled argv parser** with 6 inline `if (next === undefined || next.startsWith('-'))` checks. Same anti-pattern as guard's F4A-G-H-3. Recipe: `GenerateArgsSchema` + 10-entry `FLAGS` table + `assertHasValue`. Routes assembled args through `parseAtBoundary` like the `architect` bin already does. **This is the family template for CLI argv parsing.**

The testing posture is **the worst in the family for its role**:

- **Only 2 of 24 `COMMAND_NAMES` have any end-to-end test** (`overview`, `arch dangling`). The other 22 commands have zero acceptance scenarios.
- **`generate-docs.ts` (~670 LOC, the entire `architect-generate` bin) has zero tests of any kind.**
- `@architect-pattern` annotation rate is **15%** — lowest in the family.
- No package README (cli joins guard as the only two publishable packages without one).

Two `@skip` scenarios are unblockable today with no code change or a 1-line fix; two should be deleted as untriggerable aspirational placeholders.

Phase 4 found one Windows-breaking bug in `runtime-bridge.js:6` (`new URL(...).pathname` instead of `fileURLToPath`), which the same file's role as "ready for workspace promotion" makes urgent.

## Findings by Priority

### Critical (P0)

| ID | Title | Location |
|----|-------|----------|
| **C-CLI-3** | Confirm-and-delete `CLI_SCHEMA`/`showHelp`/`CliReferenceGenerator` in core — supersedes H-CORE-5 (move) with delete | `architect-core/src/config/cli-schema.ts` (610 LOC) |
| C-CLI-1 | `generate-docs.ts:214-315` 112-LOC hand-rolled argv → Zod argv schema + `parseAtBoundary` | `src/cli/generate-docs.ts:214-315` |
| C-CLI-2 | `parseDisclosureLevel`/`parseFilterValue`/`mergeProjectionFilter` duplicated byte-for-byte with drifted call paths | `src/cli/generate-docs.ts:128-169`, `src/cli/commands/read.ts:62-99` |
| **Dead-cli-index** | `src/index.ts` JS API surface has **zero workspace consumers** — drop entirely; cli becomes bin-only | `packages/architect-cli/src/index.ts` |
| TC-CLI-C-1 | **22 of 24 commands untested** | `tests/features/`, `tests/support/run-cli.ts` is the harness |
| TC-CLI-C-2 | `architect-generate` bin (~670 LOC) zero tests | `src/cli/generate-docs.ts` |
| DOC-CLI-C-1 | No package README (cli + guard are only ones without) | `packages/architect-cli/README.md` (absent) |
| **CL-CLI-1** (family-wide) | `tsconfig.base.json` sourceMap/declarationMap disable — same as CL-CORE-3 | `tsconfig.base.json` |
| F4A-CLI-H-4+H-5 | `runtime-bridge.js:6` Windows-breaking `new URL(...).pathname` bug; un-typechecked, un-linted | `packages/architect-cli/runtime-bridge.js:6` |

### High (P1) — 18 from Phase 1 + 8 from later phases

**Code quality / Architecture (18 from Phase 1):**

| ID | Title |
|----|-------|
| H-CLI-2 | `error-handler.ts` `knownTypes` array drifts silently from core's `DocError` discriminator |
| H-CLI-Q-1 | 13 `as` casts in command `execute()` flag-narrowing — cured by `CommandDef<F>` generic |
| H-CLI-Q-4 | Three exit-code strategies — unify on `runCliEntrypoint(main)` helper |
| H-CLI-Q-7 | `parseSchemaValue` swallows `BoundaryParseError.cause` — closes Skip 1 from Phase 3 |
| H-CLI-7 | **CLOSED in Phase 3** — all 6 bin shims now route through `runtime-bridge.js` |
| H-CLI-3 to H-CLI-15 (partial) | Various architectural / code-quality items captured in Phase 1 raw |
| Phase 4 H-1 to H-3 | `runtime-bridge.js` `.ts` conversion + workspace promotion; pack-smoke wire-up; vitest.config `__dirname` |

**Testing / Documentation (Phase 3):**

| ID | Title |
|----|-------|
| TC-CLI-H-1 | 4 `@skip` scenarios — 2 unblockable today, 2 should be deleted (untriggerable aspirational) |
| DOC-CLI-H-1 | Zero ADR references in source |
| DOC-CLI-H-2 | 15% `@architect-pattern` annotation rate — lowest in family |

### Medium (P2) — abbreviated

`parseSchemaValue` lossy wrapper (F4A-CLI-M-3); `CommandDef<F>` generic recipe (F4A-CLI-M-5); 2 `void main()` async-call sites (family hazard, same as guard F4A-G-H-5 / core F4A-H-9); `vitest.config.ts:11` `__dirname` ESM foot-gun; family-wide `.brand<>` adoption opportunity.

### Low (P3) — abbreviated

L-CLI-6 (`.DS_Store` cleanup — confirmed clean); per-package CLI help-text micro-refinements.

## Action Plan — ordered

### Sweep 1: Core-side deletion (1 hour, supersedes core H-CORE-5)

1. **C-CLI-3** — delete `cli-schema.ts` from core; remove barrel re-exports. No-op since zero consumers (verified). Supersedes core H-CORE-5 + M-CORE-3 in one stroke.

### Sweep 2: Quick fixes (1 hour)

2. **`runtime-bridge.js:6` Windows bug** — replace `new URL(...).pathname` with `fileURLToPath(new URL('.', import.meta.url))`.
3. **`vitest.config.ts:11` `__dirname`** — replace with `import.meta.dirname`.
4. **Drop `src/index.ts` dead JS API surface** — 60 LOC + barrel cleanup. No-op since zero consumers.

### Sweep 3: Doctrine compliance (1-2 days)

5. **C-CLI-1** — rewrite `generate-docs.ts` argv parser as `GenerateArgsSchema` + `FLAGS` table + `parseAtBoundary`. Template for guard's F4A-G-H-3.
6. **C-CLI-2** — extract projection-filter helpers to `commands/_shared/projection-filter.ts`; unify on `parseAtBoundary` directly.
7. **H-CLI-2** — export `DocErrorTypeSchema = z.enum(DOC_ERROR_TYPES)` from core; tie `BaseDocError.type` to it. Eliminates `knownTypes` drift.
8. **H-CLI-Q-1** — `CommandDef<F>` generic. Removes 13 `as` casts.
9. **H-CLI-Q-4** — unify 3 exit-code strategies via `runCliEntrypoint(main)` helper.
10. **H-CLI-Q-7** — fix `parseSchemaValue` to preserve `BoundaryParseError.cause`. Unblocks Skip 1.
11. **F4A-CLI-H-4** — convert `runtime-bridge.js` to `.ts` under `src/` after the Windows fix.

### Sweep 4: Test coverage backfill (3-5 days)

12. **TC-CLI-C-1** — extend `tests/features/cli-flag-parsing.feature` and `cli-output-formatting.feature` (or add new feature files) to cover the 22 untested commands. Use `tests/support/run-cli.ts` as the harness.
13. **TC-CLI-C-2** — add coverage for `architect-generate`. After C-CLI-1 lands, the argv parser becomes Zod-validated and testable as a pure function.
14. **TC-CLI-H-1** — Skip 1 fix (after H-CLI-Q-7); Skip 2 1-line fix; delete Skip 3 + Skip 4.

### Sweep 5: Documentation (4 hours)

15. **DOC-CLI-C-1** — create `packages/architect-cli/README.md` using projection's README as template. Include the 6 bins, their flags, the help-text origin, and the trust-boundary pattern.
16. **DOC-CLI-H-2** — annotate the 22 unannotated files with `@architect-pattern` module blocks.

### Sweep 6: Family-wide (master report)

17. **CL-CLI-1 / CL-CORE-3** — disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json`. Cuts 28% of cli's tarball bytes.
18. **`runtime-bridge` workspace promotion** — after conversion to `.ts`, promote to a workspace template; cli and mcp both use it.
19. **`pack-smoke.mjs` workspace promotion** — combine cli's `tests/support/run-cli.ts` (real-subprocess harness) with guard's `packed-dangling-baseline-smoke.mjs` (post-pack contract test) into one family-wide post-pack validation. Catches core's `./roles` (CL-CORE-2) class of bug.
20. **Family-wide `.brand<>` adoption** — core owns 6 brands; cli/guard/mcp should consume.
21. **`no-restricted-syntax` ESLint rule** banning `void main()` async-call (closes 2 cli sites + 3 guard sites + core F4A-H-9 in one rule).

## What's healthy (preserve)

- **12 `parseAtBoundary` call sites** — most in the family.
- **`pattern-graph-cli-commands.ts:113-198 parseCommandInput`** — family reference for `parseAtBoundary` with `BoundaryParseError.cause` preserved.
- **`commands/_shared/schemas.ts`** — 10 strict flag schemas; Zod 4 reference.
- **`pattern-graph-cli.ts:160-178`** — the template C-CLI-1's fix should replicate.
- **`tests/support/run-cli.ts`** — real-subprocess CLI harness; the right test infrastructure.
- **`typecheck` discipline** (both configs) — family-best alongside guard.
- **Zero `.extend()/.omit()/.pick()/.partial()/.required()` chains** — doctrine-clean.
- **Bin shims uniform 5-line bridges** — no drift across 6 bins.
- **Dependencies pristine** — zero drift across family-wide pins.

## Cross-package implications for master report

1. **C-CLI-3 overrides core H-CORE-5.** `CLI_SCHEMA` should be **deleted** from core, not moved to cli (cli already has its own help system). One-stroke fix for core H-CORE-5 + M-CORE-3.
2. **`runtime-bridge.js` Windows bug** is a real publication blocker for Windows consumers. Critical to fix before mcp adopts the pattern.
3. **`parseCommandInput` is the family `parseAtBoundary` reference** — core TD-CORE-1 + guard C-GUARD-4 should adopt this template.
4. **Test-coverage gap (22 untested commands)** is the family's largest absolute LOC test gap. Master report should set a coverage target.
5. **`pack-smoke.mjs` family promotion** combines two pieces of unique infrastructure (cli's harness + guard's post-pack smoke) — the highest-leverage family-wide test automation move.
6. **15% annotation rate** is the family's worst — cli + guard + mcp all need annotation work; projection (60%) is the model.
7. **README absence** — cli + guard share this gap. mcp is the next candidate to check.
8. **No `void main()` cleanup in cli yet** — `no-restricted-syntax` rule banning it (closes core F4A-H-9 + guard F4A-G-H-5 + cli 2 sites in one PR).

## Numbers

- **Findings logged:** 6+ Critical + ~30 High + ~15 Medium + ~10 Low.
- **Net LOC delta:** ~-250 from Phase 2 + ~60 from `src/index.ts` drop + ~25 from C-CLI-1 simplification = **~-335 LOC**, plus the core-side `cli-schema.ts` deletion (610 LOC) = **~-945 LOC across cli + core combined**.
- **Tarball delta:** 52.1 KB → ~37 KB packed after CL-CLI-1 family-wide sourceMap fix.
- **Coverage delta:** 2 of 24 commands → target 24 of 24; ~700 LOC `architect-generate` from untested to fully covered.

## Overall verdict

Cli is **structurally clean and doctrine-aligned where it matters** (12 `parseAtBoundary` sites, zero strictness-loss exposure, best-in-family typecheck discipline, family-reference patterns at `parseCommandInput` and `commands/_shared/schemas.ts`). The Critical findings are mostly **cross-package corrections** (delete core's dead `cli-schema.ts`; drop cli's own dead `src/index.ts`) and **test-coverage backfill** rather than doctrine breaches.

The package's identity as "thin composition root" is largely accurate — the JS API surface is dead and should be removed; the bins are uniform; the trust-boundary discipline is exemplary. The execution gap is concentrated in `generate-docs.ts` (the one bin that doesn't yet match the doctrine reference) and the 22 untested commands.

The runtime-bridge.js Windows bug is the most urgent single defect — both because it currently breaks Windows consumers AND because the file is targeted for workspace promotion.
