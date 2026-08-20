# Cluster review: composition-basis-adr011 (READ-ONLY)

Verdict: the epic's central composition-basis argument HOLDS in full. No
heterogeneous second caller for `buildFacetBundle` exists; ADR-011 is correctly
deferred / not ratify-ready.

## Per-claim evidence

1. architecture children HOMOGENEOUS — HOLDS.
   `architecture-diagram.ts:82` = `const children: Record<string, ArchitectureDiagram> = {}`.
   Lenses (package-seam/layered/by-theme) vary only `scope`; all values are the
   single `ArchitectureDiagram` kind. internal.ts confirms one fragment shape.

2. grouped-routed carves architecture out — HOLDS.
   `grouped-routed-bundle.internal.ts:16-17`: "`architecture` is a fixed-lens
   projection and never grouped." Docstring also documents the requirements-\*
   bespoke two-level carve-out and ADR-010's "no generality before a 2nd caller".

3. design-review per-member diagrams HOMOGENEOUS — HOLDS.
   `design-review.ts:160` = `Record<string, ArchitectureDiagram>`; by-layer/
   by-theme/by-package lenses, all one fragment kind.

4. validation/ + taxonomy/ sub-docs UNBUILT — HOLDS.
   `taxonomy-digest.ts:73` and `validation-rule-digest.ts:42` both return
   `projectSingle(...)` — flat, no children, no facet split.

5. shipped helpers are exactly projectSingle + buildGroupedRoutedBundle;
   buildFacetBundle absent from source — HOLDS.
   `projectSingle` def in `fragments/base.ts:53`; `buildGroupedRoutedBundle` def
   in `_shared/grouped-routed-bundle.internal.ts:56`. grep over packages/ +
   architect/ shows `buildFacetBundle` only in spec PROSE (epic feature +
   taxonomy-documentation-cluster.feature:20), never in any .ts. No ADR-011
   record file; API: "Pattern not found: ADR011".

6. nestable-children lone caller = requirements-_ — HOLDS.
   `operational-insights/index.ts:1187-1203`: one `Record<string,
RequirementDigest>` carrying BOTH package-index children
   (`createRequirementPackageIndexRouteId`) and per-entity detail children
   (`createRequirementPackageDetailRouteId`) — the two-level shape. Still
   homogeneous in fragment kind; only requirements-_ uses it.

## Adversarial hunt — NO heterogeneous second caller found

Enumerated every `children: Record<...>` and every `children[...]=` /
`buildGroupChild` in the projection package:

- architecture-diagram.ts:82 -> Record<string, ArchitectureDiagram>
- design-review.ts:160 -> Record<string, ArchitectureDiagram>
- operational-insights:1187 -> Record<string, RequirementDigest>
- delivery-reporting:442 -> Record<string, TFragment> (single type param)
- grouped-routed:82 via buildGroupChild:(group)=>Fragment — one builder, one
  kind per caller (api-reference -> ApiReferenceDigest; business-rules ->
  scoped business-rule set).

Every bundle's children are a SINGLE fragment kind. No bundle mixes kinds, so
no qualifying heterogeneous `buildFacetBundle` caller exists. The spec is
correct to defer ADR-011.

Note: `businessRuleGroupFacets` in business-rules.internal.ts is a grouping
label/sortKey helper, NOT a bundle helper — unrelated to `buildFacetBundle`.

## apiCoverage: required-file-read

The API confirmed ADR-010's shipped basis and ADR-011's non-existence, but the
load-bearing claims (child-record homogeneity, line 82, grouped-routed
docstring, requirements two-level shape) are file:line facts the Data API does
not surface. Source reads were required.
