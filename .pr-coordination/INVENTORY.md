# Capability inventory — what exists, what was dropped, what to build

> Cross-reference for `DEEP-DIVE.md`. Tables only. Treat this as a flat database.

## 1. Post-W1.5 codec / projection inventory (43 entries in `architect-projection`)

| # | Projection function | File | Output fragment | Wired into `docs:all`? | Reachable via CLI/MCP? |
|---|---|---|---|---|---|
| 1 | `projectArchitectureComparison` | `pattern-relations/architecture-comparison.ts` | `ArchitectureComparison` | ❌ | CLI: `arch compare` |
| 2 | `projectBoundedContext` | `pattern-relations/architecture-context.ts` | `BoundedContext` | ❌ | CLI: `arch bounded-context` |
| 3 | `projectArchitectureNeighborhood` | `pattern-relations/architecture-neighborhood.ts` | `ArchitectureNeighborhood` | ❌ | CLI + MCP |
| 4 | `projectDependencyEdges` | `pattern-relations/dependency-edges.ts` | `DependencyEdgeSet` | ❌ | ❌ |
| 5 | `projectDependencyTree` | `pattern-relations/dependency-tree.ts` | `DependencyTree` | ❌ | CLI: `dep-tree` + MCP |
| 6 | `projectPatternBundle` | `pattern-relations/bundle.ts` | `ProjectionBundle<PatternBundleEntry>` | ❌ | CLI + MCP |
| 7 | `projectOpenQuestionList` | `pattern-relations/open-question-list.ts` | `OpenQuestionList` | ❌ | CLI + MCP |
| 8 | `projectOrphanPatternList` | `pattern-relations/orphan-pattern-list.ts` | `OrphanPatternList` | ❌ | CLI: `arch orphans` |
| 9 | `projectPatternCatalog` | `pattern-relations/pattern-catalog.ts` | `ProjectionBundle<PatternCatalog>` | ✅ (`patterns` gen) | CLI + MCP |
| 10 | `projectPatternDetail` | `pattern-relations/pattern-detail.ts` | `PatternDetail` | ❌ | CLI + MCP |
| 11 | `projectPatternSummary` | `pattern-relations/pattern-summary.ts` | `PatternSummary` | ❌ | ❌ |
| 12 | `projectPhaseProgress` | `delivery-reporting/index.ts` | `PhaseProgress` | ❌ | CLI only |
| 13 | `projectStatusDistribution` | `delivery-reporting/index.ts` | `StatusDistribution` | ❌ | CLI + MCP |
| 14 | `projectRoadmapTimeline` | `delivery-reporting/index.ts` | `ProjectionBundle<RoadmapTimeline>` | ✅ (`roadmap`) | ❌ |
| 15 | `projectCompletedMilestones` | `delivery-reporting/index.ts` | `ProjectionBundle<RoadmapTimeline>` | ❌ | ❌ |
| 16 | `projectCurrentWork` | `delivery-reporting/index.ts` | `ProjectionBundle<RoadmapTimeline>` | ✅ (`current-work`) | ❌ |
| 17 | `projectReleaseNotesDigest` | `delivery-reporting/index.ts` | `ReleaseNotesDigest` | ✅ (`changelog`) | ❌ |
| 18 | `projectTraceabilityMatrix` | `delivery-reporting/index.ts` | `TraceabilityMatrix` | ✅ (`traceability`) | ❌ |
| 19 | `projectBusinessRule` | `governance/business-rules.ts` | `BusinessRule` | ❌ | ❌ |
| 20 | `projectBusinessRuleSet` | `governance/business-rules.ts` | `BusinessRuleSet` | ✅ (`business-rules`) | CLI + MCP |
| 21 | `projectDecisionCatalog` | `governance/decision-records.ts` | `DecisionCatalog` | ✅ (`decisions`) | via `documentation` |
| 22 | `projectDecisionRecord` | `governance/decision-records.ts` | `DecisionRecord` | ❌ | ❌ |
| 23 | `projectTaxonomyDigest` | `governance/taxonomy-digest.ts` | `TaxonomyDigest` | ✅ (`taxonomy`) | CLI + MCP |
| 24 | `projectValidationRuleDigest` | `governance/validation-rule-digest.ts` | `ValidationRuleDigest` | ✅ (`validation-rules`) | ❌ |
| 25 | `projectDeliverable` | `execution-context/deliverables.ts` | `Deliverable` | ❌ | MCP only |
| 26 | `projectDeliverableManifest` | `execution-context/deliverables.ts` | `DeliverableManifest` | ❌ | MCP only |
| 27 | `projectFileReadingList` | `execution-context/file-reading-list.ts` | `FileReadingList` | ❌ | CLI + MCP |
| 28 | `projectHandoffRecord` | `execution-context/handoff.ts` | `HandoffRecord` | ❌ | CLI + MCP |
| 29 | `projectScopeReadinessReport` | `execution-context/scope-readiness.ts` | `ScopeReadinessReport` | ❌ | CLI + MCP |
| 30 | `projectSessionContextBundle` | `execution-context/session-context.ts` | `SessionContextBundle` | ❌ | CLI + MCP |
| 31 | `projectAnnotationCoverage` | `operational-insights/index.ts` | `AnnotationCoverage` | ❌ | CLI + MCP |
| 32 | `projectOverviewDigest` | `operational-insights/index.ts` | `OverviewDigest` | ❌ | CLI + MCP |
| 33 | `projectRequirementDigest` | `operational-insights/index.ts` | `RequirementDigest` | ❌ | embedded |
| 34 | `projectRequirementExecutableDigest` | `operational-insights/index.ts` | `ProjectionBundle<RequirementDigest>` | ✅ (`requirements-executable`) | ❌ |
| 35 | `projectRequirementSpecsDigest` | `operational-insights/index.ts` | `ProjectionBundle<RequirementDigest>` | ✅ (`requirements-specs`) | ❌ |
| 36 | `projectRoleProfile` | `operational-insights/index.ts` | `RoleProfile` | ❌ | ❌ |
| 37 | `projectRoleProfiles` | `operational-insights/index.ts` | `RoleProfileCollection` | ❌ | ❌ |
| 38 | `projectSourceInventoryDigest` | `operational-insights/index.ts` | `SourceInventoryDigest` | ❌ | CLI only |
| 39 | `projectTagUsage` | `operational-insights/index.ts` | `ProjectionBundle<TagUsageMatrix>` | ❌ | CLI only |
| 40 | `parseAndProjectArchitectureDiagram` | `documentation-composition/architecture-diagram.internal.ts` | `ArchitectureDiagram` | ✅ (`architecture`, scope=component only) | ❌ |
| 41 | `projectConfig` | `documentation-composition/project-config.ts` | `ProjectConfigSnapshot` | ❌ | MCP only |
| 42 | `projectDocumentationBundle` | `documentation-composition/documentation-bundle.ts` | (dispatcher) | ✅ (bin entry point) | CLI + MCP |
| 43 | `projectPrChangeReview` | `documentation-composition/pr-change-review.ts` | `PrChangeReview` | ❌ | CLI + MCP |

**Wired summary:**
- 12 reachable via `architect-generate` (8 actually invoked in last `docs:all`)
- 16 CLI-only (no `architect-generate` consumer)
- 14 MCP-only or CLI+MCP (no `architect-generate` consumer)
- 11 unreachable from any user-facing surface

## 2. Dropped during W1 lift — required for doc generation restoration

| Symbol / file | Where it lived | Naturally relocates to |
|---|---|---|
| `loadPreambleFromMarkdown(path)` | `src/renderable/load-preamble.ts` | `architect-core/src/utils/load-preamble.ts` (next to `markdown-parser.ts`) |
| `createReferenceCodec(config)` | `src/renderable/codecs/reference.ts` | `architect-projection/src/projections/documentation-composition/reference.ts` |
| `createProductAreaConfigs()` | `src/generators/built-in/reference-generators.ts` | `architect-projection/src/projections/documentation-composition/product-area.ts` |
| `composite.ts` (CompositeCodec) | `src/renderable/codecs/` | replaced by new `DocDefinition.build()` composition (PROPOSED-DESIGN) |
| `convention-extractor.ts` (behaviorCategories) | `src/renderable/codecs/` | becomes `extractBehaviors({ tag })` extractor |
| `shape-matcher.ts` (shapeSelectors resolver) | `src/renderable/codecs/` | becomes `extractTypeShapes({ group, package })` extractor |
| `reference-diagrams.ts` (5 diagram-type generators) | `src/renderable/codecs/` | each diagram type as standalone extractor: `extractMermaid{Sequence,Class,State,C4Context,Graph}Diagram` |
| `reference-builders.ts` (section builders) | `src/renderable/codecs/` | absorbed into `composeDoc()` helpers |
| `reference-types.ts` (shared reference types) | `src/renderable/codecs/` | absorbed into Fragment Zod schemas |
| `claude-module.ts` (dual-target generator) | `src/renderable/codecs/` | becomes `DocDefinition.targets[]` array |
| `index-codec.ts` (rich INDEX codec with `documentEntries`) | `src/renderable/codecs/` | becomes `extractDocumentEntries()` + curated `DocDefinition` |
| `session.ts` (session-workflow rendering) | `src/renderable/codecs/` | covered by `extractBehaviors({ tag: 'session-workflows' })` + preamble |
| `pr-changes.ts` (PR diff doc) | `src/renderable/codecs/` | already exists as `projectPrChangeReview` in post-W1.5 — just needs surfacing |
| `product-area-metadata.ts` (product-area pages) | `src/renderable/codecs/` | extend `projectRequirementDigest` (already exists) + product-area `DocDefinition` |
| `cli-recipe-generator.ts` | `src/generators/built-in/` | new extractor `extractCliCommands()` + recipe `DocDefinition` |
| `cli-reference-generator.ts` | `src/generators/built-in/` | new extractor `extractCliCommands()` + reference `DocDefinition` |
| `decision-doc-generator.ts` | `src/generators/built-in/` | use existing `projectDecisionRecord` (per-ADR) + `DocDefinition` per record |
| `design-review-generator.ts` | `src/generators/built-in/` | NOTE: deleted per MIGRATION.md (Action 5). Re-introduce only when spec-lifecycle work resumes. |

## 3. Pre-refactor `architect.config.ts` — what it proved

Source: `/Users/darkomijic/dev-projects/delivery-process/architect.config.ts`

- **9 `referenceDocConfigs` entries** producing the 11 docs at `delivery-process/docs-live/reference/` (4,430 lines total).
- **7 markdown preambles loaded** via `loadPreambleFromMarkdown('docs-sources/<file>.md')`. These are the editorial wrappers around generated content.
- **`codecOptions.index.documentEntries`** with 26 entries — curated INDEX navigation grouped by Topic (Overview / Governance / Reference Guides / Product Area Details).
- **`generatorOverrides`** for 15 generators, routing output to `docs-live/`, `_claude-md/`, `architect/`, etc.
- **`diagramScopes`** using all 5 Mermaid types (`graph TB/LR`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `C4Context`), proving each had a working generator.
- **`shapeSelectors: [{ group: 'pattern-graph' }, { group: 'reference-sample' }]`** — proving the shape-group registry resolver worked. The enum still exists at `architect-core/src/config/presentation-contracts.ts:3-7`; the resolver was dropped.
- **`claudeMdSection` + `claudeMdFilename`** on each entry — the dual-target output (website + agent context) from one source.

## 3b. Surviving progressive-disclosure substrate (initially missed)

The post-W1.5 `architect-projection` package already ships first-class progressive-disclosure support. Discovered after the user pointed at `tests/fixtures/renderers/progressive-disclosure.md` + `tests/features/renderers/contract.feature.steps.ts`. The OUTPUT-side machinery is in place; the new ContentFragments work plugs INPUT-side disclosure into it.

| Component | Location | Purpose |
|---|---|---|
| `RenderMarkdownOptions.disclosureLevel` | `renderers/types.ts` | `'essential' \| 'important' \| 'useful' \| 'advanced'` — controls which bundle children inline vs split |
| `RenderMarkdownOptions.disclosureSpec` | `renderers/types.ts` | `DisclosureSpec` for fine-grained per-section control |
| `DisclosureSpec` type | `projections/documentation-composition/disclosure-spec.ts` | Detail-level descriptor used by both input and output disclosure |
| `ProjectionBundle.children` + `routing` | `fragments/base.ts` | Fan-out mechanism for per-disclosure-level child documents |
| `BundleRouting` with `rootRouteId` / `childRouteIds` / `childPathStrategy` / `anchorStrategy` | `fragments/base.ts` | Stable logical route IDs decouple bundle structure from file paths/anchors |
| `LogicalRouteId` | `projections/documentation-composition/progressive-disclosure.js` | Format: `<docType>:index`, `<docType>:<entityId>`, `<docType>:<entityId>:<childKind>:<childId>` |
| `defaultMarkdownRouteProfile.mapPath()` | `renderers/markdown-paths.ts` | Renderer-side route-id → file-path resolver |
| `splitOversizedDocument` (via `sizeBudget` + `splitStrategy: 'h2-boundary' \| 'never'`) | `renderers/render-markdown.ts` | Markdown-only auto-pagination |
| Renderer-contract enforcement | `tests/features/renderers/contract.feature.steps.ts:244` | Type signatures enforced via `expectTypeOf` |

**The contract decisions** documented in `tests/fixtures/renderers/progressive-disclosure.md`:
1. View splitting stays at projection layer (no runtime `view` switching in one projector).
2. `splitOversizedDocument` is markdown-only; compact-text / JSON / UI never split.
3. Legacy `additionalFiles` flattens via `ProjectionBundle.children` + `routing`.

**Implication for ContentFragments:** the new INPUT-side disclosure (what depth of content does a fragment emit?) plugs into the existing OUTPUT-side disclosure (how does the renderer fan out the resulting bundle?) without any infrastructure rework. Both use the same `'essential' | 'important' | 'useful' | 'advanced'` vocabulary. See DEEP-DIVE § Q3 and PROPOSED-DESIGN § 3b.

## 4. Surviving schemas — the foundation

Source: `packages/architect-core/src/config/presentation-contracts.ts`

| Schema / type | Lines | Status |
|---|---|---|
| `ReferenceDocConfig` (11 fields) | 33-49 | Declared, no consumer reads it |
| `IndexCodecOptionsContract` (8 fields) | 55-66 | Declared, only `documentEntries` would be consumed; rest are dead surface |
| `DiagramScope` (with diagram-type enum) | 18-30 | Declared, only `graph` and `stateDiagram-v2` have implementations |
| `SHAPE_GROUP_VALUES` enum (`fsm-lifecycle`, `generation-pipeline`, `pattern-graph-views`, `reference-sample`) | 3-7 | Declared, no resolver consumes group references |
| `ProgressiveDisclosurePolicySchema` (`essential` / `important` / `useful` / `advanced`) | exported from `projection/projections/index.ts` | Used by bundle codecs |

## 5. Query surface (CLI / MCP / API)

**CLI subcommands:** 24 commands across 5 modules (reporting, planning, read, meta, lifecycle).

**MCP tools:** 21 registered in `architect-mcp/src/tool-metadata.ts` (REMAINING-WORK.md says 18 — out of date).

**PatternGraphAPI methods:** 31 on the interface (`packages/architect-core/src/read-api/pattern-graph-api.ts`).

**Asymmetries:**
- 12 CLI commands have no MCP equivalent: `query` (whitelisted), `arch roles`, `arch bounded-context`, `arch compare`, `arch coverage`, `arch dangling`, `arch orphans`, `sources`, `tags`, `diagnostics`, `repl`, `version`.
- 2 MCP tools have no CLI mirror: `architect_rebuild`, `architect_config`.

**Missing query endpoints (high-leverage):**
1. `architect fsm-transitions [from]` — wraps `getValidTransitionsFrom` + `getProtectionInfo` (data exists)
2. `architect annotations [tag]` — projects `tagRegistry` field (data exists, projection missing)
3. `architect role <tag>` — wraps `projectRoleProfile` (projection exists, no surface)
4. `architect config` (CLI mirror of MCP tool)
5. `architect validation-rules` — wraps `projectValidationRuleDigest` (projection exists, no surface)
6. `architect tags` (MCP equivalent) — wraps `projectTagUsage`
7. `architect arch {bounded-context, compare, orphans, dangling, sources}` (MCP equivalents)
8. `architect rules --package`, `--feature` filters (MCP parity with CLI)
9. `architect value-transfer <pattern>` — new predicate query (the 5-condition gate from `_shared/value-transfer.md`)

## 6. Doc tree audit summary

Total: **10,652 lines across 41 files.**

| Tree | Lines | Reachable via generation today or with light wiring |
|---|---|---|
| `.agents/skills/_shared/` (9 files) | 1,048 | ~40% (most needs new carriers: `tier-registry`, ownership field, doctrine annotation) |
| `docs/` (15 files) | 5,463 | ~75% (45% generated/generatable + 30% delete-on-contact dead weight) |
| `formal-spec/` (15 files + README) | 4,141 | ~28% (the spec/impl overlap zone — high drift risk) |

**Delete-on-contact in `docs/`** (~1,320 lines): `DOCS-GAP-ANALYSIS.md`, `CROSS-INSTANCE-CONVENTIONS.md`, `PR-NOTE-TAXONOMY-CAMPAIGN.md`, deprecated `INDEX.md`, deprecated `TAXONOMY.md`.

**High drift surfaces in `formal-spec/`** (the user explicitly flagged this concern):
| Overlap | Sources | Fix |
|---|---|---|
| Tag registry | `formal-spec/04` ↔ `taxonomy/registry-builder.ts` ↔ `docs-live/TAXONOMY.md` ↔ `_shared/annotation-ownership.md` | Generated-insert directive into `formal-spec/04` + `_shared/annotation-ownership.md` |
| FSM lifecycle | `formal-spec/09` ↔ `validation/fsm/transitions.ts` ↔ `_shared/fsm-transitions.md` ↔ `docs/PROCESS-GUARD.md` | Generated-insert directive into all four locations |
| Project config schema | `formal-spec/11` field table ↔ `project-config-schema.ts` Zod ↔ `docs/CONFIGURATION.md` | Generated-insert directive sourced from Zod schema |

## 7. Pre-refactor reference docs — target output corpus

Located at `/Users/darkomijic/dev-projects/delivery-process/docs-live/reference/`. Use these as the "this is what good looks like" test corpus.

| File | Lines | Notable content shapes |
|---|---|---|
| `ANNOTATION-REFERENCE.md` | 232 | Annotation mechanics + tag tables |
| `ARCHITECTURE-CODECS.md` | 675 | Codec catalog with shape extractions |
| `ARCHITECTURE-TYPES.md` | 439 | Type catalog with diagrams |
| `CLI-RECIPES.md` | 476 | Workflow recipes (preamble-heavy) |
| `CLI-REFERENCE.md` | 63 | Mechanical command catalog from CLI schema |
| `CONFIGURATION-GUIDE.md` | 235 | Config schema + presets |
| `GHERKIN-AUTHORING-GUIDE.md` | 270 | Gherkin patterns |
| `PROCESS-GUARD-REFERENCE.md` | 258 | FSM + error catalog |
| `REFERENCE-SAMPLE.md` | 1,135 | Kitchen-sink demo: all 5 diagram types + shape extraction + behavior specs + ADR rendering |
| `SESSION-WORKFLOW-GUIDE.md` | 384 | Session lifecycle |
| `VALIDATION-TOOLS-GUIDE.md` | 263 | Lint commands |

Total: 4,430 lines of proof that the codec system could do all of this.
