# Review: `documentation-projection` WIP specs — API helpfulness, impact clarity, design-tier readiness

## Context

The `DocumentationProjection` epic (`candidate`) is the next big step in the from-scratch
rearchitecture of the projection pipeline: collapse the documentType-first projection star into
**source-first Views over one engine**. The five WIP specs under
`architect/specs/documentation-projection/` (epic + 3 capability invariants + `GoalOrientedNavigation`)
plus the out-of-folder members (`TaxonomyDocumentationCluster`, `DesignReviewProjection`,
`ReadModelReflexivity`, `ApiReferenceShapeCoverage`) were reviewed to answer three questions the user
posed:

1. How helpful is the Data API for this review?
2. Is the impact of implementation on existing code already clear?
3. Do we have everything to continue refining specs and authoring design-level specs?

Method: Architect Data API as first read surface (capability tour passed, zero graph drift), then a
9-agent review workflow — 6 adversarial verifiers checking the specs' `file:line` code claims against
live source, then 3 assessors (impact / readiness / API-helpfulness) over the verified claim-set.
**Every load-bearing claim in the specs holds against source.** The corpus is internally self-consistent;
no dead context survives that No-BC should have deleted.

---

## Answer 1 — API helpfulness: **helpful, with a correct boundary** (`helpful-with-gaps`)

Strong on everything **graph-grained**, silent only where it is correctly out of scope.

**Answered deterministically and well** (no file scan needed):

- Member state/maturity/role/file for all 8 members + epic (`pattern`, `bundle --mode design`).
- Epic↔member hierarchy (`bundle` Member list + `pattern` Hierarchy block — both directions).
- Every invariant verbatim with scenario coverage (`rules --pattern`, bundle Blocks) — incl. the
  load-bearing epic rules naming the BundleRouting split, `buildFacetBundle`, the block-vocab prerequisite.
- The full open-question set **including the 3 `[gating]` decisions** (`open-questions --parent … --include-self`).
- `scope-validate <member> design` READY verdicts with exact missing-stub warnings.
- `documentation design-review` — renders all 9 candidate epic nodes with live `(role · status)` annotations
  (the spec's "a design review includes not-yet-implemented specs" rule self-demonstrating).
- `documentation architecture` by-theme ADR lens — ADR-010 in the `projections` theme, **no ADR-011 node**.
- ADR existence/status (`pattern ADR010…` → completed/enables-epic; `pattern ADR011` → not found).

**Did not answer — correctly out of scope** (the four clusters marked `required-file-read`/`mixed`):

- Every `file:line` code claim (`architecture-diagram.ts:82` homogeneous children, `design-review.ts:160`,
  the requirements-\* two-level shape) — the graph indexes pattern records, not AST shapes inside a projection.
- Every **contract-shape** claim — `search BundleRouting` / `SectionBlock` / `buildFacetBundle` all return `[]`.
  The query surface is **pattern-record-grained**; Zod-schema / TS-interface / helper-function altitude is invisible
  unless `@architect-pattern`-annotated (so `BlockSchema` shows, its untracked twin `SectionBlock` does not).
- Pure design judgment (split BundleRouting? ratify ADR-011? does GoalOrientedNavigation overclaim?) — the API
  _fed accurate state into_ these calls, which is its job.

**Surprises worth a `FEEDBACK.md` entry:**

- **`arch neighborhood` silently omits the parent/child member axis.** `arch neighborhood DocumentationProjection`
  returns only `uses ADR010` — the 8 member edges are dropped, so the epic reads as a near-isolated node. The
  edges exist (pattern/bundle expose them); neighborhood is dependency-axis-only without saying so. **(file a note)**
- Contract-shape blindness is **systematic** — route schema-shape claims to source reads from the start.
- `open-questions` has no `--gating-only` filter; the 3 gating decisions are only distinguishable by parsing the
  `[gating]` prose prefix, and only appear with `--include-self`.

## Answer 2 — Impact on existing code: **mostly clear, gaps cleanly named** (`impact-mostly-clear-gaps-named`)

Impact splits four ways, each pinned to verified `file:line` evidence:

| Member                                                                                | Change kind                                                      | Clarity                          | Touches                                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3 capability invariants (`MultiSourceComposition` / `OneSource…` / `SourceCanonical`) | additive (invariants, not deliverables)                          | clear                            | no shipped contract                                                                                                                                                                    |
| `TaxonomyDocumentationCluster`                                                        | additive — rides shipped `projectSingle`/`projectTaxonomyDigest` | clear                            | `taxonomy-digest.ts:73` (reused unchanged) + 2 unbuilt emission shapes                                                                                                                 |
| `DesignReviewProjection`                                                              | additive — **already shipped**                                   | clear                            | `design-review.ts:160` (homogeneous children)                                                                                                                                          |
| `ApiReferenceShapeCoverage`                                                           | annotation backfill                                              | clear                            | `@architect-shape` on exported decls; zero renderer/contract touch                                                                                                                     |
| **Emission-mode / BundleRouting split**                                               | **No-BC shipped-contract refactor**                              | clear                            | `fragments/base.ts:6-25` + 1 reader (`markdown-paths.ts`) + 1 producer (`documentation-bundle.internal.ts`) + guard + registry source — **small, contained in `architect-projection`** |
| **Block-vocab reconciliation (R8)**                                                   | **No-BC shipped-contract refactor**                              | partially clear                  | `architect-core/config/section-block.ts` (delete) → `architect-projection/blocks/schema.ts` (survivor); 2 isolated trees, zero cross-import                                            |
| `ReadModelReflexivity`                                                                | **mixed** — net-new emission **+ contract amendment**            | partially clear                  | requires extending `PatternGraphSchema` (perf-gated strictObject) + `build-pipeline.ts:113` + every `parseAndProject*` boundary                                                        |
| `GoalOrientedNavigation`                                                              | No-BC deletion                                                   | **partially clear (overclaims)** | `DocumentationTypeRegistry` is a 4-axis star; navigation owns **only the identity axis**                                                                                               |
| ADR-011 / `buildFacetBundle`                                                          | blocked-on-gating (prose-only)                                   | clear                            | **no code** — correctly deferred                                                                                                                                                       |

**Biggest unknowns (named, bounded):**

- `GoalOrientedNavigation` never names where the registry's 3 surviving non-identity axes (output-routing
  file-sink literals, disclosure matrix, cli-surface generator enumeration) **re-home**. Deleting the active
  `@architect-role:contract` pattern as written would break `generate-docs.ts`, `docs:all`, and the
  `ci:pre-push` determinism gate with no destination.
- ADR-011's qualifying heterogeneous second caller is the **unbuilt** Studio Design-Review composed view —
  genuinely absent, not merely unwired.
- Block-vocab survivor `BlockSchema` **tightens** `code.language` validation (regex + `max(64)`) on
  `markdown-parser.ts` output — a runtime change, not a cosmetic rename; no pattern owns the reconciliation yet.
- Read-model-reach: the `PatternGraphSchema` delta shape (new top-level key vs per-pattern field) is undecided.

## Answer 3 — Readiness: **yes, with named prerequisites for two members** (`ready-with-named-prereqs`)

**Spec refinement can continue across all 9 members now.** Design-tier authoring is **unblocked** for:
`TaxonomyDocumentationCluster` (2 of 4 shapes already ship, single-slice, explicitly needs no facet helper),
`DesignReviewProjection` (shipped), the 3 invariants (refine in place), and `ApiReferenceShapeCoverage` (backfill).

**Two members cannot be design-_finalized_ yet:**

- `GoalOrientedNavigation` — registry-retirement claim over-stated; depends on the emission-mode BundleRouting split.
- `ReadModelReflexivity` — gated by read-model-reach (needs a `PatternGraphSchema` amendment first).

**Gating decisions — none blocks the whole epic:**
| Gate | Tractable now? | Blocks |
|---|---|---|
| Emission-mode / embedding boundary | **yes** (decision, not waiting on code) | Taxonomy skill+formal-spec shapes, GoalOrientedNavigation |
| Read-model reach | **yes** (facts established; consequence is a contract change) | ReadModelReflexivity + API/verbs family |
| Composition-basis ADR-011 | **no — correctly deferred** (no heterogeneous caller exists) | only future facet-shaped families |

---

## Forward path — refining specs → design-level specs

### A. Spec-wording corrections the review surfaced (precision, not direction)

The specs are directionally sound; these are accuracy fixes before promotion:

1. **BundleRouting is a TS `interface` + hand-written `isRoutingLike` guard, NOT a Zod schema** — the rule
   "A generated document is one emission of a sink-agnostic view" (`00-…feature:60`) calls it a schema. The new
   emission descriptor must decide guard-vs-Zod under repo Zod-first doctrine. (Spec names 3 file-sink fields, correct.)
2. **The BundleRouting split is a No-BC shipped-contract refactor, not additive** — frame it via the refactoring
   carve-out (`architect-refactor-session`), not additive growth.
3. **`GoalOrientedNavigation` "DELETES the `DocumentationTypeRegistry`" overclaims** — change to "retires the
   **identity-list role** of the registry" and name the carrier for the output-routing / disclosure / cli-surface
   axes (the epic's BundleRouting split). Disambiguate "empty-doc special-cases" (static-index-link concern, which
   navigation subsumes) from `GeneratorDegeneracyGuard` (a completed, fragment-kind-keyed build guard that survives).
4. **Sharpen R8 (block-vocab)** — it undercounts: projection's `code.language` has a regex + `max(64)` core lacks,
   so the collapse onto `BlockSchema` tightens validation; not a cosmetic rename.
5. **Loosen the phase-edge wording** in the "never shipped empty" rule — not all phase-tagged `tests/features`
   files are `@architect-implements` edges (3 of 5 carry none); the data-emptiness conclusion is unaffected.

### B. Sequencing (recommended order)

1. **Author `TaxonomyDocumentationCluster` design spec** — most ready. Design reference + live-API shapes fully now
   (they ride the shipped `projectSingle` basis); defer finalizing the skill + formal-spec embedded shapes until
   emission-mode lands.
2. **Make the emission-mode gating decision** (tractable now) — scope to the embedded-region drift contract;
   specify the BundleRouting split. Apply corrections A1–A2 first.
3. **Tighten `GoalOrientedNavigation`** (A3) before promoting it.
4. **Spawn R8 block-vocab reconciliation** as a tracked refactoring carve-out, sequenced **ahead of any
   renderer-bound implementation** (does not block plan/design authoring).
5. **Make the read-model-reach decision** before designing `ReadModelReflexivity`; plan the `PatternGraphSchema`
   slice amendment + enumerate the `parseAndProject*` re-parse sites.
6. **Leave ADR-011 deferred** — do not promote any member assuming `buildFacetBundle` exists; record it
   born-accepted only after the Studio Design-Review composed view (or another heterogeneous caller) ships.
7. **Resolve R1** (populate / re-scope / retire the quarter/phase axis) before any timeline/roadmap family.

### Critical files

- Specs: `architect/specs/documentation-projection/{00-04}.feature`, `architect/specs/taxonomy-documentation-cluster.feature`
- Shipped basis: `packages/architect-projection/src/fragments/base.ts` (BundleRouting + `projectSingle`),
  `…/projections/_shared/grouped-routed-bundle.internal.ts` (`buildGroupedRoutedBundle`)
- Refactor surfaces: `…/blocks/schema.ts` ↔ `architect-core/src/config/section-block.ts` (R8);
  `…/documentation-composition/documentation-type-registry.*` (registry star); `architect-core/src/validation-schemas/pattern-graph.ts` (read-model reach)
- Working reference: `.pr-coordination/DOCS-IA-FINDINGS.md` (corpus inventory, overlap matrix, R-items)

## Verification

- Re-run the determinism gate to confirm no drift was introduced: `pnpm docs:all && git diff --exit-code docs-live`.
- Re-confirm gating state any time: `pnpm -s architect:query pattern ADR011` (→ not found) and
  `pnpm -s architect:query open-questions --parent DocumentationProjection --include-self`.
- After any spec edit: `pnpm validate:all && pnpm architect:guard --staged`.
- Verified code claims (spot-check): `architecture-diagram.ts:82` + `design-review.ts:160` (homogeneous children),
  `fragments/base.ts:6-25` (BundleRouting conflation), `architect-core/config/section-block.ts` vs
  `architect-projection/blocks/schema.ts` (two block vocabularies).

> **Note:** this plan's primary deliverable is the **review report above**. The forward-path section is the
> answer to "do we have everything to continue" — it is the work, not yet done. Confirm scope before executing.
