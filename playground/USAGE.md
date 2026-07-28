# USAGE — road-test the live graph handle

**You are a Claude session about to use (and stress-test) the AI-native graph interface.**
This is the page to start from. ~5 minutes of orientation, then you script.

## What this is (and is not)

- **The handle is one live, in-memory object** (`g`) built fresh from HEAD each call (~1.5s).
  Its method list _is_ the surface — read shapes, call accessors, and **script the rest** in
  plain JS. It returns plain composable data (no envelopes), so the data stays in-process and
  only your _conclusions_ return — roughly ⅕ the context of grep or a verb-API round-trip.
- **It complements `pnpm architect:query`, it does not replace it.** The verbs are the stable,
  product-facing read surface (they also feed Studio/MCP). The handle is the **agent sink**: a
  flexible eval sandbox for cuts the verbs don't pre-bake. Reach for whichever is cheaper for the
  question (see the demand map). When in genuine doubt about pattern _state_, the verbs are canonical.
- **It is read-only and CI-excluded.** `playground/**` is `tsx`-run only. You cannot break the
  build from here. Experiment freely.

## The one command

```bash
pnpm playground:q 'g.<expression>'
```

Use the **`pnpm playground:*` scripts** — they bake in `--conditions=source`, which is required
(without it the graph reads stale compiled `dist/`; see CONTEXT.md §9.6). For multi-line cuts, write
a file in `playground/scratch/` and pipe it in:

```bash
pnpm playground:q < playground/scratch/my-cut.ts
```

In scope inside `q.ts`: **`g`** (the handle), `inspect` (node:util), `execFileSync` (node:child_process),
**`REPO_ROOT`** (repo-root abs path). `q.ts` also runs your script with **cwd at the repo root**, so
cwd-relative `git` / paths in a piped script are stable wherever you invoke `q.ts` from.
An argv expression is returned+printed; an argv body may also be multiple statements
(`'const x = …; return x'`); a stdin script may `console.log` itself and/or `return` a value.

> **In automation / hooks, always pass an explicit input** — an expression arg or a piped script
> (`… q.ts < file`). Never invoke `playground:q` **bare** in a non-interactive context: with no args
> and a non-TTY stdin that never sends EOF, it **waits forever** on stdin (usage only prints on a real
> TTY). `… q.ts < /dev/null` is safe; a bare call in a pipeline is not.

## The surface (what `g` gives you)

```ts
g.patterns                       // PatternNode[]  — decoded: name, status, maturity, role, boundedContext,
                                 //   level, parent, children, uses, usedBy, implementedBy, implements,
                                 //   enforcesDecisions, ruleCount, scenarioCount
                                 //   (parent/children = epic↔member; implements/implementedBy/enforcesDecisions
                                 //    = the realization + decision edges — the architectural-significance signals)
g.pattern(name)                  // one PatternNode | undefined
g.fileToPattern(file)            // repo-rel .ts → owning pattern name | undefined

// entry adapters — the grep→graph bridge (you start from a string / file / symbol, not a name):
g.findByConcept('rate limiter')  // E1: fuzzy concept → ranked curated patterns (+ why each matched)
g.byFile('packages/.../x.ts')    // E2: file → owning pattern + neighborhood (dark files get the mechanical one)
g.bySymbol('ProjectionBundle')   // E3: exported symbol → defining file(s) + who imports it

// the spec bridge — invariants & at-risk specs of ANY maturity, labeled exec vs authored:
g.invariantsOf(patternOrFile)    // "what does this guarantee?"  → Invariant[]  (maturity + provenance)
                                 //   covers GHERKIN invariants (Rule blocks). A code-originated
                                 //   contract (sourceFile *.ts, e.g. a `contract`/`codec`) expresses
                                 //   its guarantee as its TS TYPE, so [] there means "structural, not
                                 //   a Rule" — not "guarantees nothing" (the `invariants` cli says so).
g.specsReverifying(filesOrNames) // "what re-verifies if these change?" → AtRiskSpec[]
g.blastRadius(changedFiles)      // exhaustive impact over the substrate (+ .atRiskSpecs, reaching dark files)

// curation-assist:
g.fanInCandidates() · g.graphDiff() · g.census() · g.driftFlags(existsFn)

// escape hatches — the raw shapes, never hidden:
g.authored                       // {patterns, relationshipIndex}  (the curated core)
g.mech                           // {symbols, edges, …}            (the mechanical substrate / firehose)
```

Field shapes live in `schema.ts`. The freeze-vs-script reasoning lives in `recipes.md`.

`pnpm playground:smoke` — invariant regression check (opt-in, **not** a CI gate). Asserts the
invariants that keep the surface honest (load sanity, drift = 0, the maturity⟺provenance coherence
rule, the entry/spec bridges, the `q.ts` front door incl. the multi-statement argv form) — never
frozen counts, since the graph is live. Exits 1 if any check fails.

## When to use the handle vs the verbs (demand map)

| You're starting from…  | want…                               | reach for                                            |
| ---------------------- | ----------------------------------- | ---------------------------------------------------- |
| a pattern **name**     | its state / deps / rules            | **verbs** (`bundle`, `pattern`, `rules`) — canonical |
| a **concept string**   | which patterns relate               | `g.findByConcept`                                    |
| a **file**             | owner + neighborhood (even if dark) | `g.byFile`                                           |
| a **symbol**           | architectural usage                 | `g.bySymbol`                                         |
| a **diff / changeset** | impact + which specs re-verify      | `g.blastRadius` / `g.specsReverifying`               |
| a **custom cross-cut** | a slice no single verb produces     | the handle + a script (`recipes.md`)                 |

## Copy-paste examples — the two goals

**Goal 1 — graph state instead of grep.**

```bash
# who owns this file, and what's around it? (no grep, no file-open)
pnpm playground:q 'g.byFile("packages/architect-projection/src/fragments/base.ts")'

# where does this exported symbol get used, architecturally?
pnpm playground:q 'g.bySymbol("ProjectionBundle").importedByPatterns'

# what patterns relate to a concept I only have as a phrase?
pnpm playground:q 'g.findByConcept("taxonomy").slice(0,5).map(h => [h.name, h.score])'
```

**Goal 2 — design against the graph (impact on code AND on other design-level specs).**

Key fact for design work: **authored design-level specs are in the core**, labeled
`provenance: 'authored'`. So "what other design-level specs does my change touch?" is a
`provenance` filter away — not a separate search.

```bash
# what re-verifies if I touch these files — across executable AND authored (design) specs?
pnpm playground:q 'g.specsReverifying(["packages/architect-core/src/foo.ts"])'

# narrow to the DESIGN-LEVEL (authored, not-yet-executable) specs my change implicates:
pnpm playground:q 'g.specsReverifying(["packages/architect-core/src/foo.ts"]).filter(s => s.provenance === "authored")'

# what does a pattern guarantee, and is each invariant proven by a live test or only authored?
pnpm playground:q 'g.invariantsOf("AnnotationCoverageProjection").map(i => ({rule:i.rule, maturity:i.maturity, provenance:i.provenance}))'
```

**Compose (the flagship — a cut no verb produces).** Write `playground/scratch/risk.ts` —
note: **no `import`** (a piped script is a function body; `g`/`inspect`/`execFileSync`/`REPO_ROOT`
are already injected, and cwd is the repo root; end with `return`):

```ts
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD~10', '--'], {
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

```bash
pnpm playground:q < playground/scratch/risk.ts
```

### Two ways to run a multi-line cut (don't mix them)

| mode                                    | how you get `g`                                                                       | imports?                                    | shell-out cwd                                                        | run with                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **piped into `q.ts`** (above)           | injected (`g`, `inspect`, `execFileSync`, `REPO_ROOT`)                                | **no** — function body, `import` is illegal | repo root (q.ts `chdir`s)                                            | `pnpm playground:q < scratch/x.ts`                                                                   |
| **standalone file** (like `recipes.md`) | `import { loadGraph } from '../graph.ts'` (note `../`); `const g = await loadGraph()` | yes — a normal module                       | `import { REPO_ROOT } from '../repo-root.ts'`, pass `cwd: REPO_ROOT` | `tsx --conditions=source playground/scratch/x.ts` (bypasses `q.ts` — no `pnpm playground:*` wrapper) |

`q.ts` catches a stray `import` and points you here, so you won't be left with a raw stack trace.

## The principle you're testing

Most questions should be a **script over the shapes**, not a new method. A recipe earns a frozen
handle method only when it is BOTH reached by many consumers AND an irreducible cross-source join
(`recipes.md`, last section). If you find yourself wishing for a method, first check it isn't a
3-line `groupBy` over an exposed field — those stay scripts, on purpose.

## What to report back

You are the proof-of-use. After a real working session, note:

1. **Friction** — where the eval ergonomics fought you (quoting, multi-line, output size).
2. **Missing cuts** — a question you wanted that needed an awkward script → candidate recipe (or, if
   it clears the bar, a handle method). Add verified recipes to `recipes.md`.
3. **Wrong / missing data** — a pattern/edge/invariant the graph got wrong or didn't have →
   that's an annotation gap or a real bug; capture it (and append to repo-root `FEEDBACK.md` if it's
   a verb/pipeline surprise).
4. **Latency** — if ~1.5s/call became a real drag in your loop (the only thing that would justify a
   watch-server later).
5. **Handle-vs-verb** — cases where you reflexively grepped or hit a verb when the handle was cheaper,
   or vice versa. That calibrates the demand map.
