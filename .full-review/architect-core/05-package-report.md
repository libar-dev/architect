# `@libar-dev/architect-core` — Consolidated Review Report

**Package:** `@libar-dev/architect-core@2.0.0-pre.1`
**Path:** `/Users/darkomijic/dev-projects/architect/packages/architect-core/`
**Size:** 106 source files, ~12,360 SLOC, 51 test files, 28 ADRs across the repo
**Role in family:** Foundation — no inbound workspace deps; consumed by `projection`, `guard`, `cli`, `mcp`.
**Source phases:** [01-quality-architecture](./01-quality-architecture.md), [02-simplification-cleanup](./02-simplification-cleanup.md), [03-testing-documentation](./03-testing-documentation.md), [04-best-practices](./04-best-practices.md). Raw outputs from 8 agents in `./raw/`.

## Executive Summary

`architect-core` has the right structural and idiomatic posture: clean dependency direction at the package level, well-chosen primitives (`Result<T,E>` + discriminated `DocError` union, branded types via Zod, `parseAtBoundary` + `BoundaryParseError`), zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME` in `src/`, all four TS strictness flags on, and a single-pass `transformToPatternGraph` with pre-computed views that backs the read API in O(1). Eight independent agents across four review dimensions converged on the same diagnosis: **the package's _idioms_ are correct, but its _application_ of those idioms is uneven on three of its most load-bearing surfaces, and the CI automation that would enforce uniformity does not exist.**

The cost is concentrated in five clusters:

1. **The central `PatternGraphSchema` + `TagRegistry` contracts breach the Zod-first doctrine the package preaches.** `PatternGraphSchema` (the ADR-006 single read model) is open `z.object`, shadowed by a hand-written interface adding `nameIndex` the schema doesn't validate. `RoleDefinition`/`TagRegistry`/`MetadataTagDefinition` exist twice — as `config/` interfaces and as `validation-schemas/` Zod schemas that re-export the interface types. 28 schemas across `validation-schemas/` use `z.object` where the doctrine requires `z.strictObject`. Both code-quality and architecture reviewers caught these independently.
2. **The extractor/scanner tag-parsing complex has substantial duplication and TS-strictness evasion.** Near-clone sync/async `extractPatternsFromGherkin`/`Async` (~135 LOC duplicated, already drifted on `unrecognizedEnums`); four copies of `buildRoleLookup` (two called _inside per-tag loops_, rebuilding the map on every tag — a real allocation bug masquerading as duplication); two parallel `@architect-*` tag parsers (JSDoc + Gherkin) implementing the same format dispatch; a `Map<string, unknown>` builder with 16 `as` casts at `ast-parser.ts:279-296`; an index signature `[key: string]: unknown` on `extractPatternTags` that defeats `noPropertyAccessFromIndexSignature` and propagates across module boundaries via `ReturnType<...>`; `buildGherkinRawPattern` building a `Record<string, unknown>` with 35 typo-silent quoted-key assignments.
3. **Dogfood plumbing and dead surface ships in the published library.** `self-hosting.ts` calculates a workspace root at module load and exports it (module-load side effect in a `sideEffects: false` package); `layer-inference.ts` hardcodes `/orders/` and `/inventory/` as "domain" cues; `presentation-contracts.ts` defines obsolete `CodecOptions`/`ReferenceDocConfig` types kept alive by a string-concat (`'codec' + 'Options'`) strip in `config-loader.ts`; `cli-schema.ts` (610 lines, 22KB) is a CLI concern hosted in core; 6 BC alias schemas in `feature.ts`; 10 additional dead exports (`parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`/`validateCompletionMetadata`/`validatePatternStatus`, `isFullyEditable`/`isScopeLocked`, `createFileLoader`, `formatCodecError`). All grep-verified zero workspace callers.
4. **The package's own trust-boundary primitive is invisible from every angle.** `parseAtBoundary` is exported as the canonical trust-boundary helper but is unused inside `architect-core`'s own `src/`; has zero test coverage; has no `@architect-pattern` annotation so it's missing from the PatternGraph and generated docs; and the README's "Boundary validation" section points to dead alternatives (`formatZodError`, `parseOrThrow`, `src/zod-primitives.ts`) and never mentions the real one.
5. **No CI/CD pipeline exists.** All quality gates run on developer discipline. `publishConfig.provenance: true` is declared with no workflow to issue the attestation. `prepack` is misplaced at JSON root in `package.json:66`, silently ignored by npm/pnpm, so the manual publish path ships stale `dist/` if anyone forgets to `pnpm build` first. The published tarball is 50% source-map files (212/426) and includes a 509KB `.d.ts` from a 179-line source. `lint` doesn't cover `tests/`; `typecheck` doesn't cover `src/`; `test` skips typechecking; `eslint` isn't in core's devDeps (relies on root hoist). Every variance is small; aggregate cost is real.

There is also one **install-time bug** of independent importance: `package.json:34-37` declares an `./roles` export pointing to `dist/roles.{js,d.ts}` files that `tsc -b` never produces, with zero workspace callers. Any consumer doing `import … from '@libar-dev/architect-core/roles'` gets a 404 at install or runtime resolve.

The Phase 3 investigation also **rectified a Phase 2 framing error**. CL-CORE-5 had flagged 5 FSM symbols as "tested but not consumed"; Phase 3A's full-workspace grep showed **none of the five have tests at all** (they're "exported but not consumed"), and `validateTransition` — NOT on Phase 2's list — is the actually-consumed function (by `architect-guard/src/lint/process-guard/decider.ts:300`), AND it is the one that casts strings to `ProcessStatusValue` after the type guard rejected them. So the most critical TS-strictness breach in the package is on the production path of another package.

## Findings by Priority

### Critical (P0 — must fix before next release)

| ID           | Title                                                                                                                                                | Source phase                           | Locations                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **C-CORE-1** | Broken `./roles` export — install/resolve break                                                                                                      | Phase 1 (1B) + Phase 2                 | `package.json:34-37`                                                                                            |
| **C-CORE-2** | `PatternGraphSchema` is `z.object` + hand-written `PatternGraph` interface drifts from it                                                            | Phase 1 (1A+1B), Phase 4               | `src/validation-schemas/pattern-graph.ts:42-179`                                                                |
| **C-CORE-3** | Duplicate type-of-record for `TagRegistry`/`RoleDefinition`/`MetadataTagDefinition`/`AggregationTagDefinition`                                       | Phase 1 (1A+1B)                        | `src/config/tag-registry-contract.ts`, `src/config/role-constants.ts`, `src/validation-schemas/tag-registry.ts` |
| **C-CORE-4** | `isProjectConfig` hand-coded guard duplicates schema keys; config parsed twice via three layers (`isProjectConfig` + IIFE strip + `safeParse`)       | Phase 1 (1A)                           | `src/config/project-config-schema.ts:118-141`, `src/config/config-loader.ts:188-196`                            |
| **C-CORE-5** | `validateTransition` casts strings to `ProcessStatusValue` after `isValidStatusValue` rejected them — **flows into architect-guard production path** | Phase 1 (1A), Phase 4 (F4A-C-1)        | `src/validation/fsm/validator.ts:88-105`                                                                        |
| **C-CORE-6** | `prepack` at JSON root not in `scripts` — publish silently ships stale `dist/`                                                                       | Phase 2 (CL-CORE-1), Phase 4           | `package.json:66`                                                                                               |
| **C-CORE-7** | `z.function().optional()` is Zod-3 idiom Zod 4 redefined; `@typescript-eslint/no-deprecated` warns. Functions don't belong in boundary contracts.    | Phase 1 (M-CORE-8) + Phase 4 (F4A-C-2) | `src/validation-schemas/tag-registry.ts:32`                                                                     |

### High (P1 — fix before stable release)

**Architecture / Code quality (15)**

| ID        | Title                                                                                                                                                                      | Locations                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| H-CORE-1  | `src/index.ts` barrel is unreviewable and leaks scanner+extractor internals                                                                                                | `src/index.ts` (272 lines, 7 wildcard re-exports)                                                                                            |
| H-CORE-2  | read-api ↔ pipeline ↔ extractor boundary tangle                                                                                                                            | `read-api/pattern-helpers.ts:18`, `read-api/pattern-classification.ts:14-15,75-77`, `extractor/{gherkin-extractor,dual-source-extractor}.ts` |
| H-CORE-3  | Trust-boundary inconsistency — `parseAtBoundary` exported, never used in core                                                                                              | `validation/boundary.ts`, `generators/pipeline/build-pipeline.ts`, `transform-dataset.ts:103`                                                |
| H-CORE-4  | Dead `presentation-contracts.ts` + `'codec' + 'Options'` obfuscated strip in config-loader                                                                                 | `config/presentation-contracts.ts`, `config/config-loader.ts:188-195`                                                                        |
| H-CORE-5  | `cli-schema.ts` (610 lines) — CLI concern hosted in core                                                                                                                   | `src/config/cli-schema.ts`                                                                                                                   |
| H-CORE-6  | Sync/async near-clone in gherkin-extractor + `ExtractedPatternSchema` parsed three times                                                                                   | `extractor/gherkin-extractor.ts:353-493 & 517-652`, `transform-dataset.ts:103`                                                               |
| H-CORE-7  | 28 schemas use `z.object` instead of `z.strictObject` — open cross-package contracts                                                                                       | `validation-schemas/{pattern-graph,output-schemas,extracted-shape,extracted-pattern}.ts`                                                     |
| H-CORE-8  | 27× `structuredClone` per `PatternGraphAPI` read; `cloneTagRegistry` hand-rebuilds registry because clone chokes on the `transform` function                               | `read-api/pattern-graph-api.ts:81-345`                                                                                                       |
| H-CORE-9  | `package/` directory name collides with `package.json` semantics + ships `ProjectionError` (projection concern) in core                                                    | `src/package/` (5 files)                                                                                                                     |
| H-CORE-10 | `self-hosting.ts` ships hardcoded workspace paths and runs `createArchitect()` at module load                                                                              | `src/config/self-hosting.ts:7,72-95,93`                                                                                                      |
| H-CORE-11 | Hardcoded `/orders/` and `/inventory/` "domain" path heuristics in core                                                                                                    | `src/extractor/layer-inference.ts:33-36`                                                                                                     |
| H-CORE-12 | 6 BC alias schemas in `feature.ts` (`ParsedStepSchema`, etc.)                                                                                                              | `src/validation-schemas/feature.ts:100-110`                                                                                                  |
| H-CORE-13 | 4× duplicated `buildRoleLookup`/`resolveCanonicalRole` — **two called inside per-tag loops**                                                                               | `extractor/{doc-extractor,gherkin-extractor}.ts`, `scanner/gherkin-ast-parser.ts`, `read-api/pattern-helpers.ts:137-139`                     |
| H-CORE-14 | Two parallel `@architect-*` tag parsers (JSDoc + Gherkin) implementing the same format dispatch                                                                            | `scanner/{ast-parser,gherkin-ast-parser}.ts`                                                                                                 |
| H-CORE-15 | `extractPatternTags` returns 42-field shape with `[key: string]: unknown` defeating `noPropertyAccessFromIndexSignature`; 2× `as UnrecognizedEnumEntry[]` reads through it | `scanner/gherkin-ast-parser.ts:364-418,494,525`                                                                                              |
| H-CORE-16 | `buildGherkinRawPattern` 35× typo-silent quoted-key assignments on `Record<string, unknown>`                                                                               | `extractor/gherkin-extractor.ts:192-339`                                                                                                     |

**Cleanup / Publish (5)**

| ID         | Title                                                                           | Locations                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CL-CORE-3  | 50% of tarball is `.map` files; 509KB `pattern-graph.d.ts`                      | `tsconfig.base.json:13-15`, `dist/`                                                                                                            |
| CL-CORE-5  | 10 additional dead exports through the barrel                                   | `markdown-parser.ts`, `session-helpers.ts:22`, `layer-inference.ts:14`, `validator.ts:60,121,146`, `states.ts:33,37`, `codec-utils.ts:148,171` |
| CL-CORE-8  | Unbounded `Map` cache in package-resolver — leak vector for `architect-mcp`     | `src/package/package-resolver.ts:34-49`                                                                                                        |
| CL-CORE-10 | `lint` glob excludes `tests/` (51 step files) — siblings include                | `package.json:43`                                                                                                                              |
| CL-CORE-11 | `typecheck` only covers `tsconfig.test.json` — type errors in `src/` undetected | `package.json:42`                                                                                                                              |

**Testing / Documentation (8)**

| ID        | Title                                                                                                                                                            | Locations                                                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| TD-CORE-1 | `parseAtBoundary` invisible from every angle (no use, no tests, no annotation, README points to wrong files)                                                     | `validation/boundary.ts`, README, `docs-live/PATTERNS.md`                                                                                       |
| TD-CORE-2 | README cites nonexistent `src/zod-primitives.ts` and dead `formatZodError`/`parseOrThrow` symbols; never mentions `buildPatternGraph` or `createPatternGraphAPI` | `packages/architect-core/README.md`                                                                                                             |
| TD-CORE-3 | `validation/fsm/` — 296 LOC, used by architect-guard, **zero test coverage**                                                                                     | `src/validation/fsm/{transitions,states,validator}.ts`                                                                                          |
| TD-CORE-4 | `src/index.ts` has no header — public contract is unidentified                                                                                                   | `src/index.ts:1`                                                                                                                                |
| TC-H-1    | 23 of 25 `PatternGraphAPI` methods have no behavioral assertions                                                                                                 | `tests/steps/read-api/pattern-graph-api.steps.ts`                                                                                               |
| TC-H-3    | All `src/utils/` modules (incl. `fuzzy-match.ts` praised in Phase 1) have zero tests                                                                             | `src/utils/`                                                                                                                                    |
| DOC-H-3   | 16 annotated files carry boilerplate "When to Use" text that's wrong for 14 of them                                                                              | `scanner/ast-parser.ts:10`, `read-api/pattern-graph-api.ts:10`, `validation/fsm/validator.ts:12`, `generators/pipeline/build-pipeline.ts:29`, … |
| DOC-H-4   | `transformToPatternGraph` (Phase 1 called it "the strongest architectural choice") has no annotation and no JSDoc                                                | `src/generators/pipeline/transform-dataset.ts:88-92`                                                                                            |

**Language / Framework (8)** — all Phase 4 (F4A-H-\*):

| ID      | Title                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| F4A-H-1 | 16× `Map.get(...) as X` casts in `parseDirective` defeat `noUncheckedIndexedAccess`                                  |
| F4A-H-2 | `extractPatternTags` index signature defeats `noPropertyAccessFromIndexSignature` (same as H-CORE-15)                |
| F4A-H-3 | Zod 4 idiom drift on `PatternGraphSchema` (same as H-CORE-7)                                                         |
| F4A-H-4 | `ReturnType<typeof extractPatternTags>` propagates the index signature across module boundaries                      |
| F4A-H-5 | `buildGherkinRawPattern` typo-silent (same as H-CORE-16) — recipe: use `z.input<typeof ExtractedPatternSchema>`      |
| F4A-H-6 | `PackageConfigSchema = PackageSchema.extend({...})` — Zod 4 `.extend` drops strict mode                              |
| F4A-H-7 | Three sync FS calls on hot paths (`readFileSync` per-pattern, `existsSync` as sync extractor's only reason to exist) |
| F4A-H-8 | POSIX-path normalization inconsistent across brand sites — Windows leaks `\\` into source-file IDs                   |
| F4A-H-9 | Three `void X;` expressions evade local lint rule (pattern matches comments, not expressions)                        |

### Medium (P2) — abbreviated summary

- **Module entanglement:** `taxonomy/` ↔ `config/` mutually entangled (M-CORE-4); `validation-schemas/` imports from `extractor/` (M-CORE-5); `read-api/pattern-classification.ts:75-77` re-exports 3 pipeline-internal helpers (M-CORE-6); 5-state vs 4-state status mixing on the read API (M-CORE-7).
- **Schema-vs-type drift:** `transform: z.function()` (M-CORE-8 / F4A-C-2); `RoleDefinition` type aliased to config type rather than `z.infer` (M-CORE-10); duplicated role-cloning helpers (M-CORE-9).
- **Code shape:** `parseDirective` 170-line function (M-CORE-11); `dual-source-extractor` uses `console.warn` despite diagnostic channel (M-CORE-12); raw `as ModuleId` cast (M-CORE-13).
- **Phase 2 simplification recipes:** 17 medium-leverage simplifications, each with before/after code. See `02-simplification-cleanup.md` "M-SIMP-\*" table.
- **Test gaps:** Pipeline internals (TC-H-2), `graph-inventory` 3 functions (TC-H-4), `compareContexts` 145 LOC (TC-H-5), `extractProcessMetadata`/`extractDeliverables` (TC-M-1), `parseDirective` not tested in isolation (TC-M-2), no scale test against 318-pattern dogfood (TC-M-3).
- **Test quality:** `patternCounter` not reset (TC-M-4), `formatCodecError` tests for deletion candidate (TC-M-5), 4 step files missing `AfterEachScenario` (TC-M-6).
- **Docs:** `PipelineOptions` fields undocumented (DOC-M-1), per-package dep-direction missing (DOC-M-2), invalid `@architect-decision core-deps` tag (DOC-M-3), `parseAtBoundary` missing annotation (DOC-M-4), `CONTRIBUTING.md` references removed Codec stage (DOC-M-5), 78 source files invisible to PatternGraph (DOC-M-6), `MIGRATION.md` lacks pre-deletion notice for cleanup-bound symbols (DOC-M-7).
- **CI/DevOps:** Missing `eslint` in core devDeps, test typecheck guard, vitest pattern drift, stale changeset ignore entry (CI-3), no Node version matrix (CI-2), no CI pipeline at all (CI-1).

### Low (P3) — abbreviated

- O(n²) patterns: `discoverTaggedShapes` JSDoc lookup (L-CORE-1), per-tag `[...existing, x]` spreads (L-CORE-7), `compareContexts` double-fetch (L-CORE-5), `aggregateContextDependencies` redundant lookups.
- Micro: hoisted regex caches missed in `shape-extractor.ts` (L-CORE-2), `extractFirstSentenceRaw` regex edge cases (L-CORE-3), `camelCaseToTitleCase` rebuilds regexes per acronym per call + has 26-acronym ceiling bug (L-CORE-4), `aggregateTagUsage` hardcodes 8 tags with a field-name defect (L-CORE-6), `inferPatternName` returns `${tag}-pattern` fallback (L-CORE-8), `Result.unwrap` `JSON.stringify` on circular refs (L-CORE-10), `PackageConfigSchema.extend` Zod-v4 strictness loss (L-CORE-11), tiny `utils/` files (L-CORE-12), `BusinessRuleSchema` is `z.object` (L-CORE-13), `getPatternsByQuarter(string)` no validation (L-CORE-14), `getStatusDistribution`/`getCompletionPercentage` recompute every call (L-CORE-15).

## Action plan — ordered by dependency

Step numbering is the recommended landing order; items inside a step can be done in parallel or as a single PR.

### Sweep 1: Unblock the publish path (1 day, ~10 lines total)

These are pure deletion / one-line fixes; they unblock everything downstream.

1. **Move `prepack` into `scripts`** (C-CORE-6 / CL-CORE-1) — `package.json:66`. Use `"pnpm clean && pnpm build"` to match siblings.
2. **Delete the broken `./roles` export block** (C-CORE-1 / CL-CORE-2) — `package.json:34-37`. Zero callers verified.
3. **Disable `sourceMap`/`declarationMap`** (CL-CORE-3) — `tsconfig.architect-base.json`. Family-wide tarball reduction.

### Sweep 2: Deletions (No-BC pre-1.0 — these are pure removals)

4. **Delete `presentation-contracts.ts` + the `'codec' + 'Options'` strip + `isProjectConfig` guard** (H-CORE-4 + C-CORE-4) — `src/config/presentation-contracts.ts` entire file; `src/config/config-loader.ts:188-196` IIFE; `src/config/project-config-schema.ts:118-141` `isProjectConfig`. Single `safeParse` replaces the three-layer validation.
5. **Delete the 6 BC alias schemas in `feature.ts`** (H-CORE-12) — `src/validation-schemas/feature.ts:100-110` + barrel re-exports. Sweep callers to `Gherkin*` names.
6. **Delete the 10 dead exports from CL-CORE-5** — `parseMarkdownToBlocks`, `formatUserZodError`, `FEATURE_LAYERS`, `validateStatus`/`validateCompletionMetadata`/`validatePatternStatus`, `isFullyEditable`/`isScopeLocked`, `createFileLoader`, `formatCodecError`, plus `DEFAULT_PRESENTATION_OUTPUT_DIRECTORY`. All grep-verified zero callers.
7. **Delete the 3 `void X;` expressions** (H-SIMP-9 / F4A-H-9) — `doc-extractor.ts:249,252`, `gherkin-extractor.ts:604`. Either surface `extractionWarnings` through the diagnostic channel or delete the accumulator entirely.
8. **Delete `self-hosting.ts` from `src/`** (H-CORE-10 / CL-CORE-4) — move `ARCHITECT_PACKAGE_ROLES` + `PACKAGE_SELF_HOSTING_SOURCES` to `architect.config.ts` at the repo root (the only real consumer). Remove the barrel re-exports.
9. **Delete the `/orders/` and `/inventory/` heuristics in `layer-inference.ts`** (H-CORE-11) — lines 33-36.

### Sweep 3: Schema/contract foundation (the load-bearing PR)

10. **Strict-schema sweep** (C-CORE-2, H-CORE-7, F4A-H-3, F4A-H-6) — `z.object → z.strictObject` across 28 sites in `validation-schemas/`. Re-declare `PackageConfigSchema = z.strictObject({ ...PackageSchema.shape, ... })`. Replace hand-written interfaces with `z.infer`. Move `nameIndex` to `RuntimePatternGraph`.
11. **Consolidate `TagRegistry`/`RoleDefinition`/`MetadataTagDefinition` type-of-record** (C-CORE-3) — delete `config/tag-registry-contract.ts` and the duplicate interface in `config/role-constants.ts`; switch `config/types.ts` and `taxonomy/registry-builder.ts` to consume `z.infer` from the schema.
12. **Replace `z.function().optional()` with `z.enum(KNOWN_TRANSFORM_NAMES).optional()`** (C-CORE-7 / F4A-C-2) — resolve names→functions inside `taxonomy/registry-builder.ts`. `cloneTagRegistry` collapses to one line; M-CORE-14 dissolves.
13. **Move `taxonomy/` artifacts out of `config/`** (M-CORE-4) — move `role-constants.ts` and `tag-registry-contract.ts` into `taxonomy/`. Move `extraction-diagnostic` codes/severities from `extractor/` to `validation-schemas/extraction-diagnostic.ts` (M-CORE-5).

### Sweep 4: TS-strictness compliance

14. **Discriminated `TransitionValidationResult`** (C-CORE-5 / F4A-C-1 / M-SIMP-2) — 3 `as ProcessStatusValue` lines disappear; consumers gain real narrowing. **Critical because architect-guard consumes this on the production path.**
15. **Unify `buildRoleLookup` into `utils/role-lookup.ts`** (H-CORE-13 / H-SIMP-4) — 4 copies → 1; eliminate per-tag-iteration rebuilds (real allocation fix).
16. **One `applyTagValue` applier in `taxonomy/tag-parsing.ts`** (H-CORE-14 / H-SIMP-6) — both JSDoc and Gherkin parsers shrink to tokenizers + applier call. **Side effect:** 16 `as` casts at `ast-parser.ts:279-296` (F4A-H-1) disappear automatically.
17. **Split `extractPatternTags` return into `ParsedFeatureMetadata` + `FeatureMetadataDiagnostics`** (H-CORE-15 / F4A-H-2 / F4A-H-4) — eliminates the `[key: string]: unknown` index signature and the 2 `as UnrecognizedEnumEntry[]` reads. **Land with H-SIMP-1 + H-SIMP-5 — chain fragile if split.**
18. **Build raw pattern as `z.input<typeof ExtractedPatternSchema>`** (H-CORE-16 / H-SIMP-5 / F4A-H-5) — eliminates 35 typo-silent quoted-key assignments. Needs step 10 (strict schemas).
19. **Collapse sync/async Gherkin extractor** (H-CORE-6 / H-SIMP-1) — keep async only; sync wrapper exists purely for `existsSync`. After step 17/18.
20. **Discriminated union for `architect-projection`'s perf gate downstream:** replace 27× `structuredClone` + `cloneTagRegistry` with one `deepFreeze` at API construction (H-CORE-8 / H-SIMP-2). Independent of step 10 onwards; can land in parallel.
21. **POSIX-path normalization in brand constructors** (F4A-H-8) — make `asSourceFilePath` transform `\\` → `/` before branding.

### Sweep 5: Barrel curation and architectural boundaries

22. **Resolve read-api ↔ pipeline ↔ extractor tangle** (H-CORE-2) — move `getPatternName` to `validation-schemas/extracted-pattern.ts`; pick one home for `buildDeclaredPatternIndex`/`inferPackageId`/`resolveUsesTarget`/`buildCanonicalRelationshipIndex`. Add `madge --circular src` to CI.
23. **Move `cli-schema.ts` to `architect-cli`** (H-CORE-5) — also moves the CLI option enums out of core's barrel (M-CORE-3).
24. **Rename `src/package/` → `src/workspace-package/` and move `ProjectionError` to `architect-projection`** (H-CORE-9).
25. **Curate `src/index.ts`** (H-CORE-1) — drop `export *` wildcards for `scanner`, `extractor`; replace with explicit named exports of symbols downstream packages actually consume. Add header comment defining intended consumer surface (TD-CORE-4).

### Sweep 6: Trust-boundary integration (TD-CORE-1 umbrella)

26. **Use `parseAtBoundary` at `buildPatternGraph`'s entry** (H-CORE-3 / TD-CORE-1). Closes the unused-in-core problem. Exercises the helper through existing tests (TC-C-1).
27. **Add `@architect-pattern BoundaryValidator` + `@architect-see-also:ADR009ProjectionTrustBoundary` to `validation/boundary.ts`** (DOC-M-4) — makes the primitive discoverable in PatternGraph + generated docs.
28. **Rewrite the README** (TD-CORE-2) — install, quick-start with `buildPatternGraph` + `createPatternGraphAPI`, correct trust-boundary section, ADR pointers, dependency direction.
29. **Eliminate the 16 boilerplate "When to Use" annotation texts** (DOC-H-3) — replace with role-appropriate text per file. Use `doc-extractor.ts:14-17` and `gherkin-extractor.ts:13-17` as references.
30. **Annotate the algorithmic core** (DOC-H-4) — `@architect-pattern PatternGraphTransform` + function-level JSDoc on `transformToPatternGraph` covering the single-pass design.

### Sweep 7: Tests

31. **FSM transition tests** (TC-C-3 / TD-CORE-3) — `tests/features/validation/fsm-transitions.feature`, `Scenario Outline` covering 4 valid + 4 invalid transitions + invalid-input. Production-path code shouldn't be untested.
32. **`PatternGraphAPI` method coverage** (TC-H-1) — second Rule block covering status/distribution queries. Pure functions, no I/O.
33. **`graph-inventory` 3-scenario feature** (TC-H-4) — `aggregateTagUsage`, `buildSourceInventory`, `findOrphanPatterns`. Includes the `arch-context` defect (M-SIMP-14) as failing-first.
34. **`utils/fuzzy-match.feature`** (TC-H-3) — 6 scenarios; pure functions, no I/O.
35. **`compareContexts` coverage** (TC-H-5) — 2 scenarios in `architecture-inspection.feature`.
36. **Self-hosted scale-realism test** (TC-M-3) — one feature pointing `buildPatternGraph` at the package's own `src/`. Asserts `ok` + pattern count threshold.
37. **Test cleanup** — TC-M-4 (`patternCounter` reset), TC-M-5 (delete `formatCodecError` scenarios with the symbol), TC-M-6 (add `AfterEachScenario` to 4 files), TC-L-4 (replace `as unknown as ExtractedPattern` with `ExtractedPatternSchema.parse`).

### Sweep 8: CI and family normalization (separate effort)

38. **Add `.github/workflows/ci.yml`** (CI-1) — pnpm install + lint + typecheck + test on PR/push, matrix `node: [20, 22]`, pnpm-store cache.
39. **Add `.github/workflows/publish.yml`** (CI-2) — tag-push trigger; OIDC provenance for `npm publish`; `changeset publish` orchestration.
40. **Family-wide script normalization PR** (CL-CORE-10/11/14) — align `prepack`/`lint`/`typecheck`/`test`/eslint-devDep/vitest-include across all 5 publishable packages in one PR.
41. **Add `no-restricted-syntax` ESLint rule banning `void X;` expressions in production src** (F4A-H-9) — closes the soft-suppression escape hatch.
42. **Sweeps:** `parseInt`/`isNaN` → `Number.*` (F4A-M-4), `from 'fs'` → `from 'node:fs'` (F4A-L-1), `IIFE → lazy memo` for `DEFAULT_BUILDERS` (CL-CORE-12 / F4A-L-3).

## What's healthy (preserve)

- **`parseAtBoundary` + `BoundaryParseError`** — the right shape; uses Zod 4's `z.prettifyError`. Needs to be applied at core's own boundaries (sweep 26).
- **`Result<T,E>` + discriminated `DocError` union** — clean, exhaustive, the `result-monad.feature` is the reference for "what good test coverage looks like" in this codebase.
- **FSM transition table** — small, table-driven, exhaustive error messages.
- **Branded types via Zod `.brand<…>()`** — exemplary (one slip: `asModuleId`).
- **`as const satisfies T` idiom** — used correctly in three sites; preserve.
- **Zod 4 modernisms:** `z.discriminatedUnion` in `export-info.ts`, `z.input` vs `z.output` separation in `extracted-shape.ts`, `z.ZodType<T>: z.lazy(...)` recursion in `section-block.ts`, `z.prettifyError` in `boundary.ts`, `z.iso.datetime` in `extracted-pattern.ts`.
- **Single-pass `transformToPatternGraph`** — pre-computed views and relationship/name indices; the architectural backbone the read API rests on (needs annotation + JSDoc per DOC-H-4 but the design itself is sound).
- **Single-tier strictness** — zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME` in src. Discipline.
- **Dependency hygiene** — every shared dep pinned identically across the 5 publishable packages. Notable discipline for a multi-package pnpm workspace.

## Cross-package implications for the family review

Findings from this review that affect other packages or the family-wide synthesis:

1. **`validateTransition` casts are on the production path through architect-guard** (C-CORE-5). When reviewing `architect-guard`, confirm `decider.ts:300` has its own integration tests for the consume side of the FSM contract.
2. **`validateCompletionMetadata`/`validatePatternStatus` logic belongs in `architect-guard`'s DoD checker** (CL-CORE-5 #4-#6). The guard review should verify it has its own implementation, since this chain is being deleted from core.
3. **`fuzzy-match` and `extractFirstSentenceRaw` are duplicated in `architect-projection`** (CL-CORE-16/17). The projection-side copies should be deleted in favor of importing from core; flag during projection review.
4. **`structuredClone` cost in `PatternGraphAPI`** (H-CORE-8) directly affects `architect-projection`'s CI perf gate. The deep-freeze refactor in H-SIMP-2 should land before re-baselining the projection perf budget.
5. **`architect-mcp` is the only long-running consumer.** It will manifest the `package-resolver` cache leak (CL-CORE-8) and the `self-hosting.ts` module-load cost (CL-CORE-4) before any other package does. Both should be addressed before the family advertises MCP stability.
6. **Family-wide CI absence (CI-1) is a multiplier**, not a per-package finding. The master report should treat it as a structural finding for the whole repo and propose a single CI workflow that covers all packages.
7. **Family-wide script drift (CL-CORE-10/11/14)** is best addressed in one normalization PR across all 5 packages — not piecemeal. Master report should propose a workspace-level base script template.
8. **`architect-projection` should also be audited for the family Zod-`.extend()` strictness loss** (F4A-H-6). Anywhere `.extend()` chains off a `z.strictObject` in projection has the same Zod 4 bug.
9. **`tests/features/**`vs`tests/steps/**` glob drift** between core and projection. Pick one family convention.

## Numbers

- **Findings logged:** 7 Critical + 16+5+8+8 = 37 High + ~25 Medium + ~15 Low.
- **Cross-cutting recipes** that close multiple findings in one move: 8 (steps 4, 10, 12, 14, 16, 17, 20, 26 in the action plan).
- **Total dead exports identified for deletion:** ~25 (10 from CL-CORE-5 + 6 BC aliases + 5 presentation-contracts types + dead `DEFAULT_PRESENTATION_OUTPUT_DIRECTORY` + `cli-schema` re-exports + the deletion chain through `validateStatus`).
- **Estimated tarball reduction:** 426 files → ~170-180 files; 195.8 KB packed → under 100 KB; 1.5 MB unpacked → ~600 KB (combining Phase 2 cleanup with `sourceMap`/`declarationMap` disable).
- **Estimated public-barrel reduction:** ~140 named exports → ~80 (after curation + dead-export deletion).
- **Test scenarios to add:** ~30 across FSM, PatternGraphAPI, graph-inventory, utils, compareContexts, self-hosted scale test, and parser format dispatches.

## Overall verdict

`architect-core` is **structurally sound but doctrinally inconsistent**. The architecture is correct (single read model, clean dependency direction, branded primitives, the right Zod 4 modernisms in evidence); the central contracts breach the doctrine the package preaches (open `z.object` on the read model, hand-written types parallel to schemas, BC aliases that No-BC pre-1.0 forbids). The execution gap is bridgeable in one disciplined release cycle — the recipes are concrete, the tests are sparse but pure-function, and the breaking changes the cleanup requires are exactly what pre-1.0 No-BC welcomes.

The most pressing structural finding is **not architectural**: it's the absence of CI. Every doctrine breach this review surfaced (misplaced `prepack`, deprecated Zod APIs, dead exports, soft suppressions, type-strictness evasion, unused trust boundary, drifting schema-vs-type) would have been caught by a baseline lint+typecheck+test workflow on PRs. The "manual gates honored by discipline" posture is the multiplier for every other finding. Recommended as a P2 in priority but a P0 in _leverage_.
