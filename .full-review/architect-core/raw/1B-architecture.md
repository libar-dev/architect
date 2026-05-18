# `@libar-dev/architect-core` — Architecture Review (Phase 1B)

## Executive Summary

Structural health is **moderate but uneven**. The package delivers on the central architectural promise of ADR-006 (a single, pre-computed `PatternGraph` read model) and ADR-003 (annotated TypeScript as canonical pattern definition): `buildPatternGraph()` is a clean single-entry pipeline, the `RuntimePatternGraph` is one richly indexed snapshot, `PatternGraphAPI` is a coherent read façade, and the dependency direction at the *package* level (no inbound workspace deps) is preserved. The strongest individual choices are (1) the single-pass `transformToPatternGraph` with pre-computed views and relationship/name indices that consumers can read in O(1), and (2) the explicit `parseAtBoundary` trust-boundary helper plus `domain-enums.ts` (Zod-first canonical primitives).

Against that, the package's **internal** boundaries are weak. The biggest concerns are: (a) a broken/inconsistent `package.json#exports` that publishes a non-existent `./roles` entrypoint and surfaces almost the entire internal API through `.` via wildcard re-exports; (b) the central `PatternGraph` Zod schema uses **open `z.object`** and the inferred type is then **shadowed by a hand-written `interface`** that adds extra fields (`nameIndex`) the schema doesn't validate — a direct violation of the Zod-first doctrine on the most load-bearing contract; (c) `RoleDefinition` / `TagRegistry` / `MetadataTagDefinition` / `AggregationTagDefinition` exist twice (as `config/tag-registry-contract.ts` interfaces and as `validation-schemas/tag-registry.ts` Zod schemas), with the schema file re-exporting the contract types — duplicate types-of-record on the core taxonomy contract; (d) the `read-api` reaches *into* `generators/pipeline/relationship-resolver` and the `extractor` reaches *into* `read-api/pattern-helpers`, blurring the read-model/pipeline boundary that ADR-006 was designed to harden; and (e) substantial dead/legacy surface (`presentation-contracts.ts`, the `'codec' + 'Options'` strip-list in `config-loader.ts`, alias schemas in `feature.ts`) that No-BC requires deletion rather than retention.

## Critical Findings

### C1. `package.json` declares an export that does not exist in `src/`

- **File:** `packages/architect-core/package.json` lines 34-37; expected file `src/roles.ts` (absent); built path `dist/roles.{d.ts,js}` (will not be produced).
- **Severity:** Critical
- **Architectural impact:** The published package contract advertises three entry points (`.`, `./config`, `./roles`). `./roles` resolves to `./dist/roles.{js,d.ts}` which `tsc -b` cannot produce because no `src/roles.ts` exists (verified — no file matches `roles.*` anywhere in `src/`, and `dist/` contains no `roles.*` artifact). Any consumer doing `import { … } from '@libar-dev/architect-core/roles'` will fail at install/resolve time. This is a hard break of the public surface contract.
- **Recommendation:** Either (a) create `src/roles.ts` as the curated roles barrel (re-export `DEFAULT_ROLES`, `DDD_ES_CQRS_ROLES`, `RoleDefinition`, `ARCHITECT_PACKAGE_ROLES`, `buildRegisteredRoleValues`) and treat it as the canonical entry for role consumers, or (b) delete the `./roles` block from `package.json#exports`. Per No-BC, the right move is to pick one intentional shape and ship it. The current state is neither.

### C2. `PatternGraph` schema is open + hand-written type drifts from `z.infer`

- **File:** `src/validation-schemas/pattern-graph.ts` lines 42-179 (esp. 106, 161-179).
- **Severity:** Critical
- **Architectural impact:** This is the single read model per ADR-006. Three doctrine violations on the most load-bearing contract in the package:
  1. The top-level `PatternGraphSchema` is `z.object(...)` (open). Doctrine requires `z.strictObject(...)` so extras fail validation. Same problem for `StatusGroupsSchema`, `ExactStatusGroupsSchema`, `StatusCountsSchema`, `PhaseGroupSchema`, `SourceViewsSchema`, `ImplementationRefSchema`, `RelationshipEntrySchema`, `ArchIndexSchema`.
  2. The exported `PatternGraph` is a **hand-written `interface`** (line 161-179), not `z.infer<typeof PatternGraphSchema>`. The interface diverges by adding `nameIndex?: ReadonlyMap<string, ExtractedPattern>` (line 177) which the schema never declares. The runtime path in `transform-dataset.ts` line 269 always populates `nameIndex`, but boundary validation in `parseAtBoundary` will silently drop it.
  3. `StatusGroups`, `PhaseGroup`, `SourceViews`, `ArchIndex`, `ExactStatusGroups` are also hand-written instead of derived from their schemas (lines 125-160).
- **Recommendation:** Make the schemas the single source. (1) Convert all schemas in this file to `z.strictObject`. (2) Add `nameIndex` to the schema (or remove it from the public type — it's an optimization, not part of the contract). (3) Replace every interface in this file with `export type X = z.infer<typeof XSchema>`. If a runtime-only optimization like a `Map` cannot be schematized, split it explicitly: a `PatternGraphSchema` for the parsed contract and a `RuntimePatternGraph` (already present in `transform-types.ts`) that extends it with runtime-only optimizations. Right now `RuntimePatternGraph` adds `workflow` but `nameIndex` lives on the base interface — that boundary is incoherent.

### C3. Duplicate type-of-record for `TagRegistry` / `RoleDefinition` / `MetadataTagDefinition` / `AggregationTagDefinition`

- **Files:** `src/config/tag-registry-contract.ts` (interfaces), `src/config/role-constants.ts` (`RoleDefinition`), `src/validation-schemas/tag-registry.ts` (Zod schemas + re-exports).
- **Severity:** Critical
- **Architectural impact:** `validation-schemas/tag-registry.ts` defines `RoleDefinitionSchema`, `MetadataTagDefinitionSchema`, `AggregationTagDefinitionSchema`, `TagRegistrySchema` but then **re-exports the `config/` interface types** (lines 20, 52) as if they're its inferred types: `export type RoleDefinition = ConfigRoleDefinition;` and `export type { AggregationTagDefinition, MetadataTagDefinition, TagRegistry };`. This means the runtime parse and the static type are derived from two separate definitions; they can drift, and Zod fields like `aliases` default and `repeatable` default declared in the schema are not reflected in the interface. The barrel (`src/index.ts`) re-exports both the schemas (from `validation-schemas/`) and the interfaces (from `config/`) for the same names — consumers can import either path and get subtly different shapes.
- **Recommendation:** Pick one source. Given Zod-first doctrine, the schema wins. Delete `config/tag-registry-contract.ts` interface definitions, switch `config/types.ts`'s `RoleDefinition`/`TagRegistry` imports to `z.infer` from the schema, and have `taxonomy/registry-builder.ts` `buildRegistry()` return `z.infer<typeof TagRegistrySchema>`. The current mutual re-export pattern is exactly the kind of compatibility shim No-BC prohibits.

## High Findings

### H1. `src/index.ts` barrel is unreviewable and leaks internals

- **File:** `src/index.ts` (272 lines, ~140 named exports plus `export *` for five modules: `types`, `validation-schemas`, `validation/fsm`, `scanner`, `extractor`, `utils`, `read-api`).
- **Severity:** High
- **Architectural impact:** The `.` entrypoint is the public contract for every downstream package (`projection`, `guard`, `cli`, `mcp`). The barrel mixes (a) the canonical read API (`buildPatternGraph`, `createPatternGraphAPI`), (b) low-level scanner/extractor internals (`scanPatterns`, `extractPatterns`, AST parser internals via `export * from './scanner/index.js'`), (c) error-creation factories (`createFeatureParseError`, `createDirectiveValidationError`), (d) the entire validation-schemas surface (`export * from './validation-schemas/index.js'`), and (e) two complete enum dumps (~80 names from `taxonomy/index.ts`, lines 84-187). There is no signal at all about which symbols are intentional consumer-facing vs which are leftover internal exports. Wildcard re-export of `scanner` and `extractor` directly contradicts ADR-006's separation: stage-1 scanner/extractor APIs are listed in the ADR as *legitimately accessible only to a small set of stage-1 consumers*, but the barrel exports them to everyone.
- **Recommendation:** Curate. Define the intended consumer surface (probably: pipeline + read API + Zod-validated contracts + canonical taxonomy enums) and drop the rest. Remove `export *` for `scanner`, `extractor`, and `validation-schemas` and replace with explicit named exports for the symbols projection/guard actually consume. Add a top-of-file comment explaining that the barrel is the package contract — modifications require an ADR or a downstream sweep. Per "Don't add features beyond what the task requires," strip anything no downstream package imports.

### H2. Anti-pattern: read API reaches into the build pipeline, extractor reaches back into the read API

- **Files:**
  - `src/read-api/pattern-helpers.ts` line 18 imports `buildCanonicalRelationshipIndex` from `../generators/pipeline/relationship-resolver.js`.
  - `src/read-api/pattern-classification.ts` lines 14-15 namespace-import `* as relationshipResolver` from `generators/pipeline/relationship-resolver.js` then re-exports `buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget` (lines 75-77) as its own surface.
  - `src/extractor/gherkin-extractor.ts` line 29, `src/extractor/dual-source-extractor.ts` line 13 import `getPatternName` from `../read-api/pattern-helpers.js`.
- **Severity:** High
- **Architectural impact:** ADR-006's named anti-pattern is "feature consumer imports from `scanner/` or `extractor/`" — but the inverse direction (read-api importing pipeline internals, extractor importing read-api) is the same boundary failure in reverse. The current shape forces the pipeline package to load the read-api module to run, and forces consumers of `read-api/pattern-classification` to indirectly pull in the relationship resolver. `getPatternName(p)` is a one-line helper (`p.patternName ?? p.name`) — it is wildly out of place in `read-api/`; it's an intrinsic property of `ExtractedPattern`. `pattern-classification.ts` is essentially a "look here for these symbols" re-export trampoline of pipeline internals.
- **Recommendation:**
  - Move `getPatternName` to a neutral location (likely `validation-schemas/extracted-pattern.ts` next to the schema, or `utils/`). Drop the `read-api` round-trip from the extractor.
  - Move `buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget`, `buildCanonicalRelationshipIndex` either fully into `read-api/` (if they're part of the public read surface) or keep them in the pipeline and have `read-api/pattern-classification.ts` be a real wrapper rather than a re-export. Don't straddle.
  - Once these moves are in place, run `madge --circular src` as a CI check. The current shape is acyclic by accident, not by design.

### H3. Trust boundary inconsistency between `buildPatternGraph` and `parseAtBoundary`

- **Files:** `src/validation/boundary.ts` (defines `parseAtBoundary`), `src/generators/pipeline/build-pipeline.ts` (the `buildPatternGraph` entry, never uses `parseAtBoundary`), `src/generators/pipeline/transform-dataset.ts` line 103 (uses `ExtractedPatternSchema.safeParse` per-pattern), `src/read-api/pattern-graph-api.ts` (never re-validates).
- **Severity:** High
- **Architectural impact:** ADR-009 makes the projection trust boundary explicit (`parseAndProject*`). Core has a parallel-but-not-identical pattern: `parseAtBoundary` is exported for callers, and `transform-dataset.ts` parses each `ExtractedPattern` (catches malformed patterns), but no top-level entry validates raw `PipelineOptions` or the final `PatternGraph` shape. `buildPatternGraph(options)` accepts `PipelineOptions` typed but unvalidated; `createPatternGraphAPI(dataset)` accepts any value satisfying the (open) `PatternGraph` schema or even the hand-written interface. Where exactly is core's trust boundary? Today the answer is "halfway through `transform-dataset.ts` for individual patterns, and nowhere at all for the graph shape or pipeline inputs." This contradicts the "parse once at the trust boundary" doctrine.
- **Recommendation:** Decide the boundary deliberately. Two coherent options:
  - Option A (trust-boundary at the pipeline entry): make `buildPatternGraph` accept `unknown`, parse `PipelineOptionsSchema` once at the top, and let internal code stay unchecked.
  - Option B (boundary at the read-API): have `createPatternGraphAPI` accept `unknown`, call `parseAtBoundary(PatternGraphSchema, ...)`. This forces fixing C2 first.
  - Pick one and document it on `parseAtBoundary` and on the entrypoints. Either way, `parseAtBoundary` should be invoked at *some* core boundary today; nothing in `src/` uses it (the only callers are in other packages).

### H4. Dead surface and string-concat property strip in `config-loader`

- **Files:** `src/config/config-loader.ts` lines 188-195, `src/config/presentation-contracts.ts` (entire file).
- **Severity:** High
- **Architectural impact:** `config-loader.ts` strips properties named `'codec' + 'Options'` and `'referenceDoc' + 'Configs'` before parsing — the string-concat is clearly to avoid a grep finding the dead names, suggesting the team knows these are legacy but kept the stripper as a "compat shim." `presentation-contracts.ts` defines `CodecOptions`, `ReferenceDocConfig`, `IndexCodecOptionsContract`, `ShapeSelector`, `DiagramScope` — entire types whose entire purpose was feeding the deleted codec/presentation stack (ADR-005/W7). These types are still exported through `src/index.ts` lines 226-235. Per the No-BC doctrine cited in `00-scope.md`: *"Findings that recommend deprecation aliases or 'for backwards compatibility' shims are bad recommendations for this codebase. Recommend deletion, not soft-removal."*
- **Recommendation:** Delete `presentation-contracts.ts` entirely and remove the export from `src/index.ts`. Delete the strip-list in `config-loader.ts` and let `ArchitectProjectConfigSchema` (strict object) reject the legacy fields with a useful error message naming the deleted fields. If any downstream package still imports `CodecOptions` / `ReferenceDocConfig` / `IndexCodecOptionsContract`, that's the breaking change the No-BC doctrine welcomes — fix the caller.

### H5. `CLISchema` (610 lines, 22 KB) is a CLI concern hosted in core

- **File:** `src/config/cli-schema.ts`, re-exported through `src/index.ts` lines 236-246.
- **Severity:** High
- **Architectural impact:** Per the package-family layout in `00-scope.md` and AGENTS.md, the CLI surface belongs in `architect-cli`. `architect-core` owns "canonical model, ingestion, graph build, scanner/extractor, taxonomy, config, read API." Putting a 610-line declarative CLI schema (with command narratives, recipe examples, help-text option groups) into core inverts the dependency direction at the contract level: core is supposed to be the *substrate* every other package consumes, not the place where the CLI's UI text lives. It also pulls a CLI concern into the published contract surface of every consumer (`projection`, `guard`, `mcp`).
- **Recommendation:** Move `cli-schema.ts` to `architect-cli`. If `architect-mcp` needs to surface the same help text, expose it through `architect-cli`'s public API and have `mcp` depend on it (the family already has `core, projection ← mcp`, so `mcp ← cli` would need an ADR but is structurally fine since `cli` depends only on `core` and `guard`).

### H6. `package/` module name shadows `package.json` semantics and ships a projection concern in core

- **Files:** `src/package/` (5 files), notably `src/package/projection-error.ts`, `src/package/package-resolver.ts`.
- **Severity:** High
- **Architectural impact:** Two issues:
  1. **Naming.** A directory named `package/` inside `src/` of a package called `architect-core` is confusing — `package.json` references are rampant in TypeScript code/tooling. The grep results for "package" are now ambiguous between npm package metadata and the workspace-package resolver.
  2. **Layering.** `ProjectionError` (`src/package/projection-error.ts`) has the doc comment `"projection-error.ts"` and its error code `UNMAPPED_PACKAGE` is thrown by a resolver used by codecs/projections. The doc string on `PackageResolver` (`src/package/package-resolver.ts` line 26) literally says *"As a typed contract / data shape consumed by projection or render layers."* A projection-domain error class lives in core. Per the dependency direction (`core ← projection`), projection-specific contracts should live in `architect-projection`, with core exposing only the package-resolution primitives.
- **Recommendation:** Rename `src/package/` to `src/workspace-package/` (or `src/source-mapping/`) to remove the `package.json` collision. Move `ProjectionError` to `architect-projection` (the package it actually serves) and have `createPackageResolver` return a `Result<Package, UnmappedPackageError>` so core stays projection-agnostic. The current shape leaks a projection concept upstream into the dependency direction.

### H7. `self-hosting.ts` ships hard-coded workspace-relative paths and runs at import time

- **File:** `src/config/self-hosting.ts` lines 1-7, 70-95.
- **Severity:** High
- **Architectural impact:** This module:
  1. Resolves a workspace root via `path.dirname(fileURLToPath(import.meta.url))` plus four `..` segments at *module load time* (line 7).
  2. Hardcodes globs for **every sibling package** in the monorepo (`packages/architect-core`, `-projection`, `-guard`, `-cli`, `-mcp`) at lines 72-89.
  3. Eagerly constructs `WORKSPACE_TAG_REGISTRY` at module load (line 93).
  4. Exports all of this from the public barrel.

  Once published, the calculated workspace root in node_modules will not correspond to any meaningful directory. The hard-coded sibling globs are correct only inside this monorepo. `resolveWorkspaceSources` does try to gate on path suffix, but the side-effectful module-load resolution still runs in every consumer, and `WORKSPACE_TAG_REGISTRY` is still publicly exported. Core has no inbound workspace deps, so the only consumer is the architect dogfood — meaning this is a dogfood-only module published as part of the library.
- **Recommendation:** Move the self-hosting config out of `architect-core/src/` entirely. The dogfood `architect.config.ts` at the repo root is the right home for it. If absolutely needed in core (to avoid duplication), put it behind a lazy-loaded subpath export with explicit documentation that it's repo-internal and not part of the public API. Either way, eliminate the module-load-time `fileURLToPath`+`../../../../` resolution.

### H8. BC-alias schemas in `validation-schemas/feature.ts`

- **File:** `src/validation-schemas/feature.ts` lines 100-110.
- **Severity:** High
- **Architectural impact:** Six aliases exist purely for renamed-symbol backward compatibility: `ParsedStepSchema = GherkinStepSchema`, `ParsedScenarioSchema = GherkinScenarioSchema`, `ParsedBackgroundSchema = GherkinBackgroundSchema`, `ParsedFeatureSchema = GherkinFeatureSchema`, `FeatureFileSchema = ScannedGherkinFileSchema`, plus matching type aliases. This is exactly the "renaming an internal `_var` to silence a warning — delete it instead" / BC-alias pattern AGENTS.md `Engineering doctrine → No-BC` forbids. They're re-exported from the validation-schemas barrel and ultimately surface through `src/index.ts` (`export * from './validation-schemas/index.js'`).
- **Recommendation:** Delete the aliases. Migrate callers (likely a handful of files in scanner/extractor or tests) to the `Gherkin*` names. Pre-1.0; this is the cheap moment to do it.

## Medium Findings

### M1. `RuntimePatternGraph` extends `PatternGraph` to add only `workflow` while `nameIndex` lives on the base type

- **Files:** `src/generators/pipeline/transform-types.ts` lines 32-34, `src/validation-schemas/pattern-graph.ts` lines 161-179.
- **Severity:** Medium
- **Architectural impact:** The contract/runtime separation is half-implemented. `PatternGraph` has `nameIndex?: ReadonlyMap<…>` baked into the contract type but absent from the schema (see C2). `RuntimePatternGraph` exists *specifically* to add a runtime-only field (`workflow`) on top of `PatternGraph`. These are inconsistent design moves — pick one place for non-schema runtime data.
- **Recommendation:** When fixing C2, move `nameIndex` to `RuntimePatternGraph` along with `workflow`. Make `PatternGraph` the strict, validated contract; `RuntimePatternGraph` the runtime-enriched shape.

### M2. Schemas re-validate inside the pipeline despite the parse-once doctrine

- **File:** `src/generators/pipeline/transform-dataset.ts` lines 102-112; `src/extractor/doc-extractor.ts` line 294; `src/extractor/gherkin-extractor.ts` (re-validates again inside extraction).
- **Severity:** Medium
- **Architectural impact:** Each pattern is validated by `ExtractedPatternSchema.safeParse` once in `buildPattern()` (extractor) and again in `transformToPatternGraphWithValidation()` (transform). The doctrine says parse once at the trust boundary. The transform stage is the right place; the extractor's per-pattern `safeParse` is redundant after the transformer validates the merged list. (The extractor needs to *construct* a valid pattern to populate the typed array, but it can do that with a schema-typed builder rather than parsing.) Same pattern in `gherkin-extractor`.
- **Recommendation:** Centralise validation in the transform step. Make `extractPatterns`/`extractPatternsFromGherkin` produce raw `unknown[]` (or a structurally-typed but unvalidated array) and have `transformToPatternGraph` be the single boundary. Or, conversely, validate in the extractor and skip the second parse in the transformer. Either coherent — the current double-parse is the worst of both.

### M3. The barrel re-exports two full enum dumps from `taxonomy/`

- **File:** `src/index.ts` lines 84-187 (single import block, ~50 named values + ~30 type aliases).
- **Severity:** Medium
- **Architectural impact:** Mixed concerns. Some of these are canonical primitives that *every* downstream package consumes (`ACCEPTED_STATUS_VALUES`, `PROCESS_STATUS_VALUES`, `MATURITY_VALUES`, `normalizeStatus`, `inferMaturity`). Others are CLI-specific generator options (`ADR_LIST_GROUP_BY`, `PR_CHANGES_SORT_BY`, `REMAINING_WORK_SORT_BY`, `TIMELINE_GROUP_BY`, `SESSION_FINDINGS_GROUP_BY`, `PRD_FEATURES_GROUP_BY`, `CONSTRAINTS_GROUP_BY`, `DELIVERABLES_GROUP_BY`, `ACCEPTANCE_CRITERIA_FORMAT`, `CORE_PATTERNS_FORMAT`, `DELIVERABLES_FORMAT`, `DEPENDENCIES_FORMAT`, `PATTERN_LIST_FORMAT`). The latter group reads as "what the CLI command output knobs are named" — H5's CLI-in-core problem one level deeper.
- **Recommendation:** When the CLI schema moves out (H5), move these generator-option enums with it. Keep only canonical lifecycle/maturity/status primitives plus the registry-building helpers in the core barrel.

### M4. `taxonomy/` and `config/` are mutually entangled

- **Files:** `src/taxonomy/registry-builder.ts` imports from `../config/tag-registry-contract.js`, `../config/role-constants.js`, `../config/defaults.js`; `src/validation-schemas/tag-registry.ts` imports `buildRegistry` from `../taxonomy/index.js`; `src/config/types.ts` imports `RoleDefinition` from `./role-constants.js` and `TagRegistry` from `./tag-registry-contract.js`.
- **Severity:** Medium
- **Architectural impact:** The semantic separation between "taxonomy" (canonical constant value sets) and "config" (project configuration shape and resolution) is not respected by the imports. `config/role-constants.ts` looks like taxonomy (a literal const array of `RoleDefinition`), `config/tag-registry-contract.ts` is the type-of-record for what `taxonomy/registry-builder.ts` returns. These belong in `taxonomy/`. The import graph happens to be acyclic only because TypeScript's `import type` is erased.
- **Recommendation:** Move `role-constants.ts`, `tag-registry-contract.ts` into `taxonomy/`. Then `taxonomy/` owns: canonical values, types, registry builder, role definitions. `config/` owns: project-config schema, config discovery/loading, runtime resolution. `validation-schemas/tag-registry.ts` becomes the Zod schema layer on top of `taxonomy/` types (once C3 is fixed, the Zod schema *is* the type).

### M5. `output-schemas.ts` depends on `extractor/`

- **File:** `src/validation-schemas/output-schemas.ts` lines 4-7 imports `EXTRACTION_DIAGNOSTIC_CODES`, `EXTRACTION_DIAGNOSTIC_SEVERITIES` from `../extractor/extraction-diagnostics.js`.
- **Severity:** Medium
- **Architectural impact:** The `validation-schemas/` folder is supposed to be the leaf-most layer (schemas, contracts, no behaviour). Importing from `extractor/` puts the pipeline above schemas in the dep graph — and `extraction-diagnostics.ts` is itself a `validation-schemas`-shaped file (it defines const arrays of codes/severities + a couple of factories). The codes/severities arrays belong in `validation-schemas/`, with the diagnostic-creation factories in `extractor/`.
- **Recommendation:** Split `extraction-diagnostics.ts`: move `EXTRACTION_DIAGNOSTIC_CODES`, `EXTRACTION_DIAGNOSTIC_SEVERITIES`, `EXTRACTION_DIAGNOSTIC_SEVERITY_BY_CODE`, and the diagnostic schema/types into `validation-schemas/extraction-diagnostic.ts`. Keep the `createDiagnostic` / `createDeprecatedTagDiagnostic` factories in `extractor/`. Then `output-schemas.ts` reads from `validation-schemas/extraction-diagnostic.ts`, which respects the leaf layering.

### M6. `pattern-classification.ts` re-exports three symbols from a pipeline internal

- **File:** `src/read-api/pattern-classification.ts` lines 75-77.
- **Severity:** Medium
- **Architectural impact:** `buildDeclaredPatternIndex`, `inferPackageId`, `resolveUsesTarget` are exported here verbatim by re-assignment (`export const buildDeclaredPatternIndex = relationshipResolver.buildDeclaredPatternIndex`). The read-api index then re-exports them again (`src/read-api/index.ts` lines 45-50), and `src/index.ts` re-exports the entire `read-api` barrel. The result: three pipeline-internal helpers are part of the public package contract via two layers of indirection. (Part of H2 but worth calling out distinctly — these specific three symbols are the wart most likely to surprise consumers.)
- **Recommendation:** Pick one home for these (likely `read-api/`, since they're useful for edge classification by consumers), move them there, and let `transform-dataset.ts`/`relationship-resolver.ts` import them from `read-api/` if needed (or invert: keep them in the pipeline and don't re-export from `read-api`).

### M7. FSM is a 4-state aggregate but `PatternGraphAPI` exposes a 5-state `getPatternsByStatus`

- **Files:** `src/validation/fsm/states.ts` lines 14-23 (`ProcessStatusValue` = 4 states excluding `candidate`), `src/read-api/pattern-graph-api.ts` line 51 (`getPatternsByStatus(status: AcceptedStatusValue)`).
- **Severity:** Medium
- **Architectural impact:** The dual-type approach is correct per ADR-007 Decision 4 (`AcceptedStatusValue` for extraction, `ProcessStatusValue` for FSM). However, the read API exposes both: `getPatternsByStatus` accepts 5-state, `isValidTransition` accepts 4-state, `checkTransition` accepts `string`, `getValidTransitionsFrom` accepts 4-state, `getProtectionInfo` accepts 4-state. Consumers calling `getPatternsByStatus('candidate')` then `getValidTransitionsFrom(...)` on each returned pattern will hit a runtime/type mismatch. This isn't wrong but it's *unguarded* — there's no explicit narrowing helper on the API.
- **Recommendation:** Add a typed helper like `narrowToProcessStatus(p: ExtractedPattern): ProcessStatusValue | null` to the read API and use it in any code path that wants to call FSM functions on graph patterns. Or add `getProcessTrackedPatterns()` / `getCandidates()` as explicit partitions.

### M8. `validation-schemas/tag-registry.ts` uses `z.function()` for `transform`

- **File:** `src/validation-schemas/tag-registry.ts` line 32.
- **Severity:** Medium
- **Architectural impact:** A `MetadataTagDefinition.transform` is `(v: string) => string`, which means the schema is not actually a data contract — it's a "schema + executable" hybrid. Functions cannot serialize, cannot be round-tripped through JSON, cannot cross MCP boundaries. The TagRegistry is what flows through CLI/MCP boundaries to identify legal metadata. This contradicts Zod-first boundaries: the boundary contract should be data-only.
- **Recommendation:** Replace `transform` with a small enum of named transforms (`'pad-adr' | 'strip-quotes' | …`). The registry stays serializable; the resolution from name to function happens at one place in the extractor/registry-builder.

## Low Findings

### L1. `BusinessRuleSchema` is `z.object` and `tags: z.array(z.string())` is unconstrained

- **File:** `src/validation-schemas/extracted-pattern.ts` lines 13-19.
- **Severity:** Low
- **Architectural impact:** Minor doctrine slip; same fix as C2 for strictness.

### L2. `getPatternsByQuarter` does not validate the quarter format

- **File:** `src/read-api/pattern-graph-api.ts` line 306.
- **Severity:** Low
- **Architectural impact:** The `QUARTER_PATTERN` regex is enforced on extraction but the read API accepts any `string` for the query. Pattern: `getPatternsByQuarter('not-a-quarter')` returns `[]` silently. Either validate against `QUARTER_PATTERN` and return `undefined` for malformed input, or type the parameter as a `Quarter` branded type at the API.

### L3. `clonePatternGraph` deep-clones on every `getPatternGraph()` call

- **File:** `src/read-api/pattern-graph-api.ts` lines 81-108, 344-346.
- **Severity:** Low
- **Architectural impact:** Every read-API getter `cloneValue`s its return; `getPatternGraph()` invokes `structuredClone` on the entire dataset. For a CLI/MCP that calls multiple API methods per request, this is a real cost on graphs with thousands of patterns. The `readonly` types in the graph schema would already prevent mutation at the type level; the runtime cloning is a belt-and-suspenders that has no offsetting safety in a TypeScript codebase consumed only by other TypeScript packages.
- **Recommendation:** Drop `cloneValue` from the getters that return slices of indexed views (`getPatternsByStatus`, `getPatternsByRole`, etc.). Keep cloning at the actual mutation-prone surface (e.g. when handing data to renderers that re-sort in place). Document the contract as "read-only — do not mutate" rather than enforcing it at runtime. Architect-projection performance gates likely benefit.

### L4. `read-api/pattern-graph-api.ts` mixes computed properties and TODO-shaped state

- **File:** `src/read-api/pattern-graph-api.ts` lines 158-162, 207-215.
- **Severity:** Low
- **Architectural impact:** `getStatusDistribution` and `getCompletionPercentage` recompute percentages on every call from `dataset.counts`. The `transform-dataset.ts` could store these once. Minor; the cost is real if MCP queries hammer this.

### L5. Two diagnostic-code dictionaries can drift

- **Files:** `src/extractor/extraction-diagnostics.ts` (codes/severities), `src/validation-schemas/output-schemas.ts` (re-validates with `z.enum(EXTRACTION_DIAGNOSTIC_CODES)`).
- **Severity:** Low
- **Architectural impact:** Today they are kept in sync only by import (good), but the `z.enum` is recomputed at module-load from the array — a single source. M5's split would not threaten this; if the codes moved with the schema, the factory functions in extractor would import them, not vice versa.

## ADR Conformance Summary

| ADR | Subject | Conformance | Notes |
| --- | --- | --- | --- |
| ADR-003 | Source-First Pattern Architecture | Conforms | TypeScript source files carry `@architect-pattern` annotations; `mergePatterns()` enforces single-definition. |
| ADR-006 | Single Read Model | **Partial** | `PatternGraph` is the single read model and downstream consumers use it (good). However, `read-api/` imports pipeline internals and `extractor/` imports `read-api/pattern-helpers`, blurring the layer (H2). The PatternGraph schema is not strict and is shadowed by a hand-written interface (C2). |
| ADR-007 | Coordinated Taxonomy Redesign | **Partial** | `AcceptedStatusValue` vs `ProcessStatusValue` boundary is implemented correctly (status-values.ts, FSM). Maturity axis, roles, and the unified role system are present. However, `RoleDefinition`/`TagRegistry` duplicate types-of-record (C3) and the taxonomy/config import direction is tangled (M4) — the coordinated redesign appears to have left two parallel definitions in place that the ADR conceptually wanted unified. |
| ADR-009 | Projection Trust Boundary | N/A here | This ADR governs projection. Core's analogous boundary is `parseAtBoundary`; the inconsistency between that helper, the per-pattern validation in `transform-dataset.ts`, and the absent top-level validation is documented in H3. |

## File/Module Map of Worst Offenders

- `src/index.ts` — H1 (entire barrel needs curation), M3 (taxonomy dump).
- `src/validation-schemas/pattern-graph.ts` — C2 (open schemas + hand-written types), M1.
- `src/validation-schemas/tag-registry.ts` ↔ `src/config/tag-registry-contract.ts` ↔ `src/config/role-constants.ts` — C3 (duplicate type-of-record).
- `src/config/presentation-contracts.ts`, `src/config/config-loader.ts:188-195` — H4 (delete).
- `src/config/cli-schema.ts` — H5 (move to architect-cli).
- `src/config/self-hosting.ts` — H7 (move to repo dogfood config).
- `src/package/` — H6 (rename + move ProjectionError).
- `src/read-api/pattern-helpers.ts`, `src/read-api/pattern-classification.ts`, `src/extractor/{gherkin-extractor,dual-source-extractor}.ts` — H2/M6 (boundary tangle).
- `src/validation-schemas/feature.ts:100-110` — H8 (delete BC aliases).
- `src/validation-schemas/output-schemas.ts` ↔ `src/extractor/extraction-diagnostics.ts` — M5 (split data from factories).
- `package.json` exports `./roles` — C1 (broken contract).
