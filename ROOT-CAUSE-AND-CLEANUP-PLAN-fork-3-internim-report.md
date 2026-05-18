<task-notification>
<task-id>aa3a86aa917aae8d4</task-id>
<tool-use-id>toolu_01JNVpDv5yy8LQFt55R2hPFU</tool-use-id>
<output-file>/private/tmp/claude-501/-Users-darkomijic-dev-projects-architect/3fb42fe1-ccd1-41b9-ae07-d905b1a51a73/tasks/aa3a86aa917aae8d4.output</output-file>
<status>completed</status>
<summary>Agent "Audit projection / renderer pipeline" completed</summary>
<result>Confirmed: chain is `strictObject → .omit() → .extend()` — neither `.omit()` nor `.extend()` preserves strict in Zod v4, and `.strict()` never reappears. Extra props pass silently on `PatternDetailSchema`. I have enough evidence. Producing the final report.

---

# Projection Pipeline Audit — Findings

## 1. Entry-point count

**15 `parseAndProject*` exports.** 14 route through `parseAndProject` (the trust-boundary helper at `packages/architect-projection/src/projections/_shared/parse-and-project.internal.ts:22`). **One bypasses it:** `parseAndProjectOpenQuestionList` (`packages/architect-projection/src/projections/pattern-relations/open-question-list.ts:34-39`) calls `OpenQuestionListOptionsSchema.parse(rawOptions)` directly — no `errorContext`, raw `ZodError`, no `defaultRawOptions` semantics. Pattern-summary, pattern-detail, orphan-pattern-list, dependency-edges, architecture-context/comparison/neighborhood all expose `project*` functions but no `parseAndProject*` — the trust boundary is **optional**, not enforced. The PR #28 invariant "raw caller options are parsed exactly once" is conventional, not structural.

## 2. Disclosure / grouping / filtering policy — **SPLIT**

- **Registry side** (`documentation-type-registry.ts:22-41`): each doc type carries a `disclosureMatrix: Record&lt;ProgressiveDisclosureLevel, DisclosureSpec&gt;`. `documentation-bundle.internal.ts:108-115` selects `metadata.disclosureMatrix[level]` and writes it onto `routing.disclosureSpec`. Filter resolution happens via `withDocumentationFilter(...)` (line 103) which mutates `ProjectionContext.projectionFilter` _before_ projection runs. Good.
- **Renderer side** (`render-markdown.ts:240-453`): `resolveBundleDisclosureSpec(bundle, options)` re-resolves with **renderer-side override wins** (`render-markdown.ts:448-453`):
  ```
  if (options.disclosureSpec !== undefined) return options.disclosureSpec;
  return bundle.routing?.disclosureSpec;
  ```
  The renderer then branches on `richness` (`render-markdown.ts:607`, `633`, `637`) and `rootShape === 'navigation'` (`render-markdown.ts:621-629`), e.g. `BusinessRuleSet` re-decides emission shape based on disclosure inside `normalizeBusinessRuleSet`. `emitChildren` is read at `:241`. So projection writes the policy; renderer reads it but can override and re-decide presentation. **The contract is advisory, not load-bearing.**

## 3. Renderer-on-Fragments-only claim — **FALSE**

`render-markdown.ts:37-53` imports from `../fragments/index.js`: `isBundle`, **`summarizeTaxonomyDigest`**, plus 12 contract types. `summarizeTaxonomyDigest` is a runtime helper defined in `fragments/governance/taxonomy-digest.ts:33-45` — a file annotated `@architect-role:contract`. ADR-005 Rule 5 violation. It is **triple-exported** through `fragments/governance/index.ts:14`, `fragments/index.ts:43`, and `projections/index.ts:50` — and re-exported from `projections/governance/taxonomy-digest.ts:46` back into the projection barrel. Used at `render-markdown.ts:949`.

The README's enforcement rules (`README.md:89-92`) catch _structural_ boundaries (no doc-composition import, no route construction, no `.internal.js` cross-layer) but do **not** detect contract-layer-runtime calls — the import is from `../fragments/index.js`, which is allowed.

**10 fragment-kind-specific normalizers** (`render-markdown.ts:208-219`): `ArchitectureDiagram`, `BusinessRuleSet`, `DecisionCatalog`, `DecisionRecord`, `RoadmapTimeline`, `ReleaseNotesDigest`, `RequirementDigest`, `TaxonomyDigest`, `TraceabilityMatrix`, `ValidationRuleDigest`. The discriminated union holds **43 fragments** (`fragment-schema.internal.ts:70-114`); the other 33 fall through to `normalizeGenericFragment` (`:1090`). So 23 % of fragments have bespoke renderer code; 77 % rely on a generic dispatcher that the renderer itself owns the shape of. Either way, presentation decisions are renderer-side.

## 4. `ProjectionContext` contract

**Hand-written interface, NOT Zod-derived.** `context/projection-context.ts:33-40` declares it as `interface ProjectionContext { ... }`. No schema, no `parse`, no `strictObject`. There are **131 functions** consuming `ProjectionContext` across `packages/architect-projection/src/`, and **zero** call sites validate it. Construction lives in **two separate `createProjectionContext` factories** in the CLI: `packages/architect-cli/src/cli/pattern-graph-cli-runtime.ts:143` and `packages/architect-cli/src/cli/generate-docs.ts:387`. No shared factory, no Zod gate, no parse-once boundary. `parseAtBoundary` is only applied to options, never to context.

## 5. Zod 4 `.omit/.extend` strictness loss — **CONFIRMED**

- `pattern-summary.ts:17` `PatternSummarySchema = z.strictObject({...})` ✓ strict.
- `pattern-summary.ts:28` `PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })` — Zod v4 `.omit()` returns a plain object, **strict dropped**.
- `pattern-detail.ts:24` `PatternDetailSchema = PatternIdentitySchema.extend({ ... })` — `.extend()` does not re-strictify.
- `supporting.ts:52-58` `EmbeddedDeliverableSchema = DeliverableSchema.omit({ kind: true })` and `EmbeddedDeliverableManifestSchema = ....omit(...).extend({...})` — same loss.
- **Zero `.strict()` calls** anywhere in `pattern-summary.ts`, `pattern-detail.ts`, `supporting.ts`. `PatternDetail` (the most expensive fragment) silently accepts extra properties at parse time — the "parse once" invariant is bypassed in the most critical fragment.

## 6. Perspective* / Enforcement* cluster — **layering ON TOP, not fixing seams**

`PerspectiveAwareProjections` (depends on `EnforcementConfiguration`) targets _legacy_ paths from the pre-W1.5 monorepo: `src/api/pattern-graph-api.ts`, `src/generators/pipeline/transform-dataset.ts`, `src/renderable/codecs/{patterns,session,timeline,planning,...}.ts`, `src/mcp/tool-registry.ts`. None of those paths exist anymore (the codecs were deleted per `MIGRATION.md` Table A). The spec describes **five named perspectives** (`delivery`, `architectural-review`, `planning`, `implementation-queue`, `idea-triage`) as predicate filters and adds **codec-default-perspective wiring + six new API methods** to PatternGraphAPI. `EnforcementConfiguration` adds ProcessGuard config (`excludedStatuses`, `ruleOverrides`, `validatePromotions`) — also targeted at deleted `src/lint/process-guard/` paths.

**Conclusion:** this is stale plan-tier work that (a) hasn't been re-targeted to the new package layout, (b) adds a _new_ policy axis (perspective) at the CODEC / consumer boundary instead of at the projection-fragment seam, (c) is blocked on an enforcement-config change that has nothing to do with doc-gen. The cluster doesn't address ProjectionContext, the wrapper bypass, the renderer-side disclosure overrides, or the `summarizeTaxonomyDigest` violation. It _would_ layer another renderer-time decision (perspective filtering at codec defaults) on top of the existing split policy. The blocking deadlock is partly because the implementation surfaces named in the design specs no longer exist — `scope-validate` can't find the deliverable files.

## 7. Root-cause statement

**The load-bearing cause is (c) renderer-side policy that should be projection-side, propagated by (b) `ProjectionContext` not being a strict contract.** Evidence: the renderer reads `disclosureSpec` from three sources (caller options, bundle routing, fallback), branches on `richness` / `rootShape` inside per-kind normalizers, owns the 10-of-43 normalizer table, owns the generic fallback for the remaining 33 fragments, and imports a runtime helper (`summarizeTaxonomyDigest`) from the contract layer — all of which mean the "doc-gen" output for a given pattern is a function of _renderer code paths_, not of a registry entry. PR #28 introduced `ProjectionBundle&lt;T&gt;` as the boundary but did **not** make `ProjectionContext` a parsed contract, did **not** strip renderer-side disclosure overrides (`render-markdown.ts:448-453`), and did **not** prevent runtime helpers from living in `@architect-role:contract` files. Compounding factors: (a) the one wrapper bypass in `open-question-list.ts:38` shows the trust boundary is convention, (d) the `.omit/.extend` chain on `PatternDetailSchema` lets drift through silently, (e) `compare-baseline.mjs` has zero CI callers despite `docs/MIGRATION.md:62` claiming "the perf gate is now live in CI", and the `documentation-type-registry.ts` 174-LOC Proxy facade is self-described as deletion-targeted but still the _single registry-driven entry point_ per PR #28. The unification is structural (one bundle type, one dispatch helper, one wrapper), but contractual seams (Zod-typed context, strict-preserving fragment chains, projection-owned presentation policy, mechanically enforced no-runtime-in-contract) are absent — which is why doc-gen still "feels uncontrolled". The Perspective* + Enforcement* cluster does not fix any of this; it layers a new consumer-side filter axis on top of the same un-contracted seams while targeting code paths that no longer exist.

## Relevant file paths

- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/_shared/parse-and-project.internal.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/pattern-relations/open-question-list.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-bundle.internal.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/projections/documentation-composition/documentation-type-registry.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/context/projection-context.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/pattern-graph-cli-runtime.ts` (l. 143)
- `/Users/darkomijic/dev-projects/architect/packages/architect-cli/src/cli/generate-docs.ts` (l. 387, 582)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/fragments/base.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/fragments/fragment-schema.internal.ts` (43-kind discriminated union, l. 70-114)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/fragments/governance/taxonomy-digest.ts` (l. 33-45 — runtime in contract)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/fragments/pattern-relations/{pattern-summary,pattern-detail,supporting}.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/disclosure/spec.ts` (imports projections/\_shared — inversion)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/renderers/render-markdown.ts` (l. 39, 176-219, 448-453, 607-637, 949)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/src/renderers/_shared/dispatch.ts`
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/tests/perf/compare-baseline.mjs` (unwired — 0 callers)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/docs/MIGRATION.md` (l. 60-68 — claims perf-gate live in CI)
- `/Users/darkomijic/dev-projects/architect/packages/architect-projection/README.md` (l. 80-97 — enforcement rules table)
- `/Users/darkomijic/dev-projects/architect/architect/specs/perspective-aware-projections.feature`
- `/Users/darkomijic/dev-projects/architect/architect/specs/enforcement-configuration.feature`</result>
  <usage><total_tokens>72355</total_tokens><tool_uses>37</tool_uses><duration_ms>239129</duration_ms></usage>
  </task-notification>
