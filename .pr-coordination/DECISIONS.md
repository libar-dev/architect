# Decisions — questions that need human judgment

> Tight entries only. Implementation details live in the session prompt that
> consumes the decision, not here.

## D-1 — WS-1 pilot scope

- **Question:** Which subsystem does the annotation re-enablement pilot target first?
- **Options:** projection/doc-gen pipeline / whole-graph edges-only sweep / core extraction layer.
- **Recommendation:** projection — 49 orphans (highest density), matches the doc-gen goal, cleanest before/after.
- **Consumed by:** sessions/01-projection-renderer-spine.md
- **Status:** resolved (maintainer, 2026-05-25) → projection.

## D-2 — Enrichment depth per pattern

- **Question:** Edges+classification first, or full enrichment (incl. shapes+invariants) per pattern?
- **Options:** edges+classification first then a shapes/rules pass / full enrichment one pattern at a time.
- **Recommendation:** edges+classification first — fastest path to a navigable graph.
- **Consumed by:** EXECUTION-PLAN §3, all WS-1 sessions.
- **Status:** resolved (maintainer, 2026-05-25) → edges + classification first.

## D-3 — Identity for un-patterned shipped abstractions

- **Question:** How to add `ExtractedPattern`, `BlockSchema`, un-patterned codecs to the graph?
- **Options:** code-originated `.ts` `@architect-pattern` / behavioral `.feature` + `@architect-implements` / defer.
- **Recommendation:** code-originated `.ts` identity — they're data contracts, matching how `DocExtractor`/`MarkdownRenderer` are already modeled. Candidates surfaced for approval before each addition.
- **Consumed by:** sessions/01 (BlockSchema), Cluster D (ExtractedPattern).
- **Status:** resolved (maintainer, 2026-05-25) → code-originated. Approve each candidate before creation.

## D-4 — Fragment union membership modeling

- **Question:** Should `ProjectionFragmentSchema` carry `@architect-uses` to all ~44 fragment kinds?
- **Options:** light (edge only into renderer spine; rely on bounded-context) / full (44 edges for complete union navigability).
- **Recommendation:** light — 44 edges is edge-spam; bounded-context already answers "what fragments exist in context X."
- **Consumed by:** sessions/01 (Cluster C).
- **Status:** open — proceeding with light model unless maintainer prefers full.

## D-5 — PR scope

- **Question:** Do annotations + skills + docs land in this PR or split out?
- **Options:** one PR / separate PRs.
- **Recommendation:** —
- **Consumed by:** EXECUTION-PLAN §2.
- **Status:** resolved (maintainer, 2026-05-25) → one PR ("re-enable core functionality"); WS-0/1/2/3 together.

## D-6 — Additive `@architect-uses` on `completed` patterns

- **Question:** Does adding an additive `@architect-uses` edge to a `completed` pattern's source require `@architect-unlock-reason` (FSM reopening)?
- **Options:** require unlock-reason on every completed pattern touched / treat additive enrichment as non-reopening (no unlock-reason).
- **Recommendation:** no unlock-reason — additive enrichment is not a status transition.
- **Evidence:** `pnpm architect:guard --staged` on Session 01's 11 edits (incl. 5 `completed` renderers) → `Status transitions: 0`, `Deliverable changes: 0`, **passed** (exit 0). Aligns with architect-base §8 (production JSDoc is additive, does not gate completion) + `architect-refactor-session` (`@architect-unlock-reason` is only for an actual `completed → active` status change).
- **Consumed by:** all WS-1 sessions (19 of the remaining orphans are `completed`).
- **Status:** resolved (process guard, 2026-05-25) → no unlock-reason for edge-only enrichment. The guard is the arbiter — run `architect:guard --staged` at commit. Add `@architect-unlock-reason` ONLY if a session genuinely flips a `completed` pattern's status or changes its deliverables/invariants.

## D-7 — How to de-orphan the fragment kinds (producer, not barrel)

- **Question:** What truthful edge connects the ~40 orphan fragment kinds (PatternDetail, etc.)?
- **Options:** (a) barrel → members — `<Context>FragmentContracts uses <fragments>`; (b) producer → fragment — each `<X>Projection uses <X>`.
- **Rejected (a):** the barrel (`fragments/<ctx>/index.ts`) is a **pure re-export surface** (`export { X } from './x.js'`, no logic). Declaring it "uses" what it re-exports **inverts the dependency** — a publishing surface depends on nothing; consumers depend on it. This was a false model (caught at review).
- **Chosen (b):** each projection function genuinely **constructs** its fragment — verified: `PatternDetailProjection` returns `ProjectionBundle<PatternDetail>` and builds `kind: 'PatternDetail'`. So `<X>Projection @architect-uses <X>` is a true producer→product edge and answers "what produces PatternDetail?". Additive — keep existing `uses …FragmentContracts/…ProjectionSupport` edges. Some functions produce >1 fragment (e.g. `DependencyEdgeProjection` → `DependencyEdgeSet` + `DependencyEdge`) — verify per function via the return type + `kind:` literals.
- **Carve-out — `Supporting` bundles have no producer:** per-context `*Supporting` fragments (e.g. `PatternRelationsSupporting`, `fragments/<ctx>/supporting.ts`) are **helper-schema bundles**, not produced by any projection function (verified: no `ProjectionBundle<…Supporting>`, no `kind:'…Supporting'`). Connect them via the schemas they **import** (verified: `PatternRelationsSupporting` imports `DeliverableSchema`/`DeliverableManifestSchema` → `@architect-uses Deliverable, DeliverableManifest`), not via a producer.
- **Standing rule:** put **only verified** mappings in a session prompt. Orphan set, producers, and imports are all confirmed against the API + code before they enter a prompt — no predicted rows.
- **Consumed by:** sessions/02-\*.
- **Status:** resolved (verified against code, 2026-05-25) → producer→fragment for produced fragments; import-edge for `Supporting` bundles.

## D-8 — `@architect-uses` MUST be a single comma-separated line (parser keeps only one)

- **Question:** When a pattern already has an `@architect-uses` line, do you add the new edge as a **second `@architect-uses` line** or **extend the existing line**?
- **Discovered (Session 02):** the parser retains **only ONE `@architect-uses` line per pattern** — additional lines are silently dropped. Verified two ways: (1) appending `@architect-uses PatternDetail` as a second line to `PatternDetailProjection` left its graph `uses` unchanged (`["PatternRelationsProjectionSupport","PatternRelationsFragmentContracts"]`, the first line only) and `PatternDetail` stayed orphaned; (2) `OperationalInsightsProjectionSupport` carries **9** `@architect-uses` lines in source but the graph shows `uses: ["ProjectionFragmentContracts"]` — one edge. Root: `ast-parser.ts` `readStringArrayMetadata(metadataResults,'uses')` reads a single metadata value; comma-splitting **within** one line works (proven by Session 01 renderers + `PatternRelationsSupporting`), multi-line accumulation does **not**.
- **Chosen:** **extend the existing `@architect-uses` line** — `@architect-uses Existing1, Existing2, NewFragment`. Never add a second `@architect-uses` line. (This corrects the "append a new `@architect-uses` line" wording in EXECUTION-PLAN §5 and sessions/02 — the coordinator should fix that wording for the remaining context sessions.)
- **Latent breakage (pre-existing, out of Session 02 scope — fix in the owning context/package session):** 5 patterns already lose edges to this bug — `OperationalInsightsProjectionSupport` (9 lines, operational-insights session), `DeliveryReportingProjectionSupport` (6 lines, delivery-reporting session), and in `architect-guard`: `DeriveProcessState`, `ProcessGuardDecider`, `LintPatternsCLI` (2 lines each, guard expansion). Each is fixed by collapsing its multiple `@architect-uses` lines into one comma-separated line, then re-verifying with `pattern <X>` that every intended target appears in `uses`.
- **Verification rule (load-bearing):** "the annotation is in the file" ≠ "the edge is in the graph." After authoring edges, **always read back via the Data API** (`pattern <X>` → `uses`/`usedBy`, or `arch orphans`) before running the gates. The file content alone does not prove registration.
- **Consumed by:** all remaining WS-1 sessions (every context after pattern-relations, plus guard).
- **Status:** resolved (verified against parser + API, 2026-05-25) → single comma-separated `@architect-uses` line; Data-API read-back is mandatory post-edit.

## D-9 — Session 08 deferrals: 3 core test-features have no clean production-pattern target

- **Question:** Three `architect-core/tests` orphans exercise production functions that carry **no `@architect-pattern`** and are not reachable from any pattern that does. What's the de-orphaning edge?
- **Discovered (Session 08, verified against step imports + source):**
  - `SourceMerging` → `mergeSourcesForGenerator` (`config/merge-sources.ts`) — file has no `@architect-pattern`; only re-exported by `src/index.ts` + `config/index.ts` barrels; **not** reachable from `ConfigLoader` (config-loader.ts does not import merge-sources). No owning pattern.
  - `TagRegistrySchemasValidation` → `createDefaultTagRegistry`/`mergeTagRegistries` (`validation-schemas/tag-registry.ts`) — file has no `@architect-pattern` (only `pattern-graph.ts`, `codec-utils.ts`, `extracted-pattern.ts` carry one in that dir). No owning pattern.
  - `TypeScriptTaxonomyImplementation` → `buildRegistry` (`taxonomy/registry-builder.ts`) — file has no `@architect-pattern` (sole hit is an example string in source). No owning pattern in `taxonomy/`.
- **Chosen:** **DEFER all three** — record as "no clean target". Authoring `@architect-implements` against a non-existent pattern trips `arch dangling --strict`; mapping to a transitively-reachable-but-unrelated pattern (e.g. `ConfigLoader` for merge-sources, which it never calls) would be a false edge that lies to every future query. Per PREAMBLE Rule 4/5 + brief discipline, a missing edge beats a plausible-but-false one.
- **Resolution path (next session input):** these need a **new code-originated `@architect-pattern`** on the owning production file (D-3 pattern — `merge-sources.ts`/`tag-registry.ts`/`registry-builder.ts` are data/config contracts), authored under maintainer approval, before the implements edge can land. Out of Session 08 edge-only scope.
- **Consumed by:** sessions/08; the future core-identity session that adds the 3 missing production identities.
- **Status:** resolved (verified against code + step imports, 2026-05-25) → defer; do not author phantom targets.

## D-10 — `completed` test spec without a pre-existing unlock-reason needs one to add `@architect-implements`

- **Question:** Adding `@architect-implements` to a `completed` test `.feature` tripped the process guard's `completed-protection` rule on exactly ONE file (`dual-source-merge.feature`, `DualSourceMergeIntegration`). The other 6 completed features I edited passed. How to resolve in-doctrine?
- **Discovered (Session 08):** guard `--staged` reported **Status transitions: 0, Deliverable changes: 0** (D-6 holds — no FSM transition), but raised `[completed-protection] ... Cannot modify completed spec ... without unlock reason`. Verified the discriminator: `dual-source-merge.feature` is the **only** completed feature I touched that lacks an `@architect-unlock-reason` tag — the other 6 already carry `@architect-unlock-reason:Retroactive-completion-during-rebrand`, which satisfies the guard's spec-file protection. The guard's `completed-protection` rule guards _spec-file modification_, distinct from D-6 (which covers additive JSDoc on production `.ts` — those don't trip this rule).
- **Chosen:** add `@architect-unlock-reason:De-orphan-implements-edge-WS1-session-08` to `dual-source-merge.feature` only. This is the guard's own documented `Fix:` and the architect-base §11 sanctioned mechanism for legitimately modifying a completed spec — NOT a No-BC violation (no `@deprecated`/eslint-disable/compat alias; not softening a removal). The status stays `completed`; only the implements edge + the required unlock-reason are added.
- **Consumed by:** sessions/08. Rule for future sessions: when adding `@architect-implements` to a **completed test feature**, check for a pre-existing `@architect-unlock-reason`; if absent, the guard's `completed-protection` requires one (≥10 meaningful chars) — add the campaign reason. This is orthogonal to D-6's FSM/transition concern.
- **Status:** resolved (process guard is the arbiter, 2026-05-25) → add unlock-reason on the one unprotected completed spec.

## D-11 — How to connect a module-grouping barrel (`ValidationModule`) — mirror the `GitModule` precedent, not D-7

- **Question:** `ValidationModule` (`validation/index.ts`) is a pure re-export barrel and an orphan. D-7 rejected "barrel `@architect-uses` its members" (it inverts the dependency). But the in-package sibling `GitModule` (`git/index.ts`) **already** declares `@architect-uses GitBranchDiff, GitHelpers`. Which precedent applies?
- **Discriminator:** D-7's rejection was scoped to **projection _fragment_ barrels** (`fragments/<ctx>/index.ts`), where a strictly better truthful edge exists — the **producer function** that _constructs_ each fragment (`<X>Projection uses <X>`). Guard's `ValidationModule`/`GitModule` re-export **sub-modules that are themselves patterns** (`DoDValidator`, `AntiPatternDetector`, …) and have **no producer function** — there is no alternative truthful edge. A re-export _is_ a static module-level import, so `barrel uses re-exported-submodule` is a real module-graph edge, not an inversion.
- **Chosen:** model `ValidationModule` like `GitModule` — `@architect-uses DoDValidator, AntiPatternDetector, DoDValidationTypes` (the three submodules it re-exports, verified against `validation/index.ts`). De-orphans via outgoing edges, consistent with the established in-package convention. Edge-only enrichment on a `completed` `.ts` → no `@architect-unlock-reason` (D-6); guard `--staged` is the arbiter.
- **Standing rule:** **fragment barrels with a producer** → producer→fragment edge (D-7); **plain module-grouping barrels with no producer** → barrel→submodule edge (this decision, GitModule precedent). Pick by whether a producer function exists.
- **Consumed by:** sessions/09 (guard).
- **Status:** resolved (maintainer, 2026-05-25) → mirror GitModule; barrel→submodule for producerless grouping barrels.

## D-12 — A `runCommand`-driven CLI integration test `@architect-implements` the CLI pattern it invokes

- **Question:** Session 08's rule was "map test→production by STEP IMPORTS." CLI integration tests drive the CLI as a subprocess via a `runCommand()` helper — they import **no** production module, so there's no import to follow. Do they get an `@architect-implements` edge, or defer like the no-target features?
- **Discovered (Session 10):** `lint-process.feature` and `lint-patterns.feature` have step files that call `runCommand(commandString)` where the scenarios run `"lint-process --help"`, `"lint-process --staged"`, `"lint-patterns -i …"`, etc. (the `lint-process --version` scenario even asserts stdout contains `architect-guard`). The invoked command name maps **1:1** to a named production CLI pattern: `lint-process` → `LintProcessCLI` (`cli/lint-process.ts`), `lint-patterns` → `LintPatternsCLI` (`cli/lint-patterns.ts`). Both production patterns confirmed via `search`.
- **Chosen:** a `runCommand`-driven CLI integration test `@architect-implements` the production CLI pattern for the command it invokes, **when the command maps 1:1 to a named pattern**. The `runCommand('<cmd>')` argument (verified against the feature's `When running "…"` steps) is a concrete, checkable fact — as authoritative as a TS `import`. The de-orphaning principle is not "follow imports" but "author only edges you can verify against something concrete in the file." This is NOT a phantom edge.
- **Boundary:** defer when the command does **not** map 1:1 to a single named pattern — e.g. `generate-docs.feature` invokes a doc-gen command with **no** production `GenerateDocs*` pattern (search → only the test feature itself); `public-contract`/`cli-mcp-documentation-parity` are multi-surface boundary/freeze tests. No 1:1 target → defer (don't invent one).
- **Consumed by:** sessions/10 (+ any future CLI/MCP test-feature session).
- **Status:** resolved (maintainer, 2026-05-25) → accept; runCommand command string is the verified fact, 1:1 mapping only.

## D-13 — Four new code-originated identities for shipped-but-un-patterned utilities (supersedes the D-9 deferrals)

- **Question:** The D-9 deferrals + two test features (`load-preamble`, `taxonomy-tags`) exercise shipped production utilities that carry **no** `@architect-pattern`, so their executable tests can't realize anything and stay orphaned. Create code-originated identities (D-3 pattern)?
- **Approved (maintainer, 2026-05-25):** create four identities. Each de-orphans its executable test feature(s) via the test's `@architect-implements` edge. **Verified-load-bearing fact:** `findOrphanPatterns` (graph-inventory.ts:149-158) counts `implementedBy` as a relationship, so a new identity is non-orphan the moment a test feature implements it — **no `@architect-uses` edge required** (avoids the real circular import between `registry-builder.ts` and `tag-registry.ts`).
- **The four (role/bounded-context verified against siblings + the live bounded-context inventory; all reuse EXISTING contexts — no new-context noise):**
  - `RegistryBuilder` — `taxonomy/registry-builder.ts` (`buildRegistry`) — `role:utility`, `bc:configuration` (no sibling in `taxonomy/`; nearest neighbors are `config/role-constants` + `config/defaults` which it imports; `taxonomy` is not an existing context, so reuse `configuration` rather than spawn a one-pattern context). Realized by **two** tests: `StubTaxonomyTagTests` + `TypeScriptTaxonomyImplementation` (the latter a D-9 deferral).
  - `SourceMerge` — `config/merge-sources.ts` (`mergeSourcesForGenerator`) — `role:utility`, `bc:configuration` (mirrors `ConfigLoader`, same dir). Realized by `SourceMerging` (D-9).
  - `TagRegistrySchemas` — `validation-schemas/tag-registry.ts` (`createDefaultTagRegistry`/`mergeTagRegistries` + the Zod schemas) — `role:contract`, `bc:validation-schemas` (mirrors `ExtractedPattern`, same dir). Realized by `TagRegistrySchemasValidation`.
  - `MarkdownBlockParser` — `utils/markdown-parser.ts` (`parseMarkdownToBlocks`) — `role:codec`, `bc:rendering` (a text→blocks parse = codec, consistent with `CodecUtils`=role:codec and `BlockSchema`=bc:rendering; its product defines its domain). Realized by `LoadPreambleParser`.
- **D-10:** the two `completed` test features already carry an `@architect-unlock-reason` (`TypeScriptTaxonomyImplementation`=`Value-transfer-from-spec`, `SourceMerging`=`Retroactive-completion-during-rebrand`) — no new reason needed; the other three features are `active`.
- **Identity + implements edges land in the SAME commit** (else `dangling --strict` trips on the not-yet-existing target).
- **Consumed by:** sessions/11. Closes D-9 (its three deferrals are now realized).
- **Status:** resolved (maintainer, 2026-05-25) → create the four; minimal de-orphaning via `implementedBy`.

## D-14 — WS-3: restructure the `architecture` document into a multi-view diagram set (one mega-`graph TD` → context-map + per-group diagrams)

- **Question:** `docs-live/ARCHITECTURE.md` projects a single Mermaid `graph TD` of all architecturally-interesting patterns. At 276 patterns it reached **237 nodes + 217 edges + 23 subgraphs (~60 KB)** — past Mermaid's default 50 000-char `maxTextSize`, so it no longer renders ("Maximum text size in diagram exceeded") and is an unreadable hairball regardless. How do we fix this at the generator (it's a projection — `docs-live/` is generated, never hand-edited)?
- **Approved (maintainer, 2026-05-25):** restructure the `architecture` document into **multiple small, purpose-labeled diagrams**, matching the repo's existing house style for generated diagram docs (`architect/design-reviews/*.md` emit separate sequence + component diagrams, never one mega-graph). New shape:
  - **Context Map** (`graph LR`) — bounded-contexts as nodes; cross-context relationships collapsed to one edge per ordered (A,B) pair. The architectural "big picture."
  - **One detail diagram per group** (`graph TD`) with intra-group edges only (cross-group structure lives in the Context Map).
  - **Grouping rule (graceful degradation):** primary axis = `@architect-bounded-context`; patterns lacking one fall back to `@architect-role`, then to **source area (workspace package, via `ProjectionContext.packageResolver`)**. So the ~83 un-contextualized patterns (ADRs, CLI/MCP tests) break into role buckets (`contract`, `projection`) plus source-area buckets (`Unclassified · Architect Core`, `… Host (Dev)`, etc.) instead of one hairball. `product-area` / `adr-layer` remain available via the existing `layered`/`product-area` scopes — NOT wired now (avoid bloat per the detail-doctrine).
  - **No silent fallback on package-resolution failure (corrected after Codex stop-time review).** `resolvePackageLabel` **propagates** the resolver's `UNMAPPED_PACKAGE` error — it does not catch-and-downgrade to an "Uncategorized" bucket. `PackageResolver` is a deliberate hard-error-on-miss contract ("actionable feedback over silent fallback", `package-resolver.ts:16-21`); a source file outside the configured `packages` matchers is a real config gap that must fail the projection loud, not hide in a catch-all. Verified: with the dogfood config every pattern file maps, so removing the catch left the generated doc byte-identical (no group reached the would-be catch-all — it was dead code).
- **Contract change (No-BC):** `ArchitectureDiagramSchema.diagram: MermaidBlock` → `sections: Array<{ title, description?, diagram: MermaidBlock, patterns: string[] }>`; top-level `scope` / `scopeValue` / `patterns` (union) are **kept** (the config-documentation tests assert on `root.scope/scopeValue/patterns`, not `.diagram`, so they need no change). No alias, no parallel field — the old single-`diagram` shape is removed outright.
- **Size invariant (the load-bearing one):** the architecture document MUST NOT emit any single Mermaid block containing all patterns. Enforced two ways — a projection scenario (≥2 sections; every pattern in exactly one detail section; a context-map section present) + a dogfood regression asserting every ```mermaid block in the generated `docs-live/ARCHITECTURE.md` is < 50 000 chars.
- **Method:** refactoring carve-out (`architect-refactor-session`) — `ArchitectureDiagram` ships (`@architect-status active`, `role:contract`); evolve it + its executable coverage in place, no new design spec. Edge/contract evolution on an `active` pattern → no `@architect-unlock-reason` expected; `architect:guard --staged` is the arbiter.
- **Incidental finding (flag, do not fix here):** AGENTS.md / CLAUDE.md say "docs-live/ is generated and gitignored." It is in fact **git-tracked** (`git ls-files docs-live` returns it; `git check-ignore` is silent), which is why `pnpm docs:all && git diff --exit-code docs-live` is a live determinism gate. The wording is stale; correcting it is a separate WS-3/docs task.
- **Consumed by:** this session (WS-3 ARCHITECTURE.md restructure).
- **Status:** resolved (maintainer, 2026-05-25) → restructure into context-map + per-group sections; bounded-context→role grouping; No-BC `sections[]` contract; size invariant test-enforced.
