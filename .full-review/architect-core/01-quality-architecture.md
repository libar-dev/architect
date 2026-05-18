# architect-core — Phase 1 Consolidated: Code Quality & Architecture

**Sources:** `raw/1A-code-quality.md` (comprehensive-review:code-reviewer) + `raw/1B-architecture.md` (comprehensive-review:architect-review).
Findings are tagged **[1A]**, **[1B]**, or **[1A+1B]** when both agents independently flagged the same root cause.

## Executive Summary

`architect-core` is the foundation of the family, and its core craftsmanship is strong: `Result<T,E>` + discriminated `DocError` union, branded types via Zod, `parseAtBoundary` helper, zero `@ts-ignore`/`eslint-disable`/`TODO`/`FIXME` suppressions in `src/`. The single-pass `transformToPatternGraph` with pre-computed views and indices is the strongest architectural choice.

The cost is concentrated in three places that **both reviewers independently identified**:

1. **The Zod-first doctrine is half-applied on the most load-bearing contracts.** The central `PatternGraphSchema` uses open `z.object` and is then shadowed by a hand-written `PatternGraph` interface that adds fields the schema doesn't validate (`nameIndex`). The same pattern repeats for `StatusGroups`, `ExactStatusGroups`, `PhaseGroup`, `SourceViews`, `ArchIndex`. `RoleDefinition` / `TagRegistry` / `MetadataTagDefinition` / `AggregationTagDefinition` exist twice — as interfaces in `config/tag-registry-contract.ts` AND as Zod schemas in `validation-schemas/tag-registry.ts`, with the schema file re-exporting the interface types instead of inferring from its own schemas. 28 of 90 schemas use `z.object` instead of `z.strictObject`.
2. **Internal layering is weak.** `read-api/` reaches into `generators/pipeline/`; `extractor/` reaches back into `read-api/` (for a one-line `getPatternName` helper); `src/index.ts` wildcard-exports scanner+extractor internals through the public barrel; `validation-schemas/output-schemas.ts` depends on `extractor/`. ADR-006 expected stricter boundaries than the imports actually enforce.
3. **Dogfood plumbing is shipped in the published library.** `self-hosting.ts` calculates a workspace root via `import.meta.url` + 4× `../` at module load and exports it from the barrel; `layer-inference.ts` hardcodes `/orders/` and `/inventory/` as "domain" cues; `presentation-contracts.ts` defines obsolete `CodecOptions`/`ReferenceDocConfig` types kept alive by a string-concat (`'codec' + 'Options'`) strip in `config-loader.ts`; `cli-schema.ts` (610 lines, 22KB) is a CLI concern living in core.

There is also one **real install-time bug** the architecture review caught: `package.json#exports` declares `./roles` but no `src/roles.ts` exists, and `dist/roles.{js,d.ts}` is not produced by `tsc -b`. Any consumer doing `import … from '@libar-dev/architect-core/roles'` breaks.

## Critical (P0 — fix immediately)

### C-CORE-1. Broken `./roles` export — install/resolve break **[1B]**

`packages/architect-core/package.json` lines 34-37 declare `./roles` → `./dist/roles.{js,d.ts}`. No `src/roles.ts` exists. Verified: `dist/` produces no `roles.*` artifact. This is a hard contract breach for any consumer. **Fix:** either create the curated `src/roles.ts` barrel (export `DEFAULT_ROLES`, `DDD_ES_CQRS_ROLES`, `ARCHITECT_PACKAGE_ROLES`, `RoleDefinition`, `buildRegisteredRoleValues`) or remove the `./roles` block from `exports`. Pre-1.0 No-BC: pick one shape and ship it.

### C-CORE-2. `PatternGraphSchema` is `z.object` + hand-written `PatternGraph` interface drifts from it **[1A+1B]**

`src/validation-schemas/pattern-graph.ts`. The single read model (ADR-006) has three doctrine violations at once:

- Top-level schema and 8 nested schemas (`StatusGroupsSchema`, `ExactStatusGroupsSchema`, `StatusCountsSchema`, `PhaseGroupSchema`, `SourceViewsSchema`, `ImplementationRefSchema`, `RelationshipEntrySchema`, `ArchIndexSchema`) all use `z.object` (open) — extras silently pass, doctrine requires `z.strictObject`.
- The exported `PatternGraph` type is a hand-written `interface` (lines 161-179), not `z.infer<typeof PatternGraphSchema>`. It diverges by including `nameIndex?: ReadonlyMap<…>` which the schema never declares — `parseAtBoundary` would silently drop it.
- `StatusGroups`, `ExactStatusGroups`, `PhaseGroup`, `SourceViews`, `ArchIndex` are all hand-written too (lines 125-160).

**Fix:** convert every shape to `z.strictObject`. Either add `nameIndex` to the schema or — better — move it to `RuntimePatternGraph` (already exists in `transform-types.ts` for `workflow`) and keep `PatternGraph` as the strict, validated contract. Replace every hand-written interface with `export type X = z.infer<typeof XSchema>`.

### C-CORE-3. Duplicate type-of-record for the taxonomy contract **[1A+1B]**

`src/config/tag-registry-contract.ts` defines interface `TagRegistry`/`MetadataTagDefinition`/`AggregationTagDefinition`. `src/config/role-constants.ts` defines interface `RoleDefinition`. `src/validation-schemas/tag-registry.ts` defines Zod schemas for the same shapes — but **re-exports the `config/` interface types** rather than inferring from its own schemas (`export type RoleDefinition = ConfigRoleDefinition;` at line 20, `export type { AggregationTagDefinition, MetadataTagDefinition, TagRegistry };` at line 52). The barrel (`src/index.ts`) re-exports both paths — consumers get subtly different shapes depending on which they import. `RoleDefinition.aliases` already differs (schema infers `string[]` after `.default([])`; interface declares `readonly string[] | undefined`).

**Fix:** delete `config/tag-registry-contract.ts` and the interface in `config/role-constants.ts`. Switch `config/types.ts` and `taxonomy/registry-builder.ts` to consume `z.infer` types from the schema. The Zod schema is the type-of-record per doctrine.

### C-CORE-4. `isProjectConfig` hand-coded guard duplicates schema keys; config is parsed twice **[1A]**

`src/config/project-config-schema.ts` lines 118-141 + `src/config/config-loader.ts` lines 188-196. `isProjectConfig` enumerates the schema's keys by hand; `config-loader` then runs both `isProjectConfig(exported)` AND `ArchitectProjectConfigSchema.safeParse(...)`. Schema additions drift silently in the hand-coded guard. Violates "parse once at the trust boundary." Plus, the same module has a `configForValidation` IIFE that uses `Reflect.deleteProperty` with `'codec' + 'Options'` to strip legacy keys before parsing (see also H-CORE-4 below).

**Fix:** delete `isProjectConfig`; let Zod be the sole gate. After `z.strictObject` is in effect (C-CORE-2/H-CORE-7), Zod will reject the stripped legacy keys with a useful error message — drop the IIFE too.

### C-CORE-5. `validateTransition` casts strings to `ProcessStatusValue` after type guard failed **[1A]**

`src/validation/fsm/validator.ts` lines 88-105. Returns `{ valid: false, from: from as ProcessStatusValue, ... }` for inputs that `isValidStatusValue` just rejected. The discriminant `valid: false` is the safety net, but the type lies about `from`. Downstream code that branches on `result.from === 'roadmap'` compiles fine and reads garbage.

**Fix:** widen the result type so the invalid branch types `from`/`to` as `ProcessStatusValue | string`; drop every `as ProcessStatusValue` in the file.

## High (P1 — fix before next release)

### H-CORE-1. `src/index.ts` barrel is unreviewable and leaks internals **[1B]**

272 lines, ~140 named exports plus 7 `export *` wildcards (scanner, extractor, validation-schemas, validation/fsm, utils, read-api, types). Mixes the canonical read API, low-level scanner/extractor internals, error factories, the entire schemas surface, and two complete enum dumps (~80 names from `taxonomy/`). Directly contradicts ADR-006's separation: stage-1 scanner/extractor are exposed to every consumer through wildcard re-export. **Fix:** curate intentionally — drop `export *` for scanner/extractor; replace with explicit named exports of symbols projection/guard/mcp/cli actually consume. Top-of-file comment documenting that the barrel IS the public contract.

### H-CORE-2. read-api ↔ pipeline ↔ extractor boundary tangle **[1B]**

- `src/read-api/pattern-helpers.ts:18` imports `buildCanonicalRelationshipIndex` from `../generators/pipeline/relationship-resolver.js`.
- `src/read-api/pattern-classification.ts:14-15,75-77` namespace-imports pipeline internals and re-exports `buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget` as if they're its own surface.
- `src/extractor/gherkin-extractor.ts:29` + `src/extractor/dual-source-extractor.ts:13` import `getPatternName` from `../read-api/pattern-helpers.js` — for a one-line `?? `-fallback helper.

ADR-006's named anti-pattern (consumers reaching into scanner/extractor) is present here in the inverse direction. **Fix:** move `getPatternName` to a neutral location (probably next to `ExtractedPatternSchema` in `validation-schemas/`). Pick one home for `buildDeclaredPatternIndex`/`inferPackageId`/`resolveUsesTarget`/`buildCanonicalRelationshipIndex` — either fully in `read-api/` or fully in pipeline. No straddling. Add `madge --circular src` to CI.

### H-CORE-3. Trust-boundary inconsistency: `parseAtBoundary` exists but core never uses it **[1B]**

`src/validation/boundary.ts` defines `parseAtBoundary`. Only external packages call it; nothing in `architect-core/src/` does. Meanwhile `buildPatternGraph(options)` accepts `PipelineOptions` typed but never validated; `transform-dataset.ts:103` does per-pattern `ExtractedPatternSchema.safeParse` on already-typed input (and the extractor parses each pattern too — see also H-CORE-6). The trust boundary is "halfway through `transform-dataset.ts` for individual patterns, nowhere for the graph shape or pipeline inputs." **Fix:** pick one place — either `buildPatternGraph` takes `unknown` and parses `PipelineOptionsSchema` once at entry, or `createPatternGraphAPI` takes `unknown` and calls `parseAtBoundary(PatternGraphSchema, ...)`. Document the choice on `parseAtBoundary` and the entrypoints.

### H-CORE-4. Dead surface + obfuscated string-concat strip in config-loader **[1A+1B]**

- `src/config/presentation-contracts.ts` defines `CodecOptions`, `ReferenceDocConfig`, `IndexCodecOptionsContract`, `ShapeSelector`, `DiagramScope` — all serving the removed codec/presentation stack (ADR-005/W7). Still re-exported through `src/index.ts:226-235`.
- `src/config/config-loader.ts:188-195` strips keys named `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` via string concatenation — a textbook obfuscation that the No-BC doctrine forbids in spirit and that hides the actual semantic from grep.

**Fix:** delete `presentation-contracts.ts` and its barrel re-export. Delete the strip-list. Let `z.strictObject` reject the legacy fields with an error message naming them. If a downstream package still imports `CodecOptions`/`ReferenceDocConfig`/`IndexCodecOptionsContract`, that's the breaking change pre-1.0 doctrine welcomes.

### H-CORE-5. `cli-schema.ts` (610 lines, 22KB) — CLI concern hosted in core **[1B]**

`src/config/cli-schema.ts` defines command narratives, recipe examples, help-text option groups. Re-exported through `src/index.ts:236-246` and brings dozens of generator-option enums into the core barrel (see M-CORE-3). Inverts the family dependency direction: core is the substrate every other package consumes, not the place where CLI UI text lives. **Fix:** move to `architect-cli`. If `architect-mcp` needs the same help text, depend on `architect-cli` for it (an `mcp ← cli` edge would need an ADR but is structurally clean since `cli` only depends on `core` and `guard`).

### H-CORE-6. Sync/async near-clone in gherkin-extractor + 27 doctrine-violating duplications around it **[1A]**

`src/extractor/gherkin-extractor.ts`:

- `extractPatternsFromGherkin` (lines 353-493, 140 lines, sync) and `extractPatternsFromGherkinAsync` (lines 517-652, 135 lines, async) duplicate the entire feature-to-pattern transform — only the file-existence check differs. They have already drifted (sync handles `unrecognizedEnums`, async doesn't).
- `extractPatternsFromGherkinAsync` then calls `safeParse(ExtractedPatternSchema)` per pattern (line 606), as does `doc-extractor.ts:294`, AND `transform-dataset.ts:103` re-parses every already-typed pattern again. The 318-pattern dogfood graph parses 318 patterns twice.

**Fix:** factor `extractOnePattern(file, ctx)` shared body; keep only async at the entry, await once. Remove the second `safeParse` per H-CORE-3 boundary decision. If the transform wants paranoia, accept `unknown[]` and parse once at that boundary.

### H-CORE-7. `z.object` instead of `z.strictObject` across 28 schema sites **[1A]** (extends C-CORE-2)

- `src/validation-schemas/output-schemas.ts` — 10 schemas (the CLI/MCP output boundary).
- `src/validation-schemas/pattern-graph.ts` — 9 schemas (cross-package read model — also covered by C-CORE-2).
- `src/validation-schemas/extracted-shape.ts` — 8 schemas.
- `src/validation-schemas/extracted-pattern.ts:13` — `BusinessRuleSchema`.

Open objects on the output boundary mean an extra field can silently slip out the door for years. **Fix:** sweep `z.object(` → `z.strictObject(` in `validation-schemas/`. Pre-1.0 No-BC posture makes this a one-line PR; test fixtures that fail will reveal real over-broad values.

### H-CORE-8. 27× `structuredClone` per `PatternGraphAPI` read **[1A]**

`src/read-api/pattern-graph-api.ts` lines 81-345. Every getter wraps its return in `cloneValue = structuredClone`. `getPatternGraph()` deep-clones the entire dataset on every call; `getRecentlyCompleted()` clones every completed pattern. `cloneTagRegistry` (lines 85-100) hand-rebuilds the registry because `structuredClone` can't clone the `transform` function reference — an early warning that the registry contract has a non-serializable hole (see M-CORE-8). Returned shapes are already `readonly` in the TS types; the runtime clone is a belt-and-suspenders paying for a guarantee TypeScript already gives.

**Fix:** `deepFreeze` the dataset once at API construction and return references. Reserve `structuredClone` for cross-realm boundaries (workers, IPC). If a test depends on mutation, it's wrong and will surface immediately. **Note:** this directly benefits `architect-projection`'s CI perf gate.

### H-CORE-9. `package/` directory name collides with `package.json` semantics + ships projection concern in core **[1B]**

`src/package/projection-error.ts` defines `ProjectionError` — a projection-domain error class — inside core, contradicting the `core ← projection` dependency direction. `src/package/package-resolver.ts:26` doc-string explicitly says _"As a typed contract / data shape consumed by projection or render layers."_ Plus the directory name muddles grep results for "package" between npm metadata and the workspace-package resolver. **Fix:** rename `src/package/` → `src/workspace-package/` (or `src/source-mapping/`). Move `ProjectionError` to `architect-projection`; have `createPackageResolver` return `Result<Package, UnmappedPackageError>` so core stays projection-agnostic.

### H-CORE-10. `self-hosting.ts` ships hardcoded workspace paths and runs at module load **[1A+1B]**

`src/config/self-hosting.ts` resolves a workspace root via `path.dirname(fileURLToPath(import.meta.url)) + '../../../../'` at module load (line 7), hardcodes globs for every sibling package (lines 72-89), eagerly constructs `WORKSPACE_TAG_REGISTRY` (line 93), and exports all of it through the public barrel. In published `node_modules` the calculated root is meaningless; the sibling globs are correct only inside this monorepo. **Fix:** move to a dogfood-only file outside `src/` (e.g. `scripts/self-hosting-config.ts`) or behind a clearly-marked private subpath export.

### H-CORE-11. Hardcoded `/orders/` and `/inventory/` "domain" paths in core **[1A]**

`src/extractor/layer-inference.ts:33-36`. Baked-in path-substring checks from a sample app or older demo. Consumer projects don't have these. **Fix:** delete the two checks; if path-based layer inference is a user need, take a `domainPathSegments?: readonly string[]` parameter via `architect.config.ts`.

### H-CORE-12. BC-alias schemas in `feature.ts` **[1A+1B]**

`src/validation-schemas/feature.ts:100-110`. Six aliases that exist purely for renamed-symbol BC: `ParsedStepSchema = GherkinStepSchema`, `ParsedScenarioSchema = GherkinScenarioSchema`, `ParsedBackgroundSchema = GherkinBackgroundSchema`, `ParsedFeatureSchema = GherkinFeatureSchema`, `FeatureFileSchema = ScannedGherkinFileSchema`, plus matching type aliases. Grep confirms zero callers outside the alias declarations and the barrel re-export. Exactly the pattern No-BC forbids. **Fix:** delete the aliases and the barrel re-exports.

### H-CORE-13. 4× duplicated `buildRoleLookup` / `resolveCanonicalRole` **[1A]**

Same function body in `extractor/doc-extractor.ts:58-79`, `extractor/gherkin-extractor.ts:105-126`, `scanner/gherkin-ast-parser.ts:54-74`, and a near-variant in `read-api/pattern-helpers.ts:137-139`. **Fix:** extract one helper to `src/utils/role-lookup.ts`; delete the three private copies.

### H-CORE-14. Two parallel `@architect-*` tag parsers (JSDoc + Gherkin) **[1A]**

`src/scanner/ast-parser.ts:225-401` (170-line `parseDirective`) and `src/scanner/gherkin-ast-parser.ts:364-551` (`extractPatternTags`) implement the same registry-format dispatch (`value`/`enum`/`csv`/`flag`/`quoted-value`/`number`) for two different input shapes. They have already drifted (Gherkin uses `kebabToCamel` rename; JSDoc hand-maps each key). **Fix:** factor `applyTagValue(ctx)` in `src/taxonomy/tag-parsing.ts`; both parsers become thin tokenizers around the shared applier.

### H-CORE-15. `extractPatternTags` returns 42-field shape with `[key: string]: unknown` defeating `noPropertyAccessFromIndexSignature` **[1A]**

`src/scanner/gherkin-ast-parser.ts:364-419`. Hand-typed interface listing every key explicitly, then ending in `readonly [key: string]: unknown` — defeating the architect-base TS rule. The body builds a `Record<string, unknown>` and consumers use property access (`metadata.pattern`, `metadata.status`). Internal extractor signals (`_unrecognizedEnums`, `_roleTagValues`, `_unrecognizedRoleValues`, `_deprecatedTags`) share the same bag with `as` casts at `:494` and `:525`. **Fix:** split into `ParsedFeatureMetadata` + `FeatureMetadataDiagnostics`; drop the `_*` prefix smell and the casts.

### H-CORE-16. `buildGherkinRawPattern` builds `Record<string, unknown>` with 35× hand-typed key strings **[1A]**

`src/extractor/gherkin-extractor.ts:192-339`. `assignIfDefined(rawPattern, 'patternName', metadata.pattern)` is invoked ~35 times. A typo in any quoted key compiles cleanly and silently drops the field. **Fix:** build a `z.input<typeof ExtractedPatternSchema>`-typed partial; TS checks every key.

## Medium (P2 — plan for next sprint)

| #         | Source | Location                                                                                                                                               | Issue                                                                                                                                                                                                                                                  |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M-CORE-1  | 1A     | `generators/pipeline/relationship-resolver.ts:9`                                                                                                       | Local `getPatternName` shadows the canonical `read-api/pattern-helpers.ts:58` version (currently identical; will drift).                                                                                                                               |
| M-CORE-2  | 1A     | `extractor/doc-extractor.ts:249,252`, `gherkin-extractor.ts:604`                                                                                       | `void x;` dead-code suppressions — exactly the "soft suppression" No-BC doctrine forbids. `extractionWarnings` is accumulated but never surfaced.                                                                                                      |
| M-CORE-3  | 1B     | `src/index.ts:84-187`                                                                                                                                  | Two full enum dumps from `taxonomy/` — mixes canonical primitives (status/maturity) with CLI-specific option enums (`ADR_LIST_GROUP_BY`, `PR_CHANGES_SORT_BY`, …). These follow `cli-schema.ts` out (H-CORE-5).                                        |
| M-CORE-4  | 1B     | `taxonomy/registry-builder.ts`, `config/role-constants.ts`, `config/tag-registry-contract.ts`, `config/types.ts`, `validation-schemas/tag-registry.ts` | `taxonomy/` and `config/` are mutually entangled. `role-constants.ts` and `tag-registry-contract.ts` are taxonomy artifacts living under `config/`. **Fix:** move them to `taxonomy/`.                                                                 |
| M-CORE-5  | 1B     | `validation-schemas/output-schemas.ts:4-7`                                                                                                             | Schemas layer imports from `extractor/extraction-diagnostics.ts`. Move codes/severities into `validation-schemas/extraction-diagnostic.ts`; keep diagnostic-factory functions in `extractor/`.                                                         |
| M-CORE-6  | 1B     | `read-api/pattern-classification.ts:75-77`                                                                                                             | Three pipeline-internal helpers (`buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget`) are re-exported here verbatim, surfacing through two layers into the public barrel. See H-CORE-2.                                                 |
| M-CORE-7  | 1B     | `validation/fsm/states.ts:14-23`, `read-api/pattern-graph-api.ts:51`                                                                                   | FSM is 4-state (`ProcessStatusValue` excludes `candidate`) but `getPatternsByStatus(status: AcceptedStatusValue)` is 5-state. Mixing the two on the read API is unguarded. **Fix:** add `narrowToProcessStatus` helper or split partitioning getters.  |
| M-CORE-8  | 1A+1B  | `validation-schemas/tag-registry.ts:32`                                                                                                                | `transform: z.function().optional()`. `z.function()` doesn't validate runtime shape; functions don't serialize. Boundary contract should be data-only. **Fix:** replace with a small enum of named transforms; resolve name→function in the extractor. |
| M-CORE-9  | 1A     | `config/factory.ts:9-18`, `taxonomy/registry-builder.ts:34-39`                                                                                         | `cloneRoles` and `cloneRoleDefinitions` are near-identical and have drifted (`factory.ts` preserves `diagramShape`; `registry-builder.ts` doesn't).                                                                                                    |
| M-CORE-10 | 1A     | `validation-schemas/tag-registry.ts:20`                                                                                                                | `export type RoleDefinition = ConfigRoleDefinition;` instead of `z.infer<typeof RoleDefinitionSchema>`. Subtle drift on `aliases` defaulting.                                                                                                          |
| M-CORE-11 | 1A     | `scanner/ast-parser.ts:225-401`, lines 279-296                                                                                                         | `parseDirective` is 170 lines doing 5 jobs with 25 `as` casts on `unknown` results. Factor `extractMetadata(commentText, registry)` returning a strongly-typed bag; `parseDirective` shrinks to ~40 lines of glue.                                     |
| M-CORE-12 | 1A     | `extractor/dual-source-extractor.ts:94-99,178-184`                                                                                                     | `console.warn` for validation errors despite the module having its own `ExtractionDiagnostic[]` channel. Bubble them properly.                                                                                                                         |
| M-CORE-13 | 1A     | `types/branded.ts:41`                                                                                                                                  | `asModuleId(id) → id as ModuleId` (raw cast) while every other branded constructor parses. Either delete (no callers) or have it call `asPatternId`.                                                                                                   |
| M-CORE-14 | 1A     | `read-api/pattern-graph-api.ts:81-100,344-346`                                                                                                         | `cloneTagRegistry` exists because `structuredClone` can't clone `transform`. Goes away when H-CORE-8 is addressed.                                                                                                                                     |

## Low (P3 — backlog)

| #         | Source | Location                                                      | Issue                                                                                                                                                                 |
| --------- | ------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-CORE-1  | 1A     | `extractor/shape-extractor.ts:629-678`                        | `discoverTaggedShapes` re-finds preceding JSDoc per declaration — O(n²) per file. Build `prepareJsDocComments(comments)` once.                                        |
| L-CORE-2  | 1A     | `scanner/ast-parser.ts:39-50` vs `shape-extractor.ts:610-627` | `REGEX_CACHE` exists but `extractShapeTag`/`extractIncludeTag` build regex literals inline per call. Hoist to module scope.                                           |
| L-CORE-3  | 1A     | `utils/session-helpers.ts:26-34`                              | `extractFirstSentenceRaw` regex misses `?!`/`.)` combos and capital-after-`(`. Worth a test fixture if used in hot paths.                                             |
| L-CORE-4  | 1A     | `utils/string-utils.ts:59-99`                                 | `camelCaseToTitleCase` rebuilds 5 regexes per known acronym per call. Precompute `Map<acronym, RegExp[]>` at module scope.                                            |
| L-CORE-5  | 1A     | `read-api/architecture-inspection.ts:144-244`                 | `compareContexts` calls `getRelationshipsForPattern` twice per pattern (cache helps but still chain). Fetch index once and pass.                                      |
| L-CORE-6  | 1A     | `read-api/graph-inventory.ts:50-84`                           | `aggregateTagUsage` hardcodes 8 tags. Drive from `dataset.tagRegistry.metadataTags`.                                                                                  |
| L-CORE-7  | 1A     | `scanner/gherkin-ast-parser.ts:513-516,533-536`               | `[...(existing ?? []), …]` per repeatable tag inside the iteration loop — O(n²) on feature with many tags. Use a temporary `Map<string, string[]>`.                   |
| L-CORE-8  | 1A     | `extractor/doc-extractor.ts:309-328`                          | `inferPatternName` last-resort returns `${primaryTag}-pattern` (e.g. `unknown-pattern`). Should emit a diagnostic instead of a fake name.                             |
| L-CORE-9  | 1A     | `extractor/shape-extractor.ts:87-91 + :670`                   | `extractShape` returns a fresh shape that's then recreated via spread to add `group`/`includes`. Either accept an optional opts arg or live with it — minor.          |
| L-CORE-10 | 1A     | `types/result.ts:70-82`                                       | `Result.unwrap` uses `JSON.stringify` for non-Error errors — throws on circular refs. Wrap in try/catch.                                                              |
| L-CORE-11 | 1A     | `package/package-config.ts:10-12`                             | `.extend(...)` on a strictObject in Zod v4 needs an explicit chain to remain strict. Add a test or re-declare with `z.strictObject({ ...PackageSchema.shape, ... })`. |
| L-CORE-12 | 1A     | `utils/id-utils.ts`                                           | 7 lines, one export. Observation only — consolidating tiny `utils/` files into a flatter `utils.ts` would tidy up.                                                    |
| L-CORE-13 | 1B     | `validation-schemas/extracted-pattern.ts:13-19`               | `BusinessRuleSchema` is `z.object`; `tags: z.array(z.string())` unconstrained. Same fix as C-CORE-2 (`z.strictObject`).                                               |
| L-CORE-14 | 1B     | `read-api/pattern-graph-api.ts:306`                           | `getPatternsByQuarter(string)` accepts any string; malformed quarters silently return `[]`. Validate against `QUARTER_PATTERN` or brand the parameter type.           |
| L-CORE-15 | 1B     | `read-api/pattern-graph-api.ts:158-162,207-215`               | `getStatusDistribution`/`getCompletionPercentage` recompute on every call. Could cache in `transform-dataset.ts`.                                                     |
| L-CORE-16 | 1B     | `extractor/extraction-diagnostics.ts` vs `output-schemas.ts`  | Two diagnostic-code dictionaries kept in sync via import — works today, but bait for drift. Move codes to `validation-schemas/` (see M-CORE-5).                       |

## Sweep patterns (each item is small individually; the aggregate cost is real)

1. **Defensive cloning of readonly arrays** — `[...(role.aliases ?? [])]`, `Array.from(tag.values)`, `[...registry.metadataTags]` appear in `taxonomy/registry-builder.ts:34-39`, `config/factory.ts:9-18`, `validation-schemas/tag-registry.ts:54-81`, `read-api/pattern-graph-api.ts:85-100`. Readonly types already protect; the clones cost allocations.
2. **`...(x !== undefined && { x })` spread under `exactOptionalPropertyTypes`** appears across most builders. Correct, but verbose. A small `omitUndefined()` helper would cut ~15 call-site lines per builder. Judgment call.
3. **`(existing ?? []).push` then `set` pattern** — `transform-dataset.ts:175-200`, `gherkin-ast-parser.ts:534-537`. A `Multimap<K,V>` helper would eliminate 8-10 copies.

## ADR Conformance

| ADR     | Subject                           | Conformance                                                                                                                       | Notes                                                                                                                                                                                                                                                                                                        |
| ------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ADR-003 | Source-First Pattern Architecture | **Conforms**                                                                                                                      | TS files carry `@architect-pattern`; `mergePatterns` enforces single-definition.                                                                                                                                                                                                                             |
| ADR-006 | Single Read Model                 | **Partial**                                                                                                                       | `PatternGraph` is the single read model and downstream consumers respect it. But `read-api/` imports pipeline internals (H-CORE-2), the read schema is open (C-CORE-2), and the barrel wildcard-leaks stage-1 internals (H-CORE-1).                                                                          |
| ADR-007 | Coordinated Taxonomy Redesign     | **Partial**                                                                                                                       | `AcceptedStatusValue` vs `ProcessStatusValue` correctly implemented (states.ts, FSM). But `RoleDefinition`/`TagRegistry` duplicate types-of-record (C-CORE-3) and `taxonomy/`↔`config/` are entangled (M-CORE-4) — the redesign left parallel definitions in place that the ADR conceptually wanted unified. |
| ADR-009 | Projection Trust Boundary         | N/A in core (governs projection). Core's analogue is `parseAtBoundary` — currently exported but unused in core itself (H-CORE-3). |

## What's healthy and worth preserving

- **`parseAtBoundary` + `BoundaryParseError`** (`validation/boundary.ts`) — exactly the right shape; just needs to be used at core's own boundaries.
- **`Result<T,E>` + discriminated `DocError`** (`types/result.ts`, `types/errors.ts`) — clean, exhaustive, well-documented.
- **FSM transition table** (`validation/fsm/transitions.ts`) — small, readable, good error messages.
- **Zero suppressions in `src/`** — no `@ts-ignore`, no `eslint-disable`, no `TODO`/`FIXME`. Real discipline.
- **Branded types via Zod `.brand<…>()`** (`types/branded.ts`) — nominal types done right (one slip: `asModuleId`, M-CORE-13).
- **Single-pass `transformToPatternGraph`** with pre-computed views/relationship/name indices — the architectural backbone the read API rests on.
- **`fuzzy-match.ts`** — concise and correct.

## Critical Issues for Phase 2 Context

The Phase 2 agents (`code-simplifier` + `codebase-cleanup:code-reviewer`) should pay particular attention to:

1. **`PatternGraphSchema` / `TagRegistry` doctrine breaches (C-CORE-2, C-CORE-3, H-CORE-7).** The schema-vs-interface duplication is the most central code-simplification opportunity in the package. Any "simplify" recommendation that doesn't address it is shallow.
2. **`gherkin-extractor.ts` sync/async clone + buildRoleLookup duplications + 2× tag parser (H-CORE-6, H-CORE-13, H-CORE-14).** This is the single biggest cluster of duplication in the package.
3. **`PatternGraphAPI`'s 27× `structuredClone` (H-CORE-8).** Simplification AND a performance win for downstream `architect-projection`.
4. **`self-hosting.ts`, `presentation-contracts.ts`, BC aliases in `feature.ts`, `cli-schema.ts` (H-CORE-4, H-CORE-5, H-CORE-10, H-CORE-12).** Pre-1.0 No-BC: cleanup means delete, not soften. These should be flagged as "delete" candidates, not "deprecate" candidates.
5. **The `_var` / `void x` / string-concat-property soft-suppressions (M-CORE-2, H-CORE-4).** Direct doctrine violations that the cleanup agent should flag.

The Phase 2 agents will be told to honor the No-BC doctrine — they MUST NOT recommend deprecation aliases or compat shims.
