# Progressive-disclosure substrate map — `packages/architect-projection/`

Scope: code-level map of the OUTPUT / INPUT / INDEX disclosure substrate that W-DOCS-1 plugs into. Read-only; no edits. All paths absolute.

## A. OUTPUT-side disclosure machinery (what works today)

The OUTPUT axis is **fully wired**. It is composed of three independent layers (vocabulary → recipe → routing → split) and one trust-boundary override.

### A.1 Vocabulary primitives — `src/disclosure/`

The `disclosure/` directory is a package-wide kernel promoted out of `documentation-composition/` precisely so renderers, fragments, and projections can consume it without crossing domain boundaries (file-header comment notes this was finding F17 in the projection comprehensive review). It is the lowest layer of the OUTPUT axis.

| Type / value                       | File:line                                             | Purpose / consumers                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PROGRESSIVE_DISCLOSURE_LEVELS`    | `src/disclosure/levels.ts:9`                          | `['essential', 'important', 'useful', 'advanced'] as const` — the canonical 4-level vocabulary shared across all three D2 axes.                                                                                                                                                       |
| `ProgressiveDisclosureLevelSchema` | `src/disclosure/levels.ts:16`                         | Zod enum used by every option schema that accepts a disclosure level. Re-exported by `disclosure/index.ts:6`.                                                                                                                                                                         |
| `ProgressiveDisclosurePolicy[]`    | `src/disclosure/levels.ts:44`                         | Editorial map level → `availability` (`always` / `nearby` / `available` / `reference`) + `purpose` string. Single source of truth for the policy table — what W-DOCS-1's INDEX-axis docstrings must agree with.                                                                       |
| `DisclosureSpec` (Zod)             | `src/disclosure/spec.ts:29`                           | Strict object `{ grouping, richness, rootShape?, emitChildren, committed, filter? }`. The "composition recipe" the renderer consults — closed enums via `ContentRichnessSchema`, `GroupingAxisSchema`, `RootShapeSchema`. Schema-first: types flow from schemas (Zod-first doctrine). |
| `ProjectionFilterSchema`           | `src/projections/_shared/filter.ts` (referenced at 9) | Optional `maturity[]` / `status[]` filter embedded in a `DisclosureSpec`. Drives the `withDocumentationFilter` flow in `documentation-bundle.internal.ts:126`.                                                                                                                        |

### A.2 Per-doc-type recipe matrix — `documentation-composition/disclosure-matrix.ts`

A bound matrix `Record<ProgressiveDisclosureLevel, DisclosureSpec>` is declared once per the 12 legacy doc types.

| Symbol                                                                       | File:line                               | What it does                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DocumentationDisclosureMatrix`                                              | `disclosure-matrix.ts:7`                | Type: `Readonly<Record<ProgressiveDisclosureLevel, DisclosureSpec>>`.                                                                                                                                                                                                                                                                           |
| `DEFAULT_COMMITTED_FILTER` / `DEFAULT_USEFUL_FILTER` / `PLANNED_WORK_FILTER` | `disclosure-matrix.ts:11`, `:16`, `:21` | Default filter sets baked into the four-level matrices (`essential`/`important` → committed; `useful` → committed-but-design-allowed; `advanced` → unfiltered).                                                                                                                                                                                 |
| `disclosureMatrix(...)` helper                                               | `disclosure-matrix.ts:44`               | Applies the default filters per level (advanced is stripped of any filter via `omitFilter`).                                                                                                                                                                                                                                                    |
| `freezeDisclosureMatrix` / `freezeDisclosureSpec`                            | `disclosure-matrix.ts:63`, `:73`        | Deep-freezes the matrix and its nested filter array at module load. Treats the matrices as compile-time constants. Critical for the no-mutation contract that the renderer relies on.                                                                                                                                                           |
| Doc-specific matrices (12)                                                   | `disclosure-matrix.ts:102–162`          | `architectureDisclosureMatrix`, `decisionsDisclosureMatrix`, `businessRulesDisclosureMatrix`, `patternsDisclosureMatrix`, `roadmapDisclosureMatrix`, `currentWorkDisclosureMatrix`, `requirementsDisclosureMatrix`, `validationRulesDisclosureMatrix`, `taxonomyDisclosureMatrix`, `changelogDisclosureMatrix`, `traceabilityDisclosureMatrix`. |

### A.3 Routing — `fragments/base.ts` + `routing/route-id.ts`

| Type / function                   | File:line                         | Purpose                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProjectionBundle<T>`             | `src/fragments/base.ts:26`        | `{ root, children: Record<string, Fragment>, routing?: BundleRouting }`. The one bundle shape every projection emits.                                                                                                                                                                                                         |
| `BundleRouting`                   | `src/fragments/base.ts:5`         | `rootRouteId` + `childRouteIds` + `childPathStrategy` + `anchorStrategy` + optional `disclosureSpec` + optional markdown-target fields (`markdownRootTarget`, `markdownChildDirectory`, `entityPathLayout`). The single object the renderer reads to choose output paths AND output disclosure.                               |
| `entityPathLayout`                | `src/fragments/base.ts:23`        | `'flat' \| 'nested-index'` — controls `${dir}/${slug}.md` vs `${dir}/${slug}/INDEX.md` layout. Already supports the wiki-tree-with-index shape per route — what `WikiIndexDefinition` will use.                                                                                                                               |
| `isBundle` / `projectSingle`      | `src/fragments/base.ts:32`, `:52` | Discrimination + wrap helpers. Verified by `contract.feature` scenario "isBundle discriminates bundles from bare fragments".                                                                                                                                                                                                  |
| `LogicalRouteId` type + factories | `src/routing/route-id.ts:10`      | `${docType}:index` \| `${docType}:${entityId}` \| `${docType}:${entityId}:${childKind}:${childId}`. Factories `createIndexRouteId` (`:34`), `createEntityRouteId` (`:38`), `createChildRouteId` (`:48`). Parser at `:63`. Zod schema at `:29`. Promoted out of documentation-composition for the same F5/F18 layering reason. |

### A.4 Renderer — `renderers/render-markdown.ts`

| Symbol                                | File:line                                | What it does                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RenderMarkdownOptions`               | `src/renderers/types.ts:17`              | `sizeBudget? / splitStrategy? / includeChildren? / includeFrontmatter? / disclosureLevel? / disclosureSpec? / routeProfile?`.                                                                                                                                                                                                                                  |
| `MarkdownRouteProfile.mapPath`        | `src/renderers/types.ts:9`               | `(routeId, kind, key, routing) => string`. The pluggable surface — `WikiIndexDefinition` work doesn't need to touch the renderer if it provides routing with `entityPathLayout: 'nested-index'`.                                                                                                                                                               |
| `defaultMarkdownRouteProfile.mapPath` | `src/renderers/markdown-paths.ts:6`      | Calls `resolveLogicalRoutePath`. Index → `${docType.toUpperCase()}.md` or `routing.markdownRootTarget`. Entity → flat `${dir}/${slug}.md` or nested `${dir}/${slug}/INDEX.md`. Child → `${dir}/${entitySlug}/${childSlug}.md`. **One place to add new layouts.**                                                                                               |
| `renderMarkdown(input, options)`      | `src/renderers/render-markdown.ts:215`   | Public entry. Discriminates by `isBundle`; returns `string` for bare fragment / childless bundle, `Record<string, string>` (path → markdown) for routed bundle.                                                                                                                                                                                                |
| `renderBundle` / `addRoutedDocument`  | `render-markdown.ts:228`, `:323`         | Fan-out: maps routing → path map (`resolveChildOutputPaths`), normalizes root + children, applies splitter per file. Sorted deterministic output.                                                                                                                                                                                                              |
| `resolveBundleDisclosureSpec`         | `render-markdown.ts:425`                 | Trust-boundary override: per-render-call `options.disclosureSpec` wins over `bundle.routing.disclosureSpec`. Bundle's spec is the projection-time default.                                                                                                                                                                                                     |
| `splitOversizedDocument`              | `render-markdown.ts:2094`                | Markdown-only auto-pagination. Groups by H2 (`groupByH2` at `:2145`). If a sub-doc fits the budget → moves it to a child file, leaves a "See {heading}" link-out in the parent; otherwise inlines. Honors per-renderer `sizeBudget` + `splitStrategy: 'h2-boundary' \| 'never'`. Locked by `contract.feature` "Oversized document splitting is markdown-only". |
| `shouldSplitFromLineCount`            | `render-markdown.ts:462`                 | Skips split when `splitStrategy !== 'h2-boundary'`, `sizeBudget === undefined`, or `basePath` is empty.                                                                                                                                                                                                                                                        |
| Normalizer dispatch table             | `render-markdown.ts:202–213`             | `MARKDOWN_NORMALIZERS` — `ArchitectureDiagram / BusinessRuleSet / DecisionCatalog / DecisionRecord / RoadmapTimeline / ReleaseNotesDigest / RequirementDigest / TaxonomyDigest / TraceabilityMatrix / ValidationRuleDigest`. Falls back to `normalizeGenericFragment` for everything else.                                                                     |
| Richness branching example            | `render-markdown.ts:584`, `:598`, `:610` | `normalizeBusinessRuleSet` reads `options.disclosureSpec?.richness` and `?.rootShape` to choose between `name-only` (heading-only), `navigation` (link list), and `full` (rule table). The renderer already speaks the `richness` vocabulary.                                                                                                                  |

### A.5 Trust boundary (option override)

`resolveBundleDisclosureSpec` at `render-markdown.ts:429` is the OUTPUT-axis hand-off: caller may inject `disclosureSpec` at render-call time and it wins. This is the seam W-DOCS-1's per-target render pass uses to retune the same bundle for two targets (website vs agent-context).

### A.6 Contract enforcement

- Fixture: `tests/fixtures/renderers/progressive-disclosure.md` — the three frozen decisions (view splitting stays in projection, markdown-only splitting, bundle-children fan-out replaces `additionalFiles`).
- Feature: `tests/features/renderers/contract.feature:35–77` — `@routing`, `@contract`, `@documentation` scenarios validating the bundle shape and the three decisions are still in the doc.
- Type-level: `expectTypeOf` assertions in `tests/features/renderers/contract.feature.steps.ts` (renderer contract scenario at the feature `:42`).

---

## B. INPUT-side disclosure (what's missing)

PROPOSED-DESIGN § 3b and DECISIONS D2 define the INPUT axis as **what depth a single content unit emits**. There is **no INPUT axis in code today**. The level vocabulary, the disclosure recipe, and the level-comparator do not yet exist for content fragments.

### B.1 Reuses (already in place)

| Need                                       | Reuse from                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| 4-level vocabulary                         | `disclosure/levels.ts:9` (`PROGRESSIVE_DISCLOSURE_LEVELS`)             |
| Zod schema for option fields               | `disclosure/levels.ts:16` (`ProgressiveDisclosureLevelSchema`)         |
| Editorial policy / what each level means   | `disclosure/levels.ts:44` (`PROGRESSIVE_DISCLOSURE_POLICY`)            |
| Section block kinds the fragment will emit | `architect-core/src/config/section-block.ts:62` (`SectionBlock` union) |
| Heading / paragraph / list builders        | `src/blocks/schema.ts` (used by every existing projection)             |

### B.2 New surface to add

| Name                               | Shape                                                                                                                                                                               | Where it should live                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ContentFragment` interface        | `{ id, canonicalDoc, reflects?, build(ctx, opts: { disclosure?, mode?, linkToCanonical? }) }`                                                                                       | New file `src/doc-definition/content-fragment.ts` (sibling to `wiki-index.ts` per PROPOSED-DESIGN § 10.1) |
| `defineContentFragment` helper     | Identity function returning the input — for type inference + symbol-tracking                                                                                                        | Same file                                                                                                 |
| `gte(level, threshold)` comparator | `(a: ProgressiveDisclosureLevel, b: ProgressiveDisclosureLevel) => boolean`. Trivial — `PROGRESSIVE_DISCLOSURE_LEVELS.indexOf(a) >= indexOf(b)`.                                    | `src/disclosure/levels.ts` (extends the kernel — single new export, no breaking change)                   |
| `DocBuildContext`                  | `{ graph, tagRegistry, emittingDocId, … }`. Strict-object Zod schema. The fragment's `build` receives this so it can look up cross-references and call existing `project*` helpers. | New file `src/doc-definition/types.ts`                                                                    |
| `RenderableDocument` union         | Bundle-or-blocks. Currently bundles are the only shape; the new union widens it.                                                                                                    | `src/doc-definition/types.ts` (alias `ProjectionBundle<Fragment> \| readonly SectionBlock[]`)             |
| `linkToCanonical(fragment, opts)`  | Helper returning a `LinkOutBlock` pointing at the canonical doc's website target. PROPOSED-DESIGN § 3b uses it inline in fragment `build` functions.                                | `src/doc-definition/content-fragment.ts`                                                                  |
| `composeDoc(title, blocks[])`      | Wraps a flat block array into a single-fragment `ProjectionBundle`.                                                                                                                 | `src/doc-definition/compose.ts`                                                                           |
| `composeBundle(title, children[])` | Wraps children-emitting fragments into a routed bundle.                                                                                                                             | `src/doc-definition/compose.ts`                                                                           |

### B.3 Gap shape

The INPUT axis is **purely additive**: every reuse in B.1 lands without modifying the OUTPUT axis. The two axes only meet inside a `DocDefinition.build()` body — the fragment chooses INPUT depth, the result becomes a `RenderableDocument` (a bundle), and the renderer applies OUTPUT-axis fan-out/split. No INPUT-axis change touches `RenderMarkdownOptions`, `DisclosureSpec`, or `BundleRouting`.

---

## C. INDEX-side disclosure (the new surface)

D8 says all five INDEX sections are derived. Per PROPOSED-DESIGN § 10.1, the new entry point is `projectWikiIndex(def: WikiIndexDefinition, ctx: DocBuildContext): ProjectionBundle<Fragment>` which (1) builds `def.root.build(ctx)`, (2) walks `bundle.children`, (3) derives the five navigation sections, (4) returns a new bundle whose `root` is the INDEX page and whose `children` is the original child set.

### C.1 Coverage by section

| INDEX section            | Existing projection that already computes this derivation                                                                                                                                                                                                                                | Net status                                                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Map / Tree of pages | `BundleRouting.childRouteIds` + `defaultMarkdownRouteProfile.mapPath` already produce the per-child path map. `resolveChildOutputPaths` in `render-markdown.ts` builds the deterministic sorted child set the index can walk.                                                            | **Exists.** New code: a `buildFileTreeBlock(children, routing)` helper in `doc-definition/wiki-index.ts` that turns the path map into a markdown list/tree. No new graph queries.                                                                                                                                                           |
| Concept Index            | `projectTaxonomyDigest` (governance), `projectTagUsage` (`operational-insights/index.ts:1206`) — both already invert tag → patterns. Gherkin scenario/rule titles are reachable through `PatternGraph` via existing core APIs.                                                           | **Mostly exists.** D3'' requires a graph-join: invert by `Scenario:` / `Rule:` / `Feature:` intent strings, emit one row per intent → matching child page. The graph data is already in the `PatternGraphAPI`; a new derivation helper `buildConceptIndex(children, graph)` glues the existing readers to a new output block. **New code.** |
| Key Entities             | `extractShapes` / `discoverTaggedShapes` (`architect-core/src/extractor/shape-extractor.ts:50`, `:629`) already return per-file `ExtractedShape` records.                                                                                                                                | **Exists at the extractor level**, missing a "rollup per child page" helper. The Key-Entities block is `(child page) → (top N exported shapes referenced by that page)`. Need a new `buildKeyEntitiesBlock(children, ctx)` glue.                                                                                                            |
| Diagram Catalog          | `MermaidBlock` (`section-block.ts:45`) + `parseMarkdownToBlocks` already detects mermaid code-fences (`markdown-parser.ts:65`). `buildArchitectureDiagram` (`projections/documentation-composition/architecture-diagram.internal.ts`) builds the only diagram-emitting projection today. | **Exists.** New code is a walker that filters each child fragment for `MermaidBlock` and emits the catalog. The walker is small (`children.flatMap(child => extractBlocks(child).filter(b => b.type === 'mermaid'))`).                                                                                                                      |
| Reading Paths            | `projectDependencyTree` / `parseAndProjectDependencyTree` (`pattern-relations/dependency-tree.ts:17`) computes the hierarchical reading path from the PatternGraph. Editorial reading paths come from `WikiIndexDefinition.readingPaths`.                                                | **Hierarchical path exists.** Editorial path is purely declarative on the def — render-only work. A `buildReadingPathsSection(def, bundle)` helper formats both.                                                                                                                                                                            |
| Validation               | `projectValidationRuleDigest` (`governance/validation-rule-digest.ts`) already exists; the per-doc validation rule for the wiki-index PoC (PROPOSED-DESIGN § 11.4) is a Gherkin scenario authored at design time.                                                                        | **Exists.** The block is just the digest filtered to this wiki's contributing patterns. Reuse the `filter` field in `DisclosureSpec` to scope it.                                                                                                                                                                                           |

### C.2 New types to add

| Symbol                            | File:line (target)                                          | Shape                                                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WikiIndexDefinition`             | new `src/doc-definition/wiki-index.ts`                      | `{ id, title, root: DocDefinition, readingPaths?: ReadingPath[], preambles?: Record<routeId, string> }`. PROPOSED-DESIGN § 10.1.                                   |
| `ReadingPath` / `ReadingPathStep` | same                                                        | `{ id, intent, steps: [{ routeId, rationale }] }`.                                                                                                                 |
| `defineWikiIndex(spec)`           | same                                                        | Identity helper.                                                                                                                                                   |
| `projectWikiIndex(def, ctx)`      | new `src/doc-definition/project-wiki-index.ts`              | Public projection. Composes the five derivations + preamble into a bundle whose `routing.entityPathLayout = 'nested-index'`.                                       |
| `WikiIndexFragment`               | new `src/fragments/documentation-composition/wiki-index.ts` | Zod fragment schema for the INDEX page itself. New `kind` value in the union — extending the `Fragment` union is the only widening change touched by the campaign. |
| `normalizeWikiIndex`              | extends `render-markdown.ts:202` dispatch table             | New normalizer entry. The renderer dispatch table is closed via `StrictKindTable` — adding a new fragment kind here is a one-line addition.                        |

### C.3 Composite primitives that fan into the index renderer

These existing functions can be called from `projectWikiIndex` without modification:

- `projectDependencyTree(graph, options)` — hierarchical reading path source.
- `projectTagUsage(context)` — Concept Index primary source.
- `projectTaxonomyDigest(context)` — Concept Index fallback for taxonomy-driven groupings.
- `projectValidationRuleDigest(context)` — Validation section.
- `parseMarkdownToBlocks(source)` (core) — preamble parsing for `preambles[routeId]`.
- `discoverTaggedShapes(sourceCode)` (core) — Key Entities source.
- `resolveChildOutputPaths(...)` (private to `render-markdown.ts:263`-area) — file-map paths.

`resolveChildOutputPaths` is currently private; the wiki index doesn't need to call it because it can re-derive the same paths through `routing` + `mapPath` directly. No boundary move needed.

---

## D. The hardcoded 12-entry dispatch table

`packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:69`:

```ts
const DOCUMENTATION_PROJECTION_FACTORIES = { ... }
satisfies Record<SupportedDocumentationType, DocumentationProjectionFactory>;
```

The same set is mirrored in `documentation-type-registry.ts:58–201` as a `Readonly<…>` array of registry entries.

| #   | Key                       | Factory call (`internal.ts:70–83`)                                     | Already a `project*` reuse? | Blocks W-DOCS-1? | Replacement in `DocDefinition[]` shape                                                                                               |
| --- | ------------------------- | ---------------------------------------------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `architecture`            | `projectSingle(buildArchitectureDiagram(ctx, { scope: 'component' }))` | Yes (build helper)          | No               | `architecture.doc.ts` calling `buildArchitectureDiagram` from the build helper module.                                               |
| 2   | `decisions`               | `projectDecisionCatalog(ctx)`                                          | Yes                         | No               | Per-ADR `DocDefinition` calling `projectDecisionRecord` + a catalog-level `DocDefinition` (INVENTORY § 1).                           |
| 3   | `business-rules`          | `projectBusinessRuleSet(ctx, { scope: 'all', groupedBy: 'package' })`  | Yes                         | No               | `business-rules.doc.ts` invoking the same projector.                                                                                 |
| 4   | `patterns`                | `projectPatternCatalog(ctx)`                                           | Yes                         | No               | `patterns.doc.ts` + per-pattern `DocDefinition` (see existing `projectPatternDetail` / `projectPatternSummary`).                     |
| 5   | `roadmap`                 | `projectRoadmapTimeline(ctx)`                                          | Yes                         | No               | `roadmap.doc.ts`.                                                                                                                    |
| 6   | `current-work`            | `projectCurrentWork(ctx)`                                              | Yes                         | No               | `current-work.doc.ts`.                                                                                                               |
| 7   | `requirements-executable` | `projectRequirementExecutableDigest(ctx)`                              | Yes                         | No               | `requirements-executable.doc.ts`. Already uses `entityPathLayout: 'nested-index'` — the layout the wiki-index extension generalizes. |
| 8   | `requirements-specs`      | `projectRequirementSpecsDigest(ctx)`                                   | Yes                         | No               | `requirements-specs.doc.ts`.                                                                                                         |
| 9   | `validation-rules`        | `projectValidationRuleDigest(ctx)`                                     | Yes                         | No               | `validation-rules.doc.ts`. Reused by the wiki-index Validation section.                                                              |
| 10  | `taxonomy`                | `projectTaxonomyDigest(ctx)`                                           | Yes                         | No               | `taxonomy.doc.ts`. Reused by the wiki-index Concept Index.                                                                           |
| 11  | `changelog`               | `projectReleaseNotesDigest(ctx)`                                       | Yes                         | No               | `changelog.doc.ts`.                                                                                                                  |
| 12  | `traceability`            | `projectTraceabilityMatrix(ctx)`                                       | Yes                         | No               | `traceability.doc.ts`.                                                                                                               |

**Blocking?** None of the 12 block W-DOCS-1. The WARNING block at `documentation-bundle.internal.ts:63–68` already declares this table a campaign deletion target ("`DocDefinition.build(graph)` is the replacement path. Do NOT add new entries here."). W-DOCS-1 must keep generating outputs equivalent to today's 12 — but the equivalence is enforced by `DocDefinition`-based porting (W-DOCS-5), not by leaving the dispatch table in place.

**Frozen by:** `freezeSupportedDocumentationTypeMetadata` (`documentation-type-registry.ts:236`) freezes each entry + its `disclosureMatrix`. The matrices stay reusable post-deletion (re-imported from `disclosure-matrix.ts` by the new `DocDefinition`s).

---

## E. The `parseMarkdownToBlocks` boundary

`packages/architect-core/src/utils/markdown-parser.ts:84` produces a `readonly SectionBlock[]` whose `SectionBlock` union is defined at `architect-core/src/config/section-block.ts:62`:

| Block kind    | Decl line in `section-block.ts` | Emitted by `parseMarkdownToBlocks`? | Source rule                                                                       |
| ------------- | ------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ------- | ----------- |
| `heading`     | `:3`                            | Yes                                 | `HEADING_REGEX` `/^(#{1,6})\s+(.+)$/`                                             |
| `paragraph`   | `:9`                            | Yes                                 | Default state — `flushParagraph` joins consecutive non-special lines with spaces. |
| `separator`   | `:14`                           | Yes                                 | `SEPARATOR_REGEX` `/^(---+                                                        | \*\*\*+ | \_\_\_+)$/` |
| `table`       | `:18`                           | Yes                                 | `isTableStart` (pipe-prefixed + separator row).                                   |
| `list`        | `:33`                           | Yes (flat, no children/checked)     | `UNORDERED_LIST_REGEX` / `ORDERED_LIST_REGEX`.                                    |
| `code`        | `:39`                           | Yes                                 | ` ``` ` fence with optional language.                                             |
| `mermaid`     | `:45`                           | Yes                                 | Code fence whose language is `mermaid`.                                           |
| `collapsible` | `:50`                           | **No**                              | Not detected — the parser has no rule.                                            |
| `link-out`    | `:56`                           | **No**                              | Not detected — synthesized only by renderers.                                     |

### E.1 Sufficiency for a wiki-tree preamble

A wiki-tree preamble per PROPOSED-DESIGN § 10.3 (`docs-live/annotation-guide/INDEX.md` and `preambles[routeId]`) needs **heading + paragraph + table + code + mermaid**. The parser handles all five.

The campaign gaps:

1. **`collapsible`** — type exists in `SectionBlock` but `parseMarkdownToBlocks` doesn't produce it. PoC preambles are author-written markdown that won't need collapsibles; the renderer can emit them programmatically (e.g., from a fragment's `build` function returning a `CollapsibleBlock` directly). **Not a blocker for W-DOCS-1.** It only becomes one if `preambles[routeId]` author content needs collapse syntax (`<details>` HTML round-trip).
2. **`link-out`** — synthesized exclusively in the renderer (e.g., `splitOversizedDocument` at `render-markdown.ts:2127` calls `linkOut(...)`). Fragments that need link-outs build them in code, not via parsing source markdown. **Not a blocker.**
3. **List nesting and checked items** — `ListBlock` allows nested `ListItem` objects with `{ text, checked?, children? }` per `section-block.ts:25`, but the parser only emits flat strings (`extractListItemText` at `markdown-parser.ts:41` returns a plain string). The Reading Paths section may want nested rationale bullets — the renderer can build the nested shape directly without going through the parser. **Not a blocker.**

**Bottom line:** the parser-side substrate is sufficient for W-DOCS-1's PoC preamble surface (heading + paragraph + table + code + mermaid). The block-type union itself is wider than what the parser exercises — fragments author the richer shapes (`collapsible`, `link-out`, nested lists) directly in TypeScript.

---

## F. Net W-DOCS-1 code-surface delta

### F.1 Pure adds (new files, no existing-code change)

Per PROPOSED-DESIGN § 10.1 + DECISIONS D8:

- `packages/architect-projection/src/doc-definition/types.ts` — `DocDefinition`, `DocBuildContext`, `RenderableDocument`, `Target` types.
- `packages/architect-projection/src/doc-definition/content-fragment.ts` — `ContentFragment`, `defineContentFragment`, `linkToCanonical` helper.
- `packages/architect-projection/src/doc-definition/wiki-index.ts` — `WikiIndexDefinition`, `ReadingPath`, `ReadingPathStep`, `defineWikiIndex`.
- `packages/architect-projection/src/doc-definition/project-wiki-index.ts` — `projectWikiIndex(def, ctx)` (the five-section derivation orchestrator).
- `packages/architect-projection/src/doc-definition/compose.ts` — `composeDoc`, `composeBundle` helpers.
- `packages/architect-projection/src/fragments/documentation-composition/wiki-index.ts` — `WikiIndexFragment` Zod schema (new fragment `kind`).
- `packages/architect-projection/src/doc-definition/index.ts` — barrel + public re-exports.
- (Test side, not delta-counted) — new feature/fixture files under `tests/features/doc-definition/`.

### F.2 Tasteful extends (add one symbol/field, no breaking change)

- `packages/architect-projection/src/disclosure/levels.ts` — add `gte(level, threshold)` comparator (single new export; `disclosure/index.ts` re-export update). PROPOSED-DESIGN § 7 calls this out as W-DOCS-1 scope.
- `packages/architect-projection/src/fragments/fragment-schema.internal.ts` — widen the `Fragment` discriminated union to include `WikiIndexFragment`. Schema-only change.
- `packages/architect-projection/src/fragments/index.ts` — re-export the new fragment type.
- `packages/architect-projection/src/renderers/render-markdown.ts:202` — add `WikiIndex` entry to `MARKDOWN_NORMALIZERS` + a `normalizeWikiIndex` function. Dispatch table is closed via `StrictKindTable`; this is a one-line addition + a normalizer function next to the existing ones. No call-site change.
- `packages/architect-projection/src/index.ts` (package barrel) — re-export `defineWikiIndex`, `defineContentFragment`, `projectWikiIndex`, `composeDoc`, types. Additive.
- `architect.config.ts` (repo root) — add a `docs: DocDefinition[]` field as PROPOSED-DESIGN § 5 demands. This is a config-schema extension in `architect-core/src/config/project-config-schema.ts`; the new field is optional, so existing configs continue to validate.

### F.3 Boundary moves (relocation; possible breaking change)

None required for W-DOCS-1. The kernel substrate (`src/disclosure/`, `src/routing/route-id.ts`) was already promoted out of `documentation-composition/` during the F5/F17/F18 refactor (file headers note this), so the layers needed by `doc-definition/` are already at the correct level.

W-DOCS-1's verification target — porting one reference doc — does **not** require deleting `documentation-bundle.internal.ts` or its dispatch table. That deletion happens in W-DOCS-5 / W-DOCS-7 once all 12 have a `DocDefinition` equivalent. Until then, the dispatch table coexists with the new `DocDefinition[]` runner. **No-BC doctrine** still applies inside the campaign — once a `DocDefinition` replaces an entry, the entry is deleted in the same PR (DECISIONS D5 corollary).

### F.4 Files that stay untouched

- All renderer non-markdown surfaces — `render-json.ts`, `render-compact-text.ts`, `render-ui.ts`. Decision 2 of the renderer contract (`progressive-disclosure.md:40`) keeps splitting markdown-only; INDEX-axis work doesn't change that.
- `src/projections/_shared/dispatch.ts` — already strict-kind-dispatched. Adding `WikiIndex` is done via the table entry, not by changing dispatch internals.
- `src/projections/documentation-composition/disclosure-matrix.ts` — the 12 matrices stay valid, get re-imported by the new `DocDefinition`s during W-DOCS-5 porting. The W-DOCS-1 PoC doesn't touch them.
- `architect-core/src/extractor/shape-extractor.ts` — `extractShapes` / `discoverTaggedShapes` are stable; new extractor catalog (W-DOCS-2) layers on top, not under.
- `architect-core/src/utils/markdown-parser.ts` — sufficient for PoC preambles (see § E).
- `architect-core/src/config/section-block.ts` — `SectionBlock` union is already wide enough.

---

## Quick reference — files by axis

| Axis   | Existing files                                                                                                                                                                                                                                                                       | New files for W-DOCS-1                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OUTPUT | `src/disclosure/{index,levels,spec}.ts`, `src/fragments/base.ts`, `src/routing/route-id.ts`, `src/renderers/{types,markdown-paths,render-markdown}.ts`, `src/projections/documentation-composition/{disclosure-matrix,documentation-type-registry,documentation-bundle.internal}.ts` | (no new files)                                                                                                                                                                    |
| INPUT  | (reuses) `src/disclosure/levels.ts`, `architect-core/src/config/section-block.ts`, `src/blocks/schema.ts`                                                                                                                                                                            | `src/doc-definition/{types,content-fragment,compose,index}.ts`; `src/disclosure/levels.ts` (`gte` add)                                                                            |
| INDEX  | (reuses) `src/projections/{governance,operational-insights,pattern-relations,delivery-reporting}/index.ts`, `src/projections/documentation-composition/architecture-diagram.internal.ts`, `architect-core/src/{extractor/shape-extractor,utils/markdown-parser}.ts`                  | `src/doc-definition/{wiki-index,project-wiki-index}.ts`, `src/fragments/documentation-composition/wiki-index.ts`, `src/renderers/render-markdown.ts` (extend normalizer dispatch) |
