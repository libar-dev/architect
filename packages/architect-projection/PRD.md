# architect-projection — Package PRD

> Boundary contract recorded post-PR-#15. Describes what the **code** exposes today, not what the
> (known low-quality, disposable) `@architect-*` annotations claim. This is the heaviest package in
> the family and the primary subtraction target.

## Purpose

`@libar-dev/architect-projection` is the **read side** of the event-sourced system: it turns the
assembled `PatternGraph` (from `architect-core`) into Zod-validated **Named Domain Fragments** and
then **renders** those fragments to a sink — compact-text, JSON, markdown, or Studio UI blocks. It
is the one place that knows how to shape graph state into something a consumer (agent bundle, MCP
call, Studio view-state, generated doc) can read. It owns no graph assembly and no I/O; it is a pure
`PatternGraph → Fragment → rendered-output` transform.

## Public interface

Exposed via `src/index.ts` plus seven subpath exports in `package.json`
(`./blocks`, `./context`, `./disclosure`, `./routing`, `./fragments`, `./projections`, `./renderers`).
Four logical layers:

- **Fragments (`./fragments`)** — ~44 Zod fragment schemas + inferred types, grouped into six
  bounded contexts: `pattern-relations`, `delivery-reporting`, `governance`, `execution-context`,
  `operational-insights`, `documentation-composition`. The discriminated `Fragment` union
  (`fragment-schema.internal.ts`) and the bundle primitives `projectSingle` / `isBundle` /
  `ProjectionBundle` / `BundleRouting` (`fragments/base.ts`) are the trust-boundary shapes everything
  else flows through. These are the ADR-010 helpers — small, load-bearing.
- **Projections (`./projections`)** — 51 exported `projectX(context, …)` functions plus 14
  `parseAndProjectX(...)` trust-boundary variants (ADR-009 — parse raw input once, then project).
  These take a `ProjectionContext` (graph + tag registry + package resolver + optional filter) and
  return a fragment or a `ProjectionBundle<Fragment>`. Also exports `filterPattern(s)` +
  `ProjectionFilter`, and `ProjectionError` / `ProjectionErrorCode`.
- **Composition engine (`./projections` → `documentation-composition/`)** — the documentType "star":
  `parseAndProjectDocumentationBundle`, the `SUPPORTED_DOCUMENTATION_TYPE_*` registry + metadata
  lookups, `resolveProjectionFilter`, and the disclosure/routing wiring. One entry point dispatches
  by `documentType` string to one of 13 bespoke projection factories.
- **Renderers (`./renderers`)** — `renderMarkdown`, `renderJson`, `renderCompactText`, `renderUi`
  (+ `UiDocument`/`UiSection` for Studio), each with a Zod options schema and a shared
  kind-dispatch table (`_shared/dispatch.ts`). Block vocabulary (`./blocks`), disclosure vocabulary
  (`./disclosure`), and logical route IDs (`./routing`) are the supporting contracts renderers and
  the composition engine consume.

## Enumerated functionality

- **Pattern-relations projections** (the API/MCP core): `projectPatternBundle`,
  `projectPatternCatalog`, `projectPatternDetail`, `projectPatternSummary`, `projectDependencyTree`,
  `projectDependencyEdges`, `projectArchitectureNeighborhood`, `projectArchitectureComparison`,
  `projectBoundedContext`, `projectArchitectureGraph`, `projectOpenQuestionList`,
  `projectOrphanPatternList`.
- **Delivery-reporting projections**: `projectStatusDistribution`,
  `projectRoadmapTimeline`, `projectCompletedMilestones`, `projectCurrentWork`,
  `projectChangelog`, `projectTraceabilityMatrix`.
- **Governance projections**: business rules / rule-set, decision catalog + record, taxonomy digest,
  validation-rule digest.
- **Execution-context projections**: deliverables/manifest, file-reading-list, handoff record,
  scope-readiness report, session-context bundle.
- **Operational-insights projections**: overview digest, annotation coverage, tag-usage matrix,
  source inventory, role profile(s), requirement digest (general + executable + specs buckets).
- **Document types (14)**: `architecture`, `design-review`, `api-reference`, `decisions`, `business-rules`,
  `patterns`, `roadmap`, `current-work`, `requirements-executable`, `requirements-specs`,
  `validation-rules`, `taxonomy`, `changelog`, `traceability` — each a metadata identity + output
  routing + disclosure matrix + CLI-surface aliases, composed in `documentation-definition.internal.ts`.
- **Renderers (4 sinks)**: markdown (paths + nested-index/flat layout), JSON, compact-text (agent
  context), UI (Studio `UiDocument` blocks).
- **Composition helpers**: `projectSingle` + `buildGroupedRoutedBundle` (the ADR-010 group→sort→
  root+children→route→degrade helper, used by `api-reference` and `business-rules`).
- **Disclosure / filtering**: progressive-disclosure levels + policy, `DisclosureSpec`
  (grouping axis × content richness × root shape × emitChildren × filter), `resolveProjectionFilter`,
  per-pattern `filterPattern(s)`.

## Dependencies

- **Intra-repo:** depends on **`@libar-dev/architect-core` only** (consumes `PatternGraph`,
  `ExtractedPattern`, `isPattern*` predicates, `slugify`, core `ProjectionError`). No other
  architect package is imported. Direction is strictly `core → projection`.
- **External:** `zod` (every fragment, option, and disclosure schema). Dev-only:
  `@amiceli/vitest-cucumber`, `vitest`. No runtime I/O, no filesystem, no network — `sideEffects: false`.

## Consumers

- **`architect-cli`** — `architect:query` verbs (overview / status / list / pattern / bundle /
  dep-tree / context / rules / taxonomy / `documentation <type>`, etc.) render projections to
  compact-text / JSON / markdown.
- **`architect-mcp`** — the `architect_*` tool twins call the same projection functions, returning
  fragment JSON.
- **docgen (`pnpm docs:all` → `docs-live/`)** — drives `parseAndProjectDocumentationBundle` across
  all 14 document types and renders markdown (the determinism-gate diff target).
- **Libar Studio (desktop/web)** — consumes `renderUi` `UiDocument` blocks (live view-state, the
  product sink).
- **Dogfood scripts / tests** — smoke + the CI perf gate (36-pattern / 108-rule fixture) exercise the
  projection→render path.

## Load-bearing vs incidental (cut-list)

This package is the heart of the subtraction. The owner's stated target — "105 projections → ~5" —
is achievable because the package today is a **documentType-first star**: ~13 bespoke document types
and ~30+ bespoke `projectX` functions, most of which exist to answer one question for one output,
when the demanding sink (live Studio view-state) needs a small set of **source-first** views over one
engine.

### Load-bearing (the irreducible core — keep)

- **`fragments/base.ts`** — `projectSingle`, `isBundle`, `ProjectionBundle`, `BundleRouting`. The
  ADR-010 bundle shape. ~100 LOC; everything routes through it.
- **`projections/_shared/grouped-routed-bundle.internal.ts`** — `buildGroupedRoutedBundle`. The one
  generalized group→sort→root+children→route→degrade helper. This is the _shape_ the ~5 surviving
  views should converge on; it already deliberately refuses speculative generality (the
  one-child-per-group constraint, documented in its header).
- **`projections/_shared/`** — `filter.ts` (ProjectionFilter), `pattern-helpers.internal.ts`,
  `parse-and-project.internal.ts` (the ADR-009 trust boundary), `architecture-graph.internal.ts`
  (the component/context graph walk Studio and overview both need). The reusable transform skeleton.
- **The few projections a live sink actually renders**: `projectPatternDetail` / `projectPatternCatalog`
  / `projectPatternBundle` / `projectArchitectureGraph` / `projectArchitectureNeighborhood` (pattern
  exploration), `projectOverviewDigest` (session bootstrap), and `projectStatusDistribution`. These
  are what the CLI/MCP/Studio surfaces lean on every session.
- **`renderers/render-ui.ts`** (Studio) + **`renderers/render-json.ts`** (MCP) + a compact-text path
  for agents. These map to real, demanding sinks.
- **`disclosure/`** vocabulary as _types_ (grouping/richness/rootShape) — the concept is sound; what's
  incidental is treating it as a config engine (below).

Estimate: the genuinely load-bearing core is roughly **30–40% of the package** (~7k of ~18k LOC),
concentrated in `_shared/`, `fragments/base.ts`, pattern-relations, the UI/JSON renderers, and the
overview path.

### Incidental / deletion-candidate (the documentType sprawl — cut)

1. **The documentType "star" (`projections/documentation-composition/`, ~1,990 LOC).** This is the
   single biggest cut. `documentation-definition.internal.ts` wires **14 document types** each to a
   bespoke factory; `documentation-type-registry.{identity,disclosure,output-routing,cli-surface}.ts`
   split one registry across four files; `documentation-bundle.internal.ts` + `projection-filter-resolver.ts`
   - `disclosure-matrix.ts` form a config-engine that exists to make "one bespoke projection per
     output" feel uniform. Under a source-first model this collapses to a handful of Views over one
     engine; most of these 14 types are doc-shaped slices of the same graph and do not need their own
     factory, registry row, routing block, and disclosure matrix.

2. **Dead/degenerate generators over dimensions the read-model no longer carries.**
   - `delivery-reporting/` (~740 LOC) — `projectCurrentWork`, `projectRoadmapTimeline`,
     `projectCompletedMilestones`, `projectTraceabilityMatrix`, `projectChangelog`. Most of these
     project over status and completion-oriented views rather than retired quarter / numeric-phase
     axes, and the remaining timeline framing still leans on `git log`, not the live
     read model. `current-work` is `active`-status-filtered timeline; `traceability` is a
     pattern→tests matrix; `projectChangelog` is the one surviving release-free completed-patterns
     view, keeping release history git-tag-derived instead of authored as manifest state. These are
     bespoke-per-question projections feeding markdown docs (the minor sink), not Studio view-state.
     Strong candidates for deletion or collapse into one status/timeline view.
   - `traceability` and `roadmap` document types route over removed/disfavored dimensions and produce
     per-row child files (`TRACEABILITY.md` + one child per pattern) that no live sink consumes.

3. **Fragment-per-question schemas beyond what a live sink renders (~44 fragments is too many).**
   Many fragments are one-projection-one-fragment pairings: `TraceabilityMatrix`, `RoadmapTimeline`,
   `OrphanPatternList`, `ArchitectureComparison`,
   `BusinessRuleReference` vs `BusinessRule` vs `BusinessRuleSet` (three governance fragments where
   one would do), the `SourceInventory*` / `TagUsage*` / `AnnotationCoverage` operational-insights
   trio. Each adds a schema file + supporting types + a renderer dispatch arm. A source-first model
   wants a small set of composable fragments, not one per CLI verb.

4. **The disclosure-matrix-as-config-engine.** The `DisclosureSpec` (grouping × richness × rootShape ×
   emitChildren × committed × filter) per document type per level, resolved through
   `projection-filter-resolver.ts` and `disclosure-matrix.ts`, is configuration standing in for code.
   Keep the disclosure _level_ concept; delete the per-docType matrix machinery — a View decides its
   own shape directly.

5. **`render-markdown.ts` is 2,544 LOC — the single largest file in the package**, and markdown is
   explicitly "a test harness and minor consumer, never the goal." A large fraction of it special-cases
   the 13 documentType outputs and the routed-children file layouts. As the documentType star
   collapses, most of this renderer collapses with it. `render-compact-text.ts` (543) overlaps heavily
   with markdown and is a second candidate for consolidation.

6. **Per-subdomain `*-shared.internal.ts` + `supporting.ts` proliferation** — `governance`,
   `execution-context`, `operational-insights`, `documentation-composition` each carry their own
   `*-shared.internal.ts` and per-fragment `supporting.ts`. Much of this is bespoke plumbing for
   projections that themselves are deletion candidates.

Estimate: the documentType star + its dedicated renderers + the bespoke per-output projections and
their fragments are roughly **55–60% of the package** — directly in line with the owner's
"105 → ~5" target.

## Size signal

- **Files:** 153 `.ts` files under `src/`.
- **LOC:** ~18,000 total in `src/`. Heaviest areas: `renderers/` ~4,275 (of which
  `render-markdown.ts` alone is 2,544), `projections/` ~9,970, `fragments/` ~2,919.
- **Fragments:** ~44 Zod fragment schema files across 6 bounded contexts.
- **Projections:** 51 exported `projectX` functions + 14 `parseAndProjectX` trust-boundary variants;
  14 document types in the composition star.
- **Patterns:** ~106 `@architect-pattern` identity tags in production `src/`; the live graph reports
  **121** patterns for the package (production + `*ExecutableTests` test patterns) — by far the
  heaviest package in the family.
