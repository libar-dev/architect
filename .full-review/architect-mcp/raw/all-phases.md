# `@libar-dev/architect-mcp` — Single-Pass Comprehensive Review

**Package:** `@libar-dev/architect-mcp@2.0.0-pre.1`
**Path:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/`
**Size:** 9 source files (src/ + src/cli/), 1,630 SLOC; 4 test files (3 features + 1 step file at 1,195 LOC + 1 support fixture at 217 LOC).
**Role:** MCP stdio server exposing 21 Architect tools (file is `tool-metadata.ts:1-71`; package.json line 4 says "18 tools" — drift). The **only long-running consumer** of architect-core + architect-projection. Bin: `architect-mcp`.
**Coverage angle of this review:** Phase 1A code quality, 1B architecture, 2A simplification, 2B cleanup, 3A testing, 3B documentation, 4A TS/Zod, 4B CI/DevOps — all in a single pass.

---

## 1. Executive Summary

`architect-mcp` is the **second-cleanest doctrine-compliant package in the family after projection**, and the cleanest by ratio (SLOC-adjusted): zero open `z.object`, zero `.extend()/.omit()/.pick()/.partial()/.required()` chains, zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME`, zero `console.log` in src (only `console.error` — stdio-correct), correct Zod-first input parsing via `parseAtBoundary`, uniform `defineToolHandler<TSchema>` builder that prevents schema/handler drift, the **only** package besides projection that consumes `parseAtBoundary` at trust boundaries, 55% `@architect-pattern` annotation rate (matches guard's 55%, beats cli's 15%), and a per-tool input contract that **derives composable shapes from projection's own `OptionsSchema.unwrap().shape`** — the only place in the family where boundary schemas literally reuse the downstream contract (`tool-input-schemas.ts:65,90,93,109`).

The package's posture is **operationally minimal**: 9 files, no internal duplication, clean dependency direction. The findings divide into three classes, all small in cardinality:

1. **MCP-specific operational risks the prior cross-package findings materialize here.** CL-CORE-4 (`self-hosting.ts` IIFE running `createArchitect()` at module load) **does** fire on every mcp boot because `pipeline-session.ts:35` imports `WORKSPACE_TAG_REGISTRY`. CL-CORE-8 (unbounded `Map` cache in `package-resolver.ts`) is **bounded by source-file count and reset on rebuild** in this consumer — the prior concern was over-flagged for the MCP context. H-CORE-8 (27× `structuredClone` per `PatternGraphAPI` read) **amplifies 19× per non-cached tool call** because `getProjectionContext()` is reconstructed for every handler (`tool-registry.ts` 19 occurrences) and projection-side reads then clone the registry each time. C-PROJ-2 (`parseAndProjectOpenQuestionList` raw `ZodError` shape) materializes at `architect_open_questions` and is **invisible to MCP clients as a typed boundary error** — they see a stack trace instead of a `BoundaryParseError`.
2. **One genuine MCP-side correctness defect.** `runtime-bridge.js:6` carries the **same Windows-breaking `new URL(...).pathname` bug as architect-cli** (Phase 4 cli F4A-CLI-H-4) — identical line, identical fix. The two files differ only in the error-message package name and the export name. They should be one workspace template, not two copies.
3. **One contract / inventory drift, several documentation gaps.** `package.json:4` description says "18 tools" but `tool-metadata.ts:1-71` registers **21 tools** (confirmed against the frozen list at `tests/features/architect-mcp-integration.feature.steps.ts:27-49`). No package README. No ADR/PDR references in source. `process.chdir()` is used inside `withWorkingDirectory()` (`pipeline-session.ts:259-271`) which is **not race-safe under concurrent rebuild requests** (and the FSM is supposed to coalesce them but the chdir is the lock-free part). The runtime monkey-patches `globalThis.console.log` with `Reflect.set` (`server.ts:203-205`) — a stdio-correctness band-aid that should be a `no-restricted-syntax` lint elsewhere instead.

**Compared to the family:**

- **vs projection (the reference):** mcp matches projection on `z.strictObject` discipline, exceeds it on per-file `@architect-pattern` rate, but has **no custom audit scripts** (projection has 2), **no README** (projection has one), and inherits projection's C-PROJ-2 error-shape outlier without a wrapper of its own.
- **vs core/guard:** mcp is far cleaner — none of core's central-contract drift, none of guard's phantom PDR-005 / dead-barrel-surface / tier-a-baseline issues.
- **vs cli:** mcp is the cleaner peer — same `runtime-bridge.js` family, but mcp has no dead `src/index.ts` surface (every export has a known role: `PipelineSessionManager`, `McpFileWatcher`, `registerAllTools`, `invokeTool`, `REGISTERED_TOOL_NAMES`, `startMcpServer`) and no `generate-docs.ts`-style hand-rolled argv parser of comparable scope.

**Total cost to ship mcp at doctrine-clean stable:** ~half a day. The recipes are five 1-line edits plus a README write-up. The package is the smallest in the family and the closest to release-ready.

---

## 2. Findings by severity

Phase tags: **1A** code quality, **1B** architecture, **2A** simplification, **2B** cleanup, **3A** testing, **3B** documentation, **4A** TS/Zod, **4B** CI/DevOps.

### Critical (P0 — must fix before next release)

| ID | Title | File:Line | Phase |
|---|---|---|---|
| **C-MCP-1** | `runtime-bridge.js:6` `new URL(...).pathname` Windows-breaking bug; identical to cli's F4A-CLI-H-4. Untypechecked, unlinted (`.js`). Two near-duplicate copies (cli + mcp) instead of one workspace template. | `packages/architect-mcp/runtime-bridge.js:6` | 2B, 4A, 4B |
| **C-MCP-2** | Tool inventory drift — `package.json:4` description claims "18 tools" but the package registers **21**. The frozen test inventory (`architect-mcp-integration.feature.steps.ts:27-49`) is correct; the published description lies. Same inventory misrepresented in AGENTS.md table (which says "21 tools per AGENTS.md"). | `package.json:4`, `tool-metadata.ts:1-71` | 3B, 2B |
| **C-MCP-3** | No package README — joins guard and cli as packages without one. MCP is the *most* user-facing of the three because client configs (`.mcp.json`, Claude Desktop) need install/config guidance the published package currently doesn't supply. | `packages/architect-mcp/README.md` (absent) | 3B |
| **C-MCP-4** | `process.chdir()` in `PipelineSessionManager.withWorkingDirectory` (`pipeline-session.ts:259-271`) — long-running server **mutates global process cwd** during `initialize()` and `rebuild()`. Coalesces rebuilds (`runRebuildLoop` 141-164), but `withWorkingDirectory` runs *inside* the rebuild critical section, and the `try/finally` restoration is **not safe against signals firing during `await operation()`** — SIGINT during build leaves cwd permanently corrupted. Also a hazard if the embedding host (e.g. Claude Desktop) runs other code in the same Node process. | `pipeline-session.ts:259-271`, `:104-106`, `:148-156` | 1A, 1B |

### High (P1 — fix before stable)

| ID | Title | File:Line | Phase |
|---|---|---|---|
| **H-MCP-1** | `getProjectionContext(session)` rebuilt on every tool call — `tool-registry.ts` has 19 invocations. Each call rebuilds the `ProjectionContext` object (`:176-185`). Downstream this amplifies H-CORE-8 (`PatternGraphAPI` 27× `structuredClone` per read), so each MCP tool call pays the clone cost without any caching. Recipe: cache the context on the session at build time (1 line in `buildSession`); replace getter with `session.projectionContext`. | `tool-registry.ts:176-185`, 19 call sites | 1A, 2A, MCP-operational |
| **H-MCP-2** | C-PROJ-2 materializes at the MCP boundary. `architect_open_questions` (`tool-registry.ts:495-503`) calls `projectOpenQuestionList` which throws raw `ZodError` instead of `BoundaryParseError` — every other projection routes through `parseAndProject()`. MCP clients see inconsistent error shapes for this one tool. Fixes when projection's C-PROJ-2 lands; until then, mcp could wrap with `parseAtBoundary` defensively, but the right fix is projection-side. | `tool-registry.ts:495-503`, depends on `architect-projection/projections/pattern-relations/open-question-list.ts:38` | 1A, MCP-operational |
| **H-MCP-3** | `Reflect.set(globalThis.console, 'log', ...)` band-aid (`server.ts:203-205`). Monkey-patches global `console.log` to redirect to stderr because some upstream code (likely architect-core or architect-projection) may emit `console.log` and corrupt the stdio JSON-RPC stream. **This is a symptomatic fix for a doctrine breach elsewhere.** Recipe: family-wide `no-console-log` ESLint rule on production src (allow `console.error` for diagnostics). Once enforced, drop the monkey-patch. | `server.ts:203-205` | 1A, 4B |
| **H-MCP-4** | `CL-CORE-4` materialization confirmed — `pipeline-session.ts:35` imports `WORKSPACE_TAG_REGISTRY` from architect-core, which forces the module-load `createArchitect({ roles: ... }).registry` IIFE at `self-hosting.ts:93-95` to execute on every mcp boot. This pulls scanner+extractor module init into the cold-path, regardless of whether the consumer is self-hosting. Recipe: lazy-init via `let cached; export function getWorkspaceTagRegistry()` in core's `self-hosting.ts`; mcp calls only inside the `if (workspaceSources.input.length > 0 ...)` branch. | `pipeline-session.ts:80-87`, depends on `architect-core/src/config/self-hosting.ts:93-95` | 1B, MCP-operational |
| **H-MCP-5** | Tarball composition: 39 files, 110.7 KB unpacked, 25.4 KB packed. **49% of files are `.map`** (16 `.js.map` + 16 `.d.ts.map`, ~36 KB total). Same family-wide CL-CORE-3 fix (disable sourceMap/declarationMap in `tsconfig.architect-base.json`) cuts mcp tarball roughly in half. | `npm pack --dry-run`, `tsconfig.architect-base.json` | 2B, 4B |
| **H-MCP-6** | `runtime-bridge.js` should be promoted to a workspace template; **two copies exist** (cli + mcp) with `diff` showing only two trivial differences (function name + error message). When the Windows fix lands it has to land twice; when both are converted to `.ts` (cli's Phase 4 H-1) it has to happen twice. Recipe per cli H-CLI-7 was "all 6 bin shims now route through runtime-bridge.js" — same applies family-wide once promoted. | `packages/architect-cli/runtime-bridge.js` vs `packages/architect-mcp/runtime-bridge.js` (identical except names) | 2B |
| **H-MCP-7** | Stdout redirect via `Reflect.set` is silent — no log line announces "remapped console.log → console.error". If an upstream module emits `console.log` after server start, the operator can't tell the remap fired. Combined with H-MCP-3 (the doctrine breach causing the need), this hides regressions. Recipe: count remapped calls in a counter and log the count on shutdown; even better, ban `console.log` in production src and delete the remap. | `server.ts:203-205` | 1A |
| **H-MCP-8** | Shutdown handler (`server.ts:237-252`) **does not wait for in-flight tool calls.** It awaits `watcher?.stop()` (which waits for the in-flight rebuild) and `server.close()` (which closes the transport), but `server.close()` does NOT wait for handlers already running — any tool call in progress is abandoned mid-projection. For idempotent reads this is mostly harmless; for the only mutating tool (`architect_rebuild` — which is also coalesced through the watcher path) it could leave a stale `this.session` reference. Recipe: track in-flight tool calls in `invokeTool`/`registerAllTools` and `await Promise.allSettled(inflightCalls)` before `server.close()`. | `server.ts:237-252`, `tool-registry.ts:634-666` | 1A, 1B |

### Medium (P2)

| ID | Title | File:Line | Phase |
|---|---|---|---|
| **M-MCP-1** | `typecheck` script (`package.json:38`) only invokes `tsconfig.test.json` — same drift as core/projection (CL-CORE-11). Tests fold src in via the test config so this is technically covered, but it diverges from guard+cli which run both. Family normalization candidate. | `package.json:38` | 4B |
| **M-MCP-2** | 3 `as` casts in src: `tool-metadata.ts:76-78` (`as Record<RegisteredToolName, …>` from `Object.fromEntries`), `tool-registry.ts:220` (`as RegisteredToolName`), `tool-registry.ts:643` (`as ToolResult<TOut>`). Two are intrinsic (the `Object.fromEntries` return type and the `unknown→TOut` boundary at `invokeTool`). The `:220` one inside `resolveToolHandler` after `Object.hasOwn` could be replaced with a proper type guard — minor. | `tool-metadata.ts:76`, `tool-registry.ts:220,643` | 4A |
| **M-MCP-3** | `pipeline-session.ts:259-271 withWorkingDirectory` is the family's only `process.chdir` site (per workspace grep). The pattern is necessary for `applyProjectSourceDefaults` because that path consumes `process.cwd()` via core, but the fact that mcp's only long-running server has to chdir-and-restore for every rebuild is a smell in core's API — core should accept `baseDir` as a parameter, not derive from cwd. Cross-package leverage. | `pipeline-session.ts:259-271`, depends on core's `applyProjectSourceDefaults` and `findConfigFile` signatures | 1B |
| **M-MCP-4** | `applyFallbackDefaults` (`pipeline-session.ts:230-257`) mutates its `config` parameter object via `.push()`. Internally consistent, but the function signature uses non-`readonly` arrays and the mutation isn't documented. Recipe: return a fresh `{ input, features }` literal instead. | `pipeline-session.ts:230-257` | 1A, 2A |
| **M-MCP-5** | Two parallel CLI argument parsers: `server.ts:80-152` (production) and `tests/features/architect-mcp-integration.feature.steps.ts` (probably exercises `parseCliArgs` directly). The server parser is hand-rolled like cli's `generate-docs.ts:214-315` (Phase 4 C-CLI-1) — switch statement on flag, manual `index += 1`. Same recipe (`GenerateArgsSchema` + `FLAGS` table + `parseAtBoundary`) would apply but the parser already routes through `ParsedCliArgsSchema.safeParse` after manual assembly, so the doctrine isn't actually breached — just the assembly is verbose. Lower leverage than cli's version. | `server.ts:80-152` | 2A |
| **M-MCP-6** | Inventory drift in `MCP_SERVER_INSTRUCTIONS` (`tool-metadata.ts:85-86`) — a single string passed to McpServer as system-level guidance: *"Use architect_overview first. Then use architect_scope_validate and architect_context for focused delivery work."* This mentions 3 of 21 tools. The text is the same content `buildHelpDocument()` uses but truncated; it's an instructional dead-end if a new tool is added without updating this string. Consider deriving from the metadata. | `tool-metadata.ts:85-86` | 3B |
| **M-MCP-7** | `tool-metadata.ts:75-79` `Object.fromEntries(...).map(...)` is rebuilt at module load every time. Negligible for 21 entries but the `as Record<…>` cast is needed because `Object.fromEntries`'s return type is `{ [k: string]: V }`. Recipe: `Object.fromEntries` followed by `satisfies Record<RegisteredToolName, …>` — but Zod 4 `z.enum(TOOL_NAMES)` + `Object.freeze` is cleaner. Low impact. | `tool-metadata.ts:75-79` | 4A |
| **M-MCP-8** | `tests/fixtures/legacy-taxonomy/removed-input.json` exists but is not referenced in any source/test file I can see — orphaned fixture? At minimum check whether the integration steps load it dynamically. Dead-or-implicit-fixture risk. | `tests/fixtures/legacy-taxonomy/removed-input.json` | 2B, 3A |
| **M-MCP-9** | `.DS_Store` files present in `tests/` and `packages/architect-mcp/` (parent) — same housekeeping gap projection and guard had. | `.DS_Store` × 2 | 2B |
| **M-MCP-10** | Tests live in `tests/features/*.steps.ts` AND there's no `tests/steps/` directory. Matches projection convention, diverges from core's `tests/steps/`. Family decision needed (per master report) but mcp is on the right side of the divide. | `tests/features/*.feature` + `*.feature.steps.ts` | 4B |
| **M-MCP-11** | Single 1,195-LOC step file (`architect-mcp-integration.feature.steps.ts`) implementing all step definitions for three feature files. A *single* monolithic step file across 3 features is harder to navigate than 3 colocated step files. Recipe: split per feature (`mcp-server-lifecycle.feature.steps.ts`, `mcp-tool-input-validation.feature.steps.ts`, `mcp-tool-registration.feature.steps.ts`). Cosmetic but matches projection's per-feature shape. | `tests/features/architect-mcp-integration.feature.steps.ts` (1,195 LOC) | 3A |
| **M-MCP-12** | The integration step file is named `architect-mcp-integration.feature.steps.ts` even though there's no `architect-mcp-integration.feature` file (M4 Part B.1 split it into three). The filename is now historical, not descriptive. | `tests/features/architect-mcp-integration.feature.steps.ts` filename | 3A, 3B |
| **M-MCP-13** | `eslint.config.mjs:6-13` uses `parserOptions.project: './tsconfig.test.json'` — fine, but the test-config-only typecheck (M-MCP-1) and the lint-uses-test-config combination means *src files are linted under the test rules*. Test-relaxation block at `:14-23` only applies to `tests/**` — so production src is linted strictly. Verify by inspection — looks correct, but the pattern is fragile (one config edit could leak test rules into src). | `eslint.config.mjs:5-23` | 4B |
| **M-MCP-14** | `runtime-helpers.ts:9-14 readMcpPackageMetadata` reads `../package.json` synchronously at runtime on every call (server start). Not on a hot path so cheap, but the `JSON.parse(fs.readFileSync(...))` could be a one-time module-load constant. Cosmetic. | `runtime-helpers.ts:9-14` | 2A |

### Low (P3)

| ID | Title | File:Line | Phase |
|---|---|---|---|
| L-MCP-1 | `server.ts:67-69 log()` writes to stderr but the brand prefix `[architect-mcp]` is duplicated by callers in `runRebuild`/`scheduleRebuild` (`file-watcher.ts:67,75,111,115`) — but the prefix isn't applied there because they pass through `options.log` injected from `server.ts:182`. Confirmed correct — `log` is the only formatter. No action; noting the pattern is good. | `server.ts:67-69`, `file-watcher.ts:67,75,111,115` | 1A |
| L-MCP-2 | `import path from 'path'` instead of `'node:path'` in `vitest.config.ts:1`. Consistency nit; all other imports in `src/` use `node:` prefix. | `vitest.config.ts:1` | 4A |
| L-MCP-3 | `vitest.config.ts:12 path.resolve(__dirname)` uses CommonJS `__dirname`. ESM equivalent is `import.meta.dirname` (Node 20.11+). Same family hazard as cli's F4A-CLI-M-1. | `vitest.config.ts:12` | 4A |
| L-MCP-4 | `tool-registry.ts:88-91 TextContentResult` has `[key: string]: unknown` index signature — necessary because `@modelcontextprotocol/sdk`'s `registerTool` handler signature expects an open object. Documenting why would prevent a future refactor from "fixing" it. | `tool-registry.ts:88-91` | 1A, 3B |
| L-MCP-5 | `tool-registry.ts:98-107 SectionedDocument` interface defined inline; only used for `architect_search`, `architect_arch_blocking`, `architect_help`. Could be promoted to a contract type if it grows. | `tool-registry.ts:98-107` | 1B |
| L-MCP-6 | `Object.hasOwn(TOOL_HANDLERS, toolName)` check at `tool-registry.ts:216` works but `toolName in TOOL_HANDLERS` is equivalent and uses prototype chain (irrelevant here since TOOL_HANDLERS is a literal). Style nit. | `tool-registry.ts:216-221` | 1A |
| L-MCP-7 | `MAX_HANDOFF_MODIFIED_FILES = 200` (`tool-input-schemas.ts:24`) — magic number. Could move to a shared `LIMITS` const exported from core, since the same limit appears in projection/handoff. | `tool-input-schemas.ts:24` | 1B |
| L-MCP-8 | Test fixture cast: `tests/support/session-fixtures.ts:215` does `new StaticSessionManager(...) as unknown as PipelineSessionManager` — documented at `:185-191` as intentional structural compatibility. Acceptable but worth keeping until / unless the structural-subtyping path becomes a `PipelineSessionManagerLike` interface. | `tests/support/session-fixtures.ts:215` | 3A, 4A |
| L-MCP-9 | `tests/support/session-fixtures.ts:161` casts `dataset.patterns as ExtractedPattern[]` to push a parent pattern that wasn't included. The dataset returned from `transformToPatternGraph` is supposed to be read-only; this fixture mutates it. Test-only, but worth a comment that the mutation is intentional bypass. | `tests/support/session-fixtures.ts:155-162` | 3A |
| L-MCP-10 | `architect_documentation` (`tool-registry.ts:609-626`) is the **only** tool that takes a non-strict-projection context mutation (`filter === undefined ? context : { ...context, projectionFilter: filter }`) — slightly inconsistent with the cleaner `defineToolHandler` pattern. Cosmetic. | `tool-registry.ts:614-625` | 1A |
| L-MCP-11 | `runtime-bridge.js` lives at package root and is shipped via `files: [..., "runtime-bridge.js"]` in `package.json:58-62`. The cli has the same. Both should move to `src/` once typed. | `package.json:58-62`, `runtime-bridge.js` | 2B |

---

## 3. Operational risk surface — MCP is the only long-running consumer

The prior phase reports flagged four findings that the family identified as MCP-materializing. Here's the **measured** materialization in this consumer:

### 3.1 CL-CORE-8 (package-resolver unbounded `Map` cache)

**Materialization:** *Bounded by source-file count; resets on every rebuild.*

`pipeline-session.ts:213` calls `createPackageResolver(...)` *inside* `buildSession()`. Every `rebuild()` replaces `this.session` (line 157) with a fresh session containing a fresh resolver, so the old cache is collectable. The cache grows during a single build pass — at most one entry per `source.file` referenced in the patterns — and is **bounded by the workspace's file count**, not by MCP request volume.

**Risk re-assessed:** The prior cross-package finding (CL-CORE-8) is **less severe in MCP than the family report implied**. It would only be unbounded if `createPackageResolver` were created *once* per session manager and reused across rebuilds — which it isn't. Recommend updating CL-CORE-8's MCP-impact framing in the master report.

### 3.2 CL-CORE-4 (`self-hosting.ts` module-load IIFE)

**Materialization:** *Confirmed — fires on every mcp boot.*

`pipeline-session.ts:35` imports `WORKSPACE_TAG_REGISTRY` from architect-core. Per the bundler's reachability semantics, this forces `architect-core/src/config/self-hosting.ts:93-95` to evaluate at module load:

```ts
export const WORKSPACE_TAG_REGISTRY = createArchitect({
  roles: ARCHITECT_PACKAGE_ROLES,
}).registry;
```

`createArchitect()` constructs the full registry-builder pipeline. This runs **even if the MCP server is consumed by a downstream project that has its own `architect.config.ts`** — `WORKSPACE_TAG_REGISTRY` is only used inside the `if (workspaceSources.input.length > 0 && workspaceSources.features.length > 0)` branch at `pipeline-session.ts:82-86`, which only fires for self-hosting workspaces. **Other consumers pay the cost and get nothing.**

**Recipe (in core):** `let cached: TagRegistry | undefined; export function getWorkspaceTagRegistry(): TagRegistry { return cached ??= createArchitect({ roles: ARCHITECT_PACKAGE_ROLES }).registry; }`. Then `pipeline-session.ts:85` becomes `tagRegistryOverride = getWorkspaceTagRegistry();`. One-line consumer change; eliminates cold-path cost for every non-self-hosting consumer.

### 3.3 H-CORE-8 (`structuredClone` 27× per `PatternGraphAPI` read)

**Materialization:** *Amplifies 19× per non-cached tool call.*

`tool-registry.ts` calls `getProjectionContext(session)` (`:176-185`) **19 times** — once per handler that needs context (not in `architect_search`, `architect_arch_blocking`, `architect_help`, which build their own documents from cached data; once per tool for the remaining 18). The context construction itself is cheap (object literal), but the downstream `project*` functions then invoke `PatternGraphAPI` reads, which clone the registry per `PatternGraphAPI` method call (H-CORE-8).

**Concrete cost per tool call (estimated upper bound):**
- 1 `getProjectionContext()` construction (~3 field copies — negligible).
- N `PatternGraphAPI` method calls inside the projection (varies by projection, 1–~10).
- Each method call: 27× `structuredClone` of the registry (per H-CORE-8).

For `architect_overview` (which calls `projectOverviewDigest` — multiple aggregations), this is **easily 100+ clones per tool call**. For a session that does an MCP burst of ~5 verbs (the threshold the architect-data-api skill recommends switching to MCP), this is **500+ clones per burst** — entirely avoidable.

**Recipe (core-side):** Land H-CORE-8 / H-SIMP-2 (single `deepFreeze` at API construction, drop the clones). Re-baseline projection's perf gate after. MCP gets the benefit transparently.

**Recipe (mcp-side, independent — H-MCP-1):** Cache `ProjectionContext` on the session at build time. `buildSession` produces `projectionContext` once; `tool-registry.ts:176-185` becomes `function getProjectionContext(session) { return session.projectionContext; }`. Saves the 19 reconstructions per server lifecycle but doesn't address the clone cost — that's on core.

### 3.4 C-PROJ-2 (raw `ZodError` from `parseAndProjectOpenQuestionList`)

**Materialization:** *Confirmed — MCP clients see an inconsistent error shape for one tool.*

`tool-registry.ts:495-503` invokes `projectOpenQuestionList` which (per projection's C-PROJ-2) throws raw `ZodError`. Every other MCP tool handler routes input through `parseAtBoundary` (line 236) and gets a typed `BoundaryParseError`. For `architect_open_questions`, the projection-side validation throws after the MCP boundary parse passes — clients see a different shape (stack trace, no `cause`, no `validationIssues`).

**Recipe:** Fix in projection (the action plan there has this as Sweep 2 step 6). Until then, mcp could `try/catch` and re-throw as `BoundaryParseError`, but the doctrine-correct path is to fix projection.

### 3.5 File-watcher correctness

**Coalescing:** Correct. `scheduleRebuild` clears the pending timer; `runRebuild` is single-flight via `rebuildPromise` (`file-watcher.ts:95-119`). Rebuild errors are caught and logged without crashing (`:114-118`). Matches the lifecycle invariant documented at `mcp-server-lifecycle.feature:29-35`.

**Chokidar config:** `watch([...this.options.globs], { cwd: this.options.baseDir, ignoreInitial: true })` (`file-watcher.ts:57-60`). **No `awaitWriteFinish`** — bursty IDE saves (Vim, VSCode atomic write) may fire `add` before file is fully written, causing the rebuild to read partial content. The downstream parser would fail, error-isolation catches it, next save re-rebuilds. Not a correctness bug but wastes one rebuild cycle per atomic write. Recipe: add `awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }`.

**`'error'` handler:** Logs but does not crash (`:71-73`). Correct for stdio robustness — a watcher error shouldn't kill the server.

### 3.6 Graceful shutdown — in-flight tool calls (H-MCP-8)

The shutdown sequence (`server.ts:237-252`):
1. Set `shuttingDown = true` (one-shot guard).
2. Log.
3. `await watcher?.stop()` — waits for pending timer cleared + in-flight rebuild to finish.
4. `await server.close()` — closes the stdio transport.
5. `process.exit(0)`.

**Gap:** `server.close()` (from `@modelcontextprotocol/sdk`) closes the transport but does **not** await in-flight `registerTool` handlers. If a tool call is mid-projection (which can take 100+ ms for `architect_overview` etc.), the response promise will reject when the transport closes. The MCP client sees a transport-closed error mid-call instead of a clean response.

This is mostly cosmetic for the read-only tools, but `architect_rebuild` is mutating — if a rebuild is in flight when SIGINT arrives, `watcher?.stop()` will await it (✓), but a separate `invokeTool('architect_rebuild', ...)` initiated by an MCP client (not via the watcher) goes through `sessionManager.rebuild()` directly and is **not tracked by the watcher**'s in-flight set. The shutdown could close the transport mid-rebuild, leaving `this.session` in an inconsistent state if the rebuild crashes.

**Recipe:** Track in-flight handler promises in a `Set<Promise<void>>` inside `registerAllTools` and `invokeTool`; await `Promise.allSettled([...inflight])` before `server.close()`. Same fix should apply to the MCP-client-initiated `architect_rebuild` path.

---

## 4. Zod 4 + TS strictness audit (compact tables)

### 4.1 Zod 4 idioms

| Check | Result | Evidence |
|---|---|---|
| `z.strictObject` everywhere on closed records | ✅ 4 sites, 0 `z.object` | `tool-input-schemas.ts:26,69`; `server.ts:53,62-64` |
| `.extend()/.omit()/.pick()/.partial()/.required()` chains (Zod 4 strictness-loss bug) | ✅ Zero | grep across `src/` |
| `.brand<…>()` declarations | ✅ Zero — consumes core's brands implicitly via `SafeStringSchema`, `NonEmptySafeStringSchema`, `AcceptedStatusSchema`, etc. (per F4A-CLI-H family-wide gap recommendation) | `tool-input-schemas.ts:8-14` |
| `.unwrap()` on `Optional`/`Readonly` | ✅ 4 sites, all on projection's `*OptionsSchema` to derive composable shapes | `tool-input-schemas.ts:65,90,93,109` |
| `z.discriminatedUnion` | ✅ 1 site | `server.ts:61-65` |
| `z.input` vs `z.output` separation | N/A — MCP boundary inputs are simple closed records; no asymmetric transforms |
| `parseAtBoundary` adoption | ✅ Single site at `tool-registry.ts:236` (the universal entry) | `tool-registry.ts:223-237` |
| `z.function().optional()` (Zod 3 deprecated idiom) | ✅ Zero |
| `z.ZodReadonly` / `.readonly()` chains | ✅ Used pervasively at boundaries | `tool-input-schemas.ts:28-30,59,72`; `server.ts:54-64` |

### 4.2 TS strictness

| Check | Result | Evidence |
|---|---|---|
| `@ts-ignore` / `@ts-expect-error` | ✅ Zero |
| `// eslint-disable*` | ✅ Zero |
| `TODO`/`FIXME` | ✅ Zero |
| `as` casts (production src) | ⚠️ 3 — see M-MCP-2 | `tool-metadata.ts:76`, `tool-registry.ts:220,643` |
| `as unknown as X` | ✅ Zero in src (1 in tests, documented — L-MCP-8) |
| `void X` expression statements | ✅ Zero in src; 1 intended `void shutdown(...)` in server.ts | `server.ts:248,251` |
| `void main()` async-call (family hazard) | ⚠️ 1 site — `cli/mcp-server.ts:23 void startMcpServer(...).catch(...)`. Same hazard family as core F4A-H-9 / guard F4A-G-H-5 / cli 2 sites. | `cli/mcp-server.ts:23` |
| `Set.has` narrowing issues (C-CORE-5 pattern) | ✅ Zero — uses string equality and `Object.hasOwn` instead |
| `noUncheckedIndexedAccess` strictness | ✅ Server's argv parse handles `undefined` index access correctly (`server.ts:108-113`) |
| `noPropertyAccessFromIndexSignature` issues | ✅ Zero |
| `verbatimModuleSyntax` (`import type`) | ✅ Honored — verified across pipeline-session.ts, tool-registry.ts |
| `node:` prefix on builtins | ⚠️ 1 miss — `vitest.config.ts:1 import path from 'path'` (L-MCP-2) |

### 4.3 Suppressions / soft-removal

- Zero `@ts-ignore` / `@ts-expect-error` / `// eslint-disable*` / `@deprecated` / BC-alias re-exports.
- 1 `void X` async-call (cli/mcp-server.ts:23) is the family-wide pattern, not a soft suppression.
- 1 stdout-redirect monkey-patch (`server.ts:203-205 Reflect.set`) is a workaround for an upstream doctrine breach — fix at the source, not here.

---

## 5. Configuration audit vs family

| Aspect | mcp | core | projection | guard | cli | Notes |
|---|---|---|---|---|---|---|
| `publishConfig.access: public` | ✅ | ✅ | ✅ | ✅ | ✅ | aligned |
| `publishConfig.provenance: true` | ✅ | ✅ | ✅ | ✅ | ✅ | declared without CI to issue attestation (family CI gap) |
| `type: module` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sideEffects: false` | ✅ | ✅ | ✅ | ✅ | ✅ | (despite `Reflect.set(globalThis.console, ...)` side-effect on startup — that's inside a function, not module-load, so the declaration is honest) |
| `prepack` script | ✅ in `scripts` | ❌ at JSON root (C-CORE-6) | ✅ | ✅ | ✅ | mcp on the right side of CL-CORE-1 |
| `typecheck` covers both configs | ❌ test-only | ❌ | ❌ | ✅ | ✅ | M-MCP-1; matches core/projection drift |
| Bin shim via `runtime-bridge.js` | ✅ | N/A | N/A | N/A | ✅ | H-MCP-6 (two copies) |
| Family-wide Windows runtime-bridge bug | ⚠️ Yes (C-MCP-1) | N/A | N/A | N/A | ⚠️ Yes (F4A-CLI-H-4) | identical bug at line 6 in both copies |
| README in package | ❌ (C-MCP-3) | ⚠️ (TD-CORE-2) | ✅ | ❌ (DOC-C-GUARD-2) | ❌ (DOC-CLI-C-1) | mcp joins the family majority — 4 of 5 publishable packages lack a good README |
| Custom audit scripts | ❌ | ❌ | ✅ × 2 | ❌ | ❌ | projection-side promotion candidate |
| Perf gate | N/A | N/A | ✅ (just needs wiring) | N/A | N/A | mcp does not have one and arguably should — a startup time + per-tool latency budget |
| `vitest.config.ts` `__dirname` | ⚠️ Yes (L-MCP-3) | ✅ | ✅ | ✅ | ⚠️ Yes (F4A-CLI-M-1) | shared family hazard |
| `.DS_Store` files in tree | ⚠️ Yes (M-MCP-9) | ✅ clean | ⚠️ Yes | ⚠️ Yes | ✅ clean | housekeeping |
| `lint` script glob | `eslint src tests` (covers both — correct) | misses tests (CL-CORE-10) | ⚠️ | ⚠️ | ⚠️ | mcp on the right side |
| `files:` field | `["bin", "dist", "runtime-bridge.js"]` | similar | similar | similar | similar | aligned |

---

## 6. Cross-package implications

1. **`runtime-bridge.js` workspace promotion is now urgent.** Two copies, two Windows-broken lines, blockers for any consumer on Windows. cli's Phase 4 H-1 already recommended this — mcp confirms the leverage. Recipe: workspace-level `runtime-bridge.ts` template in `packages/_internal/` or similar, generate per-package shim from a `pnpm` post-install or just symlink + copy. Doing this as one PR (a) closes both cli and mcp Windows bugs, (b) closes cli H-CLI-7 + mcp H-MCP-6 in one stroke, (c) sets the family template for future bins.
2. **H-CORE-8 (`PatternGraphAPI` clones) materialization confirmed.** MCP amplifies the cost 19× per tool burst. The family priority for H-CORE-8 should rise from "preserves perf gate budget headroom" to "removes the MCP per-tool overhead" — same recipe, more leverage.
3. **CL-CORE-4 confirmed as MCP cold-path cost.** Affecting every mcp boot regardless of whether the consumer is self-hosting. Lazy-init in core is the right fix; the consumer change in mcp is trivial.
4. **C-PROJ-2 confirmed as MCP-side error-shape inconsistency.** Routes one of 21 tools to a different error shape. Fix in projection is doctrine-correct.
5. **CL-CORE-8 re-framed.** MCP's session-replacement on rebuild bounds the resolver cache and resets it — the prior "MCP-materializes-as-leak" framing was over-strong. Update CL-CORE-8 severity in master report.
6. **Family `console.log` doctrine.** mcp's `Reflect.set(globalThis.console, 'log', ...)` band-aid exists because upstream emits `console.log` (a family-wide rule would have caught it). Master report should propose `no-console-log` ESLint rule on production src family-wide (banning `console.log` but allowing `console.error` for diagnostic channels). Once enforced, drop mcp's monkey-patch. Two birds, one rule.
7. **`void main()` ESLint rule** (proposed for core F4A-H-9 / guard F4A-G-H-5 / cli 2 sites) closes mcp's `cli/mcp-server.ts:23` too.
8. **MCP-specific perf gate** doesn't exist anywhere in the family. Projection's gate measures projection latency; an MCP-server gate (cold start, per-tool-burst latency) would catch H-MCP-1 / H-MCP-4 regressions before publication. Lower priority but the right place to put it is in mcp's own `tests/perf/`.
9. **Tool inventory drift (C-MCP-2)** is a documentation issue but bleeds into AGENTS.md and `.full-review/00-scope.md` (both say 18 tools). Single PR aligns description + AGENTS.md table + scope doc to "21 tools".
10. **MCP is the family's only long-running consumer**, but the operational concerns boil down to **two cross-package recipes (CL-CORE-4 lazy-init + H-CORE-8 deepFreeze)** + **two mcp-side recipes (H-MCP-1 context cache + H-MCP-8 in-flight tracking)**. That's a complete, bounded scope.

---

## 7. What's healthy (preserve)

- **`parseAtBoundary` at the single MCP entry** (`tool-registry.ts:236`) — Zod-first doctrine done right; matches projection's `parseAndProject`/cli's `parseCommandInput`. Single trust boundary.
- **`defineToolHandler<TSchema>` builder** (`tool-registry.ts:135-148`) — type-preserving registration that prevents schema-vs-handler drift. Family reference for tool-registration patterns.
- **`createStrictReadonlyObjectSchema`** (`tool-input-schemas.ts:26-30`) — single helper enforces `z.strictObject(...).readonly()` for every tool input. Doctrine in one helper. Family-reference quality.
- **Schema reuse from downstream** (`tool-input-schemas.ts:65,90,93,109`) — MCP boundary contracts are *literally* projection's `OptionsSchema.unwrap().shape`. The only place in the family where the boundary contract = the consumer contract. Excellent.
- **Frozen tool inventory test** (`mcp-tool-registration.feature:181-193`) — pinned via test against the public contract. Refreshing a tool requires updating the frozen list in the step file (line 27-49). Per-tool happy-path tests for all 21.
- **Tool-input validation coverage** — `mcp-tool-input-validation.feature` covers strict-object rejection (unknown keys), enum rejection (`session` enum), empty-string rejection, conflict rejection (`pattern` vs `productArea`), and removed-taxonomy-fixture rejection. Exhaustive for the input layer.
- **Lifecycle invariants documented in source** + Gherkin (`mcp-server-lifecycle.feature` 4 Rules) — `@contract` scenarios pin the source-side commitment through static checks rather than live integration; matches the family pattern.
- **Clean file partition** — 9 files, each with a single responsibility (`pipeline-session` = state, `file-watcher` = chokidar, `tool-input-schemas` = Zod shapes, `tool-metadata` = inventory, `tool-registry` = handlers, `server` = composition root, `runtime-helpers` = path/process utilities, `cli/mcp-server.ts` = bin entry, `index.ts` = barrel). Zero entanglement.
- **Single-flight rebuild semantics** (`pipeline-session.ts:111-128` + `file-watcher.ts:95-119`) — coalescing under concurrent load works correctly per the lifecycle feature.
- **Error isolation** — `runRebuild` catches and logs without crashing the server (`file-watcher.ts:114-118`); the dataset is replaced atomically (`pipeline-session.ts:157`).
- **stdio correctness** — no `console.log` in src; `log()` uses `console.error`; `Reflect.set` band-aid (H-MCP-3) protects against upstream emissions. The protocol stream is never corrupted by mcp's own code.
- **Dependency hygiene** — pristine workspace pins, `chokidar ^5.0.0`, `@modelcontextprotocol/sdk ^1.29.0`, `zod ^4.1.11`. No drift.
- **Empty barrel surface** (`src/index.ts:1-14`) — 5 named exports, zero `export *` wildcards. Closest to "named export only" doctrine in the family (vs guard's 12 wildcards, cli's dead surface).
- **Phantom ADR/PDR check** — clean. No PDR-005 or ADR-NNN references in `src/`. Doesn't propagate guard's phantom-reference defect.
- **`@architect-pattern` annotation rate** — 5 of 9 files (55%, matches guard's rate; below projection's 60%). Top-level files (`pipeline-session`, `file-watcher`, `tool-registry`, `server`, `cli/mcp-server`) all annotated. Utility files (`runtime-helpers`, `tool-input-schemas`, `tool-metadata`, `index`) intentionally unannotated — defensible.
- **Tool descriptions exposed to MCP clients** are accurate, concise, and match the actual handler behavior (verified by reading `tool-metadata.ts` against `tool-registry.ts`).
- **Zero `console.log`** in src — only `console.error` for stderr diagnostics. Stdio-clean by construction.

---

## 8. Recommended action plan (ordered by leverage)

### Sweep 1 — Quick wins (1 hour, ~10 lines)

1. **Fix `runtime-bridge.js:6` Windows bug** (C-MCP-1) — replace `new URL(import.meta.url).pathname` with `fileURLToPath(new URL('.', import.meta.url))`. Mirror cli's identical fix. Drop ad-hoc; consider workspace template in same PR (H-MCP-6).
2. **Fix `package.json:4` tool-count drift** (C-MCP-2) — "18 tools" → "21 tools"; same edit in AGENTS.md table + `.full-review/00-scope.md` for consistency.
3. **Delete the orphaned `tests/fixtures/legacy-taxonomy/removed-input.json` if unused** (M-MCP-8) — verify with grep first.
4. **`.gitignore .DS_Store` + delete tracked copies** (M-MCP-9).

### Sweep 2 — Family-cross-cutting fixes that land in core/projection but unblock MCP (depend on prior-package work)

5. **CL-CORE-4 lazy-init in core** (H-MCP-4) — `let cached; export function getWorkspaceTagRegistry()` recipe in core's `self-hosting.ts:93-95`. mcp's consumer change is `pipeline-session.ts:85: tagRegistryOverride = getWorkspaceTagRegistry();` — one line.
6. **H-CORE-8 deep-freeze in core** (H-MCP-1 amplification) — eliminates the 19× clone cost per MCP tool call. Independent of mcp-side caching but lands cleaner together.
7. **C-PROJ-2 fix in projection** (H-MCP-2) — once `parseAndProjectOpenQuestionList` routes through `parseAndProject`, mcp's `architect_open_questions` boundary error shape becomes consistent with the other 20 tools. No mcp-side change required.

### Sweep 3 — MCP-side doctrine + operational fixes (half a day)

8. **H-MCP-1: Cache `ProjectionContext` on the session.** `buildSession` returns `{ ..., projectionContext: { graph, packageResolver, ... } }`; `getProjectionContext(session)` becomes `session.projectionContext`. Eliminates 19 reconstructions per server lifecycle.
9. **H-MCP-8: Track in-flight tool calls.** `invokeTool` and `registerAllTools` push to a `Set<Promise<void>>`; `shutdown()` does `await Promise.allSettled([...inflight])` before `server.close()`. ~15 LOC.
10. **C-MCP-4: Make `withWorkingDirectory` signal-safe** (`pipeline-session.ts:259-271`) — either drop the chdir entirely (push `baseDir` into core's `applyProjectSourceDefaults` / `findConfigFile` signatures — see M-MCP-3) or wrap with a one-shot signal interceptor that defers SIGINT until the `finally` block runs. The cleaner fix is core-API parameter passing; the local fix is signal deferral.
11. **H-MCP-3: Remove `Reflect.set` console monkey-patch** once family-wide `no-console-log` rule lands. Until then, log the activation as a warning so operators know it fired.
12. **L-MCP-2, L-MCP-3: `vitest.config.ts`** — `import path from 'node:path'`; `path.resolve(import.meta.dirname)`. Two-line cleanup.
13. **M-MCP-4: Drop `applyFallbackDefaults` parameter mutation** — return a fresh `{ input, features }` object.
14. **M-MCP-11/M-MCP-12: Split the 1,195-LOC step file** into three per-feature files; rename to match the surviving feature names.

### Sweep 4 — Documentation (4 hours)

15. **C-MCP-3: Write `packages/architect-mcp/README.md`.** Use projection's README as template. Cover: install (`pnpm add -D @libar-dev/architect-mcp` + `bin/architect-mcp`), `.mcp.json` snippet, `claude_desktop_config.json` snippet, `--input`/`--features`/`--base-dir`/`--watch` flags, the 21 tools, link to the data-api skill, link to ADR-006 (single read model) since mcp is the canonical long-running consumer of that read model.
16. **M-MCP-6: `MCP_SERVER_INSTRUCTIONS` derivation** — generate the instruction text from `ARCHITECT_MCP_TOOLS` so adding a tool doesn't require updating two strings.
17. **Annotate `runtime-helpers.ts`, `tool-input-schemas.ts`, `tool-metadata.ts`, `index.ts`** with `@architect-pattern` blocks. Push annotation rate from 55% → 100%.

### Sweep 5 — Family-wide normalization (master report)

18. **`runtime-bridge` workspace template** (H-MCP-6 + cli H-CLI-7) — one shared `.ts` source, two consumers, one Windows fix.
19. **Family-wide `no-console-log` ESLint rule** (closes H-MCP-3 root cause family-wide + the upstream emitter that necessitated the monkey-patch).
20. **Family-wide `void main()` ESLint rule** (closes mcp's `cli/mcp-server.ts:23` + core F4A-H-9 + guard F4A-G-H-5 + cli 2 sites).
21. **Family-wide `sourceMap`/`declarationMap` disable** (CL-CORE-3 / H-MCP-5) — halves mcp tarball from 110.7 KB → ~55 KB unpacked.
22. **Family-wide `typecheck` script alignment** (M-MCP-1 / CL-CORE-11) — both configs, guard/cli already correct; mcp/core/projection drift.

### Sweep 6 — Optional MCP perf gate (1 day, nice-to-have)

23. **Add `tests/perf/`** in mcp — cold-start budget (`startMcpServer` → "Server ready" log), per-tool-burst latency budget (e.g. 5-tool sequence: `architect_overview` → `architect_pattern` → `architect_files` → `architect_dep_tree` → `architect_context`). Use projection's perf-gate template. Catches CL-CORE-4 / H-CORE-8 / H-MCP-1 regressions before publication.

---

## 9. Numbers

- **Findings logged:** 4 Critical + 8 High + 14 Medium + 11 Low = **37 total** (lowest count in the family).
- **`z.strictObject` callsites:** 4 (in 1,630 SLOC — highest density in the family).
- **`z.object` callsites:** 0.
- **`.extend()/.omit()/.pick()/.partial()/.required()` chains:** 0 (matches guard, cli; does NOT expose to family-wide Zod 4 strictness-loss bug).
- **`@ts-ignore`/`@ts-expect-error`/`eslint-disable`/`TODO`/`FIXME`/`void X`:** 0 (matches family doctrine).
- **`as` casts in src:** 3 (M-MCP-2 — two intrinsic at type-system boundaries, one removable).
- **`@architect-pattern` annotation rate:** 55% (5 of 9 files).
- **`parseAtBoundary` call sites:** 1 (universal entry — correct pattern).
- **MCP tools registered:** 21 (per inventory).
- **MCP tools tested:** 21 of 21 — happy-path (`mcp-tool-registration.feature` 23 scenarios) + boundary (`mcp-tool-input-validation.feature` 13 scenarios) + lifecycle (`mcp-server-lifecycle.feature` 4 scenarios) — coverage **strongest in family by tools-per-bin ratio.**
- **Tarball:** 39 files, 25.4 KB packed / 110.7 KB unpacked. Family-wide CL-CORE-3 fix would cut this roughly in half.

---

## 10. Overall verdict

`architect-mcp` is **the closest publishable package to stable-release-ready in the family**, edging out projection on doctrine compliance per SLOC. It demonstrates the doctrine in compact form: one trust boundary, one helper for strict input objects, one type-preserving handler builder, one frozen inventory, one stdio-clean log function, one composition root. The Critical findings are **operational rather than architectural** — a Windows-breaking bug in a 25-line bridge file, a docstring claiming the wrong tool count, no README, and one `process.chdir` race that's symptomatic of a core-API smell. None breach doctrine.

The MCP-specific operational concerns flagged by the family (CL-CORE-4, CL-CORE-8, H-CORE-8, C-PROJ-2) materialize **partially**: CL-CORE-4 confirmed (every-boot cost), H-CORE-8 amplification confirmed (19× per tool burst), C-PROJ-2 confirmed (one tool's error shape inconsistent), CL-CORE-8 **re-framed** (bounded by source-file count and reset on rebuild — less severe than the family report implied for this consumer).

The single highest-leverage cross-package move that touches mcp is **family-wide `runtime-bridge` template + Windows fix**: it closes cli's identical bug, eliminates the two-copy drift hazard, and sets the template for any future bin in the family. Combined with **family-wide `no-console-log` ESLint rule** (which would have made H-MCP-3's monkey-patch unnecessary in the first place) and **core-side CL-CORE-4 lazy-init** (which closes H-MCP-4 with a one-line consumer change), mcp's release-readiness is roughly half a day of focused work plus the README.

The package's identity as "thin MCP server over Architect's read API" is accurate. Preserve it.
