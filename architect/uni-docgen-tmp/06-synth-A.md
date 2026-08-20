# Synth A — "It's already built: generalize the architecture pattern" (minimalist pole)

**Task:** pressure-test whether the repo already contains the universal engine, by re-expressing the taxonomy cluster + RFC + skill as instances of the shipped `buildArchitectureDiagram` / `ProjectionBundle` pattern; quantify what deletes; report where it breaks.

## Verdict (one paragraph)

**The structural half of "universal" is already built and the taxonomy cluster is a parallel re-implementation of it.** `ProjectionBundle{root, children}` + a single `scope`-parametrized builder + the optional `emission` overlay already give you: lens fan-out, keyed child routing, and embedded-region file placement. `planRegions` / `TAXONOMY_FUNCTION_GROUPS` / `TAXONOMY_EMBEDDED_GENERATORS` are a bespoke restatement of exactly that machinery and **collapse onto it almost entirely**. BUT the thesis breaks cleanly at one seam: the architecture pattern only ever projects facts that are **already graph-resident** (`role`/`status`/`level`/`boundedContext` all live on the pattern node). It has _nothing_ to offer where the fact is not yet in the read model — the RFC's tier-conditional `Required` modality lives in `architect-guard`, not the graph. And — the sharp part — **the shipped architecture fragment itself fails the demanding-sink test**, so "generalize it as-is" would _propagate_ the J1/F2 flattening bug to taxonomy. Taken seriously, the minimalist path is _forced_ into one refactor: stop flattening, carry structured nodes/rows, let the renderer do the join. That refactor turns `ArchitectureDiagram` into a target-neutral view model — the minimal path and the principled path converge.

---

## 1. The universal engine that already ships

Three shipped primitives, no new layer:

```ts
// fragments/base.ts:38-48 — the universal container
interface ProjectionBundle<T> {
  root: T;
  children: Record<string, Fragment>; // ← lens fan-out, keyed by route-id
  routing?: BundleRouting; // logical (sink-agnostic)
  emission?: EmissionDescriptor; // ← optional file-sink overlay (whole-artifact | embedded-region)
}
```

```ts
// design-review.ts:116-188 — a "View" = ONE builder, scope+flags-parametrized, fanned out as a bundle
buildArchitectureDiagram(ctx, {
  scope,
  includeWorkingState,
  excludeTestFeatures,
  annotateStatus,
  presentation,
});
// architecture and design-review are the SAME fragment kind; the delta is 4 booleans + a presentation override.
// children keyed by createDesignReviewViewRouteId('by-layer') → routed to design-review/by-layer.md by childDirectory.
```

The grouping axis is a **`scope` value, not a codepath** (`ARCHITECTURE_SCOPE_TITLES`). A lens is the same fragment re-bound to a different scope. **This is the entire "manifest / composable-view" thread, shipped.**

---

## 2. Collapse map — taxonomy onto the architecture pattern

| Today (bespoke, `taxonomy-embedded.ts`)                                                                         | Is a hand-rolled restatement of                                                      | Generalized form                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `TAXONOMY_EMBEDDED_GENERATORS` (static host manifest)                                                           | the doc-type registry entry + `ProjectionBundle.emission`                            | one registry row → one bundle with an embedded-region descriptor                                     |
| `planRegions(generator)` (switch → regions)                                                                     | `ProjectionBundle.children` fan-out (`buildDesignReviewBundle`'s lens loop)          | `children` keyed by region-id; **no switch**                                                         |
| `TAXONOMY_FUNCTION_GROUPS[source] = tags`                                                                       | architecture's `scope` selecting a node set                                          | a `scope`/selection arg on `buildTaxonomyView`, resolved against the digest                          |
| host marker `<!-- architect:gen taxonomy-classification -->`                                                    | design-review's child route-id `by-layer` → `design-review/by-layer.md`              | the marker **is** the child-route-id; emission mode is `embedded-region` instead of `whole-artifact` |
| renderer `buildTaxonomyRegionBlocks(digest, source)` switch                                                     | the markdown renderer already rendering `ArchitectureDiagram.sections[]` generically | render structured `sections[]`; drop the source-dispatch                                             |
| 4 widened barrel exports (`TAXONOMY_CLASSIFICATION_SOURCE/_TAGS`, `_FORMAL_SPEC_GENERATOR`, `_FUNCTION_GROUPS`) | (nothing — dead surface)                                                             | delete                                                                                               |

So the taxonomy cluster becomes structurally identical to design-review:

```ts
// the whole taxonomy family, expressed in the existing pattern
function buildTaxonomyBundle(ctx): ProjectionBundle<TaxonomyView> {
  const root = buildTaxonomyView(ctx, { scope: 'all' }); // = docs-live/TAXONOMY.md (whole-artifact)
  const children = {
    'taxonomy-classification': buildTaxonomyView(ctx, {
      scope: ['product-area', 'bounded-context', 'role'],
    }),
    'taxonomy-relationships': buildTaxonomyView(ctx, {
      scope: ['uses', 'implements', 'extends', 'see-also'],
    }),
  };
  return { root, children, emission: formalSpecEmbeddedDescriptor }; // host = 04-tag-registry.md, regions[] = child keys
}
// the skill is the SAME bundle's view under a second emission descriptor (different host + region set):
//   one View → N (audience × emission) — the epic's "family", realized as ProjectionBundle + N emission overlays.
```

**Nothing here is new.** `projectSingle` + the embedded-region descriptor + child-keyed routing are all shipped. The "function group" is just a `scope`.

---

## 3. The three regenerations

### (1) architecture `by-theme` — with the node-label join surviving structured (the one real refactor)

Today the join is computed then destroyed (`architecture-graph.internal.ts:146-169`): `status`/`level` go into `classifierParts` → `<br/>(level · role · status)` baked into the mermaid string; `NodeShape` (`:162-171`) carries `role` but **not `status`/`level`**. The fragment's `patterns[]` is a bare `string[]`. A Studio view cannot recover status/level. **Fix = defer the join to the renderer:**

```ts
// Zod: section gains a structured node array; the mermaid string stops being the carrier
ArchitectureNode = z.strictObject({
  name: z.string(), role: z.string().optional(), status: z.string(),
  level: z.string().optional(), boundedContext: z.string().optional(), usedByCount: z.number(),
});
ArchitectureSection.nodes: ArchitectureNode[]   // replaces/augments patterns[]: string[]
// section.diagram.content is NO LONGER stored; the markdown renderer builds it from nodes[]:
renderMermaidLabel(n) = `${esc(n.name)}<br/>(${[n.level, n.role, n.status].filter(Boolean).map(esc).join(' · ')})`
```

The `·`/`<br/>`/`( )` move from the _fragment_ to the _renderer_ (where the ADR-009 raw-content seam already lives). **Byte output stays identical → determinism gate green; the JSON gains structure → demanding-sink test passes.** This is the only genuinely-new machinery, and it is a No-BC refactor of shipped code (`architecture-graph.internal.ts`, `render-markdown.ts`, the `ArchitectureDiagram` schema).

### (2) taxonomy `Classification` region — with a real tier-conditional `Required`

The structure generalizes for free (a `TaxonomyView` with structured rows, mirroring `nodes[]`):

```ts
TaxonomyRow = z.strictObject({
  tag: z.string(),
  format: z.string(),
  purpose: z.string(),
  values: z.array(z.string()),
  example: z.string(),
  requiredness: ModalitySchema, // ← NOT z.boolean()
});
```

**But here the architecture pattern runs out.** `requiredness` cannot be a flat bool _or_ a graph field, because the modality is **tier-conditional and lives in `architect-guard`** (`idea-tier-checks.ts`: "required at idea tier, waived for epic/slice"), not in the PatternGraph. The architecture pattern only projects facts already on the node; it has no mechanism to source a guard rule. So Synth A can only emit a **placeholder**:

```ts
requiredness: { kind: 'ruleRef', ruleId: 'tier-requiredness/product-area' }   // resolved by… not this anchor
```

→ rendered as `at idea tier` once a source exists. **This is the break (see §5).** The minimalist anchor proves the _table_ generalizes and proves the _modality is orthogonal to it_.

### (3) lens fan-out + host-marker mechanism

Already shipped (§2): `ProjectionBundle.children` keyed by region-id, written via the `embedded-region` emission descriptor (`{ mode, hostFile, regions[] }`). The marker `<!-- architect:gen <regionId> -->` is the child-route-id reference — the embedded analog of `childDirectory` routing. The skill = a second emission descriptor over the same View. No new mechanism.

---

## 4. Deletes / News / Cost

|            | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DELETE** | `planRegions`, `TAXONOMY_FUNCTION_GROUPS`, `TAXONOMY_{CLASSIFICATION,RELATIONSHIPS}_{SOURCE,TAGS}`, `TAXONOMY_{SKILL,FORMAL_SPEC}_GENERATOR`, `TAXONOMY_EMBEDDED_GENERATORS`, `TaxonomyEmbeddedShape`/`buildEmbeddedShape`/`projectTaxonomyEmbeddedShapes` (most of `taxonomy-embedded.ts`); `buildTaxonomyRegionBlocks` source-switch + `buildTaxonomyFunctionGroupTable` (`render-markdown.ts`); the 4 widened barrel exports; the CLI `generate-docs.ts` embedded-generator track that iterates the static manifest (replaced by the generic bundle+emission write path the descriptor was built for). |
| **NEW**    | the J1 defer on the architecture fragment (structured `nodes[]`, renderer-side mermaid) — **the only real new machinery**; `buildTaxonomyView(ctx, {scope})` emitting structured rows (mirrors `buildArchitectureDiagram`); a `ModalitySchema` _placeholder_ whose resolution is out of scope.                                                                                                                                                                                                                                                                                                            |
| **COST**   | Structural collapse: net-negative LOC, mechanical. The J1 refactor: bounded, byte-stable, ~3 files. The modality: **0 from this anchor** — it cannot be done here.                                                                                                                                                                                                                                                                                                                                                                                                                                        |

---

## 5. Weakest assumption + where it breaks (the keep/drop signal)

- **Weakest assumption:** "the architecture pattern generalizes to all corpus content." It generalizes to any content whose facts are **already graph-resident**. The structural machinery (fan-out, keyed children, emission, scope-selection) is genuinely _done_ — concern #2 is largely solved by existing code, and the taxonomy bespoke registry is redundant. But the pattern is **silent on rules-as-data**: the moment a column needs a fact that isn't on the node (tier-conditional `Required`), the architecture analogy contributes nothing. So the honest division: **manifest/composable-view = SOLVED by what ships; rules-as-data = orthogonal and untouched.**
- **The second break is inside the "already built" code itself:** the shipped architecture fragment flattens J1/F2, so generalizing it _as-is_ would carry the bug into taxonomy. Taking the minimalist position seriously therefore _forces_ the target-neutral-view-model refactor (stop flattening; structured nodes/rows; renderer owns the join). **Minimal path ⇒ principled path.** That convergence is the most useful thing this anchor produces: you do not need a new framework, you need to stop the existing fragment from pre-rendering.
- **Net keep/drop read:** KEEP the engine — it exists. The taxonomy slice should be _deleted down_ onto `ProjectionBundle` + emission, not extended. The unsolved remainder is exactly one thing: getting the guard's rule into the read model so a `requiredness` column has a source. That is a different anchor's job (rules-as-data), and this exercise sharpens _why_ it is the only real open question.

---

**Provenance:** `fragments/base.ts:38-48`, `design-review.ts:92-188`, `architecture-graph.internal.ts:106-173`, `supporting.ts:134` (`required: boolean`), `taxonomy-embedded.ts` (the bespoke registry), essence doc §4/§5/§6.
