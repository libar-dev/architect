# Input-Content Essence — repo-reality grounding for a universal doc projection engine

**Scope:** the architecture + design-review + taxonomy doc families (`docs-live/architecture/*`, `docs-live/DESIGN-REVIEW.md`, `docs-live/design-review/*`, `docs-live/TAXONOMY.md`) reversed to their read-model essence. All claims grounded in Data API output (`pnpm -s architect:query …`) or `file:line`. These docs are projections off the **PatternGraph** (ADR-006), composed by ADR-010 helpers, never hand-authored.

**The single most load-bearing finding:** `architecture` and `design-review` are **the same fragment kind** (`ArchitectureDiagram`) produced by **the same builder** (`buildArchitectureDiagram`), differing only by four boolean option flags. The corpus is far smaller than its file count suggests.

---

## 1. Content-primitive inventory

The whole corpus is built from ~7 distinct content shapes:

| #   | Content primitive                                          | What it looks like                                                                                                              | Fed by (read-model slice / fragment)                                                                                                           |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Mermaid group-map diagram**                              | `graph LR` of grouped nodes + cross-group `-->` edges (the "Theme/Layer/Package/Context Map")                                   | `ArchitectureDiagram.sections[].diagram{type:"mermaid",content}` — built from PatternGraph patterns + `relationshipIndex`                      |
| P2  | **Mermaid component diagram (status-annotated node list)** | `graph TD` per group; each node label is `Name<br/>(role)` (architecture) or `Name<br/>(level · role · status)` (design-review) | same `ArchitectureDiagram.sections[]`; the join is **flattened into the label string** (see §4/§5)                                             |
| P3  | **Fan-in ranking table**                                   | "most-depended-on patterns, ranked by in-view dependant count" 3-col table                                                      | `ArchitectureDiagram.fanIn[]` = `{pattern, usedByCount, topConsumers[]}` — derived reverse edges (`usedBy`)                                    |
| P4  | **Cross-package context table**                            | "bounded contexts spanning >1 package" 3-col table                                                                              | `ArchitectureDiagram.crossPackageContexts[]` = `{context, packages[], patternCount}`                                                           |
| P5  | **Flat cross-ref index ("Patterns")**                      | alphabetized bullet list of every pattern name in the view, each a doc anchor                                                   | `ArchitectureDiagram.patterns[]` (bare `string[]`)                                                                                             |
| P6  | **Tag-metadata table** (taxonomy only)                     | grouped Markdown tables: Roles / Core / Relationship / Architecture / PRD / ADR / Discovery / Other / Aggregation / Format      | `TaxonomyDigest.tags[]` = `{groupName, entries[]}`; each entry `{tag,kind,purpose,format,required,repeatable,values[],defaultValue,example,…}` |
| P7  | **Prose framing + legend**                                 | the `**Purpose:** / **Detail Level:**` header, the "Each node is a group…" caption, the solid-vs-dotted-arrow `Legend`          | `ArchitectureDiagram.scope`/`legend` + the `presentation` override; static renderer strings                                                    |

There is **no** dedicated collapsible/disclosure primitive in the markdown sink — progressive disclosure is realized upstream as a **status filter on the source slice** (§3), not a `<details>` block.

---

## 2. Source-slice inventory

Only **two** distinct read-model slices feed this entire corpus (plus the graph they read from):

| Slice (fragment `kind`)                                        | Entity identity / key                                                       | Fields                                                                                                                                                                                                                            | Consumed by                                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ArchitectureDiagram`**                                      | per-**view** (one bundle root per scope), nodes keyed by **pattern `name`** | `{scope, scopeValue?, sections[]{title,description,diagram{type,content},patterns[]}, fanIn[]{pattern,usedByCount,topConsumers[]}, crossPackageContexts[]{context,packages[],patternCount}, patterns[] (string[]), legend, kind}` | **both** `architecture` AND `design-review` (root + all 6 lens children) — verified: `documentation architecture` and `documentation design-review` both report `rootKind: "ArchitectureDiagram"` |
| **`TaxonomyDigest`**                                           | the registry (singleton); tags keyed by **`tag` name** within `groupName`   | `{kind, tags[]{groupName, entries[]{tag,kind,purpose,format?,required?,repeatable?,values?[],defaultValue?,example?,domain?,priority?,description?,aliases?,targetDoc?}}, formatTypes[]{format,description,example}}`             | `taxonomy` only (no lens fan-out: `children` = `[]`)                                                                                                                                              |
| _(underlying)_ **PatternGraph patterns + `relationshipIndex`** | `@architect-pattern:<Name>`                                                 | per pattern: `name, role, status, level, boundedContext, package, uses/implements/see-also edges` + derived reverse `usedBy`                                                                                                      | the substrate both fragments read; never emitted directly into these docs                                                                                                                         |

Schemas: `TagEntrySchema` / `TagGroupEntrySchema` at `packages/architect-projection/src/fragments/governance/supporting.ts:129-154`. `ArchitectureNode` (pre-flatten) at `packages/architect-projection/src/projections/_shared/architecture-graph.internal.ts:30-37`.

---

## 3. Information architecture

**View vs document.** A _document_ (`docs-live/architecture/by-theme.md`) is one rendered lens child. A _view_ is the `ArchitectureDiagram` fragment that produces it. One API call emits a **bundle**, not a document.

**The universal container — `ProjectionBundle<T>`** (`fragments/base.ts:38-40`):

```
{ root: T; children: Record<string, Fragment> }
```

This is the lens fan-out primitive. One `documentation <type>` call returns a root fragment + N named lens children:

| Doc family      | Grouping axis (`scope`)                            | Lens fan-out (`children` keys)                              | Disclosure                       |
| --------------- | -------------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| `architecture`  | `theme` / `layered` / `package`                    | root + `architecture:by-theme`, `:layered`, `:package-seam` | all 3 render even at `essential` |
| `design-review` | `component` (root) + `layer` / `package` / `theme` | root + `design-review:by-layer`, `:by-package`, `:by-theme` | working-state-inclusive          |
| `taxonomy`      | none (flat registry)                               | **none** (`children: []`)                                   | filtered table dump              |

**Grouping axis is a `scope` value, not a separate codepath.** `ARCHITECTURE_SCOPE_TITLES` / `ARCHITECTURE_MAP_TITLES` (`architecture-diagram.internal.ts:45-61`) map each scope to its heading; `collectArchitectureNodes` buckets patterns by `boundedContext`, then role-fallback, then package (`architecture-graph.internal.ts:505-526`, the `Uncontextualized · role:` / `Unclassified · <pkg>` fallback buckets).

**Cross-references.** P5 (flat `patterns[]` list) + each doc's `[← Back to …]` footer are the only inter-doc links; they are name-anchors, not typed edges.

**Progressive disclosure is a source filter, not a markdown affordance.** `--disclosure essential|important|useful|advanced` maps to a 4-level matrix that attaches a **status `filter`** per level (`disclosure-matrix.ts:46-49`): essential/important → committed-only; useful → wider; advanced → no filter. Verbosity = _which patterns enter the slice_, decided upstream of the renderer. The markdown never emits a collapsible block.

---

## 4. Join points (the key downstream question)

A "join" = one rendered element drawing on >1 slice/axis. The corpus is **join-poor in its output but join-rich in its builder** — the joins happen, then get flattened.

**Joins that exist today (computed in the builder, then flattened to a string):**

| Join                           | Axes combined                                                   | Where                                                                                                                             | Survives to JSON?                                                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **J1 — node label**            | pattern `name` × `role` × `status` × `level`                    | `architecture-graph.internal.ts:147-165` — `annotateStatus ? [level, role, status] : [role]` → `Name<br/>(level · role · status)` | **NO** — flattened into `diagram.content` mermaid string; structured `ArchitectureNode` computes `{name,role,status,level,boundedContext}` (line 165-169) but only `name`+`role` reach `patterns[]`/labels |
| **J2 — fan-in**                | pattern `name` × derived reverse `usedBy` count × top consumers | `buildFanIn` → `fanIn[]`                                                                                                          | YES (structured)                                                                                                                                                                                           |
| **J3 — cross-package context** | `boundedContext` × `package` membership                         | `buildCrossPackageContexts` → `crossPackageContexts[]`                                                                            | YES (structured)                                                                                                                                                                                           |
| **J4 — group bucketing**       | pattern × (`boundedContext` ∨ `role`-fallback ∨ `package`)      | `collectArchitectureNodes` grouping (`:505-526`)                                                                                  | partially — as `sections[].title` + membership                                                                                                                                                             |

**The architecture-vs-design-review delta is purely a join-toggle.** `design-review.ts:27-35` reuses the _same_ fragment with `includeWorkingState:true` + `excludeTestFeatures:true` + `annotateStatus:true`. So `architecture` nodes carry `(role)` and `design-review` nodes carry `(level · role · status)` — **the join is conditional on one flag**, proving the join is real and toggleable, not structural.

**Joins the corpus WANTS but currently bakes/duplicates:**

- **J1 is the canonical "wanted but flattened" join.** A live Studio UI wants a typed node `{name, role, status, level, boundedContext, usedByCount}` so it can colour-by-status, filter-by-role, link-by-context. Today all of that is **pre-rendered into a mermaid label string** and the structured node is discarded — the demanding sink (composed live view) cannot recover `status`/`level` from the projection output without re-querying the graph.
- **Status × tag-modality join is absent.** `TaxonomyDigest` reports each tag's `required` as a flat boolean (§5) — it does **not** join against the tier/status under which the tag is actually required (that modality lives in `architect-guard`, not the read model). The doc _wants_ "required at idea tier, dropped on promotion" but the slice can only say `required: true/false`.

---

## 5. Target-neutrality flags (render-driven shapes)

| Flag                                                          | Shape                                                                                                      | Why it is render-driven, not source-driven                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1 — `TaxonomyDigest.required: boolean`**                   | flat bool per tag (`supporting.ts:134`; e.g. `pattern`→`true`, `status`→`false`)                           | The real modality is **tier-conditional** (e.g. `@architect-status` explicit is required _only at idea tier_, dropped on promotion; `product-area`/`maturity:idea` required at idea tier). A flat bool is shaped for a **Markdown "Required" column**, collapsing a conditional rule the guard actually enforces. **The named example.** |
| **F2 — node label pre-flattened to `(role · status)` string** | `Name<br/>(level · role · status)` baked into `diagram.content` (`architecture-graph.internal.ts:147-165`) | `<br/>`, `( )`, `·` are **Mermaid-markdown presentation** authored inside the _fragment_, not the renderer. The semantic truth (3 separate typed axes) is destroyed at projection time to fit a diagram cell. A target-neutral slice would emit `{role, status, level}` and let each sink format.                                        |
| **F3 — `patterns[]` as bare `string[]`**                      | flat name list (P5)                                                                                        | Shaped for a Markdown anchor bullet list. A live view wants `{name, status, role}` objects; the flat array forces every non-markdown sink to re-join against the graph.                                                                                                                                                                  |
| **F4 — `(count)` baked into group node labels**               | `api ["api (7)"]`, `Architect Core (60)` in the map mermaid                                                | The count is computed then **string-concatenated into the node label** rather than carried as a `{group, memberCount}` field — pure table/diagram-cell shaping.                                                                                                                                                                          |
| **F5 — `domain` duplicates `purpose` on role entries**        | role entries carry both `domain` and an identical `description`/`purpose` (taxonomy JSON)                  | Two columns in the Roles table backed by one source fact — redundancy shaped for the table layout.                                                                                                                                                                                                                                       |

Note F2/F4 are _mild_ — they live in a fragment that an ADR-010 helper composes, so a sink-neutral rewrite is mechanical (emit the node struct, move the `·` join to the markdown renderer). F1 is the _semantically lossy_ one: the conditionality is not recoverable from the read model at all.

---

## 6. The irreducible set ("Reduce to Essentials")

The entire architecture + design-review + taxonomy corpus reduces to this `(content-primitive × source-slice × IA-pattern)` minimum a universal engine must cover:

| Source slice                                                                                                                                     | Content primitives it must render                                                                                                                                                  | IA pattern                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ArchitectureDiagram`** (one fragment, parametrized by `scope` + 3 boolean flags `includeWorkingState`/`excludeTestFeatures`/`annotateStatus`) | P1 group-map, P2 component diagram **with a toggleable node-label join (name × role × status × level)**, P3 fan-in table, P4 cross-package table, P5 flat index, P7 framing/legend | **`ProjectionBundle{root, children}`** lens fan-out: one call → root + N lenses, lens = a `scope` re-binding; grouping axis ∈ {bounded-context, layer, theme, package}; bucketing fallback chain (context → role → package) |
| **`TaxonomyDigest`** (singleton, no fan-out)                                                                                                     | P6 grouped tag-metadata tables + format-type table                                                                                                                                 | flat (no lens children); disclosure via status-filter                                                                                                                                                                       |

**Three engine primitives subsume everything above:**

1. **A graph-node slice with a configurable projection** of `{name, role, status, level, boundedContext, usedByCount}` — and the node-label join must be **deferred to the sink** (kept structured, not pre-flattened to a mermaid string), so a live view and a markdown table read the same slice.
2. **A `ProjectionBundle{root, children}` fan-out** where each child is the _same fragment under a different `scope`/grouping axis_ — not a bespoke per-document projection.
3. **A grouped-entry registry slice** (`{groupName, entries[]{key, …attrs}}`) for tag/metadata tables, where conditional attributes (the `required`-by-tier modality) are modeled as a **rule reference, not a flat boolean** — so the engine never bends a field toward a table column.

Disclosure/verbosity is **not** a fourth primitive: it is a status-filter applied to slice #1's input set before rendering.

---

### Provenance

Verbs run on branch `campaign/docs-and-skills-consolidation`: `overview`; `documentation {architecture,design-review,taxonomy} --format json | jq`; `taxonomy --format json`. Source confirmations: `fragments/base.ts:38-40`, `fragments/governance/supporting.ts:129-154`, `projections/documentation-composition/{architecture-diagram.internal.ts:63-169,design-review.ts:1-50,disclosure-matrix.ts:44-49}`, `projections/_shared/architecture-graph.internal.ts:96-169,505-526`. Doc outputs: `docs-live/architecture/{by-theme,layered,package-seam}.md`, `docs-live/DESIGN-REVIEW.md`, `docs-live/design-review/{by-layer,by-package}.md`, `docs-live/TAXONOMY.md`.
