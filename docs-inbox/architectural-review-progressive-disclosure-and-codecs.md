# Architectural Review: Progressive Disclosure, Codec Pipeline & Structural Foundations

> **Date:** 2026-03-31
> **Status:** Review complete — findings ready for design session intake
> **Scope:** `@libar-dev/architect` full pipeline architecture
> **Method:** Two-session deep-dive with parallel code exploration (~33,800 lines)
> **Inputs:** Draft specs (spec-01 through spec-04), architectural design synthesis doc, codebase exploration
> **Relation to:** `architect-studio/_working-docs/04-progressive-disclosure-and-indexes/`

---

## Session Context

### Intent

A holistic architectural review of the `@libar-dev/architect` package, focused on finding deep foundational refactoring opportunities ahead of four planned specs:

1. **spec-01:** ProjectMetadata & Config Simplification
2. **spec-02:** IndexCodec Extensibility
3. **spec-03:** Progressive Disclosure Enforcement
4. **spec-04:** Codec Consolidation & Boilerplate Reduction

The review was conducted with complete freedom to propose breaking changes, large-scope refactoring, and structural interventions that the specs themselves don't envision. The guiding principles were:

- Prefer clean solutions over backward compatibility
- Breaking changes are fine and preferable if the resulting code is cleaner
- Taxonomy/tag registry interventions must retain full type safety (no unsafe customizations, no JSON sources)
- Never settle for minimal fixes when code quality can be improved

### What Was Explored

Four parallel deep-dives covered the entire pipeline:

| Exploration                | Files Read | Lines Analyzed | Key Modules                                                           |
| -------------------------- | ---------- | -------------- | --------------------------------------------------------------------- |
| Codec pipeline             | 28 files   | ~16,900        | `src/renderable/` (codecs, render, schema, generate)                  |
| Taxonomy & tag registry    | 13+ files  | ~4,000         | `src/taxonomy/`, scanner parsers, validation schemas                  |
| PatternGraph & config      | 12 files   | ~3,500         | `src/validation-schemas/`, `src/config/`, `src/generators/pipeline/`  |
| Scanner/extractor/API/lint | 52 files   | ~16,900        | `src/scanner/`, `src/extractor/`, `src/api/`, `src/mcp/`, `src/lint/` |

---

## Part 1: Spec Direction Assessment

**The direction is sound.** The four specs address real problems with well-reasoned solutions. The three-layer progressive disclosure model, ProjectMetadata flow through PatternGraph, codec consolidation via view discriminants, and config simplification are all architecturally correct choices.

However, the specs optimize locally in several places where a structural intervention would yield more. The window for breaking changes is closing — this review focuses on what to break _now_ for compounding returns.

---

## Part 2: Critical Architectural Insights

### CI-1: The Pipeline Has a Split-Brain Problem

The most significant architectural issue is not in the codec layer (where the specs focus) but in the **pipeline data flow**. There are two parallel type systems that don't unify.

#### RuntimePatternGraph vs PatternGraph

`src/generators/pipeline/transform-types.ts:88` defines:

```typescript
export interface RuntimePatternGraph extends PatternGraph {
  readonly workflow?: LoadedWorkflow;
}
```

This creates a type split that propagates everywhere:

| Consumer                        | Receives                    | Can Access Workflow? |
| ------------------------------- | --------------------------- | -------------------- |
| `GeneratorContext.patternGraph` | `RuntimePatternGraph`       | Yes                  |
| `z.codec.decode(dataset)`       | `PatternGraph` (Zod schema) | **No**               |
| `PatternGraphAPI`               | `RuntimePatternGraph`       | Yes (via factory)    |
| `PipelineResult.dataset`        | `RuntimePatternGraph`       | Yes                  |

**Codecs — the primary consumers of PatternGraph — cannot access workflow data.** The Zod codec type signature enforces `PatternGraph` (the serializable subset), but `LoadedWorkflow` contains `Map` instances that can't be represented in Zod.

**Why this matters for the specs:** The proposed `ProjectMetadata` flows through `PatternGraph` (Spec 1 Rule 5). This is correct. But it means `PatternGraph` is accumulating fields that are really "runtime context for codecs" — not data extracted from source files. `ProjectMetadata`, `tagExampleOverrides`, and `workflow` are all config/runtime context, not extraction products.

**Structural intervention — `CodecContext`:**

```typescript
interface CodecContext {
  readonly dataset: PatternGraph; // extraction products only
  readonly projectMetadata?: ProjectMetadata; // config identity
  readonly workflow?: LoadedWorkflow; // FSM definitions
  readonly tagExampleOverrides?: Partial<Record<FormatType, { example: string }>>;
}
```

This separates concerns cleanly: `PatternGraph` stays as a pure extraction read model (ADR-006), while `CodecContext` carries everything a codec needs. The `DocumentCodec` type would become `z.ZodCodec<CodecContextSchema, RenderableDocumentOutputSchema>`.

**Breaking change:** Yes — every codec's `decode` signature changes. But since `createDecodeOnlyCodec()` is planned anyway (Spec 4 Rule 3), this is the right time. The helper absorbs the change:

```typescript
export function createDecodeOnlyCodec(
  decode: (context: CodecContext) => RenderableDocument
): DocumentCodec;
```

### CI-2: The 7-Point Codec Registration Is the Root Bottleneck

The specs focus on reducing 25 → 21 codecs. But the real scaling problem is the **registration ceremony**. To add a single new codec, you must touch:

1. **Codec file** (e.g., `codecs/new-codec.ts`): Define options interface, default options, factory function, default instance
2. **`codecs/index.ts`** barrel: Add 4 exports (codec, factory, options type, defaults)
3. **`generate.ts` imports**: Add 3 imports (codec, factory, options type) — lines 29-102 are 77 lines of imports alone
4. **`DOCUMENT_TYPES`**: Add `{ outputPath, description }` entry
5. **`CodecOptions` interface**: Add optional property (lines 233-255, manually maintained union)
6. **`CodecRegistry.register()`**: Add default instance (lines 374-394)
7. **`CodecRegistry.registerFactory()`**: Add factory (lines 397-417)

That is **7 locations across 3 files**. Every new codec is a 7-file-location change. Every codec consolidation is also a 7-location change (just with removals).

**Structural intervention — Self-describing codecs:**

```typescript
// In each codec file:
export const codecMeta = {
  type: 'patterns' as const,
  outputPath: 'PATTERNS.md',
  description: 'Category-grouped pattern reference',
  factory: createPatternsCodec,
  defaultInstance: PatternsDocumentCodec,
  renderer: renderToMarkdown,
} satisfies CodecMeta;
```

Then `generate.ts` imports from a barrel file and builds the registry automatically. This reduces coordination from 7 points to 2 (codec file + barrel export).

**Additionally:** `CodecOptions` should be **derived** from `codecMeta` registrations, not hand-maintained:

```typescript
type CodecOptions = {
  [K in keyof typeof CODEC_REGISTRY]: (typeof CODEC_REGISTRY)[K]['optionsType'] extends z.ZodType
    ? z.infer<(typeof CODEC_REGISTRY)[K]['optionsType']>
    : never;
};
```

This eliminates the third import group entirely and makes `CodecOptions` always in sync with registered codecs.

**Impact on specs:** This should be foundation work before codec consolidation. It makes Timeline 3→1 trivial — editing one codec file and one barrel export, no generate.ts changes.

### CI-3: Progressive Disclosure Should Be a Pure Renderer Concern

Spec 3 proposes `sizeBudget` on `BaseCodecOptions`. This creates coupling: codecs gain awareness of a concern (file size) that belongs to the rendering/output layer.

**Cleaner architecture:**

- Codecs produce `RenderableDocument` with `additionalFiles` — no size awareness
- The generator/orchestrator layer configures size budgets per document type
- `renderDocumentWithFiles()` applies splitting — transparent to codecs

The spec already implements splitting in `renderDocumentWithFiles()` (correct). But the configuration path should go through the generator, not the codec options:

```typescript
// In generate.ts or orchestrator — not in codec options
const renderOptions: RenderOptions = {
  sizeBudget: { detailFile: 250 },
  generateBackLinks: true,
};
```

This means `BaseCodecOptions` stays focused on content decisions (`detailLevel`, `generateDetailFiles`, `limits`), and `RenderOptions` handles output decisions (`sizeBudget`, `generateBackLinks`, renderer choice).

### CI-4: `detailLevel` Has a Deeper Problem Than the Specs Acknowledge

Only **3 of 21 codecs** actually implement `detailLevel` branching:

| Codec             | Implements detailLevel? | How                                      |
| ----------------- | ----------------------- | ---------------------------------------- |
| reference         | Yes                     | Full 3-level support                     |
| business-rules    | Yes                     | Summary omits inline content             |
| claude-module     | Yes                     | Controls section depth                   |
| _18 other codecs_ | **No**                  | `detailLevel` passes through as metadata |

The `includesDetail()` helper from Spec 3 only matters for the 3 codecs that branch on it.

**Structural intervention — Renderer-level enforcement:**

Rather than adding `includesDetail()` and hoping codecs adopt it, make `detailLevel` enforcement part of the **render layer** as a default:

- `summary`: Render only headings and the first table per section
- `standard`: Render everything except collapsible blocks' content
- `detailed`: Render everything

This gives ALL 21 codecs progressive disclosure without any codec-level changes. The 3 codecs with custom logic keep it (their logic is more nuanced), but the other 18 get a reasonable default for free.

### CI-5: The `output.directory` Default Should Be a Preset Concern

Spec 1 Rule 4 proposes that `output.directory` becomes the universal default for all generators. This is correct. But go further: **make `docs-live` the default in the `libar-generic` preset itself:**

```typescript
// In presets.ts
export const LIBAR_GENERIC_PRESET = {
  // ...existing...
  output: {
    directory: 'docs-live',
    overwrite: true,
  },
} as const satisfies ArchitectConfig;
```

Current default is `docs/architecture` (from `resolve-config.ts:113`). No consumer uses it — every consumer overrides to `docs-live`. The breaking change has zero practical impact.

### CI-6: `reference.ts` Should Be 5 Files, Not 3

The specs and synthesis doc propose splitting `reference.ts` (2,019 lines) into 3 files. After reading the full file, there are 5 clear domain boundaries:

| Module                  | Lines | Content                                                             |
| ----------------------- | ----- | ------------------------------------------------------------------- |
| `reference-types.ts`    | ~150  | `ReferenceDocConfig`, `DiagramScope`, `ProductAreaMeta` interfaces  |
| `reference-meta.ts`     | ~340  | `PRODUCT_AREA_META`, `PRODUCT_AREA_ARCH_CONTEXT_MAP` (static data)  |
| `reference-builders.ts` | ~310  | Convention, behavior, shape, TOC section builders                   |
| `reference-diagrams.ts` | ~690  | 5 Mermaid diagram type builders + 3 hardcoded domain diagrams       |
| `reference.ts`          | ~530  | Factory (`createReferenceCodec()`), decode logic, product-area path |

The spec's 3-file proposal (~800, ~400, ~350) still leaves an 800-line file mixing factory logic with content builders and an enormous diagram infrastructure section.

The diagram infrastructure alone (690 lines, 5 generic diagram builders + 3 domain-specific diagrams) is a strong extraction candidate. It has clear inputs (shape data, pattern relationships) and clear outputs (Mermaid code blocks).

### CI-7: IndexCodec Needs Regression Tests BEFORE Any Changes

IndexCodec has **zero test coverage** and is the entry point for the entire documentation set. Any of the proposed changes (ProjectMetadata, epilogue, auto-discovery) risk breaking the current output in subtle ways.

**Phase 0 (before any spec work):** Write a regression test suite that captures current IndexCodec behavior as a golden fixture. This is not TDD for new features — it's a safety net for refactoring.

Spec 2 includes regression scenarios (Rule 1), but they're mixed with new-feature scenarios. Separate them: ship regression tests as an independent, pre-requisite PR.

### CI-8: `createDecodeOnlyCodec()` Is Correct but Should Be the Migration Path

Every codec repeats the identical ceremony:

```typescript
return z.codec(PatternGraphSchema, RenderableDocumentOutputSchema, {
  decode: (dataset) => buildDocument(dataset, opts),
  encode: () => {
    throw new Error('Codec is decode-only. See zod-codecs.md');
  },
});
```

This appears ~21 times. `createDecodeOnlyCodec()` eliminates it. But the helper should be designed so that future migration to `CodecContext` (CI-1) is the ONLY interface codec authors use:

```typescript
// The helper should accept JUST a decode function — nothing else
export function createDecodeOnlyCodec(
  decode: (context: CodecContext) => RenderableDocument
): DocumentCodec;
```

Don't add parameters for codec names, descriptions, or error messages. Keep the interface as narrow as possible. The internal `z.codec()` wrapper is an implementation detail that codec authors never see.

---

## Part 3: The Type Safety Narrative

The codebase has invested heavily in type safety — `as const` arrays, Zod schemas, branded types. Three systematic gaps remain:

### TS-1: The `extractMetadataTag()` Type Erasure (25 `as` Casts)

`src/scanner/ast-parser.ts` ~line 329: `extractMetadataTag()` returns `unknown`. The 6 format-specific extraction functions each return different types (`string`, `string[]`, `number`, `boolean`, `undefined`), but the wrapping function erases this to `unknown`.

This forces 25 explicit `as` casts at lines ~591-623:

```typescript
const patternName = metadataResults.get('pattern') as string | undefined;
const status = metadataResults.get('status') as ProcessStatusValue | undefined;
// ... 23 more
```

The `Map<string, unknown>` intermediate container destroys all type information. Each cast is technically safe (the format dispatch guarantees the type), but the compiler can't verify it.

**Clean fix (breaking):** Replace the `Map<string, unknown>` with a typed builder object:

```typescript
interface ExtractedMetadata {
  readonly pattern?: string;
  readonly status?: ProcessStatusValue;
  readonly phase?: number;
  // ... typed field per metadata tag
}
```

Then `extractMetadataTag` returns `void` and populates a pre-typed builder object instead of inserting into an untyped map. No casting needed.

**Assessment:** This is a real gap but well-mitigated by Zod schema validation downstream. Fix when touching the parser, don't prioritize independently.

### TS-2: The Gherkin Parser's Index Signature Escape Hatch

`gherkin-ast-parser.ts` ~line 579: The return type of `extractPatternTags()` has 40+ explicit fields **plus** `readonly [key: string]: unknown`. The index signature exists for extensibility (new tags work without updating the type), but it undermines the explicit fields — any typo in a property access compiles successfully.

**Assessment:** Design trade-off, not a bug. Mitigated by `ExtractedPatternSchema.safeParse()` downstream.

### TS-3: Duplicated Enum Values

`archRole` values appear in both:

- `registry-builder.ts` lines ~505-516 (tag definitions with `values` array)
- `extracted-pattern.ts` lines ~464-476 (Zod schema with `z.enum([...])`)

Same for `archLayer`. These are **separate copies** with no shared constant. A typo in one wouldn't be caught by the other.

**Fix:** Extract to shared constants in the taxonomy layer. Same pattern already used for `PROCESS_STATUS_VALUES`, `FORMAT_TYPES`, etc. Straightforward.

### TS-4: `shared-schema.ts` Uses `z.any()` — Codec Output Is Not Schema-Validated

`shared-schema.ts:38-44`:

```typescript
export const RenderableDocumentOutputSchema = z.object({
  title: z.string(),
  sections: z.array(z.any()), // not validated
  additionalFiles: z.record(z.string(), z.any()).optional(), // not validated
});
```

The `z.any()` on `sections` means **codec output is never schema-validated at runtime**. The full `RenderableDocumentSchema` exists but causes Zod recursive type inference issues with `z.codec()`.

**Assessment:** Acceptable — builder functions (`heading()`, `paragraph()`, `table()`, etc.) enforce correct construction at compile time. But it means `z.codec()` provides zero runtime safety beyond what TypeScript already provides statically. This weakens the case for `z.codec()` as the codec pattern.

---

## Part 4: Structural Issues the Specs Don't Cover

### SI-1: The Double Config Load

When `generateFromConfig()` is used (the high-level orchestrator path), config is loaded twice:

1. **Externally** by `loadProjectConfig()` → `ResolvedConfig`
2. **Inside** `buildPatternGraph()` at `build-pipeline.ts:172` which calls `loadConfig(baseDir)` again

The second load exists because `buildPatternGraph()` is designed as a standalone entry point (used by 5 consumers: orchestrator, process-api CLI, validate-patterns CLI, REPL, MCP server).

**Fix:** `PipelineOptions` should accept an optional pre-loaded `TagRegistry`. When provided, skip the internal `loadConfig()`. The 4 non-orchestrator consumers continue to omit it. The orchestrator passes its already-loaded config. Zero behavioral change, one fewer disk read + config resolution.

### SI-2: `bySource` Naming Mismatch

`PatternGraph.bySource` contains four arrays:

| Key          | What it actually is                  | Problem                                      |
| ------------ | ------------------------------------ | -------------------------------------------- |
| `typescript` | Files with `.ts` extension           | Source type                                  |
| `gherkin`    | Files with `.feature` extension      | Source type                                  |
| `roadmap`    | Patterns with `status === 'roadmap'` | **Metadata classification**, not source type |
| `prd`        | Patterns from `sources.prd` config   | **Config classification**, not source type   |

`roadmap` and `prd` are not source types. `bySource.roadmap` overlaps with `byStatus.planned`.

**Fix:** Rename to `bySourceType` (just `typescript` + `gherkin`). Move `roadmap` to `byStatus`. For `prd`, promote to its own top-level view or include in `bySourceType` with a `'prd'` key.

### SI-3: Vestigial Grouping Functions in `utils.ts`

`src/renderable/utils.ts` ~lines 326-354 define `groupByCategory()`, `groupByPhase()`, `groupByQuarter()`. These duplicate the pre-computed views already in `PatternGraph.byCategory`, `byPhase`, `byQuarter`.

Post-ADR-006, all consumers should have a `PatternGraph`. These functions exist for a pre-ADR-006 world.

**Fix:** Remove and update callers to use PatternGraph views directly.

### SI-4: `completionPercentage()` Duplication

Two identical implementations:

- `src/renderable/utils.ts` ~lines 289-299
- `src/generators/pipeline/transform-dataset.ts` ~lines 410-419

**Fix:** Single definition in `utils.ts`, imported by the transformer.

### SI-5: Shape Rendering Logic in Wrong Layer

`renderShapesAsMarkdown()` is defined in `src/extractor/shape-extractor.ts` (extraction layer) but consumed by `src/renderable/codecs/helpers.ts` (codec layer). This is a layer violation — rendering belongs in the renderable layer.

The shape extractor also does **double file reads**: the scanner reads file content, doesn't pass it to the extractor. The shape extractor reads again synchronously (`fs.readFileSync`).

### SI-6: `extractPatternTags` Scanner-Extractor Boundary Violation

`gherkin-extractor.ts` imports `extractPatternTags` from `scanner/gherkin-ast-parser.ts`. This is a scanner function consumed by the extractor. The function is purely transformational and belongs in a shared utility or in the extractor itself.

### SI-7: `GeneratorContext.patternGraph` Is Optional When Always Populated

`src/generators/types.ts:77` types `patternGraph` as `RuntimePatternGraph | undefined`, but every real invocation populates it. Generators must defensively null-check for a condition that can't happen.

**Fix:** Make it required.

### SI-8: Shallow Merge for Codec Options in Orchestrator

The orchestrator merges codec options with simple spread: `{ ...config.project.codecOptions, ...options?.codecOptions }`. This is **shallow merge** — nested options within a single codec key would be clobbered, not deep-merged.

### SI-9: The `@architect-core` Ghost Tag

`@architect-core` appears in `base.ts:3`, `shared-schema.ts:3`, and reportedly ~125 files. It was removed from the tag registry but annotations persist.

**In TypeScript files:** `@architect-core` becomes a raw directive tag with no semantic meaning.
**In Gherkin files:** It gets normalized to `core`, which IS a valid category (defined in `categories.ts`). So it silently functions as a category tag.

**This dual behavior is a bug.** The same annotation means different things depending on source type. Clean up all instances.

### SI-10: Stale TaxonomyCodec Examples

`taxonomy.ts` lines ~424-437 and ~662-707 hardcode format type examples. The `flag` format shows `@architect-core` — which is not in the registry. Must be updated to `@architect-sequence-error`.

---

## Part 5: Spec-Specific Feedback

### Spec 1: Config Simplification — Ship First, Highest Value

**Verdict:** This is the highest-value spec and should ship first (after IndexCodec regression tests).

**Adjustments:**

1. **Rule 2 (`tagExampleOverrides`):** Use `Partial<Record<FormatType, { description?: string; example?: string }>>` — the `FormatType` key constraint preserves full type safety. Do NOT accept `Record<string, string>` as proposed — that loses type safety on format type keys.

2. **Rule 4 (output directory):** Also change the preset default to `docs-live` (CI-5). Eliminates the need for most consumers to set `output.directory` at all.

3. **Rule 5 (`PatternGraph.projectMetadata`):** Consider using `CodecContext` (CI-1) instead of adding `projectMetadata` directly to `PatternGraph`. This keeps PatternGraph as a pure extraction read model.

4. **`tagExampleOverrides` validation scenario (line 259-266):** Ensure the Zod schema uses `z.enum(FORMAT_TYPES)` for keys, not a generic `z.record(z.string(), ...)`.

### Spec 2: IndexCodec Extensibility — Split Regression/Extension

**Verdict:** Well-specified (16 rules, 51 scenarios). Split into two PRs.

**Adjustments:**

1. **Regression tests first** (Rule 1 scenarios): Ship as an independent PR before any extension work.

2. **Simplify the footer cascade** from 4 levels to 2: `epilogue` (SectionBlock[]) > `projectMetadata.regeneration` (structured) > built-in default. Remove `regenerationCommands` from `IndexCodecOptions` — it's redundant with `projectMetadata.regeneration`.

3. **Skip `autoDiscoverDocuments`** in v1. Static `documentEntries` works fine. Auto-discovery adds runtime coupling for unclear benefit.

### Spec 3: Progressive Disclosure — Restructure Ownership

**Verdict:** The capability design is solid. The auto-splitting algorithm (H2 → H3 fallback) is well thought out. But the configuration path needs restructuring.

**Adjustments:**

1. **Move `sizeBudget` from `BaseCodecOptions` to `RenderOptions`** used by the generator/orchestrator layer. Codecs should not know about file size constraints.

2. **`detailLevel` enforcement in the renderer** as default mechanism, with codec-level overrides for the 3 codecs that need custom behavior.

3. **`measureDocumentSize()` in `src/renderable/render.ts`**, not `utils.ts`. It depends on `renderToMarkdown()` — co-locating avoids circular dependency.

4. **`includesDetail()` helper and `backLink()` builder are clean, ship as-is.**

### Spec 4: Codec Consolidation — Good, Depends on Foundation

**Verdict:** Timeline 3→1 and Session 2→1 are well-designed. The `view` discriminant is the right pattern.

**Adjustments:**

1. **Self-describing codecs (CI-2) should ship first.** This makes the "backward compatibility" rule (Rule 6) trivial — the barrel file just maps names to views.

2. **`reference.ts` decomposition should be 5 files, not 3** (CI-6). Independent PR, not coupled with the consolidation.

3. **`createDecodeOnlyCodec()` should accept `CodecContext`** (CI-1), not raw `PatternGraph`.

---

## Part 6: Breaking Changes to Make Now

### BC-1: Introduce `CodecContext` Wrapper (CI-1)

Replace `PatternGraph` as the codec input with `CodecContext` that separates extraction products from runtime context. All codecs change signature via `createDecodeOnlyCodec()`.

### BC-2: Make `docs-live` the Preset Default (CI-5)

Every consumer overrides the current default (`docs/architecture`). Change it at the preset level. Zero practical impact.

### BC-3: Make `behaviorCategories`/`conventionTags` Optional (Spec 1 Rule 3)

Schema-level change with `.default([])`, not a runtime fallback.

### BC-4: Remove `@architect-core` Ghost Tags

Clean up all instances. In Gherkin files where category intent is real, replace with `@architect-category:core`.

### BC-5: Fix Stale `@architect-core` Example in TaxonomyCodec

Update to `@architect-sequence-error`.

### BC-6: Make `GeneratorContext.patternGraph` Required

Remove the `undefined` from the type. Eliminate ~21 unnecessary null checks.

### BC-7: Extract `archRole`/`archLayer` Values to Shared Constants

Eliminate silent enum divergence between `registry-builder.ts` and `extracted-pattern.ts`.

---

## Part 7: Previous Review's Findings — Disposition

The initial review session produced findings CI-1 through CI-6 and BC-1 through BC-6. Here's how they held up against deep code analysis:

| Previous Finding                                     | Disposition                                                                | Notes |
| ---------------------------------------------------- | -------------------------------------------------------------------------- | ----- |
| CI-1: Self-describing codecs                         | **Validated and extended** — also derive `CodecOptions` type automatically |
| CI-2: `createDecodeOnlyCodec()` design               | **Validated** — should accept `CodecContext`, not `PatternGraph`           |
| CI-3: Progressive disclosure as renderer concern     | **Validated** — `detailLevel` enforcement also belongs in renderer         |
| CI-4: `output.directory` preset default              | **Validated** — change at preset level for `docs-live`                     |
| CI-5: `reference.ts` decomposition timing            | **Extended** — 5 files, not 3; diagrams alone are 690 lines                |
| CI-6: IndexCodec regression tests first              | **Validated** — Phase 0 safety net                                         |
| BC-1: Remove `DOCUMENT_TYPE_RENDERERS`               | **Validated** — inline on `codecMeta`                                      |
| BC-2: `docs-live` preset default                     | **Validated**                                                              |
| BC-3: Optional `behaviorCategories`/`conventionTags` | **Validated** — schema-level `.default([])`                                |
| BC-4: Remove `isCore` from PatternGraph views        | **Superseded** — the `@architect-core` ghost tag is the real issue         |
| BC-5: Fix flag example in TaxonomyCodec              | **Validated** — `@architect-core` → `@architect-sequence-error`            |
| BC-6: Remove flag format entirely                    | **Overturned** — flag format costs nearly nothing, semantic value is real  |

### Why BC-6 (Remove Flag Format) Was Overturned

The previous review suggested removing the `flag` format type since only `sequence-error` uses it. After deep analysis of the actual code:

**The flag format costs nearly nothing:**

- TS parser: `checkFlagPresent()` — 6 lines
- Gherkin parser: 4-line `if` block
- TaxonomyCodec: one entry in two description maps
- `buildValueTakingTagsPattern()`: one filter exclusion

**Removing it would be semantically wrong:** `sequence-error` is a boolean presence ("this scenario IS an error path"), not a role value. Making it `@architect-sequence-role:error` would be inconsistent with the existing `sequence-orchestrator`, `sequence-step`, `sequence-module` tags which are value-format tags for different concepts.

**Recommendation: Keep the flag format.** Fix the stale example, don't remove the format type.

---

## Part 8: Risk Assessment

| Risk                                              | Likelihood | Impact | Mitigation                                                                |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| IndexCodec regression without tests               | High       | High   | Ship regression tests as Phase 0                                          |
| `CodecContext` migration touches all 21 codecs    | Certain    | Medium | `createDecodeOnlyCodec()` absorbs the change                              |
| Self-describing codecs change `generate.ts` API   | Certain    | Low    | Internal API, no consumer impact                                          |
| `reference.ts` 5-way split introduces import bugs | Low        | Low    | Mechanical, verify with `pnpm build && pnpm test`                         |
| `detailLevel` renderer enforcement changes output | Medium     | Medium | Only affects codecs that DON'T implement it (no change for the 3 that do) |

---

## Part 9: One-Line Verdicts

| Area                                                           | Verdict                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Overall spec direction                                         | **Sound** — addresses real problems, minor structural adjustments needed |
| Pipeline split-brain (`RuntimePatternGraph` vs `PatternGraph`) | **Address now** — introduce `CodecContext`                               |
| Type safety gaps (25 `as` casts, index signatures)             | **Acceptable as-is** — Zod validation downstream catches errors          |
| `@architect-core` ghost tag                                    | **Clean up immediately** — dual behavior in TS vs Gherkin is a live bug  |
| Flag format removal                                            | **Don't remove** — architectural cost is trivial, semantic value is real |
| Self-describing codecs                                         | **Missing from specs, needed before consolidation**                      |
| `reference.ts` decomposition                                   | **5 files, not 3** — diagrams alone are 690 lines                        |
| Progressive disclosure ownership                               | **Render layer** — not codec options                                     |
| `detailLevel` enforcement                                      | **Renderer default + codec override** — covers all 21 codecs, not just 3 |
| `bySource` naming                                              | **Rename to `bySourceType`** — `roadmap`/`prd` are not source types      |
| Double config load                                             | **Fix via optional `TagRegistry` on `PipelineOptions`**                  |
| `autoDiscoverDocuments`                                        | **Defer** — adds coupling for unclear benefit                            |
