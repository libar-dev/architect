# architect-core — Package PRD

> Boundary contract for `@libar-dev/architect-core`. Recorded from the **code's real public surface** (`src/index.ts`, `package.json` exports, barrels, key contracts) — not from `@architect-*` annotations, which are known low-quality in this instance and disposable.

## Purpose

`architect-core` is the **canonical runtime read model** and the only acyclic-root package in the family (it depends on no intra-repo package; every other package depends on it). It owns the full **scan → parse → extract → validate → merge → transform** pipeline that turns annotated TypeScript and executable Gherkin into the `PatternGraph`, plus the Zod-first contracts, the FSM transition rules, the tag/status taxonomy, config loading/resolution, and the read API (`createPatternGraphAPI()`) that every consumer queries. If a value domain or graph shape crosses a package boundary, its source of truth lives here.

## Public interface

The boundary surface is wide (root `index.ts` re-exports ~12 sub-barrels). Grouped by responsibility:

- **Read API (the headline contract)** — `createPatternGraphAPI()` → `PatternGraphAPI` (status/phase/role/quarter queries, dependency & relationship lookups, deliverables, FSM transition checks, `getPatternGraph()`); `QueryResult<T>` / `QuerySuccess` / `QueryError` envelope + `createSuccess` / `createError` / `QueryApiError`; pattern helpers (`findPatternByName`, `getRelationships`, `suggestPattern`, `resolveCanonicalRole`, …); inspection (`computeNeighborhood`, `compareContexts`); inventory (`aggregateTagUsage`, `buildSourceInventory`, `findOrphanPatterns`).
- **Read model contracts (Zod)** — `PatternGraphSchema` / `PatternGraph`, `ExtractedPatternSchema` / `ExtractedPattern` (the canonical per-pattern record), `StatusCounts`, `PhaseGroup`, `RelationshipEntry`, `ImplementationRef`, plus the whole `validation-schemas/` family (feature/Gherkin, dual-source, lint, output-schemas, tag-registry, codec-utils).
- **Graph-build pipeline** — `buildPatternGraph()` (single graph-construction entrypoint), `transformToPatternGraph[WithValidation]`, `mergePatterns`; `BuildResult` / `TransformResult` / `RawDataset` / `RuntimePatternGraph` / `PipelineOptions` / `DanglingReference`.
- **Scanner / extractor** — `scanPatterns`, `parseFileDirectives`, `parseFeatureFile`, `scanGherkinFiles`; `extractPatterns`, `extractPatternsFromGherkin`, extraction diagnostics.
- **FSM** — `validateTransition`, `isValidTransition`, `getValidTransitionsFrom`, `getProtectionSummary`, `VALID_TRANSITIONS`, `PROCESS_STATUS_VALUES`.
- **Taxonomy & domain enums** — status/maturity/deliverable/risk/hierarchy/format value sets and guards (`isPatternComplete`, `normalizeStatus`, `inferMaturity`, …); `domain-enums.ts` Zod enums shared by CLI/MCP/projection/guard.
- **Config** (`.` and the `./config` subpath export) — `createArchitect`, `defineConfig`, `loadConfig` / `loadProjectConfig`, `resolveProjectConfig`, workflow loader, self-hosting/workspace sources, `ArchitectProjectConfigSchema`.
- **Package resolution** — `createPackageResolver` / `PackageResolver`, `PackageConfigSchema`, `ProjectionError`.
- **Branded types, Result, errors, utils** — `asPatternId` etc., `Result`, typed error constructors, `fuzzyMatchPatterns`, `groupBy`, string/id/markdown helpers.

`package.json` exports: `.` (full barrel) and `./config`. No bin (library only). External runtime deps are deliberately concentrated here.

## Enumerated functionality

- Discover and scan opted-in TS source + `.feature` files for `@architect-*` directives.
- Parse TS annotations (typescript-estree) and Gherkin ASTs (`@cucumber/gherkin`) into validated records.
- Extract patterns, deliverables, process metadata, and shapes from both sources.
- Merge dual-source records and resolve relationships / cross-package edges / dangling references.
- Transform into the immutable `PatternGraph` read model (status groups, phase groups, relationship index, pre-computed views).
- Serve deterministic structured queries over the graph via `PatternGraphAPI`.
- Enforce the FSM lifecycle: legal status transitions + protection levels.
- Define the canonical tag/status/role/maturity taxonomy and the Zod schemas for every cross-package contract.
- Load, validate, resolve, and merge project + workflow config.
- Resolve source files to owning packages.

## Dependencies

- **Intra-repo:** none. This is the acyclic root.
- **External (runtime):** `zod` (every contract), `@cucumber/gherkin` + `@cucumber/messages` (feature parsing), `@typescript-eslint/typescript-estree` (annotation parsing), `glob` (source discovery). Concentrated here by deliberate decision (`core-deps`) so higher packages share one pipeline.

## Consumers

Direction is one-way (everything points at core):

- `architect-projection` — graph in, fragments/views out.
- `architect-guard` — FSM + lint contracts.
- `architect-cli` — read API, config, fuzzy match, package resolver.
- `architect-mcp` — read API, pipeline session, package resolver.
- `architect` (meta) — transitive.
- Dogfood scripts / Studio surfaces — via the above.

## Load-bearing vs incidental (cut-list)

### Load-bearing (core to the single responsibility)

- `src/read-api/pattern-graph-api.ts` + `read-api/index.ts` — the headline query contract every consumer uses.
- `src/validation-schemas/pattern-graph.ts` + `extracted-pattern.ts` — the read model and its record contract (ADR-006).
- `src/generators/pipeline/` (`build-pipeline`, `transform-dataset`, `merge-patterns`, `relationship-resolver`) — the one graph-construction path.
- `src/scanner/` + `src/extractor/` (doc + gherkin) — the ingestion front end.
- `src/validation/fsm/` — transition legality, the single source for the lifecycle gate.
- `src/taxonomy/` + `src/domain-enums.ts` — shared value domains; collapsing these would scatter source-of-truth across packages.
- `src/config/` (loader/resolve/workflow/self-hosting) + `src/package/` — config + package resolution, used by CLI/MCP/projection.
- `src/types/` (branded, Result, errors) + core `utils/` (fuzzy-match, groupBy, id/string helpers) — confirmed external consumers.

### Incidental / deletion-candidate (be aggressive here)

- **`src/config/presentation-contracts.ts`** — *highest-confidence cut.* Exports `DiagramScope` / `ReferenceDocConfig` / `IndexCodecOptionsContract` / `CodecOptions` / `ShapeSelector` / `DocumentEntry`. **Zero consumers** in any other package's `src/` and zero internal use beyond importing `SectionBlock`. `architect-projection` defines its own `ArchitectureDiagramScopeSchema` locally instead of using these. This is presentation concern stranded in the read-model root — delete outright.
- **`src/config/section-block.ts` + `src/utils/markdown-parser.ts` (240 LOC) + `src/utils/parse-markdown-table-rows.ts`** — dead cluster. `SectionBlock`'s only importer is the dead `presentation-contracts`; `parseMarkdownToBlocks` / `parseMarkdownTableRows` have **no consumers** in any package `src/`. Remove with presentation-contracts.
- **`src/read-api/pattern-classification.ts`** — thin re-export wrapper (`classifyEdgeExternality`, plus `buildDeclaredPatternIndex` / `inferPackageId` / `resolveUsesTarget` re-aliased verbatim from `generators/pipeline/relationship-resolver.ts`). Duplicate surface for the same machinery; no `src` consumer of these names outside core. Fold the one genuinely-new helper into the pipeline module and drop the wrapper, or stop re-exporting from the read-api barrel.
- **`src/extractor/dual-source-extractor.ts` public exports** — `extractProcessMetadata` / `combineSources` / `validateDualSource` / `DualSourceResults` are re-exported from the root barrel but have **no external `src` consumer**; only `extractDeliverables` is used (internally, by `gherkin-extractor.ts`). Demote the module to internal and stop exporting the dual-source surface.
- **`src/extractor/shape-extractor.ts` (693 LOC) exports** — `extractShapes` / `discoverTaggedShapes` have no external `src` consumer (projection reads `ExtractedPattern['extractedShapes']` off the graph, not these functions). If shapes are populated inside the pipeline, keep the impl internal and drop it from the public barrel.
- **Over-broad root barrel** — `src/index.ts` re-exports ~200 symbols including large blocks of taxonomy format/group-by constants (`ADR_LIST_GROUP_BY`, `TIMELINE_GROUP_BY`, `PR_CHANGES_SORT_BY`, …) that read as projection/CLI render options leaking through core. Audit and trim; a narrower boundary makes the remaining cuts safe.

## Size signal

- **~106 `.ts` files, ~12,500 LOC** in `src/` (excluding tests/dist).
- Largest areas by LOC: `extractor/` (~2.2k), `validation-schemas/` (~1.8k), `scanner/` (~1.7k), `config/` (~1.4k), `read-api/` (~1.2k), `generators/pipeline/` (~1.1k).
- **36 distinct `@architect-pattern` names** across 31 annotated files (annotation-derived, treat as approximate).
- Root barrel re-exports **~200 symbols** across 12 sub-barrels + 2 `package.json` export entries (`.`, `./config`).
