## Session Issues

## 2026-05-18T07:05:03.633Z Task: plan-risk-review
- Plan contradiction: verification strategy says “ZERO HUMAN INTERVENTION” but Final Verification Wave requires explicit user approval before completion.
- Cluster 4 may conflict with current AGENTS.md doctrine because the plan wants raw `project*` exports to become file-private while AGENTS.md still describes `project*()` as key projection exports.
- Cluster 2/3 and Cluster 3 ownership boundaries may need replanning if seam cleanup requires adapters, package dependency reversal, or widened cluster scope to restore green.


## 2026-05-18 — Documentation ambiguity
- Zod docs explain strict objects, `safeParse`, `z.treeifyError()`, `z.prettifyError()`, and custom error maps, but they do not prescribe a single canonical public HTTP error envelope. The boundary format (generic string vs flattened field map vs treeified payload) still needs repo-level policy.
- The docs imply, rather than explicitly state, that `z.function()` should stay out of serializable registry/config schemas; the enum/string-ID pattern is an inference from the runtime-function semantics.


## 2026-05-18 — Cluster 1 ambiguities
- `ExtractedPatternDraftSchema`, `ProjectionContextSchema`, and `RendererOptionsSchema` do not exist yet in the current tree; the nearest owning files are `packages/architect-core/src/validation-schemas/extracted-pattern.ts`, `packages/architect-projection/src/context/projection-context.ts`, and `packages/architect-projection/src/renderers/types.ts`.
- `packages/architect-core/src/validation-schemas/pattern-graph.ts` currently uses `z.object(...)` for `PatternGraphSchema`; Cluster 1 must decide whether to convert it in place or introduce a strict sibling schema.
- `StatusValueSchema` is a projection-side alias of `AcceptedStatusSchema`, so any later seam split still depends on keeping that barrel path stable until Cluster 1 lands.


## 2026-05-18 — Cluster 1 ambiguities
- `ExtractedPatternDraftSchema`, `ProjectionContextSchema`, and `RendererOptionsSchema` are not present yet; the nearest current owners are `packages/architect-core/src/validation-schemas/extracted-pattern.ts`, `packages/architect-projection/src/context/projection-context.ts`, and `packages/architect-projection/src/renderers/types.ts`.
- `PatternGraphSchema` still needs a strictness decision: keep the current owner and convert in place, or introduce a strict sibling schema and update the export chain.
- The current public consumers to update/verify are `extractPatterns`/`extractPatternsFromGherkin`, `buildPatternGraph`/`transformToPatternGraph`, `createPatternGraphAPI`, projection `parseAndProject*` wrappers, and CLI render/load entrypoints.

- `validateStatus` and `validateCompletionMetadata` are still used internally inside `validation/fsm/validator.ts`; Cluster 1 should drop their public exports first, not delete the local helpers blindly.
- `PDR-005` needs a single coordinated decision: author the decision record or strip every product/doc reference in one sweep; partial cleanup will just recreate the phantom.

## 2026-05-18 — Cluster 1 research sweep
- The stale `Perspective*` / `EnforcementConfiguration` spec paths are only cited, not present, in this checkout: `architect/specs/perspective-aware-projections.feature` and `architect/specs/enforcement-configuration.feature` are named in `ROOT-CAUSE-AND-CLEANUP-PLAN-fork-4-internim-report.md:77-78` and in `packages/architect-projection/tests/fixtures/fragments.ts:293,408`, but `glob` found no matching files under `architect/specs/`.
- Delete-candidate code surfaces are backed by the report inventory: `packages/architect-core/src/config/cli-schema.ts` and `packages/architect-cli/src/index.ts` are identified as dead/public-surface deletions in `ROOT-CAUSE-AND-CLEANUP-PLAN-fork-4-internim-report.md:52,57` and `ROOT-CAUSE-AND-CLEANUP-PLAN.md:181,236`; the current workspace has no source files at those paths.
- Phantom `PDR-005` references are concentrated in guard/core/docs: `packages/architect-guard/src/cli/lint-process.ts:170`, `packages/architect-guard/src/lint/process-guard/{index.ts:14,decider.ts:33,58,types.ts:29}`, `packages/architect-core/src/taxonomy/registry-builder.ts:162` (via report inventory), plus `docs/VALIDATION.md:239`, `docs/GHERKIN-PATTERNS.md:29,51`, and `docs-sources/gherkin-patterns.md:22,47`.
- Existing audit/workflow substrate is present but incomplete: `ROOT-CAUSE-AND-CLEANUP-PLAN.md:177-195` defines the workspace-consumer audit gate, `packages/architect-guard/src/cli/lint-patterns.ts:45` consumes `tier-a-baseline.ts`, `packages/architect-projection/src/projections/operational-insights/index.ts:115` exposes `arch blocking`, and `.sisyphus/evidence/task-1-unblockers.txt:26-28` records the current unblocker/audit state.


## 2026-05-18 — Cluster 1 scope guard
- `_bmad-output/planning-artifacts/architecture.md` still contains historical `EnforcementConfiguration` / `PerspectiveAwareProjections` prose, but it sits outside the requested Cluster 1 file scope. Treat it as later documentation debt unless the cluster scope is explicitly widened.

## 2026-05-18 — Cluster 2 residue map (architect-core)
- `buildRoleLookup` current implementations are only three copies in this checkout: `src/scanner/gherkin-ast-parser.ts:54-65`, `src/extractor/doc-extractor.ts:58-68`, and `src/extractor/gherkin-extractor.ts:105-115`. The plan’s “4 buildRoleLookup” count is stale here; there is no fourth implementation in `packages/architect-core`.
- `resolveCanonicalRole` implementations/callers are: `src/scanner/gherkin-ast-parser.ts:68-73` → `440`/`468`, `src/extractor/doc-extractor.ts:71-78` → `130`, `154`, `222`, `src/extractor/gherkin-extractor.ts:118-125` → `162`, `184`, and the public read-side helper `src/read-api/pattern-helpers.ts:137-139` (re-exported at `src/read-api/index.ts:32-34`).
- `extractPatternTags` owner is `src/scanner/gherkin-ast-parser.ts:364-367`; actual callers are `src/extractor/gherkin-extractor.ts:367` and `537`, with re-export surfaces at `src/scanner/gherkin-scanner.ts:110` and `src/scanner/index.ts:89-97`. The `ReturnType<typeof extractPatternTags>` uses at `src/extractor/gherkin-extractor.ts:129` and `198` are type-only references.
- `parseDirective` is owned by `src/scanner/ast-parser.ts:225-233` with the only call at `203`. The `Map.get(...) as X` cast cluster is localized to `src/scanner/ast-parser.ts:279-296` (18 casts total); no other `Map.get(...) as ...` casts were found in `packages/architect-core/src`.
- `TagRegistry` has one real interface owner at `src/config/tag-registry-contract.ts:23-32`. The parallel schema surface is `src/validation-schemas/tag-registry.ts:41-52` (schema + type re-export), not a second interface; the plan’s mention of a duplicate in `config/role-constants.ts` does not match the current tree.
- `cloneTagRegistry` is a local read-api utility at `src/read-api/pattern-graph-api.ts:85-106` with one caller at `106`; if clone isolation is removed later, this is deletion residue rather than a shared owner.
- Role constant family: `src/config/role-constants.ts:12-68` defines `LOCKED_WAVE_ONE_ROLES` and exports `DEFAULT_ROLES`/`DDD_ES_CQRS_ROLES`. Current consumers are `src/config/factory.ts:5,30`, `src/taxonomy/registry-builder.ts:6,146`, `src/config/index.ts:44`, and `src/index.ts:65`. `DDD_ES_CQRS_ROLES` has no non-export consumer in core and looks like the clearest consolidation/deletion residue.

## 2026-05-18 — Cluster 2 verification follow-up
- The concrete `gherkin-extractor.ts` TS1128 report appears to be file-scoped LSP drift rather than a compiler failure: `pnpm --filter @libar-dev/architect-core test`, `pnpm build`, `pnpm lint`, and `pnpm typecheck` all passed after the extractor fix, `lsp_symbols` can index the file, and `python3` byte inspection shows a clean EOF ending in a single newline, but direct `lsp_diagnostics` for `packages/architect-core/src/extractor/gherkin-extractor.ts` still reports `error[ts] (1128) at 541:0` against a 540-line file.

## 2026-05-18 — Cluster 2 LSP gate closure
- The stale file-scoped TS1128 on `packages/architect-core/src/extractor/gherkin-extractor.ts` cleared only after replacing the file in place (delete/add with identical logic). Smaller no-op touches inside the file, including EOF edits and an `export {}` terminator, were not enough to refresh the single-file tsserver state even though directory-scoped diagnostics and compiler-backed commands were already green.
- After the in-place replacement, `lsp_diagnostics` is clean for both `packages/architect-core/src/extractor/gherkin-extractor.ts` and `packages/architect-core/src/extractor`, and `pnpm --filter @libar-dev/architect-core test`, `pnpm build`, `pnpm lint`, and `pnpm typecheck` all still pass.

## 2026-05-18 — Cluster 2 final follow-up commit
- The branch cannot end green with only `0c941a0` in place, because restoring `gherkin-extractor.ts` to that clean-HEAD version reintroduces impossible file- and directory-scoped TS1128 diagnostics in `src/extractor`. The minimal stable fix is a follow-up commit that preserves the extractor in-place replacement while leaving the broader Cluster 2 logic unchanged.

## 2026-05-18 — Cluster 3 seam research
- Core↔guard FSM seam consumers are concentrated in `packages/architect-core/src/validation/fsm/{validator.ts:52-118,transitions.ts:31-64}`, `packages/architect-core/src/read-api/pattern-graph-api.ts:169-186`, `packages/architect-guard/src/lint/process-guard/decider.ts:118-123,286-335`, and the CLI adapter at `packages/architect-cli/src/cli/commands/_shared/structured.ts:119-126`.
- Direct package-local test coverage is missing in both seam owners: `glob` found no `packages/architect-core/**/*test.ts` and no `packages/architect-guard/**/*test.ts`. The only in-repo seam coverage is feature/step-based: `tests/steps/cli/pattern-graph-cli-core.steps.ts:284-321` (`isValidTransition` query), `packages/architect-guard/tests/steps/guard-runtime.steps.ts:180-217` (completed-protection), `packages/architect-guard/tests/steps/guard-runtime.steps.ts:253-302` (status-transition detection), and `packages/architect-guard/tests/features/process-guard-rules.feature:35-63` (narrative verification, including a pointer to a non-existent `phase-state-machine` suite).
- Cast residue is localized but still present: `packages/architect-core/src/validation/fsm/validator.ts:88-118`, `packages/architect-guard/src/lint/process-guard/detect-changes.ts:413-452`, `packages/architect-core/src/scanner/ast-parser.ts:312-317`, and `packages/architect-core/src/scanner/gherkin-ast-parser.ts:553-563` all narrow status values with `as ...StatusValue` casts.
- Boundary handling is mostly contained, but `packages/architect-core/src/validation/boundary.ts:38-65` still exports `BoundaryParseError` with a `z.ZodError` cause through `packages/architect-core/src/index.ts:198-203`. Downstream adapters (`packages/architect-core/src/extractor/{doc-extractor.ts:267-289,gherkin-extractor.ts:458-499}`) immediately convert that to structured diagnostics, and I found no raw `ZodError` usage in `packages/architect-guard`.

## 2026-05-18 — Cluster 4 perf baseline variance
- `pnpm --filter @libar-dev/architect-projection test:perf:baseline` is currently sensitive to local timing variance on non-functional hot paths (for example `documentationView` and aggregate render metrics) even when the Cluster 4 seam changes are unrelated. The report command is green and the comparator remains available as an explicit follow-up check, but baseline refresh/tuning belongs to perf-hardening scope rather than this seam-ownership slice.

## 2026-05-18 — Cluster 5 boundary guardrail
- The duplicate `handleCliError` shapes in `packages/architect-cli/src/cli/error-handler.ts` and `packages/architect-guard/src/cli/shared.ts` could not be collapsed directly without either creating a forbidden `guard -> cli` import or broadening a generic CLI-error surface in core beyond the mechanical seam cleanup requested here. Cluster 5 therefore leaves that split in place and documents it instead of forcing a dependency-unsafe consolidation.

## 2026-05-18 — Cluster 6 current-tree scope
- Accepted Cluster 6 scope for this session is the smallest green current-tree slice: docs truth fixes in `README.md`, `docs/MCP-SETUP.md`, and `packages/architect-core/README.md`, plus CI enforcement of `pnpm --filter @libar-dev/architect-projection test:perf` in `.github/workflows/ci.yml`.
- Explicit deferrals preserved: do not wire `test:perf:baseline` into CI yet because the comparator is still variance-sensitive, and do not widen into MCP runtime hardening (`process.chdir`, signal shutdown, watcher/session teardown) or docs-composition placeholder replacement in this slice.

## 2026-05-18 — Cluster 7 final-review deferrals
- Keep the docs-composition replacement visible for final review: `REMAINING-WORK.md:360-366` still records the deferred `DocDefinition.build(graph)` successor work, and Cluster 7 closes only the enforcement/review surface rather than reopening that implementation theme.
- Keep MCP runtime hardening visible for final review: `packages/architect-mcp/src/pipeline-session.ts:259-269` still uses `process.chdir(...)`, and the broader signal-shutdown / watcher-session teardown hardening remains an accepted follow-up instead of hidden debt in this closeout commit.
