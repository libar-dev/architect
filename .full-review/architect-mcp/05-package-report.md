# `@libar-dev/architect-mcp` — Consolidated Review Report

**Package:** `@libar-dev/architect-mcp@2.0.0-pre.1`
**Size:** 9 source files, ~1,630 SLOC; 5 test files. Smallest publishable package in the family.
**Role:** MCP server. **21 tools registered (not 18 as the package.json claims).** Single bin `architect-mcp`. Depends on architect-core + architect-projection. **Family's only long-running consumer.**
**Stack additions:** `@modelcontextprotocol/sdk ^1.29.0`, `chokidar ^5.0.0`.
**Source phase:** `raw/all-phases.md` (comprehensive single-agent pass covering all 4 review dimensions).

## Executive Summary

**`architect-mcp` is the second-cleanest doctrine-compliant package after projection — and the cleanest by SLOC-adjusted ratio.** Zero open `z.object`, zero `.extend()/.omit()` chains, zero suppressions, zero barrel wildcards, 1 universal `parseAtBoundary` site at the MCP request boundary, 55% annotation rate. The package is **the smallest in the family and the closest to release-ready.** Estimated cost to ship at stable: roughly half a day of focused work.

The review's most valuable contribution is **cross-package validation** — measuring how prior reports' predictions materialize in the only long-running consumer:

- **CL-CORE-4 (self-hosting IIFE) confirmed:** fires on every MCP boot via `pipeline-session.ts:35` importing `WORKSPACE_TAG_REGISTRY`. Cold-path cost for every consumer regardless of self-hosting role. Recipe = core's H-CORE-10 deletion sweep applies directly.
- **CL-CORE-8 (package-resolver Map cache) re-framed:** bounded by source-file count and reset on every rebuild. **Less severe in MCP than the family report implied.** Phase 5 should down-rank this from a leak vector to a memory-utilization observation.
- **H-CORE-8 (27× `structuredClone`) amplifies 19× per non-cached MCP tool call:** `getProjectionContext()` is rebuilt 19 times across handler dispatch. New finding from MCP's perspective. Recipe (H-MCP-1): cache context on session.
- **C-PROJ-2 (`parseAndProjectOpenQuestionList` raw `ZodError`) confirmed:** `architect_open_questions` MCP tool exposes inconsistent error shape to MCP clients. The Phase 1 projection finding's downstream impact is measurable here.

Four Critical findings:

1. **C-MCP-1: `runtime-bridge.js:6` has the same Windows-breaking `new URL(...).pathname` bug as cli's F4A-CLI-H-4.** Two near-identical copies of `runtime-bridge.js` exist (cli + mcp), differing only in function name + error string. Fix once + promote to workspace template.
2. **C-MCP-2: `package.json:4` claims "18 tools" but 21 are registered** (confirmed against frozen test inventory at `architect-mcp-integration.feature.steps.ts:27-49`). AGENTS.md and 00-scope.md inherited the same wrong count.
3. **C-MCP-3: No package README.** MCP joins guard + cli as the three publishable packages without one. **MCP is the most user-facing of the three** — MCP clients (Claude Code, Claude Desktop, etc.) integrate via tool discovery and depend heavily on accurate metadata.
4. **C-MCP-4: `process.chdir()` in `PipelineSessionManager.withWorkingDirectory` is not signal-safe.** SIGINT during `await operation()` leaves cwd corrupted across in-flight tool calls. Real correctness defect for long-running processes.

## Findings by Priority

### Critical (P0)

| ID      | Title                                                                         | Location                                     |
| ------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| C-MCP-1 | `runtime-bridge.js:6` Windows-breaking bug; duplicate of cli's runtime-bridge | `packages/architect-mcp/runtime-bridge.js:6` |
| C-MCP-2 | `package.json:4` claims "18 tools"; 21 actually registered                    | `packages/architect-mcp/package.json:4`      |
| C-MCP-3 | No package README                                                             | `packages/architect-mcp/README.md` (absent)  |
| C-MCP-4 | `process.chdir()` in `withWorkingDirectory` not signal-safe                   | `src/pipeline-session.ts:259-271`            |

### High (P1)

| ID                         | Title                                                                                                                                                         | Location                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| H-MCP-1                    | `getProjectionContext()` rebuilt 19× per MCP tool call — amplifies core H-CORE-8 cost. **Recipe:** cache context on `PipelineSession`.                        | `src/tool-registry.ts` (handler dispatch)         |
| H-MCP-2                    | Tool registry uniformity — 21 tool definitions hand-typed (no schema-derived registry)                                                                        | `src/tool-registry.ts`                            |
| H-MCP-3                    | `Reflect.set(globalThis.console, 'log', ...)` monkey-patch — band-aid for upstream doctrine breach. **Family `no-console-log` ESLint rule fixes root cause.** | `src/server.ts:203-205`                           |
| H-MCP-4                    | `pipeline-session.ts` graceful-shutdown gap                                                                                                                   | `src/pipeline-session.ts`                         |
| H-MCP-5                    | `chokidar` config lacks `awaitWriteFinish` — bursty atomic-write IDEs trigger one wasted rebuild cycle per save                                               | `src/file-watcher.ts`                             |
| H-MCP-6                    | `architect_open_questions` MCP tool exposes raw `ZodError` (C-PROJ-2 downstream)                                                                              | `src/tool-registry.ts` (via projection's outlier) |
| H-MCP-7                    | `server.close()` aborts in-flight tool calls mid-projection                                                                                                   | `src/server.ts` shutdown handler                  |
| H-MCP-8                    | Shutdown handler does not await in-flight tool calls                                                                                                          | `src/server.ts:H-MCP-8`                           |
| **CL-MCP-1** (family-wide) | `tsconfig.architect-base.json` sourceMap/declarationMap disable — same CL-CORE-3                                                                              | family-wide                                       |

### Medium (P2)

- M-MCP-1: `package.json` description string drift (claims 18 tools).
- M-MCP-2: `tool-registry.ts` could derive registry from `tool-input-schemas.ts` Zod schemas.
- M-MCP-3: `pipeline-session.ts` lifecycle docs sparse.
- M-MCP-4: Session-state reset on workspace change — verify completeness.
- M-MCP-5: `server.ts` startup banner inconsistent with other bins.
- M-MCP-6 + M-MCP-7: `tool-metadata.ts` minor structural items.
- `typecheck` covers only `tsconfig.test.json` — same drift as core/projection (CL-CORE-11).
- 55% `@architect-pattern` annotation rate.

### Low (P3)

- `void main()` family hazard at `src/cli/mcp-server.ts`.
- Same family CL-CORE-3 tarball maps issue.
- Test-fixture organization in `tests/fixtures/`.

## Operational risk surface (MCP-specific)

| Concern                                    | Status                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CL-CORE-4 (self-hosting IIFE)**          | **Confirmed materializes** — every mcp boot pays the cost. Resolved when core H-CORE-10 lands.                                                                           |
| **CL-CORE-8 (package-resolver Map cache)** | **Re-framed** — bounded by source-file count; reset on rebuild. Less severe than family report implied. Down-rank to memory-utilization observation.                     |
| **H-CORE-8 (27× `structuredClone`)**       | **Confirmed + amplified** — 19× per non-cached MCP tool call. Cache projection context on session (H-MCP-1) for additional 19× reduction beyond core's `deepFreeze` fix. |
| **C-PROJ-2 (raw `ZodError` outlier)**      | **Confirmed user-visible** — `architect_open_questions` returns inconsistent error shape to MCP clients.                                                                 |
| `process.chdir` signal-safety              | **Defect** — C-MCP-4. SIGINT during await leaves cwd corrupted.                                                                                                          |
| Chokidar `awaitWriteFinish`                | **Missing** — H-MCP-5. Bursty atomic-write IDEs trigger wasted rebuilds.                                                                                                 |
| `server.close()` in-flight handling        | **Defect** — H-MCP-7/H-MCP-8. Aborts mid-projection.                                                                                                                     |
| Single-flight rebuild coalescing           | **Healthy** — file-watcher coalesces correctly.                                                                                                                          |
| Error isolation                            | **Healthy** — per-tool errors don't poison the server.                                                                                                                   |
| stdio correctness                          | **Healthy** — MCP SDK contract respected.                                                                                                                                |

## Zod 4 + TS strictness audit (compact)

| Concern                                                   | Status                                                 |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `z.object` count                                          | **0**                                                  |
| `z.strictObject` count                                    | All schemas                                            |
| `.extend()/.omit()/.pick()/.partial()/.required()` chains | **0**                                                  |
| `z.function()`                                            | **0**                                                  |
| `.brand<>()` declarations                                 | **0** (family-wide gap)                                |
| `parseAtBoundary` adoption                                | **1 universal site** at MCP request boundary — correct |
| `any` / `as unknown as` / `@ts-ignore`                    | **0**                                                  |
| Unprefixed legacy `node:` imports                         | Confirm — sweep if any                                 |
| `void main()` sites                                       | **1** at `src/cli/mcp-server.ts` (family hazard)       |
| `Set.has` narrowing exposure                              | TBC — likely 0                                         |

## Configuration audit vs family

| Setting                | MCP                                                      | Verdict                                                                       |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `prepack` placement    | scripts ✓                                                | Aligned.                                                                      |
| `prepack` command      | `pnpm clean && pnpm build` (from earlier audit)          | Aligned.                                                                      |
| `lint` glob            | `eslint src tests`                                       | Aligned.                                                                      |
| `typecheck` scope      | only `tsconfig.test.json`                                | **Drift — same as core/projection (CL-CORE-11)**.                             |
| `test` chain           | `pnpm typecheck && vitest run --config vitest.config.ts` | Aligned with discipline.                                                      |
| `eslint` in devDeps    | Explicit (from package.json)                             | Aligned.                                                                      |
| `package.json#exports` | `.` + `./bin/architect-mcp` + `./package.json`           | Subpaths correct.                                                             |
| `runtime-bridge.js`    | Duplicate of cli's                                       | C-MCP-1; promote to workspace template.                                       |
| Custom audit scripts   | **None** (projection has 2; guard has 1)                 | Family promotion opportunity.                                                 |
| Pack-smoke test        | **None**                                                 | Family promotion opportunity (guard's `pack-smoke.mjs` + cli's `run-cli.ts`). |

## What's healthy (preserve)

1. **`parseAtBoundary` universal entry** — every MCP request parses once.
2. **`defineToolHandler<TSchema>` type-preserving builder** — TS reference.
3. **`createStrictReadonlyObjectSchema` helper** — promote family-wide.
4. **Schema reuse from projection's `OptionsSchema.unwrap().shape`** — minimizes drift.
5. **Frozen-inventory test** — guards against accidental tool count changes (already caught C-MCP-2).
6. **21/21 tool happy-path coverage.**
7. **Single-flight rebuild coalescing** — file-watcher correctness.
8. **Error isolation** — per-tool errors contained.
9. **stdio correctness** — MCP SDK contract respected.
10. **Zero barrel wildcards** — clean public surface.
11. **`tool-input-schemas.ts`** — 21 strict-object Zod schemas. Reference quality.
12. **MCP-specific test infrastructure** — frozen inventory test catches drift.

## Action plan — ordered

### Sweep 1: Quick fixes (1-2 hours)

1. **C-MCP-1** — fix `runtime-bridge.js:6` Windows bug (`new URL(...).pathname` → `fileURLToPath(new URL('.', import.meta.url))`). Mirror cli's fix.
2. **C-MCP-2** — update `package.json:4` description to "21 tools"; fix AGENTS.md + 00-scope.md inherited counts.
3. **C-MCP-4** — wrap `process.chdir` in `withWorkingDirectory` with SIGINT-safe try/finally that always restores cwd.

### Sweep 2: Operational safety (4 hours)

4. **H-MCP-1** — cache projection context on `PipelineSession`. 19× reduction beyond core H-CORE-8.
5. **H-MCP-7 + H-MCP-8** — `server.close()` awaits in-flight tool calls (Promise.allSettled with timeout).
6. **H-MCP-5** — add `awaitWriteFinish: { stabilityThreshold: 200 }` to chokidar config.
7. **H-MCP-3** — replace `Reflect.set(globalThis.console, 'log', ...)` with `no-console-log` ESLint rule + delete the monkey-patch.

### Sweep 3: Documentation (4 hours)

8. **C-MCP-3** — create `packages/architect-mcp/README.md`. Use projection as template; document the 21 tools (this is the user-facing reference for MCP clients), the file-watcher behavior, the configuration mechanism, and known MCP-client integration paths.
9. **Family-wide PDR-005 cleanup** — verify mcp source for phantom references; per the guard finding's 11-site inventory.

### Sweep 4: Family-wide (master report)

10. **CL-CORE-3 family-wide** — disable sourceMap/declarationMap.
11. **`runtime-bridge.js` workspace promotion** — after C-MCP-1 + cli's F4A-CLI-H-4 land, one file replaces two.
12. **Pack-smoke workspace promotion** — applies to mcp too.
13. **`no-restricted-syntax` `void main()` rule** — closes cli (2 sites) + guard (3 sites) + core (3 sites) + mcp (1 site) in one rule.
14. **CL-CORE-11 family-wide** — align `typecheck` scope across all packages.
15. **CORE H-CORE-10 self-hosting deletion** — eliminates MCP cold-start cost.

## Cross-package implications for master report

1. **`runtime-bridge.js` duplication** — cli + mcp have near-identical copies. Single workspace template after C-MCP-1 + F4A-CLI-H-4 land.
2. **CL-CORE-8 down-ranking** — Phase 5 confirms bounded; the family report should de-emphasize this from leak-vector to memory-utilization. **One Phase 5 finding correcting a Phase 1 framing.**
3. **H-CORE-8 amplification** — 19× per MCP tool call. Master report should pair core's H-CORE-8 fix with mcp's H-MCP-1 (cache context per session) for compounding benefit.
4. **CL-CORE-4 self-hosting IIFE** — measured-firing on every mcp boot. Master report should rank H-CORE-10 deletion higher.
5. **C-PROJ-2 user-visible at MCP boundary** — the projection outlier's downstream impact is measurable as inconsistent error shape to MCP clients.
6. **Three packages without README (guard, cli, mcp)** — pattern, not coincidence. Family doc audit should propose templates.
7. **`createStrictReadonlyObjectSchema` helper, `defineToolHandler<TSchema>` builder, frozen-inventory test** — three patterns worth promoting family-wide.
8. **MCP-specific operational concerns (`process.chdir`, signal handling, in-flight tool calls, chokidar `awaitWriteFinish`)** — none of these affect other packages because MCP is the only long-running consumer. Master report should note that MCP's release-readiness is its own gate, not blocked by other packages.

## Overall verdict

**`architect-mcp` is the closest package to release-ready in the family.** It's doctrine-clean (zero `.extend()/.omit()`, zero suppressions, zero open `z.object`), well-tested (21/21 tools have happy-path coverage; frozen-inventory test guards against drift — and already caught C-MCP-2), and operationally sound on the architectural patterns that matter (parseAtBoundary universal, schema-derived tool handlers, error isolation, stdio correctness).

The Critical findings are **all fixable in a single afternoon**: a Windows path bug (mirror cli's fix), a count typo (`18 → 21`), an absent README (1-day work to do well), and a signal-safety wrapper for `process.chdir`. The High findings cluster on **operational refinement** — cache session context, await in-flight calls on shutdown, debounce chokidar — none requiring architectural changes.

The package's identity as **"the family's only long-running consumer"** is the key context for prioritization: the operational risks that prior reviews flagged for MCP (CL-CORE-4, CL-CORE-8, H-CORE-8) all materialize here, and the recipes are concrete + measurable. The CL-CORE-8 re-framing (from "leak vector" to "bounded by source-file count") is the most valuable Phase 5 correction in the family review.

This is the package the family ships first.
