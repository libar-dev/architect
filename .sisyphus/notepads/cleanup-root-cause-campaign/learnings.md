## Session Notes

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
