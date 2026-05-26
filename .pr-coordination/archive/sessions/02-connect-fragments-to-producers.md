# Session 02 — Connect fragment kinds to their producers (WS-1)

> Paste-ready worker prompt. **Read `../PREAMBLE.md` first** (mandatory skills +
> API-first discipline), then `../EXECUTION-PLAN.md` §4–§8 and `../DECISIONS.md`
> (esp. **D-7**).

## Goal

De-orphan the 10 pattern-relations fragment orphans (the first of 5 contexts).
Two-part model (D-7), both verified against code:

1. **Produced fragments → their producer.** Every `<X>Projection` returns
   `ProjectionBundle<X>` and builds `{ kind: 'X', … }`, so `<X>Projection
@architect-uses <X>` is a true producer→product edge ("what produces `X`?").
2. **`Supporting` helper-bundles → the schemas they import.** A `*Supporting`
   fragment has **no producer** (it's a shared sub-schema bundle); connect it via
   `@architect-uses` on the schemas it imports.

**Do NOT** model this as `<Context>FragmentContracts uses <members>`. The barrel
`fragments/<ctx>/index.ts` is a **pure re-export surface** — declaring it "uses"
what it re-exports inverts the dependency. That model was rejected at review (D-7).

## API-first investigation (model the behaviour — do this before editing)

```bash
pnpm architect:query arch orphans                          # current orphan set (fragments)
pnpm architect:query arch bounded-context pattern-relations
pnpm architect:query pattern PatternDetail                 # confirm orphan (no usedBy)
pnpm architect:query arch neighborhood PatternDetailProjection
```

Then — and ONLY to author correct edges — read each projection function to confirm
which fragment(s) it constructs: look at the `ProjectionBundle<…>` return type and
every `kind: '…'` literal it builds. That construction fact is the one thing the
graph cannot yet tell you. **Never list a fragment the function does not build.**

## Scope (this session) — the 10 pattern-relations orphans

The current orphans are exactly: `ArchitectureComparison`, `ArchitectureNeighborhood`,
`DependencyEdge`, `DependencyEdgeSet`, `DependencyTree`, `OrphanPatternList`,
`PatternCatalog`, `PatternDetail`, `PatternSummary`, `PatternRelationsSupporting`
(re-confirm with `arch orphans`). Note `OpenQuestionList`, `PatternBundleEntry`,
`BoundedContext` are **already connected — do not touch them.**

### A. Producer→fragment edges (9 fragments via 8 producers — VERIFIED)

On each projection-function pattern (the public `.ts`, which owns
`@architect-pattern <X>Projection`), append `@architect-uses <fragment>` after the
existing `@architect-uses` line (additive — keep the existing edge). Every row below
was confirmed against the file's `ProjectionBundle<…>` return + `kind:'…'` literals:

| Projection pattern (file in `projections/pattern-relations/`)         | add `@architect-uses`             |
| --------------------------------------------------------------------- | --------------------------------- |
| `PatternCatalogProjection` (`pattern-catalog.ts`)                     | PatternCatalog                    |
| `PatternSummaryProjection` (`pattern-summary.ts`)                     | PatternSummary                    |
| `PatternDetailProjection` (`pattern-detail.ts`)                       | PatternDetail                     |
| `DependencyEdgeProjection` (`dependency-edges.ts`)                    | DependencyEdge, DependencyEdgeSet |
| `DependencyTreeProjection` (`dependency-tree.ts`)                     | DependencyTree                    |
| `ArchitectureNeighborhoodProjection` (`architecture-neighborhood.ts`) | ArchitectureNeighborhood          |
| `ArchitectureComparisonProjection` (`architecture-comparison.ts`)     | ArchitectureComparison            |
| `OrphanPatternListProjection` (`orphan-pattern-list.ts`)              | OrphanPatternList                 |

Still re-confirm each before editing (the import facts are the authority).

### B. `PatternRelationsSupporting` — NOT a producer fragment (handle separately)

`PatternRelationsSupporting` (`fragments/pattern-relations/supporting.ts`) is a
**helper-schema bundle** (shared sub-schemas for sources/relationships/hierarchy/
deliverables/stubs). **No projection function produces it** — the producer model
does not apply. It is de-orphaned by the schemas it **imports**: verified, it imports
`DeliverableSchema` + `DeliverableManifestSchema`, so add
`@architect-uses Deliverable, DeliverableManifest` to its JSDoc. Confirm the imports
before editing; add only edges for schemas it genuinely imports.

## Out of scope (defer to later sessions, one context each)

- governance, execution-context, operational-insights, delivery-reporting (same
  two-part model — producers + each context's `Supporting` helper-bundle — one
  session per context; verify producers/imports fresh, do not assume symmetry).
- Cluster D (`ExtractedPattern` read model, core package).
- Any `Rule:`/invariant authoring; any non-projection package.

## Gates (before commit) — full sequence in `../EXECUTION-PLAN.md §6`

Includes `git add <edited projection files> && pnpm architect:guard --staged`.
`docs:all` will change `docs-live/` (new edges) — regenerate and commit it.

## Acceptance

- `pnpm architect:query pattern PatternDetail` → now shows `usedBy: [PatternDetailProjection]`.
- `pnpm architect:query dep-tree PatternDetail` → `PatternDetail ← PatternDetailProjection`.
- `pnpm architect:query arch orphans` → pattern-relations fragment orphans → ~0.
- `arch dangling --strict` exits 0; `architect:guard --staged` passes.

## On completion

Append a < 20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md`; bump
`../state.json` (orphan metrics, next session = next context's producers).
