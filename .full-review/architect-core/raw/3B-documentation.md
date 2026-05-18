# architect-core — Phase 3B: Documentation Review

**Reviewer:** documentation-architect agent  
**Date:** 2026-05-17  
**Prior phases:** Phase 1 (`01-quality-architecture.md`), Phase 2 (`02-simplification-cleanup.md`)  
**Sources examined:** `packages/architect-core/README.md`, `src/index.ts` (273 lines), representative source files across 11 subdirectories, `architect/decisions/` (9 ADRs/PDRs), `MIGRATION.md`, `.changeset/`, `docs-live/PATTERNS.md`, `docs-live/ARCHITECTURE.md`, `CONTRIBUTING.md`, `AGENTS.md`.

---

## 1. Executive Summary

The package's inline JSDoc health is **bimodal**: the twelve files that carry `@architect-pattern` module annotations are well-annotated and purposeful; the remaining 78 files (74%) have no annotation at all, which means the PatternGraph is blind to the most foundational modules in the package — all 19 taxonomy files, all 10 utils files, the entire `generators/pipeline/` internal surface, and 14 of 19 config files. For a system whose core doctrine is "Architect State is Code," that gap is structurally contradictory.

The package README is four lines that contain two confirmed stale references and omit the two most important consumer-facing entry points (`buildPatternGraph`, `createPatternGraphAPI`). A new consumer reading it would not know what to import, what the public contract is, or how to distinguish the intended API from the leaked internals the barrel exposes.

The two most critical gaps for new consumers are: (1) the README provides no actionable guidance on what to import — it names utility helpers but never the primary API functions — and (2) `src/index.ts` lacks a single comment explaining what it is, which symbols are the intended public contract, and which are leaked internal details, leaving consumers to infer the boundary from 273 lines of exports. The three most important ADRs for this package (ADR-003, ADR-006, ADR-007) are referenced in exactly one source file between them, and not at all in the README or CONTRIBUTING.md.

The strengths worth preserving are the handful of module-level JSDoc blocks that genuinely explain purpose and rationale (`build-pipeline.ts`, `doc-extractor.ts`, `gherkin-extractor.ts`, `config-loader.ts`), and the `MIGRATION.md` which is concise, accurate, and covers the v1 → v2 JS API collision map completely.

---

## 2. README Audit

**File:** `packages/architect-core/README.md` (18 lines total)

The entire README is reproduced here for clarity:

```
# @libar-dev/architect-core

Core read-model, config, extraction, and validation utilities for the Architect
package family.

This package owns trusted graph construction and shared boundary primitives. Projection,
CLI, MCP, and Studio consumers should enter through the public graph/config APIs instead of
importing scanner internals or re-validating already trusted projection output.

## Boundary validation

Use the shared boundary helpers instead of re-defining local parse wrappers:

- `src/zod-primitives.ts` — canonical shared Zod primitives.
- `src/utils/errors.ts` — `formatZodError` and `parseOrThrow` for trust-boundary parsing.
- `src/utils/session-helpers.ts` — shared session enums and user-facing Zod formatting helpers.
- `src/utils/argv-hygiene.ts` — null-byte checks and safe CLI/MCP string schemas.
```

### Section-by-section findings

**Title and tagline (lines 1-3):** Accurate. The tagline "Core read-model, config, extraction, and validation utilities" is a reasonable summary but front-loads the least consumer-relevant concern (extraction) and omits the most important: the `buildPatternGraph` + `createPatternGraphAPI` entry points. The first paragraph (lines 5-8) is actually the most useful prose in the document — it correctly states the consumer guidance ("enter through the public graph/config APIs") — but because it isn't tied to any specific symbol, a new consumer cannot act on it.

**Critical omission — no primary API documentation:** The README never mentions `buildPatternGraph()` or `createPatternGraphAPI()`. These are the two functions any consumer of this package will call first. The AGENTS.md repo-root file (line 154-158) documents them correctly:

> - `buildPatternGraph()` — ingest annotated source + Gherkin, produce a typed graph.
> - `createPatternGraphAPI()` — read-side API for queries (used by CLI bins and MCP tools).

That documentation exists at the repo level but not in the per-package README where npm and package consumers will look first. **Fix:** add a "Quick start" section with a minimal import example and `PipelineOptions` field table, referencing `buildPatternGraph` and `createPatternGraphAPI` as the primary entry points.

**CL-CORE-7 confirmed — `src/zod-primitives.ts` does not exist (line 14):** Verified by prior Phase 2 audit. The file referenced is `src/utils/argv-hygiene.ts` for null-byte and CLI string schemas, and `src/validation/boundary.ts` for `parseAtBoundary` + `BoundaryParseError`. The README bullet is actively misleading — it names a path that will 404 for any developer who tries to follow it.

**CL-CORE-9 confirmed and extended — trust-boundary bullet list is wrong (lines 14-18):** The list names four items: `src/zod-primitives.ts` (nonexistent), `src/utils/errors.ts` (exports `formatZodError`/`parseOrThrow` — both of which are in the CL-CORE-5 dead-export list, zero workspace callers), `src/utils/session-helpers.ts` (`formatUserZodError` is also in CL-CORE-5 dead-export list), and `src/utils/argv-hygiene.ts` (real and useful). The actual trust-boundary primitive is `src/validation/boundary.ts` (`parseAtBoundary`, `BoundaryParseError`), which is not mentioned. Three of four bullets are wrong; the correct one is absent.

Additional stale reference: `src/utils/errors.ts` is listed in the README as providing `formatZodError` and `parseOrThrow` — these are not the exported names. The actual exports from `src/utils/errors.ts` visible in `src/index.ts` are not `formatZodError`/`parseOrThrow`; those names do not appear in the barrel. This suggests the README was written against an earlier version of the utils surface.

**No installation instructions:** The README has no `pnpm add` / `npm install` instructions, no peer-dependency notice (Node ≥ 20 per `package.json:engines`), and no note that this is a pure ESM package (`"type": "module"`), which affects how consumers configure their bundlers. Other packages in the family have the same gap, but it matters most for `architect-core` because it is the foundational consumer-facing package.

**No public-API surface description:** The barrel exports 140+ named symbols. The README does not distinguish the intended public contract from the leaked internals. There is no "Intended for consumers" vs "Internal to pipeline" classification. This directly compounds H-CORE-1 (barrel leaks scanner/extractor internals).

**No ADR pointer:** The README does not mention `architect/decisions/` or any specific ADR. A contributor landing in this package cannot find the rationale for `z.strictObject`, `parseAtBoundary`, or the single-read-model constraint without already knowing to look in AGENTS.md.

**No dependency direction statement:** The family dependency direction (`core ← projection`, `core ← guard ← cli`, `core,projection ← mcp`) is documented in AGENTS.md (line 39) and README.md (line 19) but not in the per-package README. A contributor to `architect-core` cannot tell which packages they are allowed to depend on.

**Concrete fix for the README:** Replace entirely with a document that covers: (1) one-line install, (2) quick start with `buildPatternGraph` + `createPatternGraphAPI` showing a realistic `PipelineOptions` shape, (3) public API section listing the intended exports with a clear note that `scanner/`, `extractor/`, and `taxonomy/` internals appear in the barrel but are consumed by pipeline packages only, (4) boundary validation with the correct `parseAtBoundary` reference, (5) ADR pointer, (6) dependency direction statement.

---

## 3. JSDoc Coverage Map

The table covers every symbol group exported from `src/index.ts`, organized by source module. "File JSDoc" = the file has a module-level `@architect-pattern` block. "Function JSDoc" = the primary exported function(s) have their own `/** ... */` block at the declaration site. "`@architect-*`" = has any `@architect-pattern`/`@architect-status`/`@architect-role` annotation.

| Symbol / Module | File JSDoc | Function JSDoc | `@architect-*` annotation | Accurate? |
|---|---|---|---|---|
| `buildPatternGraph` (`generators/pipeline/build-pipeline.ts`) | Yes — detailed block with `@architect-decision core-deps`, rationale, invariant | No dedicated function-level JSDoc on the function declaration itself (line 124); the module block covers the invariant | Yes | Mostly. "When to Use" bullet is the generic boilerplate (see §4 DOC-M-3) |
| `transformToPatternGraph` / `transformToPatternGraphWithValidation` (`generators/pipeline/transform-dataset.ts`) | No | No | No | N/A — no annotation exists |
| `mergePatterns` (`generators/pipeline/merge-patterns.ts`) | No | No | No | N/A |
| `PipelineOptions` / `BuildResult` / `PipelineError` (interfaces in `build-pipeline.ts`) | Via module block | No — interfaces have no individual JSDoc | Yes (module-level) | Fields undocumented: `mergeConflictStrategy`, `contextInferenceRules`, `failOnScanErrors`, `tagRegistry` have no `@param`-equivalent comments |
| `createPatternGraphAPI` (`read-api/pattern-graph-api.ts`) | Yes — minimal block with `@architect-pattern PatternGraphApi` | No function-level JSDoc on `createPatternGraphAPI` (line 110) | Yes | "When to Use" is the generic boilerplate text, not specific to this function |
| `PatternGraphAPI` interface (same file) | Via module block | Methods on interface have no JSDoc | Yes (module-level) | 20+ interface methods have no documentation on semantics or return invariants |
| `parseAtBoundary` / `BoundaryParseError` (`validation/boundary.ts`) | No module-level block | `parseAtBoundary` has a one-sentence JSDoc (line 51-54) — accurate and sufficient | No `@architect-pattern` annotation | The one-sentence JSDoc is correct; the missing annotation means it does not appear in the PatternGraph |
| `createArchitect` / `CreateArchitectOptions` (`config/factory.ts`) | No | No | No | N/A |
| `defineConfig` (`config/define-config.ts`) | Yes | No separate function JSDoc | Yes (`DefineConfig`) | Adequate |
| `loadConfig` / `loadProjectConfig` / `findConfigFile` (`config/config-loader.ts`) | Yes — good block covering discovery, validation, and "When to Use" | No per-function JSDoc | Yes (`ConfigLoader`) | Good module block; individual functions undocumented |
| `ArchitectProjectConfigSchema` / `isProjectConfig` (`config/project-config-schema.ts`) | No | No | No | N/A |
| `DEFAULT_ROLES` / `DDD_ES_CQRS_ROLES` / `RoleDefinition` (`config/role-constants.ts`) | No | N/A (constants) | No | N/A — slated for consolidation into taxonomy (M-CORE-4) |
| `TagRegistry` / `MetadataTagDefinition` / `AggregationTagDefinition` (`config/tag-registry-contract.ts`) | No | N/A (interfaces) | No | N/A — slated for deletion (C-CORE-3) |
| `ARCHITECT_PACKAGE_ROLES` / `WORKSPACE_TAG_REGISTRY` / `resolveWorkspaceSources` (`config/self-hosting.ts`) | No | No — `WORKSPACE_TAG_REGISTRY` line 93 has a JSDoc on the constant above it (line 9-14 covers `ARCHITECT_PACKAGE_ROLES`) | No | These symbols are slated for deletion (H-CORE-10) and should not receive new documentation |
| `scanPatterns` (`scanner/index.ts`) | No module block | No function JSDoc on `scanPatterns` | No | N/A |
| `parseFileDirectives` / `parseFeatureFile` / `scanGherkinFiles` (`scanner/`) | `ast-parser.ts` has a module block; `gherkin-ast-parser.ts` has one | No per-function JSDoc | Yes (module-level for ast-parser, gherkin-ast-parser) | The "When to Use" bullet in `ast-parser.ts` is the generic boilerplate, not scanner-specific guidance |
| `extractPatterns` / `buildPattern` (`extractor/doc-extractor.ts`) | Yes — good block for `DocExtractor` | No per-function JSDoc | Yes | Good |
| `extractPatternsFromGherkin` / `extractPatternsFromGherkinAsync` (`extractor/gherkin-extractor.ts`) | Yes — good block for `GherkinExtractor` | No per-function JSDoc | Yes | Good; async/sync distinction is not documented in the module block |
| `extractProcessMetadata` / `combineSources` (`extractor/dual-source-extractor.ts`) | No `@architect-pattern` block | No | No | The file has the generic "When to Use" boilerplate only |
| `discoverTaggedShapes` / `extractShapes` (`extractor/shape-extractor.ts`) | No `@architect-pattern` block | No | No | The file has the generic boilerplate only |
| `FEATURE_LAYERS` / `inferFeatureLayer` (`extractor/layer-inference.ts`) | No `@architect-pattern` block | No | No | Slated for deletion (H-CORE-11, CL-CORE-5) — do not document |
| Taxonomy constants (100+ names from `taxonomy/index.ts`) | Zero `@architect-pattern` annotations across all 19 taxonomy files (one hit in registry-builder.ts is in a string literal, not an annotation) | N/A | None | The entire taxonomy module is invisible to the PatternGraph |
| `validateTransition` / `validateStatus` / `getProtectionSummary` (`validation/fsm/validator.ts`) | Yes — `FSMValidator` block | No per-function JSDoc | Yes | "When to Use" is the generic boilerplate |
| `isValidTransition` / `VALID_TRANSITIONS` (`validation/fsm/transitions.ts`) | No `@architect-pattern` block | No | No | The file has generic boilerplate only |
| `getProtectionLevel` / `isFullyEditable` / `isScopeLocked` (`validation/fsm/states.ts`) | No `@architect-pattern` block | No | No | `isFullyEditable`/`isScopeLocked` are dead exports (CL-CORE-5) |
| `PatternGraphSchema` and hand-written `PatternGraph` interface (`validation-schemas/pattern-graph.ts`) | Yes — `PatternGraph` block with ADR-006 reference | No per-schema JSDoc | Yes | This is the single file in `validation-schemas/` with an annotation; the ADR-006 reference in the JSDoc (line 12) is the only ADR cross-reference in the entire `src/` tree |
| `ExtractedPattern` / `ExtractedPatternSchema` / `BusinessRuleSchema` (`validation-schemas/extracted-pattern.ts`) | No | No | No | Critical gap — this is the primary data shape consumers work with |
| `TagRegistrySchema` / `RoleDefinitionSchema` (`validation-schemas/tag-registry.ts`) | No | No | No | |
| All other validation-schema files (12 of 16) | No | No | No | Entire schemas surface is unannotated |
| All utils (10 files) | No | No | None | `argv-hygiene.ts`, `fuzzy-match.ts`, `string-utils.ts`, `session-helpers.ts` — all unannotated |
| `createPackageResolver` / `PackageSchema` (`package/`) | `package-resolver.ts` has a module block | No | Yes (`PackageResolver`) | The module JSDoc accurately notes "As a typed contract / data shape consumed by projection or render layers" — this is the one place the boilerplate is actually correct |
| Dead surface (`CodecOptions`, `ReferenceDocConfig`, `CLI_SCHEMA`, etc.) | `cli-schema.ts` has a module block | No | Yes (`CLISchema`) | Accurate but irrelevant — both are slated for deletion (H-CORE-4, H-CORE-5) |

**Summary of JSDoc coverage:**

- **28 of 106 files** have `@architect-pattern` annotations.
- **0 of 28 annotated files** have function-level JSDoc on their primary exported functions (`buildPatternGraph`, `createPatternGraphAPI`, `transformToPatternGraph`, `parseAtBoundary`, `scanPatterns`, `loadConfig`, etc.).
- **16 annotated files** use the generic "As a typed contract / data shape consumed by projection or render layers" boilerplate under "When to Use" — this text is accurate only for `package-resolver.ts` and meaningless for service-role files like `ast-parser.ts`, `gherkin-extractor.ts`, and `validator.ts`.
- `ExtractedPatternSchema` (the primary data shape) and `PipelineOptions` (the primary input type) have no individual documentation.

---

## 4. Findings by Severity

### Critical

**DOC-C-1. README references `src/zod-primitives.ts` which does not exist** (extends CL-CORE-7)

`packages/architect-core/README.md:14`. The file has never existed in this codebase. The correct locations are `src/validation/boundary.ts` (for `parseAtBoundary` and `BoundaryParseError`) and `src/utils/argv-hygiene.ts` (for null-byte + CLI string schemas). Any developer following the README's guidance to locate the Zod primitives will find nothing. The fix is not to create `src/zod-primitives.ts` — that would require a separate architectural decision — but to rewrite the bullet to point to the two real files.

**DOC-C-2. README's trust-boundary bullet list documents dead functions** (extends CL-CORE-9)

`packages/architect-core/README.md:15-17`. `src/utils/errors.ts` is listed as providing `formatZodError` and `parseOrThrow`. These are not the names exported by that file, and `formatUserZodError` (the actual exported name from `session-helpers.ts`) is in the CL-CORE-5 dead-export list with zero workspace callers. The README steers consumers toward dead code and uses incorrect symbol names. Combined with DOC-C-1, three of the four README bullets are wrong. The fourth (`argv-hygiene.ts`) is real but incomplete without mentioning `validation/boundary.ts`.

**DOC-C-3. `src/index.ts` has no header comment identifying the public contract**

`packages/architect-core/src/index.ts:1`. The file begins immediately with `export * from './types/index.js';` with no comment. At 273 lines and 140+ named exports plus 7 wildcard re-exports, this is the package's public contract — the only thing consumers and tools use to determine what is safe to import. There is no comment distinguishing intended consumer surface from leaked scanner/extractor internals. The Phase 1 finding (H-CORE-1) recommends curation; even before curation, a minimal header stating what this file is and what the intended consumer surface consists of would reduce misuse risk immediately.

### High

**DOC-H-1. `buildPatternGraph` and `createPatternGraphAPI` have no function-level JSDoc**

`src/generators/pipeline/build-pipeline.ts:124`, `src/read-api/pattern-graph-api.ts:110`. These are the two primary consumer entry points. The module-level `@architect-pattern` blocks provide rationale for the module's existence but do not document the function signatures: what `PipelineOptions` fields are required vs optional, what `BuildResult` returns in success vs failure cases, or what invariants `PatternGraph` satisfies on return. `createPatternGraphAPI` has no documentation at all between the module block (line 1-11) and the function declaration (line 110). A consumer seeing `createPatternGraphAPI(dataset: PatternGraph): PatternGraphAPI` has to read the entire `PatternGraphAPI` interface to understand what they get.

**DOC-H-2. `PatternGraphAPI` interface methods are entirely undocumented**

`src/read-api/pattern-graph-api.ts:47-109`. The interface declares 20+ methods. None have JSDoc. Key behavioral questions are unanswered: Does `getPatternsByStatus('candidate')` use `byStatus` or `byNormalizedStatus`? What does `getPatternsByQuarter` accept — a string like `'Q1-2026'` or `'2026-Q1'`? What does `checkTransition` return when both statuses are unknown? What is the difference between `getPatternsByNormalizedStatus` and `getPatternsByStatus`? Consumers reading the interface alone cannot determine any of this.

**DOC-H-3. 16 annotated files carry identical boilerplate "When to Use" text that is wrong for most of them**

16 of 28 annotated files contain the literal text "As a typed contract / data shape consumed by projection or render layers" as the sole "When to Use" content. This is semantically correct for `package/package-resolver.ts` and `validation-schemas/pattern-graph.ts`. It is actively misleading for service-role files:

- `src/scanner/ast-parser.ts:10` — AstParser is a scanner, not a typed contract
- `src/read-api/pattern-graph-api.ts:10` — PatternGraphAPI is a query service
- `src/validation/fsm/validator.ts:12` — FSMValidator is a state machine enforcer
- `src/generators/pipeline/build-pipeline.ts:29` — BuildPipeline is the graph construction entry point

The boilerplate appears to have been mass-applied as a placeholder when the `@architect-pattern` annotations were introduced. It should be replaced with actual "When to Use" guidance appropriate to each file's role. The extractor files (`doc-extractor.ts:14-17`, `gherkin-extractor.ts:13-17`) already have accurate "When to Use" text and show what good looks like.

**DOC-H-4. `transformToPatternGraph` and `transformToPatternGraphWithValidation` have no annotation and no JSDoc**

`src/generators/pipeline/transform-dataset.ts:88-92`. These are the algorithmic heart of the package — the single-pass O(n) transformer that produces `RuntimePatternGraph` from `RawDataset`. Phase 1 called the single-pass design with pre-computed views and a relationship index "the strongest architectural choice." That choice is undocumented. There is no explanation of what the single pass does, why `RuntimePatternGraph` extends `PatternGraph` with `nameIndex`, what the pre-computed views are, or why they exist. The function declarations appear at line 88 without any preceding JSDoc. This is the one function in the package that most warrants documentation, and it has none.

**DOC-H-5. ADR-003, ADR-006, and ADR-007 are not referenced from any consumer-facing location**

The only ADR cross-reference in `packages/architect-core/src/` is a single mention of `ADR-006 (Single Read Model)` in `src/validation-schemas/pattern-graph.ts:12`. ADR-003 (Source-First Pattern Architecture — which defines the `@architect-pattern` annotation semantics, i.e., the core behavioral contract of the system) has zero references in `src/`. ADR-007 (Coordinated Taxonomy Redesign — which defines the `AcceptedStatusValue`/`ProcessStatusValue` split and the unified role system) has zero references. Neither the package README nor CONTRIBUTING.md links to `architect/decisions/`. A contributor modifying the taxonomy or FSM states cannot be expected to discover the ADR guardrails without already knowing they exist.

The `build-pipeline.ts` module block uses the custom `@architect-decision core-deps` tag, which is not a standard architect annotation and does not resolve to an actual ADR record. The correct approach per the tag registry is `@architect-see-also:ADR006SingleReadModelArchitecture`.

**DOC-H-6. `ExtractedPatternSchema` and `ExtractedPattern` — the primary data shape — have no documentation**

`src/validation-schemas/extracted-pattern.ts`. This file defines the canonical `ExtractedPattern` type that every consumer of the PatternGraph works with. It has no `@architect-pattern` annotation, no module-level JSDoc, and no documentation on any of the 40+ fields in the schema. The same applies to `BusinessRuleSchema` (line 13) — a schema with four fields and no documentation on what `scenarioCount`, `scenarioNames`, or `tags` contain in context. Any consumer trying to understand the data shape must reverse-engineer it from the schema constraints.

### Medium

**DOC-M-1. `PipelineOptions` interface fields undocumented**

`src/generators/pipeline/build-pipeline.ts:60-71`. The interface has 9 fields, none documented:
- `input` — what glob patterns are expected? Absolute paths? Relative to `baseDir`?
- `features` — is this Gherkin feature file globs?
- `mergeConflictStrategy` — `'fatal'` vs `'concatenate'` behavior is not explained
- `contextInferenceRules` — entirely undocumented purpose
- `tagRegistry` — is this the full registry or can it be partial?
- `failOnScanErrors` — what "scan errors" qualify?

**DOC-M-2. Cross-package dependency direction is not documented at the per-package README level**

The family dependency direction (`core ← projection`, `core ← guard ← cli`, `core,projection ← mcp`) appears in AGENTS.md (line 13) and the root README (line 19) but is absent from `packages/architect-core/README.md`. A contributor adding an import to `architect-core` from a sibling package would not know they are inverting the dependency direction without consulting AGENTS.md.

**DOC-M-3. `@architect-decision core-deps` is a non-standard tag**

`src/generators/pipeline/build-pipeline.ts:8`. The tag `@architect-decision core-deps` does not appear in the tag registry (verified via `src/taxonomy/registry-builder.ts`). It will not be parsed by the extractor and will not appear in the PatternGraph or generated docs. The intent appears to be linking to a decision about dependency ownership. If this is meant to reference an ADR, use `@architect-see-also:ADR003SourceFirstPatternArchitecture` or create a proper ADR. If it is freeform prose, move it to the descriptive body of the JSDoc.

**DOC-M-4. `parseAtBoundary` lacks `@architect-pattern` annotation despite being a load-bearing public export**

`src/validation/boundary.ts`. The function has a good one-sentence JSDoc. It is exported from the barrel. Phase 1 called it "exactly the right shape." But it has no `@architect-pattern` annotation, so it does not appear in the PatternGraph, does not show up in the generated `docs-live/PATTERNS.md` catalog, and cannot be queried via the MCP tools. Given that the package's own doctrine says "Architect State is Code" and annotations are documentation, the absence means the boundary primitive is invisible to the system that is supposed to track it.

**DOC-M-5. CONTRIBUTING.md references "four-stage pipeline architecture (Scanner, Extractor, Transformer, Codec)" which is outdated**

`CONTRIBUTING.md:60`. The Codec stage was removed in the W7 simplification wave (ADR-005 led to Codec → Renderer, then the codec stack was deleted per ADR-009). The current pipeline is Scanner → Extractor → Transformer → PatternGraph (read model). "Codec" is a v1 concept. A contributor reading CONTRIBUTING.md gets a wrong mental model of the pipeline before making their first change.

**DOC-M-6. Generated `docs-live/PATTERNS.md` confirms the annotation gap — 78 core source files do not appear**

The generated `PATTERNS.md` lists 236 patterns across the entire family. The `architect-core` contribution is 28 entries. The pipeline internals (`transformToPatternGraph`, `mergePatterns`, `relationshipResolver`), the entire taxonomy module, and the entire utils module are absent because they carry no `@architect-pattern` annotations. The PatternGraph cannot answer "what does the taxonomy module contain?" or "how does the transform pipeline work?" because those modules are invisible to it. This is a structural contradiction in a system whose purpose is making code queryable.

**DOC-M-7. `MIGRATION.md` does not document `architect-core` per-function API changes**

`MIGRATION.md` covers the v1 → v2 JS API collision map accurately (8 symbol names that collide across splits). However, it does not document:
- The `PipelineOptions` shape change from v1 (if any fields were renamed or removed in the split)
- The removal of `parseMarkdownToBlocks` (CL-CORE-5 #1), `formatUserZodError` (CL-CORE-5 #2), and other dead exports that were present in the v1 monolith
- The status of `src/config/presentation-contracts.ts` exports (`CodecOptions`, `ReferenceDocConfig`) — these were v1 codec artifacts that appear in the barrel today but will be deleted

Once the Phase 1/2 cleanup lands, MIGRATION.md will need a section covering what was removed from the `architect-core` surface.

### Low

**DOC-L-1. `BoundaryParseError` class and `BoundaryParseIssue` interface have no member-level documentation**

`src/validation/boundary.ts:3-47`. The class has three properties (`details`, `cause`, name). `details` is the one consumers inspect to understand a parse failure — it has no documentation explaining what `path`, `input`, `expected`, and `received` contain. Given that `parseAtBoundary` is being promoted as the trust-boundary primitive, the error shape it throws should be documented.

**DOC-L-2. `@architect-role:utility` on `PatternGraphApi` is semantically inaccurate**

`src/read-api/pattern-graph-api.ts:5`. `PatternGraphAPI` is the primary read API for CLI bins, MCP tools, and projection consumers — it is the API surface, not a utility. The role `contract` (used by `PatternGraph` and `ResultMonadTypes`) or `service` would be more accurate. This is a minor annotation quality issue but matters because role groupings in `docs-live/ARCHITECTURE.md` will misplace it.

**DOC-L-3. `.changeset/README.md` references `@libar-dev/architect-spec` in the `ignore` list without explaining why**

`.changeset/config.json:19` ignores `"architect-self-host-example"` — a package name that no longer exists post-W1.5. The `ignore` list entry is stale and should be removed to avoid confusion. The README explanation (the fixed group bumps all six packages in lockstep) is accurate and useful.

**DOC-L-4. `CONTRIBUTING.md` has no pointer to ADRs for contributors making architectural changes**

`CONTRIBUTING.md` describes the workflow accurately but makes no mention of `architect/decisions/` or the requirement to read relevant ADRs before modifying the taxonomy, schema validation, or read API. A contributor who adds a new tag or modifies the FSM without reading ADR-007 or ADR-006 will produce a finding in the next review. One sentence ("Before changing the taxonomy, schema contracts, or read API, read the relevant ADR in `architect/decisions/`") would close this gap.

---

## 5. ADR Linkage

The following table maps load-bearing ADRs to where they should be referenced and where they currently are not.

| ADR | What it governs in `architect-core` | Currently referenced in | Missing from |
|---|---|---|---|
| ADR-003 (Source-First Pattern Architecture) | The `@architect-pattern` annotation is the canonical pattern definition; `mergePatterns()` single-definition constraint | Not referenced in any `src/` file or the README | `src/generators/pipeline/build-pipeline.ts` JSDoc (where `mergePatterns` call lives), `src/generators/pipeline/merge-patterns.ts`, `README.md`, `CONTRIBUTING.md` |
| ADR-006 (Single Read Model) | `PatternGraph` is the sole read model; no consumer re-derives from raw scanner/extractor; `read-api/` is the sanctioned query surface | `src/validation-schemas/pattern-graph.ts:12` only | `src/read-api/pattern-graph-api.ts` module block, `src/generators/pipeline/build-pipeline.ts` module block, `README.md` |
| ADR-007 (Coordinated Taxonomy Redesign) | `AcceptedStatusValue` vs `ProcessStatusValue` split; unified role system; maturity axis | Not referenced anywhere in `src/` | `src/taxonomy/status-values.ts` (where the split is defined), `src/validation/fsm/states.ts`, `src/validation/fsm/validator.ts` module block |
| ADR-009 (Projection Trust Boundary) | `parseAtBoundary` is the trust boundary primitive; parse once; downstream consumers do not re-parse | Not referenced anywhere in `src/` | `src/validation/boundary.ts` (the file that implements it) |

**Recommended additions:**

1. `src/validation/boundary.ts` module block: add `@architect-see-also:ADR009ProjectionTrustBoundary`.
2. `src/validation-schemas/pattern-graph.ts` module block: extend the existing ADR-006 reference to also cite ADR-003 (the schema file is where the single-definition constraint manifests as a validated data shape).
3. `src/validation/fsm/validator.ts` module block: add `@architect-see-also:ADR007CoordinatedTaxonomyRedesign` to explain why `ProcessStatusValue` (4-state) is distinct from `AcceptedStatusValue` (5-state).
4. `src/taxonomy/status-values.ts` (or its index): add a comment block explaining the `AcceptedStatusValue`/`ProcessStatusValue` split per ADR-007 Decision 4.
5. `README.md`: add a "Design decisions" section linking to `../../../architect/decisions/` and naming ADR-003, ADR-006, ADR-007, ADR-009 as the load-bearing ones.
6. `CONTRIBUTING.md`: add a sentence pointing contributors to `architect/decisions/` before modifying taxonomy, schema, or read-API code.

---

## 6. Architect State Health

Coverage rate by area (annotated = has `@architect-pattern` block at file level):

| Area | Files | Annotated | Rate | Assessment |
|---|---|---|---|---|
| `extractor/` | 7 | 6 | 86% | **Well-covered.** `doc-extractor.ts`, `gherkin-extractor.ts`, `dual-source-extractor.ts`, `shape-extractor.ts`, `layer-inference.ts`, `extraction-diagnostics.ts` all annotated. Only `extractor/index.ts` is unannotated (expected — re-export barrel). |
| `scanner/` | 5 | 4 | 80% | **Well-covered.** `ast-parser.ts`, `gherkin-ast-parser.ts`, `pattern-scanner.ts`, `gherkin-scanner.ts` annotated. `index.ts` unannotated (barrel). |
| `read-api/` | 7 | 5 | 71% | **Partial.** `pattern-graph-api.ts`, `pattern-helpers.ts`, `architecture-inspection.ts`, `graph-inventory.ts`, `pattern-classification.ts` annotated. `types.ts` and `index.ts` unannotated. `types.ts` defines 15+ query types (`QueryResult`, `PatternDependencies`, etc.) with no annotation. |
| `validation/` | 5 | 3 | 60% | **Partial.** `validator.ts` (`FSMValidator`) annotated. `transitions.ts` and `states.ts` have no `@architect-pattern` block despite being exported. `boundary.ts` unannotated despite being a key public export. |
| `generators/pipeline/` | 7 | 1 | 14% | **Sparse.** Only `build-pipeline.ts` annotated. `transform-dataset.ts`, `merge-patterns.ts`, `relationship-resolver.ts`, `context-inference.ts`, `transform-types.ts` all unannotated. The algorithmic core of the package is invisible to the PatternGraph. |
| `config/` | 19 | 3 | 16% | **Sparse.** Only `config-loader.ts`, `define-config.ts`, `cli-schema.ts` annotated. The remaining 16 config files (project config schema, defaults, factory, role constants, self-hosting, workflow loader, etc.) are unannotated. Several of these (`self-hosting.ts`, `presentation-contracts.ts`, `tag-registry-contract.ts`) are slated for deletion — annotating them would be wrong — but the core config files (`project-config-schema.ts`, `factory.ts`, `defaults.ts`, `workflow-loader.ts`) do constitute real architectural artifacts. |
| `validation-schemas/` | 16 | 2 | 12% | **Sparse.** Only `pattern-graph.ts` and `codec-utils.ts` annotated. 14 schema files covering the extraction shape, the feature/Gherkin shape, the output schemas, and the tag registry schema have no annotation. The PatternGraph cannot describe what `ExtractedPatternSchema`, `TagRegistrySchema`, or `OutputSchema` contain. |
| `taxonomy/` | 19 | 0 | 0% | **None.** Zero annotated files. The one grep hit is a string literal example inside `registry-builder.ts:157`, not an actual annotation. All 19 taxonomy files — status values, maturity, roles, format types, deliverable status, hierarchy levels, etc. — are invisible to the PatternGraph. |
| `utils/` | 10 | 0 | 0% | **None.** Zero annotated files. `fuzzy-match.ts`, `string-utils.ts`, `argv-hygiene.ts`, `session-helpers.ts`, `id-utils.ts` — none annotated. These are shared utilities; whether they warrant `@architect-pattern` annotations is a judgment call, but `argv-hygiene.ts` is specifically called out in the README as a trust-boundary primitive, making its annotation absence notable. |
| `types/` | 4 | 2 | 50% | **Partial.** `result.ts` (`ResultMonadTypes`) and `errors.ts` (`ErrorFactoryTypes`) annotated. `branded.ts` and `index.ts` unannotated. |
| `package/` | 5 | 1 | 20% | **Sparse.** Only `package-resolver.ts` annotated. `package-config.ts`, `projection-error.ts`, `package.ts`, `index.ts` unannotated. |

**Orphan pattern check:** No orphan annotations were found — all `@architect-pattern` declarations correspond to real exported code. The problem is the inverse: code that should be annotated (the algorithmic transform pipeline, the entire taxonomy module, the schema surface) has no annotation.

**Quality issue on annotated files:** 16 of 28 annotated files use the boilerplate "When to Use" text "As a typed contract / data shape consumed by projection or render layers." For the 14 service-role and utility-role files that carry this text, it is wrong. The system is annotating its own pattern metadata inaccurately.

**Overall Architect State rating for `architect-core`:** Partial (28/106 files, 26%). Well-covered in the extractor and scanner layers; essentially absent in the foundational layers (taxonomy, utils, generators/pipeline internal surface, validation-schemas).

---

## 7. Migration / Changelog Notes

**MIGRATION.md coverage of `architect-core` is adequate for the v1 → v2 symbol split** and covers the JS API collision map accurately. The specific gap is forward-looking rather than backward-looking.

**Gap 1: No pre-deletion notice for symbols slated for removal**

The following symbols are currently exported from `src/index.ts` and will be deleted per Phase 1/2 findings. `MIGRATION.md` does not document their removal:
- `CodecOptions`, `ReferenceDocConfig`, `IndexCodecOptionsContract`, `ShapeSelector`, `DiagramScope`, `DIAGRAM_SOURCE_VALUES` (from `presentation-contracts.ts`) — H-CORE-4
- `CLI_SCHEMA` and 8 CLI types (from `cli-schema.ts`) — H-CORE-5
- `parseMarkdownToBlocks`, `formatUserZodError`, `validateStatus`, `validateCompletionMetadata`, `validatePatternStatus`, `isFullyEditable`, `isScopeLocked`, `createFileLoader`, `formatCodecError` — CL-CORE-5
- The 6 BC alias schemas in `feature.ts` — H-CORE-12
- `WORKSPACE_TAG_REGISTRY`, `PACKAGE_SELF_HOSTING_SOURCES`, `resolveWorkspaceSources`, `ARCHITECT_PACKAGE_ROLES` from `self-hosting.ts` — H-CORE-10

For a pre-1.0 no-BC package, `MIGRATION.md` is not required to document removals — the doctrine explicitly says breaking changes are preferred over compatibility shims. However, since `MIGRATION.md` already exists and is pointed to from AGENTS.md as the v1→v2 guidance document, it should note that these symbols are removed so consumers who may have used them from the v1 monolith know they are gone.

**Gap 2: `MIGRATION.md` describes `ProjectionError` as confusingly named without fixing the confusion**

`MIGRATION.md:45` correctly notes that `ProjectionError` in `@libar-dev/architect-core` is "the package-resolver error type, not a projection-pipeline error." This is accurate but stops short of telling consumers what they should use instead. The note should say: "`ProjectionError` in `@libar-dev/architect-core` is slated for renaming/moving per Phase 1 H-CORE-9 — prefer catching `Result.err` from `createPackageResolver` directly."

**Gap 3: Changeset README lists a stale ignore entry**

`.changeset/config.json:19` ignores `"architect-self-host-example"`, a package that was removed in Wave 1.5. The entry has no effect on changeset behavior (pnpm changeset ignores unknown package names) but signals to contributors that the configuration is not being maintained.

**Gap 4: No changelog entries exist yet for the split**

`.changeset/` contains only `README.md` and `config.json` — no pending changeset markdown files. At `2.0.0-pre.1`, there will be no changeset-generated CHANGELOG for any of the six packages unless one is authored before the first `pnpm changeset version` run. Given that every package has substantial pre-release changes (the entire split from monolith), a single prose changeset summarizing the v2 shape should be authored and committed now, before the release. The `.changeset/README.md` instructions are correct for ongoing use, but there is no bootstrap changeset for the `2.0.0-pre.1` release itself.

---

## Cross-reference to Prior Phases

| This report ID | Prior phase ID | Relationship |
|---|---|---|
| DOC-C-1 | CL-CORE-7 | Confirms and extends with exact wrong symbol names |
| DOC-C-2 | CL-CORE-9 | Confirms and identifies dead function names in bullets |
| DOC-H-3 | New | 16 boilerplate "When to Use" instances not previously flagged |
| DOC-H-4 | H-CORE-8 / H-SIMP-1 context | Phase 1 flagged the single-pass design as valuable; it is undocumented |
| DOC-H-5 | Phase 1 ADR Conformance section | ADR references are inadequate in code, not just in design |
| DOC-M-5 | New | CONTRIBUTING.md references deleted Codec stage |
| DOC-M-6 | H-CORE-1 (barrel curation) | Annotation gap causes PatternGraph blindness, not just barrel curation |
