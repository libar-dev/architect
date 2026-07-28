# playground — two-surface PatternGraph infra

Seed of the base Architect read-surface for agents. The bet: **expose the data
shapes + a few trusted view functions, and let the agent script the rest** —
instead of a 30-verb API that hides the shapes behind verbose, per-question
envelopes. Validated empirically this session: scripting over loaded shapes spent
~⅕ the context of grep / the verb API, because the data stays in-process and only
_conclusions_ return.

## The two surfaces (different purposes, never merged)

|                      | **Curated** (Layer 2)                           | **Mechanical substrate** (Layer 1)                    |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| answers              | "what is the architecture"                      | "what could break / where is this used at all"        |
| virtue               | editorial sparsity (human judgment)             | exhaustiveness (derived)                              |
| source               | annotations → live graph (`live.ts`, in-memory) | `extract.ts` tsc walk of `packages/*/src` (in-memory) |
| vs a language server | **is the differentiator**                       | **is the language server**                            |

The curated graph is a deliberate ~6–11% selection of the import firehose — that
selection _is_ the product. The substrate is derived on demand for the one class
of question that legitimately wants the firehose (impact / re-test scope) plus two
curation-assist roles. We do **not** derive the architecture from code; that would
just rebuild the language server and throw away the curation.

> **New here? Road-testing the handle? → read [`USAGE.md`](./USAGE.md) first.**
> Extending the handle? → [`ITERATION.md`](./ITERATION.md). Why it's shaped this way → [`CONTEXT.md`](./CONTEXT.md).

## Live, always — no dump

Both cores are **built fresh in-process every `loadGraph()`** (~1.5s), so the graph
always reflects HEAD — annotate a file, and the next call sees it. There is **no
snapshot on disk**; the sandbox reads nothing. Two consequences you must respect:

- **Run with `--conditions=source`.** The authored core builds via the live pipeline,
  which imports `@libar-dev/architect-*`. Without the source export-condition, Node
  resolves the stale compiled `dist/` instead of `src/*.ts`. The flag is the whole
  staleness fix (the dump was one source of stale; `dist/` is the other). See
  [`CONTEXT.md`](./CONTEXT.md) §"staleness".
- **`loadGraph()` is async** (the pipeline is): `const g = await loadGraph();`.

## Files

- `schema.ts` — the **exposed shapes** (Zod) only — no IO, no loaders. The now-typed
  Gherkin (`Scenario`, `Rule`) + the maturity axis (`MATURITY_BY_STATUS`). Read, then script.
- `graph.ts` — **the handle: `await loadGraph()`**. One typed object; joins + taxonomy-decode
  done once; need-shaped accessors returning plain data. The AI-native read surface — `g.pattern`,
  `g.invariantsOf`, `g.specsReverifying`, `g.blastRadius`, the entry adapters, the curation-assist
  views, and the raw escape hatches `g.mech` / `g.authored`. `Invariant` / `AtRiskSpec` carry a
  `cohort?` (the patterns a multi-pattern realizing feature covers — present only when the result
  isn't specific to your one query). Start here to script.
- `q.ts` — **the eval entry / front door.** Loads the graph once, evaluates your JS with `g` in
  scope, inspect-prints the result. The lowest-friction way for an agent to ask the graph anything.
- `live.ts` — Layer-2 builder: `buildAuthoredCore()` builds the curated core from the **live**
  PatternGraph (`buildCliContext`, `noCache`). Holds the cli-runtime wire + the `--conditions=source` rule.
- `extract.ts` — Layer-1 builder: `buildMechanicalCore()` walks `packages/*/src` with the TS
  compiler API (syntactic, no type-checker), follows re-export barrels to the defining symbol.
- `views.ts` — the pure view library the handle delegates to (`graphDiff`, `blastRadius`,
  `fanInCandidates`, `driftFlags`, `census`, entry adapters `findByConcept`/`byFile`/`bySymbol`).
- `cli.ts` — thin demo runner over the handle + views (the named commands below).
- `recipes.md` — the "script the rest" demonstrations: I1/A1/A2 + the DRIFT alarm + a cross-method
  compose, each a copy-pasteable script over the handle (verified), **not** a verb.
- `scratch/` — gitignored; drop multi-line ad-hoc scripts here and pipe them into `q.ts`.

## Run — the front door (`q.ts`)

Use the **`pnpm playground:*` scripts** — they bake in `--conditions=source` (the staleness fix; see
[`CONTEXT.md`](./CONTEXT.md) §9.6), so you can't silently read stale `dist/`:

```bash
# one-off expression (g = the live handle):
pnpm playground:q 'g.patterns.length'
pnpm playground:q 'g.invariantsOf("AnnotationCoverageProjection")'

# an argv body may also be multiple statements (not just a single expression):
pnpm playground:q 'const x = g.patterns.length; return x'

# multi-line cut from stdin (may console.log itself and/or `return` a value):
pnpm playground:q < playground/scratch/cut.ts
```

> **Automation / hooks: never call `playground:q` bare.** Always pass an explicit input — an
> expression/statement arg, or piped stdin (`… q.ts < file`). With no args and a non-TTY stdin
> that sends no EOF, `q.ts` waits forever on stdin (the usage banner only prints on a real TTY).
> `… q.ts < /dev/null` is safe.

## Run — the named demo commands (`cli.ts`)

```bash
pnpm playground:cli diff          # mechanical ⋈ authored: shared / dark / aspirational
pnpm playground:cli blast HEAD~8  # impact: downstream + at-risk specs of a diff
pnpm playground:cli fan-in        # curation assist: load-bearing, uncurated modules
pnpm playground:cli drift         # scoped, unambiguous drift (target code gone)
pnpm playground:cli census        # node/edge annotation coverage
```

Regression smoke (opt-in; **not** a CI gate — playground is CI-excluded):

```bash
pnpm playground:smoke   # invariant regression check (asserts invariants, never frozen counts; exits 1 on any ✗)
```

Entry adapters — the grep→graph bridge (agents start from a string/file/symbol, not a name):

```bash
pnpm playground:cli find taxonomy                                              # E1: fuzzy concept → ranked patterns (curated)
pnpm playground:cli file packages/architect-core/src/config/regex-builders.ts # E2: file → owning pattern + neighborhood (this one is DARK → mechanical neighborhood; 4/5 importers are curated patterns)
pnpm playground:cli symbol ProjectionBundle                                   # E3: export symbol → defining pattern + importedBy
```

Maturity-spanning Gherkin views — invariants / at-risk specs of **any** maturity, each
labeled `executable`(live test) vs `authored`(working-spec):

```bash
pnpm playground:cli maturity                                # the tier ladder
pnpm playground:cli invariants AnnotationCoverageProjection # "what does this guarantee?"
pnpm playground:cli invariants ProjectionContext            # code-originated contract → the honest "[] is structural, not a Rule" note
pnpm playground:cli specs HEAD~8                            # specs re-verifying a diff, labeled
```

Or pipe a multi-line cut into `q.ts` — `g` / `inspect` / `execFileSync` / `REPO_ROOT` are injected,
cwd is the repo root, no imports needed (save to `playground/scratch/cut.ts`):

```js
// projection-role patterns with zero downstream consumers — deletion candidates
return g.patterns
  .filter((p) => p.role === 'projection' && p.usedBy.length === 0)
  .map((p) => p.name);
```

```bash
pnpm playground:q < playground/scratch/cut.ts
```

For full TypeScript, write a **standalone** module in `playground/scratch/` instead —
`import { loadGraph } from '../graph.ts'` (note `../` — scratch is one level down),
`const g = await loadGraph()`, plus `import { REPO_ROOT } from '../repo-root.ts'` and `cwd: REPO_ROOT`
for any `git`/shell-out — and run it with `tsx --conditions=source` directly (a standalone module
bypasses `q.ts`, so there is no `pnpm playground:*` wrapper — pass the flag yourself):
`pnpm exec tsx --conditions=source playground/scratch/<name>.ts`.
