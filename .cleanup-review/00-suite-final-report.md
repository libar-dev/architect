# Cleanup Review — `@libar-dev/architect-*` Suite Final Report

## Scope

Five packages reviewed sequentially in dependency order, each by three parallel
agents (code quality, architecture, simplification) loaded with `architect-base`
and `architect-data-api`:

| Package | TS files | LOC | Per-package report |
| ------- | -------- | --- | ------------------ |
| architect-core | 106 | ~9,746 | [`architect-core/02-final-report.md`](./architect-core/02-final-report.md) |
| architect-projection | 146 | ~15,318 | [`architect-projection/02-final-report.md`](./architect-projection/02-final-report.md) |
| architect-guard | 38 | ~9,149 | [`architect-guard/02-final-report.md`](./architect-guard/02-final-report.md) |
| architect-cli | 26 | ~3,850 | [`architect-cli/02-final-report.md`](./architect-cli/02-final-report.md) |
| architect-mcp | 9 | ~1,587 | [`architect-mcp/02-final-report.md`](./architect-mcp/02-final-report.md) |
| **Total** | **325** | **~39,650** | — |

**Total findings across the suite**: 294 (24 Critical · 60 High · 72 Medium · 50 Low for quality+architecture) + 88 simplification opportunities (32 High · 45 Medium · 36 Low). These reduce, after cross-package synthesis, to **8 workspace-spanning root causes** and a small number of package-local high-leverage findings.

## How to read this report

This is **not** an enumeration. The per-package final reports already trace findings to package-local root causes. This document does the next layer: identifies the root causes that recur across packages, surfaces the mechanism gaps that allow them to recur, and proposes workspace-level fixes that close the gap mechanically — not one package at a time.

The eight cross-package root causes below are ordered by **leverage** (how many per-package findings each one collapses), not by severity. Severity counts are in the linked package reports.

---

## What the suite gets right (front-load before findings)

Multiple ADRs are honored end-to-end and these positives bound the criticism that follows:

- **ADR-006 stage-1 carve-out list is intact across all five packages.** No file outside the four named exceptions reaches into `architect-core/src/scanner/` or `src/extractor/`.
- **`process.cwd` mutation removed across the workspace** (commit `676a916`) — the muscle for this kind of fix exists. The sibling fix (`globalThis.console.log` mutation, SUITE-RC-3) was missed but is now identified.
- **Strict-TS discipline** (`verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) is enforced and consistent.
- **`architect-projection` is the most disciplined package** — zero non-strict `z.object` callsites, no `@ts-ignore` / `eslint-disable` / `@deprecated` / `as any`, uniform `parseAndProject` boundary. It is the proof that the doctrines are achievable; the gaps in other packages are not "the doctrines are wrong," they are "the audits never got built."
- **`architect-guard`'s FSM decider is pure** — verified end-to-end. ADR-007's typed boundary (`ProcessStatusValue` 4 values, `ProcessGuardRule` 6 values, `candidate` excluded) is intact.
- **`architect-mcp`'s `pipeline-session.ts` is the sole cache owner** with one-way watcher signals. That part of the architecture is sound.

These positives mean the criticisms below are about **perimeter discipline**, not about misplaced foundations.

---

## Eight cross-package root causes

Each is named by its mechanism. Underneath each is the per-package mapping (which package-local root cause it explains), the per-package findings it collapses, the workspace-shared structural fix, and the **mechanism gap** that explains why the same shape recurred in multiple packages.

### SUITE-RC-1 — Silent failures at trust boundaries

**Mechanism.** Each layer that *should* surface failures as diagnostics has at least one site that *silently* drops them — `console.warn` + null return, `void warningArray`, swallowed `safeParse` reason, bare `catch {}`, fallthrough on missing positional.

**Per-package mapping.**
- core RC-CORE-1 — 3 Criticals (dual-source extractor, doc-extractor `void`, build-pipeline silent drop)
- guard RC-GUARD-2 — bare `catch {}` in 4+ sites, missing-base-ref indistinguishable from validation failure
- cli RC-CLI-7 — `pattern <Name>` silent fallthrough, REPL swallows

**Findings collapsed across packages.** ~11.

**Mechanism gap.** No workspace ESLint rule bans `console.*` in extraction/lint surfaces, bans bare `catch {}` in production code outside test fixtures, or requires `Result<T, E>`-style returns at named trust boundaries.

**Workspace fix.**
1. Workspace ESLint config with:
   - `no-console` scoped to `packages/architect-core/src/extractor/**`, `packages/architect-core/src/generators/**`, `packages/architect-guard/src/lint/**`, `packages/architect-cli/src/**`.
   - `no-bare-catch` (custom rule) — every `catch (e)` must use `e`.
   - `no-void` for unused-expression `void` in those same scopes.
2. A workspace-shared `DiagnosticBus` interface in `architect-core` that extraction, lint, and CLI all push to. CI test asserts that any "warning"-class condition produces at least one diagnostic.

**ADR anchor.** ADR-007 §Context explicitly describes the failure mode this fixes (silent extraction drops).

### SUITE-RC-2 — `z.strictObject` discipline incomplete + cross-field constraints in handlers

**Mechanism.** Zod-first doctrine exists in `CLAUDE.md`; no lint rule enforces it. Two failure modes:
- `z.object` at the trust boundary (extra fields silently pass) — 19 callsites in core.
- Cross-field constraints expressed via imperative `throw` instead of `.refine` — multiple sites in mcp.

**Per-package mapping.**
- core RC-CORE-2 — 19 `z.object` callsites including `BusinessRuleSchema` and all of `extracted-shape.ts`
- mcp RC-MCP-4 — `EmptyInputSchema` weird union, `architect_rules` mutual exclusion via `throw`, `parseCliArgs` ceremonial Zod round-trip
- cli RC-CLI-3 — hand-rolled `is*` type guards and `knownTypes` whitelists where Zod schemas would prevent drift
- guard side: `createViolation` cast contradicts the typed contract

**Findings collapsed across packages.** ~15.

**Mechanism gap.** No CI gate verifying that every schema in `validation-schemas/**` uses `z.strictObject`; no lint rule banning `is*` discriminator predicates outside Zod schemas; no test that round-trips MCP tool input JSON-Schema through a Zod-schema generator and asserts they agree.

**Workspace fix.**
1. Custom ESLint rule `architect/no-zod-object-in-validation-schemas` scoped to `packages/architect-*/src/validation-schemas/**` and any `tool-input-schemas.ts`.
2. ESLint rule banning custom `is*` predicates outside `architect-core/src/validation-schemas/**` — they MUST be a Zod schema.
3. One-commit `z.object → z.strictObject` codemod for the 19 core sites + the mcp Empty/union shapes.

**Knock-on benefit.** RC-PROJ-2 (markdown renderer content-safety bypasses) and RC-CLI-2 (boundary slips) are partly enabled by upstream permissive schemas. Strict-object discipline at the boundary is the most cost-effective hardening for downstream renderer bugs.

### SUITE-RC-3 — Global-state mutation as anti-pattern

**Mechanism.** Process-level singletons mutated for convenience: `process.cwd`, `globalThis.console.log`. Commit `676a916` removed one instance (cwd in MCP); another instance (`console.log` in MCP) is permanent and survives shutdown; the cwd anti-pattern also persists in `cli/generate-docs.ts`.

**Per-package mapping.**
- mcp RC-MCP-3 — `Reflect.set(globalThis.console, 'log', …)` (Critical; survives shutdown)
- cli RC-CLI-1 — `process.chdir` in `generate-docs.ts:172-181` (already fixed in MCP, still present here)

**Findings collapsed.** ~4.

**Mechanism gap.** The `676a916` fix was site-specific; no workspace lint rule prevents the next instance.

**Workspace fix.** ESLint rule (custom or `eslint-plugin-functional`-style) banning, across `packages/architect-*/src/**`:
- `Reflect.set(globalThis…`
- `globalThis.process = …`, `globalThis.console.* = …`
- `process.chdir(…)`
- direct `process.env.X = …`

Allow-list any necessary site explicitly via inline rule disable + comment justifying.

### SUITE-RC-4 — No-BC convention without a CI gate (alias proliferation, parallel implementations)

**Mechanism.** Pre-1.0 no-BC is doctrine. Multiple packages have accumulated aliases, helper duplications, and `.internal.ts` breaches because no CI audit catches them.

**Per-package mapping.**
- core RC-CORE-4 — 5 alias names for status schema (`StatusValueSchema`, `DefaultPatternStatusSchema`, `PatternStatusSchema`, `AcceptedPatternStatusSchema`, `AcceptedStatusSchema`), `RuntimePatternGraph` alias, two `ValidationSummary` shapes, `'codec' + 'Options'` lint dodge
- guard RC-GUARD-6 — wildcard `export *`, lint engine published through three doors, no `.internal.ts` convention enforced
- projection RC-PROJ-5 — `parseBusinessRuleAnnotations` duplicated verbatim across `_shared` and `governance`, `getPatternName` parallel implementations, `governance/index.ts` re-exports a type from `.internal.ts` sibling, `documentation-type-registry.*.ts` four-file naming pattern with undefined privacy
- cli RC-CLI-1 + RC-CLI-5 — `generate-docs.ts` as a parallel CLI; three parallel argv parsers
- guard RC-GUARD-8 — duplicated severity tally + `discoverFiles` / `readFileSafe` across runners; `createViolation` cast
- mcp RC-MCP-8 — help text duplicated across three surfaces

**Findings collapsed across packages.** ~25.

**Mechanism gap.** Each package owns its own audits at best. There is no workspace-level:
- Duplicate-named-exports check across each package's public barrel.
- Cross-file duplicate function-body audit (AST-based, name-agnostic).
- Import-from-`.internal.ts`-outside-same-directory ban.
- Public-surface diff against last release.

**Workspace fix.** Lift `architect-projection`'s audits (`scripts/options-schema-barrel-audit.mjs` + `scripts/jsdoc-boilerplate-audit.mjs`) to the workspace root and tighten:
1. **Barrel hygiene audit** — every package barrel must enumerate named exports; no `export *`. Audit walks the AST of `src/index.ts` for each package.
2. **Duplicate-body audit** — AST-based detection of duplicate function bodies workspace-wide (`jscpd` or a custom Zod-typed AST walker).
3. **`.internal.ts` audit** — imports from `*.internal.ts` only from same directory.
4. **Public-surface diff** — every release tags the public surface; CI compares against the tag.

Pre-1.0 doctrine is "delete the alias, force consumers to update." The audit is what makes the doctrine mechanical.

### SUITE-RC-5 — `parseAndProject*` boundary slips (re-parse on hot paths)

**Mechanism.** ADR-009 specifies `parseAndProject*` as the **raw-input** entry; internal callers use typed `project*` helpers and typed fragment builders. Both CLI and MCP have handlers that call `parseAndProject*` after the transport's Zod gate already parsed, double-parsing on the hot path.

**Per-package mapping.**
- cli RC-CLI-2 — argv double-parse at `pattern-graph-cli.ts:255` then `:266`; `output.ts:44-51` does `JSON.parse(renderPrettyJson(bundle))` (stringify-a-string); `documentation` command re-parses already-typed `disclosureLevel`
- mcp RC-MCP-2 — `architect_documentation`, `architect_config`, `architect_rebuild` call `parseAndProject*` after the boundary already parsed; typed builders already exist

**Findings collapsed across packages.** ~7.

**Mechanism gap.** Architecture-level intent is correct; no ESLint rule scopes `parseAndProject*` imports to boundary files.

**Workspace fix.**
1. ESLint rule banning imports of `parseAndProject*` symbols from inside `packages/architect-cli/src/cli/commands/**` (use the matching `project*` helper) and `packages/architect-mcp/src/tool-registry.ts` (same).
2. Allow-list the named boundary files (e.g. `packages/architect-cli/src/cli/pattern-graph-cli.ts`, `packages/architect-mcp/src/server.ts` if any).

**ADR anchor.** ADR-009 §"Parse once at external projection boundaries" — the rule above is literally the ADR mechanized.

### SUITE-RC-6 — Conditional-spread + per-key dispatch sprawl

**Mechanism.** Every new field gets its own `...(x !== undefined ? { x } : {})` spread instead of going through a helper. Every new tag gets its own switch arm. Net effect: ~235 sites across the workspace; ~870 LOC of boilerplate.

**Per-package mapping.**
- core RC-CORE-6 — ~95 sites in `buildGherkinPatternDraft`, `buildPattern`, `extractPatternTags` (350-line dispatch); ~400 LOC removable
- projection RC-PROJ-6 — ~80 sites; perf knock-on (every empty-object spread is an allocation in rendering hot path)
- mcp RC-MCP-6 — ~60 LOC
- guard RC-GUARD-8 — same family (severity tally + discoverFiles/readFileSafe duplication); ~50 LOC

**Findings collapsed across packages.** ~25 (across the simplification reports).

**Mechanism gap.** No shared helper; no lint rule discouraging the pattern.

**Workspace fix.**
1. One `pickDefined<T extends object>(obj: T): Partial<T>` helper in `architect-core/src/utils/`, exported via the public surface.
2. Workspace-wide refactor (one coordinated commit per package).
3. Optional: ESLint rule discouraging `...(x !== undefined ? { x } : {})` in favor of `...pickDefined({ x })`.

Estimated workspace impact: **~600+ LOC removed**, zero behavioural risk because `parseAtBoundary` re-validates downstream and types are unchanged. The biggest mechanical-cleanup win in the entire suite.

### SUITE-RC-7 — Helper duplication / parallel implementations

**Mechanism.** Convention-without-mechanism (RC-4's twin). When parallel work landed simultaneously, helpers that should have been consolidated stayed as parallel implementations. AST-based duplicate-body audit would catch all of these.

**Per-package mapping.**
- projection — `parseBusinessRuleAnnotations`, `deduplicateScenarioNames`, `getPatternName`, `normalizeAnnotationText` each duplicated 2×
- cli RC-CLI-1 + RC-CLI-5 — `generate-docs.ts` is a parallel CLI; three parallel argv parsers; `parseFilterValue` duplicated
- guard RC-GUARD-8 — severity tally, `discoverFiles`, `readFileSafe` duplicated across runners
- mcp RC-MCP-5 — three-file-per-tool authoring (`tool-input-schemas.ts` + `tool-metadata.ts` + handler in `tool-registry.ts`)

**Findings collapsed across packages.** ~20.

**Workspace fix.** Same as SUITE-RC-4 (duplicate-body AST audit). Once the audit lands, each duplication is a CI failure that forces consolidation.

### SUITE-RC-8 — Infrastructure accreted in wrong layer (layering inversions)

**Mechanism.** Cross-cutting infrastructure landed in higher layers (CLI, read-api) because the lower layer didn't expose what was needed. The structural fix is to push the infrastructure down.

**Per-package mapping.**
- core RC-CORE-5 — `getPatternName` lives in `read-api/` but imported by `extractor/` and `generators/pipeline/` (producer → consumer cycle). Lossy local types in `read-api/types.ts` because canonical schemas weren't exposed.
- cli RC-CLI-6 — sha1/mtime file-cache layer lives in `pattern-graph-cli-runtime.ts`; belongs next to `buildPatternGraph` in `architect-core` so MCP gets it too. Source-plan resolver in two parallel implementations.
- guard RC-GUARD-5 — `cli/validate-patterns.ts` (938 LOC) hosts business logic; CLI should be a thin composition root.

**Findings collapsed across packages.** ~8.

**Workspace fix.** Three coordinated refactors, none individually large:
1. Move `getPatternName` to `architect-core/src/validation-schemas/extracted-pattern.ts` (next to its inputs).
2. Lift the file-cache from `architect-cli/src/cli/pattern-graph-cli-runtime.ts` to `architect-core/src/generators/pipeline/build-pipeline.ts` — both CLI and MCP consume.
3. Extract business logic from `architect-guard/src/cli/validate-patterns.ts` into `architect-guard/src/validation/validate-patterns-runner.ts`.

**Cross-package coordination.** All three changes touch package boundaries; ship as one PR with deps updated atomically. Pre-1.0; no compat shims.

---

## Package-local high-leverage findings (not cross-package, but suite-significant)

Five findings are package-local but architecturally consequential enough that the suite report should flag them. None of them gets resolved by the workspace-shared mechanisms above.

### S-1 — Markdown content-safety has three ADR-009 bypasses (projection)

Critical-class. `render-markdown.ts` has three independent escape stages, each with a different bypass:
- HTML-entity-encoded URL payloads (`&#x6A;avascript:`)
- ASCII-only control-char filter (U+0085/2028/2029 pass through)
- Setext-heading injection in prose (no escape on `=`/`-` runs at column 1)

Plus three more Highs (mailto, entity decoder, mermaid labels). See projection RC-PROJ-2.

**This is the single highest correctness risk in the suite.** Workspace-shared root causes don't fix it; needs a focused content-boundary pass with property-based fuzz testing.

### S-2 — `RenderableDocument` IR was never built (projection)

ADR-005 mandated a typed IR consumed by a codec-agnostic renderer. Instead, the markdown renderer is 2,222 lines with 10 bespoke per-fragment normalizers + a hidden reflection-based path (`(fragment as Record<string, unknown>)['sections']`). Every future renderer bug ships in this dispatcher.

Needs a **project-level decision** — formalize the Fragment-as-IR hybrid OR build the originally-specified `RenderableDocument`. Capture in an ADR amendment. See projection RC-PROJ-1.

### S-3 — FSM perimeter is heuristic where it should be deterministic (guard)

The decider is pure (verified); the detection layer that feeds it has 6 findings:
- `@architect-unlock-reason` rule downgraded from BLOCKED to WARN
- Docstring-aware status detection resets at every diff hunk boundary
- `--file` mode reports unchanged files as modified
- `ProcessGuardRule` union not exhaustiveness-bound to handlers
- Terminal-state bypass too broad
- New-file transition semantics conflict with FSM-edge validation

The deterministic centre is surrounded by inputs that can lie to it. See guard RC-GUARD-1.

### S-4 — `tier-a-baseline.ts` is a 1000-LOC legacy form of the principled `dangling-baseline.ts` (guard)

`dangling-baseline.ts` is the right shape (JSON file + `--baseline` flag + CI gate). `tier-a-baseline.ts` is a 1000-LOC in-code allowlist for the same concept. Migrate; delete the in-code form. See guard RC-GUARD-4.

### S-5 — CLI/MCP twin discipline drift at 4 verbs (mcp)

`architect_search`, `architect_arch_blocking`, `architect_help` hand-build a local `SectionedDocument` shape; `architect_files` defaults `related: true` (CLI defaults `false`); `architect_handoff` defaulting diverges. Breaks programmatic parity between CLI and MCP for the same verb. See mcp RC-MCP-1.

---

## Workspace-level mechanisms to land (the synthesis recommendation)

The eight cross-package root causes collapse if these mechanisms exist. Each can land before the per-package refactors and would prevent regression.

| Mechanism | Closes root cause(s) | Effort |
| --------- | -------------------- | ------ |
| Workspace ESLint config with `no-console` (scoped), `no-bare-catch`, `no-void-stmt` (scoped) | SUITE-RC-1 | small |
| `architect/no-zod-object-in-validation-schemas` lint rule | SUITE-RC-2 | small |
| Workspace-wide ban on global-state mutation (`Reflect.set(globalThis…)`, `process.chdir`, etc.) | SUITE-RC-3 | small |
| Barrel-hygiene + duplicate-body + `.internal.ts` AST audits at workspace root | SUITE-RC-4 + SUITE-RC-7 | medium |
| `parseAndProject*` import scope rule | SUITE-RC-5 | small |
| `pickDefined<T>` helper in `architect-core/utils/` + workspace refactor | SUITE-RC-6 | medium (~600 LOC removal) |
| Workspace-shared `DiagnosticBus` interface | SUITE-RC-1 (full closure) | medium |
| ADR amendment on `RenderableDocument` decision (formalize hybrid OR build IR) | S-2 (precondition) | small (decision) + medium (impl) |

These mechanisms are the actual deliverable of this review. Per-package fixes consume them.

---

## Recommended Action Plan (workspace-coordinated)

Ordered for **leverage and risk**: cheapest preventive measures first, biggest mechanical wins next, project-level decisions in parallel, package-local follow-up last.

### Phase 1 — preventive lint rules (cheap, immediate)

1. Workspace ESLint config with `no-console`, `no-bare-catch`, `no-void-stmt` in named scopes (closes SUITE-RC-1 going forward).
2. `architect/no-zod-object-in-validation-schemas` + ban on hand-rolled `is*` predicates (closes SUITE-RC-2 going forward).
3. Global-mutation ban rule (closes SUITE-RC-3 going forward).
4. `parseAndProject*` import-scope rule (closes SUITE-RC-5 going forward).

Phase 1 prevents new instances of all four families without yet fixing the existing ones.

### Phase 2 — audits (workspace-level hygiene infrastructure)

5. Lift `architect-projection`'s audits to workspace root; tighten:
   - Barrel-hygiene (no `export *`).
   - Duplicate-body AST audit (AST-based, name-agnostic).
   - `.internal.ts` privacy audit.
   - JSDoc-boilerplate audit (already exists; cover all packages).

Phase 2 closes SUITE-RC-4 and SUITE-RC-7 going forward.

### Phase 3 — workspace-shared infrastructure

6. `pickDefined<T>` helper in `architect-core/utils/`; export via public surface. Workspace refactor across all 5 packages. **~600+ LOC removed.** Single PR.
7. `DiagnosticBus` interface in `architect-core`; extraction, lint, CLI consume. Workspace refactor of existing silent-drop sites (SUITE-RC-1 closure for already-shipped code).

### Phase 4 — coordinated cross-package refactors

8. SUITE-RC-8 (infrastructure-in-wrong-layer): move `getPatternName` to core; lift file-cache from CLI to core; extract business logic from guard CLI. Single PR; pre-1.0; no shims.
9. `z.object → z.strictObject` codemod for core's 19 sites + mcp's Empty/union shapes. Single PR.
10. Status-schema alias collapse (core RC-CORE-4 + RC-CORE-5 together). Pre-1.0; break and document.

### Phase 5 — package-local load-bearing fixes (parallel)

11. **Projection — markdown content-safety (S-1).** Highest correctness risk in the suite. Coordinated content-boundary pass; property-based fuzz testing.
12. **Projection — IR decision (S-2).** Project-level ADR amendment; can run in parallel.
13. **Guard — FSM perimeter (S-3).** Three coordinated changes: restore unlock-reason severity, stateful hunk detection, `assertNever` exhaustiveness.
14. **Guard — tier-A baseline migration (S-4).** Adopt the `dangling-baseline.ts` mechanism; delete 1000-LOC in-code allowlist.
15. **MCP — CLI/MCP twin parity (S-5).** Lift 4 divergent compositions into `architect-projection`; CI test that asserts twin parity per verb.
16. **Projection — re-derived relationship sites (RC-PROJ-3 closure).** Replace 4 local Map/Set constructions with `relationshipIndex` reads.
17. **MCP — `console.log` mutation fix + per-tool declarative entries (RC-MCP-3 + RC-MCP-5).**
18. **CLI — `generate-docs.ts` consolidation (RC-CLI-1).** Delete the parallel CLI by routing through `_shared/`.

### Phase 6 — independent surgical fixes

A handful of findings don't reduce to any cluster — surgical, individually small. Track in backlog: catastrophic-backtracking risk in `fileOptInPattern`, `safeRealpathSync` fallback weakness, `KNOWN_ACRONYMS` placeholder overflow, sync `fs.statSync` storm on cold-start, etc.

---

## Verification Suggestions (suite-level)

- `pnpm install && pnpm build && pnpm typecheck` after each phase.
- `pnpm test:dogfood` after Phases 3 / 4.
- `pnpm test:perf:baseline` (in projection) after Phase 3 — `pickDefined` rollout should improve allocation pressure.
- `pnpm architect:query arch dangling --strict --baseline packages/architect-guard/src/lint/dangling-baseline.ts` after Phase 4 — confirms no cross-package reference drift.
- `pnpm architect:query bundle <Pattern>` round-trip on `DefineConfig` and `ConfigLoader` (canonical completed reference patterns) — output structurally identical before/after each phase.
- After Phase 5.11 (markdown content-safety): property-based fuzz suite with HTML-entity payloads, Unicode line separators, setext-heading injection, mermaid label fuzz.

---

## Summary of cross-package leverage

The eight workspace-shared root causes collapse approximately **115 of the 294 quality+architecture findings** and approximately **45 of the 88 simplification opportunities**, leaving:
- **~95 quality+arch findings** that are package-local (mostly Medium and Low; the load-bearing ones are S-1 through S-5 above)
- **~43 simplification opportunities** that are package-local (mostly Medium and Low)
- **~16 surgical fixes** that don't cluster (Phase 6 backlog)

In other words: **the eight workspace mechanisms are 40-50% of the value of the review**. The remaining value is distributed across the five package reports for surface-specific work.

---

## What this review is NOT

To be clear about scope:

- **Not a verdict on whether the architect family is ready to ship.** The reviewed dimensions are quality / architecture / simplification, not feature completeness or product readiness.
- **Not a security audit.** Several security-adjacent findings appear (markdown XSS at S-1, regex backtracking, path canonicalisation) but a focused security pass would be a separate review.
- **Not a perf review.** Several perf-adjacent findings appear (RC-PROJ-4) but the perf-baseline gate is the package's first line of defence and is intact.
- **Not actionable on guard's executable-Gherkin behaviour.** The step linter findings (RC-GUARD-7) note the regex-vs-AST mechanism issue but don't catalog every false-positive.

## Review Metadata

- Reviews completed: 2026-05-19
- Per-package agent runs: 15 (5 packages × 3 lenses) — code-reviewer, architect-review, code-simplifier
- Each agent loaded `architect-base` + `architect-data-api` skills via the embedded bootstrap; verified pattern state through `pnpm architect:query` instead of file scanning.
- ADR anchors used across the suite: 003, 005, 006, 007, 009, PDR-001.
- Read-only review — no source modifications. The `.cleanup-review/` tree is the deliverable.
- Drill-down: each per-package `02-final-report.md` traces findings through package-local root causes; each `01a-code-quality.md` / `01b-architecture.md` / `01c-simplification.md` has full file:line evidence and per-finding remediation.
