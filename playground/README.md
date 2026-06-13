# playground — two-surface PatternGraph infra

Seed of the base Architect read-surface for agents. The bet: **expose the data
shapes + a few trusted view functions, and let the agent script the rest** —
instead of a 30-verb API that hides the shapes behind verbose, per-question
envelopes. Validated empirically this session: scripting over loaded shapes spent
~⅕ the context of grep / the verb API, because the data stays in-process and only
_conclusions_ return.

## The two surfaces (different purposes, never merged)

|                      | **Curated** (Layer 2)                        | **Mechanical substrate** (Layer 1)               |
| -------------------- | -------------------------------------------- | ------------------------------------------------ |
| answers              | "what is the architecture"                   | "what could break / where is this used at all"   |
| virtue               | editorial sparsity (human judgment)          | exhaustiveness (derived)                         |
| source               | `data/pattern-graph-core.json` (annotations) | `extract.ts` → `data/mechanical-core.json` (tsc) |
| vs a language server | **is the differentiator**                    | **is the language server**                       |

The curated graph is a deliberate ~6–11% selection of the import firehose — that
selection _is_ the product. The substrate is derived on demand for the one class
of question that legitimately wants the firehose (impact / re-test scope) plus two
curation-assist roles. We do **not** derive the architecture from code; that would
just rebuild the language server and throw away the curation.

## Files

- `schema.ts` — the **exposed shapes** (Zod) + loaders, incl. the now-typed Gherkin
  (`Scenario`, `Rule`) and the maturity axis (`MATURITY_BY_STATUS`). Read this, then script.
- `graph.ts` — **the handle: `loadGraph()`**. One typed object, joins + taxonomy-decode done
  once, need-shaped accessors returning plain data. The AI-native read surface — `g.pattern`,
  `g.invariantsOf`, `g.specsReverifying`, `g.maturityLadder`, `g.blastRadius`, the entry
  adapters, and the curation-assist views, all on one object. Start here to script.
- `extract.ts` — Layer-1 builder. Walks `packages/*/src` with the TS compiler API
  (syntactic, no type-checker), follows re-export barrels to the defining symbol.
- `views.ts` — the pure view library the handle delegates to (`graphDiff`, `blastRadius`,
  `fanInCandidates`, `driftFlags`, `census`, entry adapters `findByConcept`/`byFile`/`bySymbol`).
- `cli.ts` — thin demo runner over the handle + views.
- `recipes.md` — the "script the rest" demonstrations: I1/A1/A2 + a cross-method compose,
  each a copy-pasteable script over the handle (verified), **not** a verb. Read this to see
  how the demand-map's traversal rows get answered without freezing them.
- `data/` — gitignored inputs/outputs (regenerable).

## Run

```bash
pnpm exec tsx playground/extract.ts            # (re)build data/mechanical-core.json
pnpm exec tsx playground/cli.ts diff           # mechanical ⋈ authored: shared / dark / aspirational
pnpm exec tsx playground/cli.ts blast HEAD~8   # impact: downstream + at-risk specs of a diff
pnpm exec tsx playground/cli.ts fan-in         # curation assist: load-bearing, uncurated modules
pnpm exec tsx playground/cli.ts drift          # scoped, unambiguous drift (target code gone)
pnpm exec tsx playground/cli.ts census         # node/edge annotation coverage
```

Entry adapters — the grep→graph bridge (agents start from a string/file/symbol, not a name):

```bash
pnpm exec tsx playground/cli.ts find taxonomy                                          # E1: fuzzy concept → ranked patterns (curated)
pnpm exec tsx playground/cli.ts find "blast radius"                                    # E1: multi-word concept (quote it)
pnpm exec tsx playground/cli.ts file packages/architect-projection/src/fragments/base.ts  # E2: file → owning pattern + neighborhood (dark files get the mechanical one)
pnpm exec tsx playground/cli.ts symbol ProjectionBundle                                # E3: export symbol → defining pattern + importedBy
```

Maturity-spanning Gherkin views — invariants / at-risk specs of **any** maturity, each
labeled `executable`(live test) vs `authored`(working-spec):

```bash
pnpm exec tsx playground/cli.ts maturity                                  # the tier ladder + where authored invariants live
pnpm exec tsx playground/cli.ts invariants AnnotationCoverageProjection   # "what does this guarantee?" (reaches executable specs)
pnpm exec tsx playground/cli.ts invariants ArchitectBriefDeterministicBundle  # a non-implemented candidate spec → authored invariants
pnpm exec tsx playground/cli.ts specs HEAD~8                              # specs re-verifying a diff, maturity + provenance labeled
```

Or import the handle and script your own cut — one object, joins precomputed:

```ts
import { loadGraph } from './graph.ts';
const g = loadGraph();
g.invariantsOf('packages/architect-core/src/foo.ts'); // → Invariant[] (any maturity, labeled)
g.specsReverifying(['packages/architect-core/src/foo.ts']); // → AtRiskSpec[]
g.blastRadius(['packages/architect-core/src/foo.ts']).atRiskSpecs; // impact, now reaching scenarios
```

## Regenerating the curated input

`data/pattern-graph-core.json` is a snapshot of the authored graph:

```bash
pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts --core playground/data/pattern-graph-core.json
```
