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
