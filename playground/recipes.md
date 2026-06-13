# recipes — script the rest

The handle (`graph.ts`) freezes only the **irreducible joins** — the grep→graph entry
adapters (`findByConcept`/`byFile`/`bySymbol`), the spec-bridge (`invariantsOf`/
`specsReverifying`), and the firehose (`blastRadius`). **Everything else is a script you
write**, because freezing one-consumer traversals is how the playground would quietly
re-become the 30-verb pipeline we are deleting (CONTEXT §3, the freeze-vs-script demand map).

This file is the proof that "script the rest" is cheap. Every recipe below is **verified
against live data** — copy one, adapt it, run it with `tsx`. None of them is — or should
become — a handle method, until it earns the bar (see the last section).

```ts
import { loadGraph } from './graph.ts';
const g = loadGraph(); // one object; joins + taxonomy decode already done
```

The surface you script over: `g.patterns` (decoded `PatternNode[]`), `g.pattern(name)`,
`g.invariantsOf(x)`, `g.specsReverifying(x)`, `g.blastRadius(files)`, the entry adapters,
and the raw escape hatches `g.mech` / `g.authored`. Read `schema.ts` for the shapes.

---

## I1 — "if I change this pattern, what breaks?"

A thin transitive walk over the **curated** `usedBy` edges. (For the _exhaustive_ answer that
reaches dark files, that's `g.blastRadius(files)` — the firehose. This is the curated-edge
version: the architecture's own answer, no substrate.)

```ts
function downstream(name: string): string[] {
  const seen = new Set<string>(),
    q = [name];
  while (q.length)
    for (const u of g.pattern(q.shift()!)?.usedBy ?? [])
      if (!seen.has(u)) {
        seen.add(u);
        q.push(u);
      }
  return [...seen];
}
downstream('ProjectionFragmentContracts'); // → 30 patterns downstream (curated edges)
```

_Why a script:_ one consumer, one already-structured field (`usedBy`) — a 5-line walk an
agent won't get wrong. Freezing it would add a verb that hides a for-loop.

---

## A1 — "how is this kind of thing done here?" (precedent)

Filter by `role`, rank by `maturity` so the strongest precedent (an `executable`-proven
pattern) sorts first, and pull a sample invariant as the "what it guarantees" hint.

```ts
const order = { executable: 0, design: 1, plan: 2, idea: 3 };
const precedents = g.patterns
  .filter((p) => p.role === 'projection')
  .sort((a, b) => order[a.maturity] - order[b.maturity] || a.name.localeCompare(b.name))
  .slice(0, 4);
for (const p of precedents) {
  const inv = g.invariantsOf(p.name)[0];
  console.log(`[${p.maturity}] ${p.name}  ${p.sourceFile ?? ''}`);
  if (inv) console.log(`    e.g. invariant: ${inv.text.slice(0, 80)}…`);
}
```

```
[executable] AnnotationCoverageProjection  …/projections/operational-insights/index.ts
    e.g. invariant: `AnnotationCoverage` reports `totalSourceFiles`, `annotatedFiles`, `unannotatedF…
[executable] ArchitectureComparisonProjection  …/projections/pattern-relations/architecture-comparison.ts
    e.g. invariant: Every relationship direction (`uses`, `usedBy`, `dependsOn`, `enables`, `seeAlso…
[executable] ArchitectureDiagramProjection  …/projections/documentation-composition/architecture-diagram.ts
[executable] ArchitectureNavigationProjectionExecutableTests  …/pattern-relations/architecture-neighborhood.feature
```

_Why a script:_ the "precedent" definition is the agent's to choose (by role? context? a
fuzzy `findByConcept` first?). A verb would freeze one definition; the script lets the agent
pick. `role` is **populated** (195/293, 66%) but _coarse_ — 65 `contract`s, 63 `projection`s
— so combine with `g.findByConcept(intent)` or a `boundedContext` filter to narrow.

---

## A2 — "what context/seam am I extending?"

Group by the seam axis. `boundedContext` is both the **doctrine-correct** seam and the
**denser** field (176/293) — use it. (`productArea`, 136/293, is the coarser org axis; fall
back to it only where `boundedContext` is absent.)

```ts
const bySeam = new Map<string, string[]>();
for (const p of g.patterns)
  if (p.boundedContext)
    (bySeam.get(p.boundedContext) ?? bySeam.set(p.boundedContext, []).get(p.boundedContext)!).push(
      p.name,
    );
for (const [ctx, members] of [...bySeam].sort((a, b) => b[1].length - a[1].length))
  console.log(`${ctx.padEnd(26)} ${members.length} members`);
```

```
projection                 46 members
pattern-relations          12 members
operational-insights       10 members
documentation-composition  10 members
cli                        10 members
…  (21 contexts total)
```

_Why a script:_ a one-line `groupBy` over an exposed field. This is exactly the bar
`maturityLadder` failed — it stays a recipe, never a method.

---

## COMPOSE — a question that is _not_ a method

The flagship demonstration: chain frozen primitives into a cut no single verb produces —
_"of everything at risk from this diff, which patterns rest on **authored-only** invariants
no live test proves?"_ (`blastRadius` → `invariantsOf` → provenance filter).

```ts
import { execFileSync } from 'node:child_process';
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD~20', '--'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const exposed = g
  .blastRadius(changed)
  .mechPatterns.map((p) => ({ p, inv: g.invariantsOf(p) }))
  .filter(({ inv }) => inv.length && inv.every((i) => i.provenance === 'authored'));
console.log(`${exposed.length} at-risk patterns rest only on authored (unproven) invariants`);
```

```
diff HEAD~20 → 126 downstream; 0 rest only on authored invariants
```

_(0 is honest here — `HEAD~20` touches mature code; the authored-only working specs aren't in
its downstream. The mechanism is the point: three primitives compose into a fourth question,
in-process, no envelope, ~⅕ the context of a verb round-trip.)_

---

## ESCAPE HATCH — raw shapes when no view fits

The shapes are never hidden. Drop to `g.mech` / `g.authored` for anything the views don't
cover — the substrate is right there.

```ts
const typeOnly = g.mech.edges.filter((e) => e.typeOnly).length;
console.log(`${typeOnly}/${g.mech.edges.length} import edges are type-only`); // → 741/1878 (39%)
```

_This is the whole bet:_ the agent is not limited to the view library. The views are a
_starting toolkit_; the raw event-store shapes are always one property away.

---

## When does a recipe graduate to a handle method?

Only when it clears **both** axes of the bar (CONTEXT §3):

1. **Many consumers** (ADR-010's second-caller) — several other recipes need it first.
2. **Irreducible join** — it hides a sharp cross-source join an agent would hand-roll wrong
   (the 2-hop `pattern→implementedBy→featureFile→rules` is the canonical example; a `groupBy`
   over an exposed field is not).

A recipe that is reached often but is _still a thin traversal_ stays a recipe (document it
here). A recipe that is a _hard join but has one consumer_ stays a recipe (script it inline).
Both at once → it's earned the handle. Nothing else gets frozen.
