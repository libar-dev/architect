# Session reports and learnings

> Append-only log. One entry per session. Keep entries tight (< 20 lines).

## Session 00 — Campaign bootstrap (planning, no code)

Diagnosed the graph: 270 patterns, 107 orphans (40%) — projection 49, specs 32,
core 24, guard 2; role 64%, bounded-context 58%, `@architect-shape` ~absent.
Root cause: ~30 refactoring PRs kept pattern identity but stripped edges/shapes/
invariants. Confirmed scope with maintainer (D-1..D-5). Authored this package.
No production code touched.

**Rules for upcoming sessions**

1. Edges first; classification is mostly present in projection — don't re-tag what exists.
2. Author edge-target identity (Cluster B/D) before edges that reference it, or same commit — `arch dangling` is strict.
3. Add `Rule:` invariants only where architecturally significant; no ceremonial rules.
4. `.scratch/` is invisible to fresh sessions — keep everything needed inside `.pr-coordination/`.

## Session 01 — Projection renderer spine + block primitives (uncommitted in tree)

Cluster A (5 renderer/dispatch files) + Cluster B (`BlockSchema` new identity +
5 fragment consumers). Projection orphans **49 → 40**, total **107 → 98**.
All gates green (build, format:check, lint, typecheck, typecheck:dogfood, test,
test:dogfood 1057, validate:all, arch dangling 0, perf, audit:subtractive).
`docs:all` regenerated PATTERNS/ARCHITECTURE/CHANGELOG + manifest — commit with the code.

**Additional scope discovered:** the planned prompt asserted a uniform
"all 4 renderers → FragmentRendererDispatch" edge. **`JsonRenderer` does not use
dispatch** (generic serialization) — adding it would have been a false edge.
Also `MarkdownRenderer` + `UiRenderer` (not just markdown) import `Block` → both
get `BlockSchema`. **Resolution:** inline — verified every edge against imports;
corrected `sessions/01` + EXECUTION-PLAN §5 to the per-file verified set.

### Rules for upcoming sessions

1. **Verify every `@architect-uses` edge against the file's actual imports.** Never
   assume sibling files (renderers, fragments) have identical dependencies. A
   plausible-but-false edge is worse than a missing one — it lies to the graph.
2. `@architect-uses` is **space-separated, no colon** (`@architect-uses A, B`).
   `@architect-role:` / `@architect-bounded-context:` use a colon. Do not mix.
3. Adding a new code-originated identity (e.g. `BlockSchema`) or new edges changes
   `docs-live/` — regenerate via `pnpm docs:all` and commit it in the same change.

## Session 02 — Connect pattern-relations fragments to producers (uncommitted in tree)

D-7 two-part model applied to all 10 pattern-relations orphans: 8 producers got a
producer→fragment edge (9 fragments; `DependencyEdgeProjection` produces both
`DependencyEdge` + `DependencyEdgeSet`), and `PatternRelationsSupporting` got an
import edge (`Deliverable, DeliverableManifest`). Projection pattern-relations
orphans **10 → 0**; total **98 → 86** (the Supporting edge also de-orphaned
`Deliverable` + `DeliverableManifest`). All 13 gates green; guard `--staged`:
13 modified, **0 status transitions** (confirms D-6 on 8 `completed` patterns),
passed. `arch dangling --strict` count 0, no drift. `docs:all` updated
ARCHITECTURE/PATTERNS/CHANGELOG/manifest — staged with the code.

**Additional scope discovered (inline-fixed + recorded as D-8):** the planned
method ("append a **new** `@architect-uses` line") is **wrong** — the parser keeps
only ONE `@architect-uses` line per pattern; a second line is silently dropped.
First attempt left all 9 fragments orphaned (caught by Data-API read-back before
gates). Fixed inline by **extending the existing comma-separated line**. Same bug
already breaks 5 pre-existing patterns (see D-8) — deferred to their owning
sessions.

### Rules for upcoming sessions

1. **One `@architect-uses` line per pattern, comma-separated.** Extend the existing
   line; never add a second `@architect-uses` line (it's dropped). See **D-8**.
2. **Read back via the Data API after authoring edges** (`pattern <X>` →
   `uses`/`usedBy`, or `arch orphans`) **before** running gates. "Annotation in the
   file" ≠ "edge in the graph." This caught the multi-line bug cheaply.
3. Next context = **governance** (`BusinessRule`, `BusinessRuleSet`,
   `BusinessRuleReference`, `DecisionCatalog`, + its `*Supporting` bundle). Re-verify
   producers/imports fresh — do not assume symmetry with pattern-relations.
4. Coordinator: fix the "append a new line" wording in EXECUTION-PLAN §5 +
   remaining `sessions/NN-*.md` to "extend the existing line" (D-8).

## Session 03 — Connect governance fragments to producers (uncommitted in tree)

D-7 model applied to all 7 governance projection orphans. 4 producers got
producer→fragment edges (`BusinessRulesProjection`→`BusinessRule,BusinessRuleSet`;
`DecisionCatalogProjection`→`DecisionCatalog,DecisionRecord`;
`TaxonomyDigestProjection`→`TaxonomyDigest`; `ValidationRuleDigestProjection`→
`ValidationRuleDigest`). `GovernanceSupporting` (imports only zod) de-orphaned by
**incoming** edges from the 2 producers that import its schemas — the inverse of
Session 02's outgoing-import Supporting model. All edges extended the existing single
`@architect-uses` line (D-8) and **registered first-try** (Data-API read-back: orphans
86→79, `BusinessRule.usedBy=[BusinessRulesProjection]`). All 13 gates green
(1057 dogfood tests, perf 3/3, validate:all, audit:subtractive, arch dangling 0).
`docs:all` → ARCHITECTURE.md +27 (the new edges + derived `enables`).

**Additional scope discovered (inline-fixed):**

1. **Cross-context producer.** `BusinessRuleReference` is a governance fragment but is
   built at `operational-insights/index.ts:615` inside `OperationalInsightsProjectionSupport`.
   Edge landed here (governance session) — a session is scoped by orphans resolved, not
   files touched. Extended that pattern's single `@architect-uses` line.
2. **D-8 "9 lines" note is stale.** `OperationalInsightsProjectionSupport` carries ONE
   `@architect-uses` line at current HEAD, not 9. The latent multi-line bug D-8 warned
   about is **not present** — verified by grep + the edge registering first-try. Session 04
   should still re-confirm via `pattern <X>` but is likely unaffected.

### Rules for upcoming sessions

1. `Supporting` bundles connect in **whichever import direction is real** — outgoing
   (it imports schemas, Session 02) or incoming (it's a pure source bundle imported by
   producers, Session 03 `GovernanceSupporting`). Check the actual imports; don't assume.
2. A fragment's producer may live in a **different bounded-context** — verify via
   `grep "kind: '<Fragment>'"` across all `projections/`, not just the fragment's own context.
3. Next context = **operational-insights** (`AnnotationCoverage`, `OverviewDigest`,
   `RequirementDigest` ×3 producers, `RoleProfile`/`RoleProfileCollection`,
   `SourceInventoryDigest`/`Entry`, `TagUsageMatrix`/`Entry`). Re-verify the D-8 state of
   `OperationalInsightsProjectionSupport` before editing.

## Session 04 — Connect operational-insights fragments to producers (uncommitted in tree)

Committed prior session = `0ec6441`. De-orphaned all 9 operational-insights orphans.
**New topology** vs governance: all producers in one `index.ts`, each its own
`@architect-pattern`; `kind:` literals built in `build*` helpers (under
`OperationalInsightsProjectionSupport`) while public `project*` wrappers return
`ProjectionBundle<X>`. Used the **wrapper** as producer (8 edges:
`AnnotationCoverageProjection`→`AnnotationCoverage`, `OverviewProjection`→`OverviewDigest`,
3× Requirement\*→`RequirementDigest`, `RoleProfileProjection`→`RoleProfile,RoleProfileCollection`,
`SourceInventoryProjection`→`SourceInventoryDigest`, `TagUsageProjection`→`TagUsageMatrix`).
All edges registered first-try (orphans 79→70). 13 gates green.

**Additional scope discovered (inline-fixed):**

1. **Embedded sub-fragments need composition edges, not producer edges.** `TagUsageEntry`
   - `SourceInventoryEntry` have no `ProjectionBundle` wrapper — built in helpers, embedded
     in a parent. Connected via verified schema composition on the parent fragment
     (`TagUsageMatrix`→`TagUsageEntry`, `SourceInventoryDigest`→`SourceInventoryEntry`; both
     parents do `z.array(<Entry>Schema)`). First `@architect-uses` line on those fragments.
2. **D-8 "9 lines" confirmed stale.** `OperationalInsightsProjectionSupport` has ONE
   `@architect-uses` line at HEAD, not 9 — no collapse needed (delivery-reporting's
   `DeliveryReportingProjectionSupport` likely the same; still re-verify in Session 05).

### Rules for upcoming sessions

1. **Three edge shapes now proven:** producer→fragment (wrapper returns `ProjectionBundle<X>`),
   Supporting import-edge (Session 02) / incoming-edge (Session 03), and **fragment→sub-fragment
   composition** (parent schema `z.array(childSchema)`). Pick by what the code actually does.
2. When `kind:` literals sit in helper functions, the producer edge still follows the **public
   `<X>Projection` wrapper's `ProjectionBundle<X>` return type**, not the helper.
3. Next context = **delivery-reporting** (`PhaseProgress`, `StatusDistribution`,
   `RoadmapTimeline`, `ReleaseNotesDigest`, `TraceabilityMatrix`, + `DeliveryReportingSupporting`
   which imports `PatternSummarySchema`/`EmbeddedDeliverableSchema` — outgoing import-edge).

## Session 05 — Connect delivery-reporting fragments to producers (uncommitted in tree)

Committed prior session = `96194aa`. De-orphaned all 6 delivery-reporting orphans. Same
split topology as op-insights: 5 producer wrappers got producer→fragment edges
(`PhaseProgressProjection`→`PhaseProgress`, `StatusDistributionProjection`→
`StatusDistribution`, `RoadmapTimelineProjection`→`RoadmapTimeline`, `ReleaseNotesProjection`→
`ReleaseNotesDigest`, `TraceabilityMatrixProjection`→`TraceabilityMatrix`).
`DeliveryReportingSupporting` got an **outgoing** import edge. All registered first-try
(orphans 70→64). 13 gates green.

**Additional scope discovered (inline-fixed):**

1. **Recon's `EmbeddedDeliverable` target was a phantom.** `DeliveryReportingSupporting`
   imports `EmbeddedDeliverableSchema`, but `EmbeddedDeliverable` is NOT a graph pattern
   (`search` → empty); it's `DeliverableSchema.omit({kind:true})`. Authored
   `@architect-uses PatternSummary, Deliverable` (the real source pattern) — authoring the
   phantom would have tripped `arch dangling --strict`. Import edges follow the symbol's
   pattern, falling back to the source when the symbol is a derived alias.
2. **D-8 "6 lines" confirmed stale.** `DeliveryReportingProjectionSupport` has ONE
   `@architect-uses` line at HEAD. The D-8 latent multi-line breakage is NOT present in any
   projection ProjectionSupport pattern — likely already fixed in the refactors that
   followed D-8's authoring.

### Rules for upcoming sessions

1. **Resolve every import-edge target against the graph** (`search <Name>`) before
   authoring — a derived alias (`Schema.omit`/`.pick`) is not its own pattern; edge to the
   source pattern it derives from.
2. Final context = **execution-context** (`FileReadingList`, `HandoffRecord`,
   `ScopeReadinessReport`, `SessionContextBundle`, + `ExecutionContextSupporting`). Note
   `ScopeReadinessCheck` may be embedded (no standalone producer) and `Deliverable`/
   `DeliverableManifest` are already connected (Session 02) — verify via `arch orphans`.

## Session 06 — Connect execution-context fragments to producers (PILOT FINALE, uncommitted in tree)

Committed prior session = `2641a6b`. De-orphaned all 6 execution-context orphans →
**projection orphans now 0** (baseline 49; Phase-1 target was <5). Total 64→58. 5 producer
edges (`FileReadingListProjection`→`FileReadingList`, `HandoffProjection`→`HandoffRecord`,
`ScopeReadinessProjection`→`ScopeReadinessReport,ScopeReadinessCheck`,
`SessionContextProjection`→`SessionContextBundle`, `DeliverableProjection`→
`Deliverable,DeliverableManifest`) + 4 incoming composition edges into
`ExecutionContextSupporting`. All registered first-try. 13 gates green.

**Scope notes (resolved inline):**

1. **`ScopeReadinessCheck` is produced, not embedded.** `ScopeReadinessProjection` builds
   its own `kind:'ScopeReadinessCheck'` (scope-readiness.internal.ts:302) — the plan's
   "may be embedded" caveat was wrong; it's a true produced fragment.
2. **`ExecutionContextSupporting` = third Supporting topology.** Outgoing imports are
   cross-package (`@libar-dev/architect-core`, not graph patterns), so it de-orphans only via
   incoming composition edges from the 4 fragments embedding its schemas. Across all 5
   contexts the `*Supporting` bundle needed 3 distinct strategies (outgoing-import S02,
   incoming-from-producers S03, incoming-from-fragments S06) — never assume symmetry.

### WS-1 Phase 1 (projection pilot) — COMPLETE

Projection orphans **49 → 0** across Sessions 01–06 (renderer spine + BlockSchema →
pattern-relations → governance → operational-insights → delivery-reporting →
execution-context). Total orphans **107 → 58**. Next phase: WS-1 expansion
(core → guard → cli → mcp) or WS-2 (skills) / WS-3 (docs), now unblocked.

**Three proven edge shapes** for the expansion sessions: producer→fragment
(`ProjectionBundle<X>` return), fragment→sub-fragment composition (`z.array(childSchema)`),
and Supporting-bundle (direction follows real imports — outgoing OR incoming).

## Session 07 — Connect architect-core production spine (WS-1 expansion, core pt.1)

Committed = `c347045` (prior `d1dcd45`). De-orphaned all **10 architect-core/src**
orphans (extractor + read-api spine). Total orphans **58 → 48**, zero
`packages/architect-core/src` rows remain. A1: created `ExtractedPattern`
(`role:contract`, `bounded-context:validation-schemas`, `status:active`) — the
~60-field record contract the PatternGraph read model is built from (ADR-006). A2:
7 verified `@architect-uses` edges (PatternGraph→ExtractedPattern; PatternHelpers,
PatternGraphApi, GraphInventory, PatternClassification, ArchitectureInspection,
DualSourceExtractor → ExtractedPattern/PatternGraph/PatternHelpers per their real
imports). A3: orchestration→stage edges de-orphan the 4 feeders — DocExtractor→
ShapeExtractor, GherkinExtractor→GherkinAstParser,LayerInference, BuildPipeline→
AstParser. All edges registered first-try (Data-API read-back: ExtractedPattern
`usedBy` = 7 consumers). All §6 gates green except repo-wide `format:check` (see below).
Guard `--staged`: 14 modified, **0 status transitions** (D-6 holds on `completed`
BuildPipeline). docs:all → ARCHITECTURE/CHANGELOG/PATTERNS regenerated, staged with code.

**Scope corrections (inline-fixed):**

1. **PatternGraphApi edge table was wrong.** Session-07 table claimed it does NOT
   import `pattern-graph.js` → proposed `ExtractedPattern, PatternHelpers`. It DOES
   import the `PatternGraph` type (`validation-schemas/pattern-graph.js` L13-17).
   Authored the truthful set `ExtractedPattern, PatternHelpers, PatternGraph`.
2. **AstParser's true importer is BuildPipeline, not the session's candidates.** Both
   prompt candidates (GherkinScanner, gherkin-extractor) import `gherkin-ast-parser.js`,
   NOT `ast-parser.js`. The only real consumer of `parseFileDirectives` (AstParser) is
   the `scanner/index.ts` barrel's `scanPatterns()`, which BuildPipeline imports (L35).
   Extended BuildPipeline's existing `@architect-uses` line with `AstParser` (D-8) —
   ADR-006-correct (pipeline orchestration may import scanner stages).
3. **Util/local symbols correctly NOT edged:** `PatternParseFailure`, `RelationshipEntry`,
   `ArchIndex`, `NeighborEntry`, relationship-resolver, `fuzzy-match` — all `search`→empty,
   so no edges (authoring them would be false edges / dangling).

### Rules for next session (08 — core test-feature @architect-implements edges)

1. **`format:check` is dirty repo-wide from coordinator WS-2 state** (`AGENTS.md` +
   untracked `sessions/07,08-*.md`) — NOT from session edits. Stage explicit files only;
   my 11 .ts files all pass prettier individually. Coordinator owns those 3 files.
2. `@architect-implements` is authored on the **test `.feature`** (a relation, not identity)
   — different mechanism from `@architect-uses`. Re-confirm each implements target exists
   as a production pattern before authoring; verify via Data-API read-back (`implementedBy`).

## Session 08 — Connect architect-core test features via @architect-implements (committed 8b22f86)

Prior session commit = `c347045`. De-orphaned **11 of 14** core/tests executable-test
orphans by adding feature-level `@architect-implements` (verified each target via step
imports + source `@architect-pattern`, then Data-API read-back). Total orphans **48 → 37**.
Mapping: ShapeExtraction→ShapeExtractor, DualSourceMergeIntegration→DualSourceExtractor,
PatternGraphApiReverseLookup→PatternGraphApi, ConfigResolution/ConfigurationAPI/
ProjectConfigLoader→**ConfigLoader** (3 tests, one many-to-one target — ConfigLoader's
"load + resolve defaults" surface covers loadProjectConfig + resolveProjectConfig +
createArchitect registry/roles; ConfigLoader.implementedBy now =4), CodecUtilsValidation→
CodecUtils, CrossPackageEdgeClassification→PatternClassification, DocStringMediaType→
GherkinAstParser, FileDiscovery→PatternScanner, PatternReferenceValidation→
**ExtractionDiagnostics,PatternClassification** (CSV — Rule 1 invalid-pattern-name
diagnostic + Rule 2 internal/external/dangling classification). All 12 gates green
(test:dogfood 1057, perf 3/3, dangling --strict 0, audit:subtractive 0).

**Deferred 3 (no clean target — D-9):** SourceMerging (`mergeSourcesForGenerator`,
merge-sources.ts un-patterned, not reachable from ConfigLoader — barrel-only re-export),
TagRegistrySchemasValidation (`createDefaultTagRegistry`/`mergeTagRegistries`,
tag-registry.ts un-patterned), TypeScriptTaxonomyImplementation (`buildRegistry`,
registry-builder.ts un-patterned). Each needs a new code-originated `@architect-pattern`
(D-3 style) on the owning file before an implements edge can land.

### Rules for next session

1. **Map test→production by STEP IMPORTS, not feature title.** Read
   `tests/steps/<area>/<name>.steps.ts` `from '../../../src/...'` to find the exact
   production module, then check that file's `@architect-pattern`. If the file has none and
   isn't reachable from a pattern that does, DEFER (don't edge to a transitively-reachable
   unrelated pattern — that's a false edge).
2. **D-10: a `completed` test feature lacking `@architect-unlock-reason` trips guard
   `completed-protection`** when you add a tag. Status transitions stayed 0 (D-6 holds), but
   spec-file modification needs an unlock-reason (≥10 meaningful chars). Only
   dual-source-merge.feature needed it here; the other 6 completed features already carried
   one. Check before staging.
3. `format:check` is now green repo-wide (the WS-2 dirtiness Session 07 flagged is resolved).
4. Next core orphans = the guard/cli/mcp packages + the 3 D-9 deferrals (need new
   production identities first).

## Session 09 — Connect architect-guard production spine + D-8 hygiene (committed 4f775fc)

Prior session commit = `e5de206`. De-orphaned both `architect-guard/src` orphans →
**zero guard-src orphans remain**. Total orphans **37 → 35**. `GitNameStatusParser`
connected via incoming edges from `GitBranchDiff` (direct importer of `parseGitNameStatus`,
branch-diff.ts:30) + `DetectChanges` (imports via `git/index` barrel; extended its existing
line per D-8). `ValidationModule` (pure re-export barrel, `completed`) connected via
`@architect-uses DoDValidator, AntiPatternDetector, DoDValidationTypes` — **D-11**: mirrors
the in-package `GitModule` precedent (barrel→submodule for a producerless grouping barrel,
distinct from D-7's fragment-barrel-with-producer rule). All edges registered first-try
(read-back: `GitNameStatusParser.usedBy=[DetectChanges,GitBranchDiff]`,
`ValidationModule.uses`=3 submodules). All 12 §6 gates green (test:dogfood 1057, perf 3/3,
dangling --strict 0, audit:subtractive 0). guard `--staged`: 6 modified, **0 status
transitions** (D-6 holds on `completed` ValidationModule `.ts` — no unlock-reason).
docs:all → ARCHITECTURE.md regenerated, committed with code.

**D-8 colon-duplicate hygiene CLEARED (the debt was real, not stale):** `derive-state.ts`

- `decider.ts` each carried a redundant malformed `@architect-uses:` colon-form line (line 10)
  duplicating the correct space-form (line 9). Same targets, so no edges were lost — but
  illegal colon-on-uses + violates one-line rule. Deleted both line-10 duplicates; graph
  `uses` unchanged (verified via read-back). `LintPatternsCLI` had only ONE line (D-8's
  "2 lines" note for it was stale — like the projection ProjectionSupport notes in S03-05).

### Rules for next session (10 — connectable test-feature implements edges)

1. **D-12 (new):** a `runCommand`-driven CLI integration test `@architect-implements` the
   production CLI pattern for the command it invokes, when the command maps 1:1 to a named
   pattern (verify the command string first). E.g. `lint-process.feature → LintProcessCLI`,
   `lint-patterns.feature → LintPatternsCLI`. Both production patterns confirmed to exist.
2. Only `CompactTextRendererTests → CompactTextRenderer` has a TS-import target (verified).
   `generate-docs`, `public-contract`, `cli-mcp-documentation-parity`, `list-parent-*` have
   NO clean target — defer (record, don't author phantom edges).
3. **D-10 check** on the `completed` features `lint-process`/`lint-patterns`: add
   `@architect-unlock-reason` if absent before staging (guard `completed-protection`).
4. Coordination model: agent does the scoped edits + Data-API read-back; main thread runs
   the §6 gates + commit + bookkeeping. format:check flags `.pr-coordination/*` md/json —
   run `prettier --write` on the session's coordination files before the gate.

## Session 10 — Connect remaining test features via @architect-implements (committed 38a3e72)

Prior session commit = `3df826a`. De-orphaned the 3 connectable test-feature orphans.
Total orphans **35 → 32**. `CompactTextRendererTests → CompactTextRenderer` (verified TS
import of `renderCompactText`). `LintProcessCliBehavior → LintProcessCLI` and
`LintPatternsCliBehavior → LintPatternsCLI` per **D-12** — the `runCommand` command strings
(`"lint-process …"`, `"lint-patterns …"`; the version scenario even asserts stdout contains
`architect-guard`) map 1:1 to the production CLI patterns. All 3 `implementedBy` edges
registered first-try. All 12 §6 gates green (pkg test 1769, test:dogfood 1057, perf 3/3,
dangling --strict 0, audit:subtractive exit 0). guard `--staged`: 3 modified, **0 status
transitions** — both `completed` `lint-*` features already carried
`@architect-unlock-reason:Retroactive-completion-during-rebrand` (D-10 satisfied; no second
reason added). `docs:all` → **no docs-live change** (implements/reverse edges don't alter
the current projection output).

**Deferred (genuine no-target, recorded per D-12 boundary):** `ArchitectPublicContract`
(public-contract — API-freeze, broad surface), `DocumentationCommandParityBoundaryTests`
(cli-mcp parity — multi-surface boundary), `GenerateDocsCli` (generate-docs — no production
`GenerateDocs*` pattern), `EmptyEpic`/`ParentEpic` (list-parent-\* — `list --parent`
fixtures, no step implementation). These stay orphans by design.

### Rules for next session (11 — new code-originated identities, D-13)

1. **D-13 approved 4 new identities.** For each: add file-level `@architect-pattern` JSDoc to
   the production file, THEN the `@architect-implements` edge(s) on the test feature(s) — in
   the **same commit** (else `dangling --strict` trips on the not-yet-existing target).
   Confirm `role` + `bounded-context` against sibling patterns in the same dir (Session 07
   method for `ExtractedPattern`), don't hard-code.
2. `RegistryBuilder` (`taxonomy/registry-builder.ts`) de-orphans BOTH `StubTaxonomyTagTests`
   AND the D-9 deferral `TypeScriptTaxonomyImplementation` — one identity, two features.
   `SourceMerge` (`config/merge-sources.ts`) → `SourceMerging` (D-9). `TagRegistrySchemas`
   (`validation-schemas/tag-registry.ts`, mirror `ExtractedPattern` role:contract) →
   `TagRegistrySchemasValidation`. `MarkdownBlockParser` (`parseMarkdownToBlocks`, locate the
   file) → `LoadPreambleParser`.
3. **D-10 check** on the `completed` features `TypeScriptTaxonomyImplementation` +
   `SourceMerging` before staging.
4. After Session 11 the campaign hits its terminal floor (~27): ~22 forward-looking
   working-state specs + 5 untargetable integration/fixture features. Document, don't force.

## Session 11 — New code-originated identities (committed 8a32d4e)

Prior session commit = `ef91844`. Created **4 code-originated `@architect-pattern`
identities** (D-13) + **5 `@architect-implements` edges**, de-orphaning 5 test features
incl. all 3 D-9 deferrals. Total orphans **32 → 27** (patterns 272 → 276). Identities:
`RegistryBuilder` (taxonomy/registry-builder.ts, utility/configuration), `SourceMerge`
(config/merge-sources.ts, utility/configuration), `TagRegistrySchemas`
(validation-schemas/tag-registry.ts, contract/validation-schemas — mirrors ExtractedPattern),
`MarkdownBlockParser` (utils/markdown-parser.ts, codec/rendering). Realized:
`StubTaxonomyTagTests`+`TypeScriptTaxonomyImplementation`→RegistryBuilder (one identity, two
tests), `SourceMerging`→SourceMerge, `TagRegistrySchemasValidation`→TagRegistrySchemas,
`LoadPreambleParser`→MarkdownBlockParser. All registered first-try; **no new identity is an
orphan** (read-back confirmed). All 12 §6 gates green (pkg test 1769, test:dogfood 1057, perf
3/3, dangling --strict 0, audit:subtractive 0). guard `--staged`: 12 modified, **0 status
transitions** (D-10: both completed features already carried an unlock-reason). docs:all →
ARCHITECTURE/CHANGELOG/PATTERNS regenerated (276 patterns), committed with code.

**Key learning — `implementedBy` clears orphan status.** `findOrphanPatterns`
(`read-api/graph-inventory.ts:154-155`) counts `implementsPatterns` + `implementedBy` as
relationships. So a new code-originated identity is non-orphan the instant a test feature
`@architect-implements` it — **no `@architect-uses` edge required**. This is why Session 11
authored zero use-edges and still de-orphaned all 4 new nodes, sidestepping the genuine
circular import between `registry-builder.ts` (imports tag-registry types) and
`tag-registry.ts` (imports `buildRegistry`). Roles/contexts: 2 mirrored exact siblings
(SourceMerge→ConfigLoader's `configuration`, TagRegistrySchemas→ExtractedPattern's
`validation-schemas`); 2 reasoned reuse of existing contexts (RegistryBuilder→`configuration`
since `taxonomy` is not a context and its neighbors are config/\*; MarkdownBlockParser→`codec`/
`rendering` matching CodecUtils + BlockSchema). No new bounded-context spawned.

### WS-1 expansion — COMPLETE (Sessions 07–11)

Orphans **58 → 27** across the expansion (core spine + test features S07-08, guard S09,
connectable test features S10, new identities S11); campaign total **107 → 27**. Projection,
core/src, guard/src, and all connectable core/cli test features are at **0 orphans**. The D-9
deferrals are closed. **Terminal floor = 27**: ~22 forward-looking working-state
roadmap/candidate specs in `architect/` (parent edges already present don't clear orphan
status — they're genuinely un-wired future work) + 5 untargetable integration/fixture test
features (`ArchitectPublicContract`, `DocumentationCommandParityBoundaryTests`,
`GenerateDocsCli`, `EmptyEpic`, `ParentEpic`). These are out of WS-1 scope (shipped-code
connectivity). **Next workstreams: WS-2 (skills) / WS-3 (docs)**, now unblocked — the graph
is connected enough through core+projection to drive doc generation.

**Coordination-model note (Sessions 09-11):** ran agent-per-session for the scoped edits +
Data-API read-back; main thread owned the full §6 gate sequence + commits + bookkeeping per
the maintainer's instruction. Each session = 2 commits (code + bookkeeping). format:check
flags `.pr-coordination/*` md/json each time — `prettier --write` the coordination files
before the gate. All three sessions: guard `--staged` 0 status transitions (D-6 + D-10 held).

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

### Rules for next session

1. **Read-surface verbosity is a render-time parameter now.** To make another verb terse, add
   per-fragment richness branching in `render-compact-text.ts` + a `--disclosure` flagParser; default
   `summary` at the command, never in the renderer core.
2. **`overview`'s default output is now `summary`.** `--disclosure full` reproduces the prior wall;
   skills/docs that quoted the full bootstrap output should note the flag.
3. ADR-content hygiene (D-16) is a separate workstream — do not edit `architect/decisions/*` inline.
