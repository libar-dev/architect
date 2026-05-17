# Phase 4c: Duplication & Simplification Audit (raw)

Scope: `packages/architect-projection/src/` — 43 projections, ~58 fragment schemas, 9 block types, 10 fragment-specific markdown normalizers. Audit performed against the doc-generation campaign in `.pr-coordination/DEEP-DIVE.md` and `INVENTORY.md`.

Convention used below:
- **TRUE-DUP** = same content reachable by two code paths; consolidation is safe + correct
- **DISCLOSURE-PAIR** = two depths of the same content; should NOT be merged — campaign names them as a single ContentFragment with input-disclosure axes
- **FORCED-FUSION** = current API conflates two distinct contents; should be split before campaign
- **COMPOSABLE-SUBUNITS** = one projection emits multiple content units that should become independent ContentFragments
- **NOT-APPLICABLE** = duplication exists but is mechanical scaffolding, no disclosure-axis interpretation

---

## Lens 1 findings (redundancy as-is)

| # | Finding | Files | Description |
|---|---|---|---|
| F1 | `PatternDetail` re-declares every field of `PatternSummary` rather than extending it | `fragments/pattern-relations/pattern-summary.ts:17-26`, `pattern-detail.ts:25-42`, `projections/pattern-relations/pattern-detail.ts:64-78` | Schema copy-paste: 6 fields (patternName/status/maturity/role/phase/file/source) appear identically in both. The projection then `...spreads summary` into the detail at runtime, proving the relationship is "summary ⊂ detail." Schema does not express the subset. |
| F2 | Two parallel `DeliverableSchema` and `DeliverableManifestSchema` shapes (one with `kind` discriminator, one without) | `fragments/execution-context/deliverable.ts:14-22`, `fragments/execution-context/deliverable-manifest.ts:16-20`, `fragments/pattern-relations/supporting.ts:49-61` | The `pattern-relations/supporting.ts` variants have NO `kind` literal and are used by `PatternDetail.deliverables`, `PatternDetail.deliverableManifest`, and `delivery-reporting/supporting.ts` (ReleaseEntry). The `execution-context/` variants HAVE `kind` literals and are exported as discriminated-union members in `Fragment`. Two structurally near-identical types coexist in the same package. |
| F3 | `BusinessRuleSetSchema` is a 5-branch discriminated union whose branches differ only in 2 fields | `fragments/governance/business-rule-set.ts:26-66` | All 5 branches have identical (`kind`, `rules`, `groupedBy`, `groupingEntries`). They differ only in (`scope`, `scopeValue` type — string for product-area/feature/package, number for phase, absent for all). |
| F4 | `slug` helper logic exists in three places with two distinct bodies | `_internal/slug.ts:11-18`, `renderers/render-markdown.ts:2135-2142` (`toKebabCase`), `projections/delivery-reporting/index.ts:531-539` (`createSlug`) | `_internal/slug.ts:slugForFilename` and `render-markdown.ts:toKebabCase` are **byte-identical** function bodies. `delivery-reporting/createSlug` is a degraded variant (no CamelCase split, has `'item'` fallback). |
| F5 | `projectRoadmapTimeline` / `projectCompletedMilestones` / `projectCurrentWork` are 1-line wrappers around `buildTimelineBundle(context, view)` | `projections/delivery-reporting/index.ts:658-672` | Three exports, three patterns, three `@architect-pattern` annotations, but the implementation is a single function differing only by the `view` argument. The view discriminator is already encoded in the `RoadmapTimeline.view` field. |
| F6 | `projectRequirementExecutableDigest` / `projectRequirementSpecsDigest` differ only in a bucket-filter argument | `projections/operational-insights/index.ts:887-927`, plus internal `projectBucketedRequirementDigest` | Both call `projectBucketedRequirementDigest(context, bucket)` where bucket is `'executable'` or `'specs'`. Output type is identical (`ProjectionBundle<RequirementDigest>`). Distinct patterns/specs nevertheless. |
| F7 | Renderer's `normalizeDecisionCatalog` and `normalizeDecisionRecord` share no helpers despite both emitting decision-record tables | `renderers/render-markdown.ts:657-732` | Catalog renders a summary table + index table; record renders a per-record sections list. They use the SAME `DecisionRecordSchema` data shape but no shared row-builder helper. Phase 1 H5 already flagged the total normalizer size but did not call out this pair specifically. |
| F8 | `BlockSchema` exports 9 block types; `mermaid`, `collapsible`, and `link-out` are used in only 0–1 emit sites | `blocks/schema.ts`, search across `src/**` | `mermaid` is emitted only by `projectArchitectureDiagram` (one fragment, one site). `collapsible` is never emitted by any projection (only consumed by `parseMarkdownToBlocks`, which flattens it back). `link-out` is emitted only by renderer-internal navigation footers, never by projections. |
| F9 | `BoundedContextSummary` (in ArchitectureComparison) and `BoundedContextEntry` (in BoundedContext) overlap on 3 fields | `fragments/pattern-relations/architecture-comparison.ts:14-19`, `architecture-context.ts:13-19` | Both carry (name, patternCount, patterns). `BoundedContextSummary` adds `allDependencies`; `BoundedContextEntry` adds (layers, roles). Same conceptual entity, two snapshot shapes. |
| F10 | Singular / collection projection pairs: `BusinessRule`+`BusinessRuleSet`, `DecisionRecord`+`DecisionCatalog`, `RoleProfile`+`RoleProfileCollection`, `Deliverable`+`DeliverableManifest`, `SourceInventoryEntry`+`SourceInventoryDigest`, `TagUsageEntry`+`TagUsageMatrix` | governance/, operational-insights/, execution-context/ | Six explicit singular-vs-collection schema pairs. The collection schemas wrap `z.array(SingularSchema)`. The collections add minimal metadata (e.g. `groupingEntries`, `patternCount`). |
| F11 | "When to Use" JSDoc block carries the exact identical boilerplate sentence on 39+ fragment files | `fragments/**/*.ts` (any fragment) | Every fragment contract ends with `- As a typed contract / data shape consumed by projection or render layers.` — verbatim. Confirmed by Phase 3 D-H1 for renderers; same pattern exists across fragment files. Doc-extraction will surface this identical text 39 times. |
| F12 | Internal `_internal/format-utils.ts` helpers are reused only by renderers; `slugForRouteSegment` is reused only by one projection module | `_internal/format-utils.ts`, `_internal/slug.ts`, `projections/documentation-composition/requirement-routes.ts` | `humanizeKey`, `isPrimitive`, `stableStringify` are imported only by the 4 renderers. `slugForRouteSegment` is imported only by `requirement-routes.ts`. `slugForAnchor` has zero imports outside the file. Mismatch between the "shared utility" framing and actual reuse. |

---

## Lens 2 reframe (progressive disclosure)

### F1 — `PatternDetail` vs `PatternSummary`
**Classification:** DISCLOSURE-PAIR
**Reasoning:** The projection literally spreads `...summary` into `detail`. `PatternSummary` is the `essential` depth, `PatternDetail` is the `advanced` depth, of the **same conceptual content** (one pattern). Both projections must stay (their callers want different ceiling costs). The schema, however, should express the relationship. A ContentFragment named e.g. `pattern-card` should emit `PatternSummary` blocks at `essential`/`important` and `PatternDetail` blocks at `useful`/`advanced`, with a single `canonicalDoc` link.

### F2 — Parallel `Deliverable` shapes
**Classification:** TRUE-DUP
**Reasoning:** Both forms describe a single deliverable's name/status/tests/location/finding/release. The `kind` literal is a serialization concern, not a content concern. The execution-context variant is the canonical (fragment-discriminated-union member); `pattern-relations/supporting.ts` should import it (or a `kind`-stripped projection of it). This is name-collision risk inside the package and a Zod-first violation.

### F3 — `BusinessRuleSetSchema` 5-branch discriminated union
**Classification:** FORCED-FUSION (mild)
**Reasoning:** Five scopes (`all`/`product-area`/`phase`/`feature`/`package`) carry the same payload; the discriminator only changes the `scopeValue` type. A single `z.strictObject({ scope, scopeValue?, rules, groupedBy?, groupingEntries? })` with `scopeValue: z.union([z.string(), z.number()]).optional()` plus a refinement (`scope === 'all'` ↔ `scopeValue` absent; `scope === 'phase'` ↔ numeric) captures it once. Disclosure does not apply — this is taxonomy, not depth.

### F4 — Three slug bodies
**Classification:** TRUE-DUP
**Reasoning:** No content meaning. Pure helper duplication. `_internal/slug.ts:slugForFilename` already exists; `render-markdown.ts:toKebabCase` should import it; `delivery-reporting/createSlug` should either use `slugForFilename` with an explicit "fallback to `'item'` if empty" wrapper or be deleted.

### F5 — Three RoadmapTimeline projection wrappers
**Classification:** COMPOSABLE-SUBUNITS / NOT-A-DUP
**Reasoning:** Per Phase 3 finding, all three have feature specs naming them as separate patterns. Per the INVENTORY, they wire to three different `documentation-bundle.internal.ts` dispatch entries (roadmap, current-work, milestones) and produce three different routed output paths (`ROADMAP.md`, `CURRENT-WORK.md`, `COMPLETED-MILESTONES.md`). The disclosure-axis interpretation is the wrong frame: these are three **different filter selections over the same content type**, not three depths of one content unit. In ContentFragment terms, one `roadmap` ContentFragment with three named view modes (`roadmap` / `current-work` / `milestones`) is the right shape — but the three public entry points must remain because each maps to a distinct doc surface.

### F6 — Two RequirementDigest projections
**Classification:** COMPOSABLE-SUBUNITS / NOT-A-DUP
**Reasoning:** Same pattern as F5. `executable` and `specs` are two **selections** over patterns (bucket = value-transfer state). Each produces a different routed output (`requirements-executable`, `requirements-specs`). Two ContentFragment instances of one "requirement-digest" ContentFragment with explicit `bucket` parameter is the cleaner shape — but the three projection entry points (`projectRequirementDigest`, `…ExecutableDigest`, `…SpecsDigest`) stay because the bundle/dispatch surface depends on them.

### F7 — DecisionCatalog vs DecisionRecord normalizers share no helpers
**Classification:** DISCLOSURE-PAIR
**Reasoning:** `DecisionCatalog` is a top-level index of `DecisionRecord` items; `DecisionRecord` is the per-record detail page. This is **exactly** the campaign's "same data at different depths" shape: catalog ≈ `essential`/`important` depth (one row per ADR), record ≈ `advanced` depth (full Context/Decision/Consequences). Shared row-builders (`buildDecisionStatusRow`, `buildDecisionLink`) are the right consolidation, but the normalizers themselves must stay separate (they map to different routes).

### F8 — Block-type underuse (`mermaid`, `collapsible`, `link-out`)
**Classification:** NOT-APPLICABLE
**Reasoning:** Not duplication. Underuse. `mermaid` is fine — `ArchitectureDiagram` is the only fragment that emits diagrams today; campaign adds C4/sequence/class diagram extractors, which WILL emit `mermaid` blocks. `collapsible` is dead emission-side (only consumed during markdown parsing). `link-out` is correctly renderer-internal. The substrate is right-sized; no consolidation needed.

### F9 — `BoundedContextSummary` vs `BoundedContextEntry`
**Classification:** FORCED-FUSION
**Reasoning:** Both describe a bounded-context summary. The split happened because `ArchitectureComparison` needed `allDependencies` (cross-context analysis) and `BoundedContext` needed `layers + roles` (single-context view). A single `BoundedContextSummarySchema` with optional `allDependencies?`, `layers?`, `roles?` would express the union cleanly, and the projections would populate the relevant subset. No disclosure axis — these are different **uses**, not different **depths**.

### F10 — Six singular/collection pairs
**Classification:** NOT-A-DUP (intentional structure)
**Reasoning:** Each pair maps to two distinct consumer needs: collection drives the index/catalog page; singular drives the deep-link/detail page or MCP single-item lookup. Both have feature-spec coverage (Phase 3). The `collection = z.strictObject({ kind, items: z.array(SingularSchema) })` composition is exactly the right Zod pattern — schema composition is already correct. Do not merge. The disclosure-axis lens does NOT apply here because the singular fragment is not "less detail" than the collection — it's a different routing primitive.

### F11 — Boilerplate "When to Use" JSDoc on 39+ fragments
**Classification:** TRUE-DUP (documentation noise)
**Reasoning:** This is content duplication in a corpus the campaign will mine for doc generation. The boilerplate adds zero information and will be extracted 39 times into generated docs unless removed. Either delete the boilerplate stanza (preferable) or make it a templated tag that the doc generator drops by default.

### F12 — Asymmetric `_internal/` reuse
**Classification:** NOT-APPLICABLE
**Reasoning:** Phase 1 F6 already flagged the `_internal/` boundary. The reuse asymmetry (renderers use format-utils, only one projection uses slug-route-segment) does not warrant relocation — these helpers are correctly positioned for a `_internal/` shared kernel. The campaign will route MORE projections through the slug + format helpers, justifying the current location.

---

## Campaign-action table

| # | Finding | Lens 1 verdict | Lens 2 reframe | Pre-campaign action | Risk if skipped | Severity | Spec-safe? |
|---|---|---|---|---|---|---|---|
| F1 | Pattern{Summary,Detail} field copy-paste | Schema duplication | Disclosure-pair | Refactor `PatternDetailSchema = PatternSummarySchema.extend({...})` so the subset relationship is in the schema, not just the runtime spread | Campaign authors will treat them as unrelated; ContentFragment for "pattern-card" cannot reuse the schema relationship | High | Safe — both projections stay; only the schema declaration changes |
| F2 | Two `DeliverableSchema` shapes | True dup | True-duplication | Make `pattern-relations/supporting.ts` import `DeliverableSchema` from `execution-context/deliverable.ts` (stripping `kind` via `.omit({kind:true})` or keeping `kind` and updating consumers) | Phase 1 finding "Fragment is a closed 43-variant discriminated union" gets compounded by silent name shadow inside the package | High | Safe — both shapes carry the same data; consolidation does not change wire format if `kind` handling is preserved at boundary |
| F3 | 5-branch BusinessRuleSetSchema | Forced-fusion (mild) | Forced-fusion | Collapse to one strict object + refinement; preserves wire format if `scope`/`scopeValue` semantics unchanged | Campaign's per-grouping disclosure variants (the renderer richness modes) sit on top of this; 5 branches multiply into 20 cases unnecessarily | Medium | Risky — `BusinessRuleSet` has feature-spec coverage that tests the discriminated-union shape. Verify spec assertions before collapsing. |
| F4 | Three slug helpers | True dup | True-duplication | Inline `slugForFilename` into `render-markdown.ts:toKebabCase` (delete the local fn); replace `delivery-reporting/createSlug` with `slugForFilename(value) || 'item'` | Campaign will add ContentFragment slug-based routing; a 4th slug helper will appear if not consolidated | Low | Safe — no public contract change; helpers are private |
| F5 | 3 RoadmapTimeline wrappers | Apparent dup | Composable-subunits / not-a-dup | Leave entry points alone. Document the relationship as "one ContentFragment with 3 view modes" in the campaign design | Removing entry points would break the dispatch table + feature specs | Low | Spec-locked — do not merge |
| F6 | 2 RequirementDigest bucket projections | Apparent dup | Composable-subunits / not-a-dup | Same as F5. Document the bucket axis. | Same as F5 | Low | Spec-locked — do not merge |
| F7 | Decision normalizers share no helpers | Renderer dup | Disclosure-pair | Extract `buildDecisionLink`, `buildDecisionStatusBadge`, `buildDecisionRecordSections` to module-private helpers in `render-markdown.ts` (or, per Phase 1 H5, move into per-fragment normalizer modules) | New ContentFragment "decisions" will add a 3rd depth (one-line decision summary in a parent doc); without shared helpers, three normalizer copies of the link format | Medium | Safe — internal renderer refactor |
| F8 | Block-type underuse | Underuse | Not-applicable | None | Campaign will use `mermaid` for new diagram extractors; `collapsible` and `link-out` stay as-is | Low | n/a |
| F9 | BoundedContextSummary vs BoundedContextEntry | Schema split | Forced-fusion | Unify to one `BoundedContextSummarySchema` with optional fields; projections populate the subset they need | Forced-fusion blocks the campaign's "single ContentFragment per bounded context" composition | Medium | Verify the `BoundedContext` and `ArchitectureComparison` feature specs do not assert exact field absence; if they do, the unification is BC-breaking |
| F10 | 6 singular/collection pairs | Apparent dup | Not-a-dup | Leave alone | Same as F5 | Low | Spec-locked — do not merge |
| F11 | 39× boilerplate JSDoc | Content dup | True-duplication (documentation noise) | Delete the `### When to Use - As a typed contract...` stanza from fragment files OR replace with a single accurate sentence per fragment | Campaign's `extractJSDocProse` will surface the same noise 39 times; Phase 3 D-H1 already noted renderer files have this exact problem | Medium | Safe — deletion of inaccurate boilerplate; no code behavior changes |
| F12 | `_internal/` reuse asymmetry | Underuse | Not-applicable | None | Campaign will increase reuse of these helpers; current location is correct | Low | n/a |

---

## Headline observation

**Two distinct patterns dominate:**

1. **Most "apparent duplication" among the 43 projections is structural, not redundant.** The six singular/collection pairs (F10) and the multi-view projections (F5, F6) look like duplication from a code-density lens, but each entry point maps to a feature-spec-locked dispatch row or MCP/CLI surface. The Lens 1 reading would prescribe consolidation; the Lens 2 reading correctly classifies them as ContentFragment view-modes / composable subunits and leaves them alone.

2. **The real consolidation wins are at the schema and renderer layers, not the projection layer.** The five high-leverage actions before the campaign starts are:
   - **F1** (Pattern{Summary,Detail} schema composition) and **F7** (Decision normalizer helper extraction) — both are disclosure-pairs where the schema/renderer doesn't currently express the depth relationship. The campaign will visibly suffer if it adds ContentFragment depth-levels on top of pairs that don't share substructure.
   - **F2** (two parallel Deliverable shapes) and **F9** (two BoundedContext snapshots) — both are pure schema fragmentation, easy to unify, and high-value because they remove name shadows the campaign will trip over.
   - **F11** (39× boilerplate JSDoc) — purely a doc-corpus cleanup, but the campaign's most prominent demo is JSDoc-prose extraction. The first thing it will surface is 39 identical sentences. Cheap to fix, high signal.

The headline is therefore: **the apparent surface duplication is mostly intentional; the actual high-value consolidation lives in two schemas, one renderer module, and the JSDoc corpus.** None of the recommended actions touch projection entry points or feature-spec-locked contracts, so all are safe under no-BC + Phase 3's "alive but unsurfaced" verdict.
