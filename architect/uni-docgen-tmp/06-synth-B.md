# Synth B — Target-neutral ViewModel: structured joins, never flatten

**Anchor:** the core defect is render-time flattening (J1, F1–F4). Fix it by making projections emit **structured joins** that markdown, Studio view-state, and the API/MCP bundle all render from.

---

## Verdict up front (the honest answer the directive demanded)

**A new explicit "ViewModel stage" is ceremony. The fragment IS already the ViewModel — it just carries pre-rendered strings instead of structure.** The repo-correct move is not to _add a layer_; it is to **de-flatten the existing fragment contract in place** so a fragment carries structured nodes/rows and the `·` / `<br/>` / mermaid / `Yes` formatting moves into the per-sink renderer that already exists (`render-markdown.ts`).

Evidence the stage already exists:

- `ProjectionBundle<T>` (`fragments/base.ts:38-48`) is sink-agnostic: its _absence of `emission`_ is explicitly "the bundle handed to the API/MCP consumer or the Studio view-state sink." That is the target-neutral view model, already named.
- The defect is one level down: the fragment's `sections[].diagram` is `{type:'mermaid', content: string}` — a **pre-rendered string** — and `NodeShape` (`architecture-graph.internal.ts:30-39`) **does not even have `status`/`level` fields**; they exist only at line 147-148 and are immediately destroyed into `label` (`:153-156`). So the leak isn't "no ViewModel," it's "the ViewModel pre-renders its payload."

So: **de-flatten, don't re-layer.** Below is what de-flattening the two slices concretely looks like.

---

## 1. Architecture — de-flatten the node join (J1 / F2 / F3 / F4)

### Today (the flatten)

```ts
// architecture-graph.internal.ts:30-39 — NodeShape has role, NOT status/level
interface NodeShape {
  nodeId;
  name;
  label;
  archContext?;
  archLayer?;
  archTheme?;
  role?;
  packageLabel;
}
// :146-156 — status/level computed, then BAKED into a string, then discarded as structure
const classifierParts = annotateStatus ? [level, role, status] : [role]; // structured for 1 line…
label = `${esc(name)}<br/>(${present.map(esc).join(' · ')})`; // …then string, gone
// fragment then carries: sections[].diagram.content (mermaid STRING) + patterns[] (string[])
```

### De-flattened (structured node; flatten at the sink)

```ts
// the node IS the join — kept structured, zero presentation
const ArchNodeSchema = z.strictObject({
  name: z.string(),
  role: z.string().optional(),
  status: StatusValueSchema, // ← was destroyed into label
  level: LevelValueSchema.optional(), // ← was destroyed into label
  boundedContext: z.string().optional(), // already on the pattern (archContext)
  usedByCount: z.number().int(), // from relationshipIndex (today only in fanIn[])
});
const ArchEdgeSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['uses', 'see-also']),
});

// the section carries a STRUCTURED graph, not a mermaid string
const ArchSectionSchema = z.strictObject({
  group: z.strictObject({ key: z.string(), title: z.string(), memberCount: z.number().int() }), // F4: count is a field, not "(7)" in the label
  nodes: z.array(ArchNodeSchema),
  edges: z.array(ArchEdgeSchema),
});
// DELETE: NodeShape.label, the roleSuffix `<br/>(…)` build, sections[].diagram.content, patterns[]:string[]
```

### The `·` / mermaid lives in ONE place — the markdown renderer

```ts
// render-markdown.ts (the only file that knows mermaid/`<br/>`/` · ` exists)
function renderArchNodeLabel(n: ArchNode): string {
  const parts = [n.level, n.role, n.status].filter(hasText); // the join, flattened HERE
  return parts.length ? `${esc(n.name)}<br/>(${parts.map(esc).join(' · ')})` : esc(n.name);
}
function renderArchMermaid(section: ArchSection): string {
  /* graph TD; nodes→renderArchNodeLabel; edges→`-->`/`-.->` */
}
```

### Demanding-sink test — PASS

- **Studio view-state sink** reads `ArchNode[]` straight off the fragment: colour-by-`status`, filter-by-`role`, link-by-`boundedContext`, size-by-`usedByCount` — **no graph re-query** (today impossible: those bytes are inside a mermaid string).
- **Markdown** is byte-identical after the move (determinism gate proves it). `architecture` keeps `(role)`, `design-review` keeps `(level · role · status)` — the flag `annotateStatus` becomes a **renderer** choice ("which axes to show"), not a projection-time destruction.

---

## 2. Taxonomy — de-flatten modality (F1, the semantically-lossy one)

### Today

```ts
// supporting.ts:134 — modality collapsed to a markdown column
required: z.boolean().optional(); // role→? , status→false … shaped for the "Required" cell
```

The real modality is tier-conditional and lives in `architect-guard` (`idea-tier-checks.ts`): e.g. `product-area` required _at idea tier_, `parent` required _unless level ∈ {epic,slice}_. A bool cannot say that, so the RFC re-authors it as a prose note (`04-tag-registry.md:90-95`).

### De-flattened (a rule reference, not a cell)

```ts
const TagRequirementSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('always') }),
  z.strictObject({ kind: z.literal('never') }),
  z.strictObject({
    kind: z.literal('conditional'),
    requiredWhen: z.string(), // 'level == idea'
    waivedFor: z.array(z.string()), // ['epic','slice']
    enforcedBy: z.string(), // provenance → the guard rule id that ACTUALLY enforces it
  }),
]);
// entry.required: boolean   →   entry.requirement: TagRequirement     (DELETE the boolean)
```

```ts
// markdown renderer flattens to the cell; the authored conformance note DISSOLVES into the gate
function renderRequiredCell(r: TagRequirement): string {
  return r.kind === 'always' ? 'Yes' : r.kind === 'never' ? 'No' : `Idea tier`; // (+ waived note generated, not authored)
}
// Studio / API sink reads the union → renders true conditionality. Demanding-sink test PASS.
```

**Dependency, stated honestly:** the `conditional` _data_ must be projected from the guard's tier rules — that is the **rules-as-data fork's** job, not mine. My anchor fixes the _field shape_ (so the read model can hold the truth); it cannot fill the `conditional` case alone. Until rules-as-data lands, `requirement` faithfully emits `always`/`never` and `conditional` is the unfilled half — the same ceiling the shipped slice already hit, now at least _modelable_.

---

## 3. The three corpus pieces through this anchor

1. **`by-theme` architecture lens:** `collectArchitectureNodes` returns `ArchNode[]` (with `status`/`level`/`usedByCount`); the `theme` lens groups them into `ArchSection[]`; the fragment carries nodes+edges; `renderArchMermaid` builds the `graph LR` map + `graph TD` detail **at the markdown sink only**. Studio reads the same `ArchSection[]` and lays it out itself.
2. **Classification RFC region:** the `taxonomy-classification` region's rows carry `requirement: TagRequirement`; `buildTaxonomyFunctionGroupTable` (`render-markdown.ts:1791`) calls `renderRequiredCell`. `product-area`/`bounded-context`/`role` emit `conditional{requiredWhen:'level==2', …}` instead of the misleading `No` + a 6-line authored caveat.
3. **Lens fan-out + host marker:** unchanged in shape — the host marker still selects `(viewId/source, scope)`; the **emission descriptor** still selects the sink (`embedded-region`); the only change is the fragment between them is structured, so the _same_ region can feed markdown (flattened) and a future Studio panel (structured). De-flattening is **orthogonal** to whether the marker→view lookup is hardcoded (that's the manifest fork) — it composes with either.

---

## 4. Deletes / Adds / Cost

**DELETE (No-BC):** `NodeShape.label` + the `roleSuffix`/`<br/>(…)` build (`architecture-graph.internal.ts:146-172`); `ArchitectureDiagram.sections[].diagram.content` (mermaid string) → `graph{nodes,edges}`; `patterns[]: string[]` (F3, derive from nodes); `(count)`-in-label (F4) → `group.memberCount`; `TaxonomyDigest.entries[].required: boolean` (F1) → `requirement`; the `domain`/`purpose` dup (F5).

**ADD:** `ArchNodeSchema`/`ArchEdgeSchema`/`ArchSectionSchema`/`TagRequirementSchema` (Zod fragments — typed, NOT a config DSL, ADR-010-safe); `renderArchMermaid` + `renderArchNodeLabel` + `renderRequiredCell` in `render-markdown.ts`. **No new pipeline stage, no new package, no framework.**

**COST:** broad-but-mechanical — every reader of `diagram.content`/`patterns[]` migrates to the structured fields in one No-BC change; the determinism + perf gates keep the blast radius a reviewable, byte-identical diff. The taxonomy `conditional` half is blocked on rules-as-data.

---

## 5. Weakest assumption + where it breaks

- **Weakest assumption:** that a sink which _needs_ the structure exists. It doesn't yet — Studio view-state is unbuilt. Today the only consumer is markdown, which **immediately re-flattens**, so the round-trip `structure → string` looks like pure ceremony _in the markdown-only present_. Defense: the de-flatten is a No-BC contract change that is **cheaper now (2 consumers: architecture + design-review reuse one fragment) than after Studio wires N views**, and the gate makes it free of risk. But if Studio never materializes, this is ceremony — the payoff is literally "the demanding sink," and the demanding sink is hypothetical.
- **Where it breaks:** node de-flatten is clean; **diagram de-flatten has a fuzzy boundary.** Edges are semantic (`uses`/`see-also` — keep structured), but `graph LR`-vs-`TD` direction, subgraph nesting, and node ordering are genuine _layout_. A fully structured graph fragment still must decide how much topology is semantic vs presentation — and that line is exactly where "structured, never flatten" stops being obvious. The safe read: de-flatten **nodes and edges** (clearly semantic); leave **layout hints** as an explicit, named renderer concern rather than pretending they're source facts.

---

_Synth B. Ground: `fragments/base.ts:38-48`, `architecture-graph.internal.ts:30-39,146-172`, `fragments/governance/supporting.ts:134`, `render-markdown.ts:1735-1807`. No repo code modified._
