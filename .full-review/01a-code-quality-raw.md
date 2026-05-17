# Code Quality Review — `packages/architect-projection/`

**Scope:** Code-quality issues that block, complicate, or invalidate the doc-generation consolidation campaign (DocDefinition API, ContentFragment layer, multi-target output, new extractors). Findings strictly prioritized for that campaign — generic nits omitted.

**Total findings:** 22. **Critical:** 2. **High:** 6. **Medium:** 9. **Low:** 5.

---

## Critical

### C1. `DOCUMENTATION_PROJECTION_FACTORIES` is statically typed against a closed enum derived from the registry
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:64-79`

The dispatch table is `satisfies Record<SupportedDocumentationType, DocumentationProjectionFactory>`. `SupportedDocumentationType` is derived from `Extract<…, { readonly status: 'supported' }>['key']` over `DOCUMENTATION_TYPE_REGISTRY` (`documentation-types.ts:347-357`), which is `as const`. That means *every new doc type is a TypeScript compile error in three places* (registry + factories table + key union flow-through), and the entire registry has to be loaded just to add one factory. The downstream `getSupportedDocumentationTypeMetadata` is also strongly typed against this exhaustive union.

**Why it matters for the campaign:** The `DocDefinition.build(graph)` API is explicitly designed to let consumers (including per-package `*.doc.ts` files) register new docs without editing a central registry. Today's design forces every new doc to be inserted into a single closed union before it compiles. The campaign cannot land cleanly without either (a) opening this union to `string`-keyed registration at the boundary, or (b) replacing the registry with a `DocDefinition[]` discovered at config time. Plan for (b).

**Fix recommendation:** Replace the closed-enum dispatch with a `DocDefinition` interface keyed by string id, validated by Zod at the config boundary. The factory becomes `definition.build(context, options)` and the registry is `Map<string, DocDefinition>` populated from `architect.config.ts`. The compile-time exhaustiveness check is replaced by a runtime test that every documented type has a registered definition. Worked sketch:

```ts
export interface DocDefinition {
  readonly id: string;
  readonly displayTitle: string;
  readonly disclosureMatrix: DocumentationDisclosureMatrix;
  build(ctx: ProjectionContext, opts: DocDefinitionBuildOptions): ProjectionBundle<Fragment>;
}
// resolve at boundary, no closed union
function assertSupportedDocumentType(id: string, registry: ReadonlyMap<string, DocDefinition>) { ... }
```

### C2. Disclosure matrix and registry shape conflate four orthogonal concerns
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts:35-47` plus `:71-138`

`SupportedDocumentationTypeRegistryEntry` collapses *(a) identity* (`key`, `displayTitle`, `description`), *(b) output routing* (`rootRouteId`, `markdownRootTarget`, `childDirectory`), *(c) disclosure policy* (`defaultDisclosureLevel`, `disclosureMatrix`), and *(d) CLI surface* (`generatorName`, `generatorAliases`) into one Zod object. The 12 `xxxDisclosureMatrix` constants and 12 registry entries are kept in sync purely by hand — there is no relationship between an entry's `key` and its matrix-constant name beyond convention.

**Why it matters for the campaign:** The campaign explicitly separates *Extractors / Routing / Composition / Output-routing* (DEEP-DIVE §"Three orthogonal layers"). The current shape forces every new `DocDefinition` to fill all four buckets in one place, and forces `documentation-types.ts` to expand instead of contracting. It also makes multi-target output (`docs-live/` + `_claude-md/` + JSON) hard to express — `markdownRootTarget` is a single string today.

**Fix recommendation:** Split the registry entry into three composed Zod schemas — `DocIdentity`, `DocOutputTargets` (`Record<TargetKind, OutputTarget>` so multi-target becomes natural), and `DocDisclosurePolicy`. Make the `disclosureMatrix` an explicit field on the `DocDefinition` so a definition file owns its own policy rather than the central registry. This also unblocks ContentFragment input-side disclosure (which today has nowhere to live).

---

## High

### H1. Hand-rolled `SUPPORTED_DOCUMENTATION_TYPES`/`DOCUMENTATION_TYPE_REGISTRY` derivations are inverted Zod-first
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts:140-340`

The registry is authored as a hand-written `const` array, then run through `DocumentationTypeRegistryEntrySchema.parse(entry)` *at module top level* (`:342-344`). The exported types are derived from the literal via `(typeof DOCUMENTATION_TYPE_REGISTRY)[number]` rather than from the schema — the schema is only used as a runtime assertion, not as the canonical type source. This is the inverse of the repo's Zod-first doctrine ("types flow from schemas via `z.infer`").

**Why it matters for the campaign:** When DocDefinitions arrive from user config (`architect.config.ts`), they must round-trip through Zod at the boundary. If the schema isn't the type source today, the campaign will end up with two parallel definitions of "what is a doc registry entry" — the literal type and the schema — and they will drift.

**Fix recommendation:** Make `SupportedDocumentationTypeRegistryEntry` (already `z.infer`'d at `:67`) the canonical type, type the array as `readonly SupportedDocumentationTypeRegistryEntry[]`, and lose the literal-derived `InternalDocumentationTypeMetadata`. The compile-time exhaustiveness check is replaced by a Zod refinement that every key is unique.

### H2. Dropped-type registry exists only to throw — pure dead weight
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts:294-339`, `documentation-bundle.internal.ts:82-87`

The four `status: 'dropped'` entries (`reference`, `product-areas`, `design-review`, `product-requirements`) exist *only* so that `assertSupportedDocumentType` can throw a slightly more helpful error. The "dropped" branch of `DocumentationTypeRegistryEntrySchema` (`:49-59`) carries `markdownRootTarget: z.null()` and `generatorName: z.null()` — Zod gymnastics to model "this is not a thing." This is a no-BC shim (`status: 'dropped'` is a compatibility nudge for callers that haven't migrated). The repo doctrine is explicit: no-BC, no `@deprecated` shims.

**Why it matters for the campaign:** The campaign restores the `reference` capability under a different shape (codec catalog via `DocDefinition`). Keeping a `status: 'dropped'` entry for `reference` will be actively confusing once the new `reference` doc exists. The whole dropped-type concept must go before the campaign starts.

**Fix recommendation:** Delete `DroppedDocumentationTypeRegistryEntrySchema`, `DROPPED_DOCUMENTATION_TYPE_REGISTRY`, `isDroppedDocumentationType`, and the dropped-branch error in `assertSupportedDocumentType`. Replace with a single "unknown type" error path — the registry only contains live entries.

### H3. Renderers reach into projection-internal modules for type and metadata access
**File:** `packages/architect-projection/src/renderers/render-markdown.ts:50-52`, `markdown-paths.ts:3-4`, `renderers/types.ts:2`

`renderers/` imports `getDocumentationTypeMetadata` from `projections/documentation-composition/documentation-types.js` and `DisclosureSpec` from `projections/documentation-composition/disclosure-spec.js`. The renderer layer is supposed to be document-agnostic — it consumes `Fragment`/`ProjectionBundle` plus a `routeProfile`. Today the markdown renderer special-cases bundle routing by parsing `routing.rootRouteId.split(':')[0]` and looking up the document type's disclosure matrix (`render-markdown.ts:400-420`). That's a layering inversion: routing/disclosure policy lives in the projection layer but is *read* by the renderer.

**Why it matters for the campaign:** When `DocDefinition` becomes the substrate, disclosure policy and routing move to the definition object. Renderers will need a clean injection point, not a deep import into the documentation-composition module. The current coupling is also a circular-import risk if/when documentation-composition starts depending on renderer-visible types.

**Fix recommendation:** Have `projectDocumentationBundle` (or `DocDefinition.build`) attach the resolved `DisclosureSpec` directly to the `ProjectionBundle.routing` metadata, so the renderer no longer parses `rootRouteId` strings or looks up metadata. The renderer becomes truly document-agnostic and the projection→renderer dependency edge becomes one-way.

### H4. Hardcoded doc-type strings leak across files instead of staying in the registry
**File:** `packages/architect-projection/src/renderers/markdown-paths.ts:26-49`, `delivery-reporting/index.ts:121,402`

`markdown-paths.ts` carries the special case `if (route.documentType === 'requirements-executable') { ...INDEX.md }` (`:26-27`) and `if (documentType === 'milestones') return 'COMPLETED-MILESTONES.md'` (`:48-49`). The `delivery-reporting/index.ts` projection threads a `view === 'milestones'` literal that doesn't appear in the registry at all (`:402`). These are routing decisions that should live as data on the registry entry (e.g., `pathStrategy: 'index-per-entity'`), but instead leak across three files.

**Why it matters for the campaign:** Every new generated doc the campaign adds will multiply this leakage. The `DocDefinition` API can't replace the registry cleanly if routing rules are scattered through the renderer's path-resolution code.

**Fix recommendation:** Push the `requirements-executable` index-per-entity behaviour onto the registry entry as a `childPathStrategy: 'index-per-entity'` (or move it into a `DocDefinition.resolvePath()` method). Delete the `'milestones'` upper-case fallback — that code path is for an unregistered doc-type, which should be impossible once `DocDefinition` lands.

### H5. `render-markdown.ts` is 2152 lines and 80 top-level functions — single-responsibility violation
**File:** `packages/architect-projection/src/renderers/render-markdown.ts` (entire file)

Ten `normalize*Fragment` functions (`:521-1042`) plus a 90-line generic-fragment fallback plus a markdown-trust-boundary subsystem (`:1855-2052`) plus path-rewriting (`:1482-1547`) plus oversized-document splitting (`:2054-2102`) plus the entry-point bundle/document machinery all share one module. Cyclomatic complexity is high in `normalizeBusinessRuleSet` (`:549-595`), `normalizeRequirementDigest` (`:820-870`), and `splitOversizedDocument` (`:2054-2102`).

**Why it matters for the campaign:** ContentFragment adds *six to ten more `normalize*Fragment` functions* (stub format, FSM transitions, block-type catalog, Zod schema field tables, CLI catalog, etc.). Bolting those into a 2152-line file is a maintenance landmine. The cohesive way to add them is via a kind→normalizer registry that ContentFragments populate.

**Fix recommendation:** Move the per-fragment normalizers (`MARKDOWN_NORMALIZERS` table at `:181-192`) out of the renderer module into `fragments/<domain>/markdown.ts` siblings, so each fragment owns its own normalizer. Renderer becomes the engine, fragments own their rendering. (This is *exactly* the layering ContentFragment will need.)

### H6. `RenderableDocument` envelope (`MarkdownDocument`) is unexported and unschema'd
**File:** `packages/architect-projection/src/renderers/render-markdown.ts:62-67`

The intermediate document shape — what every `normalize*Fragment` returns — is an unexported `interface MarkdownDocument { title; purpose?; detailLevel?; sections: MarkdownRenderableBlock[] }`. The `MarkdownRenderableBlock` union (`:132-138`) mixes user-provided `Block` types with five `Trusted*Block` variants that carry the `TRUSTED_MARKDOWN` symbol. There's no Zod schema.

**Why it matters for the campaign:** The DEEP-DIVE describes `composeDoc(title, sections)` and ContentFragments returning `SectionBlock[]` — these are the same concept that lives unnamed inside the renderer today. Without an exported `RenderableDocument` schema, the campaign has to invent one and reconcile it with `MarkdownDocument`. Two competing envelope types is a guaranteed source of drift.

**Fix recommendation:** Export `RenderableDocument` (or `MarkdownDocument` renamed) as a Zod schema in `blocks/schema.ts` (or a new `blocks/document.ts`), and reuse it as both the per-fragment normalizer output and the ContentFragment composition target. Trusted-block variants stay internal to the renderer.

---

## Medium

### M1. `freezeDocumentationTypeMetadata` recursion is manual and brittle
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts:411-456`

Five separate freeze functions hand-walk the metadata tree (entry → matrix → spec → filter → maturity/status arrays). Adding a new field requires editing every freeze step. The pattern exists because TypeScript's `as const satisfies` doesn't deep-freeze, but the manual freeze chain is fragile.

**Why it matters for the campaign:** `DocDefinition` will add `outputTargets`, `extractors`, and possibly `contentFragments` fields, each of which would need its own freeze function.

**Fix recommendation:** Replace with a generic `deepFreeze<T>(value: T): T` helper (one function, recursive), or rely on `Object.freeze` plus `readonly` types and skip runtime freezing entirely (the `as const` already prevents mutation at the type level).

### M2. `disclosureMatrix()` helper silently injects defaults that the spec doesn't see
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts:476-493`

`disclosureMatrix(matrix)` substitutes `DEFAULT_COMMITTED_FILTER` / `DEFAULT_USEFUL_FILTER` for missing filters and strips advanced-level filters via `omitFilter`. The resulting object is then `as const satisfies readonly DocumentationTypeRegistryEntry[]` (`:340`) — but the values inside the matrix are *different* from what the author wrote.

**Why it matters for the campaign:** ContentFragments will compose at multiple disclosure levels; if the disclosure level the author writes is silently rewritten, fragment-level disclosure won't match doc-level disclosure. This is a sharp gotcha for the new author surface.

**Fix recommendation:** Make defaults explicit on the schema (`.default(DEFAULT_COMMITTED_FILTER)`), not in a transformation helper. Or drop the helper entirely and require authors to be explicit.

### M3. `resolveProjectName` is called twice in `buildProjectConfigSnapshot`
**File:** `packages/architect-projection/src/projections/documentation-composition/project-config.internal.ts:58-60`

```ts
...(resolveProjectName(context, options.projectName) !== undefined
  ? { projectName: resolveProjectName(context, options.projectName) }
  : {}),
```

Cheap function, but the pattern is wrong and recurs in several `Object.assign`-style spreads across the projection code.

**Fix:** Hoist to a local `const name = resolveProjectName(...)`, then spread `...(name !== undefined ? { projectName: name } : {})`.

### M4. `MARKDOWN_NORMALIZERS` table is missing the `ProjectConfigSnapshot`, `PrChangeReview`, `ArchitectureNeighborhood`, `PatternCatalog`, `RoleProfile*`, and several other fragment kinds
**File:** `packages/architect-projection/src/renderers/render-markdown.ts:181-192`

Only 10 of the ~30 fragment kinds have dedicated markdown normalizers. The rest fall through to `normalizeGenericFragment` (`:1042-1133`), which generates a fragile reflection-based table dump.

**Why it matters for the campaign:** Multi-target generation will route many more fragments through markdown. Pattern-catalog, taxonomy, decision-record, etc. ship structured data that deserves a typed normalizer — generic-fallback markdown for production docs is technical debt the campaign will trip over.

**Fix recommendation:** Audit `MARKDOWN_NORMALIZERS` against the `Fragment` union; add explicit normalizers for every fragment kind that ships into a documented doc. (Tracks well alongside H5's "move normalizers into fragment-owned modules" refactor.)

### M5. `RawProjectDocumentationBundleOptionsSchema` duplicates the typed schema
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:48-53`

Two schemas exist for the same input: `ProjectDocumentationBundleOptionsSchema` (typed `documentType`) and `RawProjectDocumentationBundleOptionsSchema` (`documentType: z.string()`). The typed schema is never used at the boundary — `parseAndProject` only invokes the raw one. The typed one only exists for re-export and the inferred `ProjectDocumentationBundleOptions` type.

**Why it matters for the campaign:** Once the closed `SupportedDocumentationType` union goes away (C1), this raw/typed split becomes meaningless. Cleaning it up unblocks a single uniform schema.

**Fix recommendation:** Collapse to one schema: `documentType: z.string()` with a `.refine(isRegisteredDocType, ...)` runtime check. The `SupportedDocumentationType` type alias becomes `string`.

### M6. Generic-fragment markdown fallback reflects on arbitrary objects
**File:** `packages/architect-projection/src/renderers/render-markdown.ts:1042-1133`, `1184-1255`

`normalizeGenericFragment` walks the fragment with `Object.entries`, dispatching on `isBlockArray`, `isPrimitiveLike`, `toTabularRows`, then `humanizeKey`-ing field names into headings. It's a reflection-based reader that has no relationship to the Zod schema for the fragment.

**Why it matters for the campaign:** When the campaign adds Zod-schema → field-table extraction (DEEP-DIVE Q1), it will conflict with this generic reflection path. Pick one — and the schema-driven path is correct.

**Fix recommendation:** Drop the generic fallback in favour of "every fragment kind has a registered normalizer" (M4). For Zod-schema field tables, write a dedicated extractor that walks the schema, not the value.

### M7. `_internal/format-utils.ts` is shared between renderers and projection support without documented contract
**File:** `packages/architect-projection/src/_internal/format-utils.ts` + four import sites

`humanizeKey`, `isPrimitive`, `sortValue`, `stableStringify` are imported from `_internal/` by three renderers. `_internal/` is the trust-boundary helper directory per scope. Mixing rendering utilities and trust-boundary helpers in the same namespace risks accidentally exposing the latter.

**Why it matters for the campaign:** The campaign will add more shared helpers (slug, field-table formatters). Putting them in `_internal/` will further blur the boundary.

**Fix recommendation:** Move pure formatting utilities into `blocks/format.ts` or `renderers/_shared/format.ts`; keep `_internal/` strictly for trust-boundary helpers (slug, escape, sanitize).

### M8. `MarkdownDocument` title resolution conflates derivation strategies
**File:** `packages/architect-projection/src/renderers/render-markdown.ts:1182-1276` (`resolveFragmentMetadata`, `deriveTitle`, `getRoadmapViewTitle`)

The metadata-resolution path tries six different sources in order (`fragment.title`, `fragment.label`, `fragment.name`, `getRoadmapViewTitle`, `humanizeKey(kind)`, …). It's a search-the-haystack approach that works today by virtue of the fragments having consistent shape.

**Why it matters for the campaign:** ContentFragments will have explicit titles per disclosure level. Routing those through the existing search path is fragile.

**Fix recommendation:** Each fragment normalizer returns its own `{title, purpose, detailLevel}` (it already mostly does). Delete the generic search path or scope it to the generic-fallback case only.

### M9. `documentation-types.ts` at 517 LOC is the largest file in the campaign hot zone
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-types.ts`

517 lines housing four concerns: Zod schemas, registry data, freeze helpers, filter resolution. Three of those (schemas, freeze helpers, filter resolution) are cross-cutting; only the registry data is doc-specific.

**Why it matters for the campaign:** When `DocDefinition` replaces the registry, this file must shrink dramatically — the schemas stay, the data goes (to `architect.config.ts` and per-package `*.doc.ts` files). If schemas + helpers stay tangled, the campaign's migration step ends with a file that's still 300+ lines of legacy.

**Fix recommendation:** Split into `documentation-types.schema.ts` (Zod schemas + types, no data), `documentation-types.registry.ts` (the literal array), `documentation-types.freeze.ts` (or replace with generic deepFreeze per M1), and `disclosure-filter.ts` (resolve-projection-filter). Done before the campaign so the campaign only edits the registry file.

---

## Low

### L1. `parseLogicalRouteId` returns three different shapes, callers re-discriminate
**File:** `packages/architect-projection/src/renderers/markdown-paths.ts:55-91`

The function returns a discriminated union but `resolveLogicalRoutePath` (`:12-40`) uses a string of `if (route.kind === 'index')` / `if (route.kind === 'entity')` ladders. Switch-with-exhaustiveness would catch missing cases at compile time.

**Fix:** Replace `if/if/if` with `switch (route.kind)` so adding a new route kind is a TS error.

### L2. `isBundle` runtime predicate accepts shapes the type system already guarantees
**File:** `packages/architect-projection/src/fragments/base.ts:21-39`

`isBundle` re-validates the shape (root is fragment-like, children is plain object, every value is fragment-like) on every call. Used in every renderer entry point. With Zod-first parsing at the projection boundary, this is parse-twice.

**Why it matters for the campaign:** Per-doc fan-out (5–10× projection calls) per the perf flag in the scope means `isBundle` is on a hot path.

**Fix:** Replace the deep check with `typeof value === 'object' && value !== null && 'root' in value && 'children' in value && !('kind' in value)` — fragments have `kind`, bundles don't. Or trust the parse-once doctrine and lift this out of renderer entry.

### L3. `BlockSchema` and `Block` interface are declared independently
**File:** `packages/architect-projection/src/blocks/schema.ts:3-71` (interfaces) vs `:73-152` (schemas)

The block types are hand-written `interface` declarations *and* hand-written `z.strictObject` schemas. They are not connected by `z.infer`. This is the same Zod-first violation as H1 but in the blocks layer.

**Why it matters for the campaign:** ContentFragments emit `SectionBlock[]` — exactly these blocks. Two declarations of the same type doubles the risk of drift when new block types are added (the campaign may add `field-table` or `code-with-callouts`).

**Fix:** Make `Block = z.infer<typeof BlockSchema>` canonical, delete the parallel interfaces. Block-constructor helpers (`heading()`, `paragraph()`, …) keep their explicit return types.

### L4. `documentation-bundle.ts` is a 47-line wrapper that only re-exports from `.internal.ts`
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts`

Every public bundle function delegates one-to-one to its `.internal.ts` counterpart. The `.internal.ts` distinction is meaningful in some files but here it's pure indirection — the JSDoc lives on the wrapper, the code lives on the internal.

**Why it matters for the campaign:** Once `DocDefinition` lands, this whole indirection is going away. Worth noting now so the migration doesn't preserve it.

**Fix recommendation:** Inline `projectDocumentationBundleInternal` into `documentation-bundle.ts`; promote the schema/types from internal. Apply the same simplification once campaign rewrites the dispatch.

### L5. `documentation-composition-shared.internal.ts` carries only two helpers (`dedupeStrings`, `hasText`)
**File:** `packages/architect-projection/src/projections/documentation-composition/documentation-composition-shared.internal.ts`

`hasText` is reimplemented at `render-markdown.ts:1555-1557` (different file, same name, same behaviour). `dedupeStrings` is reimplemented at `render-markdown.ts:1559-1574`.

**Why it matters for the campaign:** Code-search-driven copy is how triplicates start. New extractors will keep reimplementing these.

**Fix recommendation:** Hoist `hasText` and `dedupeStrings` to `_internal/format-utils.ts` (or a `_internal/strings.ts`), import everywhere.

---

## Summary of campaign impact

- **Critical** findings (C1, C2) block the `DocDefinition` migration directly — the closed-enum dispatch table and the multi-concern registry shape must be opened up before the new API can replace them.
- **High** findings (H1–H6) describe the structural rework the campaign must perform anyway: Zod-first registry, deletion of the dropped-type shim, renderer/projection decoupling, hardcoded-route-type removal, splitting the 2152-line render-markdown into fragment-owned normalizers, and exporting `RenderableDocument`. Doing them before the campaign converts most of the campaign's "Wave 4" work into pure DocDefinition authoring.
- **Medium** and **Low** are cleanups that get strictly worse as new extractors and fragments arrive — best resolved in the same sweep that fixes C1/C2.
