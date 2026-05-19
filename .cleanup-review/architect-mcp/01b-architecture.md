# Architectural Review — `@libar-dev/architect-mcp`

Scope: 9 TS files, ~1.6k LOC. Reviewed against ADR-006 (Single Read Model), ADR-007 (Coordinated Taxonomy), ADR-009 (Projection Trust Boundary), PDR-001 (Session Workflow Commands), and the repo's engineering doctrine (No-BC, Zod-first, strict TS, no circular imports, no business logic in composition roots).

**Headline.** The package is a clean composition root. Imports go through the public `@libar-dev/architect-core` and `@libar-dev/architect-projection` barrels only — zero reach into `architect-core/src/scanner/` or `architect-core/src/extractor/`. Snake-case tool naming is consistent end-to-end. ADR-009 is honoured: every raw MCP input goes through `parseAtBoundary` once at the boundary and no handler calls `safeParse`/`.parse(` internally. Pipeline rebuilds are correctly coalesced (`runRebuildLoop` + `pendingRebuild` flag) and the watcher is the only signal that mutates the session cache.

The findings below are mostly *medium* and *low* — small drift items that, taken together, prevent `tool-registry.ts` from being the boring registry it wants to be.

---

## High

### H1 — CLI/MCP twin divergence: `arch_blocking` and `search` ship a bespoke `SectionedDocument` shape only on the MCP side

**ADR anchor:** PDR-001 (text vs JSON output rules apply to twin commands); ADR-009 (projections are the trust boundary).
**Files:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:252-296` (`buildSearchResultsDocument`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:298-326` (`buildBlockingDocument`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:328-351` (`buildHelpDocument`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/commands/read.ts:344-355` (CLI `search`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/commands/_shared/structured.ts:272-273` (CLI `arch blocking`)

**What's wrong.** Three MCP tools (`architect_search`, `architect_arch_blocking`, `architect_help`) bypass the projection layer entirely. They hand-build a local `SectionedDocument` interface, populate it with `paragraph()` / `table()` blocks, and render it via `renderPlainJsonToolResult` (literally `JSON.stringify`). The CLI twins emit the raw projection output (`fuzzyMatchPatterns(...)` JSON, `projectOverviewDigest(...).root.blocking` JSON). Same verb, two different on-the-wire shapes.

This is a doctrine violation at three layers:
- ADR-009: `SectionedDocument` is a projection-shaped artifact authored *outside* the projection package. The projection trust boundary is supposed to be the only place fragments are minted.
- PDR-001: text vs JSON discipline is keyed on the verb; twins should agree.
- Composition-root principle: handlers should be parse → call → render. These three reach 30–50 LOC and contain string-formatting business logic (singular/plural, "No matches found" copy, hard-coded help guidance text).

**Recommended improvement.** Move `SearchResults`, `BlockingPatterns`, and `MCPHelp` into `@libar-dev/architect-projection/projections` as proper named domain fragments with Zod schemas. The MCP handlers then collapse to the standard 3-step shape and the CLI gets the same fragments for free. If keeping CLI output as raw arrays is desirable (legacy), introduce a `--format text` / `--format json` flag on the CLI and have it select between the projection's text renderer and a raw passthrough — the projection still owns the shape.

**Trade-offs.** Three new fragments in `architect-projection`. The MCP side becomes more rigid (cannot tweak help copy without a projection change) — which is the point. The CLI's structured JSON for `search` will change shape, which is acceptable under No-BC.

---

### H2 — `globalThis.console.log` mutation defeats the carve-out that just removed `process.cwd` mutation

**ADR anchor:** Global-state discipline; doctrine echo of the `676a916` "remove global cwd mutation" fix.
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/server.ts:203-205`

**What's wrong.** `startMcpServer` patches the global `console.log` so any `console.log` call from anywhere in the process is rerouted to `stderr`. This is exactly the class of side-effect that the recent `process.cwd` removal was about: a long-lived MCP server that is the only consumer here, but the function is `export`ed and consumed by tests / desktop main process / future embeds. Anyone importing `startMcpServer` inherits a hijacked global `console` for the lifetime of the host process. There is no `restore`/teardown on shutdown.

The intent (keep STDIO MCP transport clean of stray stdout) is correct. The mechanism is global.

**Recommended improvement.** Two options, either acceptable:
1. Move the patch into the bin entry (`cli/mcp-server.ts`) where global mutation is appropriate. Library code never mutates globals.
2. Capture the original `console.log` and restore in the SIGINT/SIGTERM `shutdown` path; document the side-effect on `startMcpServer`'s JSDoc as a bin-only contract.

**Trade-offs.** Option 1 is cleaner — library/bin split mirrors how `process.cwd` was handled. Option 2 keeps the patch where it's contextual but adds shutdown complexity.

---

## Medium

### M1 — Help-text composition is duplicated across `tool-metadata.ts` and `tool-registry.ts`

**ADR anchor:** Composition-root single-source-of-truth (echoes ADR-006's single read model spirit).
**Files:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-metadata.ts:85-104` (`MCP_SERVER_INSTRUCTIONS`, `buildToolHelpText`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:328-351` (`buildHelpDocument`)

**What's wrong.** Three help surfaces, three formats, two of them duplicate copy:
- `MCP_SERVER_INSTRUCTIONS` — string passed to `McpServer` on construction. Says "Start with architect_overview, then architect_scope_validate and architect_context."
- `buildToolHelpText()` — exported but unused inside this package (dead in the barrel via re-export of nothing — re-check). Markdown-ish list with similar copy.
- `buildHelpDocument()` — `SectionedDocument` rendered by `architect_help`. Same copy, third format.

**Recommended improvement.** Choose one authored source for help copy (`tool-metadata.ts`), have the help projection (see H1) derive both the MCP server instructions string and the `architect_help` tool output from it. Delete `buildToolHelpText` if it remains unused after the consolidation.

**Trade-offs.** Reduces flexibility on per-channel copy. In exchange, no more drift between three near-identical surfaces.

---

### M2 — `architect_rebuild` re-runs `parseAndProjectConfig` instead of returning a typed rebuild fragment

**ADR anchor:** ADR-009 (`parseAndProject*` is the *raw-input* entry; internal composition uses typed `project*` helpers).
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:575-591`

**What's wrong.** The `architect_rebuild` handler invokes `parseAndProjectConfig` to produce its return value. But the inputs to that call (`baseDir`, `configPath`, `buildTimeMs`, `sourceGlobs`, `projectName`) are already typed values pulled off a freshly-built `PipelineSession` — there is no raw input to validate. ADR-009 says: raw input → `parseAndProject*`; trusted internal composition → `project*`. This is the internal composition path.

The same nit applies to `architect_config` at lines 593-607. Both should call a typed `projectSessionConfig(context, session)` (or whatever the projection package names it) and skip the re-parse cycle entirely.

**Recommended improvement.** Add a `projectSessionConfig` (or rename the existing one) to `@libar-dev/architect-projection/projections` that takes `ProjectionContext + PipelineSession`-derived options and returns the bundle. Use it in both `architect_rebuild` and `architect_config`. Reserve `parseAndProjectConfig` for the case it was designed for — a caller handing in untrusted raw config object.

**Trade-offs.** Minor projection-package API churn. The win is that the trust-boundary boundary is no longer fuzzy: `parseAndProject*` means "first time across the boundary," everywhere.

---

### M3 — `architect_search` reaches into `catalog.items` to build a name→summary `Map` inside the handler

**ADR anchor:** ADR-006 (Single Read Model — handlers should not stitch projection fragments together); composition-root no-business-logic.
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:505-517`

**What's wrong.** The handler calls `projectPatternCatalog(...)`, then builds a `Map<patternName, summary>` from `catalog.items`, then calls `fuzzyMatchPatterns`, then joins the two by name in `buildSearchResultsDocument`. This is multi-projection stitching inside an MCP handler — exactly what `bundle` was created to avoid. The CLI twin (`read.ts:344-355`) does *not* do this stitching; it just returns the raw `fuzzyMatchPatterns` result. So MCP has invented an extended search response shape on its own.

**Recommended improvement.** Either:
- Move the enriched-search composition into a `projectPatternSearch(context, { query })` projection (preferred — pairs with H1's fragment), or
- Drop the enrichment and emit the same shape as the CLI; let callers compose `architect_search` + `architect_pattern` themselves (fewer round-trips matter less now that MCP is in-process).

**Trade-offs.** Option 1 keeps the enriched output and aligns CLI. Option 2 is the strictest reading of "MCP is a transport, not a feature surface."

---

### M4 — `architect_handoff` reaches into `session.api.getPattern` to derive a session-type default

**ADR anchor:** Composition-root no-business-logic.
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:441-451`

**What's wrong.** The handler calls `session.api.getPattern(name)` to fetch status, then calls `inferHandoffSessionType(pattern?.status)` to decide a default. This is a non-trivial inference path the CLI handles via `normalizeHandoffInput` + `requireProjectedHandoff` (`packages/architect-cli/src/cli/commands/planning.ts:85-94`). Two non-identical defaulting paths for the same verb.

The MCP version also silently swallows "pattern not found" by passing `undefined` to `inferHandoffSessionType` — fine if intentional, but the CLI's path is the canonical one.

**Recommended improvement.** Lift the defaulting logic into a shared helper consumed by both CLI and MCP twins (most naturally inside `@libar-dev/architect-projection/projections` as a normalizer alongside `projectHandoffRecord`, or alongside `inferHandoffSessionType` in core). Both handlers reduce to `normalizeHandoffInput(...)` → `projectHandoffRecord(...)`.

**Trade-offs.** One small core/projection helper. The handler shape gets uniform across all 21 tools.

---

### M5 — `architect_rules` validates mutual-exclusion of `pattern`/`productArea` at runtime instead of in the Zod schema

**ADR anchor:** Zod-first boundaries; parse-once at the trust boundary.
**Files:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:519-549`
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-input-schemas.ts:97-101`

**What's wrong.** The handler raises `'pattern and productArea cannot be used together'` at line 522-524 — a structural constraint on the input. The Zod-first doctrine says this should be a `.refine()` on `RulesFilterShape` (or a discriminated union with three variants: `{ pattern }`, `{ productArea }`, `{}`), so the validation lives at the trust boundary and the type-narrowed input feeds the projection directly without an intermediate `if` ladder.

The current code also has a long `pattern !== undefined ? ... : productArea !== undefined ? ... : ...` ternary, which a discriminated union would replace with three clean branches.

**Recommended improvement.** Replace `RulesFilterShape` with a `z.discriminatedUnion('scope', [...])` or a `z.union([...]).refine(...)` and switch on the parsed shape. Handler reduces to ~10 LOC.

**Trade-offs.** Schema becomes slightly more elaborate; handler logic becomes trivial. Net win for the composition-root contract.

---

## Low

### L1 — `tool-registry.ts` mixes registration data and rendering helpers; a flat file-split would clarify the registry shape

**ADR anchor:** Single Responsibility (composition root); registry-as-data principle.
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts` (666 LOC overall)

**What's wrong.** The file conflates three responsibilities:
- Type machinery (`ToolHandler`, `ToolResult`, `defineToolHandler`, `parseToolInput`, `resolveToolHandler`) — ~120 LOC.
- Rendering helpers (`renderTextToolResult`, `renderJsonToolResult`, `renderPlainJsonToolResult`, `formatTextResult`) — ~30 LOC.
- `SectionedDocument` builders (search/blocking/help) — ~100 LOC (these largely move out per H1).
- The registry table itself (`TOOL_HANDLERS`) — ~270 LOC.
- Public entry points (`invokeTool`, `registerAllTools`) — ~30 LOC.

It's not broken — but at 666 LOC it's the largest file in the package by 2.6× and the registry-as-table shape is hard to read at a glance. After H1 moves the `SectionedDocument` builders into the projection package, splitting the remaining file into `tool-handler-types.ts` (the machinery) and `tool-registry.ts` (the table + entry points) drops it under 400 LOC.

**Recommended improvement.** Land H1, H2, M1, M2 first — those naturally shrink the file by ~200 LOC. Re-evaluate the split need at that point. If still wanted, extract `defineToolHandler` + `parseToolInput` + `ToolHandler` + `ToolResult` + render helpers to a sibling module.

**Trade-offs.** Splitting purely on size is over-engineering; deferring until after substantive cleanup is correct. Worth a follow-up review.

---

### L2 — `getSourceGlobGroups` exists only to thread an optional `exclude` field, complicating two call sites

**ADR anchor:** `exactOptionalPropertyTypes: true` rule (CLAUDE.md TS strictness).
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:187-205`

**What's wrong.** Because `exactOptionalPropertyTypes` rejects `{ exclude: undefined }` when the type says `exclude?: readonly string[]` (without `| undefined`), the codebase has multiple `...(x !== undefined ? { x } : {})` spreads. `getSourceGlobGroups` packages this into a helper, but the receiving Zod schema on the projection side could simply accept `| undefined` and the helper disappears. The same pattern recurs in `getProjectionContext` (line 176-185) and in every `architect_*` handler that spreads optional fields.

**Recommended improvement.** Loosen the receiving projection-side schemas to allow explicit `undefined` (or use `.optional()` consistently with `exactOptionalPropertyTypes` — Zod v3.22+ supports this with `.optional().or(z.undefined())` quirks; v4 cleaner). Then drop `getSourceGlobGroups` and the conditional-spread idiom collapses everywhere. This is a cross-package change — file as a `FEEDBACK.md` entry first, then schedule.

**Trade-offs.** Cross-package coordination needed. Pure win for handler readability; the doctrine isn't violated by the current code, only made verbose by it.

---

### L3 — `EmptyInputSchema` is a `z.union` with `z.undefined()`; `parseToolInput` then coerces `undefined` to `{}`

**ADR anchor:** Zod-first (parse-once, no runtime fixups).
**Files:**
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-input-schemas.ts:112` (`EmptyInputSchema`)
- `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/tool-registry.ts:223-237` (`parseToolInput`)

**What's wrong.** `parseToolInput` defends against `rawInput === undefined` by substituting `{}`, but also rejects non-object inputs. `EmptyInputSchema` independently allows both `undefined` and `{}`. This is two layers of normalization for the same edge. The MCP SDK already passes an object; the `?? {}` is belt-and-braces.

**Recommended improvement.** Pick one: either `EmptyInputSchema = createStrictReadonlyObjectSchema({})` and let Zod fail on `undefined`, or keep the schema permissive and drop the `?? {}` coercion in `parseToolInput`. The current double-defence makes it hard to know which layer to trust.

**Trade-offs.** Cosmetic. The current code works; it just makes the trust boundary slightly fuzzy.

---

### L4 — `applyFallbackDefaults` hardcodes glob strings that drift from the workspace defaults in `architect-core`

**ADR anchor:** Single Read Model (ADR-006) — configuration sources should converge.
**File:** `/Users/darkomijic/dev-projects/architect/packages/architect-mcp/src/pipeline-session.ts:224-251`

**What's wrong.** Hardcoded `'src/**/*.ts'`, `'architect/stubs/**/*.ts'`, `'architect/specs/*.feature'`, `'architect/releases/*.feature'`. These are the same fallbacks `architect-core`'s `applyProjectSourceDefaults` / `resolveWorkspaceSources` likely encode. Two sources of truth for "what does a default-shaped architect repo look like" guarantee future drift.

**Recommended improvement.** Move the fallback-default catalog to `architect-core` and have both `applyProjectSourceDefaults` and any MCP-side fallback consume the same exported constants. The current `applyFallbackDefaults` becomes one call.

**Trade-offs.** Minor cross-package refactor. Failure mode if skipped: a user adds `architect/decisions/*.feature` to core's defaults and the MCP fallback path silently ignores it.

---

## Cross-cutting themes

1. **The package is a clean composition root in spirit but has three small lapses of business logic in handlers** (H1 `SectionedDocument` builders, M3 search stitching, M4 handoff session-type inference, M5 mutual-exclusion check). Each is small individually; together they tilt `tool-registry.ts` from "registry table" toward "registry with a few features sneaking in." Pushing all four back into the projection layer is the highest-leverage architectural improvement and would shrink the file by ~150 LOC without any feature loss.

2. **ADR-009 compliance is excellent on the *input* side, partially fuzzy on the *output* side.** `parseAtBoundary` is the sole input entry — strong. But `parseAndProject*` shows up in `architect_rebuild` and `architect_config` where the inputs are already trusted (M2). The doctrine intent — "raw → `parseAndProject*`, trusted → `project*`" — needs a typed `project*` helper for session-derived config, and then it's airtight.

3. **CLI/MCP twin discipline is *almost* there.** Snake-case naming is uniform. The two divergences (H1 `SectionedDocument` shape, M3 enriched search, M4 handoff defaulting) all flow from the same root cause: MCP authored its own shapes for verbs the CLI handles differently. Fix once at the projection layer and every twin agrees by construction.

4. **Global-state discipline carry-over.** The recent `process.cwd` mutation removal (676a916) was the right move. The `globalThis.console.log` patch (H2) is the same anti-pattern, one layer up. Fixing it now keeps the carve-out clean before a third instance shows up.

5. **`pipeline-session.ts` is correctly the sole owner of session-scoped cache.** The watcher → `sessionManager.rebuild()` signal is one-way, the rebuild loop coalesces correctly via `pendingRebuild`, and no handler reaches into pipeline internals — every handler receives `session: PipelineSession` and `sessionManager: PipelineSessionManager` as opaque parameters. Architecturally this surface is sound; nothing in the findings above touches it.

6. **No `architect-guard` dependency, as expected.** MCP exposes read verbs. No FSM-write paths. ADR-006 single-read-model compliance is on point.
