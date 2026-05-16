# Projection Pipeline Reference: Codecs & Formatters Mapping

This file is a reference map for the current projection pipeline. It records how
deleted codec and formatter surfaces correspond to retained projection and
renderer entrypoints; it is not an active migration checklist.

## Current State

The `@libar-dev/architect-projection` package provides a single unified pipeline
for all document and context generation. The pipeline flows as:
**PatternGraph -> projection -> Fragment -> renderer -> output**. A projection
function reads from the `PatternGraph` (via a `ProjectionContext`) and produces
a typed, Zod-validated `Fragment`. Renderers then transform fragments into the
target format: compact text for AI consumption, JSON for structured APIs,
Markdown for generated documentation, or UI documents for Studio.

When a projection exposes both validated and raw forms, the public barrels now
prefer the validated `parseAndProject*` entrypoint. Raw `project*` helpers stay
in module scope for internal composition, or remain public only when there is no
separate validated wrapper.

## Boundary validation

Projection entrypoints now follow a single trust-boundary rule: untrusted raw
options parse exactly once through the shared `parseAndProject*` helper, then
the projection internals work with typed options and typed fragments.

Use `parseAndProject*` entrypoints at external boundaries such as CLI, MCP, and
other consumer-facing integration surfaces. Keep raw `project*` helpers for
internal composition where the caller already holds typed inputs.

Markdown rendering has a second, output-facing trust boundary: fragment block
text is plain text unless a renderer-owned block explicitly marks inline
Markdown as trusted. `renderMarkdown` escapes plain-text prose/list/link-label
content — including `collapsible.summary` — and rejects unsafe `link-out` URL
schemes (`javascript:`, `data:`, etc.) plus protocol-relative targets
(`//host/...`) by rendering them as plain text. Relative and root-relative
targets remain allowed. Raw `code` and `mermaid` block bodies remain intentional
trusted-output surfaces, and the trusted-inline-Markdown escape hatch stays
renderer-private.

Routed markdown output paths have a stricter contract than ordinary `link-out`
targets. The renderer normalizes the root output path, but child output paths
must already be canonical relative `.md` paths. Traversal, absolute paths,
schemes, duplicate route-id aliases, and unresolved internal child references do
not become emitted files or clickable links.

---

## Performance gate

The projection perf gate is now live in CI. It measures
`parseAndProjectBusinessRuleSet`, `parseAndProjectSessionContext`,
`parseAndProjectScopeReadinessReport`, `parseAndProjectDocumentationBundle`,
`renderJson(bundle)`, `renderJson(bundle, { pretty: true })`, and `isBundle()`
against the committed baseline under `tests/perf/baselines/`.

For baseline refresh rules, see [PERF.md](./PERF.md).

## Table A: Codec to Projection Mapping

The following codecs were deleted in commit `58c0f85` ("Implement ddd projections
for doc generation") from `packages/architect-presentation/src/renderable/codecs/`.
Each row maps the original codec to its replacement projection and renderer.

| Original Codec             | Original Output                  | New Projection                                                                              | New Renderer                                                        |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `adr.ts`                   | ADR Markdown docs                | `governance/decision-records.ts` -> `projectDecisionCatalog`                                | `renderMarkdown` (DecisionCatalog + DecisionRecord)                 |
| `architecture.ts`          | Architecture diagram Markdown    | `documentation-composition/architecture-diagram.ts` -> `parseAndProjectArchitectureDiagram` | `renderMarkdown` (ArchitectureDiagram)                              |
| `business-rules.ts`        | Business rules Markdown          | `governance/business-rules.ts` -> `parseAndProjectBusinessRuleSet`                          | `renderMarkdown` (BusinessRuleSet)                                  |
| `codec-registry.ts`        | Registry of all codecs           | Eliminated; projections are imported directly                                               | N/A                                                                 |
| `composite.ts`             | Multi-codec document composition | Bundle routing in `renderMarkdown` / `renderJson` handles composition                       | N/A                                                                 |
| `convention-extractor.ts`  | Convention extraction doc        | `governance/taxonomy-digest.ts` -> `projectTaxonomyDigest`                                  | `renderMarkdown` (TaxonomyDigest)                                   |
| `decision-doc.ts`          | Decision document Markdown       | `governance/decision-records.ts` -> `projectDecisionRecord`                                 | `renderMarkdown` (DecisionRecord)                                   |
| `design-review.ts`         | Design review Markdown           | Deleted — lifecycle-management projection + fragment both removed in Action 5.              | N/A (not shipping in the current surface)                           |
| `diagram-utils.ts`         | Mermaid diagram helpers          | Inlined into `renderMarkdown` via `mermaid()` block builder                                 | N/A                                                                 |
| `helpers.ts`               | Shared codec helpers             | Split across renderers and `blocks/schema.ts` (paragraph, table, etc.)                      | N/A                                                                 |
| `index-codec.ts`           | Index/table-of-contents doc      | `documentation-composition/documentation-bundle.ts` -> `parseAndProjectDocumentationBundle` | `renderMarkdown` (domain `ProjectionBundle`, documentType=`index`)  |
| `index.ts`                 | Barrel re-exports                | `projections/index.ts` barrel                                                               | N/A                                                                 |
| `patterns.ts`              | Pattern catalog Markdown         | `pattern-relations/pattern-catalog.ts` -> `projectPatternCatalog`                           | `renderMarkdown` (PatternCatalog bundle, documentType=`patterns`)   |
| `planning.ts`              | Roadmap/planning Markdown        | `delivery-reporting/delivery-reporting-shared.internal.ts` -> `projectRoadmapTimeline`      | `renderMarkdown` (RoadmapTimeline)                                  |
| `pr-changes.ts`            | PR change review doc             | `documentation-composition/pr-change-review.ts` -> `parseAndProjectPrChangeReview`          | `renderMarkdown` (PrChangeReview)                                   |
| `product-area-metadata.ts` | Product area metadata doc        | `operational-insights/index.ts` -> `projectRequirementDigest`                               | `renderMarkdown` (RequirementDigest)                                |
| `reference-builders.ts`    | Reference doc section builders   | Absorbed into `renderMarkdown` normalizers                                                  | N/A                                                                 |
| `reference-diagrams.ts`    | Reference architecture diagrams  | `documentation-composition/architecture-diagram.ts` -> `parseAndProjectArchitectureDiagram` | `renderMarkdown` (ArchitectureDiagram)                              |
| `reference-types.ts`       | Shared reference types           | Fragment Zod schemas in `fragments/`                                                        | N/A                                                                 |
| `reference.ts`             | Reference documentation          | `documentation-composition/documentation-bundle.ts` -> `parseAndProjectDocumentationBundle` | `renderMarkdown` (domain `ProjectionBundle`)                        |
| `reporting.ts`             | Status/progress reporting        | `delivery-reporting/delivery-reporting-shared.internal.ts`                                  | `renderJson` (StatusDistribution), `renderMarkdown` (PhaseProgress) |
| `requirements.ts`          | Product requirements doc         | `operational-insights/index.ts` -> `projectRequirementDigest`                               | `renderMarkdown` (RequirementDigest)                                |
| `session.ts`               | Session context rendering        | `execution-context/session-context.ts` -> `parseAndProjectSessionContext`                   | `renderCompactText` (SessionContextBundle)                          |
| `shape-matcher.ts`         | Shape-matching utilities         | Replaced by Zod schema validation in `renderJson`                                           | N/A                                                                 |
| `shared-schema.ts`         | Shared schema definitions        | `fragments/base.ts` + per-fragment Zod schemas                                              | N/A                                                                 |
| `taxonomy.ts`              | Taxonomy reference doc           | `governance/taxonomy-digest.ts` -> `parseAndProjectTaxonomyDigest`                          | `renderMarkdown` (TaxonomyDigest)                                   |
| `timeline.ts`              | Timeline/roadmap Markdown        | `delivery-reporting/delivery-reporting-shared.internal.ts`                                  | `renderMarkdown` (RoadmapTimeline, ReleaseNotesDigest)              |
| `types/base.ts`            | Base codec types                 | `renderers/types.ts` (RenderMarkdown, RenderJson, etc.)                                     | N/A                                                                 |
| `types/index.ts`           | Type barrel                      | `renderers/types.ts`                                                                        | N/A                                                                 |
| `validation-rules.ts`      | Validation rules doc             | `governance/validation-rule-digest.ts` -> `projectValidationRuleDigest`                     | `renderMarkdown` (ValidationRuleDigest)                             |

---

## Table B: API Formatter to Projection Mapping

The following `format*()` functions were deleted from
`packages/architect-query/src/api/context-formatter.ts` (and peers) in commit
`58c0f85`. The `build*()` assembler functions in `context-assembler.ts` still
exist (they produce structured data) but their formatting counterparts have been
replaced by projection + renderer calls.

| Original Function       | Original File          | New Projection                                                  | New Renderer        |
| ----------------------- | ---------------------- | --------------------------------------------------------------- | ------------------- |
| `formatOverview`        | `context-formatter.ts` | `projectOverviewDigest` -> `OverviewDigest`                     | `renderCompactText` |
| `formatContextBundle`   | `context-formatter.ts` | `parseAndProjectSessionContext` -> `SessionContextBundle`       | `renderCompactText` |
| `formatDepTree`         | `context-formatter.ts` | `parseAndProjectDependencyTree` -> `DependencyTree`             | `renderCompactText` |
| `formatFileReadingList` | `context-formatter.ts` | `parseAndProjectFileReadingList` -> `FileReadingList`           | `renderCompactText` |
| `formatScopeValidation` | `scope-validator.ts`   | `parseAndProjectScopeReadinessReport` -> `ScopeReadinessReport` | `renderCompactText` |
| `formatHandoff`         | `handoff-generator.ts` | validated handoff projection -> `HandoffRecord`                 | `renderCompactText` |

---

## Table C: MCP Tool to Projection Mapping

Every tool registered in `packages/architect-mcp/src/tool-registry.ts`:

| Tool                          | Projection Function                                                                 | Renderer            | Notes                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ |
| `architect_overview`          | `projectOverviewDigest`                                                             | `renderCompactText` | No parameters                                                                                          |
| `architect_coverage`          | `projectAnnotationCoverage`                                                         | `renderJson`        | No parameters                                                                                          |
| `architect_context`           | `parseAndProjectSessionContext`                                                     | `renderCompactText` | `session` param filters by session type (planning/design/implement)                                    |
| `architect_files`             | `parseAndProjectFileReadingList`                                                    | `renderCompactText` | `includeRelated` now owns `related=false` stripping and stub-last neighbor order                       |
| `architect_dep_tree`          | `parseAndProjectDependencyTree`                                                     | `renderCompactText` | `maxDepth` defaults to 10                                                                              |
| `architect_scope_validate`    | `parseAndProjectScopeReadinessReport`                                               | `renderCompactText` | Session type required (design/implement); projection-owned `strict=true` promotes warnings to blockers |
| `architect_handoff`           | validated handoff projection                                                        | `renderCompactText` | Session type inferred from pattern status if omitted                                                   |
| `architect_status`            | `projectStatusDistribution`                                                         | `renderJson`        | No parameters                                                                                          |
| `architect_pattern`           | `projectPatternDetail`                                                              | `renderJson`        | Single pattern name required                                                                           |
| `architect_list`              | `parseAndProjectPatternCatalog`                                                     | `renderJson`        | Filters: status, phase, role; flags: namesOnly, count                                                  |
| `architect_search`            | `parseAndProjectPatternCatalog` + `fuzzyMatchPatterns` + inline `SectionedDocument` | `renderJson`        | Query string required                                                                                  |
| `architect_rules`             | `parseAndProjectBusinessRuleSet`                                                    | `renderJson`        | Optional pattern scope; `onlyInvariants` flag                                                          |
| `architect_arch_neighborhood` | `projectArchitectureNeighborhood`                                                   | `renderJson`        | Single pattern name required                                                                           |
| `architect_arch_blocking`     | `projectOverviewDigest` (reads `.blocking`) + inline `SectionedDocument`            | `renderJson`        | No parameters                                                                                          |
| `architect_rebuild`           | validated config projection (after rebuild)                                         | `renderCompactText` | Triggers session rebuild                                                                               |
| `architect_config`            | validated config projection                                                         | `renderJson`        | No parameters                                                                                          |
| `architect_documentation`     | `projectDocumentationBundle`                                                        | `renderJson`        | `documentType` required; text includes bundle `children` and logical `routing` metadata                |
| `architect_help`              | None (inline `SectionedDocument`)                                                   | `renderJson`        | Static help text                                                                                       |

---

## Residual ADR-006 leaks (now closed)

Action 1 closed the remaining projection-boundary leaks that were still reaching
into raw graph internals from consumer packages:

- `architect_list` now reads from `parseAndProjectPatternCatalog` instead of consumer-side
  `patterns` iteration/filtering.
- `architect_files` now pushes `includeRelated` behavior into
  `parseAndProjectFileReadingList`, including legacy stub-last neighbor ordering.
- `architect_scope_validate` now pushes `strict` severity promotion into
  `parseAndProjectScopeReadinessReport`.
- CLI `arch context`, `arch layer`, and `arch compare` now read projection-backed
  architecture fragments instead of `archIndex` / legacy query helpers.
- The root ESLint flat config now guards CLI/MCP/desktop source against raw
  `dataset.patterns`, `graph.patterns`, `graph.archIndex`, and
  `graph.relationshipIndex` access.

---

## Renderer Overview

### `renderCompactText`

Produces structured plain text with `=== SECTION ===` markers designed for AI
consumption. Each fragment kind has a dedicated render path
(OverviewDigest, SessionContextBundle, DependencyTree, FileReadingList,
ScopeReadinessReport, HandoffRecord). All other fragment kinds fall through to
a generic key-value renderer. The marker style is configurable via
`sectionSeparator` (default `===`). This is the primary renderer used by MCP
tools that return context to LLMs.

### `renderJson`

Serializes fragments to JSON after projecting them through JSON-safe structural
guards. Supports `pretty` mode (indented string output) and `stableKeyOrder`
(alphabetical keys, on by default). Bundle output includes optional `routing`
metadata with `childPathStrategy` and `anchorStrategy`. Used by MCP tools that
return structured data (status, pattern detail, rules, etc.).

### `renderMarkdown`

Generates GitHub-flavored Markdown for documentation output. Each fragment kind
has a dedicated normalizer that converts its data into a `MarkdownDocument`
(title + Block sections). Supports multi-file output via `Record<string, string>`
return when a bundle includes routed child fragments. Features include
`h2-boundary` splitting for oversized
documents, frontmatter generation (purpose/detail-level), and relative link
rewriting between parent/child documents. This is the renderer used by the
`architect documentation` CLI for generating project docs.

### `renderUi`

Produces `UiDocument` objects (kind + heading + sections of Block arrays) for
the Studio desktop app. Supports child-link resolution where internal paths in
`link-out` blocks are rewritten to slugified anchors matching bundle children.
Special handling exists for routed bundle children and `PatternDetail` (ordered
field layout: overview, deliverables, relationships, rules, stubs). Used by the
desktop app's `BlockRenderer` component tree.

---

## What Stayed and Why

The migration is complete. The `@libar-dev/architect-query` package was
fully dissolved in Action 2:

- `pattern-graph-api.ts`, `pattern-helpers.ts`, `architecture-inspection.ts`,
  `graph-inventory.ts`, `types.ts` moved to
  `packages/architect-core/src/read-api/`.
- `fuzzy-match.ts`, `session-helpers.ts` moved to
  `packages/architect-core/src/utils/`.
- `summarize.ts` and `api/stub-resolver.ts` deleted — the first was superseded
  by `PatternSummary`; the second was re-implemented inside
  `projections/execution-context/scope-readiness.internal.ts`.
- `arch-queries.ts` was already absorbed by Action 1 (see
  `projectArchitectureComparison`, `projectArchitectureContext`,
  `projectArchitectureLayer`).

The lifecycle-management subdomain (14 projections across briefs, ideas,
candidate pipelines, promotion gates, lifecycle boards, etc.) was deleted in
Action 5: zero consumers in CLI/MCP/desktop/docs-gen, five were `NOT_IMPLEMENTED`
stubs, and the rest shipped to no one. Re-introduce when the spec-lifecycle
work actually begins.
