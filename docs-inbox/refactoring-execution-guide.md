# Refactoring Execution Guide: Progressive Disclosure & Codec Pipeline

> **Date:** 2026-03-31
> **Purpose:** Sequenced execution plan for implementing findings from the architectural review
> **Companion doc:** `architectural-review-progressive-disclosure-and-codecs.md`
> **Source specs:** `architect-studio/_working-docs/04-progressive-disclosure-and-indexes/spec-01 through spec-04`

---

## How to Use This Guide

This guide sequences all interventions identified in the architectural review into a dependency-ordered execution plan. Each phase has:

- **Scope**: What gets done
- **Dependencies**: What must be complete first
- **Files touched**: Specific paths and what changes
- **Acceptance criteria**: How to verify completion
- **Breaking changes**: What consumer impact to expect
- **Estimated effort**: Rough sizing

Phases are ordered by: (1) safety prerequisites, (2) structural foundations that make later work easier, (3) highest consumer value, (4) capability additions.

---

## Phase 0: Safety Net (No Behavioral Changes)

### 0A: IndexCodec Regression Tests

**Why first:** IndexCodec has zero test coverage and is the entry point for the entire documentation set. Every subsequent phase touches code that affects INDEX.md generation.

**Scope:**

- Write a regression test suite capturing current IndexCodec behavior as a golden fixture
- Cover all existing sections: package metadata, preamble injection, document inventory, product area stats, phase progress, regeneration footer
- Capture exact section ordering and separator placement

**Files to create:**

- `tests/features/doc-generation/index-codec.feature` — Gherkin scenarios (use Spec 2 Rule 1 scenarios as starting point)
- `tests/steps/doc-generation/index-codec.steps.ts` — Step definitions
- `tests/fixtures/index-codec-fixtures.ts` — Test dataset factory

**Acceptance criteria:**

- [ ] Tests pass against current IndexCodec without any code changes
- [ ] Golden fixture captures all 5 sections (metadata, stats, progress, inventory, regeneration)
- [ ] Tests verify section ordering and separator blocks
- [ ] Tests verify hardcoded values (package name, purpose, license)
- [ ] `pnpm test index-codec` passes

**Breaking changes:** None
**Effort:** 1-2 days

### 0B: Clean Up `@architect-core` Ghost Tags

**Why:** `@architect-core` has dual behavior — raw tag in TypeScript, category tag in Gherkin. This is a live inconsistency.

**Scope:**

- Remove `@architect-core` from all TypeScript JSDoc annotations where it serves no purpose
- In Gherkin files where `core` category intent is real, verify `@architect-category:core` is the correct replacement
- Fix TaxonomyCodec's hardcoded flag example from `@architect-core` to `@architect-sequence-error`

**Files to modify:**

- `src/renderable/codecs/types/base.ts:3` — remove `@architect-core`
- `src/renderable/codecs/shared-schema.ts:3` — remove `@architect-core`
- `src/renderable/codecs/taxonomy.ts` ~lines 424-437 and ~662-707 — fix flag example
- Any other files found via `grep -r '@architect-core' src/`
- Run `pnpm architect:query -- tags` to find all instances in Gherkin files

**Acceptance criteria:**

- [ ] `grep -r '@architect-core' src/` returns zero results
- [ ] TaxonomyCodec flag example shows `@architect-sequence-error`
- [ ] `pnpm build && pnpm test` passes
- [ ] `pnpm docs:all` generates without errors

**Breaking changes:** Annotation-level only. Generated taxonomy docs show different flag example.
**Effort:** 0.5 days

### 0C: Extract `archRole`/`archLayer` to Shared Constants

**Why:** Silent enum divergence between two files.

**Scope:**

- Create shared constants `ARCH_ROLE_VALUES` and `ARCH_LAYER_VALUES` in taxonomy layer
- Import in both `registry-builder.ts` and `extracted-pattern.ts`

**Files to modify:**

- `src/taxonomy/` — new constants (can go in existing file like `generator-options.ts` or new `arch-values.ts`)
- `src/taxonomy/registry-builder.ts` ~lines 505-516 — import shared constant
- `src/validation-schemas/extracted-pattern.ts` ~lines 464-476 — use `z.enum(ARCH_ROLE_VALUES)` etc.
- `src/taxonomy/index.ts` — export new constants

**Acceptance criteria:**

- [ ] Single definition of each value set
- [ ] Both consumers import from the same source
- [ ] `pnpm typecheck && pnpm test` passes

**Breaking changes:** None (internal refactoring)
**Effort:** 0.5 days

---

## Phase 1: Structural Foundations

### 1A: `createDecodeOnlyCodec()` Helper

**Why:** Eliminates ~200 lines of identical boilerplate across 21 codecs. Also becomes the migration path for `CodecContext` (Phase 1B).

**Scope:**

- Add `createDecodeOnlyCodec(decode)` function to `src/renderable/codecs/types/base.ts`
- Initially accepts `(dataset: MasterDataset) => RenderableDocument` (Phase 1B changes the signature)
- Returns `DocumentCodec` with standard encode-throws behavior
- Migrate all 21 registered codecs + unregistered reference codecs to use it
- Remove all inline `z.codec()` + `encode: () => throw` patterns

**Files to modify:**

- `src/renderable/codecs/types/base.ts` — add helper
- All 15 codec files — replace `z.codec()` ceremony with `createDecodeOnlyCodec()`
- `src/renderable/codecs/types/index.ts` — export helper

**Acceptance criteria:**

- [ ] No codec file contains an inline `encode: () => { throw` pattern
- [ ] All codecs use `createDecodeOnlyCodec()` for construction
- [ ] `pnpm build && pnpm test` passes
- [ ] Generated docs are byte-identical before and after

**Breaking changes:** None (internal refactoring, no API surface change)
**Effort:** 1 day

### 1B: `CodecContext` Wrapper (Decision Point)

**Why:** Separates extraction products from runtime context. Makes `MasterDataset` a pure read model (ADR-006 alignment).

**Decision required:** This is the highest-leverage structural change but also the highest-risk. Two options:

**Option A — Full `CodecContext` (breaking, clean):**

```typescript
interface CodecContext {
  readonly dataset: MasterDataset;
  readonly projectMetadata?: ProjectMetadata;
  readonly workflow?: LoadedWorkflow;
  readonly tagExampleOverrides?: Partial<Record<FormatType, { example: string }>>;
}
```

All codecs change from `decode(dataset)` to `decode(context)`. The `createDecodeOnlyCodec()` helper absorbs the change — codec authors update one function signature per codec.

**Option B — `projectMetadata` on MasterDataset (non-breaking, incremental):**
Add `projectMetadata?: ProjectMetadata` to `MasterDatasetSchema` as the specs propose. Simpler, but MasterDataset accumulates non-extraction fields.

**Recommendation:** Option A if this is the refactoring window. Option B if shipping speed matters more.

**Files to modify (Option A):**

- `src/renderable/codecs/types/base.ts` — define `CodecContext`, change `createDecodeOnlyCodec` signature
- All 15 codec files — update decode function parameter from `dataset` to `context` (or `context.dataset`)
- `src/renderable/generate.ts` — construct `CodecContext` in `resolveCodec()`
- `src/generators/types.ts` — update `GeneratorContext` to carry `CodecContext` components

**Acceptance criteria:**

- [ ] No codec directly receives `MasterDataset` — all go through `CodecContext`
- [ ] `MasterDataset` has no `projectMetadata` field (it's on `CodecContext`)
- [ ] All codecs access dataset via `context.dataset`
- [ ] `pnpm build && pnpm test` passes

**Breaking changes:** Internal codec interface changes. No consumer-facing API change.
**Effort:** 1-2 days (mostly mechanical find-and-replace in codec decode functions)

### 1C: `reference.ts` Decomposition (5 Files)

**Why:** At 2,019 lines, it's the biggest productivity bottleneck and the hardest file to navigate.

**Scope:** Split into 5 focused modules with clear boundaries:

| New file                   | Lines | Content                                                                                                                  | Imports from                             |
| -------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `reference-types.ts`       | ~150  | `ReferenceDocConfig`, `DiagramScope`, `ProductAreaMeta`, `ShapeSelector`                                                 | schema types only                        |
| `product-area-metadata.ts` | ~340  | `PRODUCT_AREA_META`, `PRODUCT_AREA_ARCH_CONTEXT_MAP`, `DIAGRAM_SOURCE_VALUES`                                            | `reference-types.ts`                     |
| `reference-builders.ts`    | ~310  | `buildConventionSections`, `buildBehaviorSections`, `buildShapeSections`, `buildTableOfContents`, `buildBoundarySummary` | `reference-types.ts`, helpers            |
| `reference-diagrams.ts`    | ~690  | 5 diagram type builders, 3 domain diagrams, diagram rendering infrastructure                                             | `reference-types.ts`, `diagram-utils.ts` |
| `reference.ts`             | ~530  | `createReferenceCodec()`, `decodeProductArea()`, factory + decode logic                                                  | all four above                           |

**Import chain (acyclic):**

```
reference-types.ts          ← schema types only (no codec imports)
product-area-metadata.ts    ← reference-types.ts
reference-builders.ts       ← reference-types.ts, helpers.ts, convention-extractor.ts
reference-diagrams.ts       ← reference-types.ts, diagram-utils.ts
reference.ts                ← all four above
```

**Files to modify:**

- `src/renderable/codecs/reference.ts` — split into 5 files
- `src/renderable/codecs/index.ts` — update barrel exports
- `src/renderable/codecs/reference-product-area.ts` — new (from `decodeProductArea` and `product-area-metadata.ts`)

**Re-export requirement:** `reference.ts` must re-export `createReferenceCodec`, `ReferenceDocConfig`, `DiagramScope` for backward compatibility.

**Acceptance criteria:**

- [ ] Each file is within target line range
- [ ] Import chain is acyclic (verify with `madge` or manual inspection)
- [ ] `reference.ts` has no product-area-specific content
- [ ] `product-area-metadata.ts` has no runtime logic
- [ ] Generated docs are byte-identical before and after
- [ ] `pnpm build && pnpm test` passes

**Breaking changes:** None (re-exports preserve API surface). New import paths available.
**Effort:** 1-2 days

### 1D: Utility Deduplication

**Why:** Eliminates silent divergence risks.

**Scope:**

- Move `normalizeImplPath` + `REPO_PREFIXES` from `patterns.ts`/`requirements.ts` to `src/renderable/utils.ts`
- Deduplicate `completionPercentage()` / `isFullyCompleted()` (keep in `utils.ts`, import in `transform-dataset.ts`)
- Add `backLink()` builder to `src/renderable/schema.ts`
- Add `includesDetail()` helper to `src/renderable/codecs/types/base.ts`

**Files to modify:**

- `src/renderable/utils.ts` — add `normalizeImplPath`, `REPO_PREFIXES`
- `src/renderable/codecs/patterns.ts` — import from `../utils.js`
- `src/renderable/codecs/requirements.ts` — import from `../utils.js`
- `src/generators/pipeline/transform-dataset.ts` — import `completionPercentage`, `isFullyCompleted` from renderable utils
- `src/renderable/schema.ts` — add `backLink()` builder
- `src/renderable/codecs/types/base.ts` — add `includesDetail()`

**Acceptance criteria:**

- [ ] `normalizeImplPath` defined exactly once
- [ ] `completionPercentage` defined exactly once
- [ ] No codec file defines a local copy of any deduplicated function
- [ ] `REPO_PREFIXES` exported from `utils.ts` for testing
- [ ] `pnpm build && pnpm test` passes

**Breaking changes:** None
**Effort:** 0.5-1 day

---

## Phase 2: Config Simplification (Spec 1)

**Dependencies:** Phase 0 complete, Phase 1A complete, Phase 1B decision made

### 2A: `ProjectMetadata` Types and Config Fields

**Scope:** (Spec 1 Rules 1, 2)

- Add `ProjectMetadata` interface to `src/config/project-config.ts`
- Add `RegenerationConfig` interface
- Add `tagExampleOverrides` field (typed as `Partial<Record<FormatType, { description?: string; example?: string }>>`)
- Add `project?` field to `ArchitectProjectConfig`
- Update `ArchitectProjectConfigSchema` Zod schema

**Key type safety requirement for `tagExampleOverrides`:**

```typescript
// CORRECT — FormatType constrains keys
readonly tagExampleOverrides?: Partial<Record<FormatType, { description?: string; example?: string }>>;

// WRONG — loses type safety
readonly tagExampleOverrides?: Record<string, string>;
```

### 2B: Config Resolution Enhancements

**Scope:** (Spec 1 Rules 1, 3, 4)

- Auto-read `package.json` for project metadata defaults
- Resolve `preambleFile` on `ReferenceDocConfig` to `SectionBlock[]`
- Make `behaviorCategories` and `conventionTags` optional with `.default([])`
- Make `output.directory` the universal default for all generators
- Change `libar-generic` preset default output directory to `docs-live`

**Files to modify:**

- `src/config/resolve-config.ts` — package.json auto-read, preambleFile resolution, output dir defaulting
- `src/config/presets.ts` — add `output.directory: 'docs-live'` to libar-generic preset
- `src/renderable/codecs/reference.ts` — `ReferenceDocConfig` optional fields, `preambleFile`

### 2C: MasterDataset / CodecContext Integration

**Scope:** (Spec 1 Rule 5)

**If CodecContext (1B Option A):** Add `projectMetadata` to `CodecContext`, populated in orchestrator from resolved config.

**If MasterDataset (1B Option B):** Add `projectMetadata?: ProjectMetadata` to `MasterDatasetSchema`, populated in `buildMasterDataset()`.

### 2D: Codec Consumption

**Scope:** (Spec 1 Rule 5 + Rule 2)

- IndexCodec reads project metadata for package name, purpose, license, footer
- TaxonomyCodec reads `tagExampleOverrides` for format type examples
- Both fall back to hardcoded defaults when metadata is absent

**Acceptance criteria for Phase 2:**

- [ ] Consumer configs can omit `outputDirectory` from most `generatorOverrides` entries
- [ ] Consumer configs can omit `behaviorCategories: []` and `conventionTags: []`
- [ ] Consumer configs can use `preambleFile` instead of `loadPreambleFromMarkdown()`
- [ ] IndexCodec shows project-specific name/purpose/license when configured
- [ ] TaxonomyCodec shows project-specific format examples when configured
- [ ] Default behavior (no ProjectMetadata) is identical to current behavior
- [ ] `pnpm build && pnpm test` passes

**Breaking changes:** Preset default output directory changes to `docs-live`. `behaviorCategories`/`conventionTags` become optional.
**Effort:** 3-4 days

---

## Phase 3: IndexCodec Extensibility (Spec 2)

**Dependencies:** Phase 2 complete

### 3A: IndexCodec Extension Options

**Scope:**

- Add `purposeText` option (overrides document purpose)
- Add `epilogue` option (custom SectionBlock[] footer)
- Add `packageMetadataOverrides` (override individual metadata fields)
- Implement resolution cascade: epilogue > projectMetadata.regeneration > built-in default
- **Skip `autoDiscoverDocuments`** — defer to a later phase
- **Skip `regenerationCommands` on IndexCodecOptions** — redundant with `projectMetadata.regeneration`

**Key simplification from review:** The 4-level cascade proposed in Spec 2 reduces to 2 levels:

1. `epilogue` (explicit SectionBlock[]) — if provided, replaces entire footer
2. `projectMetadata.regeneration` (structured) — if provided, generates footer from commands
3. Built-in default — hardcoded delivery-process footer

Remove the intermediate `regenerationCommands` on `IndexCodecOptions`.

**Acceptance criteria:**

- [ ] All Phase 0A regression tests still pass (default behavior unchanged)
- [ ] `purposeText` overrides the hardcoded purpose string
- [ ] `epilogue` replaces the entire footer section
- [ ] `packageMetadataOverrides` overrides individual metadata table cells
- [ ] architect-studio can generate INDEX.md without post-processing script
- [ ] `scripts/generate-docs-index.mjs` can be deleted from architect-studio

**Effort:** 2-3 days

---

## Phase 4: Self-Describing Codecs (Foundation for Consolidation)

**Dependencies:** Phase 1A complete

### 4A: `CodecMeta` Pattern

**Scope:**

- Define `CodecMeta` interface in `src/renderable/codecs/types/base.ts`
- Add `codecMeta` export to each codec file
- Create auto-registration in a new barrel file or in `generate.ts`

```typescript
export interface CodecMeta {
  readonly type: string;
  readonly outputPath: string;
  readonly description: string;
  readonly factory: (options?: unknown) => DocumentCodec;
  readonly defaultInstance: DocumentCodec;
  readonly renderer?: RenderFunction; // default: renderToMarkdown
  readonly optionsSchema?: z.ZodType;
}
```

### 4B: Auto-Registration + `CodecOptions` Derivation

**Scope:**

- Replace imperative `CodecRegistry.register()` calls (42 lines) with auto-registration from `codecMeta` exports
- Derive `CodecOptions` type from registered codecs (eliminate hand-maintained interface)
- Inline `DOCUMENT_TYPE_RENDERERS` on `codecMeta.renderer`
- `generate.ts` shrinks from ~638 lines to ~200 lines

**Acceptance criteria:**

- [ ] Adding a new codec requires only: (1) codec file with `codecMeta` export, (2) barrel import
- [ ] `CodecOptions` type is derived, not hand-maintained
- [ ] `DOCUMENT_TYPE_RENDERERS` map is removed
- [ ] `DOCUMENT_TYPES` map derives from `codecMeta` exports
- [ ] `pnpm build && pnpm test` passes
- [ ] CLI `--generators` flag accepts all existing names

**Breaking changes:** `CodecRegistry`, `DOCUMENT_TYPES`, `CodecOptions` APIs change. Internal to the generation pipeline — no consumer config changes.
**Effort:** 2-3 days

---

## Phase 5: Codec Consolidation (Spec 4)

**Dependencies:** Phase 4 complete

### 5A: Timeline Consolidation (3→1)

**Scope:**

- Unify `RoadmapCodec`, `CompletedMilestonesCodec`, `CurrentWorkCodec` into single `TimelineCodec` with `view: 'all' | 'completed' | 'active'`
- Three `codecMeta` entries map existing names to view presets
- Shared logic extracted to common functions
- View-specific logic parameterized by view value

**Files to modify:**

- `src/renderable/codecs/timeline.ts` — major refactor
- Codec barrel — update exports

### 5B: Session Consolidation (2→1)

**Scope:**

- Unify `SessionContextCodec`, `RemainingWorkCodec` into single `SessionCodec` with `view: 'context' | 'remaining'`
- Two `codecMeta` entries map existing names to view presets

**Files to modify:**

- `src/renderable/codecs/session.ts` — major refactor

### 5C: `normalizeImplPath` Cleanup (Already Done in 1D)

Verify both `patterns.ts` and `requirements.ts` import from shared utils.

**Acceptance criteria for Phase 5:**

- [ ] `timeline.ts` has one codec factory with view discriminant
- [ ] `session.ts` has one codec factory with view discriminant
- [ ] All 21 `DocumentType` names resolve correctly
- [ ] CLI `--generators roadmap,milestones,current,session,remaining` works
- [ ] Consumer configs with existing generator names continue to work
- [ ] Generated output is byte-identical for all views
- [ ] Net line reduction: ~800 lines

**Effort:** 2-3 days

---

## Phase 6: Progressive Disclosure (Spec 3)

**Dependencies:** Phase 1D complete (for `backLink()`, `includesDetail()`)

### 6A: Size Budget Types and Render Options

**Scope:**

- Define `SizeBudget` interface and `DEFAULT_SIZE_BUDGET` constant
- Define `RenderOptions` interface (NOT on `BaseCodecOptions`)
- Add `sizeBudget` and `generateBackLinks` to `RenderOptions`
- `measureDocumentSize()` in `src/renderable/render.ts`

**Key architectural decision:** Size budgets live in the render layer, not the codec layer:

```typescript
// In render.ts or a new render-options.ts
export interface RenderOptions {
  readonly sizeBudget?: SizeBudget;
  readonly generateBackLinks?: boolean;
  readonly renderer?: RenderFunction;
}
```

### 6B: Auto-Splitting Infrastructure

**Scope:**

- `splitOversizedDocument()` in new `src/renderable/split.ts`
- H2-boundary splitting algorithm
- H3-fallback for oversized single-H2 chunks
- Sub-index generation with LinkOutBlocks
- Sub-file back-links
- Kebab-cased sub-file paths

### 6C: `renderDocumentWithFiles()` Integration

**Scope:**

- Add optional `RenderOptions` parameter to `renderDocumentWithFiles()`
- Measure each additional file after rendering
- Auto-split oversized files via `splitOversizedDocument()`
- Main document (basePath) is never split
- No `RenderOptions` = no splitting (backward compatible)

### 6D: Renderer-Level `detailLevel` Enforcement (Optional Enhancement)

**Scope:**

- Add `detailLevel` to `RenderOptions`
- Renderer truncates based on level for codecs that don't implement their own logic:
  - `summary`: Headings + first table per section
  - `standard`: Everything except collapsible content
  - `detailed`: Everything
- The 3 codecs with custom `detailLevel` logic (reference, business-rules, claude-module) continue using their own branching

**Acceptance criteria for Phase 6:**

- [ ] `SizeBudget` types exist but are optional
- [ ] `renderDocumentWithFiles()` auto-splits when `sizeBudget` is configured
- [ ] Under-budget files pass through unchanged
- [ ] Main document is never split
- [ ] No `sizeBudget` = identical to current behavior
- [ ] Back-links render as `[← Back to {title}](path)`
- [ ] Sub-file paths are kebab-cased from H2 headings
- [ ] `pnpm build && pnpm test` passes

**Effort:** 3-4 days

---

## Phase 7: Cleanup (Low Priority)

These are real improvements but not blocking any spec work:

### 7A: Pipeline Efficiency

- `PipelineOptions` accepts optional pre-loaded `TagRegistry` (eliminates double config load)
- Make `GeneratorContext.masterDataset` required (eliminate unnecessary optionality)

### 7B: Layer Boundary Fixes

- Move `renderShapesAsMarkdown()` from extractor to renderable layer
- Move `extractPatternTags` from scanner to shared utility (fixes scanner→extractor boundary violation)

### 7C: Data Model Cleanup

- Rename `bySource` to `bySourceType` (remove `roadmap`/`prd` misclassification)
- Remove vestigial grouping functions from `utils.ts` (`groupByCategory`, `groupByPhase`, `groupByQuarter`)
- Add missing pre-computed views if needed: `byTeam`, `byRelease`

### 7D: Shallow Merge Fix

- Deep-merge for `codecOptions` in orchestrator (currently shallow spread clobbers nested options)

---

## Dependency Graph

```
Phase 0A (IndexCodec tests) ──────────────────────────┐
Phase 0B (@architect-core cleanup) ────────────────────┤
Phase 0C (archRole/archLayer constants) ───────────────┤
                                                       │
Phase 1A (createDecodeOnlyCodec) ──────────────────────┤
Phase 1B (CodecContext — DECISION POINT) ──────────────┤
Phase 1C (reference.ts decomposition) ─────────────────┤
Phase 1D (utility deduplication) ──────────────────────┤
                                                       │
                                                       v
                                           Phase 2 (Config Simplification)
                                                       │
                                                       v
                                           Phase 3 (IndexCodec Extension)
                                                       │
Phase 4 (Self-Describing Codecs) ──────────────────────┤
                                                       │
                                                       v
                                           Phase 5 (Codec Consolidation)

Phase 1D ──────────────────────────────────────────────┐
                                                       v
                                           Phase 6 (Progressive Disclosure)

                                           Phase 7 (Cleanup — independent)
```

**Key insight:** Phases 0, 1, and 4 are all **independent of each other** and can be parallelized across sessions. Phase 2 depends on 0+1A. Phase 3 depends on 2. Phase 5 depends on 4. Phase 6 depends on 1D only.

---

## Total Effort Estimate

| Phase     | Scope                           | Days           |
| --------- | ------------------------------- | -------------- |
| 0         | Safety net                      | 2              |
| 1         | Structural foundations          | 3-5            |
| 2         | Config simplification (Spec 1)  | 3-4            |
| 3         | IndexCodec extension (Spec 2)   | 2-3            |
| 4         | Self-describing codecs          | 2-3            |
| 5         | Codec consolidation (Spec 4)    | 2-3            |
| 6         | Progressive disclosure (Spec 3) | 3-4            |
| 7         | Cleanup                         | 2-3            |
| **Total** |                                 | **19-27 days** |

With parallelization (Phases 0+1+4 concurrent): **critical path is ~14-18 days**.
