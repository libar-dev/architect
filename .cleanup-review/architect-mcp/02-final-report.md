# Cleanup Review — `@libar-dev/architect-mcp`

## Review Target

`packages/architect-mcp/src/**` — 9 TS files, ~1,587 LOC. MCP server exposing
21 architect verbs to LLM tooling. The smallest package in the suite; surface
is concentrated in 3 files (`tool-registry.ts` 666 LOC, `server.ts` 253 LOC,
`pipeline-session.ts` 252 LOC). Detailed agent reports:
[`01a-code-quality.md`](./01a-code-quality.md) · [`01b-architecture.md`](./01b-architecture.md) · [`01c-simplification.md`](./01c-simplification.md) · [`01-cleanup-findings.md`](./01-cleanup-findings.md).

## Executive summary

The 44 findings across the three agents reduce to **eight structural root
causes**, six of which are cross-package echoes (CLI/MCP twin discipline,
`parseAndProject*` boundary slips, global-state mutation, partial Zod-first
authoring, per-tool boilerplate, conditional-spread sprawl). Action plan is
organised by root cause.

The package's **composition-root spirit is right** but small leakage points
accumulate at the output side. Input-side ADR-009 compliance is excellent;
output-side has the package's biggest cluster of bugs (T-MCP-1: CLI/MCP twin
drift across 4 verbs). And the `process.cwd` mutation that was just fixed
in commit `676a916` has a forgotten sibling: `globalThis.console.log` is
permanently mutated and not restored on shutdown.

Raw counts: **3 Critical · 7 High · 10 Medium · 8 Low** (quality + arch) +
**5 High · 6 Medium · 5 Low** simplification opportunities.

---

## What the package gets right (front-load)

- **`pipeline-session.ts` is the sole cache owner**; one-way watcher signals; no handler-side caching.
- **Input-side ADR-009 compliance** is excellent for inputs that have schemas.
- **No ADR-006 carve-out violations.**
- **`process.cwd` mutation already removed** (commit `676a916`) — the package has the muscle for this kind of fix.
- **9-file footprint** is concentrated; one refactor pass touches everything.

---

## Root causes (the synthesis)

### RC-MCP-1 — CLI/MCP twin discipline drift across 4 verbs

**Pattern.** When authoring an MCP tool the temptation is to compose the output locally in the handler instead of routing through the same projection function the CLI uses. Four verbs have drifted; each in its own shape:

**Findings this explains.**
- Quality C3 / Architecture H1 — `architect_search`, `architect_arch_blocking`, `architect_help` hand-build a local `SectionedDocument` shape. CLI returns plain arrays. Programmatic parity is broken.
- Quality H2 — `architect_files` defaults `related: true`; CLI defaults `false`. Quietly leaks more data.
- Architecture M4 — `architect_handoff` defaulting diverges from CLI.
- Architecture M3 — `architect_search` stitches projection fragments inside the handler.

**ADR anchor.** ADR-009 — output composition belongs in `architect-projection`. Handlers should be 3-line wrappers. PDR-001 — CLI/MCP twins should produce structurally identical output for the same verb.

**Structural fix.** Lift the 4 divergent compositions into `architect-projection` as named projection functions; both CLI and MCP route through them. Add a "CLI verb → MCP twin → shared projection function" table in `architect-data-api.md` (the skill) and back it with a CI test that asserts the CLI text-output and the MCP structured output are derived from the same projection function.

### RC-MCP-2 — `parseAndProject*` double-parse on hot paths (cross-package echo of RC-CLI-2)

**Pattern.** `parseAndProject*` is for **raw input**; once the MCP transport's Zod gate has parsed, internal callers use typed `project*` helpers. Three handlers re-parse on the hot path.

**Findings this explains.**
- Quality C1 — `architect_documentation`, `architect_config`, `architect_rebuild` call `parseAndProject*` after the boundary already parsed (`tool-registry.ts:575-625`). Typed builders (`projectConfig`, `projectDocumentationBundle`) already exist.
- Architecture M2 — same finding from the architecture lens.

**ADR anchor.** ADR-009 — "Parse once at external projection boundaries."

**Structural fix.** Replace the three `parseAndProject*` calls with the typed `project*` builders. Same prescription as RC-CLI-2 (boundary slips in CLI). Workspace-shared ESLint rule banning `parseAndProject*` imports inside `packages/architect-mcp/src/**` and `packages/architect-cli/src/**` except in known boundary files.

### RC-MCP-3 — Second global-state mutation that escaped commit `676a916`

**Pattern.** Commit `676a916` removed `process.cwd` mutation. A sibling lives undetected: `globalThis.console.log` is permanently mutated and not restored on `shutdown()`. The fix that landed for cwd needs to generalize.

**Findings this explains.**
- Quality C2 — `Reflect.set(globalThis.console, 'log', …)` (`server.ts:203-205`).
- Architecture H2 — same, from architectural lens.

**ADR anchor.** Engineering doctrine ("no global mutation") + the precedent established by `676a916`.

**Structural fix.** Two-step:
1. Local fix: restore the original `console.log` in `shutdown()`, or scope the redirect to a local logger reference.
2. **Workspace-level ESLint rule** banning `Reflect.set(globalThis…)`, `process.chdir`, `globalThis.process = …`, `globalThis.console.* = …`. CI would have caught this and would prevent the next instance.

This is the single highest-priority correctness fix in the package because it survives shutdown and silently affects subsequent processes.

### RC-MCP-4 — Zod-first authoring is partial (cross-field constraints missing)

**Pattern.** Schemas are correct at the **field** level but don't express **inter-field** constraints. Runtime workarounds (imperative `throw`, defensive guards) fill the gap.

**Findings this explains.**
- Quality H1 — `EmptyInputSchema` is `union(strictObject({}) | undefined)` — confusing JSON-Schema advertised to MCP clients.
- Quality H3 — `architect_rules` enforces `pattern XOR productArea` via imperative `throw`.
- Quality H5 — `parseCliArgs` round-trips an already-typed TS object through Zod with no untrusted input crossing.
- Architecture M5 — same mutual-exclusion finding from architecture lens.
- Simplification M1 — defensive non-object guard before `strictObject`.

**ADR anchor.** Engineering doctrine ("Zod-first boundaries"; "Parse once at the trust boundary").

**Structural fix.**
1. Replace `EmptyInputSchema` with `z.strictObject({}).optional()` (or with no schema; pass-through is fine).
2. `pattern XOR productArea` becomes `schema.refine(...)` — declarative.
3. Drop `parseCliArgs` Zod ceremony; the input is already TS-typed.
4. Delete defensive non-object guards; trust `strictObject`.

### RC-MCP-5 — Three-file-per-tool authoring + 666-LOC `tool-registry.ts`

**Pattern.** Every tool is authored across three files (`tool-input-schemas.ts`, `tool-metadata.ts`, handler in `tool-registry.ts`). 21 tools × ~30 LOC of boilerplate. The 666-LOC registry is the symptom; the three-file split is the cause.

**Findings this explains.**
- Simplification H1 — collapse 21 `defineToolHandler` entries into 3 declarative family tables; ~270 LOC saved.
- Simplification H2 — merge `tool-input-schemas.ts` + `tool-metadata.ts` into per-tool entries co-located with handlers; ~220 LOC saved + eliminates three-file authoring.
- Architecture L1 — `tool-registry.ts` size is symptomatic, not causal.

**ADR anchor.** None directly; engineering hygiene.

**Structural fix.** One per-tool declarative entry:

```ts
const tools = {
  architect_overview: {
    schema: z.strictObject({}),
    metadata: { description: '...', args: [] },
    handler: async () => projectOverview(...),
  },
  // ...20 more
};
```

Three files collapse to one. The handler boilerplate (parse → call → render) becomes a generic wrapper. Cross-package echo: same shape as cli's RC-CLI-5 (parser registry) and projection's helper-duplication theme.

### RC-MCP-6 — Conditional-spread sprawl (cross-package echo of RC-CORE-6 / RC-PROJ-6)

**Pattern.** ~60+ LOC of `...(x !== undefined ? { x } : {})` in this small package.

**Findings this explains.**
- Simplification H4 / H5 — `omitUndefined` helper retires the pattern.

**Structural fix.** Reuse the `pickDefined` / `definedOnly` helper landed for RC-CORE-6 in core (or workspace-shared). Single cross-package commit.

### RC-MCP-7 — Watcher staleness window with no client signal

**Pattern.** File watcher → cache invalidation has a `debounceMs + buildTimeMs` staleness window. Clients have no way to detect that a result was computed before the file change that triggered their tool call.

**Findings this explains.**
- Quality H4 — staleness window; no client-visible generation signal.

**Structural fix (staged).**
1. **Today**: document the staleness window in the data-api skill so downstream consumers know.
2. **Tomorrow**: add a `cache_generation` integer that increments per build; surface in tool results so a client can detect "is this cached or fresh?"

### RC-MCP-8 — Help-text duplication (cross-package echo of helper-duplication theme)

**Pattern.** Help text duplicated across three surfaces.

**Findings this explains.**
- Architecture M1 — help text duplicated across three surfaces.

**Structural fix.** Same family as projection's helper-duplication and cli's argv-parser triplication — one canonical help source, derive other surfaces from it.

---

## Findings the synthesis does NOT explain (genuinely independent)

- **Simplification M5/M6** — `applyFallbackDefaults` argument mutation and `for (;;)` loop are the only non-immutable spots in `pipeline-session.ts`. Surgical fix.
- **Simplification L1** — `isWatchedFileType` checks `.ts` then redundantly checks `architect.config.ts`. One-liner.
- **Simplification L2** — `runtime-helpers.resolveMcpBaseDirArg` has an unreachable final fallback. Dead code.
- **Architecture L4** — Hardcoded fallback globs in `applyFallbackDefaults` duplicate `architect-core` defaults. Either delete or import.

Four independent surgical fixes.

---

## Recommended Action Plan (root-cause ordered)

| Order | Root cause | Fix | Findings collapsed |
| ----- | ---------- | --- | ------------------ |
| 1 | RC-MCP-3 | Restore `console.log` on shutdown + workspace ESLint rule banning global mutation | C2 + H2-arch (cross-package: catches the next instance) |
| 2 | RC-MCP-2 | Replace `parseAndProject*` with typed `project*` builders in 3 handlers | C1 + M2-arch (joint with RC-CLI-2) |
| 3 | RC-MCP-1 | Lift 4 divergent compositions into `architect-projection`; add twin-parity test | C3 + H1-arch + H2-quality + M3-arch + M4-arch |
| 4 | RC-MCP-4 | Replace imperative throws and union schemas with `.refine` / proper Zod | H1, H3, H5, M5-arch, M1-sim |
| 5 | RC-MCP-5 | Per-tool declarative entries; merge input-schemas + metadata + handler | H1-sim, H2-sim, L1-arch (~490 LOC) |
| 6 | RC-MCP-6 | Reuse workspace-shared `pickDefined` helper | H4-sim, H5-sim |
| 7 | RC-MCP-7 | Document staleness window now; add `cache_generation` next | H4-quality |
| 8 | RC-MCP-8 | One canonical help source | M1-arch |
| — | independent | 4 surgical fixes | individual |

Ordering rationale:
- 1 first — the console-mutation survives shutdown and silently affects subsequent processes.
- 2 + 3 close the ADR-009 output boundary and the CLI/MCP twin drift.
- 4 is doctrinal hygiene with concrete client-visible improvement.
- 5 is the biggest LOC win and the prerequisite for sustainable tool growth.
- 6 + 7 + 8 are smaller mechanical fixes.

## Verification Suggestions

- After RC-MCP-3: assert `console.log === originalConsoleLog` after `shutdown()` in a unit test.
- After RC-MCP-2: tool-roundtrip tests for `architect_documentation`, `architect_config`, `architect_rebuild` — no `parseAndProject*` on the call stack (test via stub instrumentation).
- After RC-MCP-1: CLI/MCP twin parity test — for every verb, `pnpm architect:query <verb>` JSON output and the MCP tool result derive from the same projection function (snapshot diff).
- After RC-MCP-4: regenerate MCP tool JSON-Schema; `EmptyInputSchema` no longer appears as a union; `architect_rules` declares its constraint in the schema (client can introspect).

## Review Metadata

- Phase 1 agents: `cleanup-review:code-reviewer`, `cleanup-review:architect-review`,
  `cleanup-review:code-simplifier` (parallel)
- Bootstrap: `architect-base` + `architect-data-api` loaded for every agent
- ADR anchors used: 006, 009, PDR-001
- Read-only review — no source modifications
- **Synthesis note**: organised by root cause. RC-MCP-2, RC-MCP-3, RC-MCP-4, RC-MCP-5, RC-MCP-6, RC-MCP-8 are cross-package echoes — see suite final report.
