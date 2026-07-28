---
name: architect-graph-handle
description: On-demand AI-native read surface over the live PatternGraph for this Architect repo. Load when you need an architectural slice the canonical verbs do not pre-bake — neighborhoods, dependency subgraphs, role/context groupings, blast radius, what a pattern guarantees, which specs re-verify a change — or when you would otherwise grep/Read across files to learn the architecture. One command (`pnpm playground:q '<js>'`) builds the graph live in-process and hands you `g`, a typed object whose methods return plain composable data; you script the cut in plain JS instead of stitching CLI calls. Complements (never replaces) `pnpm architect:query` — the verbs stay canonical for pattern state. Reach here to navigate and reshape graph cuts fluidly, and to replace manual grep with a truer, ~one-fifth-context answer.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Graph Handle — `pnpm playground:q`

A live, in-memory handle (`g`) over this repo's **PatternGraph** — the knowledge graph of
~348 architectural patterns (services, contracts, codecs, projections, specs) built from
annotated source. You write a line of JS; `g` answers it in-process and only your
**conclusion** returns — roughly ⅕ the context of grep or a verb round-trip, because the data
never leaves the process.

**Reach here when** you'd otherwise grep/Read across files to learn the architecture, or when
you want a cross-cut no single verb produces: a file's owner + neighborhood, a symbol's
architectural usage, the blast radius of a diff, what a pattern guarantees, which specs
re-verify a change, or any role/context/maturity reshape.

## The one command

```bash
pnpm playground:q '<js expression OR statement body>'      # argv
pnpm playground:q < playground/scratch/my-cut.ts           # stdin, for multi-line scripts
pnpm playground:cli <command>                              # named demos (below)
```

`--conditions=source` is already baked into these `pnpm` scripts — don't add it. The graph builds
fresh from HEAD each call (~1.5s, no cache), so a just-saved annotation shows on the next call.

**Inside a script** `g`, `inspect` (node:util), `execFileSync` (node:child_process), and
`REPO_ROOT` (repo-root abs path) are injected; cwd is the repo root. Two rules, because the body
is eval'd as a **function body**: (1) **no `import`/`export`** and no TS-only syntax (type
annotations, `<generics>`, `!`) — it's plain JS at eval time; (2) end an argv/stdin body with
`return <value>` (inspect-printed) and/or `console.log`. A single argv **expression**
(`g.patterns.length`) works too — no `return` needed.

> **Automation/hooks: never call `playground:q` bare.** With no arg and a non-TTY stdin it waits
> forever on stdin. Always pass an arg or piped input (`… < /dev/null` is safe).

## The surface (`g.*`)

```ts
g.patterns              // PatternNode[] — {name, status, maturity, role, boundedContext, productArea,
                        //                  sourceFile, uses[], usedBy[], ruleCount, scenarioCount}
g.pattern(name)         // one PatternNode | undefined
g.fileToPattern(file)   // repo-rel .ts → owning pattern name | undefined

// entry adapters — the grep→graph bridge (you start from a string / file / symbol, not a name):
g.findByConcept('rate limiter')   // fuzzy concept → ranked curated patterns (+ why each matched)
g.byFile('packages/.../x.ts')     // file → owning pattern + neighborhood (dark files get the mechanical one)
g.bySymbol('ProjectionBundle')    // exported symbol → defining file(s) + who imports it (.importedByPatterns)

// the spec bridge — invariants & at-risk specs of ANY maturity, labeled exec vs authored:
g.invariantsOf(patternOrFile)     // "what does this guarantee?" → Invariant[] (maturity + provenance)
g.specsReverifying(filesOrNames)  // "what re-verifies if these change?" → AtRiskSpec[]
g.blastRadius(changedFiles)       // exhaustive impact over the substrate (+ .atRiskSpecs, reaches dark files)

// curation-assist:
g.fanInCandidates() · g.graphDiff() · g.census() · g.driftFlags(existsFn)

// escape hatches — the raw shapes, never hidden:
g.authored              // {patterns, relationshipIndex}  (the curated core)
g.mech                  // {symbols, edges, …}            (the mechanical substrate / firehose)
```

Accessors return plain data (no `{success, data}` envelopes) — compose them directly. The three
bridge return shapes (so you don't have to inspect-and-guess):

```ts
Invariant   { rule, text, pattern, maturity, provenance, featureFile, provenByScenarios[], cohort? }
AtRiskSpec  { scenario, pattern, featureFile, line?, maturity, provenance, semanticTags[], cohort? }
bySymbol →  { symbol, definedIn[{file,kind,pkg,pattern?}], importedByFiles[], importedByPatterns[] }
```

`provenance` is `'executable'` (a live test proves it) or `'authored'` (a working-spec). `cohort` is
present only when the realizing feature covers >1 pattern (the result isn't specific to your one
query). Full field shapes live in `playground/schema.ts`.

## Handle vs verb — the decision guide

The handle **complements** `pnpm architect:query` (the `architect-data-api` skill); it does not
replace it. The verbs are the canonical, product-facing read surface for pattern **state** (they
also feed Studio/MCP). The handle is the **agent sink** for ad-hoc cross-cuts the verbs don't
pre-bake. Reach for whichever is cheaper:

| You're starting from…  | want…                               | reach for                                            |
| ---------------------- | ----------------------------------- | ---------------------------------------------------- |
| a pattern **name**     | its state / deps / rules            | **verbs** (`bundle`, `pattern`, `rules`) — canonical |
| a **concept string**   | which patterns relate               | `g.findByConcept`                                    |
| a **file**             | owner + neighborhood (even if dark) | `g.byFile`                                           |
| a **symbol**           | architectural usage                 | `g.bySymbol`                                         |
| a **diff / changeset** | impact + which specs re-verify      | `g.blastRadius` / `g.specsReverifying`               |
| a **custom cross-cut** | a slice no single verb produces     | the handle + a script                                |

When in genuine doubt about pattern **state**, the verbs are canonical. For everything that is a
join, a pivot, or a reshape over the shapes, script it here.

## Examples (each verified — real output)

**Grep replacement — graph state instead of file-scanning.**

```bash
# who owns this file, and what's around it? (replaces several greps; maps results into the architecture)
pnpm playground:q 'g.byFile("packages/architect-projection/src/fragments/base.ts")'

# where does this exported symbol get used, architecturally?
pnpm playground:q 'g.bySymbol("ProjectionBundle").importedByPatterns'

# which patterns relate to a concept I only have as a phrase?
pnpm playground:q 'g.findByConcept("taxonomy").slice(0,5).map(h => [h.name, h.score])'
```

**Spec context — what does this guarantee, and is it proven?**

```bash
# invariants of a pattern, each labeled live-test (executable) vs authored working-spec
pnpm playground:q 'g.invariantsOf("PatternGraphApi").map(i => ({rule:i.rule, maturity:i.maturity, provenance:i.provenance}))'
```

> **Honest nuance:** `invariantsOf` covers **Gherkin** invariants (Rule blocks). A code-originated
> **contract** (e.g. `ProjectionContext`) returns `[]` because its guarantee is its TS **type**, not
> a Rule — `[]` is _not_ "guarantees nothing." `pnpm playground:cli invariants <name>` prints a note
> for that case.

**The headline — blast radius of a change + which specs re-verify.** Save to
`playground/scratch/headline.ts` (no `import`; end with `return`), pipe it in:

```js
const changed = ['packages/architect-core/src/read-api/pattern-graph-api.ts']; // or a git diff list
const b = g.blastRadius(changed);
const specs = g.specsReverifying(changed);
return {
  downstreamPatterns: b.mechPatterns.length, // exhaustive impact (reaches dark files)
  specsReverifying: specs.length,
  byProvenance: specs.reduce((m, s) => ((m[s.provenance] = (m[s.provenance] || 0) + 1), m), {}),
};
// → { downstreamPatterns: 8, specsReverifying: 30, byProvenance: { executable: 30 } }
```

```bash
pnpm playground:q < playground/scratch/headline.ts
```

To seed from a real diff, build `changed` in-script — `execFileSync` and `REPO_ROOT` are injected:
`execFileSync('git', ['diff','--name-only','HEAD~10','--'], {encoding:'utf8', cwd: REPO_ROOT}).split('\n').filter(Boolean)`.

**Navigate + reshape — pivot the shapes in-process.** An argv body may hold statements:

```bash
# projection-role patterns with zero downstream consumers — deletion candidates
pnpm playground:q 'const ps = g.patterns.filter(p => p.role === "projection" && p.usedBy.length === 0); return ps.length'
```

```js
// group patterns by bounded-context seam (a 3-line groupBy over an exposed field — stays a script)
const bySeam = new Map();
for (const p of g.patterns)
  if (p.boundedContext) {
    if (!bySeam.has(p.boundedContext)) bySeam.set(p.boundedContext, []);
    bySeam.get(p.boundedContext).push(p.name);
  }
return [...bySeam]
  .map(([ctx, m]) => [ctx, m.length])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
```

**Escape hatch — raw shapes when no view fits.** The substrate is one property away:

```bash
pnpm playground:q 'const t = g.mech.edges.filter(e => e.typeOnly).length; return `${t}/${g.mech.edges.length} import edges are type-only`'
```

## Named demo commands (`playground:cli`)

```bash
pnpm playground:cli diff          # mechanical ⋈ authored: shared / dark / aspirational
pnpm playground:cli blast HEAD~8  # impact: downstream + at-risk specs of a diff
pnpm playground:cli fan-in        # curation assist: load-bearing, uncurated modules
pnpm playground:cli census        # node/edge annotation coverage
pnpm playground:cli find taxonomy                 # E1 concept → patterns
pnpm playground:cli file packages/.../x.ts        # E2 file → owner + neighborhood
pnpm playground:cli symbol ProjectionBundle       # E3 symbol → defining pattern + importedBy
pnpm playground:cli invariants <Pattern>          # "what does this guarantee?" (with the contract-empty note)
pnpm playground:cli specs HEAD~8                   # specs re-verifying a diff, labeled
```

`pnpm playground:smoke` — opt-in invariant regression check (asserts invariants, never frozen
counts; not a CI gate). Run it if you suspect the surface itself is misbehaving.

## The principle — script the rest, freeze almost nothing

Most questions are a **script over the exposed shapes**, not a new method. The handle freezes only
**irreducible cross-source joins** — the entry adapters (`findByConcept`/`byFile`/`bySymbol`), the
spec bridge (`invariantsOf`/`specsReverifying`), and `blastRadius`. A `groupBy` over an exposed
field stays a script, on purpose — freezing thin traversals is how this would quietly re-become the
30-verb wall the repo is deleting. When no view fits, drop to `g.mech` / `g.authored` and script
against the raw event-store shapes.

## Depth — the playground docs

- `playground/USAGE.md` — the road-test guide + the full demand map (handle vs verb).
- `playground/recipes.md` — the "script the rest" recipes + the freeze-vs-script bar.
- `playground/README.md` — the surface, the two-surface model, and all run commands.
- `playground/CONTEXT.md` — why it's shaped this way (the curated/mechanical split, staleness).
- `playground/graph.ts` + `playground/schema.ts` — the actual `g.*` methods + field shapes.
