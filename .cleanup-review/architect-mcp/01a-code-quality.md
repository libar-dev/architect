# `@libar-dev/architect-mcp` — Code Quality Review

Scope: `packages/architect-mcp/src/**` (9 files, ~1.6k LOC). Focus per `.cleanup-review/architect-mcp/00-scope.md`.

Findings are grouped by severity. File:line refers to the current `main` revision.

---

## Critical

### C1. ADR-009 re-parse on the hot path: three tools call `parseAndProject*` after the boundary already parsed

- **File:** `packages/architect-mcp/src/tool-registry.ts:575-625`
- **Impact:** The MCP entrypoints `parseToolInput` (line 223–237) parse each tool's raw input exactly once at the trust boundary — that is the ADR-009 contract. Inside `architect_rebuild` (line 575), `architect_config` (line 593), and `architect_documentation` (line 609), the handler then calls `parseAndProjectConfig(...)` / `parseAndProjectDocumentationBundle(...)`. Those are the boundary wrappers (`parseAndProject` at `packages/architect-projection/src/projections/_shared/parse-and-project.internal.ts`); they re-`parseAtBoundary` the typed options on every call. So for these three tools, options are parsed twice per invocation — and `architect_documentation` and `architect_config` are user-callable hot paths. The doctrine in the file header (line 353–359) explicitly anchors the registry on the "parse once" rule, so this is a contract violation in addition to a perf miss. Every other handler in the file uses the typed `project*` form (`projectOverviewDigest`, `projectPatternDetail`, `projectStatusDistribution`, …) which is the correct form.
- **Remediation:** Swap the three calls to the typed builders that already exist:
  - `parseAndProjectConfig` → `projectConfig` (`packages/architect-projection/src/projections/documentation-composition/project-config.ts:48`)
  - `parseAndProjectDocumentationBundle` → `projectDocumentationBundle` (`packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts:35`)
  - The handler-built options object is already shaped by Zod via `parseToolInput`, so the typed builder accepts it directly.
- **Verification:** `pnpm --filter @libar-dev/architect-mcp test` should pass; add a focused vitest assertion that wraps `parseAtBoundary` with a spy and confirms it fires exactly once per `invokeTool` call for `architect_documentation` and `architect_config`.

### C2. Process-level `console.log` monkey-patch is a permanent global mutation

- **File:** `packages/architect-mcp/src/server.ts:203-205`
- **Impact:** `Reflect.set(globalThis.console, 'log', …)` rewrites `console.log` to route through `console.error` for the entire Node process and never restores it. The repo just shipped `676a916 fix(mcp): remove global cwd mutation` to close the same anti-pattern; this is the same shape — a long-lived global side effect from a server bootstrap that other in-process code (Studio main process, tests, future programmatic embeddings) will inherit. The protocol concern (stdout must stay reserved for MCP framing) is real, but globally hijacking `console.log` is the wrong instrument. It also escapes `startMcpServer` cleanup — `shutdown` (line 237) does not restore it.
- **Remediation:** Hold the original `console.log` reference, restore it in `shutdown`. Better: route framework logging through the MCP server's `logging` capability already declared at line 217, and constrain user code from writing to stdout via a doc note rather than mutating the global. Cleanest option — provide an `McpServer`-scoped logger and inject it; do not touch `globalThis`.
- **Verification:** Add a vitest case that starts the server, triggers `shutdown('SIGTERM')`, and asserts `console.log === originalConsoleLog`. The existing `mcp-runtime-hardening.feature` already proves the cwd invariant — extend that file with a `console mutation` rule.

### C3. `architect_search` and `architect_arch_blocking` invent an MCP-only `SectionedDocument` shape — CLI / MCP twin drift

- **File:** `packages/architect-mcp/src/tool-registry.ts:98-107, 252-326, 505-517, 567-573`
- **Impact:** Per the `architect-data-api` skill, MCP twins must return the same shape as their CLI counterparts. `architect_search` returns `{kind: 'SectionedDocument', sections: [...]}` (line 295) while the CLI returns a plain JSON array `[{patternName, score, matchType}]`. `architect_arch_blocking` is the same — invented sectioned document wrapper that does not exist in the projection package (`grep -rn SectionedDocument packages/architect-projection` is empty). This is documented twin-discipline drift; programmatic consumers cannot use the same parser for CLI and MCP. It also means these two tools bypass the `ProjectionBundle<TFragment>` envelope that every other tool returns, breaking the uniform `renderTextToolResult` / `renderJsonToolResult` contract.
- **Remediation:** Replace `buildSearchResultsDocument` / `buildBlockingDocument` with projections that already exist in `architect-projection` (or add them if missing — `projectSearchResults`, `projectArchBlocking`). The CLI handler for `arch blocking` already projects `OverviewDigest.root.blocking`; reuse that same fragment shape here. Delete the `SectionedDocument` interface, the two `build*Document` helpers, and `renderPlainJsonToolResult` once unused.
- **Verification:** Add a regression scenario in `tests/features/mcp-tool-registration.feature` that asserts CLI vs MCP shape parity for `search` and `arch blocking`. `pnpm test:dogfood` should pass.

---

## High

### H1. `EmptyInputSchema` as a `z.union([strictObject({}), z.undefined()])` is registered as the MCP `inputSchema`

- **File:** `packages/architect-mcp/src/tool-input-schemas.ts:112` and `tool-registry.ts:646-665`
- **Impact:** Six tools use `EmptyInputSchema` (overview, coverage, status, arch_blocking, rebuild, config, help). The MCP SDK derives the JSON-Schema advertised to clients from this Zod schema. A `union(strictObject({}) | undefined)` produces an `oneOf` schema with a `null` / `undefined` branch — that confuses some MCP clients that expect a plain object schema with `additionalProperties: false`. The `parseToolInput` guard (line 228–234) already normalizes `undefined` / `null` → `{}` before parsing, so the `z.undefined()` branch in the schema is redundant for runtime and harmful for the client-facing schema.
- **Remediation:** Make `EmptyInputSchema = createStrictReadonlyObjectSchema({})`. Keep the `parseToolInput` normalizer as the runtime relaxation. The schema advertised to clients then becomes a clean `{type: 'object', additionalProperties: false}`.
- **Verification:** Call `server.listTools()` via the MCP test harness and snapshot the advertised JSON schema for `architect_overview`.

### H2. `architect_files` mutates the documented contract — `related` default is `true`, not `false`

- **File:** `packages/architect-mcp/src/tool-registry.ts:387-402`
- **Impact:** Handler is `includeRelated: related !== false`. So when the caller omits `related`, MCP defaults to `true`; the CLI's `files <Pattern>` (without `--related`) defaults to `false` and only adds related sections when `--related` is passed. The MCP tool description on line 11 says "Ordered file reading list for a pattern" — no mention of bundling related deps. CLI/MCP shapes diverge for the most common call site (no flag). Also leaks much more data than asked.
- **Remediation:** Change to `includeRelated: related === true` so default matches CLI. If the intent was a more useful default for agents, update both the CLI default and the tool description so they remain in lockstep.
- **Verification:** Snapshot-compare CLI `files MCPToolRegistry` vs `invokeTool('architect_files', {name: 'MCPToolRegistry'})` outputs.

### H3. `architect_rules` requires `pattern` xor `productArea` but the schema does not encode it

- **File:** `packages/architect-mcp/src/tool-registry.ts:519-549`, `tool-input-schemas.ts:97-101`
- **Impact:** `RulesFilterShape` makes both `pattern` and `productArea` independently optional; the handler then throws `'pattern and productArea cannot be used together'` at line 523. Imperative validation after a strict-object boundary is exactly the anti-pattern Zod-first is meant to remove — the constraint should be on the schema so clients see it in the advertised JSON-Schema and so the error message routes through the standard `parseAtBoundary` formatting. Today the error path is also untyped (bare `Error`) and not surfaced as a Zod issue.
- **Remediation:** Use a discriminated union: `z.union([z.strictObject({pattern: SafeStringSchema, onlyInvariants: ...}), z.strictObject({productArea: SafeStringSchema, onlyInvariants: ...}), z.strictObject({onlyInvariants: ...})])`. Or `z.strictObject({...}).refine(d => !(d.pattern && d.productArea), {message: 'pattern and productArea are mutually exclusive'})`. Either way, the imperative `throw` at line 523 disappears.
- **Verification:** Existing input-validation feature should fail with the new schema until the test is updated; add a scenario for the mutual-exclusion case.

### H4. Watcher / `rebuild` race: `getSession()` can hand out a stale session during a long rebuild

- **File:** `packages/architect-mcp/src/pipeline-session.ts:107-158`, `tool-registry.ts:634-644`
- **Impact:** `invokeTool` does `sessionManager.getSession()` BEFORE awaiting the handler. If a rebuild is in flight, `getSession()` returns the previous (still-valid) session — that's fine in isolation. But the window between "user edits a file" and "rebuilt session is published" is `debounceMs + buildTimeMs` (typical 500 ms + 50–500 ms). Any tool invocation that arrives during that window reads the pre-edit dataset and returns answers that no longer reflect the source. Worst case: after `architect_rebuild` completes and returns, a still-in-flight tool call that captured the OLD `session` reference earlier (between `getSession()` and the awaited projection) keeps using stale data — but the projection step itself is synchronous, so the practical window is tiny. The real exposure is at the `getSession()` boundary in `registerAllTools` (line 660) where the session is captured once and then passed through the awaited `handle`. If `handle` itself triggers `sessionManager.rebuild()` (only `architect_rebuild` does), it correctly receives `nextSession` (line 578). Good. But the watcher path doesn't gate readers: between `pendingTimer` fire and `rebuildPromise` resolution, readers get stale data without any signal.
- **Remediation:** Acceptable trade-off for read-heavy MCP — but document the staleness window explicitly in `MCPPipelineSession`'s docstring. If stronger guarantees are needed, expose `sessionManager.getCurrentOrAwaitRebuild()` and have read handlers await it. Lower-cost: return the rebuild generation count (a monotonic counter) on every tool response so clients can detect a stale read post-hoc.
- **Verification:** Add an MCP-runtime-hardening scenario that edits a feature file, immediately invokes `architect_pattern`, and asserts the response reflects the edit within `debounceMs + buildTimeMs * 2`.

### H5. `parseCliArgs` round-trips through a Zod schema with no upside

- **File:** `packages/architect-mcp/src/server.ts:52-152`
- **Impact:** The function builds a fully-typed `{mode, session}` object imperatively, then hands it to `parseServerCliArgs` (line 71) which `safeParse`s a discriminated union over `{mode: 'help'|'version'|'serve'}`. Because the input is already typed by the surrounding code, the validation never rejects anything that wasn't already a TypeScript error. The Zod parse is pure ceremony — and worse, on failure it formats the error and throws synchronously while losing the original `argv` context (no info about which arg failed). The real validation that matters (`Unknown argument`, missing values) is the imperative `for` loop at lines 107–141, not the Zod check.
- **Remediation:** Delete `SessionOptionsSchema` and `ParsedCliArgsSchema`; return the `ParsedCliArgs` object directly. If runtime validation is desired, validate at the trust boundary that matters — the `session` object handed to `PipelineSessionManager.initialize`. CLI parsing is not a trust boundary in a single-process bin; if untrusted argv is a concern, that needs a separate hardening step.
- **Verification:** `pnpm typecheck`, then run `architect-mcp -i 'src/**/*.ts' -h` and confirm help renders.

---

## Medium

### M1. `mergeOptions` silently overrides CLI-supplied options with programmatic defaults

- **File:** `packages/architect-mcp/src/server.ts:154-165`
- **Impact:** `mergeOptions(parsed.session, options)` spreads `options` last, so any value provided via the programmatic `McpServerOptions` argument to `startMcpServer({...})` overrides matching CLI flags. The bin entry only passes `process.argv.slice(2)` (`cli/mcp-server.ts:25`), so today the user-facing case is unaffected; but when `startMcpServer` is invoked from Studio main process or tests with a programmatic `{baseDir}`, it silently overrides whatever the user passed on the command line. Surprising and undocumented.
- **Remediation:** Reverse the precedence so CLI wins, OR fail-fast on conflict. Add a unit test pinning the chosen direction.
- **Verification:** New vitest case covering `startMcpServer(['-b', '/a'], {baseDir: '/b'})`.

### M2. Watcher restarts rebuild loop with debounced fire-and-forget but never propagates fatal errors

- **File:** `packages/architect-mcp/src/file-watcher.ts:62-119`
- **Impact:** `runRebuild` catches all errors and logs them via `this.options.log`. The error message goes to stderr (via `log` in `server.ts:67`) but never surfaces to MCP clients or affects server health. If the source becomes unparseable, the server quietly serves the LAST GOOD dataset forever and the client has no signal beyond stderr lines. For an MCP server, this is the wrong direction — the server is "healthy" but increasingly stale. Also: `watcher.on('error', ...)` only logs — chokidar `error` events can include ENOSPC (inotify limits exhausted on Linux) which leaves the watcher silently dead.
- **Remediation:** Track `lastRebuildError` and `lastRebuildAt` on the session manager; surface them in `architect_overview` or `architect_config` so clients can detect drift. On chokidar `error`, attempt one reconnect, then transition the server to a `degraded` state visible to clients. At minimum, add a `consecutiveFailures` counter and log a louder message after N.
- **Verification:** Integration test that introduces a syntax error in a watched `.ts` file and asserts subsequent `architect_config` reflects the failure.

### M3. `resolveMcpBaseDirArg` may return a non-existent path silently

- **File:** `packages/architect-mcp/src/runtime-helpers.ts:14-30`
- **Impact:** When the user passes `-b some/relative/dir` and the path resolves to neither `process.cwd() + path` nor `resolveInvocationDir() + path`, the function returns the cwd-based candidate (line 29) without erroring. Downstream `PipelineSessionManager.initialize` will eventually fail with a less-precise message (likely "No TypeScript source globs found"). The user-facing error should pinpoint the bad `-b` argument.
- **Remediation:** When neither candidate exists, throw `Base directory not found: <value> (tried <a>, <b>)`. Document that absolute paths bypass the existence check (matches the existing branch at line 15).
- **Verification:** Add a scenario in `tests/features/mcp-server-lifecycle.feature` for the bad-`-b` path.

### M4. `architect_help` ignores `tool-metadata.ts:buildToolHelpText` and builds an MCP-only table

- **File:** `packages/architect-mcp/src/tool-registry.ts:328-351, 628-631`
- **Impact:** Two help renderers exist: `buildToolHelpText` in `tool-metadata.ts` (used nowhere — confirmed by repo grep) and the inline `buildHelpDocument` in the registry. Either delete one or unify them. Today the unused exported helper is dead code; the inline one returns the `SectionedDocument` shape called out in C3.
- **Remediation:** Pick one. If the registry's help should be the MCP-shape help, delete `buildToolHelpText` and its export. If both surfaces matter (text for CLI, JSON for MCP), wire them so the source of truth is the `ARCHITECT_MCP_TOOLS` array and both renderers consume it.
- **Verification:** `pnpm typecheck` and `pnpm --filter @libar-dev/architect-mcp test`.

### M5. `getProjectionContext` rebuilt on every tool call — cache it on the session

- **File:** `packages/architect-mcp/src/tool-registry.ts:176-185`
- **Impact:** Every tool handler calls `getProjectionContext(session)` which constructs a fresh `{graph, packageResolver, ...}` object on each invocation. The session is immutable for its lifetime; the projection context is a pure derivative. For high-frequency clients this is a small allocation cost, but more importantly it muddles the "session === stable build" model.
- **Remediation:** Compute `projectionContext` once in `buildSession` (`pipeline-session.ts:166`) and expose it as `session.projectionContext`. Update handlers to read `session.projectionContext` directly.
- **Verification:** `pnpm test` + a micro-bench in the existing perf test.

---

## Low

### L1. `BlockingEntry` and `SectionedDocument` interfaces lack `kind` taxonomy or Zod schemas

- **File:** `packages/architect-mcp/src/tool-registry.ts:88-107`
- **Impact:** Local interfaces without runtime validation; consumers receive untyped JSON. Once C3 is fixed these go away anyway.
- **Remediation:** Subsumed by C3.

### L2. `parseToolInput` accepts `null` and coerces to `{}` — looser than Zod-first

- **File:** `packages/architect-mcp/src/tool-registry.ts:223-237`
- **Impact:** The strict-object schemas reject `null`, but the manual `rawInput ?? {}` makes `null` indistinguishable from "no input." For a single-purpose tool boundary this is harmless, but it's a stealth relaxation of the Zod contract. Document or remove.
- **Remediation:** Drop the `rawInput ?? {}` fallback when the schema's `EmptyInputSchema` already accepts `undefined`; let Zod reject `null` so clients learn the contract.
- **Verification:** Existing tool-input-validation feature.

### L3. `defineToolHandler` and `resolveToolHandler` both narrow types via `as` casts

- **File:** `packages/architect-mcp/src/tool-registry.ts:135-148, 215-221`
- **Impact:** Two cast sites for the same nominal mapping. The casts are correct (the registry key set IS `RegisteredToolName`), but they hide a single source-of-truth check — that `TOOL_HANDLERS` keys equal `REGISTERED_TOOL_NAMES`. Drift will compile.
- **Remediation:** Add a static assertion: `type _check = Expect<Equal<keyof typeof TOOL_HANDLERS, RegisteredToolName>>` (or `satisfies Record<RegisteredToolName, ToolHandler>` on the literal itself — already present at line 360, good). Add a runtime assertion in `registerAllTools` that `REGISTERED_TOOL_NAMES.every(n => Object.hasOwn(TOOL_HANDLERS, n))` and vice-versa.
- **Verification:** Compile-time; no runtime cost.

### L4. `HELP_TEXT` lives in `server.ts` but the tool list it doesn't reference lives in `tool-metadata.ts`

- **File:** `packages/architect-mcp/src/server.ts:31-41`
- **Impact:** Two help surfaces (`HELP_TEXT` for `architect-mcp --help`, `buildHelpDocument` for `architect_help`). They will drift. The CLI help advertises `-w / --watch` only; the tool help advertises the 21-tool registry. Different audiences, but no single rebuild story.
- **Remediation:** Out of scope for cleanup, but a future consolidation should source both from `tool-metadata.ts` + a small `cli-help.ts`.

---

## Cross-cutting themes

1. **Two real ADR-009 leaks** (C1) and **one new global mutation** (C2) — the same shape the project just fixed in `676a916`. Treat these together: any persistent process mutation in `server.ts` and any `parseAndProject*` call in `tool-registry.ts` should be flagged by lint. A bespoke architect-guard rule (`@libar-dev/architect-guard`) that forbids `parseAndProject*` imports in `packages/architect-mcp/` and forbids `Reflect.set(globalThis.console` / `process.chdir` anywhere would catch all three classes mechanically.

2. **CLI / MCP twin drift in three places** (C3, H2, M4) — `search`, `arch blocking`, `files`-default, `help`. The cause is the same: handlers compose ad-hoc shapes locally instead of routing through `architect-projection` fragments. The fix is consistent — every MCP handler should be a one-liner that calls a typed `project*` builder and renders. Anything richer belongs in `architect-projection`. A short table in `architect-data-api.md` listing "CLI verb → MCP twin → shared projection function" would prevent this from regressing.

3. **Zod schema authoring is partial** (H1, H3, L2) — strict-object discipline is present, but the empty-input case and mutually-exclusive options use runtime workarounds instead of expressing constraints in the schema. The advertised JSON-Schema (what MCP clients see) suffers as a result.

4. **Ceremony with no payoff** (H5, M1, M3) — `parseCliArgs` round-trips a typed object through Zod with no untrusted input crossing; `mergeOptions` has surprising precedence; `resolveMcpBaseDirArg` returns plausibly-wrong paths. These read as defensive code without a threat model. Either pin the threat model in a docstring or simplify.

5. **Watcher observability is shallow** (M2) — the file watcher rebuilds, logs to stderr, and that's it. The server presents a healthy facade even when the dataset is hours stale. A `lastRebuildError` field on the session, exposed via `architect_config`, would close the gap with one field and no architectural change.

6. **Session generation / staleness** (H4) — within the current design (snapshot-per-rebuild), readers can observe pre-edit state for up to `debounceMs + buildTimeMs`. This is documented nowhere. It's the only correctness concern in the package and it's a documentation fix today, an optional generation-counter fix tomorrow.
