## Session Notes

## 2026-05-18 — Cluster 4 seam map
- `ProjectionContextSchema` is already strict and readonly at `packages/architect-projection/src/context/projection-context.ts:83-92`; the shared parse-at-boundary wrapper lives at `packages/architect-projection/src/projections/_shared/parse-and-project.internal.ts:22-36`.
- The current projection entrypoint owners are split across `packages/architect-projection/src/projections/pattern-relations/index.ts:6-30`, `execution-context/index.ts:5-16`, `governance/index.ts:4-19`, and `documentation-composition/index.ts:4-37`; the top-level public barrel still re-exports raw `project*` functions at `packages/architect-projection/src/projections/index.ts:9-93`.
- The open-question-list outlier still parses raw options directly in `packages/architect-projection/src/projections/pattern-relations/open-question-list.ts:27-39`.
- Renderer disclosure ownership is still split: the public options schema exposes `disclosureSpec` in `packages/architect-projection/src/renderers/types.ts:43-69`, and `render-markdown.ts:444-453,512-565` still lets per-call disclosure override bundle routing.
- Documentation registry replacement work is not yet landed; `packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts:63-67` still only contains the `DocDefinition.build(graph)` deletion note, and no implementation exists in-tree.
- `summarizeTaxonomyDigest` is still exported from both `packages/architect-projection/src/fragments/governance/taxonomy-digest.ts:33-45` and `packages/architect-projection/src/projections/governance/taxonomy-digest.ts:45-70`.
- The projection and CLI source trees were clean under LSP diagnostics when checked (`packages/architect-projection/src`, `packages/architect-cli/src`, and `packages/architect-projection/tests` all reported 0 errors).

## 2026-05-18T07:05:03.633Z Task: plan-risk-review
- Oracle review: main orchestration risk is oversized Cluster 1 and Cluster 4; treat cluster boundaries as hard stop/replan gates rather than stretching scope.
- Run targeted graph/doc checks inside any cluster that edits Architect State (`architect/specs`, `architect/decisions`, docs sources, or dangling baselines), not only in Cluster 7.
- Use QA scenarios as a minimum evidence floor; acceptance criteria and repo doctrine still control whether a cluster is actually complete.


## 2026-05-18 — Contract-tightening research
- `z.strictObject()` rejects unknown keys; plain `z.object()` strips them by default, so trust boundaries should opt into strictness instead of relying on implicit stripping.
- Zod 4 treats `z.function()` as a runtime function factory, not a serializable schema; for config/registry contracts, prefer string/enum IDs and resolve the callable outside the schema.
- For public boundaries, `safeParse()` plus sanitized error handling is the recommended shape; Zod also keeps `reportInput` off by default to reduce accidental sensitive-data logging.


## 2026-05-18 — Cluster 1 mapping
- Core FSM status values still flow from `packages/architect-core/src/taxonomy/status-values.ts` → `validation/fsm/states.ts` → `validation/fsm/index.ts` → `src/index.ts`; the explicit public bridge is the one-line export in `states.ts:41`.
- `StatusValueSchema` is only a projection alias (`AcceptedStatusSchema`) in `packages/architect-projection/src/projections/_shared/filter.ts` and is re-exported by the projection barrels.
- The current `PatternGraphSchema` owner is `packages/architect-core/src/validation-schemas/pattern-graph.ts`; it is still open (`z.object`) and is consumed by extractor, pipeline, read-api, and CLI runtime entrypoints.
- Projection entrypoints already route through `parseAndProject` and the shared `ProjectionContext` type; renderer entrypoints already consume `RenderMarkdownOptions`, `RenderJsonOptions`, `RenderCompactOptions`, and `RenderUiOptions` from `renderers/types.ts`.


## 2026-05-18 — Cluster 1 mapping
- `PatternGraphSchema` is owned in `packages/architect-core/src/validation-schemas/pattern-graph.ts`; the current schema is open (`z.object`), and the public chain is `validation-schemas/index.ts` → `src/index.ts` → CLI/runtime consumers.
- `StatusValueSchema` is only a projection alias of `AcceptedStatusSchema` in `packages/architect-projection/src/projections/_shared/filter.ts`, then re-exported by `projections/index.ts` and `src/index.ts`.
- `ProjectionContext` and the renderer option interfaces are type-only today; their current ownership points are `packages/architect-projection/src/context/projection-context.ts` and `packages/architect-projection/src/renderers/types.ts`.

- Cluster 1 already has a workspace-audit substrate: projection’s `options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs`, guard’s `packed-dangling-baseline-smoke.mjs`, and root `guard:no-suppressions` / `validate:all` / `docs:all` hooks.
- No committed `.github/workflows/` exists in this worktree, so current host points are package scripts; the intended CI hooks called out by the mandate are `ci.yml` and `publish.yml`.
- `PDR-005` is still phantom in 11 product/doc locations (guard source, core taxonomy text, docs, docs-sources); the plan/mandate mentions are context only, not deletion targets.


## 2026-05-18 — Cluster 1 implementation
- The stale `EnforcementConfiguration` / `PerspectiveAwareProjections` cluster can be removed cleanly by deleting the design/spec/stub artifacts together and trimming only the live Architect-State references (`ADR-001`, `ADR-007`, `McpOutputSchemaValidation`, `ModelEnrichedDataAPI`); no dangling baseline update was needed once those references were rewritten.
- `packages/architect-cli` can be normalized to a bin-only package by removing the dead `src/index.ts` JS API surface and dropping the root `.` export trio from `package.json`; the bins and tests continue to run through the explicit `./bin/*` entries.
- The workspace subtractive audit is safe as a non-strict root script plus CI step: it reports all seven required rule families from the repo root, while `pnpm build && pnpm lint && pnpm typecheck && pnpm test` and `pnpm docs:all` stay green.


## 2026-05-18 — Cluster 1 blocker locations research
- FSM core barrel exists at `packages/architect-core/src/validation/fsm/index.ts:1-28`; root core export also forwards it at `packages/architect-core/src/index.ts:204`.
- `StatusValueSchema` source/re-export chain is `packages/architect-core/src/domain-enums.ts:25-28` → `packages/architect-core/src/validation/fsm/states.ts:41-42` → `packages/architect-core/src/validation/fsm/index.ts:1-9` → `packages/architect-core/src/index.ts:204-245`.
- `StatusValueSchema` also has the projection alias/re-export at `packages/architect-projection/src/projections/_shared/filter.ts:5-13`, surfaced again by `packages/architect-projection/src/projections/index.ts:1-8` and `packages/architect-projection/src/index.ts:16-23`.
- `ExtractedPatternDraftSchema` already exists in `packages/architect-core/src/validation-schemas/extracted-pattern.ts:126-134` and is barrel-exported from `packages/architect-core/src/validation-schemas/index.ts:24-34`.
- `PatternGraphSchema` already exists as a strict schema in `packages/architect-core/src/validation-schemas/pattern-graph.ts:116-135` and is barrel-exported from `packages/architect-core/src/validation-schemas/index.ts:150-163`.
- `ProjectionContextSchema` already exists in `packages/architect-projection/src/context/projection-context.ts:74-92` and is public via `packages/architect-projection/src/index.ts:23-29`.
- `RendererOptionsSchema` already exists in `packages/architect-projection/src/renderers/types.ts:107-112` and is public via `packages/architect-projection/src/renderers/index.ts:13-19`.


## 2026-05-18 — Cluster 1 CI substrate research
- `actions/setup-node` officially supports `cache: 'pnpm'` plus `cache-dependency-path` for monorepo/subdirectory lockfiles, and it does **not** cache `node_modules`.
- pnpm CI guidance says installs switch to frozen-lockfile mode automatically in CI; workspace installs cover all projects, and `pnpm audit --prod` plus `auditConfig.ignoreGhsas` are the current audit knobs.
- `pnpm/action-setup` supports `cache: true`, multi-lockfile `cache_dependency_path`, and recursive install examples for workspace-style repos.
- Strong public examples: `sveltejs/kit` uses setup-node pnpm caching + `pnpm install --frozen-lockfile` + `pnpm audit --prod`; `remix-run/remix` uses setup-node pnpm caching + `pnpm install --frozen-lockfile` on PRs.


## 2026-05-18 — Cluster 1 stale-reference cleanup
- Current-tree verification showed the Cluster 1 kernel substrate was already present: root `audit:subtractive`, both GitHub workflows, the FSM/`StatusValueSchema` bridges, removal of `./roles`, and deletion of `packages/architect-core/src/config/cli-schema.ts` plus `packages/architect-cli/src/index.ts`.
- `pnpm audit:subtractive` already runs from the workspace root and emits all seven required rule families; Cluster 1 work only needed to preserve that scaffold, not reinvent it.
- The remaining live Cluster 1 residue was stale `PerspectiveAwareProjections` / `EnforcementConfiguration` references in projection fixtures and reverse-engineering docs, so those were retargeted to current execution-context patterns (`SessionContextProjection`, `ScopeReadinessProjection`, `HandoffProjection`, `FileReadingListProjection`) and the real ADR-007/PDR-005 state.


## 2026-05-18 — Cluster 1 verification repair
- The projection fixture still had two `affectedPatterns` survivors for `PerspectiveAwareProjections` inside `DecisionRecord`/`DecisionCatalog`; the clean replacement at that ADR-006 fixture site is `ProjectionFragmentContracts`, which matches the current fragment-contract seam instead of the deleted perspective cluster.
- `docs/reverse-engineering/decision-rationale.md` also carried a stale infrastructure claim about missing GitHub workflows; the current-tree truth is that `.github/workflows/ci.yml` and `publish.yml` exist, so the durable takeaway is reverse-engineering docs can drift behind the live repository.


## 2026-05-18 — Cluster 3 seam research
- Canonical seam owners in `architect-core` are `validation-schemas/pattern-graph.ts:116-191` (`PatternGraphSchema` + `PatternGraph`), `generators/pipeline/transform-types.ts:27-42` (`RuntimePatternGraph`), `generators/pipeline/transform-dataset.ts:88-301`, `generators/pipeline/build-pipeline.ts:124-338`, and `read-api/pattern-graph-api.ts:89-327`.
- Public exposure is a straight barrel chain: `validation-schemas/index.ts:150-163` → `src/index.ts:192-225`, plus `read-api/index.ts:21-22`.
- Remaining local fallback / residue lives in `read-api/pattern-helpers.ts:24-57,93-121` (canonical relationship cache + invariant guard), `validation/boundary.ts:54-65`, `utils/errors.ts:16-21`, and the upstream parser trust boundaries in `extractor/doc-extractor.ts:267-289` and `extractor/gherkin-extractor.ts:458-499`.
- Test-only duplicate schema checks remain at `tests/steps/read-api/pattern-graph-api.steps.ts:89-90` and `tests/steps/extractor/edge-classification.steps.ts:69-70`; they are not production owners.


## 2026-05-18 — Cluster 3 seam completion
-  now behaves as a required graph/read-model contract end-to-end: core step tests no longer treat  as optional, and the read-api step fixture always builds the canonical index instead of accepting an omitted seam.
-  /  was dead contract residue after S1/S2 tightened parsing at the extraction boundary; removing it required trimming both the core pipeline validation shape and the root CLI metadata feature so the observable envelope matches the surviving seam signals (, , ).
- Because  sets , CLI typecheck reads architect-core's built declarations instead of live source. After changing exported core metadata types, a clean rebuild of  was required before CLI typecheck reflected the new seam contract.


## 2026-05-18 — Cluster 3 seam completion (corrected note)
- PatternGraphSchema now behaves as a required graph/read-model contract end-to-end: core step tests no longer treat relationshipIndex as optional, and the read-api step fixture always builds the canonical index instead of accepting an omitted seam.
- The malformedPatterns and malformedPatternCount lane was dead contract residue after S1 and S2 tightened parsing at the extraction boundary; removing it required trimming both the core pipeline validation shape and the root CLI metadata feature so the observable envelope now matches the surviving seam signals: danglingReferenceCount, unknownStatusCount, and warningCount.
- Because packages/architect-cli/tsconfig.json sets disableSourceOfProjectReferenceRedirect to true, CLI typecheck reads architect-core built declarations instead of live source. After changing exported core metadata types, a clean rebuild of packages/architect-core was required before CLI typecheck reflected the new seam contract.

## 2026-05-18 — Cluster 4 seam completion
- `packages/architect-projection/src/projections/pattern-relations/open-question-list.ts` now matches the other validated projection entrypoints by delegating raw option parsing to the shared `parseAndProject(...)` wrapper instead of calling `OpenQuestionListOptionsSchema.parse(...)` inline.
- CLI projection-context ownership is now centralized in `packages/architect-cli/src/cli/projection-context.ts`; both `pattern-graph-cli-runtime.ts` and `generate-docs.ts` build `ProjectionContext` values through the same helper instead of carrying their own local factories.
- `summarizeTaxonomyDigest` now lives in `packages/architect-projection/src/projections/governance/taxonomy-digest.ts`, while the fragment barrels under `src/fragments/**` reverted to schema/type-only ownership.
- The projection perf harness is now script-addressable from `packages/architect-projection/package.json` via `test:perf` (report run) and `test:perf:baseline` (explicit baseline comparison), so the current tree exposes both the report generator and the baseline checker without forcing the noisier baseline gate into the default package perf command.

## 2026-05-18 — Cluster 5 seam completion
- The shipped runtime bridge can be canonicalized without package-boundary breakage by moving the real loader into `packages/architect-core/src/utils/runtime-helpers.ts` and leaving `packages/architect-cli/runtime-bridge.js` plus `packages/architect-mcp/runtime-bridge.js` as tiny package-local wrappers that only supply `import.meta.url` and the package-specific build hint.
- `resolveInvocationDir` and package metadata reads were safe to move downward into `@libar-dev/architect-core` because both CLI and MCP already depend on core; `resolveCliBaseDirArg` and `resolveMcpBaseDirArg` stayed local because their search roots still differ (CLI also checks the workspace root).
- The parser-side legacy adapter for `arch-role`, `arch-context`, and `arch-layer` was truly localized to `packages/architect-core/src/scanner/{ast-parser.ts,gherkin-ast-parser.ts}` in the current tree; no package-local tests needed updating once those branches were removed.
- The accepted final error-owner split is: `@libar-dev/architect-core` owns the generic stderr/exit helpers (`exitWithErrorMessage`, `exitWithProcessError`), `packages/architect-cli/src/cli/error-handler.ts` owns only `DocError` discrimination/formatting, and guard/MCP plus CLI top-level catches now route through those canonical lower helpers instead of carrying duplicate generic exit logic.
- The last manual-QA leak came from guard CLIs calling `parseArgs()` before entering their protected `main()` body. Moving parsing inside the `try` block of the affected leaking guard entrypoints (`lint-patterns`, `lint-process`, `lint-steps`) preserves the core-owned generic exit helper while ensuring invalid flags like `--format xml` fail with clean stderr instead of a raw Node stack trace; `validate-patterns` already had a safe outer catch and remained the reference shape.
