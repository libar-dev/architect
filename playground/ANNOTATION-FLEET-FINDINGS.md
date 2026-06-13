# Annotation Fleet — Curated-Coverage Experiment Findings

Working-state notes on the fleet run that raised curated PatternGraph coverage of
architecturally-significant modules + edges in `architect-core` and
`architect-projection`. Goal: an AI agent should reach for `architect:query` / the
playground handle instead of grep, and design against architectural slices
(impact, neighborhoods, dependency subgraphs).

## What was added (by theme)

36 `@architect-pattern` lines written across 14 batches, plus ~30 explicit edges
(`@architect-uses` + `@architect-implements`). **Verified against the fresh
`--core` snapshot:** 32 of the 36 materialized as graph nodes (293 → **325**,
`+32`); the remaining **4 are currently dead** — all `.feature` spec annotations
in the failure cluster below (2 blocked by a roadmap-target edge policy, 2 by a
package-glob + space-syntax gap). 28 production `.ts` nodes (space-form
`@architect-pattern`/`@architect-status`, colon-form `@architect-role:`/
`@architect-bounded-context:`, csv `@architect-uses` — all matching the repo's own
convention) + 4 colon-form `.feature` renderer specs materialized cleanly.

> _Baseline correction:_ an earlier draft of this doc cited before-figures
> (core 46% / 289 patterns) that did not match the measured baseline. The
> verified baseline is **core 36% (34/94), projection 64% (88/138), 293 patterns,
> 0 dangling** — so the real gains are larger than first framed.

- **Core taxonomy / domain roots** — `StatusNormalization`, `DomainEnumSchemas`
  (20-importer Zod enum hub), `BrandedIdentifiers` (~38 `as*` call-sites),
  `StatusValueDomain`. Root primitives: fan-in is the weight, no outbound edges by
  design.
- **Core config + contracts** — `ArchitectConfigContract`, `PackageMatcherContract`,
  `ConfigDefaults`, `ContextInference`, `LintViolationContract` (cross-package
  contract shaped by the whole architect-guard lint subsystem),
  `DocDirectiveContract`, `GherkinScanResultContract`.
- **Core read/pipeline seams** — `ReadApiResultContract` (ADR-006 structured-answer
  envelope over PatternGraph), `PipelineDatasetContract` (extraction→assembly
  boundary), `TrustBoundaryParser` (ADR-009 parse-once primitive).
- **Projection spine** — `ProjectionContext` (the envelope every projection
  receives), `ProjectionBundle` (sink-agnostic output contract), `ProjectionError`,
  `ProjectionTrustBoundary` (ADR-009 realization for projections), `ProjectionFilter`.
- **Routing / disclosure / rendering** — `LogicalRouteId`, `DisclosureSpec`,
  `ProgressiveDisclosureLevel`, `DocumentationTypeIdentity`, `RendererOptions`,
  `MarkdownRouteProfile`, `ProjectionFilterResolver` (filter-precedence decider).
- **Shared support services** — `ArchitectureGraphSupport` (Mermaid context-map
  shared by two projections), `GroupedRoutedBundleSupport`.
- **Executable specs (reverse realization)** — renderer codec family
  (`JsonRenderer`, `MarkdownRenderer`, `UiRenderer`, `FragmentRendererDispatch`
  realizations) landed cleanly; a second spec batch
  (`RoadmapMarkdownExecutableTests`, `FragmentSchemaMirrorExecutableTests`,
  `BusinessRuleSetPackageScopeExecutableTests`, `RequirementExecutableDigestExecutableTests`)
  is the failure cluster (see below).

## Coverage + edge deltas

| Metric                             | Before (verified) | After (verified)         |
| ---------------------------------- | ----------------- | ------------------------ |
| architect-core node coverage       | 36% (34/94)       | 51% (48/94)              |
| architect-projection node coverage | 64% (88/138)      | 74% (102/138)            |
| Patterns materialized (fleet)      | —                 | 32 (+4 dead annotations) |
| Edges added                        | —                 | ~30                      |
| Total graph patterns               | 293               | 325                      |
| Dangling references                | 0                 | 0                        |

Edge density after (of 325): `uses` 134 (41%), `usedBy` 120 (37%),
`implementedBy` 86 (26%), fully edge-dark 111 (34%).

**Fan-in shrinkage.** Baseline fan-in snapshot was empty (`{}`), so no
node-for-node before/after diff is possible. After the run the top fan-in hubs
(`utils/errors.ts` 10 importers, several CLI/\_shared 6-8 importer modules) are
_not yet annotated_ — they are the next obvious high-signal targets. No measured
shrinkage; the fleet added new high-fan-in nodes (`DomainEnumSchemas` ~20,
`BrandedIdentifiers` ~38, `ConfigDefaults` `DEFAULT_TAG_PREFIX` 26) rather than
relieving existing hubs.

## Quality-sample result

39 verdicts sampled. Pass = significant && conventionOk && edgeOk.

- **Pass rate: 36/39 (92%).**
- All 36 passes are genuine seams with correct tag syntax, reused
  bounded-contexts, roles from the 8-set, and edges that resolve in the graph.
  Spot-confirmed live: `ProjectionContext` (uses PatternGraph, PackageResolver;
  enables ProjectionTrustBoundary), `DomainEnumSchemas` (in graph, role contract),
  `MarkdownRenderer.implementedBy` now includes `MarkdownRendererExecutableTests`.
- **3 failures — all the same failure mode** (dead/invisible spec annotations):
  - `RoadmapMarkdownExecutableTests` — not in graph; `@architect-implements:RoadmapTimelineProjection` did NOT land (target `implementedBy` empty). Likely because the target production pattern is `status:roadmap`.
  - `RequirementExecutableDigestExecutableTests` — same: not in graph, implements edge did not land.
  - `BusinessRuleSetPackageScopeExecutableTests` — invisible to the API: (1) used SPACE syntax `@architect-pattern BusinessRuleSetPackageScopeExecutableTests` instead of the colon form working `.feature` files use, and (2) the dogfood feature glob scans repo-root `tests/features/` only, NOT `packages/*/tests/features/`, so the node never enters the graph. `FragmentSchemaMirrorExecutableTests` is equally invisible as an independent node (only its realization edge surfaces).

## Dangling / validate regressions

- **Dangling: 0** (confirmed live: `danglingReferenceCount 0`, `unknownStatusCount 0`,
  `warningCount 0`, `patternCount 325`). newDangling vs baseline 0 = **0**.
- **validateNewErrors: none.** Only pre-existing deprecated-tag `projection`
  WARNINGs on unrelated renderer `.feature` files; not from this fleet.
- Snapshot OK. No reformat of unrelated code; all edits additive JSDoc / Gherkin tags.

## Recommendation: KEEP, with a targeted partial revert of 2 spec annotations

Keep all 32 materialized nodes + all edges. They are real seams, syntactically
clean, dangling-free, and immediately improve agent navigability — `dep-tree`,
`arch neighborhood`, and reverse `implementedBy` slices now resolve where they
were dark.

**Partial-revert (or fix-forward) the 2 truly-dead source annotations:**
`RoadmapMarkdownExecutableTests` and `RequirementExecutableDigestExecutableTests`.
Their tag syntax is correct but they contribute zero queryable node and zero
edge — pure noise in the curated layer — because the targets are `status:roadmap`
and the realization edge will not project until the target is active. Either
delete these two `@architect-*` blocks now (cleanest under live-state doctrine —
re-add when the target goes active) or leave them only if the roadmap-target edge
projection is fixed in the same pass.

The 2 `business-rule-set` / `fragment-schemas` cases are NOT a revert decision —
they are blocked by a **glob/syntax tooling gap**, not bad annotations. Fix the
tooling (below) rather than reverting; the annotations become correct the moment
the glob and the colon-syntax land.

Reasoning: 92% of a deliberately sparse, high-signal set landing clean is a strong
result. The 3 misses are concentrated, diagnosable, and mostly tooling-shaped —
none undermine the materialized core. Reverting the whole fleet would discard 33
good nodes to avoid 2 dead ones.

## Follow-ups

1. **Fix the dogfood feature glob** to include `packages/*/tests/features/` so
   package-local executable specs (`BusinessRuleSet*`, `FragmentSchemaMirror*`)
   enter the graph as nodes, not just edges.
2. **Standardize spec-tag syntax**: `@architect-pattern:` / `@architect-implements:`
   on `.feature` files use COLON; one batch wrote SPACE. Add a lint/validate check
   that flags space-form pattern/implements tags on Gherkin.
3. **Decide the `status:roadmap` realization-edge policy**: should
   `@architect-implements` against a roadmap-status target project the reverse edge
   (and a candidate node) or be silently dropped? Today it is dropped, which
   produced 2 dead annotations.
4. **Annotate the next fan-in tier**: top after-run hubs are still dark —
   `utils/errors.ts` (10), the CLI `_shared/schemas.ts` / `output.ts` / `runtime.ts`
   cluster, `taxonomy/format-types.ts`. High signal-per-node.
5. **Reduce the 34% edge-dark fraction** by adding `@architect-uses` on the
   already-annotated contracts that currently have empty `uses[]` only because the
   edge was a deliberate root call — re-audit which of those are genuinely
   root vs. just unannotated.

## Playground / query commands that now return richer results

1. `pnpm architect:query dep-tree ProjectionTrustBoundary`
   → `ProjectionTrustBoundary depends on 1 (4 transitive); 0 depend on ProjectionTrustBoundary (0 transitive)` — full upstream chain `ProjectionContext → PatternGraph → ExtractedPattern` + `PackageResolver`, dark before the fleet.

2. `pnpm architect:query arch neighborhood ProjectionContext`
   → returns `"uses":["PatternGraph","PackageResolver"]`, `"usedBy":["ProjectionTrustBoundary"]` plus the full `sameContext` projection cohort.

3. `pnpm architect:query pattern MarkdownRenderer`
   → `"implementedBy":[{...,"name":"MarkdownRendererExecutableTests"}]` — the reverse realization edge from executable Gherkin now resolves (was empty `implementedBy` before).

## Open decision: status:roadmap realization-edge policy

**Question.** Should an `@architect-implements:<Target>` authored on an executable
`.feature` against a target whose `@architect-status` is non-active (`roadmap` /
`planned` / `candidate` / `deferred`) project the reverse realization edge — i.e.
surface a candidate node and an `implementedBy` edge — or be dropped, as it is
today? Today the edge is silently dropped, so the executable-spec annotation
becomes a dead node/edge in the read model with no projected consequence.

**Action taken pending the decision.** Two executable-spec annotation blocks were
**removed** (reverting the additive fleet edit), per the live-state / no-dead-context
doctrine — re-add when the implements target is the kind of node whose reverse edge
projects:

- `RoadmapMarkdownExecutableTests` → `RoadmapTimelineProjection`
  (`packages/architect-projection/tests/features/renderers/roadmap-markdown.feature`)
- `RequirementExecutableDigestExecutableTests` → `RequirementExecutableDigestProjection`
  (`packages/architect-projection/tests/features/parity/parity-bundle-shape.feature`)

**Discrepancy noted for the decider.** The cleanup brief framed both targets as
`status:roadmap`, but the source of truth currently annotates both as
`@architect-status completed` (see `projections/delivery-reporting/index.ts` and
`projections/operational-insights/index.ts`). In the `playground/data/pattern-graph-core.json`
snapshot both targets show `implementedBy: null` — **but so do all other fleet
implements targets in that snapshot** (`MarkdownRenderer`, `JsonRenderer`,
`BusinessRuleSet`, etc.), because `-core` does not carry the projection-package
reverse edges. So the snapshot alone does not prove these two edges are _uniquely_
dead; the removal is nonetheless safe and reversible. The underlying question —
when a realization edge should project — is **read-model semantics, an ADR-level
decision, and is deferred to a human.** Do not change edge-projection behavior in
the read model as part of this cleanup.

## Follow-up run: fixes + round 2

A combined pass landed the four queued fixes from the first run and a second
annotation batch (round 2). Working-state notes below.

### Fixes landed (all 4)

1. **glob** — added repo-root-relative `packages/*/tests/features/**/*.feature`
   to `PACKAGE_SELF_HOSTING_SOURCES.features`
   (`packages/architect-core/src/config/self-hosting.ts`). Brings package-local
   executable specs (81 `.feature` files across all five packages) into the
   dogfood scan via the canonical relative shape. Additive; the pre-existing
   absolute `${workspaceRoot}/...` entries were left in place. **Build note:**
   `architect.config.ts` imports the _built_ `@libar-dev/architect-core`, so a
   `pnpm build` is required before the src change takes effect in the scan.
2. **spec-syntax** — converted two package-local `.feature` files from the
   fleet's space-form Gherkin tags to colon-form so they parse:
   `business-rule-set-package-scope.feature` and `fragment-schemas.feature`
   (`@architect-pattern:` / `@architect-status:`).
3. **cleanup-roadmap** — reverted the two roadmap-target executable-spec blocks
   (`RoadmapMarkdownExecutableTests`, `RequirementExecutableDigestExecutableTests`)
   back to their HEAD blobs and recorded the deferred realization-edge policy
   question above. Both names are gone from the entire `.feature` corpus.
4. **add-lint** — added an additive `gherkin-tag-space-form` anti-pattern
   detector in `packages/architect-guard/src/validation/` that flags space-form
   `@architect-pattern`/`@architect-implements` on `.feature` files (the silent
   name-drop failure mode that produced the dead specs). Error-level, with a
   minimal unit test; `pnpm typecheck` is green.

### Round-2 deltas

21 `@architect-pattern` lines written across 6 batches on production `.ts`
(B1 pipeline read-side, B2 configuration, B3 taxonomy domain, B4
validation-schemas + error boundary, B5 projection agent-bundle, B6
composition/governance/rendering), with ~80 `@architect-uses` edges total.
All 21 are confirmed present in source (`grep` over the six batch directories);
**every one of the 21 significance verdicts is `significant: true` /
`conventionOk: true` / `edgeOk: true` — a 21/21 pass.** Two verdicts flag
borderline-but-legitimate leaves to revisit first if curation tightens:
`DeterministicFormatUtils` (renderer-shared formatting leaf, no edges) and
`SlugCanonicalization` (route/anchor identity helper, 22 call sites).

**Two round-2 recipe bugs found & fixed at integration (the gate's "awaits
rebuild" was wrong).** At gate time the 21 round-2 `.ts` annotations did **not**
materialize (snapshot stuck at 327) — not a rebuild-timing issue, but two recipe
defects the workflow-2 doctrine introduced (workflow 1 had a recipe-probe that
discovered the correct form empirically; workflow 2 did not):

1. **Missing the bare `@architect` marker tag.** The extractor only recognizes a
   JSDoc block as a pattern when it leads with `@architect` (then `@architect-pattern …`).
   Round-2 blocks omitted it. Fix: insert ` * @architect` as the first tag in each
   block (and put the tags ahead of any description prose — a block with the marker
   _after_ a description paragraph still failed, e.g. `DeterministicFormatUtils`).
2. **Space-separated `@architect-uses` breaks the whole pattern parse.** Round-2
   wrote `@architect-uses A B C` (space). In this repo only the **comma** form
   (`@architect-uses A, B, C`) parses; the space form silently drops the _entire_
   node, not just the edges. (The doctrine/skill text says "space/comma" — that is
   wrong here; logged to `FEEDBACK.md`.) Fix: convert all multi-value uses to commas.

After both fixes (applied mechanically across the round-2 files) + a single
re-snapshot, **all 21 round-2 nodes materialized. Verified final state: 348
patterns, core 61/94 (65%), projection 110/138 (80%), 0 dangling, typecheck
exit 0.** (Campaign arc, verified: 293 → 325 after round 1 → 348 after round 2 +
fixes; core 36% → 51% → 65%; projection 64% → 74% → 80%.)

### Dead-spec resolution

All four originally-dead `.feature` specs are resolved: **2 promoted to live
nodes, 2 removed.** `BusinessRuleSetPackageScopeExecutableTests` and
`FragmentSchemaMirrorExecutableTests` now resolve as live nodes carrying their
realization edges — `architect:query pattern BusinessRuleSetPackageScopeExecutableTests`
returns `"implementsPatterns":["BusinessRuleSet"]`, and the `Fragment...`
twin returns `"implementsPatterns":["ProjectionFragmentSchema"]`.
`RoadmapMarkdownExecutableTests` and `RequirementExecutableDigestExecutableTests`
are removed and absent from the entire `.feature` corpus, pending the
realization-edge policy decision recorded above.

### Regression check

No regression (verified post-fix). `arch dangling` returns 0 over
`patternCount: 348` (vs 0 before) — **no new dangling edges.** `pnpm typecheck`
exits 0 across the workspace (the new guard rule and all round-2 annotations
compile clean). No unknown-status or warning counts.

### Recommendation: KEEP

Keep all fixes and the full round-2 batch. The fixes are corrective (a real
scan-coverage gap, a parse-failure class, a new guard rail against the same
slip) and the round-2 batch is 21/21 significant with zero dangling and a clean
typecheck. No partial revert is warranted. The two already-reverted roadmap
specs stay out pending the human decision; do not re-add them as part of this.

### Remaining follow-ups

- **DONE — round-2 nodes materialized** after the two recipe-bug fixes above
  (`@architect` marker + comma-form `@architect-uses`); verified 348 patterns,
  core 65%, projection 80%, 0 dangling, typecheck clean.
- **Resolve the realization-edge policy** (ADR-level, deferred to a human):
  whether `@architect-implements` against a non-`active`/non-projecting target
  should project a reverse edge / candidate node or be dropped — gates whether
  the two removed roadmap specs can return.
- **Reconcile the status discrepancy**: the cleanup brief framed the two roadmap
  targets as `status:roadmap`, but source annotates both `completed`. Confirm
  the intended status before re-adding either spec.
- **Curation watch**: if the curated layer tightens, reconsider
  `DeterministicFormatUtils` then `SlugCanonicalization` first (the two
  borderline leaves).
