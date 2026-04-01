# Codebase Exploration Findings: Per-Subsystem Analysis

> **Date:** 2026-03-31
> **Purpose:** Detailed raw findings from parallel deep-dive explorations
> **Companion docs:** `architectural-review-progressive-disclosure-and-codecs.md`, `refactoring-execution-guide.md`
> **Method:** Four parallel exploration agents, each reading actual source code with line numbers

---

## 1. Codec Pipeline Architecture (~16,900 lines)

### 1.1 File Inventory

| File                                            | Lines | Role                                              |
| ----------------------------------------------- | ----- | ------------------------------------------------- |
| `src/renderable/codecs/reference.ts`            | 2,019 | 4-layer composition factory (largest codec)       |
| `src/renderable/codecs/timeline.ts`             | 1,329 | 3 codecs: Roadmap, Milestones, CurrentWork        |
| `src/renderable/codecs/helpers.ts`              | 1,244 | Shared rendering helpers                          |
| `src/renderable/codecs/session.ts`              | 1,224 | 2 codecs: SessionContext, RemainingWork           |
| `src/renderable/codecs/business-rules.ts`       | 935   | Business rules codec                              |
| `src/renderable/codecs/adr.ts`                  | 790   | Architecture Decision Records codec               |
| `src/renderable/codecs/validation-rules.ts`     | 744   | Validation rules reference codec                  |
| `src/renderable/codecs/taxonomy.ts`             | 736   | Tag taxonomy codec                                |
| `src/renderable/codecs/design-review.ts`        | 688   | Design review codec                               |
| `src/renderable/codecs/planning.ts`             | 683   | 3 codecs: Checklist, Plan, Findings               |
| `src/renderable/codecs/architecture.ts`         | 675   | Architecture diagrams codec                       |
| `src/renderable/codecs/decision-doc.ts`         | 650   | Decision document parsing helpers                 |
| `src/renderable/codecs/requirements.ts`         | 623   | Requirements codec                                |
| `src/renderable/codecs/patterns.ts`             | 613   | Patterns registry codec                           |
| `src/renderable/codecs/pr-changes.ts`           | 599   | PR-scoped changes codec                           |
| `src/renderable/codecs/reporting.ts`            | 551   | 3 codecs: Changelog, Traceability, Overview       |
| `src/renderable/codecs/convention-extractor.ts` | 450   | Convention extraction from decision records       |
| `src/renderable/codecs/index-codec.ts`          | 361   | Navigation index codec                            |
| `src/renderable/codecs/claude-module.ts`        | 308   | Claude context module codec                       |
| `src/renderable/codecs/index.ts`                | 245   | Barrel export                                     |
| `src/renderable/codecs/composite.ts`            | 191   | Multi-codec composition                           |
| `src/renderable/codecs/shape-matcher.ts`        | 136   | Shape selector matching                           |
| `src/renderable/codecs/diagram-utils.ts`        | 83    | Mermaid diagram utilities                         |
| `src/renderable/codecs/shared-schema.ts`        | 46    | Simplified output schema (uses z.any())           |
| `src/renderable/codecs/types/base.ts`           | 130   | Base types, DocumentCodec, DetailLevel            |
| `src/renderable/codecs/types/index.ts`          | 4     | Barrel re-export                                  |
| `src/renderable/generate.ts`                    | 638   | Registration, CodecRegistry, generation functions |
| `src/renderable/render.ts`                      | 437   | Universal renderers (Markdown, ClaudeMdModule)    |
| `src/renderable/schema.ts`                      | 288   | Block vocabulary (9 types), builder functions     |

### 1.2 Base Types (`types/base.ts` — 130 lines)

**Key types:**

- `DetailLevel` (line 30): `'summary' | 'standard' | 'detailed'`
- `NormalizedStatusFilter` (line 38): alias for `NormalizedStatus` from taxonomy
- `CodecLimits` (lines 43-50): `recentItems`, `maxDetailFiles`, `collapseThreshold`
- `BaseCodecOptions` (lines 55-64): `generateDetailFiles`, `detailLevel`, `limits`
- `DocumentCodec` (lines 127-130): `z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema>`

**Key functions:**

- `mergeOptions<T>()` (lines 95-111): shallow merge with deep `limits` merge
- Note: the `as Required<T>` cast at line 110 is necessary due to spread erasing the `Required` constraint

**Key constant:**

- `DEFAULT_BASE_OPTIONS` (line 82): `{ generateDetailFiles: true, detailLevel: 'standard', limits: DEFAULT_LIMITS }`

**Observation:** `DocumentCodec` is a Zod 4 codec type. All codecs are decode-only — `encode()` always throws. The naming "codec" (bidirectional) is a Zod API artifact, not a design choice.

### 1.3 Block Vocabulary (`schema.ts` — 288 lines)

**9 block types** (discriminated union on `type` field):

| Block         | Lines   | Purpose                                          |
| ------------- | ------- | ------------------------------------------------ |
| `heading`     | 37-41   | H1-H6 headers                                    |
| `paragraph`   | 44-47   | Plain text                                       |
| `separator`   | 50-52   | Horizontal rule                                  |
| `table`       | 55-60   | Columns + rows + optional alignment              |
| `list`        | 72-77   | Ordered/unordered, nested, with checkboxes       |
| `code`        | 80-84   | Fenced code with language                        |
| `mermaid`     | 87-90   | Diagram blocks                                   |
| `collapsible` | 93-97   | `<details>/<summary>` for progressive disclosure |
| `link-out`    | 100-104 | External file references                         |

**`RenderableDocument`** (lines 199-205):

```typescript
{ title, purpose?, detailLevel?, sections: SectionBlock[], additionalFiles?: Record<string, RenderableDocument> }
```

**Builder functions** (lines 212-288): Factory functions `heading()`, `paragraph()`, `table()`, etc. These are the primary API codecs use to construct documents.

**Known issue:** `CollapsibleBlock` has two type definitions — a Zod-inferred one and a manual interface (lines 177-181) — to work around Zod recursive type inference. The `SectionBlockSchema` uses a cast (lines 125-131).

### 1.4 Universal Renderer (`render.ts` — 437 lines)

**Two renderers, one pattern:**

- `renderToMarkdown()` (line 64): Full markdown with H1 title, frontmatter, all block types
- `renderToClaudeMdModule()` (line 158): H3-rooted (offset +2), omits mermaid/link-out, flattens collapsibles

Both are dumb printers — pattern-match on `block.type`, emit strings. No domain knowledge.

**`renderDocumentWithFiles()`** (lines 413-437): Multi-file output. Takes `RenderableDocument`, renders main doc, iterates `additionalFiles`, returns `OutputFile[]`. Accepts optional renderer function (defaults to `renderToMarkdown`).

**Well-designed:** Exhaustive switch with `never` type guard, proper HTML entity escaping, table column-width alignment.

### 1.5 Registration Layer (`generate.ts` — 638 lines)

**Import structure (lines 29-105):** Three import blocks totaling 77 lines:

1. Default codec instances (lines 30-52): 21 named imports
2. Factory functions (lines 55-77): 21 `create*` imports
3. Codec options types (lines 80-102): 21 `*Options` type imports

All from the same barrel: `./codecs/index.js`. Core redundancy — 63 names imported for registration.

**`DOCUMENT_TYPES` map (lines 114-199):** `const` record mapping 21 string keys to `{ outputPath, description }`. Static metadata — does not reference codecs. Defines output file paths.

**`DOCUMENT_TYPE_RENDERERS` (lines 207-210):** Partial record mapping `DocumentType` to custom render functions. Only one entry: `{ 'claude-modules': renderToClaudeMdModule }`.

**`CodecOptions` interface (lines 233-255):** Manually maintained union with one optional property per document type. 21 properties.

**`CodecRegistry` (lines 267-367):** Two `Map<DocumentType, T>` instances wrapped in an object API. Methods: `register()`, `registerFactory()`, `get()`, `getFactory()`, `has()`, `hasFactory()`, `getRegisteredTypes()`, `clear()`.

**Registration ceremony (lines 373-417):** 42 lines of imperative calls (21 register + 21 registerFactory).

**Codec resolution (lines 447-456):** `resolveCodec()` — if options exist, use factory; otherwise use default instance.

### 1.6 `reference.ts` Internal Structure (2,019 lines)

| Section                | Lines     | Content                                                                                |
| ---------------------- | --------- | -------------------------------------------------------------------------------------- |
| Types & Config         | 123-244   | `DiagramScope`, `ReferenceDocConfig`, `ShapeSelector`                                  |
| Product area mapping   | 248-582   | `PRODUCT_AREA_ARCH_CONTEXT_MAP`, `PRODUCT_AREA_META` (7 areas, ~335 lines static data) |
| Codec factory          | 614-765   | `createReferenceCodec()` — main entry point                                            |
| Product area decode    | 785-958   | `decodeProductArea()` — specialized path when `config.productArea` is set              |
| Convention sections    | 967-1015  | `buildConventionSections()`                                                            |
| Behavior sections      | 1023-1108 | `buildBehaviorSectionsFromPatterns()`                                                  |
| Business rules compact | 1122-1187 | `buildBusinessRulesCompactSection()`                                                   |
| Table of contents      | 1197-1209 | `buildTableOfContents()`                                                               |
| Shape sections         | 1221-1273 | `buildShapeSections()`                                                                 |
| Boundary summary       | 1289-1330 | `buildBoundarySummary()`                                                               |
| Diagram infrastructure | 1339-2019 | 5 diagram type builders + shared context (680 lines)                                   |

**The 4-layer composition:** `createReferenceCodec()` assembles from: (1) Conventions, (2) Diagrams, (3) Shapes, (4) Behaviors. The `config.shapesFirst` flag reorders shapes before conventions.

**Conditional bifurcation:** When `config.productArea` is set, the decode path switches to `decodeProductArea()` with a different 5-section structure. Two paths share some builders but have distinct assembly logic.

**`ReferenceDocConfig` interface (lines 192-244):** 14 fields, the central extensibility interface for reference docs. Required: `title`, `conventionTags`, `behaviorCategories`, `claudeMdSection`, `docsFilename`, `claudeMdFilename`.

### 1.7 IndexCodec Hardcoded Identity (`index-codec.ts` — 361 lines)

**Hardcoded project identity (lines 189-203):**

```typescript
['**Package**', '@libar-dev/architect'],
['**Purpose**', 'Context engineering platform for AI-assisted codebases'],
['**License**', 'MIT'],
```

**Hardcoded document title (lines 173-177):**

```typescript
return document('Documentation Index', sections, {
  purpose:
    'Navigate the full documentation set for @libar-dev/architect. ' +
    'Use section links for targeted reading.',
});
```

**Current extensibility:** `IndexCodecOptions` (lines 72-85) provides: `preamble`, `documentEntries`, boolean toggles. Package name, purpose, license, document title are NOT configurable.

### 1.8 Factory Boilerplate Pattern

Every codec follows this identical ceremony:

```typescript
// 1. Options interface extending BaseCodecOptions
export interface XxxCodecOptions extends BaseCodecOptions { ... }
// 2. Default options constant
export const DEFAULT_XXX_OPTIONS: Required<XxxCodecOptions> = { ... };
// 3. Factory function
export function createXxxCodec(options?: XxxCodecOptions): DocumentCodec {
  const opts = mergeOptions(DEFAULT_XXX_OPTIONS, options);
  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset) => buildXxxDocument(dataset, opts),
    encode: () => { throw new Error('Codec is decode-only.'); },
  });
}
// 4. Default instance
export const XxxCodec = createXxxCodec();
```

This appears ~21 times. The only varying parts are: options type, defaults, builder function name, error message.

### 1.9 Coupling Map

```
generate.ts ──depends-on──> codecs/index.ts (barrel)
              ──depends-on──> render.ts
              ──depends-on──> schema.ts (RenderableDocument)
              ──depends-on──> codecs/types/base.ts (DocumentCodec, BaseCodecOptions)

Each codec ──depends-on──> validation-schemas/master-dataset.ts (MasterDataset)
           ──depends-on──> schema.ts (block builders)
           ──depends-on──> codecs/types/base.ts (BaseCodecOptions, mergeOptions)
           ──depends-on──> codecs/shared-schema.ts (RenderableDocumentOutputSchema)
           ──depends-on──> utils.ts (display helpers)

reference.ts ──additionally depends-on──> convention-extractor.ts, shape-matcher.ts,
             diagram-utils.ts, helpers.ts, validation/fsm/, taxonomy/, api/pattern-helpers.ts
```

---

## 2. Taxonomy & Tag Registry System (~4,000 lines)

### 2.1 Registry Architecture (13 files in `src/taxonomy/`)

**Constants layer** — typed `as const` arrays:

- `status-values.ts` — 4 FSM states: `roadmap | active | completed | deferred`
- `deliverable-status.ts` — 6 states: `complete | in-progress | pending | deferred | superseded | n/a`
- `normalized-status.ts` — 3 display buckets: `completed | active | planned`
- `format-types.ts` — 6 format types: `value | enum | quoted-value | csv | number | flag`
- `categories.ts` — 21 category definitions with tag, domain, priority, description, aliases
- Plus: `hierarchy-levels.ts`, `risk-levels.ts`, `layer-types.ts`, `severity-types.ts`, `generator-options.ts`, `conventions.ts`, `claude-section-values.ts`

**Builder layer** — `registry-builder.ts`:

- `buildRegistry()` returns complete `TagRegistry` with 45+ metadata tags, 21 categories, 3 aggregation tags
- Tags organized in `METADATA_TAGS_BY_GROUP` (13 groups)
- `MetadataTagDefinitionForRegistry` interface: tag, format, purpose, required, repeatable, values, default, example, metadataKey, transform

### 2.2 Type Safety Enforcement

Four-layer approach:

1. `as const` arrays → literal union types
2. `typeof` indexing → type aliases (e.g., `type FormatType = (typeof FORMAT_TYPES)[number]`)
3. Zod schemas reference same constants (e.g., `z.enum(FORMAT_TYPES)`)
4. Pre-built Sets for O(1) membership checks (`VALID_PROCESS_STATUS_SET`)

**No `any` types** in the taxonomy/scanner/extractor modules. `unknown` with explicit casts is the chosen pattern.

### 2.3 Format Type Mechanics

| Format         | Parser Behavior                    | Example                        |
| -------------- | ---------------------------------- | ------------------------------ |
| `value`        | Everything after tag as string     | `@architect-pattern MyPattern` |
| `enum`         | Validates against `values` array   | `@architect-status roadmap`    |
| `quoted-value` | Content between quotes             | `@architect-usecase "When X"`  |
| `csv`          | Splits on commas, trims whitespace | `@architect-uses A, B, C`      |
| `number`       | `parseInt(value, 10)`              | `@architect-phase 14`          |
| `flag`         | Boolean presence                   | `@architect-sequence-error`    |

Each format has dedicated extraction functions in both parsers.

### 2.4 Flag Format Analysis

**`sequence-error` is the sole tag with `format: 'flag'`** (registry-builder.ts ~line 600-603). Consumed in:

- `gherkin-extractor.ts:248` — filters scenarios by `t === 'sequence-error'`
- `design-review.ts:218` — documents it in annotation guide
- `extracted-pattern.ts:57` — `errorScenarioNames` field in `BusinessRuleSchema`

**Flag detection in parsers:**

- TS parser: `checkFlagPresent()` — 6 lines (lines 220-223)
- Gherkin parser: 4-line `if` block (lines 589-593)

**Assessment:** Flag format costs nearly nothing. Removing it would force `sequence-error` into awkward value-format (`@architect-sequence-role:error`), inconsistent with existing sequence tags. Keep it.

### 2.5 TaxonomyCodec Hardcoded Examples

**Two hardcoded maps:**

1. `buildFormatTypesSection()` (lines 424-437): Quick-reference table
2. `buildFormatTypesDetailDocument()` (lines 662-707): Detailed reference with parsing behavior

Both show `@architect-core` as the flag example — **stale, not in registry**.

**`tagExampleOverrides` implementation path:**

```typescript
// On TaxonomyCodecOptions:
tagExampleOverrides?: Partial<Record<FormatType, { description?: string; example?: string }>>;

// In buildFormatTypesSection():
const info = { ...formatDescriptions[format], ...options.tagExampleOverrides?.[format] };
```

Preserves type safety: `FormatType` constrains keys, `Partial` allows omissions.

### 2.6 `@architect-core` Dual Behavior

**In TypeScript:** `@architect-core` is captured as a raw directive tag but produces no metadata (no registry entry for `core`).

**In Gherkin:** Normalized to `core`, which IS a valid category (priority 15 in categories.ts). Silently functions as a category tag.

**This is a bug** — same annotation, different semantics by source type.

---

## 3. MasterDataset & Configuration (~3,500 lines)

### 3.1 MasterDataset Schema (352 lines)

Four layers:

| Layer                | Fields                                                                        | Nature                          |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| Raw Data             | `patterns`, `tagRegistry`                                                     | Stored verbatim from extraction |
| Pre-computed Views   | `byStatus`, `byPhase`, `byQuarter`, `byCategory`, `bySource`, `byProductArea` | O(1) lookup groups              |
| Aggregate Statistics | `counts`, `phaseCount`, `categoryCount`                                       | Scalar summaries                |
| Optional Indexes     | `relationshipIndex`, `archIndex`, `sequenceIndex`                             | Computed when data exists       |

**`byStatus` (lines 56-65):** Normalizes to 3 canonical groups. The "planned" bucket absorbs `roadmap`, `deferred`, and undefined. Consumers cannot distinguish roadmap from deferred without re-scanning `patterns`.

**`bySource` (lines 113-125):** Contains `typescript`, `gherkin`, `roadmap`, `prd`. The latter two are NOT source types — naming mismatch.

**No workflow in Zod schema:** `LoadedWorkflow` contains Maps (not JSON-serializable), excluded from schema. Handled by `RuntimeMasterDataset`.

### 3.2 RuntimeMasterDataset vs MasterDataset

`transform-types.ts:88`:

```typescript
export interface RuntimeMasterDataset extends MasterDataset {
  readonly workflow?: LoadedWorkflow;
}
```

Creates a type split: codecs receive `MasterDataset` (no workflow), `GeneratorContext` carries `RuntimeMasterDataset` (with workflow), `ProcessStateAPI` wraps `RuntimeMasterDataset`.

### 3.3 Configuration System

**`ArchitectProjectConfig` (project-config.ts lines 158-220):** 12 optional fields in 6 groups. Flat interface.

**`ResolvedConfig` (lines 254-274):** Discriminated union on `isDefault` (true = no config file, false = loaded). Well-designed for provenance tracking.

**Cross-layer import:** `project-config.ts` imports `ReferenceDocConfig` and `CodecOptions` from renderable layer. Intentional and documented — config declares what to generate.

**Resolve process (resolve-config.ts lines 65-139):** 7 steps. `codecOptions` uses spread conditional (`...(raw.codecOptions !== undefined && { codecOptions: raw.codecOptions })`), meaning it's **omitted entirely** when not provided.

### 3.4 Preset System

Two presets:

- `libar-generic` (presets.ts lines 57-83): 3 categories. Default.
- `ddd-es-cqrs` (lines 101-106): 21 categories with `metadataTags`.

`PresetName` is a closed string literal union: `'libar-generic' | 'ddd-es-cqrs'`. No runtime registration.

### 3.5 Pipeline Factory (`build-pipeline.ts` — 363 lines)

**8-step pipeline:**

1. Load configuration (calls `loadConfig(baseDir)` — the double-load source)
2. Scan TypeScript
3. Extract TypeScript patterns
4. Scan + Extract Gherkin (conditional on `features.length > 0`)
5. Merge patterns
6. Compute hierarchy children
7. Load workflow
8. Transform to MasterDataset

**5 consumers:** Orchestrator, Process API CLI, validate-patterns CLI, REPL, MCP server.

**`PipelineOptions` does NOT carry config:** It has raw glob arrays, not `ResolvedConfig`. The pipeline internally calls `loadConfig()` to get the registry, causing the double-load when orchestrator already loaded config.

### 3.6 Orchestrator (`orchestrator.ts` — 858 lines)

**Two entry points:**

- `generateDocumentation()` (line 268): Low-level, raw globs
- `generateFromConfig()` (line 781): High-level, `ResolvedConfig`, handles grouping

**Generator grouping (`groupGenerators()` lines 709-731):** Serializes `{ sources, outputDir }` as JSON key. Generators with same resolved sources are batched.

**Codec options merge (lines 328-366):** Simple spread: `{ ...config.project.codecOptions, ...options?.codecOptions }`. **Shallow merge** — nested options clobbered, not deep-merged.

**`GeneratorContext.masterDataset` typed as optional** (types.ts:77): `RuntimeMasterDataset | undefined`. Always populated in practice.

### 3.7 Result Monad (`result.ts` — 107 lines)

Discriminated union with: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`, `map()`, `mapErr()`.

Used consistently in: pipeline factory, scanner, config loader, orchestrator, document generation. **Not used in:** `transformToMasterDataset()` (returns plain values with `ValidationSummary`).

Missing: `flatMap`/`andThen`, `tap`. Manual unwrapping needed for chaining.

### 3.8 Renderable Utils (`utils.ts` — 419 lines)

**Vestigial functions:** `groupByCategory()`, `groupByPhase()`, `groupByQuarter()` (lines 326-354) duplicate MasterDataset pre-computed views.

**Duplication:** `completionPercentage()` and `isFullyCompleted()` exist in both `utils.ts` (lines 289-299) and `transform-dataset.ts` (lines 410-419).

**`normalizeImplPath` duplication:** `patterns.ts:115` (exported) and `requirements.ts:95` (private). Identical implementations.

---

## 4. Scanner, Extractor, API, MCP, Lint (~16,900 lines)

### 4.1 Scanner Module (5 files, 2,164 lines)

**Two parallel sub-pipelines:**

- TypeScript: `pattern-scanner.ts` (118 lines) + `ast-parser.ts` (1,022 lines)
- Gherkin: `gherkin-scanner.ts` (191 lines) + `gherkin-ast-parser.ts` (833 lines)

**AST parsing:**

- TypeScript uses `@typescript-eslint/typescript-estree`
- Gherkin uses `@cucumber/gherkin` official parser

**`@architect` marker detection:** Registry-driven via `createRegexBuilders()` from `src/config/regex-builders.ts`. `hasFileOptIn(content, registry)` checks for bare `@architect`.

**Type erasure at `extractMetadataTag()`** (ast-parser.ts ~line 329): Returns `unknown`, forcing 25 `as` casts downstream. The `Map<string, unknown>` container erases format-specific return types.

**`extractPatternTags` return type** (gherkin-ast-parser.ts ~line 519-580): 40+ explicit fields plus `[key: string]: unknown` index signature. The index signature enables extensibility but undermines the typed fields.

**`TAG_LOOKUP` built at module load** (gherkin-ast-parser.ts lines 88-90): `buildRegistry()` called at import time. Currently fine (registry is static).

### 4.2 Extractor Module (6 files, 3,163 lines)

**Three extraction paths:**

- TypeScript: `doc-extractor.ts` (592 lines) → `ExtractedPattern[]`
- Gherkin: `gherkin-extractor.ts` (696 lines) → `ExtractedPattern[]`
- Shapes: `shape-extractor.ts` (1,197 lines) — re-parses TS files for type definitions

**Clean scanner/extractor boundary:** Extractor depends on scanner types but never calls scanner functions. Pipeline factory wires them.

**One boundary violation:** `gherkin-extractor.ts` imports `extractPatternTags` from `scanner/gherkin-ast-parser.ts`. The function is transformational, not scanning — belongs in extractor or shared utility.

**Double file reads for shapes:** Scanner reads content, doesn't pass to extractor. Shape extractor reads again via `fs.readFileSync`. The code acknowledges this: "Acceptable for v1."

**Two different pattern-building styles:**

- `doc-extractor.ts` uses conditional spread: `...(x && { field: x })`
- `gherkin-extractor.ts` uses `assignIfDefined()`/`assignIfNonEmpty()` mutation helpers

Both produce `ExtractedPattern` and validate via `ExtractedPatternSchema.safeParse()`.

**Shape rendering in wrong layer:** `renderShapesAsMarkdown()` defined in `shape-extractor.ts` (extraction layer), consumed by `codecs/helpers.ts` (renderable layer).

### 4.3 Process Data API (14 files, 4,110 lines)

**`ProcessStateAPI` (process-state.ts line 87):** 25-method interface in 5 groups:

- Status queries (5 methods)
- Phase queries (4 methods)
- FSM queries (4 methods)
- Pattern queries (7 methods)
- Timeline queries (5 methods)

Plus `getMasterDataset()`.

**Implementation:** Thin facade — most methods are 1-5 line delegations to pre-computed dataset views.

**Linear scan issue:** `getPatternsByStatus()` (line 311) filters `dataset.patterns` linearly. MasterDataset pre-computes normalized groups but not exact FSM status. A `byExactStatus` index would be O(1).

**Context assembler** (726 lines): The largest API file. Handles 3 session types with different inclusion rules. Candidate for strategy pattern refactoring.

**`QueryResult<T>` envelope:** Discriminated union with 12 typed error codes. Clean domain error handling.

### 4.4 MCP Server (5 files, 1,341 lines)

**24 tools** (not 25 as documented — counting discrepancy):

- 6 session-aware (text output)
- 9 data query (JSON output)
- 6 architecture (JSON output)
- 3 management

**Tool-to-API mapping:** Every tool wraps either a `ProcessStateAPI` method, a standalone query function, or a composed operation.

**`--watch` implementation:** `chokidar`-based file watching with 500ms debounce. Failed rebuilds log error and keep previous dataset.

**Code smells:**

- Hardcoded help text (lines 698-727) — should be generated from registered tools
- `safeHandler` wrapper (lines 90-107) eagerly converts errors to strings, losing stack traces

### 4.5 Process Guard (14 files, 4,131 lines)

**Decider pattern implementation** (`decider.ts` — 535 lines):

```
validateChanges(input: DeciderInput): DeciderOutput
```

Pure function. 5 sequential rules: protection level, status transitions, scope creep, session scope, session excluded.

**FSM state is derived, not stored.** `derive-state.ts` scans feature files to extract status, protection level, deliverables, session state.

**Protection levels map from FSM status:**

- `roadmap` → `none`
- `active` → `scope`
- `completed` → `hard`
- `deferred` → `none`

**Change detection** (`detect-changes.ts` — 619 lines): Parses `git diff` output. Detects status transitions, deliverable changes. Docstring-aware (tags in `"""` blocks ignored).

**Code smells:**

- `detect-changes.ts` at 619 lines mixes git command execution, diff parsing, and change analysis
- `createViolation` helper (lines 462-478) uses a type cast to add optional `suggestion` field
- Direct `fs`/`glob` imports in `derive-state.ts` (not abstracted)

### 4.6 Cross-Cutting Observations

**Pipeline data flow:**

```
CONFIG → SCANNER → EXTRACTOR → TRANSFORMER → CODEC/API/LINT
```

**Layer boundary quality:**

| Boundary                | Quality       | Notes                                     |
| ----------------------- | ------------- | ----------------------------------------- |
| Scanner → Extractor     | Good          | Clean type contract                       |
| Extractor → Transformer | Good          | Unified `ExtractedPattern` type           |
| Transformer → API       | Excellent     | MasterDataset is the single read model    |
| API → MCP               | Good          | Thin wrapper, 1:1 mapping                 |
| Scanner → Lint          | Clean         | Lint reuses scanner infrastructure        |
| Extractor → Renderable  | **Violation** | `renderShapesAsMarkdown` wrong layer      |
| Scanner → Extractor     | **Violation** | `extractPatternTags` used across boundary |

**Two tag normalization paths:** `ast-parser.ts` normalizes via registry-driven regex patterns. `gherkin-ast-parser.ts` normalizes via `normalizeTag()`. Different implementations for the same concept.

---

## 5. Observations Across Subsystems

### 5.1 Strengths

1. **Clean IR:** `RenderableDocument` with 9 block types covers all rendering needs. Codecs build intent, renderer handles syntax.
2. **Pure codecs:** All codecs are pure functions (dataset in, document out). No I/O, no side effects.
3. **Type-safe taxonomy:** Multi-layer enforcement (const arrays → union types → Zod schemas → runtime Sets).
4. **Result monad:** Consistent error handling in pipeline, scanner, config loader.
5. **Pre-computed views:** O(1) access in MasterDataset for status, phase, quarter, category.
6. **Decider pattern:** Process Guard is pure — no I/O, no side effects, easy to test.

### 5.2 Systematic Issues

1. **Registration ceremony:** 7 locations across 3 files per new codec.
2. **Type erasure at parser boundary:** `Map<string, unknown>` with 25 casts.
3. **Double file reads:** Scanner reads, extractor re-reads for shapes.
4. **Double config load:** Orchestrator loads config, pipeline loads again.
5. **Layer violations:** Shape rendering in extractor, tag extraction across scanner/extractor boundary.
6. **Vestigial code:** Grouping functions that duplicate MasterDataset views.
7. **Inconsistent patterns:** Two different pattern-building styles between TS and Gherkin extractors.
8. **Ghost annotations:** `@architect-core` with dual behavior by source type.

### 5.3 `ValidationRulesCodec` Note

This codec ignores `MasterDataset` entirely (confirmed: `_dataset` parameter unused). It builds from hardcoded `RULE_DEFINITIONS`. Two options:

1. Make it read rules from MasterDataset (which HAS business rules from Gherkin extraction) — architecturally cleaner
2. Document it as a "static content codec" — honest about what it is

Option 1 is more useful but requires decider rules to be extractable as data.
