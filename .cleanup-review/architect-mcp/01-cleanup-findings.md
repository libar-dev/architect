# architect-mcp — Phase 1 Consolidated Findings

Three parallel reviews complete. Detailed per-agent reports:

- Code quality: [`01a-code-quality.md`](./01a-code-quality.md) — 17 findings (3 Critical, 5 High, 5 Medium, 4 Low)
- Architecture: [`01b-architecture.md`](./01b-architecture.md) — 11 findings (0 Critical, 2 High, 5 Medium, 4 Low)
- Simplification: [`01c-simplification.md`](./01c-simplification.md) — 16 opportunities (5 High, 6 Medium, 5 Low)

## What the package gets right (verification baseline)

Independent positives that bound the criticisms below:

- **`pipeline-session.ts` is the sole cache owner.** One-way watcher signals into the session cache; no handler-side caching. That part of the architecture is sound.
- **Input-side ADR-009 compliance is excellent.** Trust-boundary discipline at MCP tool inputs is consistent for the inputs that have schemas.
- **No reaches into `architect-core/src/scanner/` or `src/extractor/`.** ADR-006 stage-1 carve-out list intact.
- **`process.cwd` mutation removed** (commit `676a916`) — the package has the muscle for this kind of fix.
- **9-file footprint** is concentrated in two real centers (`tool-registry.ts` 666 LOC, `server.ts` 253 LOC, `pipeline-session.ts` 252 LOC). Easy to refactor in one pass.

The findings concentrate in **three architecturally narrow surfaces**: **output-side ADR-009 leaks** (handlers composing their own shapes instead of routing through projection fragments), the **second global-state anti-pattern that escaped commit `676a916`** (`globalThis.console.log` mutation), and **per-tool boilerplate** that wants a table.

## Cross-cutting themes

### T-MCP-1 — CLI/MCP twin discipline drift

Three concrete sites where MCP handlers compose their own output shapes locally instead of routing through the same projection function the CLI uses:

- Quality C3 / Architecture H1 — `architect_search`, `architect_arch_blocking`, `architect_help` hand-build an MCP-only `SectionedDocument` shape. CLI returns plain arrays. Twin-discipline drift; breaks programmatic parity for consumers.
- Quality H2 — `architect_files` defaults `related: true` (CLI defaults `false`). Quietly leaks more data than asked.
- Architecture M4 — `architect_handoff` defaulting diverges from the CLI twin.
- Architecture M3 — `architect_search` stitches projection fragments inside the handler instead of routing through a single projection function.

Same root: when authoring an MCP tool, the temptation is to compose the output locally in the handler; the discipline says "route through `architect-projection`'s shared projection function." There is no mechanical gate enforcing this.

### T-MCP-2 — `parseAndProject*` boundary misuse on the hot path

`parseAndProject*` is the **raw-input** entry per ADR-009. Three handlers use it for inputs that have already been parsed by the MCP transport's Zod gate:

- Quality C1 / Architecture M2 — `architect_documentation`, `architect_config`, `architect_rebuild` call `parseAndProject*` after the boundary already parsed (`tool-registry.ts:575-625`). ADR-009 violation — double-parse. Typed builders (`projectConfig`, `projectDocumentationBundle`) already exist for these.

This is the same shape as CLI's RC-CLI-2 — re-parse on the hot path. Cross-package root cause.

### T-MCP-3 — Global-state mutation that escaped commit `676a916`

`Reflect.set(globalThis.console, 'log', …)` (`server.ts:203-205`) is a permanent global mutation that survives `shutdown()`. Same family as the `process.cwd` mutation that was just removed. The fix that landed for cwd needs a sibling for console.

The structural fix is **a workspace-level lint rule** that bans `Reflect.set(globalThis…)`, `process.chdir`, `globalThis.process = …`, etc. CI would have caught this and would prevent the next instance.

### T-MCP-4 — Zod schema authoring is partial (Zod-first doctrine half-applied)

Five findings cluster around "Zod schemas exist but don't express enough constraints; runtime workarounds fill the gap":

- Quality H1 — `EmptyInputSchema` is `union(strictObject({}) | undefined)` — a confusing JSON-Schema advertised to MCP clients.
- Quality H3 — `architect_rules` enforces `pattern XOR productArea` via imperative `throw` instead of `.refine` on the schema.
- Quality H5 — `parseCliArgs` round-trips a TS-typed object through a Zod discriminated union with no untrusted input crossing — pure ceremony.
- Architecture M5 — mutual-exclusion validation in handler instead of in Zod.
- Simplification M1 — defensive non-object guard before Zod's `strictObject`.

Same root: the schemas are correct at the **field** level but don't express **inter-field** constraints. Refine, or use Zod's built-in `discriminatedUnion` properly.

### T-MCP-5 — Three-file-per-tool authoring + 666-LOC `tool-registry.ts`

`tool-input-schemas.ts` (117 LOC) + `tool-metadata.ts` (104 LOC) + the handler in `tool-registry.ts` mean every tool is authored across three files. The 666-LOC registry is the *symptom*, not the cause.

- Simplification H1 — collapse 21 `defineToolHandler` entries into 3 declarative family tables; ~270 LOC.
- Simplification H2 — merge `tool-input-schemas.ts` + `tool-metadata.ts` into per-tool entries co-located with handlers; ~220 LOC + eliminates three-file authoring.

This is the package's biggest leverage refactor. Cross-package echo: same family as cli's RC-CLI-5 (parser registry) and core's RC-CORE-6 (conditional-spread sprawl) — convention-without-mechanism letting boilerplate accumulate.

### T-MCP-6 — Watcher staleness window with no client signal

Quality H4 — File watcher → cache invalidation has a `debounceMs + buildTimeMs` staleness window. Clients get no `cache_generation` signal to detect that the result was computed before the file change. **Documentation today, generation-counter tomorrow.**

### T-MCP-7 — Conditional spreads (cross-package theme)

Simplification H4/H5 — `omitUndefined` / conditional-spread cliché recurs ~60+ LOC in this small package. Same helper that core (RC-CORE-6) and projection (RC-PROJ-6) want. **One workspace-shared helper.**

### T-MCP-8 — Help-text duplication (echo of helper-duplication theme)

Architecture M1 — help text duplicated across three surfaces. Same family as projection's helper duplication and cli's parser triplication — convention without an audit.
