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

- `schema.ts` — the **exposed shapes** (Zod) + loaders. Read this, then script freely.
- `extract.ts` — Layer-1 builder. Walks `packages/*/src` with the TS compiler API
  (syntactic, no type-checker), follows re-export barrels to the defining symbol.
- `views.ts` — the trusted view library (pure functions): `graphDiff`,
  `blastRadius`, `fanInCandidates`, `driftFlags`, `census`, plus the entry
  adapters `findByConcept` (E1), `byFile` (E2), `bySymbol` (E3).
- `cli.ts` — thin demo runner over the views.
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

Or import the library directly and script your own cut:

```ts
import { loadMechanical, loadAuthored } from './schema.ts';
import { blastRadius } from './views.ts';
const r = blastRadius(loadMechanical(), loadAuthored(), ['packages/architect-core/src/foo.ts']);
```

## Regenerating the curated input

`data/pattern-graph-core.json` is a snapshot of the authored graph:

```bash
pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts --core playground/data/pattern-graph-core.json
```
