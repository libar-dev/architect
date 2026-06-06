# playground — essential context

Conceptual + findings context for this folder. `README.md` is the operational guide
(files, shapes, run commands); this doc is the **why**, the **mental model**, and the
**verified findings** so a future session can re-enter without re-deriving them.

> Status note: this is _working-state notes_, not a projected read-model artifact.
> It records durable findings and decisions, deliberately without dates/worklog
> (live-state doctrine). When a finding graduates into code or an ADR, prune it here.

---

## TL;DR

- **The bet:** for the #1 sink (agents), expose the **raw PatternGraph shapes + a few
  trusted view functions** and let the agent script ad-hoc, instead of a 30-verb API
  that hides the shapes. Freeze a typed contract only when a _second, machine_ consumer
  appears (ADR-010's second-caller bar, applied to projections themselves).
- **The model:** **two surfaces, different purposes.** A **curated** graph (authored,
  sparse, = the architecture) and a **mechanical substrate** (derived, exhaustive, = the
  language server). They are _not_ truth-vs-approximation; they answer different questions.
- **The state:** the substrate + 5 views are built and verified here in `.scratch`-grade
  code, ready to graduate to a package. The thesis held on every probe.

---

## 1. Where this came from

Architect is mid-rearchitecture of its projection pipeline (see root `CLAUDE.md`). Prior
work established, at the byte level, that **~89% of a full PatternGraph snapshot is
precomputed views** — "the current transformations' denormalized opinion," shaped mostly
for markdown (the sink the doctrine ranks _last_). A `--core` snapshot
(`patterns + relationshipIndex + tagRegistry`, ~3.5 MB vs ~30 MB) is the demanding-sink
substrate a live view would actually re-derive from.

Four "synthesis forks" (`architect/uni-docgen-tmp/06-synth-{A,B,C,D}.md`) explored folding
new doc-generation onto the existing engine — but all four were **doctrine-fenced**
(told "single read model, no temporal state, Zod-first"). This playground is the
**unfenced** experiment: with no constraints, re-derive from the naked core forward.

---

## 2. The thesis under test

> Ad-hoc derivation over raw state beats a pipeline of frozen, typed projection fragments
> — for the agent sink. Most projections have exactly one consumer (the one doc); by
> ADR-010's own second-caller bar they should never have been frozen. An agent answers
> them on demand from the core. Where determinism is still required — a **machine
> contract**, not an agent-facing view — it is kept by _committed-script +
> committed-snapshot + re-run-diff_ rather than a frozen typed fragment. (Agent-facing
> views freeze nothing; this playground commits no snapshot — see §5/§7.)

**Success = the flexibility delta** (a cut the frozen pipeline cannot cheaply do), not parity.

---

## 3. The two-surface model — the load-bearing mental model

This is the part most easily lost. **Read it before changing anything.**

|                      | **Curated** (Layer 2)                        | **Mechanical substrate** (Layer 1)               |
| -------------------- | -------------------------------------------- | ------------------------------------------------ |
| answers              | "what _is_ the architecture"                 | "what could break / where used at all"           |
| virtue               | **editorial sparsity** (human judgment)      | **exhaustiveness** (derived)                     |
| source               | `data/pattern-graph-core.json` (annotations) | `extract.ts` → `data/mechanical-core.json` (tsc) |
| authored by          | a human, deliberately                        | derived on demand, never curated                 |
| feeds                | API/MCP/Studio/docs projections              | blast-radius, impact, find-all-usages            |
| vs a language server | **is the differentiator**                    | **is the language server**                       |

### The correction that defines this model (do not regress on it)

An earlier framing measured the curated graph's _fidelity to the import graph_ and called
the divergence a defect ("76% wrong, blind to 66%"). **That is the wrong yardstick.**
Fidelity-to-imports is exactly what a language server gives for free, and it is the thing
we deliberately do **not** build. The hand-curated layer exists _because_ the mechanical
graph is not the architecture — **architectural significance is an editorial judgment no
import graph can derive.** So:

- The divergence between the two graphs is **curation, not drift.**
- **Do not derive the architecture from code.** That just rebuilds the language server and
  throws away the curation. (This kills the earlier instinct "densify the sparse graph by
  deriving edges from imports.")
- The mechanical layer is for the **one** class of question that legitimately wants the
  firehose (impact / re-test scope), plus two **assist** roles that never overwrite the
  curated layer: propose candidates, flag unambiguous drift.
- In a larger repo you annotate only the **architecturally significant** patterns; the
  curated graph staying a ~6–11% selection of the firehose is _correct_, by design.

### The demand map — what agents start from (freeze vs script)

The deep insight behind the playground: **grep is an entry-point problem, not a context
problem.** The answer-graph already exists, but it is keyed by _pattern name_ — and real
work starts from a **string** ("rate limiter"), a **file** (`src/foo.ts`), or a **changeset**
(`git diff`). Agents grep only to bridge from what-they-have to what-the-graph-knows. The
catalog of agent questions sorts onto the two surfaces, and each row gets a verdict by
**ADR-010's second-caller bar**: adapters (many consumers) freeze; traversals (one
consumer each) get scripted.

| row    | question                                     | starts from     | surface                 | verdict                                                              |
| ------ | -------------------------------------------- | --------------- | ----------------------- | -------------------------------------------------------------------- |
| **E1** | "what patterns relate to this concept?"      | fuzzy string    | curated                 | **frozen** — `findByConcept` ✓                                       |
| **E2** | "what owns this file + its neighborhood?"    | a file          | both                    | **frozen** — `byFile` ✓ (dark files get the mechanical neighborhood) |
| **E3** | "where is this symbol used architecturally?" | a symbol        | substrate               | **frozen** — `bySymbol` ✓                                            |
| **I4** | "blast radius of this diff?"                 | `git diff`      | substrate               | **frozen** — `blastRadius` ✓                                         |
| I1     | "if I change X, what breaks?"                | a pattern       | both                    | **script** (in `blastRadius`)                                        |
| I2     | "which executable specs re-verify?"          | pattern/file    | curated + Gherkin       | **script** / needs Gherkin index for precision                       |
| I3     | "which invariants might I break?"            | pattern/file    | **needs Gherkin index** | **deferred** — Rule blocks not in the core                           |
| A1     | "how is this kind of thing done here?"       | intent          | curated                 | **script** (precedent by role/context + ADR edges)                   |
| A2     | "what context/seam am I extending?"          | package/context | curated                 | **script** (group by boundedContext)                                 |

**The entry adapters (E1–E3) + I4 are the frozen trusted core** — they are the universal
bridge that makes "the agent scripts the rest" cheap. **I1/I2/A1/A2 are deliberately NOT
frozen** (freezing them rebuilds the 9-verb pipeline we are deleting); they are short
scripts over the shapes. **I3 / precise I2 need a Gherkin-side extractor** (sibling to
`extract.ts`) — the core has the _edges_, the `.feature` files have the _scenarios + Rule
blocks_; that join is the next Layer-1 expansion.

---

## 4. What the experiments proved (verified numbers)

All figures from runs over the current core + `packages/*/src`. Re-derivable via the CLI.

**Substrate (`extract.ts`)** — complete, barrel-followed, deterministic:
`334 files · 1502 exported symbols · 1878 import edges (451 cross-pkg) · 0 unresolved`.

**Graph diff (`cli.ts diff`)** — mechanical (barrel-followed) vs authored `uses`:

```
mechanical pattern→pattern edges : 334
authored   pattern→pattern edges : 258
  shared (curated selection)     : 115
  dark   (import, no intent)     : 219   ← mostly CORRECT editorial silence
  aspirational (intent, no import): 143
  Jaccard similarity             : 24%   ← curation is a ~24% overlap, BY DESIGN
```

**The 143 aspirational, dissected** (this is where the correction was proven):

- 28 decision-originated (21 ADR→ADR + 7 ADR→code) — genuinely conceptual; _no import can
  ever exist_. This is exactly what Layer 2 should carry.
- 115 code→code — of which only ~15 reference the target in actual code; ~100 appear only
  in the `@architect-uses` annotation text (file-attribution imprecision or conceptual
  wiring). **Not drift** — confirmed next.

**Scoped drift (`cli.ts drift`) → `0 dangling, 0 orphaned`.** Built to fire _only_ on
unambiguous "code is gone" signals (a `uses` target that is no longer a pattern; a pattern
whose source file was deleted). Zero. So the aspirational bucket is **curation + conceptual
lineage, not rot.** The substrate, asked the narrow honest question, agrees with the
curation. (This number should trend monotonically to zero as the 95% deletion completes —
a useful invariant to watch.)

**Blast radius (`cli.ts blast HEAD~8`)** — the flexibility delta, concretely:

```
changed src files            : 90  (52 map to a pattern)
authored-graph downstream    : 60 patterns
mechanical-graph downstream  : 120 patterns   (+28 the curated graph MISSED)
at-risk executable specs     : 49
```

The mechanical layer ~doubles re-test coverage and reaches the ~47% of src the curated
graph deliberately omits — the code↔spec↔pattern cut no grep and no single verb produces.

**Fan-in candidates (`cli.ts fan-in`)** — curation assist working: load-bearing modules
with NO pattern node, ranked by importers:

```
61  fragments/projection-context.ts
47  fragments/base.ts            ← the ProjectionBundle base every synth fork hand-cited
23  taxonomy/status-values.ts
20  domain-enums.ts
```

That `base.ts` surfaced at #2 purely from import fan-in — the exact module the architects
already knew mattered — is the proof the assist signal is real.

**Census (`cli.ts census`)** — node coverage (non-barrel src → pattern node):
`cli 15% · core 36% · guard 52% · mcp 57% · projection 64%`. Edge density:
`uses 41% · usedBy 38% · implementedBy 28%`. (`extendedBy` / `enforces*` ≈ 0–2% — dead
taxonomy machinery, deletable per bootstrap doctrine.)

**Context efficiency** — the whole multi-experiment session ran in ~127k tokens, ≈⅕ of the
grep/verb-API equivalent. Mechanism: the data stays _in-process_; only conclusions return.
This is the consumer-side mirror of the 89%-baggage finding — freezing answers is expensive
as bytes on disk AND as tokens in context.

---

## 5. Settled vs open

**Settled (this session):**

- Two-surface model (curated vs mechanical) is the construction direction.
- Do **not** derive architecture from code; substrate is impact + assist only.
- Expose shapes + small trusted view library; agent scripts the rest.
- The **entry-adapter trio (E1 `findByConcept` · E2 `byFile` · E3 `bySymbol`)** is built and
  verified — the grep→graph bridge, the frozen part of the demand map (§3). `byFile`
  returns a _mechanical_ neighborhood for dark files (proven on `fragments/base.ts`).
- Determinism, **only where a machine contract needs it**, is available as committed-script
  - committed-snapshot + re-run-diff — `extract.ts` emits **sorted** symbols/edges to make
    that reproducible. But the playground itself commits **no** snapshot: `data/` is
    gitignored (regenerable; per the thesis, agent-facing views freeze nothing).
- Trust boundary lives in the thin IO runner; views stay pure (§6).

**Open / next probes (recommended order):**

1. **Symbol-level identity** — key nodes on `file#symbol`, not file. Kills the join
   imprecision behind the ~100 code→code aspirational edges; makes the 24% / 143 numbers
   exact; lets `fan-in` rank symbols. The substrate already emits `symbols[]`; it is mostly
   a rewire of the join in `views.ts`.
2. **Gherkin-side extractor** — a sibling to `extract.ts` that indexes `.feature` files
   (scenarios + Rule blocks + `@implements` edges). The only way to do I3 ("which invariants
   might I break?") and precise I2 — the core has the _edges_, the files have the _Rule
   blocks_. The second Layer-1 expansion; pairs with symbol-level.
3. **Act on the `fan-in` shortlist** — curate the top few (`base.ts`,
   `projection-context.ts`) into pattern nodes; watch `blast` coverage rise. Real dogfood win.
4. **Graduate to a package** — lift `schema.ts` + `views.ts` into `packages/` with proper
   lint/build once the shapes settle. Keep the curated/mechanical split as two surfaces.

---

## 6. Trust-boundary lesson (from the security review rounds)

`blast` takes a raw CLI ref. Three review rounds walked down a ladder of trust; the fix is
instructive for the eventual package:

1. shell injection → `execFileSync` (no shell).
2. option injection → charset guard (no leading `-`) + `--end-of-options`.
3. pathspec semantic injection → **resolve the input to a git-verified commit SHA first**
   (`rev-parse --verify … ^{commit}`), then `git diff <sha> --`.

The first two are _filters_ (reject known-bad, always a step behind). The third **collapses
the ambiguity space**: a verified SHA has exactly one meaning to `git diff`. General rule
for the package's trust boundary: **resolve untrusted input to a canonical, validated
identity at the edge — don't sanitize it in place.** Views stay pure; the runner validates.

---

## 7. How to re-enter

```bash
pnpm exec tsx playground/extract.ts          # (re)build data/mechanical-core.json
pnpm exec tsx playground/cli.ts diff         # graph diff
pnpm exec tsx playground/cli.ts blast HEAD~8 # impact + at-risk specs
pnpm exec tsx playground/cli.ts fan-in       # curation candidates
pnpm exec tsx playground/cli.ts drift        # scoped drift (should be ~0)
pnpm exec tsx playground/cli.ts census       # coverage
```

- Code is git-tracked (visible); `data/` is gitignored — **no snapshot is committed**. The
  extractor's sorted output makes a commit+diff gate _possible_ only if a view ever becomes
  a machine contract; until then there is nothing to diff against, by design.
- Regenerate the curated input:
  `pnpm exec tsx --conditions=source ./scripts/snapshot-pattern-graph.ts --core playground/data/pattern-graph-core.json`
- `playground/**` is excluded from root ESLint + tsconfig, so it is `tsx`-run only and does
  not gate CI. When it graduates to a package, that changes.

---

## 8. Connections to Architect doctrine

- **ADR-006 (single read model):** the read model is the `PatternGraph`. The curated layer
  here _is_ that graph; the substrate is a _separate_ derived structure, not a competing
  read model.
- **ADR-005 (decode-only projection codecs):** every view here is a **lossy one-way
  function** (a projection), never a round-trip codec. Do not reach for `z.codec` where a
  pure function belongs.
- **ADR-010 (second-caller bar):** the organizing principle — freeze a projection only when
  a second machine consumer needs it.
- **Sink priority (CLAUDE.md):** agents first, Studio view-state second, markdown last. This
  playground optimizes the sink the old pipeline optimized _least_.
- **No-BC / live-state:** no historical scaffolding; `drift` flags real deletions, it does
  not record "what we replaced" (that is a `git log` question).
