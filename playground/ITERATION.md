# ITERATION — extending the graph handle

For a session that will **change or grow** the sandbox (not just use it). Read `CONTEXT.md` for
the _why_ (the two-surface model, the thesis); this is the _how to work on it without regressing_.

## Module layout (what owns what)

```
schema.ts    pure SHAPES (Zod) + maturity consts. No IO, no cli-runtime import. The contract.
extract.ts   buildMechanicalCore(): MechanicalCore   — Layer 1, tsc walk of packages/*/src.
live.ts      buildAuthoredCore(): Promise<AuthoredCore> — Layer 2, live PatternGraph via buildCliContext.
views.ts     pure view library (graphDiff, blastRadius, fanIn…, entry adapters). No IO.
graph.ts     the Graph class + loadGraph(). Joins + taxonomy-decode once at construction.
cli.ts       thin demo runner (named commands). IO (git, print) lives here; views stay pure.
q.ts         the eval entry / front door. Builds g once, evals agent JS, inspect-prints.
```

Data flow: `loadGraph()` = `new Graph(buildMechanicalCore(), await buildAuthoredCore())`. The
`Graph` constructor builds the private indices (`#fileToPattern`, `#implementedBy`, `#features`)
and decodes each pattern into a need-shaped `PatternNode`. Accessors read those indices; the heavy
views are delegated to `views.ts`.

## Constraints you must hold (each cost a debugging hour once)

1. **`--conditions=source`, always.** `live.ts` imports `@libar-dev/architect-*`. Without the
   `source` export-condition, Node resolves the compiled `dist/` and you silently test stale
   pipeline code. Every entry (`q.ts`, `cli.ts`, scratch scripts) must run with it. There is no way
   to enforce this in-process — it's an invocation flag — so it's documented loudly in `live.ts`,
   `README.md`, `USAGE.md`, and here. If you graduate this to a package, make the package's `bin`
   set the condition (or compile, and drop the flag).

2. **`loadGraph()` is async.** `buildAuthoredCore` awaits `buildCliContext`. Anything calling
   `loadGraph()` is async and must `await`. (The mechanical side, `buildMechanicalCore`, is sync —
   a pure tsc walk — so a mechanical-only view need not be async.)

3. **No dump, ever.** The handle reads no file. Don't reintroduce a `data/` cache "for speed" — the
   build is ~1.5s and freshness is the whole point (it's what makes an annotation visible on the
   next call, and what would have caught the fleet's silent-failure-to-zero). The _only_ sanctioned
   reason to commit a snapshot is if a specific view becomes a **machine contract** needing a
   determinism gate — then commit a script + a snapshot + a re-run-diff, scoped to that view, and
   say so. `extract.ts` already emits sorted output to keep that option open.

4. **Anchor to `REPO_ROOT` (`repo-root.ts`), never `process.cwd()`.** The entrypoint must work from any
   directory (a session may run `q.ts` from a subdir, or a tool from outside the repo). The single
   anchor is `repo-root.ts` — a leaf module exporting `REPO_ROOT = resolve(import.meta.dirname, '..')`;
   `live.ts` (pipeline `baseDir`) and `extract.ts` + `cli.ts` (every `git execFileSync` `cwd:`) all
   import it. `process.cwd()` made the graph scan the wrong tree from a subdir and crash (`git
rev-parse` → "not a git repository") from outside the repo. Two more rules keep the SHIPPED SCRIPTS
   location-safe too — a location-stable entrypoint that runs cwd-fragile scripts is incoherent:
   **(a)** `q.ts` does `process.chdir(REPO_ROOT)` (so a piped scratch script's cwd-relative shell-outs
   are stable) and injects `REPO_ROOT` into the eval scope; **(b)** a standalone scratch file (run via
   `tsx` directly, bypassing `q.ts`) must `import { REPO_ROOT }` and pass it as `cwd:` to any
   `git`/shell-out — see the `recipes.md` COMPOSE.

5. **Read stdin via `isatty(0)` (node:tty), never `process.stdin.isTTY`.** `q.ts` reads a piped
   script with `readFileSync(0)`. Merely touching `process.stdin` — even `.isTTY` — instantiates the
   stream and flips fd 0 to NON-BLOCKING, so `readFileSync(0)` then throws `EAGAIN` on any non-trivial
   PIPE (`… | q.ts`, the natural multi-line form; small inputs may sneak through, ~250KB does not).
   `isatty(0)` is a pure fd check that leaves fd 0 blocking, so both `q.ts < file` and `cat file | q.ts`
   read reliably at any size.

6. **Doc examples must be runnable _as written_** — and the sandbox is CI-excluded, so nothing checks
   this but you. `recipes.md` bodies are **piped-into-`q.ts` plain JS**: no `import`, no TS-only syntax
   (`<generics>`, `: types`, `!`) — they are eval'd as a function body, NOT transpiled — and they end
   with `return`/`console.log`. **Standalone** examples live in `scratch/`, so their imports are
   `../graph.ts` / `../repo-root.ts` (one level up) and shell-outs pass `cwd: REPO_ROOT`. A `./graph.ts`
   import, or a `<generic>` in a piped body, is a silent break. Verify by actually running each.

## The freeze-vs-script bar (do NOT grow the surface casually)

The handle deliberately freezes **only** the irreducible joins (the entry adapters, the spec
bridge, the firehose). Everything else is a script the agent writes (`recipes.md`). A recipe earns
a handle method **only when it clears BOTH axes**:

1. **Many consumers** (ADR-010's second-caller) — several recipes need it first.
2. **Irreducible join** — it hides a sharp cross-source join an agent would hand-roll wrong (the
   2-hop `pattern → implementedBy → featureFile → rules` is the canonical example).

A thin traversal over an exposed field (a `groupBy`, a transitive `usedBy` walk) stays a recipe even
if reached often — `maturityLadder` was built, then **removed** from the handle for exactly this
reason (it's `groupBy(g.patterns, p => p.maturity)`; it lives inline in `cli.ts maturity`). When you
feel the pull to add a method, prove it clears both axes or write it as a recipe instead. Growing the
surface uncritically rebuilds the 30-verb wall this experiment exists to delete.

## How to add a new view (the normal change)

1. Write a **pure function** in `views.ts` over `AuthoredCore` / `MechanicalCore` (no IO; inputs are
   match keys / map lookups, never shelled). Keep it deterministic (sort outputs).
2. If it clears the freeze-vs-script bar, **delegate** to it from a `Graph` method in `graph.ts`
   (one-liner). If it doesn't, leave it as a recipe in `recipes.md` and/or a `cli.ts` command.
3. If it answers a question agents start from a **string/file/symbol**, it's an entry adapter —
   match the E1/E2/E3 shape (return the curated answer, and a mechanical fallback for dark files).
4. Add a verified example to `recipes.md` (copy-paste, real output) — that file is the proof that
   "script the rest" stays cheap.
5. **Verify by running** (the playground is CI-excluded; `tsx` is the gate): `pnpm playground:cli census`
   should still load a full graph (a few hundred patterns — read the shape, not a frozen count; the
   numbers drift live), your new path should run clean via `pnpm playground:q`, and `pnpm playground:smoke`
   should stay green (it asserts the invariants, never the counts).

## Taxonomy-decode gotchas (already solved — don't regress)

- Read `role` / `boundedContext` from the **structured fields** (`p.role`, `p.boundedContext`), not
  by peeling `directive.tags` — TS patterns store only the bare key there, so peeling drops ~167.
  (`views.ts` `roleOf`/`contextOf` fall back to the tag only when the field is absent.)
- `maturity` is **derived** from status (`MATURITY_BY_STATUS`), explicit `@architect-maturity:` tag
  wins. The built core stores 0 of these as a field; the handle computes it at construction.
- `provenance` is a separate axis from maturity: `tests/features/**` → `executable`, else `authored`.

## Graduation (later, not now)

When the shapes settle and a second machine consumer appears (Studio Design-Review view), lift
`schema.ts` + `graph.ts` + `views.ts` into a `packages/architect-*` with real lint/build. Keep the
curated/mechanical split as two surfaces and the handle as the typed front door over both. The
**MCP/Studio surface keeps stable verbs** (an app reshapes nothing for itself) — that is a different
consumer from this eval sandbox; do not collapse the two. Until then, stay in `playground/`.
