# Session reports and learnings

> Append-only log for the **active** workstream (WS-3). One entry per session, tight (<20 lines).
> Completed WS-0 / WS-1 / WS-2 session log archived → [`archive/SESSION-REPORTS-completed.md`](archive/SESSION-REPORTS-completed.md).

---

### WS-3 Session 12 — ARCHITECTURE.md diagram restructure (+ executable-spec ingestion verified)

Scope: the generated `docs-live/ARCHITECTURE.md` was a single Mermaid `graph TD` of 237 nodes
/ 217 edges / 23 subgraphs (~60 KB) — past Mermaid's 50 000-char `maxTextSize`, so it failed to
render ("Maximum text size in diagram exceeded") and was an unreadable hairball. Fixed at the
**generator** (it's a projection, never hand-edited). Decision **D-14**.

**Verified first (user question):** PatternGraph aggregation ingests executable specs, not just
`architect/specs/`. `PACKAGE_SELF_HOSTING_SOURCES.features` (`self-hosting.ts:79-90`) globs
`tests/features/**` + every `packages/*/tests/features/**`; live graph has 35 executable-test
patterns with working `implementsPatterns` edges (e.g. `ArchitectureNavigationProjectionExecutableTests`).
No gap — report-only.

**Change (No-BC, refactor carve-out):** `ArchitectureDiagramSchema.diagram: MermaidBlock` →
`sections: {title, description?, diagram, patterns}[]` (kept `scope`/`scopeValue`/`patterns`).
Builder (`architecture-diagram.internal.ts`) now emits a **Context Map** (`graph LR`,
inter-group edges, when ≥2 groups) + one detail diagram per group (`graph TD`, intra-group
edges). Grouping = bounded-context → role fallback → **source-area/package fallback** (via
`context.packageResolver`; resolver error **propagated, not swallowed** — see Codex-fix note
below). Normalizer renders one `## Overview`, then `### <section>` per diagram. Result: **1 → 29
bounded diagrams, largest 11 754 chars** (was ~60 KB); the would-be 57-node "Uncategorized" dump
split into 4 labeled source-area buckets.

**Codex stop-time fix — no silent downgrade of package-resolution failures.** First pass wrapped
`resolvePackageLabel` in `try/catch → undefined`, silently bucketing resolver failures as
"Uncategorized" — subverting `PackageResolver`'s hard-error-on-miss contract
(`package-resolver.ts:16-21`: "actionable feedback over silent fallback"). Fixed: propagate the
`UNMAPPED_PACKAGE` error; `packageLabel` is now a required string and the dead "Uncategorized"
branch was removed. Removing the catch left the generated doc **byte-identical** (every dogfood
file maps), proving the catch-all was unreachable dead code.

**Coverage:** structural invariant added to `config-documentation.feature`
(`DocumentationCompositionProjectionExecutableTests`, the executable home — ≥2 sections, pattern
partition, context-map present); a dogfood render-budget guard
(`tests/features/generation/architecture-doc-render-budget.feature`, intentionally **not** an
@architect pattern — tooling guard) asserts every ```mermaid block in the generated doc < 50 000
chars. Generalized root `vitest.config.ts`generation glob to`tests/steps/generation/\*\*`.

All 12 §6 gates green: pkg test (proj 1576), test:dogfood 1061, perf 3/3, dangling --strict 0,
audit:subtractive 0, docs:all deterministic (only ARCHITECTURE.md changed, byte-stable across
two regens). guard `--staged`: **0 status transitions / 0 deliverable changes**; one
`completed-protection` hit on `config-documentation.feature` (a completed spec) → added
`@architect-unlock-reason` per **D-10** precedent.

**Key learning — readability degrades gracefully along the taxonomy.** No single grouping axis
covers the graph (bounded-context 157/276, role 173/276). A fallback chain
(bounded-context → role → package) turns "un-classifiable" into "classified by the best axis
available," and `packageResolver` (file → workspace package) is the always-present floor. The
residual large buckets (Core 22, Host/Dev 22) are an annotation-coverage signal, not a diagram
defect — a WS-1-style follow-up could add role/bc to those patterns to shrink them.

**Incidental:** AGENTS.md/CLAUDE.md say "docs-live/ is generated and gitignored" — it is in fact
**git-tracked** (`git ls-files docs-live` returns it), which is why `docs:all && git diff
--exit-code docs-live` is a live gate. Wording is stale; flagged in D-14, separate fix.

---

### WS-3 Session 13 — Shrink ARCHITECTURE.md catch-all buckets (filter test features) + production annotation fixes

Prior commit = `5b7ab6e` (Session 12). Decision **D-15**. D-14 left large catch-all buckets that were
almost entirely executable-test features. Grounded the fix in value-transfer doctrine
(`role`/`bounded-context` are implementation-classification tags owned by **production** code; test
features own identity + invariants + the `@architect-implements` edge), so the move is to **filter
test-feature patterns out of the component view**, not mass-tag them.

**Change (`architecture-diagram.internal.ts`):** `filterArchitecturallyInterestingPatterns` now
excludes `isTestFeaturePattern` — patterns whose `source.file` is under `tests/features/` (the
canonical executable-spec home). Result: **237→169 patterns, 29→24 diagrams**; `role: projection`
(17) / `Architect Core` (22) / `Host (Dev)` (22) / `MCP` (4) buckets all vanish; residual
`role: contract (4)` = genuine cross-cutting production contracts; 9-ADR bucket retained. Largest
mermaid block 11 753 chars (render-budget guard green).

**Load-bearing learning — `implementsPatterns` is NOT a test discriminator.** First attempt filtered
on non-empty `implementsPatterns` and over-filtered real components (`process-guard` 6→2, `lint`
4→3): **production sub-modules legitimately `@architect-implements` a barrel** (verified
`DeriveProcessState`/`DetectChanges`/`SessionStateReader`/`ProcessGuardTypes` →`ProcessGuardLinter`).
Corrected to key on the source path. Also re-confirmed: `docs:all` runs the **compiled** bin
(`node_modules/.bin/architect-generate`), so a projection-code change needs `pnpm build` before
`docs:all` reflects it (annotation/data changes flow through without a rebuild).

**Production annotation fixes (D-15):** `process-guard-rules.feature` `:guard`→`:process-guard`
(phantom 1-pattern `guard` context removed; contexts 22→21; test feature is `active`, no unlock
needed); added `@architect-bounded-context` to `BoundedContextFragmentContract` +
`PatternRelationsFragmentContracts` (`pattern-relations`) and `DeliveryReportingFragmentContracts`
(`delivery-reporting`); left the cross-context union barrels + core types untagged. Fixed the stale
"docs-live gitignored" wording in `AGENTS.md` (closes D-14 incidental / followUp #2).

**Coverage:** new executable Rule in `config-documentation.feature` ("component view shows production
components, not test-feature patterns") with its own mixed production+test fixture.

**Context-map semantics fix (Codex stop-time review, same session).** The context map collapsed all
edge types to one solid `-->` per ordered group pair, but the legend reads solid = dependency. Since
`enables` is a derived REVERSE edge, rendering it forward inverted direction and double-counted —
**34 of 68 map arrows were contradictory bidirectional pairs.** Fixed `aggregateInterGroupEdges` to
aggregate only forward structural edges (`depends-on`/`uses`); `enables`/`see-also` stay in the detail
diagrams. Map: 68→**35 arrows**, bidirectional 34→**1** (the survivor `lint ↔ process-guard` is a real
mutual dependency). Sharpened the map description; added executable Rule "The context map aggregates
only forward dependency edges between groups" with an opposing-edge fixture. Lesson: a relationship
graph that mixes forward + derived-reverse edges into one undifferentiated arrow lies about direction.

All §6 gates green: typecheck, format:check, proj test (**75** in config-documentation; full suite
pass), test:dogfood **1061**, docs:all byte-deterministic (md5-stable across two regens), guard
`--staged` **0 status transitions / 0 deliverable changes** (config-documentation's existing
`@architect-unlock-reason` satisfies completed-protection), dangling `--strict` 0.

### Rules for next session

1. **Never use `implementsPatterns` to decide test-vs-production.** Production sub-modules implement
   barrels. Key on the source path (`tests/features/`) or the `.feature` extension.
2. **`docs:all` reads the compiled bin** — run `pnpm build` before `docs:all` when you change
   projection/renderer **code** (annotation/graph data changes don't need it).
3. WS-3 remaining: other generated-doc reviews (PATTERNS/ROADMAP/CHANGELOG/requirements) for the same
   "is this readable + correctly scoped" lens; the HUD/progressive-disclosure ideation (D-15 sibling,
   captured separately) is ideation-only until disclosure defaults are agreed.

---

### WS-3 Session 14 — Finalize ARCHITECTURE.md (exclude ADRs) + ship HUD disclosure step 1+2

Prior commit = `a7b7b5b` (Session 13). Decisions **D-16** (exclude decision records from the
component view) + **D-17** (HUD `--disclosure` reuses `ContentRichness`, default `summary`).

**Part A — ARCHITECTURE.md finalization.** Added `isDecisionRecordPattern` (source under
`architect/decisions/`) to `filterArchitecturallyInterestingPatterns`, mirroring the test-feature
filter. The component view no longer renders the 9 ADR/PDR records: **169→160 patterns, 24→23
diagrams**; the misleading `Unclassified · Architect Package Content` bucket + its context-map node
are gone; only the intentional `role: contract (4)` fallback remains. New executable Rule
("component view omits decision-record patterns") + mixed production/decision fixture in
`config-documentation.feature`. **Annotation audit (the "bring back annotations" lever) found
nothing to do:** `arch coverage` confirms every `role`/`bounded-context` gap is a working-state
artifact (`architect/{decisions,specs,releases}/`), not production — production component
classification is already complete (WS-1). No mass-tagging (D-15 doctrine).

**Parts B+C — overview HUD.** `OverviewDigest` gains a structured `generatedViews` index (8
`docs:all` surfaces, each with its `documentation <type>` verb). `RenderCompactOptions` gains
`richness`; `renderOverviewDigest` branches: `name-only` = progress line only, `summary` (default)
= progress + active phases + top-5 blockers + "… and N more" + one-line views + cliHints, `full` =
all blockers + itemized views. CLI: per-command `--disclosure` flagParser on `overview` (default
`summary`) — collision-free with the `documentation` verb's progressive-level `--disclosure`. MCP:
`architect_overview` takes an optional `disclosure` input, defaults `summary`, parity via the shared
renderer. The 40-line blocking wall the bootstrap call used to dump is now 5 lines + a pointer.

**Gates:** all §6 green — pkg tests proj **1601** / cli **27** / mcp **172**, test:dogfood **1061**,
typecheck (pkg+dogfood), lint, format:check, validate:all, perf 3/3, audit:subtractive 0,
`docs:all` md5-deterministic (only ARCHITECTURE.md changed), dangling `--strict` exit 0.

**Key learnings**

1. **Two disclosure vocabularies, do not conflate (D-17).** `ProgressiveDisclosureLevel`
   (`essential…advanced`) only means something via a per-doc-type `disclosureMatrix` (`generate-docs`);
   the read surface has no doc-type, so it uses `ContentRichness` (`name-only…full`) directly. And
   `render-compact-text.ts` was NOT disclosure-aware — only `render-markdown.ts` branched (and only
   for `BusinessRuleSet`). Disclosure on the read surface is real renderer plumbing, not a free reuse.
2. **Keep the renderer's `undefined` richness = full.** Defaulting to `summary` _at the surface_
   (CLI command + MCP handler), not in the renderer core, kept every internal caller, fixture, and
   non-branching fragment byte-identical — the blast radius was just `overview`. A renderer-core
   default would have churned every compact verb + many tests.
3. **`--disclosure` had to be per-command, not global** — the `documentation` verb already owns a
   `--disclosure <progressive-level>`; a global flag would have shadowed it. Same flag name, different
   value vocabulary per command, no collision.
4. **The maintainer's ADR observation was correct and is its own workstream.** ADR-006's prose carries
   transient problem-state + a specific-files exception table — execution context an ADR must not hold
   (§3/§7). Excluding ADRs from the _view_ is this session's scope; cleaning the _records_ is deferred
   (amend via a new ADR, never edit durable records inline — PREAMBLE rule 4).

**Codex stop-time fix (same session, commit `51111b0`).** The component-view filter's
"show something rather than nothing" fallbacks **bypassed the test/decision exclusion when the
input was entirely excludable**: `filterArchitecturallyInterestingPatterns` fell back to the
unfiltered set when no production patterns remained, and `collectArchitectureNodes` fell back to
`withFallback` when the filter emptied — so a decision-only (or test-only) component context
re-rendered the excluded patterns. Fix: the test/decision exclusion is now **unconditional** (no
fallback to the unfiltered set); graceful degradation is kept **only** for the classification filter
(production-but-unclassified → show ungrouped); `collectArchitectureNodes` treats the component
filter result as authoritative, including when empty → an empty component view. Regression scenario
added (decision-only context renders no patterns). Mixed fixtures could not catch it — production
patterns kept the set non-empty. Dogfood docs byte-identical (production patterns unaffected).
**Lesson: a "never render nothing" fallback silently defeats a hard exclusion when the excluded set
is the whole input — exclusion must be unconditional; only the softer filter degrades gracefully.**

### Rules for next session

1. **Read-surface verbosity is a render-time parameter now.** To make another verb terse, add
   per-fragment richness branching in `render-compact-text.ts` + a `--disclosure` flagParser; default
   `summary` at the command, never in the renderer core.
2. **`overview`'s default output is now `summary`.** `--disclosure full` reproduces the prior wall;
   skills/docs that quoted the full bootstrap output should note the flag.
3. ADR-content hygiene (D-16) is a separate workstream — do not edit `architect/decisions/*` inline.

---

### WS-3 Session 15 — Architecture glimpse in `overview` (D-18)

Prior commit = `38a3e72` (Session 14 line); committed `0ba3f92..1691fcb`. Added a disclosure-gated
`=== ARCHITECTURE ===` section to `overview` (after PROGRESS, before BLOCKING): `name-only` omits;
`summary` (default) = a coarse **package-level** context map (5 production packages cli/core/guard/mcp/projection
= 160 patterns) + an "explore via the API, not grep" pointer; `full` adds the bounded-context Context Map
identical to `ARCHITECTURE.md`. **Reuse:** extracted the context-neutral graph machinery to
`projections/_shared/architecture-graph.internal.ts` (+ a first-class `'package'` `GroupingMode`), consumed by
both `ArchitectureDiagramProjection` and `OverviewProjection`; `docs:all` byte-identical (behavior-preserving).
Mermaid-in-fragment per ADR-005. **Production-only component view** now excludes ALL working-state under
`architect/` (generalizes D-16) → the glimpse no longer leaks a 28-pattern working-state bucket; read-surface
`documentation architecture` now matches the generated doc. **Resilience:** `buildOverviewArchitecture` catches
ONLY `UNMAPPED_PACKAGE` and omits the optional field (consumer repos / fixtures without package matchers);
`docs:all` / `validate:all` still fail loud (D-14). MCP `architect_overview` reaches it for free.
Codex fix `1f80630`: working-state path filter anchored to repo-root `architect/` via `startsWith` (was
over-matching the bin-only `packages/architect/`). All §6 gates green; perf 3/3.

### WS-3 Session 16 — Chart finalization + cross-package sweep (D-19, D-20)

Prior commit = `1691fcb`. **(A) D-19 — forward-only detail diagrams** (`b24ed0c`): `normalizeDetailEdges()` in
`architecture-diagram.internal.ts` drops the derived reverse `enables`, collapses co-directional
`depends-on`/`uses` to one solid arrow per ordered pair, keeps `see-also` — generalizing D-15's context-map rule
to the per-group detail diagrams (grounded: `enables`/`usedBy` are purely derived, absent from the 27-directive
vocabulary + `ExtractedPattern` fields). `docs-live/ARCHITECTURE.md` 787→621 lines; projection group ~110→37
forward arrows; legend reduced to 2 classes. New `config-documentation.feature` Rule + same-group fixture; stale
D-15 invariant text fixed; shared `collectArchitectureEdges` untouched (feeds the already-forward-only context
map). **(B) D-20 — cross-package `@architect-uses` sweep** (`aad4f69`, bookkeeping `eaa954c`): 8 surface edges
(D-7 light model, not D-4 spam) — projection→core (5 `*ProjectionSupport`→`ExtractedPattern`/`PatternGraph`),
mcp→core (`MCPPipelineSession`→`BuildPipeline,PatternGraphApi`), mcp→projection
(`MCPToolRegistry`→`CompactTextRenderer,JsonRenderer`), cli→projection
(`PatternGraphCLI`→`CompactTextRenderer,JsonRenderer`). Package chart 2→6 arrows, mcp no longer isolated.
`cli→guard` deferred (bin wrappers own no pattern — anti-phantom D-9); utility long-tail not swept (anti-spam D-4).
All §6 gates green; `dangling --strict` exit 0.

### Rules for next session

1. **WS-3 remaining = the generated-doc projection roadmap (R1–R7) in [`DOCS-IA-FINDINGS.md`](DOCS-IA-FINDINGS.md) §6**:
   R1 quarter/phase-dependent generators (emit empty docs), R2 validation-rules markdown over-escaping, R3 retire
   `docs/ARCHITECTURE.md`, R4 config/MCP generators, R5 dynamic index registry, R6 requirements-specs filter, R7 bulk doc retirement.
2. **Architecture diagrams are forward-only (D-19) + production-only (D-18).** Any doc that emits diagrams keeps both invariants.
