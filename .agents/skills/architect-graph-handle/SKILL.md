---
name: architect-graph-handle
description: THE agent read surface over the live PatternGraph for this Architect repo (ADR-014 — the verb CLI is retired). Load whenever you need graph state — a pattern's status/deps/rules, an architectural slice, neighborhoods, blast radius of a diff, what a pattern guarantees, which specs re-verify a change — or when you would otherwise grep/Read across files to learn the architecture. One command (`pnpm architect:q '<js>'`) builds the graph live in-process and hands you `g`, a typed object whose methods return plain composable data; you script the cut in plain JS instead of calling pre-baked verbs. The complete frozen read model is `g.graph`, deterministic transition operations are `g.fsm`, and reusable read algorithms stay pure core functions. Ordinary grep over annotated source remains the complement for content-level search; MCP `architect_*` tools remain for burst-mode/Studio use.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Architect Graph Handle — `pnpm architect:q`

The live, in-memory handle (`g`) over this repo's **PatternGraph** — the knowledge graph of
architectural patterns (services, contracts, codecs, projections, specs) built from annotated
source. You write a line of JS; `g` answers it in-process and only your **conclusion**
returns — roughly ⅕ the context of grep or a verb round-trip, because the data never leaves
the process.

**This is the primary read surface (ADR-014).** The old `pnpm architect:query` verb CLI is
deleted; pattern-state questions, architectural slices, and impact cuts are all answered
here. What remains beside it: **grep** over annotated source (for content-level search the
graph doesn't index), the **`architect_*` MCP tools** (the stable typed surface for
burst-mode use and the Studio sink), and the deterministic gates (`pnpm architect:guard`,
`pnpm architect:graph dangling`, `pnpm docs:check`).

## The one command

```bash
pnpm architect:q '<js expression OR statement body>'      # argv
pnpm architect:q < playground/scratch/my-cut.ts           # stdin, for multi-line scripts
pnpm architect:graph <command>                            # named demos + the dangling gate
```

`--conditions=source` is already baked into these `pnpm` scripts — don't add it. The graph
builds fresh from the working tree each call (~2s, no cache), so a just-saved annotation
shows on the next call.

**Inside a script** `g`, `inspect` (node:util), `execFileSync` (node:child_process), and
`REPO_ROOT` (repo-root abs path) are injected; cwd is the repo root. Two rules, because the
body is compiled as a **function body**: (1) **no `import`/`export`** and no TS-only syntax
(type annotations, `<generics>`, `!`) — it's plain JS at eval time; (2) end an argv/stdin
body with `return <value>` (inspect-printed) and/or `console.log`. A single argv
**expression** (`g.patterns.length`) works too — no `return` needed.

> **Automation/hooks: never call `architect:q` bare.** With no arg and a non-TTY stdin that
> never sends EOF it waits on stdin. Always pass an arg or piped input (`… < /dev/null` is safe).

## The surface (`g.*`)

```ts
g.patterns              // PatternNode[] — {name, status, maturity, role, boundedContext, productArea,
                        //   sourceFile, level, parent, children[], uses[], usedBy[], implementedBy[],
                        //   implements[], enforcesDecisions[], ruleCount, scenarioCount}
g.pattern(name)         // one PatternNode | undefined
g.fileToPattern(file)   // repo-rel .ts → owning pattern name | undefined
g.graph                 // complete, deeply frozen PatternGraph (ADR-006 read side):
                        //   .patterns · .counts · .byStatus · .byNormalizedStatus
                        //   .relationshipIndex · .tagRegistry · .archIndex

g.fsm                   // four deterministic transition operations:
                        //   .isValidTransition · .validateTransition
                        //   .getValidTransitionsFrom · .getProtectionSummary

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

`g.mech` imports are diagnostic context, not authored architecture. Dark imports default to no action; only add a curated edge when the significance rubric shows an intentional architectural dependency.

// escape hatches — the raw shapes, never hidden:
g.authored              // {patterns, relationshipIndex}  (the curated core)
g.mech                  // {symbols, edges, …}            (the mechanical substrate / firehose)
```

Accessors return plain data (no `{success, data}` envelopes) — compose them directly. The
three bridge return shapes (so you don't have to inspect-and-guess):

```ts
Invariant   { rule, text, pattern, maturity, provenance, featureFile, provenByScenarios[], cohort? }
AtRiskSpec  { scenario, pattern, featureFile, line?, maturity, provenance, semanticTags[], cohort? }
bySymbol →  { symbol, definedIn[{file,kind,pkg,pattern?}], importedByFiles[], importedByPatterns[] }
```

`provenance` is `'executable'` (a live test proves it) or `'authored'` (a working-spec).
`cohort` is present only when the realizing feature covers >1 pattern (the result isn't
specific to your one query). Full field shapes live in
`packages/architect-core/src/graph/schema.ts` + `graph.ts`. The published pure contract is
`@libar-dev/architect-core/graph`; source/config/git IO remains in `architect-cli`.

## Where to reach — the decision guide

| You're starting from…                    | want…                               | reach for                                                      |
| ---------------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| a pattern **name**                       | its state / deps / rules            | `g.pattern` / `g.graph.relationshipIndex` / `g.invariantsOf`   |
| a **concept string**                     | which patterns relate               | `g.findByConcept`                                              |
| a **file**                               | owner + neighborhood (even if dark) | `g.byFile`                                                     |
| a **symbol**                             | architectural usage                 | `g.bySymbol`                                                   |
| a **diff / changeset**                   | impact + which specs re-verify      | `g.blastRadius` / `g.specsReverifying`                         |
| an **FSM transition**                    | is it legal?                        | `g.fsm.isValidTransition(from, to)`                            |
| a **custom cross-cut**                   | a slice no method pre-bakes         | script it (see [references/recipes.md](references/recipes.md)) |
| **file contents** (strings, code idioms) | textual matches                     | plain grep — the graph doesn't index bodies                    |
| a **burst** of ≥5 typed reads, or Studio | stable typed tools                  | the `architect_*` MCP surface                                  |

## Examples (each verified — real output)

**Grep replacement — graph state instead of file-scanning.**

```bash
# who owns this file, and what's around it? (replaces several greps; maps results into the architecture)
pnpm architect:q 'g.byFile("packages/architect-projection/src/fragments/base.ts")'

# where does this exported symbol get used, architecturally?
pnpm architect:q 'g.bySymbol("ProjectionBundle").importedByPatterns'

# which patterns relate to a concept I only have as a phrase?
pnpm architect:q 'g.findByConcept("taxonomy").slice(0,5).map(h => [h.name, h.score])'
```

**Pattern state — the old verb menu, one script each.**

```bash
pnpm architect:q 'g.pattern("GraphHandle")'                          # detail (need-shaped)
pnpm architect:q 'g.graph.counts'                                    # status distribution
pnpm architect:q 'g.fsm.isValidTransition("roadmap","active")'       # deterministic FSM gate
pnpm architect:q 'g.patterns.filter(p => p.status === "active").map(p => p.name)'
```

**Spec context — what does this guarantee, and is it proven?**

```bash
# invariants of a pattern, each labeled live-test (executable) vs authored working-spec
pnpm architect:q 'g.invariantsOf("GraphHandle").map(i => ({rule:i.rule, maturity:i.maturity, provenance:i.provenance}))'
```

> **Honest nuance:** `invariantsOf` covers **Gherkin** invariants (Rule blocks). A
> code-originated **contract** (e.g. `ProjectionContext`) returns `[]` because its guarantee
> is its TS **type**, not a Rule — `[]` is _not_ "guarantees nothing."
> `pnpm architect:graph invariants <name>` prints a note for that case; the GUARANTEE recipe
> disambiguates in one line.

**The headline — blast radius of a change + which specs re-verify.** Save to
`playground/scratch/headline.ts` (no `import`; end with `return`), pipe it in:

```js
const changed = ['packages/architect-core/src/graph/graph.ts']; // or a git diff list
const b = g.blastRadius(changed);
const specs = g.specsReverifying(changed);
return {
  downstreamPatterns: b.mechPatterns.length, // exhaustive impact (reaches dark files)
  specsReverifying: specs.length,
  byProvenance: specs.reduce((m, s) => ((m[s.provenance] = (m[s.provenance] || 0) + 1), m), {}),
};
```

```bash
pnpm architect:q < playground/scratch/headline.ts
```

To seed from a real diff, build `changed` in-script — `execFileSync` and `REPO_ROOT` are injected:
`execFileSync('git', ['diff','--name-only','HEAD~10','--'], {encoding:'utf8', cwd: REPO_ROOT}).split('\n').filter(Boolean)`.

**Navigate + reshape — pivot the shapes in-process.** An argv body may hold statements:

```bash
# projection-role patterns with zero downstream consumers — deletion candidates
pnpm architect:q 'const ps = g.patterns.filter(p => p.role === "projection" && p.usedBy.length === 0); return ps.length'
```

**Escape hatch — raw shapes when no view fits.** The substrate is one property away:

```bash
pnpm architect:q 'const t = g.mech.edges.filter(e => e.typeOnly).length; return `${t}/${g.mech.edges.length} import edges are type-only`'
```

## Named commands (`pnpm architect:graph <cmd>`)

```bash
pnpm architect:graph census       # curation candidates, then diagnostic node/edge coverage per package
pnpm architect:graph diff         # mechanical ⋈ authored: shared / dark / aspirational
pnpm architect:graph blast HEAD~8 # impact: downstream + at-risk specs of a diff
pnpm architect:graph fan-in       # curation assist: load-bearing, uncurated modules
pnpm architect:graph drift        # scoped drift: dangling uses / orphaned source (→ 0)
pnpm architect:graph maturity     # the maturity ladder
pnpm architect:graph find taxonomy                 # E1 concept → patterns
pnpm architect:graph file packages/.../x.ts        # E2 file → owner + neighborhood
pnpm architect:graph symbol ProjectionBundle       # E3 symbol → defining pattern + importedBy
pnpm architect:graph invariants <Pattern>          # "what does this guarantee?" (with the contract-empty note)
pnpm architect:graph specs HEAD~8                  # specs re-verifying a diff, labeled
```

The named commands are **runnable documentation** over the handle — scripts, not contracts.
The one exception is the machine gate CI consumes (frozen by the second-caller bar):

```bash
pnpm architect:graph dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict
```

## The principle — script the rest, freeze almost nothing

Most questions are a **script over the exposed shapes**, not a new method. The handle freezes
only **irreducible cross-source joins** — the entry adapters
(`findByConcept`/`byFile`/`bySymbol`), the spec bridge (`invariantsOf`/`specsReverifying`),
and `blastRadius`. A `groupBy` over an exposed field stays a script, on purpose — freezing
thin traversals is how this would quietly re-become the verb wall ADR-014 deleted. When no
view fits, drop to `g.mech` / `g.authored` and script against the raw shapes.

## Depth

- [references/recipes.md](references/recipes.md) — the "script the rest" recipe set
  (STATE · I1 · MEMBERS · A1 · A2 · GUARANTEE · TRIAGE · IMPACT · DRIFT · COMPOSE · escape
  hatch) + the freeze-vs-script graduation bar.
- `packages/architect-core/src/graph/schema.ts` + `graph.ts` — the published Graph methods +
  field shapes; `packages/architect-cli/src/handle/graph.ts` owns only live IO composition.
- `architect/decisions/adr-014-agent-read-surface.feature` — the decision record (why the
  verb CLI is gone, what stayed frozen, the trust posture).
- `playground/CONTEXT.md` — the experiment findings that proved this direction (two-surface
  model, curation-not-drift, context-efficiency numbers).
