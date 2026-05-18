# architect-cli — Phase 2 Consolidated: Simplification & Cleanup

**Source:** `raw/2-simplification-cleanup.md` (combined simplifier + cleanup single-agent pass).

## Headline

Six high-leverage simplification recipes net **~-250 LOC**, take cli from 12 → 15+ `parseAtBoundary` sites, and eliminate 13 hand-written type witnesses and 1 doctrine breach (C-CLI-1).

## Critical recipes

1. **C-CLI-1** — rewrite `generate-docs.ts:214-315` (112-LOC hand-rolled argv) as `GenerateArgsSchema` + 10-entry `FLAGS` table + `assertHasValue`. Replaces 6 inline `if (next === undefined || next.startsWith('-'))` checks. Routes assembled args through `parseAtBoundary` like the `architect` bin already does. **Template for guard's F4A-G-H-3 too.**
2. **C-CLI-2** — extract `parseDisclosureLevel`/`parseFilterValue`/`mergeProjectionFilter` to `commands/_shared/projection-filter.ts`. Unifies the two drifted call paths on `parseAtBoundary` directly (drops lossy `parseSchemaValue` wrapper for this path, side-closes H-CLI-Q-7).
3. **C-CLI-3** — confirmed via grep: `CLI_SCHEMA`/`showHelp`/`CliReferenceGenerator` have **zero workspace src consumers**. cli has nothing to migrate. **Deletion is a core-side change; core's H-CORE-5 _move_ recommendation is WRONG.**
4. **H-CLI-2** — `error-handler.ts` `knownTypes` array drifts silently from core's `DocError` discriminator. Export `DocErrorTypeSchema = z.enum(DOC_ERROR_TYPES)` from core; tie `BaseDocError.type` to it.
5. **H-CLI-Q-1** — 13 `as` casts in command `execute()` flag-narrowing. Parametrize `CommandDef<TFlags>` over the per-command flags schema's `z.infer`. Removes ~75 LOC of hand-written witness types; aligns runtime parser with type narrowing by construction.
6. **H-CLI-Q-4** — three exit-code strategies (`process.exit(1)`, `process.exit(2 if BoundaryParseError else 1)`, `process.exitCode = 1`). Unify on `runCliEntrypoint(main)` helper with documented exit-code contract (0/1/2; preserves the deferred path).

## Cleanup highlights

- **`src/index.ts` IS DEAD** — `handleCliError` import matches in workspace all resolve to a separate `architect-guard/src/cli/shared.ts:24` function, not cli's export. **Recommend dropping the entire JS API surface; cli becomes bin-only.**
- Configs: cli's `typecheck` covers both `tsconfig.json` and `tsconfig.test.json` — **best-in-family alongside guard**. projection and mcp are the ones that need to catch up.
- Deps: clean. No dead deps, no peer-dep gaps, versions match family.
- Bin shims: all 6 are uniform 5-line bridges; no drift.
- `runtime-bridge.js`: ready for workspace promotion after fixing `new URL().pathname` → `fileURLToPath` (Windows hazard at line 6).

## `@skip` scenarios (4 audited)

| #   | Status                                                                                                       | Fate                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| 1   | `--format invalid` rejection blocked by H-CLI-Q-7 (`parseSchemaValue` swallows `BoundaryParseError.cause`)   | Fix the swallowing; unblock.           |
| 2   | `rules conflicting filters` — scenario expects camelCase; CLI emits hyphenated. **1-line fix in step file.** | Unblockable today with no code change. |
| 3   | `--format markdown` — `markdown` renderer not wired to `architect` bin. Aspirational placeholder.            | Delete or promote to design spec.      |
| 4   | `deprecation warnings` — no current invocation triggers it. Untriggerable.                                   | Delete or promote to design spec.      |

## Landing order (from raw, 11-step dependency-aware)

Net impact: ~−250 LOC, 12→15+ `parseAtBoundary` sites, 13→0 hand-rolled type witnesses, 1→0 doctrine breaches.

(Full step-by-step recipe in `raw/2-simplification-cleanup.md`.)
