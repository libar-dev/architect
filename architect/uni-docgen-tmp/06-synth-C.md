# Synth C — Rules-as-data / reflexive read model (the depth pole)

**Task:** pressure-test "single-source the RULES so the guard enforces and the projection renders one definition," regenerate 3 corpus pieces through it, and judge honestly whether the reflexivity refactor pays _now_.

---

## Headline (the honest crux, and it inverts the premise)

The anchor assumes there is **one rule** the guard enforces and the RFC re-documents, so we just need to project it. **There isn't.** Grounding the claim against code:

- The guard's idea-tier requiredness is a **count**, not a per-tag rule: `checkTagMinimum` asserts `explicitArchitectTagCount >= 5` plus "parent present **unless** `@architect-level:epic|slice`" (`idea-tier-checks.ts:234-264`, `IDEA_TIER_MIN_EXPLICIT_TAGS = 5` `types.ts:47`). The "baseline set (gate, pattern, status, maturity, product-area)" appears **only in human message/description strings** — the guard never checks that `product-area` specifically is present.
- The RFC documents a **stricter, per-tag** rule: `product-area`/`bounded-context`/`arch-layer`/`role` are "REQUIRED at Level 2" (`04-tag-registry.md:90-95`). "Level 2" is the RFC's own numbering — it has **no referent in the read model** (the maturity ladder is `idea|plan|design|executable`).
- The registry carries a **third** encoding: `TagEntry.required: z.boolean().optional()` (`supporting.ts:134`), a flat bool, today rendered as the `No` cell.

So F1 isn't "one rule, two authors." It's **three divergent encodings of a rule that, at the strictness the RFC claims, no component actually enforces.** That reframes the whole anchor:

> **Single-sourcing the `Required` column does not de-risk a drift; it forces a product decision — _tighten the guard to per-tag, or admit the doc overstates the rule_. The projection plumbing is the easy 20%; that decision is the real 80%.**

This is the most useful thing this fork found. Everything below is conditional on it.

---

## The mechanism (IF the product wants per-tag requiredness)

One declarative table in `architect-core`, the single definition both sides read. The **tier axis reuses the existing maturity ladder** — never invent "Level 2".

```ts
// architect-core/src/taxonomy/tag-requirement.ts  — NEW, the single source
export const TagRequirementSchema = z.strictObject({
  tag: z.string(), // join key (a tag name)
  requiredFromTier: MaturityValueSchema, // 'idea' ⇒ required at idea and later
  waivedWhen: z.strictObject({ level: z.array(LevelValueSchema) }).optional(), // the carve-out
});
export const TAG_REQUIREMENTS = [
  { tag: 'parent', requiredFromTier: 'idea', waivedWhen: { level: ['epic', 'slice'] } }, // ← already real in the guard
  { tag: 'product-area', requiredFromTier: 'idea' }, // ← NOT enforced today (count only) — see crux
  { tag: 'status', requiredFromTier: 'idea' },
  // …
] as const satisfies readonly TagRequirement[];
```

**Folded into the single read model (ADR-006), not a parallel store.** It is registry-adjacent data, same as `*-values.ts`. The digest stops carrying a render-shaped bool and carries the structured requirement (No-BC swap):

```ts
// fragments/governance/supporting.ts — TagEntrySchema
- required: z.boolean().optional(),
+ requirement: z.strictObject({ requiredFromTier: MaturityValueSchema,
+                               waivedWhen: WaivedWhenSchema.optional() }).optional(),
```

**The `tag ⨝ rule` join.** Keyed by tag name — a generalization of `relationshipIndex` only in spirit; concretely it's an O(1) `Map` lookup, and I'll call it that rather than oversell it:

```ts
// projections/governance/taxonomy-digest.internal.ts
const reqIndex = new Map(TAG_REQUIREMENTS.map((r) => [r.tag, r])); // the "join index"
entry.requirement = reqIndex.get(entry.tag); // tag ⨝ rule, structured
```

**The guard reads the SAME table** — this is the behavior change, not a wiring change:

```ts
// idea-tier-checks.ts — checkTagMinimum (count) → checkRequiredTags (per-tag)
for (const r of TAG_REQUIREMENTS)
  if (tierAtLeast(detected, r.requiredFromTier) && !waived(r, detected.level) && !present(r.tag))
    violations.push(missing(r.tag)); // STRICTER than today's count>=5
```

**Demanding-sink test — passes.** The digest emits `requirement` **structured**; each sink formats:

```ts
function requirementCell(r?: TagRequirement): string {
  // markdown sink
  if (!r) return 'No';
  const base = `Required (${r.requiredFromTier}+)`;
  return r.waivedWhen ? `${base}; waived for ${r.waivedWhen.level.join('/')}` : base;
}
// Studio sink reads the SAME `entry.requirement` → renders a badge + "waived for epic/slice" tooltip,
// no re-query. One slice → markdown cell AND live view.
```

---

## The 3 corpus pieces through this anchor

**1. Classification `Required` column (the headline).**

```
before:  | product-area | … | No |        + authored note (:90-95) "really required at Level 2"
after:   | product-area | … | Required (idea+) |     ← generated; the authored note DELETES
         | parent       | … | Required (idea+); waived for epic/slice |
```

The conditional ("waived for epic/slice") is the part that is **genuinely real in the guard today** and projects cleanly. The per-tag part (`product-area`) is the part that is **fictional until the guard tightens** — so this row is half-honest until the product decision lands.

**2. `by-theme` architecture lens / J1 — served by the _discipline_, not the _mechanism_.** J1 (node label `name × role × status × level` flattened into a mermaid string, `architecture-graph.internal.ts:147-165`) is **not a rule** — it's a target-neutrality flattening (F2). The rules anchor's principle (_emit structured, defer the join/format to the sink_) fixes it, but the fix is independent and far cheaper than the rule slice:

```ts
- label: `${name}<br/>(${[level,role,status].join(' · ')})`   // pre-flattened
+ // ArchitectureNode keeps {name,role,status,level,boundedContext,usedByCount}; the markdown
+ // renderer builds the ` · ` label; Studio reads the struct.  No rule, no guard, no core change.
```

Honest: my anchor does **not** make J1 cheaper; it just shares its discipline. J1 should be fixed on its own (it's the highest-value, lowest-cost target-neutrality win in the corpus).

**3. Lens fan-out + host marker — unchanged.** `ProjectionBundle{root,children}` and the marker→view selection are orthogonal to rule-sourcing. The only delta: a view definition may declare a column whose provenance is the rule slice rather than the registry. Marker stays a selection-by-key (`view=taxonomy.classification`); the join happens in the view's compile, invisible to the host.

---

## Deletes · new machinery · cost

| Deletes                                                                                                                              | New machinery                                                                                                                                                  | Cost (honest)                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the `arch-layer`-adjacent authored "Required" note (`:90-95`); the flat `required:boolean`; the prose baseline-set in guard messages | `tag-requirement.ts` table; `requirement` field on `TagEntry`; the join in the digest projection; `checkRequiredTags` in the guard; `requirementCell` renderer | **medium-high, and most of it is in the GUARD, not the doc pipeline.** Tightening `checkTagMinimum`→`checkRequiredTags` is a No-BC behavior change with its own test surface and may newly fail existing specs. The doc-side change alone is ~small; it is worthless without the guard change (else nothing truly _enforces_ the projected rule). |

---

## Reflexivity generalization + the second-caller verdict

The requirement table is "the read model carrying its own governance metadata" — the **same shape** as `ReadModelReflexivity` (fold CLI verb schema + MCP tool registry in via the `@architect-shape` precedent, which already tags these very fragments: `supporting.ts` schemas carry `@architect-shape`). So a tag-requirement slice is a _miniature_ of the Manifest family.

**Does it clear the ADR-010 "second caller" bar?** This is the one place the bar is genuinely satisfiable inside this cluster: a requirement table has **two real consumers on day one** — the guard (enforce) and the projection (render) — unlike `buildFacetBundle` (zero). **But the catch:** the second consumer (guard) only _truly_ depends on the table if the guard switches from count-based to per-tag. If the product keeps count-based enforcement, the table has **one** real consumer (the doc) and is invented purely to be projected — which _fails_ the bar. So:

> **Reflexivity pays here iff the product wants per-tag requiredness enforcement. If it only wants the doc to stop drifting, the cheaper honest fix is to make the bool truthful — project what the guard _actually_ enforces ("≥5 tags incl. parent-or-level"), not a per-tag MUST the guard never checks.**

---

## Weakest assumption + where it breaks

**Weakest assumption:** "the guard's requiredness can become per-tag declarative." Reality is split:

- **The parent rule IS cleanly declarative already** (`waivedWhen.level: ['epic','slice']`) — this part projects today, for free. Good.
- **The per-tag baseline (product-area etc.) is NOT enforced** (count only) — projecting it asserts a rule that doesn't exist yet.
- **Beyond idea-tier it breaks hardest:** the RFC's "Level 2" requiredness for `bounded-context`/`arch-layer`/`role` at plan/design has **no enforcement anywhere I could find** to single-source from. So for the non-idea tiers the table would be 100% invention — the anchor is strongest exactly where a real (partial) rule exists (idea-tier, the parent carve-out) and degenerates to fiction where the RFC's modality is most elaborate.

**Net for the orchestrator:** ship the **parent-carve-out** as the one genuine rules-as-data proof (it's real, declarative, two-consumer, and kills a true drift), fix **J1/F2 independently** (cheap, high-value, no rules needed), and treat the full per-tag/Level-2 modality as **blocked on a product decision about guard strictness**, not a projection task. Don't build the general rule slice ahead of that decision — it would manufacture the very rule it claims to source.
