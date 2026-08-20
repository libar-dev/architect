# playground — essential context

Conceptual + findings context for this folder: the **why**, the **mental model**, and the
**verified findings** of the experiment that produced the graph handle.

> **GRADUATED (ADR-014).** The experiment concluded: the handle now lives at
> `@libar-dev/architect-core/graph`, with live IO composition behind the `architect` bin
> (`pnpm architect:q` / `pnpm architect:graph` — the old `pnpm playground:q` /
> `pnpm playground:cli` commands in this doc are retired names), the decision is
> `architect/decisions/adr-014-agent-read-surface.feature`, and the operational guide is
> the `architect-graph-handle` skill. This doc remains as the experiment's findings
> record — read it for rationale, not for run commands.

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

|                      | **Curated** (Layer 2)                           | **Mechanical substrate** (Layer 1)                    |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| answers              | "what _is_ the architecture"                    | "what could break / where used at all"                |
| virtue               | **editorial sparsity** (human judgment)         | **exhaustiveness** (derived)                          |
| source               | annotations → live graph (`live.ts`, in-memory) | `extract.ts` tsc walk of `packages/*/src` (in-memory) |
| authored by          | a human, deliberately                           | derived on demand, never curated                      |
| feeds                | API/MCP/Studio/docs projections                 | blast-radius, impact, find-all-usages                 |
| vs a language server | **is the differentiator**                       | **is the language server**                            |

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

| row    | question                                     | starts from     | surface           | verdict                                                              |
| ------ | -------------------------------------------- | --------------- | ----------------- | -------------------------------------------------------------------- |
| **E1** | "what patterns relate to this concept?"      | fuzzy string    | curated           | **frozen** — `findByConcept` ✓                                       |
| **E2** | "what owns this file + its neighborhood?"    | a file          | both              | **frozen** — `byFile` ✓ (dark files get the mechanical neighborhood) |
| **E3** | "where is this symbol used architecturally?" | a symbol        | substrate         | **frozen** — `bySymbol` ✓                                            |
| **I4** | "blast radius of this diff?"                 | `git diff`      | substrate         | **frozen** — `blastRadius` ✓                                         |
| I1     | "if I change X, what breaks?"                | a pattern       | both              | **script** (in `blastRadius`)                                        |
| I2     | "which specs re-verify (any maturity)?"      | pattern/file    | curated + Gherkin | **frozen** — `specsReverifying` ✓ (Gherkin was in-core all along)    |
| I3     | "which invariants might I break?"            | pattern/file    | curated + Gherkin | **frozen** — `invariantsOf` ✓ (per-invariant maturity + provenance)  |
| A1     | "how is this kind of thing done here?"       | intent          | curated           | **script** (precedent by role/context + ADR edges)                   |
| A2     | "what context/seam am I extending?"          | package/context | curated           | **script** (group by boundedContext)                                 |

**The entry adapters (E1–E3) + I4 are the frozen trusted core** — the universal bridge
that makes "the agent scripts the rest" cheap. **A1/A2 stay scripts** (one consumer each;
freezing them rebuilds the pipeline we are deleting).

**I2/I3 are now frozen too — and the correction matters.** An earlier note here claimed
"Rule blocks not in the core" and queued a _Gherkin-side extractor_ (a sibling to
`extract.ts`) as the next Layer-1 build. **That was wrong.** The `.feature` files are
**already parsed** by the pipeline (`buildCliContext`) and ride inside the live `--core` graph: 929
scenarios (3,572 steps), 431 Rule blocks, the `rule:<slug>` + `scenarioNames` linkage. The
prior session missed it only because `schema.ts` left `scenarios`/`rules` **untyped** — so
the richest half of the data was invisible to an agent reading the contract. The work was
never an extractor; it was a **join view + the maturity axis**, both now built in
`graph.ts` (`invariantsOf`, `specsReverifying`). Lesson, kept: _for an AI surface, the type
is the discovery surface — under-typing a shape hides a capability._

**Why freezing I2/I3 is NOT a regression toward the verb-wall.** The freeze-vs-script bar
has **two** axes, and the catalog collapsed them: _consumer count_ (ADR-010) **and** _join
irreducibility_. I1/A1/A2 stay scripts because each is a thin single-field traversal
(`usedBy` transitive walk; group-by-`role`) an agent won't botch. `invariantsOf` /
`specsReverifying` freeze because they are **irreducible cross-source joins** (the 2-hop
`pattern→implementedBy→featureFile→rules` bridge + maturity/provenance/linkage decode) — the
universal _spec_-bridge, entry-adapter class, same as E1–E3. The discriminator is not "is it
a traversal" but **"would an agent hand-rolling this get it wrong"** — and the proof these
would is that the prior session, reasoning carefully, got the very premise wrong.
**Counter-proof the line still holds:** `maturityLadder` was built, then _removed from the
handle_ — it is `groupBy(g.patterns, p => p.maturity)`, a 3-line script over the exposed
`maturity` field, no irreducible join → it lives inline in `cli.ts`, not on the surface.

---

## 4. What the experiments proved (the shape of the result, not the exact counts)

> **The figures below are illustrative as-of-a-SHA, not invariants.** The graph builds live and the
> mechanical numbers drift with every annotation; **the graph wins, always re-derive via the CLI**
> (`pnpm playground:cli census` / `diff` / `blast`). What is durable is the **shape** of each result —
> a ~quarter-overlap curated/mechanical Jaccard, a mostly-correct "dark" bucket, a blast radius that
> roughly doubles re-test reach. Read the numbers as orders of magnitude, never as targets (the
> north star is agent usability, not coverage %).

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
with NO pattern node, ranked by importers. **Run the command for the live list — do not
read a frozen shortlist here.** The original probe's top four (`fragments/base.ts` ≈47 — the
`ProjectionBundle` base every synth fork hand-cited — `context/projection-context.ts` ≈61,
`taxonomy/status-values.ts`, `domain-enums.ts`) have **all since graduated to pattern nodes**
(`ProjectionBundle`, `ProjectionContext`, `StatusValueDomain`, `DomainEnumSchemas`) — the assist
loop closed on its own shortlist, which is the proof the signal is real. That same fact is why a
frozen list here rots within one annotation campaign: as of this writing the live top has moved to
the `architect-cli` `_shared` cluster. The durable claim is the **shape** (there is always a fan-in
tail; the top of it is the next curation target), never the filenames — re-derive with `fan-in`.

**Census (`cli.ts census`)** — node coverage (non-barrel src → pattern node), as-of-a-SHA:
`cli 15% · core 65% · guard 52% · mcp 57% · projection 80%`. Edge density:
`uses ~43% · usedBy ~43% · implementedBy ~25%`. (`extendedBy` / `enforces*` ≈ 0–2% — dead
taxonomy machinery, deletable per bootstrap doctrine.) Re-derive with `pnpm playground:cli census`.

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
  returns a _mechanical_ neighborhood for dark files (current dark example:
  `config/regex-builders.ts` — 4/5 importers are curated patterns). NB: `fragments/base.ts`,
  the original dark exemplar, has since been **annotated** (`@architect-pattern:ProjectionBundle`)
  — the fan-in assist loop (§4) closing on its own #2 candidate, so it now demos the _mapped_ path.
- The **graph handle (`graph.ts` → `loadGraph()`)** is the AI-native read surface: one typed
  object, joins + taxonomy-decode done once at construction, need-shaped accessors that
  return plain composable data. It is the answer to "what type is most natural for Claude" —
  **not 30 verbs, not raw-JSON-you-rejoin**, but one object whose method list _is_ the docs.
  The built core's quirks (tag-encoding, the 2-hop `implementedBy` join, the dead `layer` axis)
  stay decode-detail behind it. **Needs drove the surface, not storage.**
- The **maturity axis is first-class and DERIVED** (`@architect-maturity` is stored 0/293 —
  derived from status: candidate→idea · roadmap→plan · active→design · completed→executable;
  explicit tag wins). **`invariantsOf` / `specsReverifying` span every tier** and label each
  result with maturity **and** a ⊥ provenance axis (live test vs authored working-spec) — so
  "specs of any maturity, implemented and non-implemented" are surfaced and distinguished,
  never dropped. `maturityLadder()` shows where the non-implemented specs (and their authored
  invariants) live — a direct input to the annotation push.
- The handle is **live, not snapshotted** (§9.3/§9.6): both cores build in-process each call
  (~1.5s), no `data/` dump. `loadGraph()` is **async**; run every entry with `--conditions=source`.
  Determinism, **only where a machine contract later needs it**, remains available as
  committed-script + committed-snapshot + re-run-diff — `extract.ts` still emits **sorted**
  symbols/edges to make that gate possible — but the agent sink freezes nothing, so today there
  is nothing to commit, by design.
- Trust boundary lives in the thin IO runner; views stay pure (§6).

**Open / next probes (recommended order):** _(situated within the cross-effort sequencing in §9.5 once the `DocumentationProjection` epic is in view)_

1. **Value-transfer view** — fold the ephemeral-spec-deletion gate (executable-specs skill)
   into a handle method over the data we now expose: a pattern is `deletionReady` when its
   authored design-spec invariants each have an `executable`-provenance counterpart. This is
   the natural next join — it sits exactly on the maturity×provenance grid `invariantsOf`
   already computes, and it directly serves the bloat-removal push (find zombie specs:
   implemented but not deleted). Mechanizes `architect/specs/value-transfer-state.feature`.
2. **Act on the live `fan-in` shortlist** — curate the current top few into pattern nodes; watch
   `blast` coverage rise. (The first round's targets — `base.ts`, `projection-context.ts`,
   `status-values.ts`, `domain-enums.ts` — already graduated; re-derive the tail with the command,
   don't re-curate the done.) Real dogfood win.
3. **Symbol-level identity** (demoted — precision, not load-bearing) — key nodes on
   `file#symbol`, not file. Sharpens the 24% / 143 _measurement_; the substrate already emits
   `symbols[]`. Defer until after the annotation push re-authors the curated layer anyway.
4. **Graduate to a package** — lift `schema.ts` + `graph.ts` + `views.ts` into `packages/`
   with proper lint/build once the shapes settle. Keep the curated/mechanical split as two
   surfaces, and the handle as the typed front door over both.

> The previously-queued **"Gherkin-side extractor"** is **struck** — it was a phantom (the
> Gherkin is already in-core; see §3). What looked like a Layer-1 build was a join view.

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
# front door — eval anything against the live handle (g):
pnpm playground:q 'g.patterns.length'
# named demo commands:
pnpm playground:cli diff         # graph diff
pnpm playground:cli blast HEAD~8 # impact + at-risk specs
pnpm playground:cli fan-in       # curation candidates
pnpm playground:cli drift        # scoped drift (should be ~0)
pnpm playground:cli census       # coverage
```

- **The `pnpm playground:*` scripts bake in `--conditions=source`** — without that flag the authored
  core silently reads stale `dist/` (§9.6). A bare `tsx` invocation (e.g. a standalone scratch module)
  must pass it explicitly.
- **No snapshot on disk.** Both cores build live each call (~1.5s); `data/` is deleted. If a view
  ever becomes a machine contract needing determinism, re-introduce a committed snapshot then —
  `extract.ts` still emits sorted output for a commit+diff gate.
- `playground/**` is excluded from root ESLint + tsconfig, so it is `tsx`-run only and does
  not gate CI. When it graduates to a package, that changes.
- New-session orientation: **`USAGE.md`** (road-test / use the handle) · **`ITERATION.md`** (extend it).

---

## 8. Connections to Architect doctrine

- **ADR-006 (single read model):** the read model is the `PatternGraph`. The curated layer
  here _is_ that graph; the substrate is a _separate_ derived structure, not a competing
  read model. **The handle (`graph.ts`) is not a third read model either** — it authors and
  persists nothing; it is an in-memory _join + decode_ over the existing read model and the
  substrate, built fresh each `loadGraph()`. A typed front door, not a store.
- **ADR-005 (decode-only projection codecs):** every view here is a **lossy one-way
  function** (a projection), never a round-trip codec. Do not reach for `z.codec` where a
  pure function belongs. The handle's taxonomy decode is one-way at the load boundary —
  decode-only, parse-once (ADR-009), never re-encoded. Read `role`/`boundedContext` from the
  **structured fields** (`p.role`, 195/293; `p.boundedContext`, 176/293), _not_ the value-form
  `directive.tags` — for TS patterns the tags array carries only the bare key, so peeling it
  drops ~167 (the bug Codex caught). Maturity is the one tag-or-derive case (no structured field).
- **ADR-007 (taxonomy / status→maturity):** the `maturity` axis is **derived**, not stored —
  `MATURITY_BY_STATUS` is ADR-007's `DEFAULT_MATURITY_BY_STATUS`, and an explicit
  `@architect-maturity:` tag wins ("explicit always wins"). The handle computes it once; the
  built core stores 0 of them.
- **ADR-010 (second-caller bar):** the organizing principle — freeze a projection only when
  a second machine consumer needs it.
- **Sink priority (CLAUDE.md):** agents first, Studio view-state second, markdown last. This
  playground optimizes the sink the old pipeline optimized _least_.
- **No-BC / live-state:** no historical scaffolding; `drift` flags real deletions, it does
  not record "what we replaced" (that is a `git log` question).

---

## 9. Session findings — annotation asymmetry, the live-graph gap, and convergence with `DocumentationProjection`

Findings from probing the live graph against `architect-core` + `architect-projection`,
plus the load-bearing connection to the `architect/specs/documentation-projection/` epic —
the **fenced producer-side** counterpart to this **unfenced consumer-side** experiment.
Durable working-state; prune each as it graduates to code or an ADR.

### 9.1 Annotation coverage is two OPPOSITE gaps, not one

"Coverage" is not "annotate everything to 100%." The two target packages fail in opposite
directions, so the work is bidirectional:

- **`architect-projection` is over-annotated with deletion candidates.** `63` projection-role
  patterns; **60 have zero downstream consumers**, 62 have ≤1 (live `g.patterns` filter). Each
  is a bespoke `*Projection` codec paired with a `*Digest`/`*Contract` fragment (~54 contracts)
  — the documentType-first star. By ADR-010's own second-caller bar, ~95% never qualified to be
  frozen. Work here is **subtractive**.
- **`architect-core` was under-annotated on load-bearing modules** (it has since climbed — census
  core is ~65% now, up from ~36% as the fan-in loop closed; re-derive). The original shortlist —
  `projection-context.ts`, `base.ts`, `status-values.ts`, `domain-enums.ts` — has **all graduated**
  to nodes (`ProjectionContext`, `ProjectionBundle`, `StatusValueDomain`, `DomainEnumSchemas`); the
  assist loop closed on its own candidates. `fanInCandidates` now names a fresh tail (live: the
  `architect-cli` `_shared` cluster) — **run `pnpm playground:cli fan-in` for the current targets,
  never trust a filename frozen here.** Work here is **additive**.

The two-surface model is what makes the asymmetry safe to act on: `blastRadius` over the
substrate keeps re-test coverage exhaustive while the curated layer stays a deliberate ~6–11%
selection. "Useful coverage" = converge the two flows, not chase a percentage.

### 9.2 Two of the three design-review lenses are decision-only

`docs-live/design-review/by-layer.md` and `by-theme.md` carry **only the 14 ADR/PDR records**
(grouped by `@architect-adr-layer` / `@architect-adr-theme` — axes populated only on decisions).
They do not lens the implementation graph at all. Only `by-package.md` is the real component
inventory (and it shows the projection-triad explosion at a glance). For "review core/projection
by layer," the other two are empty calories — a concrete instance of the one-consumer projection
the cut-down in §9.1 targets.

### 9.3 The live-graph linkage gap — RESOLVED (the handle builds live)

This was the open WIP-API question; it is now closed. `loadGraph()` builds **both** cores
fresh in-process every call — there is **no dump**:

```
annotated source ──buildCliContext({noCache})──▶ live PatternGraph (ADR-006)
                          ▼ live.ts  buildAuthoredCore() → AuthoredCoreSchema.parse(live objects)
packages/*/src   ──tsc walk────────────────────▶ extract.ts  buildMechanicalCore() → MechanicalCore
                          ▼
       loadGraph() = new Graph(mechanical, authored)   ← async, ~1.5s, reflects HEAD
```

`buildAuthoredCore` reuses `buildCliContext` (the snapshot script's own path), so the core is
byte-identical to what every verb/codec consumes — but never written to disk. The dump
(`data/pattern-graph-core.json`) and the mechanical dump are **deleted**; `loadGraph` is now
**async**. See §9.6 for the two stale sources this closed and the `--conditions=source` rule.

### 9.4 Convergence: this experiment and the `DocumentationProjection` epic are ONE effort from two ends

The epic converges hard with this playground, which sharpens the sequencing:

- **Both kill the documentType-first star.** Epic's 2026-06-06 synthesis: "the universal engine
  already ships" — `ProjectionBundle{root, children, emission}` + one `scope`-parametrized fragment
  - the managed-region engine _is_ the universal machinery; `architecture` and `design-review` are
    the **same** fragment four booleans apart. Bespoke per-doc projections fold onto it — "the payload
    is mostly subtraction." Same conclusion as §9.1's 60/63, reached independently.
- **Both center on the same move: don't flatten the join.** Epic's one cross-cutting build is
  **target-neutrality** — projections bake `{name,role,status,level}` into a mermaid label string, so
  only `name`+`role` reach JSON and Studio must re-query. Fix: structured slices, labels deferred to
  the renderer. This is _why_ the playground works — it reads the **pre-flatten `--core`** and keeps
  data structured + in-process (the `~⅕ context` win). "Type the shapes richly" (`schema.ts`) and
  "de-flatten the join" are the same principle on the two sides.
- **The handle is the agent-sink emission the epic already names.** Epic: "a View with **no emission
  descriptor** is the sink-agnostic baseline — the bundle handed to the API/MCP consumer or the Studio
  view-state sink." `loadGraph()` is precisely the agent-sink reader of that no-descriptor View. Not
  competitors — the playground is the no-descriptor sink the epic accounts for.
- **ADR-010's second-caller bar is the shared arbiter.** The projections that **survive** the cut are
  the ones a second _machine_ consumer needs — and the Studio live-view (Design-Review = pattern +
  dependency subgraph + rule-coverage + conflicts) is that consumer. Everything whose only consumer is
  one markdown doc collapses to a scriptable View. Agent sink freezes nothing (scripts the rest); the
  machine sinks keep typed contracts. Same bar, two answers.

### 9.5 Natural sequencing (analysis, not an execution plan)

1. **Wire the handle live (§9.3).** Smallest step; makes census / fan-in / deletionReady reflect HEAD
   and proves the agent-sink reader against the live no-descriptor core. De-risks everything after it.
2. **deletionReady / value-transfer view (§5 #1).** Cheap — sits on the maturity×provenance grid
   `invariantsOf` already computes. The _instrument_ that says which projections are safe to collapse
   (value transferred, no second consumer). Drives step 4.
3. **De-flatten the join (epic, cross-cutting).** Producer-side enabler: you cannot fold a bespoke
   projection onto the universal engine while the engine still flattens. Agent sink doesn't need it; the
   _surviving_ (Studio) sink does. Bigger; No-BC in place.
4. **The subtraction (§9.1 + epic).** Collapse the ~60 one-consumer projections onto the universal
   engine; add the `architect-core` fan-in modules. The taxonomy cluster (`member 05`, completed) is
   the proof the fold-down works.
5. **Graduate the handle (§5 #4) + gating decisions (epic).** Handle → package when shapes settle;
   read-model-reach (reflexivity) and ADR-011 (facet helper) only when a genuine heterogeneous second
   caller ships (the Studio Design-Review view).

The decision that is the user's, not the tooling's: the cut is **"delete everything whose only consumer
is one markdown doc; keep what Studio view-state will read"** — deletionReady _informs_ that line, it
does not draw it.

### 9.6 Staleness — the two sources, and the fix (durable; do not re-derive)

"The graph isn't live" had **two** independent causes; the sandbox now closes both.

1. **The dump.** `loadGraph()` used to read a gitignored `data/*.json` snapshot — frozen the
   moment it was written. **Fix: deleted.** Both cores build in-process every call
   (`buildAuthoredCore` via `buildCliContext`+`noCache`; `buildMechanicalCore` via the tsc walk).
   ~1.5s; a just-saved annotation shows on the next call. This also means the silent-failure trap
   the annotation fleet hit (an annotation that drops to zero nodes) is now **visible**: re-run
   `census`/`q.ts 'g.pattern("X")'` and the node is either there or it isn't.
2. **`dist/`.** The authored build imports `@libar-dev/architect-*`. Node's default export
   resolution picks the **compiled `dist/`**, which lags `src/` until `pnpm build`. So even with
   no dump, you'd silently read stale pipeline code. **Fix: run with `--conditions=source`** — the
   `source` export-condition selects `src/*.ts`. This is non-optional for every playground entry
   (`q.ts`, `cli.ts`, any `scratch/` script). It is why `live.ts` documents it loudly.

A **watch command is unnecessary**: build-fresh-per-call already reflects HEAD. A persistent
watch-server would only matter if per-call latency (~1.5s) became the bottleneck — an MVP
non-problem, and a server is explicitly out of scope (that path is the Studio/MCP surface, which
keeps stable verbs, not this eval sandbox).
