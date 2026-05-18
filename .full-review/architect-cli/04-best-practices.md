# architect-cli — Phase 4 Consolidated: Best Practices & Standards

**Source:** `raw/4-best-practices.md` (combined typescript-pro + CI/DevOps single-agent pass).

## Headline

Cli is **the doctrine reference for CLI trust boundaries** (12 `parseAtBoundary` call sites — most in the family) and **the second-cleanest on Zod-first contracts** after projection. Zero `.extend()/.omit()/.pick()` chains — does NOT expose to family-wide Zod 4 strictness-loss bug. Best-in-family `typecheck` discipline alongside guard.

## Zod 4 audit

| Site | Verdict |
|------|---------|
| 13 `z.strictObject` sites; 0 `z.object` | **Correct** — no strict-sweep needed. |
| 0 `.extend()/.omit()/.pick()/.partial()/.required()` chains | **Correct** — preserves doctrine. |
| 0 `z.function()` | **Correct** — no Zod-3 idiom. |
| 0 `.brand<>()` declarations | **Family-wide gap** (F4A-CLI-H-1, matches guard F4A-G-H-2). |
| 12 `parseAtBoundary` call sites | **Family reference**. |
| `parseSchemaValue` swallows `BoundaryParseError.cause` | F4A-CLI-M-3 — closes Skip 1 from Phase 3 when fixed. |
| `CommandDef.flags: z.ZodType<Readonly<Record<string, unknown>>>` erases per-command flag types → 13 `as` casts | F4A-CLI-H-3; cured by `CommandDef<F>` generic (F4A-CLI-M-5). |

## TS strictness audit

| Issue | Count |
|-------|-------|
| `any` | **0** |
| `as unknown as` | **0** |
| `@ts-ignore` / `@ts-expect-error` | **0** |
| Unprefixed legacy node imports | **0** |
| `Number.parseInt` consistency | **Correct** |
| `void main()` async-call sites | **2** (family hazard, matches guard F4A-G-H-5 / core F4A-H-9) |
| `Set.has` narrowing exposure | **0** (all `Set<string>` — Phase 4A projection's M-PROJ-F-4 doesn't recur here) |

## CI/DevOps audit

| Concern | Status |
|---------|--------|
| `prepack` placement | **Correct** (under scripts). |
| `prepack` command | `pnpm clean && pnpm build` — aligned. |
| `typecheck` scope | **Best-in-family** alongside guard (both configs). |
| `lint` glob | `eslint src tests` — aligned. |
| `package.json#exports` ↔ `#bin` agreement | **Verified correct**. |
| Bin shebangs + `chmod +x` | **Correct**. |
| Tarball | **52.1 kB packed / 253.7 kB unpacked / 112 files** — 46% map files by count, 28% by bytes. Same family CL-CORE-3 fix. |

## New Phase 4 findings

| ID | Title | Action |
|----|-------|--------|
| **CL-CLI-1** (Critical, family-wide) | `tsconfig.base.json` sourceMap/declarationMap disable | Same as CL-CORE-3 family fix. |
| **F4A-CLI-H-4 + H-5** | `runtime-bridge.js` is the package's only `.js` production file; un-typechecked, un-linted; **Windows-breaking `new URL(...).pathname` bug at line 6** | Convert to `.ts` under `src/`, fix the bug, then promote to workspace template. |
| **CL-CLI-H-1** | No pack-smoke test (`tests/support/run-cli.ts` is the harness shape ready to use) | Complement to guard's CI-G-C-1. |
| **CL-CLI-H-2** | `vitest.config.ts:11` uses `__dirname` in pure ESM (latent foot-gun) | Replace with `import.meta.dirname`. |

## What's family-reference quality (preserve)

1. **`commands/_shared/schemas.ts`** — 10 strict flag schemas; the Zod 4 reference for CLI argv.
2. **`pattern-graph-cli-commands.ts:113-198 parseCommandInput`** — `parseAtBoundary` with `BoundaryParseError.cause` preserved via `formatZodError`. The pattern guard's C-GUARD-4 and core's TD-CORE-1 should adopt.
3. **`pattern-graph-cli.ts:160-178`** — the template C-CLI-1's fix should replicate.
4. **`tests/support/run-cli.ts`** — real-subprocess CLI harness. Reference for the proposed family-wide `pack-smoke.mjs`.
5. **The `typecheck` script** (`package.json:48`) — both configs.
6. **Best-in-family Zod 4 + TS strictness posture** apart from the 13 `as` casts which dissolve with `CommandDef<F>` generic.

## Family-wide implications

1. **CL-CLI-1 / CL-CORE-3 family-wide tsconfig fix** is the single change that affects all 5 packages' tarball sizes.
2. **Promote `runtime-bridge.js`** (after `.ts` conversion + Windows bug fix) to a workspace template — both cli and mcp would use it.
3. **`pack-smoke.mjs` workspace promotion** combines `tests/support/run-cli.ts` (cli) + `packed-dangling-baseline-smoke.mjs` (guard) into one family-wide post-pack contract test.
4. **The `parseCommandInput` shape** at `pattern-graph-cli-commands.ts:113-198` is the family reference for `parseAtBoundary` consumption. Core's TD-CORE-1 (`parseAtBoundary` invisible in core's own src) and guard's C-GUARD-4 (`parseAtBoundary` unused) should adopt this pattern.
