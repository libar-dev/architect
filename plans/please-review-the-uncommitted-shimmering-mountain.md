# Strategic review — `TaxonomyDocumentationCluster`: does it prove the bet?

> **Not a ready-to-code plan** (per your steer). The epic's real question is binary:
> _prove by minimum implementation that a universal/flexible doc generator is buildable, or
> drop the design+implementation from the epic._ This review judges the slice **against that
> bet**, not against a style guide. Verified against the live tree + 3 Explore passes + the
> parallel review.

## The one-paragraph verdict

The slice cleanly proves the **cheap** seams (the embedded-region marker engine, the
`BundleRouting`→emission-descriptor split, one cross-bucket "function group" read, the
region-aware determinism gate) and **defers every expensive one** the "universal" claim
actually rests on. By the epic's own text, the load-bearing risks are still untested:
heterogeneous composition (`buildFacetBundle` — "no qualifying caller yet"), multi-slice Views,
the descriptor being _consumed_ for whole-artifact (the `emission` field is wired but **nothing
reads it** yet — that's `GoalOrientedNavigation`), and whether "function group" generalizes past
**one** group. So this slice de-risks maybe **~20%** of the bet. It is necessary and well-built,
but it **cannot by itself** justify keep-or-drop. The decision needs exactly one more, _harder_,
experiment — and the cheapest decisive one costs about a day. Nothing here is groundbreaking
because the slice deliberately avoided the parts where the surprises live.

## Five insights that matter more than the lint

### I1 — The proof avoided the load-bearing risk by construction

The taxonomy cluster is **single-slice** (`projectTaxonomyDigest` → `projectSingle`, no routing).
"Universal & flexible" is a claim about _heterogeneous, multi-source_ composition. None of that
is exercised here. The epic concedes it: ADR-011 (facet helper) "waits for a genuine
heterogeneous second caller"; nesting "stays deferred"; the descriptor re-home is
`GoalOrientedNavigation`, not this cluster. **Consequence:** treat this slice as _seam-existence
proof_, not _generality proof_. Reading it as evidence the universal generator works is the
trap — it proves the plumbing compiles, not that it bends.

### I2 — The "function group" abstraction has a visible ceiling (this is the real answer to concern #2)

`TAXONOMY_FUNCTION_GROUPS` models a group as a **flat cross-bucket selection of digest tag-rows**,
rendered in the reference's fixed 8-column schema (`buildTaxonomyFunctionGroupTable`). That fits
`Classification` (3 tag rows). It will **not** cleanly cover the RFC groups whose content is _not
tag-row-shaped_:

- **Relationships** carries a direction / "Blocks?" / authored-vs-derived **semantics** table
  (`04-tag-registry.md:184-193`) that is **nowhere in the digest** — it's edge semantics, not tag
  metadata.
- **Status→Maturity** carries the `DEFAULT_MATURITY_BY_STATUS` mapping (`:404-412`) — a _different_
  projection, not the tag digest.
- **Core Identity**'s "Required" is tier-conditional doctrine, not a flat flag.

So the abstraction tops out at ~2–3 more groups, then hits content that needs **new projections**
or stays authored. The flexibility question ("is this hardcoding a problem?") is answered not by
refactoring `planRegions` (cosmetic) but by this ceiling: the path generalizes _within tag-row
content_ and _stops_ at derived/doctrinal content. **That bound is the keep/drop-relevant fact.**

### I3 — For doctrine docs, the mixed authored/generated host is the END STATE, not a scaffold (concern #1)

Follows from I2. The RFC (`~35–40%` generatable, `~2%` generated today) will **never** flip to
whole-artifact, because ~half its generatable content isn't digest-shaped and the rest is
irreducible doctrine. Same for the skill (teaches the model + 2 facts by design). So
"majority auto-generated" is the right goal for **enumeration docs** (`docs-live/TAXONOMY.md`),
but for **normative/teaching docs** the honest target is a _first-class mixed host_, not
elimination of the authored part. **Design implication:** stop treating the marker region as a
transitional crutch; commit to making the mixed host a supported, legible shape — which surfaces
I4.

### I4 — The boundary that's blurry is _semantic_, not _spatial_ (the parallel review's best point, generalized)

Markers solve _where_ generated content sits. They do nothing for _meaning collisions_ between
authored and generated vocabulary. Live example the parallel review caught: the generated region
calls itself "the **canonical** enumeration" (3 digest-emitted tags) while the authored summary
12 lines down says Classification has **4 canonical** tags incl. `arch-layer`
(`:62` vs `:358`). One word, two sets, one section. As you generate _more_ into authored hosts,
these collisions multiply and **the determinism gate can't see them** — only a human reading the
rendered page can. This is the genuine scaling hazard of "majority generated," and it's a
_naming discipline_ problem (spec-canonical vs digest-emitted as distinctly named sets), not a
generation-coverage problem. No amount of additional wiring fixes it; the model needs the
distinction as a concept.

### I5 — The descriptor split may currently be vestigial

`emission-descriptor.ts` is a clean contract, but the **whole-artifact** path (`TAXONOMY.md`) is
still written by the legacy `generator.outputPath`, and the injector only attaches `emission`
when `routing !== undefined` — which `projectTaxonomyDigest` never sets. So today the descriptor
is _consumed_ only in `embedded-region` mode; the `whole-artifact` half is a contract with no
reader until `GoalOrientedNavigation`. That's defensible (the split is a real No-BC refactor),
but it means **the split's payoff is unproven** until the re-home lands. If you're deciding
whether the architecture holds, the descriptor being load-bearing for _both_ modes is part of
what you haven't yet seen work.

## What this means for your open questions

- **"Will the next chunk unlock anything? Should we implement some of it and iterate on the
  uncommitted changes?"** — Yes, and that's the right instinct. The slice is _evidence-poor_
  precisely because it's done; the _next_ experiment is where the keep/drop signal lives. Do it
  **on the uncommitted changes, before committing**, so the proof is cumulative.
- **The capability invariants** (`MultiSourceComposition` · `OneSourceMultipleAudiences` ·
  `SourceCanonical`) are **not implementation targets** (your prompt; epic §"capability
  invariants") — correctly left alone. Don't "make them ready."
- **Concern #1 (count drift)** you marked non-essential — agreed, **downgraded**. It's cosmetic
  relative to I4 (the _semantic_ boundary), which is the version of concern #1 worth your time.
- **Concern #3 (prose)** — **defer.** The DD-1..DD-7 / `S2` labels do orphan on spec deletion,
  but slimming them is a code-review-batch chore, not a bet-relevant decision. The parallel
  review agrees ("would not block this iteration"). One real sub-point: don't widen the barrel
  export of `TAXONOMY_CLASSIFICATION_TAGS`/`TAXONOMY_FUNCTION_GROUPS` (`projections/index.ts`) —
  keep the proof seam internal until a second group needs it.

## Candidate next experiments (cheapest-decisive → most-decisive)

| #   | Experiment                                                                                                              | What it proves                                                                                                                                        | Cost         | Keep/drop signal |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------- |
| A   | **2nd function group** in the RFC (e.g. Relationships or Hierarchy)                                                     | Whether "function group" generalizes (I2). Clean data-only drop-in ⇒ abstraction holds; renderer surgery / needs-new-projection ⇒ it's bespoke        | ~½–1 day     | High, cheap      |
| B   | **Descriptor re-home** (route `TAXONOMY.md` through `emission.markdownFileRoute`) — a slice of `GoalOrientedNavigation` | Whether the `BundleRouting` split is load-bearing for _both_ modes, not vestigial (I5)                                                                | ~1–2 days    | Medium           |
| C   | **2nd cluster: API/verbs** (CLI schema + MCP registry)                                                                  | Whether the View/emission model survives a _structurally different source_ — the real "universal across sources" claim (epic's stated proof-point #2) | several days | **Decisive**     |

A is the highest signal-per-hour and directly tests concern #2's ceiling; C is the true
keep/drop oracle but expensive. B makes the descriptor real. My recommendation: **run A first**
on the uncommitted changes — if Relationships _fights_ the abstraction (it will partly, per I2),
you've learned the bound for ~free and can decide whether C is worth funding before touching it.

## The one concrete fix worth doing regardless (correctness, from the parallel review — I concur)

`renderEmbeddedExecution` (`generate-docs.ts:779`) **silently skips a missing host in every
mode**, but the executable spec only justifies skip under `--all` (portability). An explicit
`-g taxonomy-formal-spec` against a bad/missing path **exits 0 with nothing written** — too easy
to greenlight in CI. **Fail loud for explicit `-g`; skip only under `--all`.** Minor doc nits in
the same file (the `docs:check` remediation message still says "commit docs-live/" though regions
now live in `formal-spec/`+`.agents/`; `--all` help says "all document types + index" but now
also mutates authored hosts) are real but trivial.

## Verification (how to confirm any of this)

- I2 ceiling: try adding `Relationships` to `TAXONOMY_FUNCTION_GROUPS` and see what the digest
  _can't_ supply (the `:184-193` semantics table).
- I4 collision: read `04-tag-registry.md:62` and `:358` together — two meanings of "canonical".
- I5 vestigial split: `grep -n "emission" packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts` and confirm `TAXONOMY.md` writes via `generator.outputPath`, not the descriptor.
- `-g` skip bug: `pnpm exec architect-generate -g taxonomy-formal-spec -b <dir-without-the-host>` → exit 0.

---

# Experiment A — wire a 2nd function group (Relationships) [CHOSEN]

**This is an experiment to extract a keep/drop signal, not a feature.** Success ≠ "it
generates"; success = "we learn whether the function-group abstraction generalizes, and where it
stops." Built on the uncommitted changes, before committing, so the proof is cumulative.

## Hypothesis (pre-registered, so the result is honest)

The RFC's Group 4 has **two** tables:

1. the **tag table** (`uses` · `implements` · `extends` · `see-also`, `04-tag-registry.md:177-182`)
   — these ARE digest rows (the "Relationship Tags" bucket). Prediction: drops in as **data
   only**, _zero_ renderer/projection code, because `buildTaxonomyRegionBlocks` already routes any
   `TAXONOMY_FUNCTION_GROUPS` source through `buildTaxonomyFunctionGroupTable`.
2. the **semantics table** (direction / "Blocks?" / authored-vs-derived, `:184-193`) — NOT in the
   digest. Prediction: **cannot** be sourced; stays authored outside the region.

If both predictions hold, I2's ceiling is confirmed _empirically_: the path generalizes within
tag-row content and stops at derived/semantic content — and the 2nd group is **cheaper** than the
1st (the 1st needed the renderer branch; the 2nd needs none). If prediction 1 _fails_ (needs
renderer surgery), the abstraction is bespoke and that's a strong drop-signal.

## Minimal change set (measure the edit count — that IS the result)

- `taxonomy-embedded.ts`: add `TAXONOMY_RELATIONSHIPS_SOURCE = 'relationships'` +
  `TAXONOMY_RELATIONSHIPS_TAGS = ['uses','implements','extends','see-also']`; add one entry to
  `TAXONOMY_FUNCTION_GROUPS`; extend the `TAXONOMY_FORMAL_SPEC_GENERATOR` branch of `planRegions`
  to return a **second** region `{ source:'relationships', regionId:'taxonomy-relationships' }`
  alongside `taxonomy-classification`. (Do **not** widen the barrel export — parallel-review
  point; keep the seam internal.)
- `formal-spec/04-tag-registry.md`: wrap **only** the tag table (`:177-182`) in
  `<!-- architect:gen taxonomy-relationships begin/end -->`; leave the semantics table and the
  Informative note authored, outside the markers. Note the selection deliberately **subsets** the
  digest (omits `enforces-decision`, which the digest's bucket carries but the RFC's canonical set
  doesn't) — a small flexibility point in the abstraction's favor.
- **Expected renderer/projection diff: none.** If that holds, record it; if not, record what was
  needed and why (the signal).
- Extend the executable feature `taxonomy-documentation-cluster.feature` with a scenario that a
  host with **two** function-group regions rewrites each independently (the "multiple regions per
  host" rule already exists; this gives it a real second instance).

## What we read off it (the actual deliverable)

A one-paragraph finding appended here: edit-count for the 2nd group, whether renderer code moved,
and the confirmed/observed ceiling — feeding the **keep / fund-Experiment-C / drop** decision. Two
secondary confirmations expected as side effects: the 8-col-vs-5-col schema clash (F2) recurs, and
the mixed-host-is-end-state read (I3) firms up.

## Out of scope (kept separate on purpose)

The `-g` fail-loud fix and doc-message nits are **not** bundled — bundling would pollute the
edit-count measurement. Apply them in a separate commit if desired.

## Verification

`pnpm test` (architect-projection + the CLI dogfood feature) · `pnpm docs:check` (the new region
must be byte-stable) · re-read the rendered Group 4 to eyeball the authored/generated seam · the
finding paragraph above is written before committing.

## RESULT (2026-06-06) — both predictions held; the abstraction generalizes with a sharp ceiling

**Edit count: 3 edits in ONE file** (`taxonomy-embedded.ts`: a `*_SOURCE` const, a `*_TAGS`
const + one `TAXONOMY_FUNCTION_GROUPS` entry, one `planRegions` branch returning a 2nd region) +
marker insertion in the host. **Zero renderer changes, zero projection changes, zero new barrel
exports.** The generic `buildTaxonomyRegionBlocks` dispatch absorbed the new group untouched — so
**the 2nd group was cheaper than the 1st** (the 1st needed the `buildTaxonomyFunctionGroupTable`
renderer branch; the 2nd needed none). Prediction 1 confirmed.

**The ceiling is real and clean (prediction 2 confirmed).** The relationship _tag table_ generated
byte-consistent with `docs-live/TAXONOMY.md`; the relationship _semantics table_ (direction /
"Blocks?") stayed authored outside the region because the digest cannot supply it. **Bonus
finding:** the function group also _subsets_ a single bucket (dropped the derived
`enforces-decision`), not only gathers across buckets — the audience-read lever is more expressive
than "cross-bucket gather" implied.

**Signal for keep/drop:** _positive within the tag-row domain_ — function-group generalization is
data-only and the marker engine, descriptor, and gate all held across a 2nd region with no
surprises. The ceiling is not a defect; it's the honest boundary (I2/I3). **But this does NOT
upgrade the heterogeneous/multi-source risk** — that's still untested; **Experiment C (API/verbs)
remains the decisive oracle** before the epic's universal claim is proven.

**Downstream effect caught (and fixed):** making the formal-spec generator write 2 regions made an
existing CLI test fixture (which prepared only the `taxonomy-classification` region) fail loud on
the unprepared `taxonomy-relationships` markers — the engine's "host not region-prepared" guard
working exactly as designed. Fixture updated to prepare the full region set.

**Also landed this session (high-confidence, per your steer):**

- `-g` fail-loud fix: an explicit `-g <embedded>` against an absent host now exits non-zero
  instead of silently skipping (skip stays `--all`-only for portability) — code + a new executable
  scenario + the Rule invariant updated.
- Two doc-message nits (the `docs:check` remediation text and `--all` help) now name the embedded
  hosts outside `docs-live/`.
- New executable scenario: the relationships function group subsets one bucket to the canonical
  authored set.

Gates: `pnpm typecheck`, `pnpm test` (1856 projection), `pnpm test:dogfood` (128 CLI),
`pnpm validate:all`, `pnpm lint`, and `pnpm docs:check` (47 files, region-aware) all green.

---

# Two experiments for separate sessions (review → execute independently)

Experiment A (above) proved the seam exists and generalizes for tag-row content. The two below
are the remaining de-risking probes for the epic's keep/drop call. Each is self-contained — liftable
into its own session prompt. **B is independent and low-risk; C is the decisive oracle but has a
cheap blocker-check to run first.** Order: either, but run C's blocker-check before scoping C.

## Experiment B — Descriptor re-home: make the `BundleRouting` split load-bearing

**Keep/drop value (tests I5 — MEDIUM signal).** Today the emission descriptor's `whole-artifact`
half has **no reader**: `docs-live/TAXONOMY.md` is written by the legacy `generator.outputPath`,
and the doc-gen injector attaches `emission` only when `routing !== undefined` — which
`projectTaxonomyDigest` (a `projectSingle`, no-routing View) never sets. So the split that the
whole cluster's contract rests on is **unproven for whole-artifact**. B routes a whole-artifact doc
through `emission.markdownFileRoute.rootTarget`, proving the descriptor is load-bearing for _both_
modes and that the `.md` + repo-relative containment contract is defined **once** on the descriptor
(DD-5), collapsing the registry's parallel `markdownRootTarget`.

**Scope.** A _slice_ of the roadmap pattern `GoalOrientedNavigation` (the registry output-routing
re-home), **not** the whole pattern — that pattern's broader open question (reader intents for
multi-page graph-entity families) is explicitly out of scope. B is just the single-doc whole-artifact
descriptor wiring the cluster spec deferred to step 5.

**Pre-registered hypothesis.** Routing `TAXONOMY.md` through the descriptor is a clean redirect (the
CLI reads `emission.markdownFileRoute.rootTarget` instead of `generator.outputPath`); the
descriptor's `.md`+containment contract subsumes the registry's looser `.md$` rule. **The real risk
is the injector's `routing !== undefined` gate**: a `projectSingle` View must now also carry a
whole-artifact descriptor, and that may ripple to _every_ flat-catalog doc — quantify the blast
radius before committing to No-BC (no parallel write paths).

**Entry points.** `projections/documentation-composition/documentation-bundle.internal.ts` (the
injector); `architect-cli/src/cli/generate-docs.ts` (`renderProjectionDocument` /
`resolveOutputDirectory` → consume `emission.markdownFileRoute.rootTarget`);
`documentation-type-registry.output-routing.ts` (`markdownRootTarget` → reconcile to `rootTarget`);
`fragments/emission-descriptor.ts` (`WholeArtifactEmissionSchema`, already shipped).

**Minimal change set.** Attach a whole-artifact `emission` descriptor for `projectSingle` docs
(start with `TAXONOMY.md`); make the CLI write path prefer `emission.markdownFileRoute.rootTarget`
when present; under No-BC, migrate _all_ whole-artifact docs rather than keeping a parallel
`generator.outputPath` path.

**Measure / signal.** Determinism gate stays green with whole-artifact docs written via the
descriptor; the registry's `markdownRootTarget` collapses into the descriptor's `rootTarget` (one
definition, not two). Clean re-home ⇒ the split is real and strengthens the architecture; a messy
ripple across every `projectSingle` doc ⇒ the split was premature — a useful drop-adjacent signal.

**Session kickoff.** `pnpm -s architect:query bundle GoalOrientedNavigation --mode design` then read
`documentation-bundle.internal.ts` to see the `routing !== undefined` gate and count `projectSingle`
vs routed docs (the blast radius).

## Experiment C — 2nd cluster: API/verbs (the decisive "universal across sources" oracle)

**Keep/drop value (DECISIVE).** Taxonomy is a single tag-registry slice. The API/verbs cluster's
source is **structurally different** — CLI verb schema + MCP tool registry + `@architect-shape`. If
the same View → audience-shapes → emission model absorbs it the way taxonomy did, the "universal
generator" claim is _earned_; if it forces a bespoke pipeline, that's the _drop_ signal. This is the
epic's own stated proof-point #2.

**The cluster (one source → many shapes), directly analogous to taxonomy — hosts all exist:**

- _Reference shape (full catalog):_ `docs-live/API-REFERENCE.md` — **already ships** via
  `ApiReferenceProjection` / `ApiReferenceDigest` (whole-artifact). The parallel of `TAXONOMY.md`.
- _Live-API context (no descriptor):_ the verb/tool catalog the CLI/MCP already carry.
- _Skill shape (embedded-region — NEW):_ `.agents/skills/architect-data-api/SKILL.md` — embed the
  drift-prone catalog facts (verb list, MCP tool names) as regions.
- _Formal-spec shape (embedded-region — NEW):_ `formal-spec/12-live-documentation-api.md` — the
  catalog in normative prose.

**Hard seams new vs taxonomy (this is where the surprises live):**

1. **A structurally different, possibly multi-source digest.** Does `ApiReferenceDigest` already
   expose _one selectable catalog_ the embedded shapes can read (like `projectTaxonomyDigest`), or
   does the catalog span multiple slices? Multi-slice ⇒ this is the first real caller of
   heterogeneous composition (`buildFacetBundle` / ADR-011), which the epic has been _waiting_ for.
2. **The read-model-reach `[gating]` decision.** If the CLI verb schema + MCP registry are **not**
   graph-resident (the epic says they live outside the graph today; only `@architect-shape` is
   folded in), the embedded shapes cannot read them as a digest without the read-model-reach
   fold-in first — so **C may be BLOCKED on that gating decision.** This is the cheap blocker-check.
3. **A "function group" analog for verbs?** e.g. grouping verbs by purpose (orient / inspect /
   navigate) as an audience read over the catalog — the API parallel of the RFC's function grouping.

**Pre-registered hypothesis.** The embedded-region mechanism, descriptor, and gate carry over
unchanged (already proven sink-agnostic across 2 taxonomy regions). The open risk is the **source**:
single selectable catalog ⇒ C is "taxonomy with a different digest" (~1–2 days, cheap); multi-slice
or non-graph-resident ⇒ C is exactly where the deferred heterogeneous-composition and/or
read-model-reach decisions finally get a caller. **Either outcome is decisive**: clean carry-over =
universal claim earned; forced into facet/reach territory = the true cost of "universal" is now
visible and fundable (or droppable) with evidence.

**Prerequisite / BLOCKER-CHECK (run before scoping).** Read `api-reference.ts` +
`bundle ApiReferenceDigest` to determine (a) whether the digest is a single selectable catalog and
(b) whether the verb/tool schema is graph-resident. This decides whether C is unblocked or gated on
read-model-reach — do **not** start the build before answering it.

**Entry points.** `projections/documentation-composition/api-reference.ts`, `api-reference-routes.ts`,
the `ApiReferenceDigest` projection; hosts `.agents/skills/architect-data-api/SKILL.md` and
`formal-spec/12-live-documentation-api.md`; **reuse** the shipped `renderers/managed-region.ts`,
`fragments/emission-descriptor.ts`, and the embedded-generator track in `cli/generate-docs.ts`
(now proven across two taxonomy regions). New code mirrors `taxonomy-embedded.ts` as an
`api-embedded.ts` (routing only) + an api-catalog managed-region renderer branch.

**Measure / signal.** How much of the embedded mechanism carried over unchanged (target: all of it);
whether C tripped the read-model-reach gate or the facet seam; edit-count vs taxonomy's 2nd group.

**Session kickoff.** `pnpm -s architect:query bundle ApiReferenceDigest --mode design` + read
`api-reference.ts` — answer the blocker-check first, then decide single-digest build vs gated.
