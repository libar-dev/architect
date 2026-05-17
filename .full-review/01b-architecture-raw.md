# `architect-projection` — Architecture Review (Doc-Gen Consolidation Campaign Lens)

**Reviewer:** Software-architect persona
**Scope:** `packages/architect-projection/src/**` (135 files)
**Lens:** Pre-evaluation of the PROPOSED-DESIGN doc-gen consolidation campaign — flagging structural issues that will block, complicate, or invalidate the incoming `DocDefinition.build(graph)` / `ContentFragment` / multi-target work.

---

## Findings

### F1. `documentation-bundle.internal.ts` — closed-by-`satisfies` dispatch, no extension point
- **Severity:** Critical
- **Architectural impact:** This is the explicit ceiling the campaign targets. The dispatch is closed at compile time; `DocDefinition.build()` cannot plug in without replacing the file outright.
- **Location:** `src/projections/documentation-composition/documentation-bundle.internal.ts:64-79`
- **Description:** `DOCUMENTATION_PROJECTION_FACTORIES` is a closed object literal typed `satisfies Record<SupportedDocumentationType, DocumentationProjectionFactory>`. The set of supported document types comes from the `DOCUMENTATION_TYPE_REGISTRY` enum in `documentation-types.ts`. There is no registry, no plug-in surface, no externally constructible `DocumentationProjectionFactory`. To add a new doc type today you must edit (a) the registry array, (b) the factory map, (c) any renderer that key-maps off documentation type — each is closed shape.
- **Recommendation:** Treat the dispatch table as legacy at the start of the campaign. Author `DocDefinition` as a peer mechanism whose contract is `(ctx: DocBuildContext) => RenderableDocument | Promise<...>`. Wire the runner that iterates `config.docs` directly; delete `DOCUMENTATION_PROJECTION_FACTORIES` once the 12 entries port. Do not try to retrofit a registry into the existing dispatch — the campaign already has a cleaner shape (the `build()` function IS the registration).

### F2. `documentation-types.ts` couples the registry, disclosure matrix, type aliases, freeze logic, and runtime filter resolution into one 517-LOC module
- **Severity:** High
- **Architectural impact:** This module is the de-facto "doc-gen config" — and it is the file `DocDefinition` is meant to replace. Its overgrowth makes the migration path concretely harder because the four concerns inside it have to be unpicked in lockstep.
- **Location:** `src/projections/documentation-composition/documentation-types.ts`
- **Description:** Single file contains: (1) the supported/dropped enum and registry data (~200 LOC), (2) per-type disclosure-matrix builders (~70 LOC), (3) discriminated-union Zod schemas (`SupportedDocumentationTypeRegistryEntrySchema` + `DroppedDocumentationTypeRegistryEntrySchema`), (4) `resolveProjectionFilter()` — a runtime context-merging function (~25 LOC), (5) freeze helpers (~50 LOC). Half of the surface is consumed only by `documentation-bundle.internal.ts` (and `render-markdown.ts` for `getDocumentationTypeMetadata`); the other half (Zod schemas, the dropped-type enum) is consumed at the public `./projections` boundary.
- **Recommendation:** Before the campaign begins, split this file along the three obvious seams: `documentation-type-registry.ts` (just the data array + lookup), `disclosure-matrix.ts` (the matrix builder + per-type matrices), `projection-filter-resolver.ts` (the merge function). The "freeze" helpers are over-engineered for an `as const` literal — drop them in the split, the `Object.freeze` is redundant given the literal's compile-time readonly-ness. This split is a prerequisite for the campaign to land cleanly because `DocDefinition`s want to own the disclosure choices per doc, not lift them from a centralized matrix.

### F3. `documentation-types.ts:299-340` — three registry entries hardcoded as `status: 'dropped'` is a backward-compatibility shim
- **Severity:** High (no-BC doctrine violation)
- **Architectural impact:** The `'dropped'` discriminator and `isDroppedDocumentationType()` exist solely to produce a politer error message for callers passing `'reference'`, `'product-areas'`, `'design-review'`, `'product-requirements'`. That's a deprecation shim.
- **Location:** `src/projections/documentation-composition/documentation-types.ts:295-339, 49-64, 383-385`; `documentation-bundle.internal.ts:81-98`
- **Description:** Per `CLAUDE.md`'s no-BC clause: "Backward-compatibility aliases (re-exporting an old name from a new location, parallel implementations behind a feature flag, etc.)" are banned, and "`@deprecated` markers as a way to soften a removal" likewise. The dropped-doc-type registry is exactly the latter — it ships dead entries with metadata only so the error message can say "intentionally dropped" instead of "unknown." A clean error path would just throw `UNKNOWN_DOCUMENT_TYPE` for these strings.
- **Recommendation:** Delete `DroppedDocumentationTypeRegistryEntrySchema`, `DROPPED_DOCUMENTATION_TYPE_REGISTRY`, `DROPPED_DOCUMENTATION_TYPES`, `isDroppedDocumentationType`, and the corresponding branch in `assertSupportedDocumentType`. The `UNKNOWN_DOCUMENT_TYPE` error already lists supported types — that's sufficient. This cleanup is independent of the campaign but blocks the campaign from authoring a `DocDefinition` named e.g. `'design-review'` cleanly.

### F4. Renderer reaches into `documentation-composition` — codec/renderer line blurred (ADR-005 adherence drift)
- **Severity:** High
- **Architectural impact:** The renderer is supposed to consume fragments by `kind` and trust the shape (ADR-009). Instead it reads the documentation-type registry and disclosure matrix at render-time to decide split strategy, child paths, and emit-children behavior. That makes the renderer doc-type-aware and means new doc types can't be added without renderer changes.
- **Location:** `src/renderers/render-markdown.ts:50` (`getDocumentationTypeMetadata`), `src/renderers/render-markdown.ts:400-421` (`resolveBundleDisclosureSpec`), `src/renderers/markdown-paths.ts:3` (`defaultMarkdownRouteProfile` queries registry)
- **Description:** ADR-005 says codecs produce fragments, renderers consume them. ADR-009 says the projection layer is the trust boundary; renderers downstream of that boundary trust the shape. But `render-markdown.ts` line 400-421 derives the disclosure spec by looking up `rootRouteId` in the documentation-type registry and reading `metadata.disclosureMatrix[level]`. This is logic that belongs in the projection layer — the projection should produce a `ProjectionBundle` whose `routing` already encodes the disclosure-driven split decisions, and the renderer should mechanically follow `routing`.
- **Recommendation:** Move disclosure resolution upstream: the `projectDocumentationBundleInternal` function should set `routing.disclosureSpec` (extend `BundleRouting` if needed) so the renderer can read it off the bundle without consulting the registry. This is the right factoring for the campaign because each `DocDefinition.build()` will set its own disclosure spec — the renderer cannot look up a per-`DocDefinition` registry it doesn't know about. Decouple now, before the campaign multiplies the dependency.

### F5. `renderers/types.ts` imports from `projections/documentation-composition/*` — directory dependency-direction inversion
- **Severity:** High
- **Architectural impact:** Renderers depend on documentation-composition types (`DisclosureSpec`, `LogicalRouteId`). This breaks the conceptual layering where `renderers/` consumes `fragments/` (and `blocks/`) but not domain-specific `projections/`. The campaign will make this worse — `DocDefinition` will live somewhere that consumes both, and the current cross-link constrains where it can land.
- **Location:** `src/renderers/types.ts:2-3`, `src/renderers/markdown-paths.ts:3-4`, `src/renderers/render-markdown.ts:50,52`
- **Description:** A renderer-side contract type (`RenderMarkdownOptions`) carries `disclosureLevel` and `disclosureSpec`, both sourced from `../projections/documentation-composition/`. This couples the renderer's public contract to a particular projection domain. There is no circular import (the dependency is one-way), but it forces every consumer of `./renderers` to transitively depend on documentation-composition's schemas — including consumers (like `architect-cli`) that render fragments unrelated to documentation bundles.
- **Recommendation:** Promote `DisclosureSpec`, `LogicalRouteId`, and the disclosure-vocabulary enum to a shared module (e.g., `src/disclosure/`) that both `projections/documentation-composition/` and `renderers/` depend on. This is small (just file moves + import-rewrites) but it unlocks the campaign: `DocDefinition` and `ContentFragment` will both consume the disclosure vocabulary without dragging in documentation-composition's full registry.

### F6. `_internal/` is naming convention only — not enforced
- **Severity:** Medium
- **Architectural impact:** The `_internal/` directory and `*.internal.ts` suffix suggest a sealed boundary, but neither is enforced by linting, package.json `exports`, or ESLint rules. External packages CAN import `dist/projections/documentation-composition/documentation-bundle.internal.js` directly via the `./projections` sub-entry (the barrel re-exports public surface, but tarball contains the internals).
- **Location:** `src/_internal/`, every `*.internal.ts` file
- **Description:** The `package.json` `exports` map exposes `./projections`, `./blocks`, `./fragments`, `./renderers` and points each at a single barrel `index.d.ts/index.js`. Modern bundlers will respect that, but anyone importing the deep path (e.g., via package source if linked, or via TS path-mapping) can reach internals. The campaign will be tempted to import `projectDocumentationBundleInternal` directly from `DocDefinition` runners — the convention won't stop them.
- **Recommendation:** Either add ESLint `import/no-internal-modules` with explicit allowlists, OR rename to `*.unstable.ts` (a stronger social signal), OR add explicit `"./projections/documentation-composition/*.internal": null` entries to `exports`. The campaign should treat `*.internal.ts` as truly closed; that needs reinforcement before W-DOCS-1 begins.

### F7. Fragment-domain boundary is incoherent — `documentation-composition` fragments are routing primitives, not domain content
- **Severity:** Medium
- **Architectural impact:** `documentation-composition` mixes a content fragment (`ArchitectureDiagram`), a registry fragment (`ProjectConfigSnapshot`), and an aggregator-dispatcher (`projectDocumentationBundle`) in one directory. The campaign will add `ContentFragment` as a layer on top of `Fragment` — that name collision is going to be painful unless this is straightened out first.
- **Location:** `src/fragments/documentation-composition/`, `src/projections/documentation-composition/`
- **Description:** Six fragment domains are listed: `pattern-relations`, `governance`, `operational-insights`, `delivery-reporting`, `execution-context`, `documentation-composition`. The first five are coherent (each groups related domain content). `documentation-composition` is the odd one — its three fragments don't share a domain shape, they share the property "needed by the documentation pipeline."
- **Recommendation:** Move `ArchitectureDiagram` into `pattern-relations/` (it IS pattern-relation visualization). Move `ProjectConfigSnapshot` into a new `meta/` domain or `execution-context/`. Move `PrChangeReview` into `delivery-reporting/`. That leaves `documentation-composition` to be exactly what its name says: the doc-composition machinery (registry, disclosure, routing), not domain content. This pre-cleanup makes `ContentFragment` a clearer addition because there's no naming clash with the residual "documentation-composition fragments" concept.

### F8. 43 projection functions, signature drift — `parseAndProject*` wrappers come in three flavors
- **Severity:** Medium
- **Architectural impact:** A generic `DocDefinition.build()` cannot call projections uniformly because their option-handling is inconsistent. This is a per-extractor authoring tax that compounds across ~10+ extractor uses per `DocDefinition`.
- **Location:** Survey across `src/projections/**/*.ts`
- **Description:** Three patterns coexist: (a) `project*` takes typed options and returns directly (most common); (b) `parseAndProject*` is a curried function from `parseAndProject(schema, projectFn, name)` wrapping raw-options into typed; (c) some projections only export the parsed variant (e.g., `parseAndProjectSessionContext`), others only the typed variant (e.g., `projectDeliverable`), and most export both. There is no convention for which to use from doc-gen.
- **Recommendation:** Enforce a uniform signature for projections that should be callable from `DocDefinition` runners: `(ctx: ProjectionContext, options?: T) => ProjectionBundle<Fragment>`. The `parseAndProject` wrapper is for CLI/MCP boundaries where raw `unknown` arrives — `DocDefinition` runners get a typed options object compile-checked, so they don't need parse-at-boundary. Document the rule (in the package's `@architect-trust-boundary` annotation if one exists, or `ARCHITECTURE.md`) and grep-audit the 43 functions before extractor-catalog work begins (W-DOCS-2).

### F9. `Fragment` discriminated union (43 variants) is a closed set — `ContentFragment` proposal will fight this
- **Severity:** Medium
- **Architectural impact:** `ContentFragment.build()` returns `SectionBlock[]`, not a `Fragment`. That means ContentFragments cannot participate in the `ProjectionBundle<Fragment>` model — they bypass it entirely. The proposed design accepts this (it returns blocks directly into `composeDoc`), but it means two parallel "fragment" concepts live in the package.
- **Location:** `src/fragments/fragment-schema.internal.ts:69-113` (closed union), proposed `ContentFragment` in `PROPOSED-DESIGN.md`
- **Description:** Today's `Fragment` is a Zod discriminated union over 43 `kind` literals. Adding a 44th would force a schema and renderer normalizer. The campaign sidesteps this by making `ContentFragment` emit `Block[]` directly — which works, but creates a conceptual schism: a `DocDefinition` will compose `Block[]` from `Fragment`s (via existing projections) AND from `ContentFragment`s (new), with different shape, validation, and trust semantics.
- **Recommendation:** Embrace the schism explicitly. Document the two layers: (1) `Fragment` is for per-pattern domain content with strict schemas (still validated at the projection trust boundary), (2) `ContentFragment` is for reusable composed-block emitters with a typed input but no `kind`-based registry. Add a top-level `src/composition/` (or `src/doc-definition/`) directory for `DocDefinition` + `ContentFragment` + `composeDoc` — not under `fragments/` (would mislead), not under `projections/` (already too crowded), not under `renderers/` (this is upstream of rendering). The package will then have a 7th top-level directory; that's fine.

### F10. Block schema does not enforce nesting depth — `CollapsibleBlock.content: Block[]` is lazy-recursive
- **Severity:** Medium
- **Architectural impact:** ContentFragments will emit collapsible sections that can themselves contain collapsibles (e.g., per-disclosure-level fan-out). No upper bound on nesting means a pathological ContentFragment can produce a tree the markdown renderer cannot pretty-print or the perf gate cannot bound.
- **Location:** `src/blocks/schema.ts:50-54, 130-134, 142-152`
- **Description:** `CollapsibleBlockSchema` uses `z.lazy()` to allow `Block[]` recursion. There's no `maxDepth`, no validation of leaf-density. Today's projection codecs are well-behaved by convention, but the campaign will hand the pen to many `ContentFragment` authors who will encounter this.
- **Recommendation:** Either add a documented depth limit enforced by a render-time guard (rendererdrops or warns on `depth > N`), OR add a recursion-depth check at the projection trust boundary. The perf-gate fixture (`baseline × 1.5`) should be extended to include a "deeply nested collapsibles" worst case so the campaign's regression bound stays meaningful.

### F11. `BlockSchema` is the natural target for ContentFragment-emitted blocks — but `parseMarkdownToBlocks` (in core) supports only 6 of the 9 kinds
- **Severity:** Medium
- **Architectural impact:** Preamble loading (`loadPreambleFromMarkdown` in PROPOSED-DESIGN W-DOCS-1) will flow user-authored markdown through `parseMarkdownToBlocks` (lives in `architect-core`). That parser supports `heading | paragraph | separator | table | code | list` per DEEP-DIVE — `collapsible`, `link-out`, `mermaid` cannot survive the round-trip from a hand-authored preamble.
- **Location:** `src/blocks/schema.ts` (9 block kinds); `@libar-dev/architect-core/utils/markdown-parser.ts` (6 supported in parse)
- **Description:** The block catalog defines 9 kinds, but only 6 are reachable through markdown ingestion. Authors of preamble files cannot use HTML `<details>` (collapsible) or `[text](path)` link-out tagging or fenced mermaid blocks — those will either be flattened or rejected. This is a cross-package observation (the parser lives in core), but its impact lands inside `architect-projection`: every `DocDefinition` that loads a preamble inherits this constraint.
- **Recommendation:** Two paths, pick one in the design session: (a) Extend `parseMarkdownToBlocks` in core to support all 9 block kinds — collapsible via `<details><summary>...</summary>`, mermaid via ` ```mermaid ` fences (the data is already there), link-out via a hint syntax. (b) Document the constraint explicitly in `BlockSchema`'s `@architect-trust-boundary` annotation: "preambles emit a 6-kind subset; the other 3 are projection-emit-only." Option (a) is right because it makes preambles a first-class authoring surface — exactly what the campaign needs.

### F12. `ProjectionBundle.children` is `Record<string, Fragment>` — not typed enough to carry per-child disclosure or routing metadata
- **Severity:** Medium
- **Architectural impact:** The OUTPUT-side progressive-disclosure machinery already fans out one bundle into many files via `children`. The INPUT-side disclosure that `ContentFragment` introduces will produce children at varying disclosure levels. There's no way to attach per-child disclosure metadata to the existing `children` map without inventing a side-channel.
- **Location:** `src/fragments/base.ts:15-19`
- **Description:** `children: Record<string, Fragment>` has only Fragment as the value type. The companion `routing` field has `childRouteIds` but no per-child disclosure or richness. Today's renderer fakes this by re-reading the registry (see F4). When the campaign emits `ProjectionBundle`s with mixed-disclosure children, there's no carrier for "this child was emitted at `useful`, render it inline; that one at `advanced`, split to a separate file."
- **Recommendation:** Promote `children` to `Record<string, { fragment: Fragment; disclosure?: DisclosureLevel; routing?: ChildRouting }>` — or add a parallel `childMeta: Record<string, ChildMetadata>` map keyed by the same child key. Either makes the disclosure/render decision local to the bundle, eliminating the renderer's need to consult the documentation-type registry (fixes F4 too). Touch this in W-DOCS-1 before authoring `DocDefinition`s; touching it later cascades through every projection.

### F13. The 11 unreachable projections (per INVENTORY) are an architecture symptom, not just routing
- **Severity:** Medium
- **Architectural impact:** Projections like `projectDependencyEdges`, `projectPatternSummary`, `projectDeliverable`, `projectDeliverableManifest` exist with full schemas and tests but no end-user surface. The campaign's "pull-routing extractors" assume projections compose; if 25% of them have never been composed, the composability assumption is unproven.
- **Location:** INVENTORY §1, rows 4, 11, 19, 22, 25, 26, 27, 28, 30, 33, 37 (the ❌-❌ rows)
- **Description:** Eleven projection functions are reachable through neither CLI/MCP nor `docs:all`. They were shipped against design specs but never wired. Some of these (e.g., `projectDeliverable`/`projectDeliverableManifest`) are obvious campaign building blocks; others (e.g., `projectDependencyEdges` vs. `projectDependencyTree`) are duplicative shapes the campaign should pick between.
- **Recommendation:** Before W-DOCS-2 (extractor catalog), audit each of the 11 dead projections: (a) which is the campaign extractor's natural foundation? (b) which is duplicative and can be deleted? Move the chosen ones into the `extractors/` shape proposed in §2 of PROPOSED-DESIGN. Delete the others — per no-BC, dead code is not a future option, it's permanent tax.

### F14. Aggregation-tag push routing — no projection-layer hook point exists
- **Severity:** Medium
- **Architectural impact:** The campaign's "push model" via aggregation tags with `targetDoc` is documented as already-supported in the registry, but `architect-projection` doesn't expose an extractor for it. To wire it, a new projection has to be added.
- **Location:** No file — absence finding. `src/projections/governance/taxonomy-digest.ts` is the nearest cousin (it surfaces tag registry data); no `projectAggregationMatches` exists.
- **Description:** Aggregation tags live in `PatternGraph.tagRegistry` (per architect-core), but `architect-projection` exposes only the taxonomy digest. The campaign's `extractAggregations(ctx, aggregationTag)` extractor has no current projection to wrap.
- **Recommendation:** Add a `projectAggregationMatches` projection in `src/projections/governance/` (or wherever the tag-registry surface settles) that takes `{ aggregationTag: string; filter?: ... }` and returns `{ entries: Array<{ patternId; sourceFile; jsdoc?: string; ... }> }`. Schema-validate at the boundary like every other projection. The campaign extractor is then a 5-line wrapper. Doing this before W-DOCS-2c (push-routing wiring) shortens the critical path.

### F15. `RenderMarkdownOptions.disclosureLevel` is renderer-state, not pipeline-state
- **Severity:** Medium
- **Architectural impact:** Two orthogonal disclosure axes (INPUT-side at `ContentFragment.build`, OUTPUT-side at `renderMarkdown(...)`) are supposed to compose. Today's OUTPUT-side option lives on the renderer call, not the `ProjectionBundle`. The `DocDefinition.build()` runner has no way to convey output-disclosure intent forward except by passing it through every layer.
- **Location:** `src/renderers/types.ts:11-19`
- **Description:** A `DocDefinition` wants to declare "this doc should render at output-disclosure `important`" once. But disclosure-level is consumed at render time, not bundle time — so the runner has to thread it through `renderMarkdown(bundle, { disclosureLevel })` per doc. The proposed `DocDefinition` shape in §1 of PROPOSED-DESIGN doesn't show this — it returns `RenderableDocument` and renderer call site is implicit. The thread-through will leak.
- **Recommendation:** Move `disclosureLevel` and `disclosureSpec` from `RenderMarkdownOptions` onto `ProjectionBundle.routing` (or a new `metadata` field on the bundle). The renderer reads it off the bundle. `DocDefinition.build()` sets it once at bundle-build time. This unifies disclosure ownership and resolves F4 and F12 simultaneously — disclosure is a property of the rendered work, not a parameter of the rendering call.

### F16. Subentry `exports` map omits `/context` — context types leak only through the root barrel
- **Severity:** Low
- **Architectural impact:** Sub-entry partitioning is intentional (per `index.ts` header comment) but consumers wanting `ProjectionContext` must import from the root barrel, which transitively pulls everything else. This is a minor friction point that the campaign will hit because every `DocDefinition.build(ctx: DocBuildContext)` will want `ProjectionContext`.
- **Location:** `package.json:25-46`, `src/index.ts:21-26`
- **Description:** The four sub-entries (`./blocks`, `./fragments`, `./projections`, `./renderers`) intentionally don't include `ProjectionContext`. Per index.ts header, "Context types that are shared across subdomains stay explicitly enumerated below." The result is the root barrel re-exports ~400+ symbols, dominantly schemas, so a consumer that just needs `ProjectionContext` pays the full tree-shake cost.
- **Recommendation:** Add a `./context` sub-entry. Add a `./composition` (or `./doc-definition`) sub-entry as part of W-DOCS-1 — that's where `DocDefinition`, `ContentFragment`, `composeDoc`, and the helpers in PROPOSED-DESIGN §3 will live. This keeps `architect-cli` and `architect-mcp` consumers from pulling in 43 projections when they only want `composeDoc`.

### F17. `DisclosureSpec` is at `documentation-composition/` but its vocabulary is package-wide
- **Severity:** Low
- **Architectural impact:** The disclosure vocabulary (`essential | important | useful | advanced`) is shared by renderers, projections, and (per the campaign) ContentFragments. It currently lives under one specific projection domain.
- **Location:** `src/projections/documentation-composition/disclosure-spec.ts`, `progressive-disclosure.ts`
- **Description:** `DisclosureSpec` (the rich object) and `ProgressiveDisclosureLevel` (the enum) are project-wide vocabulary, but they're parked inside a single projection domain. This compounds F5 — the rest of the package has to reach into one domain's directory to use a vocabulary that doesn't belong there.
- **Recommendation:** Promote the disclosure vocabulary to a `src/disclosure/` directory: `levels.ts` (enum + policy), `disclosure-spec.ts`, `logical-route-id.ts`. `documentation-composition` then depends on it like everyone else. This is W-DOCS-1 cleanup, ~2 hours of mechanical moves.

### F18. `progressive-disclosure.ts` couples disclosure levels to logical route IDs
- **Severity:** Low
- **Architectural impact:** Two unrelated concepts (disclosure levels + route-ID format) coexist in one file. The route-ID system is general-purpose routing; disclosure is content-depth selection. Conflating them means a consumer that wants route-IDs (e.g., a fragment-link extractor) drags in the disclosure machinery.
- **Location:** `src/projections/documentation-composition/progressive-disclosure.ts`
- **Description:** The 120-line file mixes `PROGRESSIVE_DISCLOSURE_LEVELS`, `ProgressiveDisclosurePolicySchema`, and `createIndexRouteId`/`createEntityRouteId`/`createChildRouteId`/`isLogicalRouteId`. The route-ID machinery is what `BundleRouting.rootRouteId` and `MarkdownRouteProfile.mapPath` consume — neither knows about disclosure.
- **Recommendation:** Split into `disclosure-levels.ts` and `logical-route-id.ts`. Done as part of F17's promotion to `src/disclosure/` and a sibling `src/routing/`. Trivial mechanical refactor; pays off because the campaign's `linkToCanonical()` helper needs route-IDs but not disclosure.

### F19. No formal `RenderableDocument` envelope type — PROPOSED-DESIGN references it but it doesn't exist
- **Severity:** Low (campaign-naming gap, not present-day bug)
- **Architectural impact:** PROPOSED-DESIGN refers to `RenderableDocument` as if it exists. The closest current shape is `ProjectionBundle<Fragment>`. `DocDefinition.build()` returning `RenderableDocument` needs a real type definition first.
- **Location:** Absence finding (PROPOSED-DESIGN §1)
- **Description:** `RenderableDocument` is mentioned in the scope file and design doc, but no such Zod schema or TypeScript type exists in `src/blocks/` or `src/fragments/`. Today's renderable substrate is `ProjectionBundle<Fragment>`. A `DocDefinition`'s output type must be something the renderer can consume — either a `ProjectionBundle` of a new top-level fragment kind, or a plain `Block[]` envelope.
- **Recommendation:** In W-DOCS-1, define `RenderableDocument` explicitly: `{ title: string; metadata?: {...}; sections: SectionBlock[]; routing?: BundleRouting }`. Make the renderer accept both `ProjectionBundle<Fragment>` AND `RenderableDocument` via a discriminated union. This avoids creating a synthetic 44th `Fragment.kind` just to make `DocDefinition` outputs flow through the existing pipeline.

### F20. No CI guard that perf-gate fixture exercises `documentation-bundle`
- **Severity:** Low (verification gap)
- **Architectural impact:** The campaign will multiply doc-gen fan-out 5–10x (per the scope file). The perf gate exists at 36-pattern/108-rule fixture (per scope). If the perf fixture exercises only isolated fragment projections, the campaign's projection multiplication could silently breach budgets at real scale.
- **Location:** `tests/perf/` (presence assumed from scope), `documentation-bundle.internal.ts:64`
- **Description:** The 12-entry dispatch is the natural integration point for fan-out cost. If the perf test only times individual `project*` calls, it misses end-to-end doc-bundle cost.
- **Recommendation:** Add a perf scenario that exercises `projectDocumentationBundle` for all 12 documentation types in one run, including disclosure-level variation. Bake this into the baseline before W-DOCS-1 lands so the campaign's regressions are detectable. The pre-existing `baseline × 1.5` ceiling stays in force.

---

## Welcomes the campaign

These are places the current architecture is well-positioned for the proposed work — do not touch.

### W1. `BlockSchema` discriminated union with `z.strictObject` per variant is exactly the right substrate for ContentFragment output
- **Location:** `src/blocks/schema.ts:142-152`
- **Why:** 9 kinds, closed-shape via discriminated union, factory functions (`heading`, `paragraph`, `code`, `mermaid`, `collapsible`, `linkOut`, etc.) are all already in place. `composeDoc()` in PROPOSED-DESIGN §3 will be a thin orchestrator over these existing primitives. The block-emission API is the asset; the campaign builds composition on top, not around.

### W2. `parseAndProject` is the right trust-boundary abstraction — adopt unchanged for `DocDefinition` runners
- **Location:** `src/projections/_shared/parse-and-project.internal.ts`
- **Why:** This shared helper enforces "parse once at the trust boundary," validates via `parseAtBoundary` from core, and returns a typed function. `DocDefinition` runners can adopt the exact same pattern for the `config.docs[]` entries themselves: parse the `DocDefinition` schema once at runner-load time, then trust the shape. The doctrine (Zod-first + parse-once) propagates cleanly.

### W3. `ProjectionBundle` + `routing` + `LogicalRouteId` are a working fan-out substrate the campaign extends, not replaces
- **Location:** `src/fragments/base.ts`, `src/projections/documentation-composition/progressive-disclosure.ts`
- **Why:** Multi-target output (DocTarget[]) and per-disclosure-level child documents are already modeled. `BundleRouting.childRouteIds` + `childPathStrategy` + `anchorStrategy` + `MarkdownRouteProfile.mapPath` form a working renderer-side route-resolver. The campaign's "multi-target output" feature plugs into this, it doesn't reinvent it.

### W4. The `parseAndProject*` boundary pattern is uniformly applied across the package
- **Location:** Every `*.ts` peer to `*.internal.ts` in `src/projections/`
- **Why:** ~20 projection functions consistently use `parseAndProject(Schema, projectFn, name)`. The discipline of `*.ts` for the typed boundary and `*.internal.ts` for the schema + implementation is one of the strongest patterns in the codebase. Extractors (W-DOCS-2) should adopt the same pattern verbatim — no new convention required.

### W5. `RenderMarkdownOptions.disclosureLevel`/`disclosureSpec` already integrates the output-side disclosure machinery
- **Location:** `src/renderers/types.ts:11-19`, `src/renderers/render-markdown.ts:400-421`, `splitOversizedDocument` machinery
- **Why:** Despite F4 (renderer reads registry), the OUTPUT-side disclosure is fully wired: bundle children flatten or split, h2-boundary splitting works, the renderer-contract feature pins the behavior in tests. The INPUT-side `ContentFragment.build(ctx, { disclosure })` proposal can layer on top without redesigning the output side. Same vocabulary, independent concerns — the substrate is genuinely in place.

---

## Fights the campaign

These are the highest-value findings — places the current architecture will actively resist the proposed work.

### Fight1. The closed `DOCUMENTATION_PROJECTION_FACTORIES` + `SUPPORTED_DOCUMENTATION_TYPES` enum are the single biggest blocker
- **Where:** F1 + F2 + F3
- **Why it fights:** Every `DocDefinition` the campaign wants to ship is conceptually a new "documentation type." The current shape forces each one through a closed enum + a closed dispatch + a closed disclosure-matrix. Three closed mechanisms have to be opened or replaced before W-DOCS-1 can deliver a single doc.
- **Resolution direction:** Treat the registry as legacy at the start of W-DOCS-1, build `DocDefinition` runner as the new pathway, port the 12 existing types as `DocDefinition` instances in W-DOCS-5, then delete the registry. Do not retrofit.

### Fight2. Disclosure ownership is split across renderer-options, registry, and projection-context — `ContentFragment` cannot route around all three
- **Where:** F4 + F5 + F12 + F15 + F17
- **Why it fights:** The INPUT-side disclosure that `ContentFragment.build(ctx, { disclosure })` introduces composes with OUTPUT-side disclosure only if both axes share an owner. Today, OUTPUT-side disclosure is read from `RenderMarkdownOptions` (renderer-call argument), the documentation-type registry (lookup at render time), AND from `RenderMarkdownOptions.disclosureSpec` (override). Three sources, no single locus. Adding a fourth (per-fragment INPUT-side) without consolidating will produce inconsistent rendering.
- **Resolution direction:** Move disclosure ownership onto `ProjectionBundle.routing` (or a sibling `metadata`). Renderers and runners read it from one place. Promote the disclosure vocabulary to a shared `src/disclosure/` module. Then INPUT and OUTPUT axes are independent concerns over a single carrier.

### Fight3. `documentation-types.ts` is the most overgrown file in the package and it is exactly the file the campaign replaces
- **Where:** F2 + F3
- **Why it fights:** 517 LOC of registry + matrix + filter + freeze + dropped-shim. Half of it has to move (to `DocDefinition`), a quarter has to be deleted (no-BC), and the rest needs splitting. The campaign cannot delete it in one shot because four different consumers read different parts. Each consumer migration is a separate decision.
- **Resolution direction:** Pre-split this file along the three seams (registry / matrix / resolver) BEFORE W-DOCS-1. Then the campaign's deletions land cleanly per file. Trying to delete the monolith in one PR will produce a hairball.

### Fight4. The `_internal/` boundary is unenforced — the campaign will be tempted to import internals
- **Where:** F6
- **Why it fights:** `DocDefinition` runners need to consult disclosure resolution, registry lookups, and bundle-shape helpers that today live behind the `.internal.ts` convention with no enforcement. Without a real boundary, the campaign code will reach into `documentation-bundle.internal.ts`, `documentation-types.ts` private exports, etc. Once that happens, the cleanup F1–F3 propose becomes a breaking change for the campaign's own code.
- **Resolution direction:** Add ESLint `import/no-internal-modules` with allow-list for tests + within-domain imports. Or rename `*.internal.ts` to `*.unstable.ts` for stronger social signal. Do this before W-DOCS-1 — pure plumbing fix, ~half a day.

### Fight5. The `Fragment` discriminated union assumes every renderable output has a `kind` — `RenderableDocument` and `ContentFragment` break that assumption
- **Where:** F9 + F19
- **Why it fights:** The renderer dispatch (`MARKDOWN_NORMALIZERS: KindTable<...>` in render-markdown.ts line 181) keys off `kind`. ContentFragments emit `SectionBlock[]` directly — they don't have a `kind` and shouldn't. The campaign's `composeDoc(title, sections)` produces a `RenderableDocument`, again no `kind`. Either every new construct gets a synthetic `kind: 'RenderableDocument'` Fragment variant (bad: pollutes the schema, fakes domain content), or the renderer learns a second input shape.
- **Resolution direction:** Define `RenderableDocument` as a sibling to `ProjectionBundle<Fragment>` — a discriminated union over the two: `RenderInput = ProjectionBundle<Fragment> | RenderableDocument`. Renderer dispatches at the top: if `Fragment`-based, use the existing normalizer table; if `RenderableDocument`-based, render the `sections` directly. Two top-level shapes, one renderer entry-point. Document the split in `@architect-trust-boundary` annotations.

---

## Summary

The package's foundation (blocks schema, `ProjectionBundle`, `parseAndProject` discipline, OUTPUT-side disclosure substrate) is solid and the campaign builds on it cleanly. The friction is concentrated in three places: the closed documentation-type registry/dispatch (F1–F3), disclosure ownership scattered across renderer + registry + projection (F4, F5, F12, F15, F17), and the unclear boundary between domain `Fragment`s and the new `ContentFragment` / `RenderableDocument` concepts (F9, F19). Pre-cleaning these three areas before W-DOCS-1 will make every subsequent wave smaller and the no-BC doctrine sustainable. The renderer's lookups into the documentation-type registry (F4) are the strongest pure-architecture finding — they violate ADR-005/009 today and they actively block the campaign tomorrow.
