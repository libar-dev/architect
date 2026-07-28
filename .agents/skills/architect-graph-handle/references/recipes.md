# recipes — script the rest

The handle (`packages/architect-cli/src/handle/graph.ts`) freezes only the **irreducible
joins** — the grep→graph entry adapters (`findByConcept`/`byFile`/`bySymbol`), the
spec-bridge (`invariantsOf`/`specsReverifying`), and the firehose (`blastRadius`).
**Everything else is a script you write**, because freezing one-consumer traversals is how
the surface would quietly re-become the verb wall ADR-014 deleted.

**Every recipe below is a runnable `q` body.** Save one to `playground/scratch/<name>.ts`
and pipe it through the front door (the script bakes in `--conditions=source`):

```bash
pnpm architect:q < playground/scratch/<name>.ts
# …or inline:  echo 'return g.patterns.length;' | pnpm architect:q
```

`q` injects **`g`** (the live handle), `inspect`, `execFileSync`, and `REPO_ROOT`, and runs
your script with **cwd at the repo root**. So: no imports, no `loadGraph()` boilerplate, and
`git`/path shell-outs are stable wherever you invoke it. Two rules, because the body is
compiled as a **function body**: (1) **no `import`/`export` and no TS-only syntax** (type
annotations, `<generics>`, `!` — it's plain JS at eval time); (2) **end with
`return <value>`** (inspect-printed) and/or `console.log`.

The surface you script over: `g.patterns` (decoded `PatternNode[]`), `g.pattern(name)`,
`g.invariantsOf(x)`, `g.specsReverifying(x)`, `g.blastRadius(files)`, the entry adapters,
the canonical **`g.api`** (PatternGraphAPI — every deterministic read incl.
`isValidTransition`), and the raw escape hatches `g.mech` / `g.authored`. Read
`packages/architect-cli/src/handle/schema.ts` + `graph.ts` for the shapes.

> **Want full TypeScript / a saved module instead?** Run it **standalone**: a file in
> `playground/scratch/` that does
> `import { loadGraph } from '../../packages/architect-cli/src/handle/graph.ts';` and
> `const REPO_ROOT = new URL('../..', import.meta.url).pathname;` then
> `const g = await loadGraph(REPO_ROOT);` (pass `cwd: REPO_ROOT` to any `git`/shell-out).
> A standalone module bypasses `q`, so pass the flag yourself:
> `pnpm exec tsx --conditions=source playground/scratch/<name>.ts`. Full TS, but you own the
> imports + cwd; the piped form is lower-friction.

---

## STATE — "what is the state of X?" (the old verb menu, one script each)

Pattern-state questions are direct reads — no verb needed:

```js
// one pattern's decoded state (need-shaped)
return g.pattern('ProjectionBundle');
// the full canonical record + deterministic reads → g.api:
//   g.api.getPattern('X') · g.api.getStatusCounts() · g.api.getCurrentWork()
//   g.api.isValidTransition('roadmap', 'active')  ← the FSM gate, one call
```

```js
// status distribution (the old `status` verb)
const byStatus = {};
for (const p of g.patterns) byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
return byStatus;
```

```js
// workable: roadmap patterns whose deps are all completed (the old `arch workable`)
return g.patterns
  .filter((p) => p.status === 'roadmap')
  .filter((p) => p.uses.every((u) => g.pattern(u)?.status === 'completed'))
  .map((p) => p.name);
```

---

## I1 — "if I change this pattern, what breaks?"

A thin transitive walk over the **curated** `usedBy` edges. (For the _exhaustive_ answer that
reaches dark files, that's `g.blastRadius(files)` — the firehose. This is the curated-edge
version: the architecture's own answer, no substrate.)

```js
function downstream(name) {
  const seen = new Set(),
    q = [name];
  while (q.length)
    for (const u of g.pattern(q.shift())?.usedBy ?? [])
      if (!seen.has(u)) {
        seen.add(u);
        q.push(u);
      }
  return [...seen];
}
return downstream('ProjectionFragmentContracts').length; // → N patterns downstream (curated edges)
```

_Why a script:_ one consumer, one already-structured field (`usedBy`) — a short walk an agent
won't get wrong. Freezing it would add a verb that hides a for-loop.

---

## MEMBERS — "what is in this epic, and at what maturity?" (the design-review backbone)

Epic→member membership (`@architect-parent`) is a **first-class decoded field**: `p.parent`
and its inverse `p.children`. So an epic's member set — the spine of a "design review for
capability X" slice — is a direct read. Group the members by maturity to see at a glance what
is proven (`executable`) vs still-design vs idea-tier.

```js
const epic = g.pattern('DocumentationProjection');
const order = { executable: 0, design: 1, plan: 2, idea: 3 };
return epic.children
  .map((n) => g.pattern(n))
  .sort((a, b) => order[a.maturity] - order[b.maturity] || a.name.localeCompare(b.name))
  .map(
    (m) =>
      `[${m.maturity.padEnd(10)}] ${m.name}  (${m.status}${m.implementedBy.length ? ', live test' : ''})`,
  )
  .join('\n');
```

_Why a script:_ `children` is an exposed field; "members by maturity" is a `sort`/`map` over
it — the freeze-vs-script bar (a traversal an agent writes), not a method.

---

## A1 — "how is this kind of thing done here?" (precedent)

Filter by `role`, rank by `maturity` so the strongest precedent (an `executable`-proven
pattern) sorts first, and pull a sample invariant as the "what it guarantees" hint.

```js
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

_Why a script:_ the "precedent" definition is the agent's to choose (by role? context? a fuzzy
`findByConcept` first?). A verb would freeze one definition; the script lets the agent pick.
`role` is populated but _coarse_ — combine with `g.findByConcept(intent)` or a
`boundedContext` filter to narrow.

---

## A2 — "what context/seam am I extending?"

Group by the seam axis. `boundedContext` is both the **doctrine-correct** seam and the
**denser** field — use it. (`productArea` is the coarser org axis; fall back to it only where
`boundedContext` is absent.)

```js
const bySeam = new Map();
for (const p of g.patterns)
  if (p.boundedContext)
    (bySeam.get(p.boundedContext) ?? bySeam.set(p.boundedContext, []).get(p.boundedContext)).push(
      p.name,
    );
for (const [ctx, members] of [...bySeam].sort((a, b) => b[1].length - a[1].length))
  console.log(`${ctx.padEnd(26)} ${members.length} members`);
```

_Why a script:_ a one-line `groupBy` over an exposed field — it stays a recipe, never a method.

---

## GUARANTEE — "what does X guarantee?" (and what an empty `invariantsOf` means)

The north-star design question. But `g.invariantsOf(x)` returns `[]` for **~40% of patterns**
— the code-originated contracts (`role:contract`/`codec`, a `.ts` source) whose guarantee is
their TypeScript **type**, not a Gherkin Rule block. An agent must **not** read that `[]` as
"guarantees nothing." Disambiguate the three cases `[]` collapses in one cheap follow-up:

```js
function guaranteeOf(x) {
  const inv = g.invariantsOf(x);
  if (inv.length)
    return { kind: 'invariants', count: inv.length, sample: inv[0].text.slice(0, 60) };
  const node = g.pattern(x) ?? g.pattern(g.fileToPattern(x) ?? '');
  if (!node) return { kind: 'unresolved', x }; // not a pattern, not a mapped .ts file
  if (node.sourceFile?.endsWith('.ts'))
    // code-originated contract → read the TYPE
    return { kind: 'structural', role: node.role, typeAt: node.sourceFile };
  return { kind: 'none-yet', pattern: node.name }; // real .feature pattern, no Rule blocks yet
}
return [
  guaranteeOf('ProjectionBundle'),
  guaranteeOf('ApiReferenceProjection'),
  guaranteeOf('NoSuchPattern'),
];
```

> **`structural` ≠ "a contract never has invariants."** It only means no Gherkin Rule reaches
> it. A code-originated contract **realized by a live test** returns real `executable`
> invariants — so the recipe **calls `invariantsOf` first and never infers emptiness from
> `role`**. Don't shortcut "it's a contract, so `[]`"; ask the graph.

_Why a script, not a handle method:_ it is a thin field-check over already-exposed fields, not
an irreducible cross-source join. (Whether this earns a frozen `g.guarantee()` is an ADR-010
"second real caller" question — the `invariants` CLI command is the first; if a second
programmatic caller appears, promote it. Until then: script it.)

---

## TRIAGE — the annotation campaign: which annotations are noise, which need edges

The subtractive+additive half of a curation pass. An annotated pattern carrying **zero
architectural-significance signal** is one of two things, and the discriminator is mechanical
fan-in: **near-zero importers ⇒ true noise (REMOVE); many importers ⇒ load-bearing but
under-annotated (ADD edges).** Significance = ANY of a curated edge, a rule/scenario, a
realization (`implements` OR `implementedBy`), a decision enforced, `children` (it's a
parent/epic), or a structural role — all first-class node fields, so the filter needs no
escape hatch.

```js
const STRUCTURAL = new Set(['contract', 'codec', 'decider', 'read-model']);
const fanIn = new Map();
for (const e of g.mech.edges)
  if (e.fromFile !== e.toFile)
    (fanIn.get(e.toFile) ?? fanIn.set(e.toFile, new Set()).get(e.toFile)).add(e.fromFile);
return g.patterns
  .filter(
    (p) =>
      !p.uses.length &&
      !p.usedBy.length &&
      !p.ruleCount &&
      !p.scenarioCount &&
      !p.implements.length &&
      !p.implementedBy.length &&
      !p.enforcesDecisions.length &&
      !p.children.length &&
      !STRUCTURAL.has(p.role ?? '') &&
      p.sourceFile?.endsWith('.ts'),
  )
  .map((p) => ({ name: p.name, role: p.role ?? '—', fanIn: fanIn.get(p.sourceFile)?.size ?? 0 }))
  .sort((a, b) => a.fanIn - b.fanIn)
  .map(
    (t) =>
      `${String(t.fanIn).padStart(3)} imp  ${t.name} [${t.role}]  → ${t.fanIn <= 1 ? 'REMOVE? (noise)' : 'ADD edges? (load-bearing)'}`,
  )
  .join('\n');
```

_Why a script:_ "significance" is the curator's definition to tune — a verb would freeze one
policy. **The ADD side** (uncurated mechanical `uses` edges to author) is
`g.graphDiff().aspirational` / `pnpm architect:graph fan-in`; this recipe is the REMOVE side
plus the load-bearing-but-edge-dark cross-check.

---

## IMPACT — file-level impact is `blastRadius`, not `specsReverifying`

A demand-map trap worth knowing: `g.specsReverifying([implFile])` can return **`0`** for a
real realizing impl file — because that file's tests live on the _cluster spec it implements_,
not on a feature of its own, and `specsReverifying` walks a pattern's own +
reverse-`implementedBy` scenarios, not the forward `implements` edge. For "I changed this
**file**, what re-verifies?", reach for `g.blastRadius([file]).atRiskSpecs` (exhaustive,
reaches the cluster via the substrate) or seed `specsReverifying` with the **pattern name** of
what the file implements.

```js
// file → at-risk specs (the reliable file-level form)
return g.blastRadius([
  'packages/architect-projection/src/projections/documentation-composition/taxonomy-embedded.ts',
]).atRiskSpecs.length;
```

---

## DRIFT — "what ran ahead of its design?"

The **drift alarm**: a unit backed by a **live test** whose own design status still **lags**.
The handle does not fabricate this as a maturity label (executable provenance is clamped to
`executable` maturity — a live verifier IS the realization rung); the signal lives here
instead, as a deliberate query, where it is informative rather than contradictory.

```js
// patterns realized by a live test (tests/features) but whose status is not yet `completed`
const realized = new Set();
for (const p of g.patterns)
  for (const i of g.authored.relationshipIndex[p.name]?.implementedBy ?? [])
    if (i.file && i.file.includes('tests/features')) realized.add(p.name);
const drift = [...realized]
  .map((n) => g.pattern(n))
  .filter((p) => p && p.status !== 'completed')
  .map((p) => `${p.name} [${p.status}]`)
  .sort();
return `${drift.length} drift (live test ∧ status<completed):\n` + drift.join('\n');
```

_Why a script:_ a filter over two already-exposed fields (`status`, `implementedBy`). One
consumer, no irreducible join — it stays a recipe.

---

## COMPOSE — a question that is _not_ a method

The flagship: chain frozen primitives into a cut no single verb produces — _"of everything at
risk from this diff, which patterns rest on **authored-only** invariants no live test
proves?"_ (`blastRadius` → `invariantsOf` → provenance filter).

```js
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD~20', '--'], {
  encoding: 'utf8',
  cwd: REPO_ROOT,
})
  .split('\n')
  .filter(Boolean);
const exposed = g
  .blastRadius(changed)
  .mechPatterns.map((p) => ({ p, inv: g.invariantsOf(p) }))
  .filter(({ inv }) => inv.length && inv.every((i) => i.provenance === 'authored'));
return `${exposed.length} at-risk patterns rest only on authored (unproven) invariants`;
```

_(`execFileSync` and `REPO_ROOT` are injected; the explicit `cwd: REPO_ROOT` keeps it correct
even if you later lift it into a standalone file. The mechanism is the point: three primitives
compose into a fourth question, in-process, no envelope, ~⅕ the context of a verb round-trip.)_

---

## ESCAPE HATCH — raw shapes when no view fits

The shapes are never hidden. Drop to `g.mech` / `g.authored` for anything the views don't
cover — the substrate is right there.

```js
const typeOnly = g.mech.edges.filter((e) => e.typeOnly).length;
return `${typeOnly}/${g.mech.edges.length} import edges are type-only`;
```

_This is the whole bet:_ the agent is not limited to the view library. The views are a
_starting toolkit_; the raw event-store shapes are always one property away.

---

## When does a recipe graduate to a handle method?

Only when it clears **both** axes of the bar (ADR-014 §3):

1. **Many consumers** (ADR-010's second-caller) — several other recipes need it first.
2. **Irreducible join** — it hides a sharp cross-source join an agent would hand-roll wrong
   (the 2-hop `pattern→implementedBy→featureFile→rules` is the canonical example; a `groupBy`
   over an exposed field is not).

A recipe that is reached often but is _still a thin traversal_ stays a recipe (document it
here). A recipe that is a _hard join but has one consumer_ stays a recipe (script it inline).
Both at once → it's earned the handle. Nothing else gets frozen.
