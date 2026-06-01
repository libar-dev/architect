# Dogfooding Gap Ledger — Architect API effectiveness baseline

> Campaign-scoped, ephemeral. Produced by the Phase-0 dogfooding workflow: 12 fresh-agent exploration scenarios answered API-only, friction recorded, deduplicated into ADD/REMOVE/ANNOTATE/GUIDE. This is the spec for the effectiveness fixes; delete when the campaign lands.

**Effectiveness baseline:** 12 scenarios · 11 answerable API-only · 1 required grep fallback.

11/12 scenarios were answerable API-only; 1 (FUZZY CONCEPT TO PATTERN, markdown/codec dependents) genuinely required grep because the only real consumer of MarkdownRenderer (GenerateDocsCli/generate-docs.ts) is invisible in the graph — a missing @architect-implements/@architect-uses edge, not a tooling limit. Two further scenarios (Classify-by-axes, Reverse-traceability) ran grep only as a VERIFICATION step (confirming @architect-bounded-context is annotated yet omitted from the pattern record; confirming an empty result is a real missing edge), so they remain effectively API-answerable. The API is already a credible grep replacement for state/dependency/ADR/taxonomy questions; the failures cluster in three places: (1) cross-pattern navigation that the graph CAN express but doesn't (ADR->enforcing-rule, TS-pattern->implementing-spec rules, reverse-dependents), (2) silent-empty / mislabeled surfaces that erode trust (arch packages [], documentation traceability rows:[], dep-tree wrong direction, --package filter returning 0, status vocab planned-vs-roadmap), and (3) the per-pattern record being lossy (boundedContext/productArea/level dropped) so a 4-axis classification needs 4+ verbs. None of these is a retrievability failure of payload CONTENT — the payloads, once located, are excellent (invariants, rationale, verifiedBy). The gaps are discovery, navigability, and trust signals.

## Top actions (highest leverage)

1. Restore boundedContext/productArea/level on the pattern detail record (plan 1e) — the single highest-leverage fix: it un-loses the per-pattern read kernel and lets `pattern <Name>` answer 4-axis classification in one call instead of 4+ verbs.
2. Fix dep-tree's direction inversion (or add --direction) and add a reverse-dependents accessor — dep-tree currently answers the OPPOSITE of its name and silently misleads on every dependency-walk scenario.
3. Make package/name filters fail loudly with accepted values instead of returning silent success:true,data:[] (arch packages, --package on rules/list) and reconcile the inconsistent package label (plan 1d) — silent-empty is worse than an error and led agents to false 'zero patterns/rules' conclusions.
4. Reconcile the status vocabulary to ONE label (planned vs roadmap vs candidate-not-an-FSM-state) and make CLI value errors enumerate the accepted enum (plan 1d) — three labels for one state breaks the obvious overview->list->isValidTransition chain.
5. Add the missing @architect-implements / @architect-uses edges (GenerateDocsCli->MarkdownRenderer, the 2 name mismatches, 4 untagged features) — plan 2a/2b — so reverse traceability and dependents stop being grep-only.
6. Make rules/bundle/context resolve through implementedBy so `rules --pattern <TsPattern>` and `bundle --mode review` surface the implementing specs' rules+scenarios (plan 2c) — today the empty result is a trap on the reverse-trace question.
7. Wire overview's startHere orientation (summary-with-references tier, plan 1a) + curate CLI hints (1c) + surface precomputed distributions (1b) — so a cold-start agent reads the ADRs and finds 'safe to start' work instead of being steered into the BLOCKED section.
8. Add ADR->enforcing-rule navigability (rules --decision <ADR>, navigable affectedPatterns) so the governance chain is traversable rather than reconstructed by grepping rule rationale text.

## ADD — views/fields/verbs the API should expose

### [HIGH · plan new] dep-tree walks the WRONG direction (returns dependents/reverse-usedBy edges, not dependencies) and there is no transitive forward-closure verb

- **Evidence:** Verified live: `dep-tree MarkdownRenderer --format json` roots at `ProjectionFragmentSchema` (a DEPENDENCY) with MarkdownRenderer as a non-root focal leaf, while `query getPatternDependencies MarkdownRenderer` correctly returns dependsOn=[FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema]. To get a transitive dependsOn closure an agent had to script repeated getPatternDependencies calls; no single verb walks dependsOn downward.
- **Scenarios:** DEPENDENCY WALK, ARCHITECTURE MAP, FUZZY CONCEPT TO PATTERN
- **Recommendation:** Either flip dep-tree to walk dependsOn (forward) by default, or add an explicit `--direction forward|reverse` flag with forward as default; ship a transitive-closure mode so `dep-tree X` returns the full forward dependency tree in one call. Until fixed, dep-tree actively misleads on the exact question its name implies.

### [MEDIUM · plan new] No reverse-dependents verb / kernel method (`query getReverseDependencies` / `arch dependents`)

- **Evidence:** `query getReverseDependencies MarkdownRenderer` -> 'Unknown API method'; the whitelist has only forward getPatternDependencies. The sole reverse signal is the relationships.usedBy field, which is empty here, so 'who depends on X' cannot be framed as a query.
- **Scenarios:** FUZZY CONCEPT TO PATTERN, DEPENDENCY WALK
- **Recommendation:** Add a first-class reverse accessor (`query getReverseDependents <Name>` or `arch dependents <Name>`) that returns usedBy/implementedBy/enables, so the dependents question has an explicit verb rather than relying on trusting a possibly-empty usedBy field.

### [HIGH · plan 2c] No traversal from a DecisionRecord (ADR) to the business rules / patterns that enforce it; affectedPatterns and relatedDecisions are not navigable edges

- **Evidence:** `pattern ADR009ProjectionTrustBoundary` and `arch neighborhood ADR009...` return all-empty relationships; the ADR->enforcing-rule link exists only as free text inside rule rationale. `rules --pattern ADR009...` returns exactly 1 rule (its own feature) and misses the markdown-escaping rule owned by ApiReferenceProjectionExecutableTests that cites ADR-009 by name. ADR-009/010 list affectedPatterns=[ADR-005,ADR-006] but dep-tree shows them isolated; relatedDecisions=[] for every ADR.
- **Scenarios:** ADR GOVERNANCE, projection trust boundary (ADR-009) rules
- **Recommendation:** Add `rules --decision <ADR>` (aggregate all rules citing/enforcing that ADR across any owning pattern) and make affectedPatterns a navigable graph edge so `dep-tree`/`arch neighborhood` can traverse the ADR-005->006->009->010 governance chain. Populate relatedDecisions or remove it.

### [HIGH · plan 2c] `rules --pattern <TsPattern>` and `bundle --mode review` do not resolve through implementedBy to surface the implementing specs' rules/scenarios

- **Evidence:** Verified live: `rules --pattern PatternGraphApi` returns 0 rules; the 12 rules / 24 scenarios are keyed to the FEATURE pattern names (PatternGraphApiReverseLookup, PatternGraphApiConsistencyExecutableTests). `bundle PatternGraphApi --mode review` returns blocks.scenarios=[] and blocks.rules=[] despite blocks.deps.implementedBy listing both feature files; `context PatternGraphApi` returns specFiles=[]/testFiles=[].
- **Scenarios:** REVERSE TRACEABILITY, TAXONOMY ENFORCEMENT
- **Recommendation:** Make `rules --pattern <TsPattern>` aggregate rules of its implementedBy features, populate review-bundle blocks.rules/scenarios from those features, and populate context specFiles/testFiles. A reverse-trace question starts at the TS pattern; today the empty result is a trap forcing a manual re-query by feature name.

### [MEDIUM · plan new] A 'next workable roadmap item' verb that computes roadmap-minus-blocking and a roadmap ordering/priority/quarter signal

- **Evidence:** Agent derived 16 unblocked items via `comm -23 <(list --status roadmap) <(arch blocking)`; `documentation roadmap`/`current-work` render empty Quarters, `query getQuarters`=[] (verified), pattern records carry no priority/sequence field. The capability is itself a specced-but-unbuilt roadmap item (LivingRoadmapCLI: roadmap:next/blocked/path-to).
- **Scenarios:** WORK STATE, API SELF-COVERAGE
- **Recommendation:** Ship the set-difference as a verb (e.g. `arch workable` / `roadmap next`) and add an ordering signal. Honest pre-1.0 mid-state, but the API cannot answer its own roadmap-navigation question today; track as the LivingRoadmapCLI build.

### [MEDIUM · plan new] No verb maps a taxonomy enum value to its enforcement site (rule id -> decider pattern -> file), and no runtime data-flow / pipeline verb (scanner->extractor->graph->projection->renderer->sink)

- **Evidence:** Answering 'where is invalid-status-transition enforced' required stitching documentation validation-rules + list --role decider + context FSMValidator. dep-tree BuildPipeline shows only annotated edges (PatternScanner/CLIs) and misses the extractor/projection runtime stages, so static edges under-describe the actual pipeline order. (FEEDBACK.md independently requests a `pipeline`/`arch reachability` verb.)
- **Scenarios:** TAXONOMY ENFORCEMENT, ARCHITECTURE MAP, KERNEL DISCOVERY
- **Recommendation:** Add a `taxonomy --enforcement` view (enum value -> rule id -> decider pattern + file) and a `pipeline`/`arch reachability` verb that walks producer->consumer->entry-point across the registry, not just annotated @architect-uses edges.

### [HIGH · plan 1a] overview lacks a 'startHere' orientation block (load-bearing ADRs, mandatory skills, architect/ working-state folder, canonical reading order) and a prominent 'safe to start' actionable set

- **Evidence:** Verified live: overview --format json wraps in {children, root}; record keys are activePhases/architecture/blocking/cliHints/generatedViews/kind/progress — no reading-guide field. The largest section is ~40 BLOCKED patterns (work you CANNOT start) while the 18 startable roadmap items require a separate `list --status roadmap`. CLAUDE.md calls ADR-006/003/009 load-bearing yet a newcomer following overview never sees them.
- **Scenarios:** Onboarding cold-start, WORK STATE, KERNEL DISCOVERY
- **Recommendation:** Wire the dead `summary-with-references` tier to emit orientation references (DECISIONS/TAXONOMY/VALIDATION-RULES/API-REFERENCE, derived not hand-authored) and surface a 'safe to start' count+sample with at least equal prominence to BLOCKING.

### [MEDIUM · plan 1b] Surface precomputed distributions (status/role breakdowns) in overview; today they require separate query passthrough calls

- **Evidence:** getStatusDistribution (118 completed/129 active/19 planned/20 candidate) and listRoles counts are precomputed on the graph but overview.progress only carries total+percentage. Agents ran getStatusDistribution/listRoles/getStatusCounts as extra calls to reconstruct the breakdown overview should already show.
- **Scenarios:** Onboarding cold-start, WORK STATE, TAXONOMY ENFORCEMENT, API SELF-COVERAGE
- **Recommendation:** Render the already-precomputed status and role distributions in overview, richness-gated (lean in summary, itemized in full), so the cold-start dashboard answers 'what is the shape' in one call.

### [LOW · plan 2c] files --related omits the implementing .feature spec paths; bundle/files do not include spec files for a 'what proves this' question

- **Evidence:** `files PatternGraphApi --related` listed the .ts primary + architectureNeighbors + roadmapDeps but NOT pattern-graph-api.feature / pattern-graph-api-consistency.feature, even though those are the implementing specs that prove the contract.
- **Scenarios:** REVERSE TRACEABILITY
- **Recommendation:** Include implementedBy feature file paths in files --related output so the reverse-trace reading list is complete.

### [LOW · plan new] A metadata.note / emptyReason field on kernel responses when data is empty-by-design

- **Evidence:** `query getQuarters`/`getAllPhases`/`getActivePhases` all return {success:true,data:[]} identically; anti-patterns.ts:69,96 shows @architect-quarter/@architect-phase are deliberately discouraged, so emptiness is the enforced state — but the payload is indistinguishable from 'not populated yet', and carries no breadcrumb to the populated sibling getRoadmapItems.
- **Scenarios:** API SELF-COVERAGE, WORK STATE, Onboarding cold-start
- **Recommendation:** Add metadata.note/emptyReason on empty-by-design kernel responses (e.g. 'no quarter annotations — discouraged by anti-pattern lint; see getRoadmapItems') so a caller can distinguish intentional-empty from missing-data without a second probe.

## REMOVE — dead/noisy/misleading surface (No-BC)

### [HIGH · plan 1d] `arch packages <name>` returns {success:true, data:[]} for a real populated package instead of erroring or matching the display name

- **Evidence:** Verified live: `arch packages "Architect Projection" --format json` -> success:true, data:[] even though architect-projection has 103 patterns. The display name from overview does not resolve and there is no hint the arg wants the short npm-style name. success:true with empty data is worse than an error — it reads as 'this package has zero patterns'.
- **Scenarios:** ARCHITECTURE MAP, Classify-by-axes, projection trust boundary rules
- **Recommendation:** Make package/name filters fail loudly with the accepted value set when an arg does not resolve, or normalize display-name<->npm-name; never return silent success:true,data:[] for an unmatched filter.

### [HIGH · plan 1d] `rules --package <name>` and `list --package <name>` silently return 0/[] for real packages due to inconsistent package labels

- **Evidence:** `rules --package architect-projection --count`=0 AND `rules --package architect-pkg-content --count`=0 while rules clearly exist under those labels; `list --package "@libar-dev/architect-core" --names-only`=[] though the package has patterns. The package field itself is inconsistent across patterns (ADR009 tagged architect-pkg-content vs ApiReference tagged architect-projection). FEEDBACK.md independently flags 'package is not a queryable dimension'.
- **Scenarios:** projection trust boundary rules, Classify-by-axes
- **Recommendation:** Reconcile the package label across patterns (one canonical key), make --package fail loudly on an unmatched value, and confirm rules/list --package resolve consistently. This currently leads agents to conclude 'no rules/patterns exist'.

### [MEDIUM · plan 2e] `documentation traceability` advertises itself as THE traceability view but returns an empty matrix (rows:[])

- **Evidence:** Verified live: `documentation traceability --format json` returns rows:[] (0 rows). For a scenario titled 'reverse traceability' this is dead surface — it would mislead an agent into thinking no spec<->pattern link exists when `pattern` exposes implementedBy richly. (FEEDBACK.md: '8 of 13 generators emit empty'.)
- **Scenarios:** REVERSE TRACEABILITY
- **Recommendation:** Either populate the traceability matrix from the implementedBy edges that demonstrably exist, or delete the empty generator (No-BC) until it has data; an emptiness gate at docs:all time should catch degenerate generators.

### [LOW · plan 2e] Re-confirm and prune genuinely-dead kernel methods (prior review found ~23/29 with zero production callers) and redundant overlapping verbs

- **Evidence:** getStatusDistribution supersets getStatusCounts; taxonomy and documentation taxonomy return identical TaxonomyDigest payloads; getQuarters/getAllPhases/getActivePhases each cost a ~700ms pipeline run to return []. Multiple records flag these as redundant/empty surface.
- **Scenarios:** TAXONOMY ENFORCEMENT, API SELF-COVERAGE, WORK STATE
- **Recommendation:** After canonicalization, delete the genuinely-dead kernel methods and collapse the duplicated taxonomy verb; keep getStatusDistribution over getStatusCounts.

## ANNOTATE — patterns whose graph slice under-describes them

### [HIGH · plan 2b] MarkdownRenderer has a real source consumer (GenerateDocsCli / generate-docs.ts) that is invisible in the graph — the only true grep-fallback in the exercise

> **CLOSED** (resolution recorded at the 2026-05-28 synthesis below, line ~196): the edge is now live — `MarkdownRenderer.usedBy=['GenerateDocsCli']`, authored as a `@architect-uses` Gherkin header tag on the consumer feature (a Gherkin-owned pattern authors its `uses` on the feature header, not on production TS — see `FEEDBACK.md`). Kept here as the original Phase-0 finding; the live graph is the source of truth.

- **Evidence:** `arch neighborhood MarkdownRenderer` and `query getPatternDependencies MarkdownRenderer` return usedBy=[]/enables=[] (verified: usedBy=[]), yet generate-docs.ts:25 imports renderMarkdown and :399 calls it. The consumer pattern GenerateDocsCli declares uses=[]/dependsOn=[], so the @architect-uses edge is missing on the consumer and the reverse usedBy edge never exists. An agent trusting the API would confidently and wrongly report 'MarkdownRenderer has no dependents'.
- **Scenarios:** FUZZY CONCEPT TO PATTERN, DEPENDENCY WALK
- **Recommendation:** Add the missing @architect-uses MarkdownRenderer (and sibling renderer) edge on GenerateDocsCli / generate-docs.ts so the reverse usedBy edge materializes. This is a correctness bug in annotations, not a tooling limit.

### [HIGH · plan 2a] Test/prod pattern-name mismatches and missing @architect-implements edges break the bipartite spec<->pattern link

- **Evidence:** Plan phase 2a/2b confirm two test/prod name mismatches plus 4 feature files lacking @architect-implements (error-factories, result-monad, extractor/external-relationship-tags, extractor/value-format-canonical-values). REVERSE TRACEABILITY also surfaced the Api-vs-API casing subtlety (pattern name PatternGraphApi vs runtime class PatternGraphAPI).
- **Scenarios:** REVERSE TRACEABILITY, FUZZY CONCEPT TO PATTERN
- **Recommendation:** Align the mismatched names and add @architect-implements:<ProdPattern> on each feature so reverse traceability resolves; confirm any deliberately test-scoped pattern.

### [MEDIUM · plan 2c] The 'assembled runtime PatternGraph + relationshipIndex + precomputed views' that ADR-006 names as the actual read model has no first-class pattern; the kernel pattern is the Zod schema, not the runtime read model

- **Evidence:** `search RuntimePatternGraph` and `search relationshipIndex` both return []; the only match is `PatternGraph` whose file is validation-schemas/pattern-graph.ts (the schema/contract), not the transformToPatternGraph() output that doctrine calls the read model. ADR006SingleReadModelArchitecture's slice has NO edge to PatternGraph despite being entirely about it — the link lives only in prose.
- **Scenarios:** KERNEL DISCOVERY, ADR GOVERNANCE
- **Recommendation:** Add a seeAlso/uses edge from ADR-006 to the PatternGraph pattern, and annotate the distinction between the schema contract and the assembled runtime read model so an API-only agent does not conflate them.

### [MEDIUM · plan 2d] The decider patterns (FSMValidator, ProcessGuardDecider) and the read-api utilities carry zero documented invariants / jsdoc boilerplate, so their graph slice cannot explain how enforcement works

- **Evidence:** `rules --pattern ProcessGuardDecider --only-invariants` and `rules --pattern FSMValidator --only-invariants` both return []; the role taxonomy literally describes deciders as 'FSM and rule deciders enforcing process integrity'. Plan 2d notes architect-core read-api files (pattern-graph-api.ts:11-12, architecture-inspection.ts:11-12) carry uncaught jsdoc boilerplate that the projection-only audit misses.
- **Scenarios:** TAXONOMY ENFORCEMENT, KERNEL DISCOVERY, Classify-by-axes
- **Recommendation:** Extend the jsdoc-boilerplate audit to architect-core and backfill substantive @architect-\* invariants on the decider and read-api patterns where the slice was unhelpful.

### [LOW · plan new] Roadmap patterns carry no dependency edges, so 'deps satisfied' is vacuously true and scope-validate can never surface a real blocker for them

- **Evidence:** `query getPatternDependencies ArchitectureDelta` -> all empty; `dep-tree ArchitectureDelta` shows only the focal node. Roadmap specs have logical prerequisites in prose (LivingRoadmapCLI = 'capstone for Setup A') but no @architect-uses edges. Expected pre-1.0 mid-state per doctrine, but worth an annotation note so agents do not read vacuous-ready as real readiness.
- **Scenarios:** WORK STATE
- **Recommendation:** Where roadmap prerequisites are real, add the @architect-uses edges so readiness gates carry signal; otherwise document that roadmap stubs are intentionally edge-free.

### [LOW · plan 2e] documentation architecture emits raw JSON-per-line (escaped mermaid in a JSON string) instead of rendered text/markdown for its default format

- **Evidence:** Output lines are literal {"diagram":{"content":"graph TD\n..."},...} — mermaid escaped with \n, requiring mental unescaping, even though CompactText/Markdown renderers exist. Two BC-listing verbs (arch bounded-context vs documentation architecture's api diagram) also disagree on membership (7 vs 4) with no explanation.
- **Scenarios:** ARCHITECTURE MAP
- **Recommendation:** Render the architecture sections through the existing markdown/compact renderer in default text format, and reconcile/explain the BC-membership filter difference between the two verbs.

## GUIDE — overview/hook/skill/help guidance gaps

### [HIGH · plan 1d] CLI value errors do not enumerate the accepted enum, and the status vocabulary is split three ways (planned / roadmap / candidate-not-an-FSM-state) with undiscoverable accepted values

- **Evidence:** Verified live: `list --status planned` -> 'Error: Expected accepted status value, received: planned' (never lists the accepted set) while getStatusDistribution reports the count under key `planned`:19; the working alias is `roadmap`. Symmetrically isValidTransition planned active errors. `query isValidTransition roadmap candidate` -> 'Expected process status value, received: candidate' (candidate is a tag value but not an FSM state). getStatusDistribution renames roadmap->planned; same enum, three labels.
- **Scenarios:** WORK STATE, TAXONOMY ENFORCEMENT, Onboarding cold-start, API SELF-COVERAGE
- **Recommendation:** Make parseSchemaValue surface the z.enum's accepted values in the thrown message (plan 1d), and reconcile the status label across getStatusDistribution / list / FSM to ONE vocabulary (roadmap), distinguishing 'tag enum' from 'FSM states' with the candidate->roadmap entry edge documented.

### [HIGH · plan 1e] The per-pattern record (`pattern`/`bundle`) is lossy — boundedContext, productArea, level are dropped though source carries them — so a 4-axis classification needs 4+ verbs and nothing points to the arch verbs that recover them

- **Evidence:** Verified live: `pattern PatternGraphApi --format json` root keys are deliverableManifest/deliverables/description/file/kind/maturity/package/patternName/relationships/role/rules/source/status/stubs — NO boundedContext/productArea/level, though source line 6 is @architect-bounded-context:read-api and `arch neighborhood` returns context:read-api. Plan 1e confirms exactly this.
- **Scenarios:** Classify-by-axes, KERNEL DISCOVERY, REVERSE TRACEABILITY
- **Recommendation:** Restore boundedContext/productArea/level on the PatternDetail projection + fragment schema so `pattern` answers all four classification axes in one call (ripples the determinism gate — regen docs-live in the same change).

### [MEDIUM · plan 4] search matches only pattern NAMES (prefix/substring), not annotation prose; the natural keyword query for a concept returns empty with no fallback hint

- **Evidence:** `search "read model"` / `search parseAndProject` / 'projection trust' intent all returned [] (parseAndProject is a function name, not a pattern name); only literal name prefixes like 'ADR006' or 'projection' hit. An agent asking 'which ADRs govern the read model' by keyword gets nothing and would not discover ADR-006/005/009/010.
- **Scenarios:** ADR GOVERNANCE, projection trust boundary rules, KERNEL DISCOVERY
- **Recommendation:** Add full-text search over decision Context/Decision text and rule rationale (or document the name-only limit and steer keyword misses to `documentation decisions`). Note the boundary rule was only found by guessing `rules --feature '**/*boundary*'`.

### [MEDIUM · plan 1c] Curate overview CLI hints to name the verbs agents wished they'd known (bundle/open-questions/handoff/search, documentation architecture as THE map verb) and drop ambiguous session vocabulary

- **Evidence:** cliHints lists context/scope-validate/dep-tree/list/files/rules/arch-blocking but omits bundle, open-questions, handoff, search (all in --help). The single best architecture-map command (`documentation architecture`) is buried as a parenthetical; overview hint writes session type 'planning' while `context --help` uses 'implement' and `bundle --mode plan' uses 'plan' — a newcomer cannot tell the right spelling.
- **Scenarios:** Onboarding cold-start, ARCHITECTURE MAP, REVERSE TRACEABILITY
- **Recommendation:** Rewrite OVERVIEW_CLI_HINTS from this Gap Ledger: promote documentation architecture, add bundle/open-questions/search, drop hints that did not earn their line, and normalize the session-type vocabulary.

### [MEDIUM · plan 4] The `query <method>` kernel passthrough surface (getStatusDistribution, listRoles, isValidTransition, getRoadmapItems...) is undiscoverable from --help, and the exercise brief documents isValidTransition as a top-level verb when it only works through passthrough

- **Evidence:** `isValidTransition candidate roadmap` -> 'Unknown subcommand'; correct form is `query isValidTransition`. `query` (no method) -> 'Usage: architect query <method>' with no enumeration. (One record found query --help well-organized, so this varies — the brief's documentation is the bigger miss.)
- **Scenarios:** TAXONOMY ENFORCEMENT, API SELF-COVERAGE, WORK STATE
- **Recommendation:** Have `query` (no method) enumerate the whitelisted methods, and correct skill/brief docs so isValidTransition is always shown under the query passthrough, not as a top-level verb.

### [MEDIUM · plan 4] Skill/doc sync: document --richness and --disclosure enums, correct the documentation-type count (13 not 12), document the open-questions --parent quirk and the planned-vs-roadmap split, refresh stale 266-vs-286 counts

- **Evidence:** Plan phase 4 enumerates these. The 266 (delivery) vs 286 (total) discrepancy between overview.progress and status/getStatusDistribution appears in three records and erodes trust 'on minute one'; the skill currently shows neither the --disclosure nor --richness enum, which caused a false 'flag broken' report.
- **Scenarios:** Onboarding cold-start, WORK STATE, ARCHITECTURE MAP
- **Recommendation:** Sync architect-data-api skill: document the --richness/--disclosure enums, fix the doc-type count to 13, state overview's denominator (delivery-only, candidates excluded) so 266-vs-286 is explained, and refresh example counts.

## Narrative

The API is already a credible grep replacement: 11 of 12 scenarios were answered API-only, and the one genuine grep fallback (MarkdownRenderer's dependents) is an annotation hole — a missing @architect-uses edge on GenerateDocsCli — not a tooling limit, and is already covered by plan phase 2b. Where the API shines, it shines hard: ADR Context/Decision/Consequences, rule invariants with rationale and verifiedBy, taxonomy enums, and one-hop dependency edges all come back structured, deterministic, and sub-second, with a clean {success,data,metadata} envelope and a danglingReferenceCount:0 trust signal. The agents' praise is consistent — `documentation architecture` and `arch neighborhood` are standout verbs; payload CONTENT quality is not the problem. The gaps cluster in three failure modes. First, NAVIGABILITY the graph could express but doesn't: ADR->enforcing-rule, TS-pattern->implementing-spec-rules, and reverse-dependents all dead-end even though the underlying relationships exist; dep-tree compounds this by walking the WRONG direction (verified live: `dep-tree MarkdownRenderer` roots at a dependency, not at MarkdownRenderer), actively misleading on the exact question its name implies. Second, SILENT-EMPTY / MISLABELED surfaces that erode trust faster than any missing feature: `arch packages \"Architect Projection\"` returns success:true,data:[] for a 103-pattern package; `rules/list --package` return 0 for real packages due to an inconsistent package label; `documentation traceability` advertises itself then returns rows:[]; the status enum is labeled three ways (planned/roadmap/candidate) so the obvious overview->list->isValidTransition chain breaks with errors that never enumerate the accepted set; and the 266-vs-286 headline mismatch erodes trust on minute one. Third, the per-pattern record is LOSSY — boundedContext/productArea/level are dropped though source carries them (verified) — turning a 4-axis classification into a 4-verb stitch. Encouragingly, the active plan (joyful-turing) already targets the highest-leverage items: 1e restores the dropped classification fields, 1a-1c fix the cold-start orientation, 1d fixes self-documenting value errors and the package-filter class, and 2a-2d backfill the annotation edges. The new (uncovered) work is concentrated in graph navigability — fixing dep-tree direction, adding a reverse-dependents verb, and making affectedPatterns/ADR-enforcement edges traversable — plus the empty-by-design provenance note and the still-unbuilt roadmap-next capability. Net verdict: the API is a no-brainer grep replacement for state, dependency, ADR, and taxonomy questions TODAY; closing the navigability and silent-empty gaps would make it one for the harder cross-pattern and reverse-traceability questions too.

---

## Re-measure (post-fix, blind re-run 2026-05-29)

The 4 baseline scenarios that exercised the closed gaps were re-run by fresh agents blind to what changed, then compared to baseline. **All 4 are now answerable API-only and grep-free** (verified live):

- **CLASSIFY A FILE (1e):** `pattern <Name>` now returns role + boundedContext + productArea in one call (e.g. GenerateDocsCli productArea='DataAPI'); minimal path 2 calls. Residual: architectural **layer** is unmodeled for _every_ pattern (taxonomy has role/bounded-context/hierarchy-level but no arch-layer axis) — a mid-build reality, not a regression.
- **ONBOARDING COLD-START (1a/1c):** overview transformed from a wall-of-blockers into a cold-start router (START HERE doc order, mermaid maps, READY TO START, anti-grep cheat-sheet). Residual: "deps satisfied" overstates workability (bare plan stubs can appear); overview routes to docs but doesn't rank the load-bearing ADRs.
- **FUZZY → DEPENDENTS (2b):** the ONLY true grep-fallback is eliminated — `MarkdownRenderer.usedBy=['GenerateDocsCli']` corroborated 3 ways via computed reverse edges. Residual: multi-word fuzzy `search "markdown rendering"` silently returns [] (no per-token degrade).
- **CLI DISCOVERABILITY (1d):** `--richness`/`--disclosure`/`--status` value errors all enumerate accepted values now. Residual: `planned` (display alias) vs `roadmap` (FSM) split on one overview screen with no `--status` aliasing; enums enumerated in error text but not always in `--help`.

**Verdict (synthesis):** "grep is now the exception, and the remaining friction is naming/ranking, not missing data." The residuals above feed the next chunk.

---

## Re-measure (navigability + trust + core-annotate chunk, blind re-run 2026-05-29)

This chunk targeted the NAVIGABILITY + SILENT-EMPTY/TRUST + ANNOTATE clusters above. 7 fresh agents, blind to the changes (forbidden from reading the design docs), re-ran the exact gap scenarios API-only. **All 8 targeted gaps are CLOSED — every scenario answered API-only, grepFallbackNeeded=false (verified live).** Overall verdict: _"YES — for these navigability/trust/governance questions the Architect API is now a no-brainer grep replacement."_

| Gap (cluster)                                                                                | Baseline                                     | Now (verified live, grep-free)                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dep-tree wrong direction + no reverse-dependents + no transitive closure (**N1**)            | rooted at a dependency; misled on every walk | `dep-tree X` → `"X depends on N (M transitive); P depend on X"` in ONE flagless call; focal-rooted bidirectional `upstream`/`downstream`, cycle-safe, depth-capped. Blast radius computed directly. |
| `rules --pattern <TsPattern>` / review-bundle don't resolve through `implementedBy` (**N2**) | `rules --pattern PatternGraphApi` → 0        | → 16 rules + scenarios via `implementedBy`, provenance-tagged.                                                                                                                                      |
| No ADR→enforcing-rule traversal (**N3**)                                                     | ADR slice all-empty; prose-only link         | `rules --decision <ADR>` + `arch neighborhood <ADR>` → `enforcedBy`/`seeAlso` populated via the new `@architect-enforces-decision` tag.                                                             |
| Silent-empty package filters (**T1**)                                                        | `arch packages "…"` → `success:true,data:[]` | unmatched `--package`/`--decision` → **fail loud** with the accepted set enumerated; canonical derived package key.                                                                                 |
| Status vocabulary split, errors don't enumerate (**T2**)                                     | `list --status planned` → bare error         | `list --status planned` → 19; value errors enumerate accepted set.                                                                                                                                  |
| `documentation traceability` empty matrix (**T3**)                                           | `rows:[]`                                    | populated (80 rows / 79 distinct patterns), `tests[]` now `.feature`-only; degenerate-generator guard module shipped (hook deferred).                                                               |
| ADR-006↔PatternGraph prose-only; deciders zero invariants (**A1/A2**)                        | no edge; empty rule slices                   | `arch neighborhood ADR006…` → `seeAlso:['PatternGraph']`; FSMValidator (4) + ProcessGuardDecider (6) invariant Rule blocks; jsdoc-boilerplate audit now scans architect-core.                       |
| MarkdownRenderer dependents invisible (the one baseline grep-fallback)                       | `usedBy:[]`                                  | `dep-tree` downstream lists GenerateDocsCli — grep eliminated.                                                                                                                                      |

**In-chunk fix from this re-run:** `rules --decision` was mis-keyed (accepted only the pattern-name form; `rules --decision ADR-009` → 0 silently). Fixed: a kernel `decision-resolution.ts` resolver normalizes any form (`ADR-009`/`ADR009`/`009`/`ADR009ProjectionTrustBoundary`) to the canonical decision pattern, reused by the projection scope-match, the relationship-resolver reverse edge, and the CLI; `--decision` now fails loud with the accepted decisions enumerated. Verified: both forms → 5 rules; `NONSENSE` → loud error.

**Residuals (feed the NEXT chunk — naming/ranking/consistency, not missing data):**

1. **Duplicate `@architect-pattern:PatternGraphAPICLI` identity** declared in TWO feature files — violates ADR-001's one-file invariant, yet `validate:all` / `arch dangling` / guard ALL pass. **No gate catches a duplicate Gherkin pattern identity.** (Reported to FEEDBACK.md; fix = rename one identity + add a duplicate-identity validation gate. The 80-vs-79 traceability row is a symptom, intentionally not papered over in the projection.)
2. Status `planned` vs `roadmap` dual-labeled on one screen — the filter works, but nothing signals `planned` is a synthetic rollup alias.
3. JSON-mode errors print a plain stderr line (exit 1) even under `--format json`, not a `{success:false,error}` envelope — an agent piping to jq gets a parse error. Affects all enum filters.
4. Governance edges are one-directional: `arch neighborhood <ADR>` shows `enforcedBy`/`seeAlso`, but the same query on the enforcer (`enforces:None`) or target (`seeAlso:[]`) doesn't surface the reverse edge.
5. `pattern <Name>` shows an empty own `=== Rules ===` block (rules live on implementing specs) with no pointer to `rules --pattern` — a newcomer could wrongly conclude "no rules."
6. ADR ids aren't searchable tokens (`search ADR-009` → `[]`); the bare id and pattern name have no API-level bridge.
7. `rules` scope flags are mutually exclusive — "rules on pattern X from ADR Y" can't be one call.

**Verdict:** the chunk's bar is met. Grep is the exception for navigability/trust/governance; the next chunk is making the new edges symmetric, adding the duplicate-identity gate, and self-explaining the alias/empty cases.

---

## Re-measure (validation + skills/demo polish + residual sweep, 2026-05-29)

A validation pass (6 parallel blind-audit agents: 3 skills · demo hook · closed-gap regression · residual triage) re-checked the prior chunk against the live CLI, then this session fixed/polished from the findings. **Every gate green** at HEAD (typecheck · validate:all · docs-determinism zero-diff · package tests · dogfood 1162 · guard 43).

**Closed-gap regression: 7.5/8 hold — one ledger CORRECTION.** N1, N2, N3, T1, T2, T3, A1, and 2b all reproduce live. The lone deviation is **inside A2, and it is a mis-recorded verification target, NOT a CLI regression**: the earlier re-measure claimed `rules --pattern ProcessGuardDecider --only-invariants` → 6, but it returns **0**. The 6 invariants live on **ProcessGuardLinter** — `packages/architect-guard/tests/features/process-guard-rules.feature` carries `@architect-implements:ProcessGuardLinter`, and `git log -S` confirms it has *never* pointed at ProcessGuardDecider. The N2 implementedBy-resolution mechanism is proven intact (PatternGraphApi=8, FSMValidator=4, ProcessGuardLinter=6); only the ledger's example pattern name was wrong. **No action needed beyond this correction.**

**Landed this session:**

- **Skills resynced to the live CLI** (the prior chunk's fixes had invalidated frozen facts): `list --status planned` now accepted; 34-method kernel (was 29); `@architect-enforces-decision` is the pattern→ADR edge; `bundle --include` accumulates; counts 266/286→272/292; `--package` short-names; `arch graph`/`packages`; `context --session` (no review); `index` not a doc type; replaced the rotted ConfigLoader/DefineConfig "zero-JSDoc completed" example (both are `active` + carry `@architect-pattern`) with a live-verification method. Commit `d12ebdc`.
- **Capability tour re-centered on `PatternGraphApi`** (the read kernel) instead of markdown rendering — search→bundle→dep-tree→rules→ADR-006 governance→scope-gate, one coherent read-model story; fixed the empty step-6 rules block; added governance + scope-gate steps + an emptiness guard. Commit `d38ca5d`.
- **Residual #1 CLOSED** — renamed `pattern-graph-cli-query.feature` identity to `PatternGraphCliQueryPassthrough` + `@architect-implements:PatternGraphAPICLI` (matching its 4 sibling slice features), and added a `detectDuplicateFeatureIdentities` anti-pattern gate (error-severity → fails `validate:all`) that reads feature-LEVEL tags only (immune to docstring fixtures). Executable-tested. Commit `c398088`.
- **Residual #6 CLOSED** — `search ADR-009` now resolves to `ADR009ProjectionTrustBoundary` via a punctuation-insensitive fuzzy-match fallback. Unit-tested. Commit `0738b87`.
- **Residual #5 MITIGATED + deferred** — added a skill note that `pattern <Name>`'s own `=== Rules ===` block is empty when rules live on implementing specs (use `rules --pattern`). The *renderer* hint is **deferred (NEEDS-DESIGN)**: `pattern <Name>` renders through the shared generic key-value fallback, so a clean conditional hint needs a dedicated `PatternDetail` compact renderer (not a fragile special-case of the shared renderer).
- **`@projection` deprecated-tag hygiene** — removed the redundant legacy `@projection` tag from `pattern-catalog-status-filter.feature` (the proper `@architect-role:projection` was already present), clearing the lone `validate:all` warning.

**Still deferred (NEEDS-DESIGN / deliberate — re-confirmed real, not quick fixes):**

- **#3 (JSON error envelope)** — ✅ **RESOLVED 2026-05-30.** Chosen design: under `--format json` an error emits `{success:false,error:{message}}` on **stderr** (stdout stays clean — the success-path pipe invariant holds), exit unchanged; `2>&1 | jq '.success'` parses it. The fix reads argv directly in `main().catch` (where `format` is out of scope) and routes through `handleCliError`. Executable scenario added to `cli-output-formatting.feature`. (Grounding note for the record: the original framing was overstated — stdout was already clean/empty on error and exit code was 1, so only a defensive `2>&1 | jq` hard-broke; and `.success` was never uniform on the success path since bundle verbs return `{root,children}`.)
- **#2 (planned/roadmap dual label)** — KEEP DEFERRED, no fix needed. Already mitigated by the overview `(roadmap+deferred)` parenthetical, the self-documenting `list --status` error enum, and the data-api skill's Status-vocabulary section; no remaining confusion to fix. (Ledger correction 2026-06-01: the earlier "churns the determinism gate" rationale was **false** — the overview label is runtime-only in `render-compact-text.ts` and is **not** in `docs-live/`, so any change would be byte-identical to the gate either way. The reason to leave it is "no confusion left to fix", not gate cost.)
- **#4 (governance edge symmetry)** — KEEP DEFERRED (doctrine). `enforcedBy` is the computed reverse of authored `@architect-enforces-decision`; a forward `enforces` on the enforcer + a symmetric `seeAlso` violates the "history lives in git / computed reverse edges only" doctrine. Note (2026-06-01): the related legibility gap — `pattern <ADR>` omits the computed `enforcedBy` that `arch neighborhood <ADR>` exposes — is **also not a one-liner**: adding `enforcedBy` to `PatternRelationshipsSchema` is a `strictObject` contract change touching the 36-pattern/108-rule perf fixture + codecs, and returns `[]` for every current ADR. Design-tier work; the existing reach paths (`rules --decision <ADR>`, `arch neighborhood <ADR>`) already answer the question.
- **#7 (mutually-exclusive `rules` scope flags)** — KEEP DEFERRED for the real feature (AND-composition of intersecting `--pattern X` + `--decision Y`). The completable polish is already done: the conflict message names every flag + the constraint (`--pattern, --product-area, --package, --feature, and --decision cannot be combined`).

---

## Re-measure (effectiveness validation + fixes + skill/demo-hook polish, 2026-05-30)

Validation session: re-ran every gate (all green at HEAD), then a blind effectiveness audit (19 agents: 3 skill drift-audits · demo-hook teaching-quality · closed-gap regression · deferred-scope · 6 blind dogfood probes, each skeptic-verified) → ranked synthesis → fix → **blind re-verification (8 agents, `allPass:true`)**.

**Closed-gap regression: all 8 prior clusters (N1–N3, T1–T3, A1/A2) + residuals #1/#6 still hold.** Skeptics rejected 5 false frictions (agent misuse / by-design), confirming the API is a credible grep replacement for the prior targets.

**New find + fix (the one real correctness bug):** `rules --decision ADR-005` returned **0** (every other ADR resolved) — an ADR/PDR numeric-id collision in the projection's decision-record self-match (re-canonicalized the ambiguous bare `005` tag instead of comparing pattern identity). Fixed + regression-tested with a seeded `ADR-555`/`PDR-555` collision. The renderer-debugger's own governing ADR was the false-empty — high effectiveness leverage.

**Effectiveness gaps closed this session (all blind-re-verified live, grep-free):**

| Gap | Before | After |
| --- | --- | --- |
| `rules --decision ADR-005` (ADR/PDR collision) | `0` silently | `5` (identity self-match); no other ADR regressed |
| JSON error envelope (#3) | plain stderr line; `2>&1\|jq` breaks | `{success:false,error}` on stderr; parses; stdout clean |
| `rules --product-area <bogus>` | silent `0` | fail-loud with the 8-value enum (matches `--package`) |
| multi-word `search` | `[]` silently | per-token degrade (`"read model consistency"`→10) |
| `list --help` `--package` label | `<workspace-name>` (implies rejected `@libar-dev/*`) | `<workspace-package-id>` (matches `rules --help`) |

**Skill + demo-hook drift closed (the in-focus polish):** data-api — bundle blocks `deliverables`→`scenarios` (×3 + the generated overview cheat-sheet), own-rules count `8`→`16` (softened to drift-proof), `34`→`34-of-35` arithmetic, added the third (bare-array) envelope shape + the JSON-error contract, search multi-word note. architect-base — FSM diagram redrawn so `deferred` hangs off `roadmap` (was implying an illegal `active→deferred`), `product-area:editor` example marked illustrative. architect-sessions — `--mode` on bundle / `--session` on context, corrected the design-mode bundle block set. Demo hook — added a `files` step (name-then-locate, the #1 grep), step-5 bundle now shows the content payload + `~3279 tokens, ONE call`, step-7 renders a readable rule list (was 5KB raw JSON), step-10 shows a legal **and** illegal FSM transition.

**Verdict:** the prior chunks made the API a grep replacement for state/dep/ADR/taxonomy/navigability; this session removed the last correctness false-empty (ADR-005), closed the JSON-consumer trust gap, and resynced the three skills + the demo hook to the live CLI so a cold-start agent is taught the API as it actually behaves. The remaining deferred items (#2/#4/#7) are cosmetic or doctrine-modeling, not effectiveness blockers.

---

## Re-measure (review + completion of the 2026-05-30 session, 2026-06-01)

Picked up the prior session's 7 local commits and ran an 8-dimension adversarial review workflow (18 agents: ADR-005 completeness · 6-commit correctness · 3 skill audits · demo-hook teaching-quality · deferred-item re-examination · blind false-empty sweep — each finding skeptic-verified against the live CLI). Independently re-verified every gate green first (typecheck · validate:all · docs-determinism zero-diff · package tests · dogfood 1175 · demo hook all-steps). The prior session's behavioral commits all verified CORRECT; the review surfaced **two new correctness bugs** (one in source data, one in the prior session's own fail-loud commit) + drift/coverage items.

**New finds + fixes (2026-06-01):**

| Gap | Before | After |
| --- | --- | --- |
| `PDR001SessionWorkflowCommands` mis-tagged `@architect-adr:004` (a latent sibling of the ADR-005 collision class — name/filename/title all say 001) | `rules --decision 001`/`1` silently resolved to ADR-001, dropping the real PDR-001 collision; `--decision 004` resolved to a pattern named PDR-001 | tag corrected to `001`; `--decision 001`/`1` now fail-loud (ambiguous, consistent with `005`); `--decision 004` fails loud (no such decision). docs-live **zero drift** (PDR-001 excluded by `roadmap` status). No `@architect-enforces-decision:004`/`:001` refs anywhere, so no edge broke. |
| `rules --product-area Platform` (the projection's `DEFAULT_PRODUCT_AREA` bucket for rules whose pattern declares no area — 8 rules incl. ADR-009/ADR-010 invariants) | fail-loud `invalid value "Platform"` — the prior session's fail-loud commit (`fb7ca9d`) derived the accepted set from pattern-keyed `graph.byProductArea`, which never contains the rule-only default bucket | accepted set now derived from the rule projection's distinct areas via new `collectBusinessRuleProductAreas(context)` (accepted-set == filter-target by construction); `Platform` resolves to its 8 rules; bogus areas still fail loud with `Platform` now in the enum |
| Demo hook step 11 narration ("PatternGraph — **the read model itself**") | contradicted ADR-006 + the pattern's own `@architect-role:contract` (conflated the Zod contract/schema with the read-model API kernel shown in step 5) | "PatternGraph — **the read-model contract/schema**, not the kernel in step 5" |

Regression coverage added (both executable, both green): `Rules resolves the sibling decision of a numeric-id collision by identity` (the PDR-555 half the 6a6ab70 ADR-555 spec omitted — the self-match fix is symmetric, so the PDR direction was untested) and `Rules accepts the default product area for rules whose pattern declares none` (new self-contained no-area fixture → `--product-area Platform`).

**Preserved for future sessions (re-confirmed KEEP-DEFERRED or low-value, NOT lost):**

- **Bare-tag decision self-match fallback** (`business-rules.internal.ts` ~line 264-269, the `pattern.adr`-tag branch the 2dffcfe fix preserved) — **no test exercises it**: every real decision pattern's `ADR<NNN>`/`PDR<NNN>` name resolves via the identity branch, so the fallback only fires for an unresolvable bare value reaching the projection directly (bypassing the CLI fail-loud resolver — e.g. a future MCP/library caller). **Left in place** (defensive, 6 lines, clearly commented). A future session deciding delete-vs-cover should first prove reachability via the non-CLI paths, NOT delete blindly on "no coverage".
- **#4 enforcedBy-on-pattern-record legibility** — `pattern <ADR>` omits the computed `enforcedBy` that `arch neighborhood <ADR>` exposes. Design-tier (strictObject contract change + perf fixture + codecs), not a one-liner; returns `[]` for every current ADR. See the corrected #4 entry above.
- **#5 pattern-own-rules-empty renderer hint** — the data-api skill note (use `rules --pattern <Name>`) is complete + accurate; the inline renderer hint stays deferred (needs a dedicated `PatternDetail` compact renderer, which is determinism-gated docs-live work, not a special-case of the shared renderer).
- **architect-base SKILL.md:121 ADR-005 label** "Codec / Renderer Separation" vs the live canonical title "Codec Based Markdown Rendering" — pre-existing house-style shorthand shared with CLAUDE.md, untouched by these campaigns; the skill already routes readers to the live Data API for titles. Optional alignment only.
- **`GenerateDocsCli`→`MarkdownRenderer` uses-edge** (ANNOTATE/plan-2b HIGH entry below) — **already live** in the graph (`MarkdownRenderer.usedBy=['GenerateDocsCli']`); that ledger entry is stale historical worklog, marked CLOSED there. The open item is the doctrine-wording carve-out captured in `FEEDBACK.md` (a Gherkin-owned pattern authors its `@architect-uses` on the feature header, not on production TS).

**Verdict:** the prior session's work holds up — every behavioral commit is correct and every gate reproduced green. This pass closed the latent collision-class sibling the prior regression couldn't catch (PDR-001 data mis-tag), eliminated the accepted-set-vs-filter-target divergence the prior fail-loud commit introduced (product-area Platform), corrected the demo-hook ADR-006 teaching slip, and back-filled the missing regression symmetry — then preserved every confirmed-deferred item above so none is lost to the next session.

---

## Re-measure (open-item triage + 5 effectiveness fixes, 2026-06-01)

A 10-agent blind triage workflow re-verified every still-open FEEDBACK/ledger item against the live CLI, classified ADD/REMOVE/ANNOTATE/GUIDE/FIX/DX × leverage × cost × completable-now, then this session landed the completable set. **8 of 22 triaged items were already-closed ghosts** (verified fixed; recording stops chasing them): A2 taxonomy `values` enum, A9 `files --related` spec paths, B11/B12 (premise stale — empty-by-design ≠ dead; the phase/quarter query methods are live CLI verbs), C13 TAXONOMY.md backticks (`06bfd91`), D17 perf noise floor (`054b7f8`), D18 query-from-source (`74f6730`), E-impl-backfill `@architect-implements` on 4 features (`f66bf5c`).

**Landed (gate-validated: typecheck · projection 1820 · dogfood 1211 · validate:all · docs-determinism via `docs:check` · perf all-margin):**

| Item | Cat | Before | After |
| --- | --- | --- | --- |
| **A1** `open-questions --include-self` + epic-heading regex | ADD+FIX | `--parent <Epic>` dropped the epic's own questions; the literal `**Open Questions:**` regex silently dropped any qualified heading from **both** entry points | `--include-self` emits the focal epic's gating questions; regex tolerates `**Open Questions[^*\n]*:**`. DocumentationProjection's gating questions now reachable. |
| **A10** `descriptionTruncated` / `docstringTruncated` | FIX | description head dropped later design prose with **no marker** (silent loss); not a numeric cap — a semantic first-sentence cut | additive boolean (dep-tree `truncated` precedent); string byte-identical (docs-live stable); discriminates (false for single-sentence / Problem-Solution-only) |
| **A5** `arch workable` verb | ADD | roadmap-minus-blocking computed but exposed only as a capped 8-sample; overview mis-pointed at `list --status roadmap` (all 19, not the 16 startable) | full startable set as compact summaries (verified == overview `startableCount`, disjoint from `arch blocking`); 3 overview hints repointed |
| **A3** taxonomy digest completeness | ADD+REMOVE | recognized `@architect-executable-specs` absent from the digest; retired `usecase` orphan parser code lingered | registry entry added (digest total 32→33, TAXONOMY.md regen'd); `usecase` orphan deleted (No-BC) |
| **D16** `architect-generate --check` / `docs:check` | DX | determinism gate `docs:all && git diff --exit-code` useless on a dirty tree | re-renders to memory, diffs the working tree, writes nothing, non-zero on drift — proves idempotency mid-changeset; wired `pnpm docs:check` |

**Deferred-with-finding — C15 (degenerate-generator guard wiring):** wiring the shipped guard into the docs runner WORKS but deterministically caught **3 generators that ship empty today** — `roadmap` + `current-work` (`0 quarters`), `requirements-specs` (`0 requirements`) — all orphaned from removed dimensions, all in `docs:all --all`, all committed in `docs-live/`. Wiring would hard-fail `docs:all`/the determinism gate until those 3 are **retired or re-scoped onto a live dimension (status/level)** — an open **gating question in the `DocumentationProjection` epic** (surfaced this session via `--include-self`). Per "decisions recorded born-accepted after code proves them," the wiring was reverted (guard module + unit tests stay); the named-3 finding is the deliverable that advances the question.

**Open / deferred for a focused follow-up (triage-confirmed, with exact sites):**

- **C14** (FIX, MED) — `documentation architecture` default (non-JSON) format emits raw JSON-per-line; add compact-text normalizers for `ArchitectureDiagram` + `architecture:package-seam` kinds in `render-compact-text.ts` `COMPACT_NORMALIZERS` (+ a one-line "cross-package patterns" label reconciling the BC-vs-package-seam count difference). No docs-live ripple. *Deferred:* compact-text human-readability; the agent path (`--format json`) already works.
- **E5** (GUIDE, MED) — `pattern <Name>` compact text dumps raw JSON for Relationships/Rules and shows an empty own-Rules block with no `rules --pattern` pointer. Needs a dedicated `PatternDetail` compact normalizer in `COMPACT_NORMALIZERS` (PatternDetail falls through to `renderMinimalStructured`). *Deferred with C14* (same renderer + golden tests; JSON path is clean).
- **A4** (ADD, LARGE) — `value-transfer <P>` / forward-link resolution verb. Don't hand-roll: promote the existing `ValueTransferState` candidate spec (`architect/specs/value-transfer-state.feature`) through the lifecycle. A thin slice (project the already-parsed `executableSpecs` link onto `pattern`/`files --related` JSON) is MED and landable but touches the pattern/files codec + docs-live.
- **A7** (ADD, MED) — `taxonomy --enforcement` view (enum value → enforcing rule → decider pattern+file). The join data exists (`enforces-decision` edges + rules-by-feature) but the taxonomy projection context lacks rule/decision data; needs that plumbed in. Land after A3.
- **A6** (REMOVE-enabler, LARGE, LOW) — `pipeline` / `arch reachability` verb. Producer→kind link is implicit (inline in each `project*` body); needs a producer registry that doesn't exist. Minimal landable slice: a vitest assertion iterating `FragmentSchema.options` asserting each kind is wired into ≥1 dispatch table or is intentionally fallback-only (kills the grep false-positive failure mode).
- **A8** (ANNOTATE, LOW) — empty-by-design `getQuarters`/`getAllPhases`/`getActivePhases` carry no `emptyReason`. Prefer a help-text breadcrumb (in `planning.ts`) over widening the shared envelope metadata strictObject for 3 low-traffic methods.
- **E4** (ANNOTATE, LARGE) — `pattern <ADR>` omits the computed `enforcedBy` that `arch neighborhood <ADR>` exposes. Re-confirmed design-tier: `strictObject` `PatternRelationshipsSchema` change + perf fixture + codecs + docs-live regen. Reach paths (`rules --decision`, `arch neighborhood`) already answer it.
- **E7** (DX, LOW) — `rules` scope flags mutually exclusive. Error already names all 5 flags; AND-composition is a `BusinessRuleSetOptions` contract redesign + perf re-baseline. Stays deferred.
- **uses-edge doctrine carve-out** — `@architect-uses` for a Gherkin-owned pattern can only be authored on the feature header (the `combineSources` merge keys on `patternName`, not `@architect-implements`). Doctrine-wording decision, not code — captured in FEEDBACK.md.

**Verdict:** grep remains the exception. This session made the API answer two questions it previously couldn't — "what's the full set I can start?" (`arch workable`) and "are an epic's own gating questions reachable?" (`open-questions --include-self`) — converted a silent payload-truncation into a signaled boundary (`descriptionTruncated`), completed the recognized-tag view while deleting a dead orphan (A3), and gave the determinism property a git-independent gate (`docs:check`). The C15 finding turned an unwired-guard TODO into a precise, decision-ready fact (the 3 named degenerate generators). The deferred set is now navigability/payload-shape polish + the design-tier `ValueTransferState`/`enforcedBy` builds, all with exact landing sites.
