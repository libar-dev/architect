# architect-core — Phase 2 Consolidated: Simplification & Cleanup

**Sources:** `raw/2A-simplification.md` (code-simplifier:code-simplifier) + `raw/2B-cleanup.md` (codebase-cleanup:code-reviewer).
This phase replaces the orchestrator's default Security & Performance per user instruction. Findings tagged **[2A]**, **[2B]**, or **[2A+2B]**.

## Executive Summary

Phase 2 is **additive** to Phase 1 — it found new issues, not duplicates. The simplification agent delivered concrete after-shapes for every Phase 1 finding (recipes, not opinions) and identified two angles Phase 1 underplayed. The cleanup agent surfaced **two real publish-time bugs** plus a 2× tarball-size win.

Highlights you act on first:

1. **Real publish-time bug: misplaced `prepack` script.** `package.json:66` declares `"prepack": "pnpm build"` at the top level instead of inside `"scripts"`. npm and pnpm silently ignore top-level lifecycle keys. Every sibling has it correctly inside `scripts`. **A publish without a fresh manual `pnpm build` ships stale `dist/`.** Trivial one-line fix.
2. **Broken `./roles` export with zero workspace callers.** Phase 1 framed C-CORE-1 as "pick one shape and ship it." Cleanup audit confirms zero workspace consumers of `@libar-dev/architect-core/roles` — the right action is **delete the export block**, not author a barrel.
3. **Publish tarball is 50% source-maps + a 509KB `.d.ts`.** `npm pack --dry-run` shows 212 of 426 files are `.map` files; `dist/validation-schemas/pattern-graph.d.ts` is 10,438 lines (from 179 lines of source). Turning off `sourceMap`/`declarationMap` for publish (at `tsconfig.architect-base.json`) roughly halves the install footprint.
4. **10 additional dead exports** beyond Phase 1's `presentation-contracts`/`cli-schema`/BC-aliases sweep: `parseMarkdownToBlocks` (a whole dead 216-line file), `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError`. All grep-verified zero callers.
5. **Three highest-leverage simplifications** (each removes 100+ LOC without behavior change): collapse the sync/async Gherkin extractor (H-SIMP-1), replace 27× `structuredClone` with one `deepFreeze` at API construction (H-SIMP-2), and replace hand-written `PatternGraph` interfaces with `z.infer<typeof strictSchema>` (H-SIMP-3).

The simplification agent also identified **two angles Phase 1 underplayed**:

- **`extractPatternTags` + `buildGherkinRawPattern` share one fix.** Phase 1 H-CORE-15 (index signature defeating `noPropertyAccessFromIndexSignature`) and H-CORE-16 (35× quoted-key assignments) are the same recipe: build a typed `z.input<typeof ExtractedPatternSchema>` partial directly, eliminating both the index signature _and_ the quoted-key assignments in one pass.
- **`config-loader.ts` runs three validation passes for one config value.** Phase 1 (C-CORE-4 / H-CORE-4) treats these as separate doctrine issues; the simplified shape is **a single `safeParse`** — same recipe addresses both.

Additionally, the cleanup agent found a **defect masquerading as duplication**: the four duplicated `buildRoleLookup` copies (H-CORE-13) are called _inside per-tag loops_ in `gherkin-extractor.ts:123` and `doc-extractor.ts:76` — rebuilding the role map on every tag instead of once per extraction. So H-CORE-13 isn't just DRY; it's a real allocation-per-tag-resolved bug that the consolidated helper eliminates.

## Critical — fix immediately

### CL-CORE-1. `prepack` misplaced — release ships stale dist **[2B]**

`packages/architect-core/package.json:66`. `"prepack": "pnpm build"` is at JSON root, not inside `"scripts"`. **Recipe:** move into `"scripts"` and align with sibling form (`"prepack": "pnpm clean && pnpm build"`).

### CL-CORE-2. Delete `./roles` export — zero workspace callers **[2B]** (extends Phase 1 C-CORE-1)

`packages/architect-core/package.json:34-37`. Cleanup audit verified zero callers across the workspace. **Recipe:** delete lines 34-37. All roles symbols are already re-exported through the package root.

## High — fix before next release

### CL-CORE-3. Stop shipping `.map` files + audit the 509KB `pattern-graph.d.ts` **[2B]**

`tsconfig.base.json:13-15` sets `declarationMap: true, sourceMap: true`. 212/426 files in the published tarball are maps. **Recipe:** set `sourceMap: false, declarationMap: false` either in `tsconfig.architect-base.json` (family-wide one-line change) or in a per-package `prepack` re-build. After Phase 1 C-CORE-2 lands (strict + z.infer), re-measure `pattern-graph.d.ts`; if still ~500KB, consider extracting intermediate `type RE = …` aliases to control the inferred width.

### CL-CORE-4. Module-load-time `createArchitect()` in a `sideEffects: false` package **[2B]** (extends Phase 1 H-CORE-10)

`src/config/self-hosting.ts:93`. `WORKSPACE_TAG_REGISTRY = createArchitect({…}).registry` runs at every import that transitively pulls `self-hosting.ts`. **Recipe:** Phase 1 H-CORE-10 deletes the file outright (move dogfood plumbing to `architect.config.ts` / `scripts/`). If anything must remain in the package, make it a lazy `getWorkspaceTagRegistry()` function. No top-level `createArchitect`.

### CL-CORE-5. 10 additional dead exports through the barrel **[2B]**

| #    | Symbol                                                                | File                                            | Recipe                                                               |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| 1    | `parseMarkdownToBlocks`                                               | `src/utils/markdown-parser.ts:84`               | Delete whole 216-line file + barrel entry.                           |
| 2    | `formatUserZodError`                                                  | `src/utils/session-helpers.ts:22`               | Delete function + barrel re-export.                                  |
| 3    | `FEATURE_LAYERS` (constant)                                           | `src/extractor/layer-inference.ts:14`           | Delete the constant; keep the `FeatureLayer` type (used internally). |
| 4-6  | `validateStatus`/`validateCompletionMetadata`/`validatePatternStatus` | `src/validation/fsm/validator.ts:60,121,146`    | Delete; over-engineered surface nobody uses.                         |
| 7-8  | `isFullyEditable`/`isScopeLocked`                                     | `src/validation/fsm/states.ts:33,37`            | Delete; `getProtectionLevel` covers the same three-way decision.     |
| 9-10 | `createFileLoader`/`formatCodecError`                                 | `src/validation-schemas/codec-utils.ts:148,171` | Delete; only test callers.                                           |

Shrinks the public barrel by ~15 names. Directly compounds Phase 1 H-CORE-1 (barrel curation).

### CL-CORE-6. Third `void X` soft-suppression beyond Phase 1 M-CORE-2 **[2B]** (extends M-CORE-2)

`src/extractor/gherkin-extractor.ts:604` — `void metadata.status`. Phase 1 documented two; this is the third. **Recipe:** delete the line; sweep all three together per H-SIMP-9 below. Consider adding `no-restricted-syntax` ESLint rule targeting `UnaryExpression[operator="void"]` in `src/**/*.ts` so the `architect-local/no-suppression-comments` lint rule covers `void X` expressions too.

### CL-CORE-7. README points to a non-existent file **[2B]**

`packages/architect-core/README.md:14` references `src/zod-primitives.ts`. No such file exists. The actual Zod primitives live in `src/utils/argv-hygiene.ts`. **Recipe:** either rewrite the README bullet to point to `argv-hygiene.ts` and `validation/boundary.ts`, or create `src/zod-primitives.ts` as the named home and move the schemas there. The latter is the better architectural call once Phase 1 H-CORE-7 (`z.strictObject` sweep) lands and the trust-boundary surface grows.

### CL-CORE-8. Unbounded `Map` cache in `package-resolver.ts` — leak vector for MCP **[2B]**

`src/package/package-resolver.ts:34-49`. Closure-captured `Map<string, Package>` grows without bound. Fine in CLI (process exits); a slow leak in `architect-mcp` and any future server context (file watcher → re-resolve on save). **Recipe:** add `clear(): void` to the resolver type and have the MCP file-watcher invalidate on workspace changes. Or swap for a bounded LRU (1,000-entry covers realistic graphs).

### Phase 2A — Concrete simplification recipes (each removes 100+ LOC)

The simplification agent's deliverable is **after-shapes** for Phase 1's findings. Each entry below cross-references the Phase 1 ID and a short recipe header; full code recipes are in `raw/2A-simplification.md`.

| #        | Ref (Phase 1)                            | Recipe header                                                                          | After-shape                                                                                                                                                             |
| -------- | ---------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-SIMP-1 | H-CORE-6                                 | Collapse sync/async Gherkin extractor                                                  | Private `extractOnePattern` + single async public entry; behavior-file verification `await`'d inline. Removes ~135 LOC.                                                 |
| H-SIMP-2 | H-CORE-8, M-CORE-14, M-CORE-8            | Replace 27× `structuredClone` with one `deepFreeze` at construction                    | `createPatternGraphAPI` shrinks from 348 to ~210 lines. `cloneTagRegistry` dissolves. Mutations through the API throw in dev. Directly benefits projection's perf gate. |
| H-SIMP-3 | C-CORE-2, H-CORE-7, L-CORE-13, M-CORE-10 | Strict schemas + `z.infer` for `PatternGraph` + siblings                               | Schema is the type-of-record; `nameIndex` moves to `RuntimePatternGraph` (already exists for `workflow`). Sweep ~28 `z.object` → `z.strictObject` in one PR.            |
| H-SIMP-4 | H-CORE-13                                | One `buildRoleLookup` in `utils/role-lookup.ts`                                        | Removes ~80 LOC AND eliminates per-tag-iteration rebuilds. Real bug fix, not just DRY.                                                                                  |
| H-SIMP-5 | H-CORE-15, H-CORE-16                     | Typed `z.input<typeof ExtractedPatternSchema>` partial                                 | Eliminates the index signature AND the 35 quoted-key assignments in `buildGherkinRawPattern`. Pre-condition: H-SIMP-3.                                                  |
| H-SIMP-6 | H-CORE-14, M-CORE-11                     | One `applyTagValue` applier in `taxonomy/tag-parsing.ts`                               | `parseDirective` shrinks to ~40 LOC glue; `extractPatternTags` becomes a Gherkin tokenizer + applier call. Drift impossible.                                            |
| H-SIMP-7 | C-CORE-4, H-CORE-4                       | Single `safeParse` in config-loader, delete `isProjectConfig` + presentation-contracts | One-pass validation. Z.strictObject names the legacy keys in its error message.                                                                                         |
| H-SIMP-8 | H-CORE-12                                | Delete 6 BC alias schemas in `feature.ts`                                              | Pure deletion.                                                                                                                                                          |
| H-SIMP-9 | M-CORE-2, CL-CORE-6                      | Delete `void extractionWarnings`, `void inferMaturity`, `void metadata.status`         | Either surface the warnings via diagnostics channel (preferred) or delete the accumulator entirely.                                                                     |

### Phase 2A — Medium simplification recipes (defect-grade or substantial clarity wins)

| #         | Ref       | Recipe header                                                                                                                                                    |
| --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-SIMP-1  | (new)     | `dual-source-extractor.extractProcessMetadata`: replace 13× `tags.find(...).replace(...)` with one pass + Map lookup.                                            |
| M-SIMP-2  | C-CORE-5  | `validateTransition`: discriminated union — `{ valid: false; from: string; to: string }` so `as ProcessStatusValue` casts disappear.                             |
| M-SIMP-3  | L-CORE-5  | `compareContexts`: snapshot relationships once, pass map to helpers.                                                                                             |
| M-SIMP-4  | (new)     | `populateByRoleView`: initialize buckets in canonical order = output order; eliminate the second sort pass.                                                      |
| M-SIMP-5  | (new)     | `mergeTagRegistries`: drop nested closure; use Map-from-tuple iterator.                                                                                          |
| M-SIMP-6  | L-CORE-10 | `Result.unwrap`: `safeStringify` wrapper around `JSON.stringify` for circular refs. **Defect-grade for a shipped helper.**                                       |
| M-SIMP-7  | L-CORE-11 | `package-config.ts`: re-declare `PackageConfigSchema = z.strictObject({ ...PackageSchema.shape, … })` — Zod v4 `.extend` doesn't propagate strict.               |
| M-SIMP-8  | (new)     | `findPatternByName`: split into `findPatternByNameInArray` + `findPatternInGraph`. Requires H-SIMP-3 to be airtight.                                             |
| M-SIMP-9  | M-CORE-9  | One `cloneRoleDefinitions` in `taxonomy/registry-builder.ts`; delete `cloneRoles` from `factory.ts`. (After H-SIMP-2 lands, both may go entirely.)               |
| M-SIMP-10 | (new)     | `extractDataTable`/`extractExamples`: share a `mapRows(headers, rows)` helper.                                                                                   |
| M-SIMP-11 | M-CORE-13 | `asModuleId`: call `asPatternId` or delete.                                                                                                                      |
| M-SIMP-12 | L-CORE-4  | `camelCaseToTitleCase`: precompute acronym regex table at module scope. **Also fixes a latent 26-acronym ceiling bug** in the placeholder char encoding.         |
| M-SIMP-13 | L-CORE-8  | `inferPatternName`: return `undefined` + emit diagnostic instead of `"unknown-pattern"`.                                                                         |
| M-SIMP-14 | L-CORE-6  | `aggregateTagUsage`: drive from `dataset.tagRegistry.metadataTags`. **Also fixes a latent defect** (`'arch-context'` lookup vs `boundedContext` field mismatch). |
| M-SIMP-15 | M-CORE-1  | Move `getPatternName` to `validation-schemas/extracted-pattern.ts`; both pipeline and read-api import from there. Resolves H-CORE-2 from one direction.          |
| M-SIMP-16 | (new)     | `parseTestsValue`: use `Set` membership for truthy/falsy keyword lookup.                                                                                         |
| M-SIMP-17 | Sweep     | Defensive copies of readonly arrays become pure overhead once H-SIMP-2 + H-SIMP-3 land. Sweep last.                                                              |

### Sweep patterns (small individually; large in aggregate)

1. **`omitUndefined()` helper** in `utils/object-utils.ts` to replace the ubiquitous `...(x !== undefined && { x })` spreads. Each builder loses ~10-30 lines. Apply selectively after H-SIMP-3.
2. **`pushToMultimap`/`pushToRecord` helpers** for the 6× repeated `Map.get(k) ?? []; existing.push(v); Map.set(k, existing)` idiom across `transform-dataset.ts`, `gherkin-ast-parser.ts`, `dual-source-extractor.ts`. Justified — six identical 4-line copies is over the "three similar lines" threshold.
3. **`formatZodIssues(error)` helper** consolidating the 6× repeated `error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)`.
4. **Header-index `Map`** for the 6× `headers.findIndex(h => h.toLowerCase() === 'xxx')` in `dual-source-extractor.ts`.
5. **In-place `.push` instead of `[...arr, x]` allocations** in the per-tag loops in `gherkin-ast-parser.ts` and `transform-dataset.ts`.
6. **Once H-SIMP-6's typed applier lands, ~16 `as ProcessStatusValue` / `as DocDirective['level']` / `as string[]` casts in `ast-parser.ts:279-296` disappear automatically.**

## Medium — plan for next sprint

### CL-CORE-9. README documents 4 trust-boundary primitives; code has 5 **[2B]**

`README.md:11-18` lists `zod-primitives.ts` (doesn't exist), `errors.ts`, `session-helpers.ts`, `argv-hygiene.ts` — and omits the actual `validation/boundary.ts` (which has `parseAtBoundary` + `BoundaryParseError`). Documentation-side mirror of Phase 1 H-CORE-3. **Recipe:** when fixing CL-CORE-7, add `validation/boundary.ts` to the bullet list and consider consolidating `argv-hygiene.ts`'s schemas into `validation/boundary.ts` for one home.

### CL-CORE-10. `lint` script doesn't lint `tests/` — siblings do **[2B]**

`package.json:43`. `"lint": "eslint src"` vs every sibling's `"lint": "eslint src tests"`. `tests/` is 51 step files. **Recipe:** add `tests` to the glob.

### CL-CORE-11. `typecheck` only covers `tsconfig.test.json` **[2B]**

`package.json:42`. Splits with sibling convention — `architect-guard` and `architect-cli` run both `tsconfig.json` AND `tsconfig.test.json`. **Recipe:** align with `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` (also for `architect-projection` and `architect-mcp` if family consistency matters).

### CL-CORE-12. Eager IIFE in scanner: `DEFAULT_BUILDERS` runs at every import **[2B]**

`src/scanner/gherkin-ast-parser.ts:49-52`. Lighter than `self-hosting.ts` but the same anti-pattern. **Recipe:** convert to lazy memo (`let _defaultBuilders: RegexBuilders | undefined; function defaultBuilders() { ... }`).

### CL-CORE-13. Resolve M-CORE-12 (`console.warn` in dual-source-extractor) via signature change **[2B]** (extends Phase 1 M-CORE-12)

Both `console.warn` sites already have a diagnostic channel in scope. **Recipe:** widen `extractProcessMetadata` to return `{ value: ProcessMetadata | null; diagnostics: ExtractionDiagnostic[] }`. Push validation errors as diagnostics. Removes the only remaining `console.*` in `src/`.

### CL-CORE-14. Drop redundant `"module"` field (family-wide) **[2B]**

`package.json:22-23` — `"main": "dist/index.js", "module": "dist/index.js"`. `module` is a pre-ESM legacy field; in a `"type": "module"` package with `exports`, `main` is sufficient. **Recipe:** delete the `"module"` line in core and every sibling.

### CL-CORE-15. `DEFAULT_PRESENTATION_OUTPUT_DIRECTORY` follows presentation-contracts to the trash **[2B]** (rider on Phase 1 H-CORE-4)

`src/config/defaults.ts` exports this constant; re-exported at `src/index.ts:8`. Zero workspace consumers beyond the barrel re-export. **Recipe:** include in the H-CORE-4 deletion sweep.

### CL-CORE-16/17. Cross-package duplication: fuzzy-match and `extractFirstSentenceRaw` exist in both core and projection **[2B]** (cross-package — Phase 1 didn't span packages)

`architect-projection/src/projections/_shared/pattern-helpers.internal.ts` re-implements `levenshteinDistance`, `findBestMatch`, and `extractFirstSentenceRaw`. The latter actually creates an import-name collision in the projection file (it both imports the name from core AND defines a local one — order-dependent shadowing). **Recipe:** delete the projection-side copies (lines 274 and 432-484 of that file); import from `@libar-dev/architect-core`. Verify no behavioral drift before deleting. **This finding informs the architect-projection review next.**

## Low — backlog

| #          | Ref              | Issue                                                                                                                                       |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CL-CORE-18 | (cosmetic)       | `tsconfig.tsbuildinfo` is gitignored but projection explicitly sets `tsBuildInfoFile`; cosmetic drift either direction.                     |
| CL-CORE-19 | (with CL-CORE-1) | When fixing CL-CORE-1, write `"prepack": "pnpm clean && pnpm build"` to match siblings — without `clean`, stale type artifacts can survive. |
| L-SIMP-1   | L-CORE-1         | `discoverTaggedShapes` — build JSDoc index once via `prepareJsDocComments`, not per declaration.                                            |
| L-SIMP-2   | L-CORE-2         | Hoist `extractShapeTag`/`extractIncludeTag` regexes to module scope.                                                                        |
| L-SIMP-3   | L-CORE-3         | `extractFirstSentenceRaw` regex misses `?!`/`.)` combos.                                                                                    |
| L-SIMP-4   | L-CORE-7         | In-place `.push(...)` instead of spread in metadata accumulators.                                                                           |
| L-SIMP-5   | L-CORE-14        | Validate `getPatternsByQuarter(string)` against `QUARTER_PATTERN` or use branded `Quarter`.                                                 |
| L-SIMP-6   | L-CORE-12        | Consolidate tiny `utils/` files.                                                                                                            |
| L-SIMP-7   | (new)            | `loadConfig` 14-line adapter — inline at the one call site or delete.                                                                       |
| L-SIMP-8   | M-CORE-11        | Split `parseDirective` state-machine loop into separate `extractDescription`/`extractExamples` passes.                                      |
| L-SIMP-9   | (new)            | `extractCsvValue` returns `undefined` for no-match but `[]` for empty post-split — pick one.                                                |
| L-SIMP-10  | (new)            | `findIntegrationPoints` — single pass over `[['uses', …], ['dependsOn', …]]` config instead of two inner loops.                             |

## Configuration audit (from 2B, condensed)

| Setting                | Verdict                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `prepack` location     | **CRITICAL DRIFT** — top-level in core, scripts in 4 siblings (CL-CORE-1).                           |
| `prepack` command      | Drift — `pnpm build` in core, `pnpm clean && pnpm build` in siblings.                                |
| `scripts.lint`         | Drift — core misses `tests` glob.                                                                    |
| `scripts.typecheck`    | Mixed — core matches projection/mcp; differs from guard/cli.                                         |
| `scripts.test` shape   | Core lacks the `pnpm typecheck && vitest run` guard siblings have.                                   |
| `package.json:exports` | **Broken `./roles` subpath** (CL-CORE-2).                                                            |
| `main` + `module`      | Family-wide cosmetic redundancy (CL-CORE-14).                                                        |
| `tsconfig.json:types`  | Projection pins `["node"]` explicitly; others rely on base config — worth confirming.                |
| `vitest:include`       | Drift — core uses `tests/steps/**`, projection uses `tests/features/**`. Pick one family convention. |
| `eslint` in devDeps    | Drift — core relies on root hoist; siblings declare explicitly.                                      |

## Dependency audit verdict (from 2B)

**Healthy across the family.** Every shared dep (`zod ^4.1.11`, `glob ^10.3.10`, `vitest ^4.1.4`, `@types/node ^24.12.0`, `typescript ^5.8.2`, `@amiceli/vitest-cucumber ^6.3.0`) is pinned identically across all five publishable packages. No declared dep is unused in `src/`; no devDep is imported from `src/`. Notable discipline for a multi-package pnpm workspace.

One small action: **add `"eslint": "^9.17.0"` to `architect-core/devDependencies`** — works today via root hoist, but every sibling declares it explicitly. Either every package owns its lint toolchain or none does; family convention is the former.

## Files that should not be in `dist/`

| Path pattern                                   | Count                      | Recipe                                                                 |
| ---------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `dist/**/*.{js,d.ts}.map`                      | 212 of 426 published files | CL-CORE-3 — disable in base config.                                    |
| `dist/config/self-hosting.{js,d.ts}`           | 2                          | Delete the file (H-CORE-10).                                           |
| `dist/config/presentation-contracts.{js,d.ts}` | 2                          | Delete the file (H-CORE-4).                                            |
| `dist/config/cli-schema.{js,d.ts}`             | 2 (24.5KB JS)              | Move to `architect-cli` (H-CORE-5).                                    |
| `dist/config/tag-registry-contract.{js,d.ts}`  | 2                          | Delete after C-CORE-3 consolidation.                                   |
| `dist/extractor/layer-inference.{js,d.ts}`     | 2                          | Delete hardcoded path heuristics (H-CORE-11).                          |
| `dist/utils/markdown-parser.{js,d.ts}`         | 2                          | Delete the file (CL-CORE-5 #1).                                        |
| `dist/validation-schemas/pattern-graph.d.ts`   | 1 file, 509 KB             | Measure after C-CORE-2 + H-CORE-7; consider intermediate type aliases. |

Estimated impact of full Phase-1+Phase-2 cleanup: **426 files / 195.8 KB packed / 1.5 MB unpacked → ~170-180 files / under 100 KB packed / ~600 KB unpacked.** 2× reduction without losing a consumer-visible API.

## Recommended landing order

(From 2A, with 2B's publish bugs added at the top because they're trivial unblocks.)

1. **CL-CORE-1** (move `prepack` into `scripts`) — 1 line, unblocks reliable releases.
2. **CL-CORE-2** (delete `./roles` export block) — 4 lines.
3. **CL-CORE-3** (disable `sourceMap`/`declarationMap` for publish) — 2 lines in base config, family-wide.
4. **H-SIMP-3** (strict schemas + `z.infer`) — foundation for everything else.
5. **H-SIMP-7, H-SIMP-8, H-SIMP-9, CL-CORE-5, CL-CORE-6** (deletions) — pure removals.
6. **CL-CORE-4 + H-CORE-10** (delete `self-hosting.ts`) — move workspace plumbing to `architect.config.ts`.
7. **H-SIMP-4** (one `buildRoleLookup`) — prerequisite for H-SIMP-6.
8. **H-SIMP-5** (typed `buildGherkinRawPattern`) — needs strict schemas.
9. **H-SIMP-6** (one tag applier) — refactors both parsers.
10. **H-SIMP-1** (collapse sync/async extractor) — wraps H-SIMP-5/6.
11. **H-SIMP-2** (deep-freeze API) — independent; biggest perf win after schemas are strict.
12. **Medium recipes + sweeps** opportunistically.

## What's already clean (don't refactor)

- `src/utils/fuzzy-match.ts` — concise Levenshtein with the right swap pattern.
- `src/validation/fsm/transitions.ts` — small, table-driven, exhaustive error messages.
- `src/types/result.ts` — discriminated `Ok`/`Err`; one one-liner fix (M-SIMP-6) and it's perfect.
- `src/validation/boundary.ts` — `parseAtBoundary` is the right shape; the problem is non-use inside core (H-CORE-3), not the helper itself.
- `src/extractor/extraction-diagnostics.ts` — closed enum, exhaustive severities; only minor move per M-CORE-5.
- `src/types/errors.ts` — discriminated `DocError` union + factory functions. Verbose but the right shape.

## Critical context for Phase 3

Phase 3 (Testing & Documentation) should know:

- **51 test files in `tests/` and 51 step files implied by the Cucumber convention.** Phase 2 audit revealed `architect-core` doesn't lint `tests/` (CL-CORE-10) — there is likely soft-suppression / dead-import debt in the test surface that the lint sweep would have caught.
- **Several `validation/fsm/` symbols are tested but have zero non-test callers** (CL-CORE-5 #4-#8: `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`). Phase 3 should flag whether these are test-only over-coverage (tests exist for things nothing in production uses) or a sign that the symbols should be promoted to production use, not deleted.
- **The 318-pattern dogfood graph is the realistic load.** Test coverage analysis should sample at that scale, not just unit tests.
- **README is partially stale (CL-CORE-7, CL-CORE-9).** Phase 3 documentation review will likely confirm and extend.
- **The `parseAtBoundary` helper is exported but unused inside core** (Phase 1 H-CORE-3) — phase 3 should check whether the test surface itself uses it correctly.
