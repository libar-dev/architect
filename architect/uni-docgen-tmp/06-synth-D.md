# Synth D — Selection-by-key marker + one resolver (the mechanism pole)

> North star: **Reduce to Essentials.** Anchor: invert the per-generator double-entry so a host
> marker is a _schema-validated reference to a named view_, resolved through one shared view
> registry by a single generic resolver. Sketch, not code. Grounded in the live tree.

## 0. The double-entry, named precisely (the thing to kill)

To add ONE generated region today you edit two surfaces that must agree by hand:

| Surface          | What it declares                                                                                                                                                     | File                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Host `.md`**   | the `regionId` (dumb id) via `<!-- architect:gen taxonomy-classification begin -->`                                                                                  | `formal-spec/04-tag-registry.md:70`                                  |
| **TS "brain"**   | the same id again + what feeds it: `planRegions` switch arm, `TAXONOMY_EMBEDDED_GENERATORS`, `TAXONOMY_FUNCTION_GROUPS`, `TAXONOMY_*_SOURCE`/`_TAGS`, widened barrel | `taxonomy-embedded.ts:108-156,210-232`, `projections/index.ts:95-99` |
| **CLI resolver** | a taxonomy-hardcoded render path: `projectTaxonomyEmbeddedShapes` → `renderTaxonomyManagedRegion(digest, source)`                                                    | `generate-docs.ts:151-159,770-801`                                   |
| **Descriptor**   | the `regions[]` routing map, _authored in TS_ and Zod-validated                                                                                                      | `emission-descriptor.ts:188-214`                                     |

Adding `Relationships` (Experiment A) cost 3 TS edits + markers. That's the linear-in-regions growth — the "documentType-first star" relabeled "region-first." The id lives in **four** places; the host is the dumbest of the four.

## 1. The inversion — the host declares; the TS resolves

Make the marker a **reference to a named view**; the id lives **once**, in the host, and is the region id:

```
<!-- architect:gen view=taxonomy.classification begin -->
…generated…
<!-- architect:gen view=taxonomy.classification end -->
```

Generation becomes ONE generic resolver over the whole repo:

```ts
// the entire embedded track, de-hardcoded
async function regenerateEmbedded(graph: PatternGraph, repo: string) {
  for (const host of await scanHostsWithViewMarkers(repo)) {
    // grep `architect:gen view=`
    let text = await read(host);
    for (const m of parseViewMarkers(text)) {
      // Zod-parsed, see §2
      const view = VIEW_CATALOG[m.viewId]; // resolve by key (§3)
      const bundle = view.project(graph, m.audience); // SINK-AGNOSTIC ProjectionBundle
      const body = renderRegionBody(bundle); // shared block renderer
      text = applyManagedRegion(text, m.regionId, body, host); // reuse managed-region.ts unchanged
    }
    await write(host, text);
  }
}
```

`view.project()` returns the _same_ `ProjectionBundle` the API/MCP and Studio sinks consume — the
markdown region is one rendering of it, never a markdown-only path (demanding-sink test, §6).

## 2. The marker grammar (Zod, parse-once) — and the no-DSL line

The marker payload is parsed once at the trust boundary. The grammar can **reference + profile**,
never **define content**:

```ts
export const ViewMarkerSchema = z.strictObject({
  viewId: z.enum(VIEW_CATALOG_IDS), // closed set = keys(VIEW_CATALOG); unknown id → loud fail
  audience: z
    .strictObject({
      // OPTIONAL profile selectors (DITAVAL-style)
      disclosure: ProgressiveDisclosureLevelSchema.optional(), // essential|important|useful|advanced
      scope: z
        .string()
        .regex(/^[a-z0-9-]+$/u)
        .optional(), // theme|layer|package|context — validated against the view
    })
    .partial()
    .optional(),
});
// marker line: architect:gen view=<dotted.id> [disclosure=essential] [scope=theme] begin
```

**The precise line (the honesty the directive demands):**

| Marker carries                             | Verdict       | Why                                                                                                |
| ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `view=taxonomy.classification`             | ✅ allowed    | a _reference_ — DITA `conkeyref`. Names a view; does not define it.                                |
| `disclosure=essential`, `scope=theme`      | ✅ allowed    | a _profile selector_ from a fixed enum — DITAVAL. Picks an audience; does not author content.      |
| `select=product-area,bounded-context,role` | ❌ **banned** | enumerates content _in the doc_ — this is the inline composition / per-region DSL ADR-010 forbids. |
| `transform=…`, `where=…` (GPT's YAML)      | ❌ **banned** | an expression language authored in the doc — the smuggling path `EmissionDescriptor` DD-3 names.   |

The Zod grammar is what **keeps** it on the right side: there is no production that admits a content
list or an expression — `viewId` is an enum, `audience` keys are a fixed enum, values are enum/regex.
You _cannot_ author a view from a marker; you can only point at one. That is the difference between
Markdoc "Docs as Data" (a tag with a fixed schema) and MDX (arbitrary logic) — we are squarely the former.

**Where it crosses (conceded):** the moment someone wants a one-off region that isn't a named view and
reaches for `select=…`, the grammar must _refuse_ and force them to register a view. That friction is
the guardrail, and it's a real ergonomic cost for genuinely single-use facts (today's free `source`
string is lighter). For a corpus of _similar documents from shared sources_ (the epic's whole premise)
this is correct; for a true one-off it's heavier. I take that trade deliberately.

## 3. The catalog — one shared view registry, NOT a doc-specific hand-list

The catalog is the crux: if it's a bespoke list for docs, I've only **moved** the double-entry. The
escape is that **the view registry has to exist anyway** — the API/MCP/Studio sinks need to enumerate
and resolve views (the `ReadModelReflexivity` member). So the marker is just _one more consumer_ of the
registry every sink already reads; it adds zero net bookkeeping.

```ts
type ViewDef = {
  select: (g: PatternGraph) => Slice;          // a read-model slice (composable helper — NOT a string)
  shape:  ShapeRef;                            // a helper ref: functionGroupTable(tags) | archDiagram(scope)
  audienceDefaults: DisclosureSpec;
};
export const VIEW_CATALOG: Record<ViewId, ViewDef> = {
  'taxonomy.classification':            { select: taxonomyDigest, shape: functionGroupTable(['product-area','bounded-context','role']), audienceDefaults: … },
  'taxonomy.relationships':             { select: taxonomyDigest, shape: functionGroupTable(['uses','implements','extends','see-also']), audienceDefaults: … },
  'architecture.by-theme':              { select: architectureDiagram, shape: archDiagram('theme'),  audienceDefaults: … },
  // …one entry per DISTINCT view, shared across all sinks
};
```

**Reflexivity — how far it honestly goes.** The set of legal marker ids = `keys(VIEW_CATALOG)`, so the
marker enum _is_ derived from the registry (unknown id → loud). But the catalog **entries themselves**
stay authored: full derivation would require the function-group grouping to live in the read model
(e.g. each tag carries `functionGroup:classification`), and that **leaks an audience grouping into the
source** — which the epic's "Resolved direction (2026-06-05)" explicitly forbids ("audience grouping is
a View-level read, not a source leak"). So I **concede**: I do not reach a zero-hand-list reflexive
catalog. I reach **one shared, flat, typed registry** instead of **N per-doc registries + a switch**.
That is the real, bounded win — and it's doctrine-clean because a _View_ is a projection-layer artifact
(it reads the source; it is not in it).

**Discipline that keeps the catalog from becoming the banned config engine:** `ViewDef` fields are
**typed values + composable-helper references** (ADR-010), never expression strings. The instant a
`select`/`transform` becomes an evaluated string, it's GPT's YAML DSL and it's crossed. The type system
enforces this — `select` is `(g) => Slice`, not `string`.

## 4. The I4 fix — distinct names make "canonical" un-ambiguous

The live collision: the `taxonomy-classification` region calls itself "the canonical enumeration"
(3 digest-emitted tags) while the authored summary calls Classification "4 canonical" tags (incl.
`arch-layer`) — one word, two sets, gate-invisible (`04-tag-registry.md:62` vs the `arch-layer` note at
`:80-88`). Selection-by-key dissolves it by **naming the sets disjointly in the catalog**:

```ts
'taxonomy.classification.digest-emitted': { … emits the 3 the digest carries … },
'taxonomy.classification.spec-canonical': { status: 'authored-not-projectable', … the 4 incl. arch-layer … },
```

A host must reference the _precise_ id. `spec-canonical` is flagged non-projectable, so the resolver
**refuses to generate it** until the digest emits the set — turning today's silent prose collision into
a catalog-level type error. One word can no longer denote two sets, because the host names a view-id,
not an adjective.

## 5. Three corpus pieces through the anchor

**(1) Mechanism / fan-out** — covered above: `view=` marker (id-once, in the host) + `VIEW_CATALOG` +
the generic resolver. The lens fan-out (`ProjectionBundle{root,children}`, `base.ts:38-40`) is unchanged
upstream; a marker just selects a child view (`architecture.by-theme`) by its id.

**(2) Taxonomy Classification (with real modality):**

```
<!-- architect:gen view=taxonomy.classification disclosure=important begin -->
```

resolves to the catalog entry above; its `shape` pulls the `Required` column from the **rule slice**
(not the flat `TaxonomyDigest.required` boolean), so the cell reads `required at idea tier` and the
_same_ view tells Studio the same thing. (That F1 fix is **not my deliverable** — see §7; my resolver
_consumes_ a target-neutral view.)

**(3) Architecture by-theme (proves slice-agnosticism):**

```
<!-- architect:gen view=architecture.by-theme begin -->
```

identical marker grammar, identical resolver, identical `applyManagedRegion`; only the catalog entry
differs (`select: architectureDiagram, shape: archDiagram('theme')`). The node join survives **structured**
— the view emits `{name, role, status, level, boundedContext, usedByCount}` and the markdown renderer
flattens to `Name<br/>(…)` _at render_, while Studio reads the struct (J1/F2 fix, again consumed not owned).
This is the proof the resolver is **not taxonomy-specific**: today `renderEmbeddedExecution` hard-calls
`projectTaxonomyEmbeddedShapes`/`renderTaxonomyManagedRegion`; the inversion makes it `view.project()`/
`renderRegionBody()`.

## 6. Demanding-sink test — passes by construction

The resolver renders a `ProjectionBundle`, never a pre-baked string. `view.project(graph, audience)` is
the _same_ call the API/MCP/Studio sinks make; markdown is one renderer over its output. So a live view
recovers J1 (`status`/`level`) and F1 (modality) from the view directly — **iff the views are
target-neutral**. The marker path neither helps nor hurts neutrality; it inherits it.

## 7. What deletes, what's new, the cost, the seam

**Deletes (No-BC):** `planRegions`, `TAXONOMY_EMBEDDED_GENERATORS`, `TAXONOMY_FUNCTION_GROUPS`,
`TAXONOMY_*_SOURCE`/`_TAGS`, `projectTaxonomyEmbeddedShapes` (→ catalog lookup), `renderTaxonomyManagedRegion`
(→ generic `renderRegionBody`), the `EMBEDDED_GENERATORS` registry + `-g`-per-generator selection, the 4
widened barrel exports — and, elegantly, **the embedded half of `EmissionDescriptor`**: the host's `view=`
markers ARE the `regions[]` routing map, discovered by scanning, so `EmbeddedRegionEmissionSchema.regions`
stops being authored TS. The host becomes self-describing (Markdoc/DITA parity). The `whole-artifact`
descriptor stays (no host to scan).

**New:** `ViewMarkerSchema` + the marker parser (trust boundary); the generic resolver (replaces the
taxonomy-specific `renderEmbeddedExecution`). `managed-region.ts` is reused; only `MARKER_PATTERN` widens
to capture `view=<dotted.id> [params]`.

**Net cost curve:** per-region for an _existing_ view → **zero TS** (pure host edit). Per genuinely-new
view → **one shared registry entry** (which also lights it up for API/Studio — not doc scaffolding).
Growth flips from _linear-in-doc-regions_ to _linear-in-distinct-views_, shared across all sinks.

**The weakest assumption (where it breaks):**

1. **The catalog is data, not a config engine** — true only while `ViewDef` stays typed values + helper
   refs. One evaluated string and it's the banned DSL. Thin line; type-enforced, but a standing discipline.
2. **Every generated region must be a first-class named view** — correct for the "similar docs from
   shared sources" corpus, friction for a true one-off. The grammar refuses `select=…` on purpose.
3. **I do not achieve full reflexivity** — the catalog entries stay authored, because deriving them
   would leak audience grouping into the source (epic violation). One shared list, not zero.

**Cross-fork seam (honest):** this anchor is the _mechanism_; it is sink-clean **only if** the views it
resolves are already target-neutral (J1 structured, F1 rule-referenced). Those are the
target-neutrality / rules-as-data forks' deliverables. Synth D **consumes** them. Composed: D collapses
the per-generator star into one keyed resolver; the other forks make the views it resolves honest.
