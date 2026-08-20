# REVIEW & SCOPE — playground (gen-2-alternative read surface)

> **Living working-state doc** (live-state doctrine: durable findings + open scope, no
> dates/worklog). This is the **consolidated** record for the review of `playground/` — the
> experimental, source-first agent read surface that is the proposed alternative to the gen-1
> PatternGraph verb API. Prune each item as it graduates to code, an ADR, or `FEEDBACK.md`.

Status legend: ◻ scoped (ready, not yet executed) · 🔭 future session.

---

## MVP status: shipped

The handle MVP is shipped and gated. What landed:

- **The handle works, the thesis holds.** Script-over-shapes spends ≈⅕ the context of the verb
  API; pure views, a clean IO/trust boundary, correct taxonomy decode, sound `isatty(0)` / `REPO_ROOT`
  hardening, a well-reasoned freeze-vs-script discipline. Independently ratified by gen-2 (§3).
- **`architect-graph-handle` skill is the canonical on-ramp.** A fresh Claude session discovers and
  uses the handle through the skill; the playground `*.md` docs are secondary reference behind it.
- **`pnpm playground:smoke`** — opt-in invariant regression check (asserts invariants, never frozen
  counts; not a CI gate, since the playground is CI-excluded).
- **Discoverability wired** — the SessionStart hook + AGENTS.md point at the skill; `pnpm check:skills`
  green across `.claude` / `.codex` / `.opencode`.
- **`pnpm playground:q` / `pnpm playground:cli`** bake in `--conditions=source` (the staleness fix) and
  are the documented default in every doc; the raw `tsx --conditions=source …` form is reserved for
  standalone scratch modules that bypass `q.ts`.
- **Spec-bridge is cohort-honest** (`Invariant.cohort` / `AtRiskSpec.cohort` set on multi-pattern
  realizing features), **maturity ⟺ provenance is coherent** (the `specMaturity` clamp; the honest
  "drift alarm" preserved as the DRIFT recipe), the **multi-statement argv** form works, the
  **empty-`invariantsOf` contract note** is honest (code-originated guarantee is the TS type, not a
  Rule), the **at-risk-feature-files** view field no longer collides with the handle's `atRiskSpecs`,
  and **bare `playground:q` in automation is documented as forbidden** (it hangs on stdin).

The hardening rounds and the per-gap fix trail that produced this are git history, not carried here
(live-state: no historical scaffolding).

---

## Real-test validated — both north-star verdicts are YES

A cold, fresh-context agent gathered the **complete design-review slice** for the
`DocumentationProjection` epic (16 patterns · all edge kinds · ~35 invariants across design specs +
executable tests + source TS, each provenance-labeled) **with zero grep** beyond the 6 subject spec
reads — the slice the shipped `docs-live/design-review/by-layer.md` (14 ADR records only) structurally
cannot produce. Both verdicts came back YES with evidence:

- **(a) Sufficient to gather design/refactor/impact context without manual repo exploration — YES.**
  ~16 graph calls, no grep, dual-provenance value-transfer signal read in one call. Replaces a
  multi-hour spelunk with a ~5-minute scripted gather. (Artifact: `scratch/design-review-docproj.md`.)
- **(b) Sufficient to drive the mass annotation campaign — YES, all four moves demonstrated.**
  ADD-target via `fan-in`; verify-landed via live rebuild + `census`; **REMOVE noise** via the
  significance triage; missing-edge via `graphDiff().aspirational`.

### What the real test fixed (this session)

- **The one real gap: `@architect-parent` was dropped by the decoder.** Epic→member membership rode
  only on the raw authored pattern, absent from `relationshipIndex` and the decoded node — so an epic's
  members read as orphans and had to be reconstructed via the escape hatch. **Fixed:** `parent` +
  computed `children` are now first-class `PatternNode` fields (`g.pattern(epic).children` IS the member
  set). Recipe: `MEMBERS`.
- **Significance lived in untyped edges.** A naive noise filter over `uses`/`usedBy` false-positived
  real realizers (`ManagedRegionEngine`). **Fixed:** `implements` / `implementedBy` / `enforcesDecisions`
  typed in `schema.ts` and surfaced on the node — the same "type IS the discovery surface" lesson the
  Gherkin under-typing taught. The `TRIAGE` recipe now separates REMOVE-noise from ADD-edges safely.
- **Demand-map trap documented:** file-level impact is `blastRadius([file])`, not
  `specsReverifying([file])` (which returns 0 for a realizing impl file whose tests live on the cluster
  it implements). Recipe: `IMPACT`.
- **Review-pass fixes:** `invariantsOf` empty-case sharpened + `GUARANTEE` recipe (code contracts);
  three stale fan-in shortlists in `CONTEXT.md` repointed to live `fan-in`; smoke no longer leaks a
  compile-error stack into a passing run. Smoke stays 8/8.

**Bottom line: the agent interface is proven useful and effectively unblocks the annotation campaign.**
The remaining items (below) are non-blocking polish, not gates.

---

## Gen-2 (LSDP) exploration — the "executable" answer (kept: it grounds the open §5 items)

Explored `/Users/darkomijic/dev-projects/libar-software-delivery-protocol/`. The question it resolved:
**what does "executable" mean — a working test, or a design to be implemented?**

**Answer: a working/bound test.** Gen-2 defines "Executable Spec" as _"an `example` that **has a
verifier** (a delivery fact)"_ and explicitly lists _"a readiness rung"_ as the meaning to AVOID. So
"executable" is a **derived binding fact** (`has-verifier`), never a maturity tier and never
"to-be-built-later." This is why the shipped `specMaturity` clamp enforces `executable` maturity ⟺
`executable` provenance, and why the honest "live test ∧ status<completed" signal lives as the DRIFT
recipe rather than as a self-contradictory maturity label.

**Convergence worth keeping:** gen-2's Founding-Principle-#1 corollary _ratifies as doctrine_ the exact
two-surface model this playground built unfenced — an "impact graph … for impact and curation-_assist_
only … never used to derive the authored architecture; divergence … is **curation, not drift**." The
playground's core thesis is independently validated.

**The narrow lesson, not the whole re-architecture.** Explicitly NOT adopted: gen-2's wholesale no-FSM
stance (deleting gen-1 `status`), the `claim` epistemic taxonomy, and the separate `specTest`
binding-anchor surface. The two open imports that _do_ matter are §5 #1–#2 below.

---

## Future-session scope 🔭

1. **F1 upstream (gen-2 "promotion"):** where a `.feature` realizes a multi-pattern cohort and a Rule
   must attribute to one pattern, promote that Rule to its own feature-owned pattern
   (`@architect-implements:` the parent) instead of leaning on the cohort label. Pilot on the
   `reporting.feature` 7-pattern cohort. (The shipped `cohort` field is the honest stopgap; this is the
   real fix.)
2. **Gen-1-proper axis split:** lift the maturity⟺provenance coherence rule out of the playground into
   the real projection/maturity model — represent "realized by a live test" as a derived badge from the
   `@architect-implements:` edge, decoupled from the maturity ladder. The gen-2 import that matters
   most; ADR-worthy (born-accepted after the playground proves it).
3. **Annotation push from the drift list:** the drift patterns (live test ∧ status<completed, via the
   DRIFT recipe) are the actionable shortlist — advance status where the live test already passes, or
   confirm the design genuinely still lags. Also folds in the **G7 annotation push**: `boundedContext`
   is `(none)` on roughly a third of patterns, so "group by seam" leaves a third unplaced — an
   annotation gap, not a handle bug.
4. **`value-transfer` / `deletionReady` view** (CONTEXT §5 #1) — sits on the maturity×provenance grid
   `invariantsOf` already computes; finds zombie specs (implemented but not deleted). The natural next
   join, mechanizing `architect/specs/value-transfer-state.feature`.
5. ~~Graduate the handle~~ — **DONE (ADR-014):** the pure frozen contract lives at
   `@libar-dev/architect-core/graph`, with live IO composition behind the `architect` bin; the root
   `architect:q` / `architect:graph` scripts bake in the source condition, and the bin
   runs compiled `dist/` for consumers, so the `--conditions=source` footgun is contained.

### Non-blocking polish surfaced by the real test (none gate the campaign) 🔭

- **Output ergonomics:** a full multi-node `relationshipIndex` dump overflows terminal capture; the
  agent worked around it by pre-shaping the return object. A `q.ts --json` flag or a tiny field-pluck
  helper would remove the friction. Low priority (the multiline-scratch pattern already mitigates).
- **`g.guarantee()` promotion:** the GUARANTEE recipe + the `invariants` CLI command are the two
  callers today. If a second _programmatic_ caller appears, promote the disambiguation to a frozen
  `g.guarantee()` (discriminated union) per the ADR-010 second-caller bar. Until then it stays a recipe.
- **Campaign is unblocked:** item 3's annotation push now has its full instrument set — `fan-in`/
  `graphDiff().aspirational` (ADD), the `TRIAGE` recipe (REMOVE noise / ADD edges), live rebuild +
  `census` (VERIFY). The G7 `boundedContext`-`(none)` third is a concrete ADD-target list.

### Known small gaps (documented inline in code; fix only if a session needs them) 🔭

- The `maturity` ladder's `withInvariants` counts `ruleCount>0`, so it sees only patterns that
  _directly_ carry Rules — production patterns whose invariants live in realizing features count 0, so
  the ladder undercounts realized invariants. The realized view is `g.invariantsOf(name)` (it follows
  the `implementedBy` hop). Noted inline at `cli.ts maturity`.
- `blastRadius` / `specsReverifying` seed only from `.ts` files (`#fileToPattern`), so editing a
  `.feature` yields no impact — correct for "code-change impact," a gap for "I edited a spec." Noted
  inline at `views.ts blastRadius`.

---

## Re-verify (any of these)

```bash
pnpm playground:cli census                                  # node/edge coverage (read the shape, not a frozen count)
pnpm playground:cli invariants AnnotationCoverageProjection # all [✓exec · executable] + ⚠ cohort-wide
pnpm playground:cli invariants ProjectionContext            # the honest code-originated "[] is structural" note
pnpm playground:q 'g.specsReverifying(g.patterns.map(p=>p.name)).filter(s=>s.provenance==="executable" && s.maturity!=="executable").length'  # → 0 (coherence holds)
pnpm playground:smoke                                       # invariant regression check (exits 1 on any ✗)
# drift alarm: paste the DRIFT recipe from recipes.md into playground/scratch/x.ts, then:
#   pnpm playground:q < playground/scratch/x.ts
```
