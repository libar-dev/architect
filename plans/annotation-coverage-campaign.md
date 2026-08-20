# Plan — Annotation coverage: make the curated graph useful (not big)

## North star

**"Useful coverage" = the graph answers agent questions truthfully and cheaply** — a
file's owner resolves (`g.byFile`), a seam groups (`boundedContext`), impact reaches what
matters (`blastRadius` + curated edges), guarantees surface (`invariantsOf`), and noise
doesn't drown the signal. Coverage **percentage is a diagnostic, never a target**: the
curated layer is a deliberate ~6–11% editorial selection of the import firehose
(playground/CONTEXT.md §3 — divergence from the mechanical graph is curation, not drift).
The work is **bidirectional** (CONTEXT §9.1): subtractive where over-annotated, additive
where load-bearing modules are dark.

All numbers below are as-of-this-writing; **always re-derive live** (`pnpm architect:graph
census` / `fan-in` / `drift`, and the TRIAGE/DRIFT recipes in
`.agents/skills/architect-graph-handle/references/recipes.md`). The graph wins.

Baseline (post-ADR-014 replacement): ~347 patterns · coverage cli 52% / core 69% / guard
52% / mcp 57% / projection 80% · edge-dark ~30% · dangling 0 (CI-gated) · `boundedContext`
absent on ~⅓ of patterns.

## Phase 0 — instruments & policy prerequisites

1. **Resolve the realization-edge policy** _(human, ADR-level — deferred decision from
   ANNOTATION-FLEET-FINDINGS)_: should `@architect-implements` against a non-`active`/
   non-projecting target project a reverse edge (candidate node) or stay dropped? Today it
   silently drops, which produced 2 dead annotations the fleet had to revert
   (`RoadmapMarkdownExecutableTests`, `RequirementExecutableDigestExecutableTests`). This
   gates whether those specs can return. Also reconcile the status discrepancy the fleet
   flagged (the two targets are annotated `completed` in source, `roadmap` in the brief).
2. **Add the marker-tag guard lint**: a JSDoc block carrying `@architect-pattern` but
   missing the leading bare `@architect` marker (or with tags after prose) silently drops
   the whole node — the exact round-2 failure class. Sibling of the existing
   `gherkin-tag-space-form` detector in `packages/architect-guard/src/validation/`;
   error-level, unit-tested. Closes the last silent-drop class the fleet hit.
3. **Build the `deletionReady` / value-transfer view** (REVIEW-NOTES 🔭 #4;
   `architect/specs/value-transfer-state.feature`, now re-pointed to the handle surface):
   a pattern is `deletionReady` when its authored design-spec invariants each have an
   `executable`-provenance counterpart. Sits directly on the maturity×provenance grid
   `g.invariantsOf` already computes — a view + recipe first; a named `architect:graph`
   command only if a second machine consumer needs the frozen contract (ADR-014 bar).
   This is the **instrument for the subtractive side** (finds zombie specs and
   value-transferred projections).

## Phase 1 — subtractive (noise out)

- **The ~57 zero-consumer projection-role patterns** (of 68; re-derive:
  `pnpm architect:q 'g.patterns.filter(p => p.role === "projection" && !p.usedBy.length).length'`)
  mirror the documentType-first star the `DocumentationProjection` epic is folding down.
  **Do not strip their annotations first** — the annotation dies _with the code_ in the
  epic's subtraction; stripping early is grave-tending and hides the fold-down list. The
  campaign's job: keep the TRIAGE-REMOVE shortlist current and feed it to the epic.
- **Post-ADR-014 recount**: projections whose second consumer was the retired verb CLI now
  have only MCP. When the Studio Design-Review view decides what it actually reads, recount
  consumers — anything left with a single markdown consumer joins the fold-down list
  (ADR-010's bar, same as the epic applies).
- **Borderline-leaf watch** (fleet round-2 flags): `DeterministicFormatUtils`, then
  `SlugCanonicalization` — first candidates if the curated layer tightens.

## Phase 2 — additive (signal in), ranked by agent value

1. **The live fan-in tail** (`pnpm architect:graph fan-in` — never a frozen list): current
   top is small and flat (~4 importers: `architect-core/src/utils/runtime-helpers.ts`,
   `architect-guard/src/cli/shared.ts`, `architect-guard/src/lint/steps/types.ts`) — the
   assist loop has already drained the big hubs; treat remaining entries as a per-batch
   pickup, not a campaign.
2. **`cli-runtime.ts` (`buildCliContext`)** — live-graph bootstrap for the handle
   and the dangling gate, still node-dark. (`architect-generate` builds through its
   own `buildGraph` + `createCliProjectionContext`.) High signal-per-node; annotate
   as a `service` in `bounded-context:cli`.
3. **Guard (52%) before the rest**: validation rules are what agents confront when gates
   fire; a dark guard subsystem means gate failures explain themselves with file spelunking
   instead of `g.byFile`. MCP is small (4/7) — finish it opportunistically.
4. **G7 — `boundedContext` backfill (~⅓ absent)**: seam grouping (`A2` recipe) currently
   leaves a third of patterns unplaced. Batch-fill from the package/directory mapping;
   reuse existing context values (`pnpm architect:q` over the A2 grouping shows the live
   vocabulary). This is the cheapest large win for "what seam am I extending?".
5. **Edge-dark re-audit (~30% of patterns carry no uses/usedBy/implementedBy)**: run
   TRIAGE's ADD side — `g.graphDiff().aspirational` for authored-intent candidates and the
   fan-in cross-check for load-bearing-but-edge-dark. Genuine root primitives stay
   rootless **by design** (fan-in is their weight); re-audit which zero-edge contracts are
   genuinely roots vs just unauthored (comma-form `@architect-uses`!).

## Phase 3 — status & spec hygiene (the truthfulness axis)

- **DRIFT push** (REVIEW-NOTES 🔭 #3): the DRIFT recipe lists patterns with a live test but
  `status < completed`. For each: advance the status (the test already proves it) or record
  why the design genuinely lags. Target: list → 0 or every entry explained.
- **F1 cohort-promotion pilot** (REVIEW-NOTES 🔭 #1): on the `reporting.feature` 7-pattern
  cohort, promote per-Rule invariants to their own feature-owned patterns
  (`@architect-implements:` the parent) so the spec bridge stops labeling them
  cohort-ambiguous. Pilot first; roll out only if the cohort labels measurably mislead.
- **Axis split** (REVIEW-NOTES 🔭 #2, ADR-worthy, born-accepted after the pilot): represent
  "realized by a live test" as a derived badge from the `@architect-implements` edge in the
  real projection model, decoupled from the maturity ladder — lifting the playground's
  maturity⟺provenance coherence clamp into gen-1 proper.

## Batch protocol (every batch, non-negotiable — the fleet-verified loop)

1. **Author** with the verified syntax rules: leading bare `@architect` marker FIRST (tags
   before prose), **comma-form** `@architect-uses A, B, C` (space form silently drops the
   node), colon-form tags on `.feature` files, roles from the 8-value enum, reuse existing
   bounded-context values.
2. **Verify landed, live**: the handle builds fresh per call — `pnpm architect:graph census`
   - `pnpm architect:q 'g.pattern("<New>")'` immediately; a node either materialized or it
     didn't (no rebuild step, no silent failure window).
3. **Significance triage** every batch (the fleet held 92% and 21/21 pass bars): each node
   must be a genuine seam — significance = curated edge ∨ rules/scenarios ∨ realization ∨
   enforced decision ∨ children ∨ structural role. Revert what fails.
4. **Gates stay green**: dangling 0 (`pnpm architect:graph dangling --baseline
packages/architect-guard/src/lint/dangling-baseline.json --strict` — now in `ci:verify`),
   `pnpm validate:all`, typecheck.
5. **Batch size** ~20–30 nodes max; sparse and deliberate beats broad (both fleet rounds
   proved small high-signal batches land at 90%+; the graph, not a quota, names the next
   targets).

## Success criteria (agent-usability probes, not percentages)

- `g.byFile` on the current fan-in-tail files returns a **curated** answer (not the
  mechanical fallback).
- The A2 seam grouping places >90% of patterns (G7 closed).
- `blast` recovered-set stays meaningful while curated downstream coverage rises.
- DRIFT list empty or every entry deliberately explained.
- `deletionReady` enumerates the epic's fold-down list mechanically.
- Dangling stays 0 across every batch (CI-enforced).

## Explicitly out of scope

- Chasing 100% node coverage (violates the editorial-sparsity doctrine).
- Deriving `@architect-uses` edges from imports wholesale (rebuilds the language server,
  destroys curation — CONTEXT §3's core correction).
- Stripping projection annotations ahead of the epic's code deletion.
- Changing read-model edge-projection semantics as a side effect (Phase 0 #1 is a human
  ADR decision first).
