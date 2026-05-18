# Learnings

## 2026-05-17 Task: T1 direct-consumer inventory and validation-gate map
- Direct source consumers of `@libar-dev/architect-projection` found in scope: 17 total.
- Consumer areas:
  - `architect-cli`: 12 files, mostly root-barrel imports with a few `/projections` and `/disclosure` subpath consumers.
  - `architect-mcp`: 2 files, one root+subpath tool registry consumer and one subpath schema consumer.
  - repo tests/steps: 3 files with direct projection imports (`public-contract.steps.ts`, `pattern-graph-cli-modifiers-rules.steps.ts`, `compact-text-renderer.steps.ts`).
- No repo scripts were direct consumers.
- No relative imports from other packages into `packages/architect-projection` were found; consumer access is via package specifiers, not sibling-path imports.
- Surprising non-consumer references worth remembering:
  - `packages/architect-core/src/config/self-hosting.ts` contains projection path globs.
  - `packages/architect-guard/src/lint/tier-a-baseline.ts` contains projection path literals.

## 2026-05-17 Task: T1 validation-gate mapping
- Package-local baseline gates for projection work:
  - `pnpm --filter @libar-dev/architect-projection lint`
  - `pnpm --filter @libar-dev/architect-projection test`
  - `pnpm --filter @libar-dev/architect-projection typecheck`
  - `pnpm --filter @libar-dev/architect-projection build`
- Direct-consumer gates when CLI/MCP behavior changes:
  - `pnpm --filter @libar-dev/architect-cli test`
  - `pnpm --filter @libar-dev/architect-mcp test`
  - `pnpm test:dogfood`
- Perf pair for hot-path or markdown-render changes:
  - `pnpm --filter @libar-dev/architect-projection exec vitest --config vitest.perf-report.config.mjs run`
  - `node packages/architect-projection/tests/perf/compare-baseline.mjs`
- Important gap: `packages/architect-projection/tests/features/projections/documentation-composition/registry-shape.test.ts` is not executed by current vitest include patterns because the config includes `**/*.steps.ts` but not `.test.ts`.
- Important doc mismatch: root docs mention `docs:product-areas`, but no such root script exists in `package.json`.

## 2026-05-17 Task: T2 registry-axis contract tests
- Replaced the orphaned documentation registry `.test.ts` with `registry-contract.feature` plus `registry-contract.steps.ts`, matching the package-local `tests/features/**/*.steps.ts` Vitest include instead of widening config.
- The registry contract now pins four independent axes: identity keys/root route lookups, output markdown routing and child layout, disclosure defaults/matrix completeness/schema validity, and CLI generator names/aliases.
- Verification used `pnpm --filter @libar-dev/architect-projection test`; a direct verbose Vitest run against `registry-contract.steps.ts` showed the four axis scenarios executing.

## 2026-05-17 Task: T10 markdown dispatch coverage hardening
- `render-markdown` now uses a strict kind-table type for its dedicated normalizers, so missing markdown-handler entries fail at compile time while `dispatchByKind` still preserves partial fallback behavior for other renderers.
- The strict table is intentionally local to the markdown renderer scope; the shared dispatch helper still supports optional entries for compact text and UI renderers.

## 2026-05-17 Task: Pattern relations identity split
- `PatternDetailSchema` now extends `PatternIdentitySchema` instead of `PatternSummarySchema`, which avoids inherited `kind` discriminator collisions during schema walking.
- The shared identity shape is derived from `PatternSummarySchema.omit({ kind: true })`, so the summary schema remains the single source for the common fields.
- No local barrel change was needed; the summary module export was sufficient for the detail module to consume the shared identity shape.
- Verification used `pnpm --filter @libar-dev/architect-projection test` and `pnpm --filter @libar-dev/architect-projection typecheck`; both passed.


## 2026-05-17 Task: Route-id parser centralization
- Moved logical route-id parsing authority into `packages/architect-projection/src/routing/route-id.ts` via `parseLogicalRouteId`, and `markdown-paths.ts` now consumes that helper instead of splitting route ids locally.
- `isLogicalRouteId` now shares the same internal parse path, so the route vocabulary stays centralized while keeping the same invalid-id error message.
- Verification passed with `pnpm --filter @libar-dev/architect-projection test`, `pnpm typecheck`, `pnpm test`, and `pnpm validate:all`.

## 2026-05-17 Task: DeliverableManifest helper derivation
- `pattern-relations/supporting.ts` now derives `DeliverableManifestSchema` from the canonical execution-context manifest schema with `.omit({ kind: true })`, mirroring the existing `DeliverableSchema` helper pattern.
- The helper keeps the helper `DeliverableSchema` for `items`, so `PatternDetailSchema` preserves the internal helper-deliverable shape without changing the public fragment barrel.
- Verification passed with `pnpm --filter @libar-dev/architect-projection test`, `pnpm typecheck`, `pnpm test`, `pnpm validate:all`, and `pnpm architect:query arch dangling --baseline packages/architect-guard/src/lint/dangling-baseline.json --strict`.

## 2026-05-17 Task: T5 P0 describe sweep and I5 rejection coverage
- The P0 `.describe()` targets from `.full-review/04a-framework-raw.md` are already covered in the promoted disclosure schema files: `src/disclosure/levels.ts` and `src/disclosure/spec.ts`. No extra P1/P2 registry or block-schema metadata was added.
- The I5 extra-property rejection belongs in the existing `context-session.feature` rule so it is executed through `@amiceli/vitest-cucumber`, not as an orphaned standalone Vitest test.
- A verbose targeted run of `context-session.steps.ts` is useful for proving the new scenario name executed before running the full package gate.

## 2026-05-17 Task: T6 documentation registry axis split
- `documentation-type-registry.ts` now composes four axis modules (`identity`, `output-routing`, `disclosure`, `cli-surface`) and keeps the public facade stable by exporting the same registry arrays and lookup helpers from the original entrypoint.
- The freeze work moved behind lazy/on-demand access: `Object.freeze` no longer runs at module import, and a built-artifact smoke check confirmed the registry arrays are unfrozen before first use, preserve lookup identity, and become frozen after access.
- Projection-local callers did not need import-path churn because the original registry module remained the only public composition surface; only new sibling axis modules were added under `src/projections/documentation-composition/`.


## 2026-05-17 Task: T7 direct consumer registry alignment
- T6's preserved documentation registry facade avoided direct-consumer churn: the only direct registry array consumer remains `packages/architect-cli/src/cli/generate-docs.ts`, which imports `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY` from the top-level projection barrel and continues to use array-style `.map()` / `.find()` successfully.
- `architect-mcp` direct consumers use projection functions and option schemas from the stable root/projections/disclosure entrypoints; no registry-decomposition import-path updates were needed there.
- Targeted direct-consumer checks passed for `architect-cli`, `architect-mcp`, projection package baseline gates, graph dangling strict mode, and the dogfood projection-import consumer subset (`public-contract.steps.ts` plus `compact-text-renderer.steps.ts`).

## 2026-05-17 Task: T8 projection perf renderMarkdown metric
- The perf report now measures  end-to-end for exactly , , and  under .
- The synthetic perf fixture marks every sixth pattern as an accepted architecture ADR so the  documentation bundle exercises non-empty decision rendering.
-  validates the new renderMarkdown bundle metric shape pre-baseline and intentionally leaves threshold ratcheting for the T9 baseline refresh.

Correction for T8 note above: command substitution stripped inline-code markers during append. The intended learning is that the perf report now measures renderMarkdown end-to-end for exactly patterns, decisions, and requirements-executable under renderMarkdownBundles; the synthetic fixture includes accepted architecture ADRs so decisions is non-empty; compare-baseline.mjs shape-validates the new renderMarkdown metrics pre-baseline while T9 owns threshold ratcheting.

## 2026-05-17 Task: T12 shared plain-object helper promotion
- `isPlainObject` now lives in `src/shared/plain-object.ts` and is reused by both `fragments/base.ts` and `renderers/render-json.ts`, so the JSON boundary and bundle boundary share one object-shape check.
- Package-local lint guardrail now blocks new local `isPlainObject` declarations anywhere under `src/` except the shared helper file.
- The regression test had to model null-prototype and polluted-prototype carriers with explicit bracket writes (`['payload']`) to stay compatible with `noPropertyAccessFromIndexSignature`.
- Verification stayed package-local: `lint`, `test`, `typecheck`, and `build` all passed for `@libar-dev/architect-projection` after the helper promotion.

## 2026-05-17 Task: T9 perf baseline refresh
- Copied the fresh `task-3-business-rule-set-perf-report.json` evidence into `packages/architect-projection/tests/perf/baselines/business-rule-set.baseline.json` after the expanded T8 perf suite passed.
- The authoritative baseline now reflects `renderMarkdownBundles` for `patterns`, `decisions`, and `requirements-executable`, and `compare-baseline.mjs` passes against the refreshed numbers.


## 2026-05-17 Task: T13 split-path markdown render memoization
- `renderMarkdown` now carries `MarkdownRenderEvent` instrumentation through `RenderMarkdownOptions.onRenderDocument`, which lets renderer tests assert per-routed-path render counts without exposing `renderDocument` itself.
- Split-path emission reuses `RenderedMarkdownDocument` objects from the split pass, so split parents and split child files are not re-rendered after split decisions are made.
- The routed H2 split scenario proves the current bound: `INDEX.md` renders once and each split-path route (`guides/renderer-guide.md` plus its H2 child files) renders exactly twice or less.

- Post-review refinement: render events count by `renderKey` rather than emitted path, so duplicate H2 output-path collisions do not weaken the per-fragment render-count proof while output path semantics stay unchanged.

## 2026-05-17 Task: F2 final-wave perf comparator enforcement
- `packages/architect-projection/tests/perf/compare-baseline.mjs` now gates `renderMarkdownBundles.patterns`, `decisions`, and `requirements-executable` with the same baseline-vs-hard-budget pattern as the rest of the comparator.
- The new check keeps the existing shape validation for `avgMs`, `p50Ms`, and `iterations` while adding budget enforcement on `avgMs` so the final-wave rejection can no longer pass on shape alone.
- Fresh perf generation plus the comparator both passed after the change.

## 2026-05-17 Task: T15 dogfood direct-consumer path unblock
- Root dogfood step imports for `architect-cli` / `architect-mcp` must resolve through `packages/...` in the current monorepo layout; sibling paths like `../../../../architect-cli` now point outside the repo.
- The combined CLI modifiers/rules step file maps to three split feature files (`output-modifiers`, `arch-health`, `rules-subcommand`), so loading the split features by rule block is required for direct targeted execution.
- `tests/support/helpers/cli-runner.ts` also needs the package-local CLI source root (`packages/architect-cli`) when step files execute `pattern-graph-cli` from temp consumer directories.

## 2026-05-17 Task: F2 final-wave code quality review
- Review found no blocking doctrine regressions in the changed projection and direct-consumer surfaces: registry decomposition preserves the public facade, moved disclosure/routing symbols are available through dedicated subpaths plus root barrel, and CLI/MCP consumers compile against the adjusted imports.
- Targeted anti-pattern checks found no projection-scope `as any`, type suppressions, eslint disables, or duplicate local `isPlainObject`; projection-local lint/typecheck/build/test passed.
- Perf comparator now enforces `renderMarkdownBundles.patterns`, `decisions`, and `requirements-executable` `avgMs` against hard and baseline budgets. A concurrent first run only failed `projectionHotPaths.graphBuild.avgMs`; rerunning the required perf gate alone passed all metrics.

## 2026-05-17 Task: F1 plan compliance audit
- Plan-range audit used `c74814f^..HEAD` as the decomposed implementation/F2 range; those commits touch projection package plus targeted direct-consumer files only, with no `docs-live/`, `architect/`, or `formal-spec/` paths.
- Deliverables verified in current files: four-axis registry facade, PatternIdentitySchema, DeliverableManifest helper derivation, strict markdown KindTable, centralized route parsing, shared isPlainObject guard, I5 extra-property coverage, split-path render-count instrumentation, and renderMarkdown perf comparator budgets.
- Fresh F1 perf check passed via `pnpm exec vitest --config vitest.perf-report.config.mjs run tests/features/perf/business-rule-set-report.steps.ts && node tests/perf/compare-baseline.mjs`; comparator enforced all `renderMarkdownBundles` budgets.

## 2026-05-17 Task: code-simplifier completion feedback
- No final code edit was warranted from a behavior-preserving simplification perspective: the registry split keeps a stable facade, route parsing has one authority, `isPlainObject` has one projection-local implementation, and the perf comparator now enforces `renderMarkdownBundles` budgets.
- Remaining maintainability risk is mostly intentional transitional complexity: `render-markdown.ts` is still large and the lazy registry facade is proxy-based, but both are covered by focused tests and would be riskier to churn during final closure.
- Targeted checks used branch diff inspection, focused reads of projection/direct-consumer surfaces, grep for duplicate `isPlainObject`, route-id split copies, suppressions, and LSP diagnostics on projection src plus touched CLI/MCP entry files.

## 2026-05-17 Task: F4 scope fidelity check
- The current branch contains older unrelated docgen/spec work relative to `main`, but the plan-owned implementation slice is the five commits `c74814f^..HEAD`; that audited range changes 39 files only.
- Every audited path stays inside `packages/architect-projection/**` plus direct dogfood consumer files under `tests/**`; there are no `docs-live/`, `architect/`, `formal-spec/`, `docs/`, `docs-sources/`, CLI package source, MCP package source, core/guard package, or root-doc/config drift hits in that range.
- Targeted checks for W-DOCS-2 drift found no audited-path hits for future `ContentFragment` work, decision-formatting extraction, or extra filter-memoization; the only memoization change in-range is the planned routed-document/render-markdown work.

## 2026-05-17 Task: F3 real QA execution
- Package-local projection gates passed on current branch state: `pnpm --filter @libar-dev/architect-projection test`, `lint`, `typecheck`, and `build`.
- Perf generation and comparator passed after rerunning the exact package-local pair; the first comparator run showed transient non-renderMarkdown hot-path budget noise, while the rerun passed all budgets including `renderMarkdownBundles`.
- Targeted projection-import consumer checks passed for `@libar-dev/architect-cli` test/typecheck, `@libar-dev/architect-mcp` test/typecheck, and dogfood step files `public-contract`, `compact-text-renderer`, and `pattern-graph-cli-modifiers-rules`.

## 2026-05-17 Task: F3 dogfood blocker retry
- `tests/support/helpers/cli-runner.ts` now resolves `lint-patterns` through `packages/architect-guard`, matching the existing monorepo package-root logic used for `architect-cli`.
- `tests/steps/cli/data-api-help.steps.ts` frozen global help expectations now include the current architect-data-api guidance lines emitted after the global options list.
- Targeted reruns for `lint-patterns.steps.ts` and `data-api-help.steps.ts` passed before the full `pnpm test:dogfood` gate, which then passed all 20 dogfood step files.
