# architect-projection — Phase 4 Consolidated: Best Practices & Standards

**Sources:** `raw/4A-language-framework.md` (typescript-pro) + `raw/4B-ci-devops.md` (deployment-engineer). Findings tagged **[4A]**, **[4B]**, or **[4A+4B]**.

## Executive Summary

**The Phase 4 angle for projection is inverted from core.** Where core's Phase 4 surfaced 9 High-severity language breaches (16 `as` casts in tag parsing, `z.function().optional()`, 28 `z.object` sites needing strict-sweep, `void X` expressions, hand-written `PatternGraph`), projection has **none of the equivalent class**:

| Strictness dimension                                  | Core           | Projection                                                               |
| ----------------------------------------------------- | -------------- | ------------------------------------------------------------------------ |
| `z.object` requiring strict-sweep                     | 28 sites       | **0** (107 strict; 0 open)                                               |
| `as unknown as` casts in src                          | 0              | 0                                                                        |
| `void X;` suppression expressions                     | 3              | **0**                                                                    |
| `console.*` in src                                    | 2              | **0**                                                                    |
| Legacy `from 'fs'`/`from 'path'` imports              | mixed          | **0** (also zero `node:` imports — data-layer purity)                    |
| `@ts-ignore` / `@ts-expect-error` / `eslint-disable`  | 0              | 0                                                                        |
| `z.function().optional()` Zod-3 idiom                 | 1              | **0**                                                                    |
| `Map<string, unknown>` + `as X` after `.get()`        | 16 sites       | **0**                                                                    |
| `[key: string]: unknown` index-signature escape hatch | yes            | **0**                                                                    |
| Hand-written interface shadowing schema               | `PatternGraph` | **1** (`ProjectionContext` — holds a function, full JSON validation N/A) |

Six findings are NEW (additive to Phases 1-3), and **one (from 4A) sharpens Phase 1 C-PROJ-1 significantly**: the Zod 4 strictness-loss bug also occurs at TWO `.omit()` sites (`pattern-summary.ts:28`, `supporting.ts:54-58`) which feed INTO `PatternDetailSchema`. Phase 1 only flagged the `.extend()` sites — the compounded loss is worse than Phase 1 framed. Zod 4 changelog calls this out: `extend`, `omit`, `pick`, `partial`, `required` no longer carry through `unknownKeys`; chain `.strict()` after to restore.

The two highest-leverage CI/DevOps findings:

1. **The perf gate is fully implemented in `tests/perf/compare-baseline.mjs`** with 26 budgets across 3 categories (4 hard, 8 hot-path, 3 render-bundle). Current `project.avgMs = 0.544 ms` (safe — 64% headroom under 1.5 ms hard budget). **One-line `package.json` fix wires it into CI.** Re-baseline policy detailed in 4B.
2. **Audit-script promotion opportunity** — projection's `options-schema-barrel-audit.mjs` + `jsdoc-boilerplate-audit.mjs` are the only mechanical surface audits in the family. Promoting `jsdoc-boilerplate-audit.mjs` family-wide would have caught core's DOC-H-3 (16 boilerplate violations) automatically; extending `options-schema-barrel-audit.mjs` ~15 LOC catches C-PROJ-2-style outliers.

## Critical (P0)

### CP4A-Sharpened-1. Zod 4 strictness loss also affects `.omit()` chains feeding `PatternDetailSchema` **[4A]** (sharpens Phase 1 C-PROJ-1)

`PatternDetailSchema` is derived through a chain that **strips strictness twice**:

```
PatternSummarySchema (z.strictObject)
  → PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })  // strict → strip
  → PatternDetailSchema = PatternIdentitySchema.extend({ ... })         // already strip; stays strip
```

Phase 1 caught the `.extend()`. Phase 4A confirms that `.omit()` at `pattern-summary.ts:28` had **already** stripped strictness one step earlier. Zod 4 internals rule: `extend`, `omit`, `pick`, `partial`, `required` no longer carry `unknownKeys`. `EmbeddedDeliverableManifestSchema` at `supporting.ts:54-58` chains `.omit().extend()` — same compounded loss.

**Recipe — family-reference fix (Option B from 4A §3.1):**

```ts
// pattern-summary.ts — derive via strict spread, not omit
export const PatternIdentitySchema = z.strictObject({
  patternName: PatternSummarySchema.shape.patternName,
  // ... copy the kept fields explicitly
});

// pattern-detail.ts
export const PatternDetailSchema = z.strictObject({
  ...PatternIdentitySchema.shape,
  kind: z.literal('PatternDetail'),
  // ... new fields
});

// supporting.ts (EmbeddedDeliverableManifestSchema)
export const EmbeddedDeliverableManifestSchema = z.strictObject({
  ...DeliverableManifestSchema.shape,
  items: z.array(EmbeddedDeliverableSchema),
});
```

A `parseAtBoundary(PatternDetailSchema, { ...validPayload, extraField: 'leak' })` round-trip test catches regressions. **Family-wide implication:** core's F4A-H-6 (`PackageConfigSchema.extend()`) and any sibling using `.omit()`/`.extend()`/`.pick()`/`.partial()`/`.required()` chains on strict schemas needs the same audit.

### Cleanup-C-PROJ-1 (Phase 2 finding, reconfirmed by 4B)

Comparator at `tests/perf/compare-baseline.mjs` is fully implemented (26 budgets). Baseline committed at `tests/perf/baselines/business-rule-set.baseline.json`. Evidence regenerated by `tests/features/perf/business-rule-set-report.steps.ts:721-762`. Current `project.avgMs = 0.544 ms` (under 1.5 ms hard budget). Phase 2B observed an earlier 2.05 ms regression — must have been ephemeral. **One-line fix in `package.json:65`:**

```diff
- "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts",
+ "test": "pnpm test:barrel-audit && pnpm test:jsdoc-boilerplate-audit && pnpm typecheck && vitest run --config vitest.config.ts && node tests/perf/compare-baseline.mjs",
```

**Sequencing caveat:** perf-report writer runs under `vitest.perf-report.config.mjs`. Cleaner fix: Cleanup-H-PROJ-2 (collapse the configs) so one `vitest run` both records and validates. Otherwise add `&& vitest run --config vitest.perf-report.config.mjs` before the comparator.

## High (P1)

### Language / framework (4A — additive to Phases 1-3)

| #          | Title                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Location |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| H-PROJ-F-1 | **`StrictKindTable.Kinds` hand-typed subset** — `render-markdown.ts:176-186` lists 10 of 43 `FragmentKind` literals as `MarkdownNormalizerKind`. Adding a fragment to `FragmentSchema` doesn't force a normalizer addition; the table stays partial silently. **Recipe (4A §4.3 Option A):** derive `MarkdownNormalizerKind` from `FragmentSchema.options.map(o => o.shape.kind.value)`; add a `_exhaustive: NormalizerKindCheck<...>` compile-time assertion that fails when a new fragment is added without a normalizer. |
| H-PROJ-F-2 | **`ProjectionContext` hand-written interface** at `context/projection-context.ts:33-40` — the most-passed type in the package. Projection analogue of core's `PatternGraph` interface drift (C-CORE-2). `packageResolver` is a function so full JSON-validation doesn't apply, but a `z.custom<ProjectionContext>((value) => isProjectionContext(value))` brand with hand-written `isProjectionContext` guard would close the gap at future MCP entrypoints.                                                                |

### CI / DevOps (4B — additive to core's Phase 4B)

| #         | Title                                                                                                                                                                                                                                                                                          | Action                                                                                                                                                                                                                                                                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI-PROJ-1 | Wire the perf gate (Cleanup-C-PROJ-1)                                                                                                                                                                                                                                                          | One-line `package.json` fix as above.                                                                                                                                                                                                                                                                                                           |
| CI-PROJ-2 | **Re-baseline policy** when downstream fixes shift measurements                                                                                                                                                                                                                                | Re-baseline after H-CORE-8 lands (10-20% improvement from `structuredClone` removal expected), after H-PROJ-Q-6 (`filterPatterns` no-copy, 5-15% expected), after major renderer refactors (H-PROJ-A-5). Process: regenerate `business-rule-set.baseline.json`; PR comment explaining cause + expected delta. Never commit a baseline silently. |
| CI-PROJ-3 | **Artifact retention** — `.sisyphus/evidence/task-3-business-rule-set-perf-report.json` should upload as GitHub Actions artifact for trend analysis (`actions/upload-artifact@v4`, `name: perf-evidence`). Add `.sisyphus/evidence/` to `.gitignore` (Phase 2 M-PROJ-Cleanup-4 already noted). |
| CI-PROJ-4 | **Promote `jsdoc-boilerplate-audit.mjs` family-wide** — would have caught core DOC-H-3 (16 boilerplate violations) mechanically. Caveat: add `--skip-unannotated` flag for packages at lower annotation rates (core 26%, guard/cli/mcp unknown).                                               |
| CI-PROJ-5 | **Promote `options-schema-barrel-audit.mjs` family-wide** with ~15-LOC extension covering `parseAndProject*` body shape (catches C-PROJ-2 mechanically — already noted in Phase 2).                                                                                                            |

## Medium (P2)

### Language / framework (4A)

| #          | Issue                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-PROJ-F-1 | `parseAndProject` helper accepts `z.ZodType<Options>` — doesn't structurally require strict object. Phase 2 M-PROJ-9 proposes a runtime assertion. **Type-level alternative** (4A §3.3): `Schema extends z.ZodObject<Shape, z.core.$strict>` — but Zod 4's `$strict` isn't public API; runtime assertion is pragmatic.                                                                   |
| M-PROJ-F-2 | `parseAndProjectOpenQuestionList` outlier (C-PROJ-2) throws raw `ZodError` — TS-surface defect compounding the trust-boundary defect. Sibling entrypoints throw typed `BoundaryParseError` with `BoundaryParseIssue[]`. Error shape is part of the function signature even when TS doesn't model it.                                                                                     |
| M-PROJ-F-3 | `Proxy<readonly TValue[]>` typing in `documentation-type-registry.ts:138-174` — the `as unknown` at `:155` is the only `as unknown` in production source. Acceptable if H-PROJ-A-9 keeps the module; better to delete (W-DOCS-1).                                                                                                                                                        |
| M-PROJ-F-4 | **`Set.has` doesn't narrow — TypeScript library-design limit.** `lib.es2015.collection.d.ts` types `Set<T>.has(value: T): boolean` without a type-predicate. Confirmed sites: `session-context.internal.ts:264`, `render-compact-text.ts:454`, `scope-readiness.internal.ts:164`. All need the same recipe: export `isProcessStatusValue` / `isDeliverableStatus` type-guards from core. |
| M-PROJ-F-5 | `NO_DEFAULT_RAW_OPTIONS = Symbol(...)` sentinel at `parse-and-project.internal.ts:9` weakens the type signature (`defaultRawOptions: unknown`). Phase 2 M-SIMP-9 proposes explicit `defaults?: Options` parameter.                                                                                                                                                                       |
| M-PROJ-F-6 | `type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata` at `:53` — two names for the same shape. TS only catches via structural identity.                                                                                                                                                                                                                                  |
| M-PROJ-F-7 | `DependencyTreeNodeSchema: z.ZodType<DependencyTreeNode> = z.strictObject({...children: z.array(z.lazy(...))})` at `supporting.ts:85-92` is the **correct Zod 4 recursive idiom** (preserve), but inverts type-from-schema direction. Acceptable because Zod 4 can't infer recursive lazy unions.                                                                                        |

### CI / DevOps (4B)

| #           | Issue                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| M-PROJ-CI-1 | Tarball: 582 files / 290 maps (50%) — same family fix as core CL-CORE-3.                                              |
| M-PROJ-CI-2 | `vitest.perf-report.config.mjs` is a maintenance fork (Cleanup-H-PROJ-2). Resolving collapses TC-PROJ-H-2 sequencing. |
| M-PROJ-CI-3 | `typecheck` covers only `tsconfig.test.json` — same drift as core CL-CORE-11. Family-wide PR.                         |

## Low (P3)

| #           | Source | Issue                                                                                                                                                                    |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L-PROJ-F-1  | 4A     | No `z.input<typeof Schema>` usage — Options schemas don't use `.default()`/`.transform()` so `z.input ≡ z.infer`. Flag for follow-up if defaults arrive.                 |
| L-PROJ-F-2  | 4A     | `ProjectionContext` hand-written (covered by H-PROJ-F-2).                                                                                                                |
| L-PROJ-F-3  | 4A     | `BLOCK_TYPES = new Set<BlockType>([...])` at `blocks/schema.ts:127-137` lists 9 entries by hand. Recipe: derive from `BlockSchema.options.map(o => o.shape.type.value)`. |
| L-PROJ-F-4  | 4A     | `isBlock` at `:139-146` casts `(value as { type: BlockType }).type` for `Set.has` — avoidable via `'type' in value` guard.                                               |
| L-PROJ-F-5  | 4A     | `Object.getPrototypeOf(value)` chain in `render-json.ts:205-217` — correct + defensive — preserve.                                                                       |
| L-PROJ-F-6  | 4A     | 4-5 `as const satisfies T` sites — correct TS 5 idiom, preserve.                                                                                                         |
| L-PROJ-F-7  | 4A     | 147 `import type` declarations across the package; ESM hygiene is reference quality.                                                                                     |
| L-PROJ-CI-1 | 4B     | `publishConfig.provenance: true` declared but no workflow issues attestation (family-wide; core CI-2). Once publish workflow lands, projection benefits automatically.   |
| L-PROJ-CI-2 | 4B     | Test include pattern divergence (`tests/features/**` vs core's `tests/steps/**`) — pick one family convention.                                                           |

## Zod 4 audit summary (projection-side)

| Site                                                                                         | Verdict                                          | Notes                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| All 107 `z.strictObject` sites                                                               | **Correct**                                      | Zero `z.object`. Reference quality.                                   |
| `PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })`                          | **Drift** (`.omit()` strips strictness in Zod 4) | NEW finding from 4A — Phase 1 only caught the `.extend()` downstream. |
| `PatternDetailSchema = PatternIdentitySchema.extend({...})`                                  | **Drift** (`.extend()` strips)                   | Phase 1 C-PROJ-1.                                                     |
| `EmbeddedDeliverableManifestSchema = ...omit().extend({...})`                                | **Drift** (both ops strip)                       | Phase 1 C-PROJ-1; compounded.                                         |
| `DependencyTreeNodeSchema = z.ZodType<DependencyTreeNode>: z.strictObject({...z.lazy(...)})` | **Correct (recursive Zod 4 idiom)**              | Preserve.                                                             |
| `FragmentSchema = z.discriminatedUnion('kind', [...43])`                                     | **Correct**                                      | Reference for tagged unions.                                          |
| `parseAtBoundary(OptionsSchema, rawOptions)` via `parseAndProject`                           | **Correct**                                      | Family reference for trust-boundary parsing.                          |
| `renderJson` defensive validation chain                                                      | **Correct**                                      | Family reference for JSON serialization safety.                       |

## TS strictness audit (projection-side)

**Clean across the board** with one `Set.has` narrowing limit (TS library design, not strictness gap):

| Issue type                                    | Count | Where                                                                |
| --------------------------------------------- | ----- | -------------------------------------------------------------------- |
| `noPropertyAccessFromIndexSignature` defeated | **0** |                                                                      |
| `noUncheckedIndexedAccess` evaded             | **0** |                                                                      |
| `Record<string, unknown>` builders            | **0** |                                                                      |
| Strictness lies                               | **0** |                                                                      |
| `as unknown as X`                             | **0** |                                                                      |
| `any`                                         | **0** | Enforced.                                                            |
| `as keyof typeof X` after `Set.has`           | **3** | Family-wide; needs core to export `isProcessStatusValue` type-guard. |

## CI/DevOps audit summary

| Concern                          | Status                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `prepack` placement              | **Correct** (unlike core).                                                                             |
| `prepack` command                | `pnpm clean && pnpm build` — aligned.                                                                  |
| Test script discipline           | **Most disciplined in family** — `barrel-audit && jsdoc-boilerplate-audit && typecheck && vitest run`. |
| `typecheck` scope                | Drift — covers only test-config; same as core CL-CORE-11.                                              |
| `lint` glob                      | `eslint src tests` — aligned.                                                                          |
| `eslint` in devDeps              | Explicit — aligned.                                                                                    |
| 7 subpath `exports`              | **All resolve to real artifacts** (unlike core's `./roles`).                                           |
| `publishConfig.provenance: true` | Declared, unimplemented (family blocker — core CI-2).                                                  |
| Custom audit scripts             | **2 scripts only in projection** — promote to family-wide.                                             |
| Perf gate                        | **Implemented + unwired** — one-line fix unlocks.                                                      |
| Tarball                          | 582 files, 50% maps — same family CL-CORE-3 fix.                                                       |
| Module-load side effects         | **None** (unlike core's `self-hosting.ts`).                                                            |
| CI workflows                     | **None at repo level** — family gap (core CI-1).                                                       |

## What's family-reference quality (preserve and promote)

[4A] flagged 7 modules/patterns as family reference:

1. **`parseAndProject` + `parseAtBoundary` chain** (`_shared/parse-and-project.internal.ts`) — trust-boundary pattern other packages should adopt.
2. **`StrictKindTable<Out, Options, Kinds>` + `dispatchByKind`** (`renderers/_shared/dispatch.ts`) — compile-time exhaustive dispatch (needs H-PROJ-F-1 fix to be self-enforcing).
3. **`renderJson` defensive validation** — exhaustive rejection of unsafe values with JSON path in every error.
4. **`DependencyTreeNodeSchema = z.ZodType<...>: z.strictObject({...z.lazy(...)})`** — Zod 4 recursive idiom.
5. **60% `@architect-pattern` annotation rate** — 2× core's; achievable with discipline.
6. **Custom audit scripts** — only mechanical surface audits in the family. Promote.
7. **`as const satisfies T` + 147 `import type` + zero `node:` unprefixed legacy imports** — ESM hygiene reference.

## Recommended landing order (Phase 4 angle)

1. **Cleanup-C-PROJ-1** (1 line) — wire the perf gate.
2. **Cleanup-H-PROJ-2** (collapse `vitest.perf-report.config.mjs`) — resolves TC-PROJ-H-2 sequencing.
3. **C-PROJ-1 + CP4A-Sharpened-1** — Zod 4 `.extend()`/`.omit()` strictness sweep at `pattern-summary.ts`/`pattern-detail.ts`/`supporting.ts`. Same recipe as core F4A-H-6.
4. **C-PROJ-2 + audit-script extension** — promote `options-schema-barrel-audit.mjs` to catch trust-boundary outliers mechanically.
5. **CL-CORE-3 (family-wide)** — disable `sourceMap`/`declarationMap` in `tsconfig.architect-base.json`. Halves projection's tarball.
6. **H-PROJ-F-1** — derive `MarkdownNormalizerKind` from `FragmentSchema`; compile-time exhaustiveness assertion.
7. **H-PROJ-F-2** — `isProjectionContext` brand on public entrypoints.
8. **M-PROJ-F-4 sweep** — `isProcessStatusValue`/`isDeliverableStatus` type-guards from core; drop projection-side casts at 3 sites.
9. **Audit-script promotion** — `jsdoc-boilerplate-audit.mjs` family-wide (with `--skip-unannotated`).
10. **CI workflows** (`.github/workflows/{ci,publish}.yml`) — family-wide effort; projection's test script is the most disciplined template.

## Critical context for Phase 5

- Projection is the **family reference** for TS/Zod 4 idioms. The master report should explicitly recommend cross-package promotion of the patterns.
- The Zod 4 `.extend()`/`.omit()`/`.pick()`/`.partial()`/`.required()` strictness-loss bug is **family-wide**, not package-specific. Master report should propose a single audit script that scans all packages (~15 LOC).
- The audit-script promotion (4 of 5 packages lack `jsdoc-boilerplate-audit.mjs`; same for `options-schema-barrel-audit.mjs`) is a family-wide normalization opportunity.
- The perf gate + 60% annotation rate are **achievements worth preserving** — Master report should call them out as engineering culture markers.
