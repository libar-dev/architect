# DocumentationProjection — Design-Session Context Handoff

**Date:** 2026-06-04 · **Branch:** `campaign/docs-and-skills-consolidation`
**Audience:** the upcoming design-tier sessions on the `DocumentationProjection` epic.
**This is forward context, not a recap.** The specs under `architect/specs/documentation-projection/`
were refined this session (5 precision corrections landed, gate-green) and are accurate as of this
commit — **do not re-iterate them.** Everything below is the verified ground-truth and the
working-tool insights so design authoring starts from facts, not re-discovery.

> Anti-anecdote discipline: every `file:line` below was verified against live source this session
> (by the correction-verification agents) or in the prior 9-agent review. It is canonical as of this
> commit; if a future session sees the live CLI/source disagree, the live source wins — re-confirm.

---

## 0. Start-here (API-first path for the next session)

```bash
pnpm architect:query overview
pnpm -s architect:query bundle DocumentationProjection --mode design --format json
pnpm -s architect:query open-questions --parent DocumentationProjection --include-self
```

- The **3 gating decisions** are the `[gating]`-prefixed open questions. **Count by the `[gating]`
  prefix (3), not a substring match for "gating" (returns 4)** — one `TaxonomyDocumentationCluster`
  member question cross-references the epic's gating question (a pointer, not a 4th decision).
- For the epic's **shape** (its 8 members) use `pattern` / `bundle` / `list --parent` —
  **NOT `arch neighborhood`**, which drops the parent/child axis (FEEDBACK 2026-06-04).

---

## 1. Readiness map (from the 9-agent review; still holds)

- **Design-tier UNBLOCKED now:** `TaxonomyDocumentationCluster` (most-ready), `DesignReviewProjection`
  (engine already shipped), the 3 capability invariants (`MultiSourceComposition` /
  `OneSourceMultipleAudiences` / `SourceCanonical` — refine in place), `ApiReferenceShapeCoverage`
  (pure `@architect-shape` annotation backfill).
- **Design-FINALIZATION blocked:** `GoalOrientedNavigation` (depends on emission-mode + the registry
  re-home), `ReadModelReflexivity` (gated on read-model-reach).
- The corpus is internally self-consistent; every load-bearing `file:line` claim verified against source.

---

## 2. The 3 gating decisions — state + what each unlocks

| Gate                                   | Tractable now?                                                | Unlocks                                                                                                    | Key fact                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Emission-mode / embedding boundary** | **Yes** — a decision, not waiting on code                     | Taxonomy skill + formal-spec shapes; `GoalOrientedNavigation`                                              | Scope = the **embedded-region drift contract**. A skill managed-region (markdown) and a Studio panel rendering generated content inside an authored layout are the _same_ problem one sink over — decide at the embedding-boundary altitude or it is re-decided per sink. First concrete consequence = the **BundleRouting split** (§3).      |
| **Read-model reach**                   | **Yes** — facts established; consequence is a contract change | `ReadModelReflexivity` + the `Manifest` family (INDEX · `--help` · MCP tool list · Studio command palette) | Fold CLI verb schema + MCP registry into the graph (`@architect-shape` precedent, preserves ADR-006 single read model). **Verified:** `PatternGraphSchema` carries `patterns`/`tagRegistry`/views only; CLI/MCP schema live outside the graph today. The amendment is a perf-gated `strictObject` change + every `parseAndProject*` boundary. |
| **Composition-basis ADR-011**          | **No — correctly deferred**                                   | only future facet-shaped families                                                                          | **No heterogeneous second caller for `buildFacetBundle` exists** (verified adversarially, §3). Record born-accepted only after the Studio Design-Review composed view (or another heterogeneous caller) ships. **Do not promote any member assuming `buildFacetBundle` exists.**                                                              |

None of the three blocks the _whole_ epic.

---

## 3. Verified ground-truth the design work needs (`file:line`, as of this commit)

### Shipped ADR-010 composition basis (the settled two shapes)

- `projectSingle` — `packages/architect-projection/src/fragments/base.ts:53` (flat catalog).
- `buildGroupedRoutedBundle` — `…/projections/_shared/grouped-routed-bundle.internal.ts:56`
  (grouped routed bundle); its docstring **deliberately carves `architecture` out as never-grouped**.
- `buildFacetBundle` — **does not exist in source** (spec prose only: epic feature +
  `taxonomy-documentation-cluster.feature:20`).

### BundleRouting — the emission-mode split target

- **A TS `interface` + hand-written `isRoutingLike` guard, NOT a Zod schema:**
  `fragments/base.ts:6` (interface), `:64` (guard). The 3 file-sink fields are optional:
  `markdownRootTarget` / `markdownChildDirectory` / `entityPathLayout` (`base.ts:13/18/24`).
- **Shipped, in-use contract** (1 reader, 1 producer): exported `…/fragments/index.ts:75`; produced in
  `business-rules.internal.ts:163`; read in `markdown-paths.ts:14,41` (+ `types.ts:16`).
- The split — logical routing + `disclosureSpec` stay on the **View**; the 3 file-sink fields move to
  the **emission descriptor** — is a **No-BC shipped-contract refactor** (refactoring carve-out), not
  additive growth. **Open decision the descriptor must make:** guard-vs-Zod under the repo's Zod-first
  boundary doctrine. _(This is now stated in the epic spec via correction A1+A2.)_

### DocumentationTypeRegistry — a 4-axis star; only one axis retires

- Role `contract`, status `active`. Its docstring names **4 orthogonal axes**:
  **(1) identity-list** (document-type enumeration) · **(2) output-routing** (file-sink path literals)
  · **(3) disclosure matrix** · **(4) cli-surface** (generator enumeration).
- `GoalOrientedNavigation` legitimately retires **only the identity-list axis** (the enumeration becomes
  a projection over the families that actually emitted). The other 3 **re-home onto the BundleRouting
  split / emission descriptor** — they are _not_ deleted.
- **Would break if the whole contract were deleted:** `generate-docs.ts:23,101-102` (maps the registry
  by `generatorName`) → drives `generate-docs` / `docs:all` / the `ci:pre-push` determinism gate
  (`package.json:39-40,49`).
- `GeneratorDegeneracyGuard` (`degenerate-guard.ts:3-5,44-51`) is a **separate, completed,
  fragment-kind-keyed build guard that survives** — _not_ the same as the empty-doc / static-index-link
  special-case that navigation subsumes. _(Disambiguated in the spec via correction A3.)_

### Block-vocab reconciliation (R8) — an IMPLEMENTATION prerequisite, NOT a plan/design blocker

Two genuinely distinct 9-variant unions, **zero cross-import** (additive de-duplication, not wide blast radius):

- **core `SectionBlock`** — `section-block.ts:144` (`z.union`), `:121` (`code.language` is a bare
  `z.string().optional()`, no regex). Untracked plain type (no `@architect`). Consumers: core-internal
  only (`presentation-contracts.ts`; `markdown-parser.ts` `parseMarkdownToBlocks` emits `SectionBlock[]`).
- **projection `BlockSchema`** — `blocks/schema.ts:211` (`z.discriminatedUnion`), `:121-127`
  (`code.language` has regex `/^[A-Za-z0-9_+\-.]*$/u` **+ `.max(64)`**). Annotated
  `@architect-pattern BlockSchema` (role `contract`, bounded-context `rendering`); **enables/usedBy 7
  patterns**, with constructors / `isBlock` / `BLOCK_TYPES`.
- **The collapse onto `BlockSchema` is a validation-TIGHTENING on `markdown-parser.ts` output (a runtime
  change), not a cosmetic rename.** _(Now stated in FINDINGS R8 via correction A4.)_
- Owned by the **composition-layer refactor** (`architect-refactor-session`). It blocks the shared-block-
  renderer **implementation**; it does **not** block plan/design authoring. **Sequence it ahead of any
  renderer-bound implementation.**

### Phase/quarter axis (R1) — a source-availability question, not a composition one

- Live: schema fields `extracted-pattern.ts:113,124`; views `pattern-graph.ts:182-183`
  (`byQuarter`/`byPhase`); tag registration `source-ownership.ts:30` (+ `quarter-format.ts`,
  `TIMELINE_GROUP_BY`).
- Unpopulated: `@architect-quarter` absent; the `@architect-phase:N` tags sit on `tests/features/*.feature`
  files — **3 of 5 carry no `@architect-implements`** (the 2 that do: `pattern-graph-cli-query` →
  `PatternGraphAPICLI`, `output-pipeline` → `DataAPIOutputShaping`) — and **none reach the pattern
  record's `phase` field**, so `byPhase` is empty (verified `getPatternsByPhase` → `[]`).
  _(The "all are realization edges" overstatement was loosened this session via correction A5.)_
- **R1 decision before any timeline/roadmap family:** populate the axis / re-scope onto a live dimension
  (status, level) / retire. Cross-ref: the degenerate-generator guard (C15) catches exactly `roadmap` +
  `current-work` + `requirements-specs` as empty today.

### ADR-011 evidence — every bundle's `children` are a single fragment kind

- `architecture-diagram.ts:82` → `Record<string, ArchitectureDiagram>` (homogeneous; lenses vary only `scope`)
- `design-review.ts:160` → `Record<string, ArchitectureDiagram>` (homogeneous)
- `operational-insights/index.ts:1187-1203` → `Record<string, RequirementDigest>` (the two-level
  `requirements-*` shape; still one fragment kind; **lone caller**)
- `delivery-reporting:442` → `Record<string, TFragment>` (single type param)
- `grouped-routed:82` `buildGroupChild` → one kind per caller
- → **No bundle mixes kinds → no qualifying heterogeneous `buildFacetBundle` caller.** The likeliest
  first is the **unbuilt** Studio Design-Review composed view (pattern + dependency subgraph +
  rule-coverage + conflicts). **Nestable children** stays deferred _separately_ (lone caller
  `requirements-*`), **not** folded into ADR-011.

---

## 4. Per-member impact (design-relevant, four-way split)

| Member                              | Change kind                                                       | Touches                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 3 capability invariants             | additive (invariants, not deliverables)                           | no shipped contract                                                                               |
| `TaxonomyDocumentationCluster`      | additive — rides shipped `projectSingle`/`projectTaxonomyDigest`  | `taxonomy-digest.ts:73` (reused) + 2 unbuilt emission shapes                                      |
| `DesignReviewProjection`            | additive — already shipped                                        | `design-review.ts:160`                                                                            |
| `ApiReferenceShapeCoverage`         | annotation backfill                                               | `@architect-shape` on exported decls; zero renderer/contract touch                                |
| Emission-mode / BundleRouting split | **No-BC shipped-contract refactor**                               | `fragments/base.ts:6-25` + 1 reader + 1 producer + registry (contained in `architect-projection`) |
| Block-vocab reconciliation (R8)     | **No-BC shipped-contract refactor**                               | `section-block.ts` (delete) → `blocks/schema.ts` (survivor); 2 isolated trees                     |
| `ReadModelReflexivity`              | **mixed** — net-new emission **+ `PatternGraphSchema` amendment** | perf-gated `strictObject` + every `parseAndProject*` boundary                                     |
| `GoalOrientedNavigation`            | No-BC deletion (identity-list axis only)                          | registry identity axis; other 3 axes re-home                                                      |
| ADR-011 / `buildFacetBundle`        | blocked-on-gating (prose-only)                                    | **no code** — correctly deferred                                                                  |

---

## 5. Recommended sequencing (corrections A1–A5 already applied)

1. **`TaxonomyDocumentationCluster` design spec** — most-ready (rides the shipped
   `projectSingle`/`projectTaxonomyDigest` basis; single-slice; explicitly needs no facet helper).
   Defer finalizing the **skill + formal-spec embedded shapes** until emission-mode lands.
2. **Make the emission-mode gating decision** — scope to the embedded-region drift contract; specify
   the BundleRouting split (incl. the guard-vs-Zod call).
3. **Tighten `GoalOrientedNavigation`** before promoting (the registry re-home is now named in the spec).
4. **Spawn R8 block-vocab reconciliation** as a tracked refactoring carve-out, ahead of any
   renderer-bound implementation (does not block plan/design authoring).
5. **Make the read-model-reach decision** before designing `ReadModelReflexivity`; plan the
   `PatternGraphSchema` slice amendment + enumerate the `parseAndProject*` re-parse sites.
6. **Leave ADR-011 deferred** — record born-accepted only after a heterogeneous caller ships.
7. **Resolve R1** (populate / re-scope / retire the quarter/phase axis) before any timeline/roadmap family.

---

## 6. Working-tool insights from this session (save time next session)

- **API boundary is pattern-record-grained.** Gather _state_ via API (`pattern` / `bundle` / `rules` /
  `open-questions`); verify _contract shapes_ (BundleRouting, BlockSchema, the registry's 4 axes,
  `children:Record` homogeneity) via **source reads**. `search BundleRouting` / `SectionBlock` /
  `buildFacetBundle` all return `[]` because they're not `@architect-pattern`-annotated — `BlockSchema`
  _is_, so it shows. This is the right boundary, not a defect.
- **`arch neighborhood <Epic>` drops the parent/child axis** (FEEDBACK 2026-06-04) — use
  `pattern` / `bundle` / `list --parent` for an epic's member shape.
- **`open-questions --parent <Epic> --include-self`** for the gating set; count gating by the `[gating]`
  prefix, not a substring (the substring count is inflated by a cross-reference).
- **`pnpm docs:check`** is the mid-changeset determinism probe (re-renders, diffs the working tree,
  writes nothing, non-zero on drift). Confirmed this session: **candidate-tier spec prose/rules do NOT
  reach `docs-live/`** — these 5 spec edits produced **zero `docs-live/` drift**.
- **Prose mentions of pattern names in specs are not graph edges** — only `@architect-*` tags are. Safe
  to reference `BundleRouting` / `GeneratorDegeneracyGuard` / `DocumentationTypeRegistry` in spec prose
  without creating dangling references.
- **Don't re-discover this session's corrections** — they're now in the specs:
  BundleRouting-is-interface-not-Zod (A1), split-is-No-BC-refactor (A2), registry-is-4-axis-only-identity-
  retires (A3), R8-tightens-validation (A4), phase-tags-not-all-realization-edges (A5).

---

## Pointers

- **Specs:** `architect/specs/documentation-projection/{00-04}.feature`,
  `architect/specs/taxonomy-documentation-cluster.feature`
- **Working reference:** `.pr-coordination/DOCS-IA-FINDINGS.md` (corpus inventory, overlap matrix, R-items)
- **Prior review (full):** `plans/please-review-these-wip-delegated-pony.md` (+ the two agent sub-reports
  in the same folder)
- **Re-confirm gating state any time:** `pnpm -s architect:query pattern ADR011` (→ not found);
  `pnpm -s architect:query open-questions --parent DocumentationProjection --include-self`
