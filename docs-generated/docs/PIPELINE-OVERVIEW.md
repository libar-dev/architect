# Pipeline Overview

**Purpose:** Reference document: Pipeline Overview
**Detail Level:** Full reference

---

## Design Principles

**Context:** The package follows specific architectural principles.

    **Key Design Principles:**

    **What This Means for Implementation:**

| Principle | Description |
| --- | --- |
| Single Source of Truth | Code and .feature files are authoritative; docs are generated projections |
| Single-Pass Transformation | All derived views computed in O(n) time, not redundant O(n) per section |
| Codec-Based Rendering | Zod 4 codecs transform MasterDataset to RenderableDocument to Markdown |
| Schema-First Validation | Zod schemas define types; runtime validation at all boundaries |
| Result Monad | Explicit error handling via Result(T,E) instead of exceptions |

| Aspect | Wrong Mental Model | Correct Mental Model |
| --- | --- | --- |
| Scope | Build feature for small output here | Build capability for hundreds of files |
| ROI | Over-engineered for this repo | Multi-day investment saves weeks of maintenance |
| Testing | Simple feature, basic tests | Mission-critical infra, comprehensive tests |
| Shortcuts | Good enough for this repo | Must work across many annotated sources |

---

## Four-Stage Pipeline

**Context:** The documentation generation pipeline consists of four stages.

    **Pipeline Overview:**

    **Stage Details:**

| Stage | Purpose | Key Files | Input | Output |
| --- | --- | --- | --- | --- |
| Scanner | File discovery and AST parsing | pattern-scanner.ts, gherkin-scanner.ts | Source files | ScannedFile[] |
| Extractor | Pattern extraction from AST | doc-extractor.ts, gherkin-extractor.ts | ScannedFile[] | ExtractedPattern[] |
| Transformer | Single-pass view computation | transform-dataset.ts | ExtractedPattern[] | MasterDataset |
| Codec | Document generation | codecs/*.ts, render.ts | MasterDataset | Markdown files |

| Stage | Scanner Variant | Purpose | File Discovery |
| --- | --- | --- | --- |
| Scanner | TypeScript | Parse .ts files with opt-in | glob patterns, hasFileOptIn check |
| Scanner | Gherkin | Parse .feature files | glob patterns, tag extraction |
| Extractor | TypeScript | JSDoc annotation extraction | AST parsing, directive extraction |
| Extractor | Gherkin | Tag and scenario extraction | Cucumber parser, tag mapping |

---

## Module Responsibilities

**Context:** The codebase is organized into modules with specific responsibilities.

    **Core Modules:**

    **Key Files by Function:**

| Module | Location | Purpose |
| --- | --- | --- |
| config | src/config/ | Configuration factory, presets (generic, libar-generic, ddd-es-cqrs) |
| taxonomy | src/taxonomy/ | Tag definitions - categories, status values, format types |
| scanner | src/scanner/ | TypeScript and Gherkin file scanning |
| extractor | src/extractor/ | Pattern extraction from AST/Gherkin |
| generators | src/generators/ | Document generators and orchestrator |
| renderable | src/renderable/ | Markdown codec system |
| validation | src/validation/ | FSM validation, DoD checks, anti-patterns |
| lint | src/lint/ | Pattern linting and process guard |
| api | src/api/ | Process State API for programmatic access |

| Function | File | Description |
| --- | --- | --- |
| Entry point | src/config/factory.ts | createDeliveryProcess() factory |
| TS scanning | src/scanner/pattern-scanner.ts | TypeScript file discovery and opt-in |
| Gherkin scanning | src/scanner/gherkin-scanner.ts | Feature file discovery |
| TS extraction | src/extractor/doc-extractor.ts | Pattern extraction from AST |
| Gherkin extraction | src/extractor/gherkin-extractor.ts | Pattern extraction from tags |
| Transformation | src/generators/pipeline/transform-dataset.ts | MasterDataset builder |
| Orchestration | src/generators/orchestrator.ts | Full pipeline coordination |
| Codecs | src/renderable/codecs/*.ts | Document type codecs |
| Rendering | src/renderable/renderer.ts | Block to markdown conversion |

---

## MasterDataset Schema

**Context:** MasterDataset is the central data structure with all pre-computed views.

    **Schema Structure:**

    **Pre-computed Views (O(1) Access):**

    See src/validation-schemas/master-dataset.ts for the complete Zod schema.

| Field | Type | Description |
| --- | --- | --- |
| patterns | ExtractedPattern[] | All patterns from both sources |
| tagRegistry | TagRegistry | Category and tag definitions |
| byStatus | StatusGroups | Grouped by completed, active, planned |
| byPhase | PhaseGroup[] | Grouped by phase with counts |
| byQuarter | Record(string, ExtractedPattern[]) | Grouped by quarter (e.g., "Q4-2024") |
| byCategory | Record(string, ExtractedPattern[]) | Grouped by category |
| bySource | SourceViews | Grouped by typescript, gherkin, roadmap, prd |
| counts | StatusCounts | Aggregate status counts |
| relationshipIndex | Record(string, RelationshipEntry) | Dependency graph (uses, usedBy, dependsOn, enables) |
| archIndex | ArchIndex | Optional architecture index for diagrams |

| View | Access Pattern | Use Case |
| --- | --- | --- |
| byStatus.completed | dataset.byStatus.completed | List completed patterns |
| byStatus.active | dataset.byStatus.active | List active patterns |
| byStatus.planned | dataset.byStatus.planned | List planned patterns |
| byPhase | dataset.byPhase[0].patterns | Get phase patterns with counts |
| byCategory | dataset.byCategory['core'] | Get patterns by category |
| bySource.typescript | dataset.bySource.typescript | Get TypeScript-origin patterns |
| bySource.gherkin | dataset.bySource.gherkin | Get Gherkin-origin patterns |

---

## RenderableDocument Schema

**Context:** RenderableDocument is the universal intermediate format.

    **Document Structure:**

    See src/renderable/schema.ts for block builders and type definitions.

| Field | Type | Description |
| --- | --- | --- |
| title | string | Document title (becomes H1) |
| purpose | string (optional) | Description (rendered as blockquote) |
| detailLevel | string (optional) | Detail level indicator |
| sections | SectionBlock[] | Array of content blocks |
| additionalFiles | Record(string, RenderableDocument) | Progressive disclosure detail files |

---

## Block Vocabulary

**Context:** RenderableDocument uses a fixed vocabulary of 9 section block types.

    **Block Categories:**

    **Block Type Reference:**

    **Block Builder Functions:**

| Category | Block Types | Markdown Output |
| --- | --- | --- |
| Structural | heading, paragraph, separator | Headings, text, horizontal rules |
| Content | table, list, code, mermaid | tables, lists, fenced code |
| Progressive | collapsible, link-out | details/summary, links to files |

| Block | Key Properties | Usage | Markdown Output |
| --- | --- | --- | --- |
| heading | level (1-6), text | Section headers | Heading with level |
| paragraph | text | Body text | Plain text |
| separator | (none) | Horizontal rules | --- |
| table | columns, rows, alignment | Data tables | Pipe tables |
| list | ordered, items | Bullet or numbered lists | - item or 1. item |
| code | language, content | Code snippets | Fenced code blocks |
| mermaid | content | Mermaid diagrams | mermaid code block |
| collapsible | summary, content | Expandable sections | details/summary HTML |
| link-out | text, path | Links to detail files | Markdown link |

| Function | Signature | Example |
| --- | --- | --- |
| heading | heading(level, text) | heading(2, 'Summary') |
| paragraph | paragraph(text) | paragraph('Some text') |
| table | table(columns, rows, alignment) | table(['Col'], [['Val']]) |
| list | list(items, ordered) | list(['Item 1', 'Item 2']) |
| code | code(language, content) | code('typescript', 'const x = 1') |
| mermaid | mermaid(content) | mermaid('graph LR; A-->B') |
| collapsible | collapsible(summary, content) | collapsible('Details', [...]) |
| linkOut | linkOut(text, path) | linkOut('See more', './detail.md') |

---

## Codec Factory Pattern

**Context:** Every codec provides both a default instance and a factory function.

    **Two-Export Pattern:**

    

    **Common Codec Options:**

    **Codec Implementation Pattern:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| generateDetailFiles | boolean | true | Create progressive disclosure files |
| detailLevel | summary/standard/detailed | standard | Output verbosity |
| limits.recentItems | number | 10 | Max recent items in summaries |
| limits.collapseThreshold | number | 5 | Items before collapsing |

| Step | Description | Code Location |
| --- | --- | --- |
| Define options | TypeScript interface for codec options | codecs/types.ts |
| Create factory | Function returning configured codec | codecs/*-codec.ts |
| Implement decode | Transform MasterDataset to RenderableDocument | codecs/*-codec.ts |
| Export defaults | Pre-configured default codec instance | codecs/index.ts |

```typescript
// Default codec with standard options
    import { PatternsDocumentCodec } from './codecs';
    const doc = PatternsDocumentCodec.decode(dataset);

    // Factory for custom options
    import { createPatternsCodec } from './codecs';
    const codec = createPatternsCodec({ generateDetailFiles: false });
    const doc = codec.decode(dataset);
```

---

## Available Codecs

**Context:** The package provides multiple specialized codecs for different documentation needs.

    **Codec Categories:**

    **Codec to Output File Mapping:**

    See src/renderable/generate.ts for the complete DOCUMENT_TYPES registry.

| Category | Codecs | Purpose |
| --- | --- | --- |
| Pattern-Focused | patterns, requirements, adrs | Pattern registries, requirements, decisions |
| Timeline-Focused | roadmap, milestones, current, changelog, overview | Roadmaps, history, active work, releases, project overview |
| Session-Focused | session, remaining, pr-changes, traceability | Session context, remaining work, PR changes |
| Planning | planning-checklist, session-plan, session-findings | Planning checklists, session plans, findings |

| Codec | Primary Output | Detail Files |
| --- | --- | --- |
| PatternsDocumentCodec | PATTERNS.md | patterns/category.md |
| RoadmapDocumentCodec | ROADMAP.md | phases/phase-N-name.md |
| CompletedMilestonesCodec | COMPLETED-MILESTONES.md | milestones/quarter.md |
| CurrentWorkCodec | CURRENT-WORK.md | current/phase-N-name.md |
| RequirementsDocumentCodec | PRODUCT-REQUIREMENTS.md | requirements/area-slug.md |
| SessionContextCodec | SESSION-CONTEXT.md | sessions/phase-N-name.md |
| RemainingWorkCodec | REMAINING-WORK.md | remaining/phase-N-name.md |
| AdrDocumentCodec | DECISIONS.md | decisions/category-slug.md |
| ChangelogCodec | CHANGELOG.md | (none) |
| PrChangesCodec | working/PR-CHANGES.md | (none) |
| TraceabilityCodec | TRACEABILITY.md | (none) |
| OverviewCodec | OVERVIEW.md | (none) |
| PlanningChecklistCodec | PLANNING-CHECKLIST.md | (none) |
| SessionPlanCodec | SESSION-PLAN.md | (none) |
| SessionFindingsCodec | SESSION-FINDINGS.md | (none) |

---

## Progressive Disclosure

**Context:** Large documents are split into main index plus detail files.

    **Split Logic by Codec:**

    **Detail Level Options:**

| Codec | Split By | Detail Path Pattern |
| --- | --- | --- |
| patterns | Category | patterns/category.md |
| roadmap | Phase | phases/phase-N-name.md |
| milestones | Quarter | milestones/quarter.md |
| current | Active Phase | current/phase-N-name.md |
| requirements | Product Area | requirements/area-slug.md |
| session | Incomplete Phase | sessions/phase-N-name.md |
| remaining | Incomplete Phase | remaining/phase-N-name.md |
| adrs | Category (at threshold) | decisions/category-slug.md |
| pr-changes | None | Single file only |

| Value | Behavior | Use Case |
| --- | --- | --- |
| summary | Minimal output, key metrics only | AI context, quick reference |
| standard | Default with all sections | Regular documentation |
| detailed | Maximum detail, all optional sections | Deep reference |

---

## Status Normalization

**Context:** Source annotations use various status values that must be normalized.

    **Status Mapping:**

    See src/taxonomy/normalized-status.ts for STATUS_NORMALIZATION_MAP and normalizeStatus.

| Input Status | Normalized To | Display Category |
| --- | --- | --- |
| completed | completed | Done |
| active | active | In Progress |
| roadmap | planned | Future Work |
| deferred | planned | Future Work |
| undefined | planned | Future Work |

---

## Codec to Generator Mapping

**Context:** Each codec is exposed via a CLI generator flag.

    **Generator CLI Flags:**

    See src/renderable/generate.ts for DOCUMENT_TYPES, CODEC_MAP, and CODEC_FACTORY_MAP.

| Generator Name | Codec | CLI Flag | Output |
| --- | --- | --- | --- |
| patterns | PatternsDocumentCodec | -g patterns | PATTERNS.md |
| roadmap | RoadmapDocumentCodec | -g roadmap | ROADMAP.md |
| milestones | CompletedMilestonesCodec | -g milestones | COMPLETED-MILESTONES.md |
| current | CurrentWorkCodec | -g current | CURRENT-WORK.md |
| requirements | RequirementsDocumentCodec | -g requirements | PRODUCT-REQUIREMENTS.md |
| session | SessionContextCodec | -g session | SESSION-CONTEXT.md |
| remaining | RemainingWorkCodec | -g remaining | REMAINING-WORK.md |
| adrs | AdrDocumentCodec | -g adrs | DECISIONS.md |
| changelog | ChangelogCodec | -g changelog | CHANGELOG.md |
| traceability | TraceabilityCodec | -g traceability | TRACEABILITY.md |
| overview-rdm | OverviewCodec | -g overview-rdm | OVERVIEW.md |
| pr-changes | PrChangesCodec | -g pr-changes | working/PR-CHANGES.md |
| planning-checklist | PlanningChecklistCodec | -g planning-checklist | PLANNING-CHECKLIST.md |
| session-plan | SessionPlanCodec | -g session-plan | SESSION-PLAN.md |
| session-findings | SessionFindingsCodec | -g session-findings | SESSION-FINDINGS.md |

---

## Result Monad Pattern

**Context:** The package uses explicit error handling instead of exceptions.

    **Result Type Definition:**

    

    **Benefits:**

| Benefit | Description |
| --- | --- |
| No exception swallowing | Errors must be explicitly handled |
| Partial success | Can return partial results with warnings |
| Type-safe | Compiler enforces error handling at boundaries |
| Composable | Results can be chained and transformed |

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

---

## Orchestrator Pipeline

**Context:** The orchestrator coordinates the complete documentation generation pipeline.

    **Orchestrator Steps:**

    **Error Handling in Pipeline:**

| Step | Operation | Key Function | Description |
| --- | --- | --- | --- |
| 1 | Load configuration | loadConfig() | Find and load config file |
| 2 | Scan TypeScript | scanPatterns() | Discover .ts files with opt-in |
| 3 | Extract TypeScript | extractPatterns() | Parse JSDoc annotations |
| 4 | Scan Gherkin | scanGherkinFiles() | Discover .feature files |
| 5 | Extract Gherkin | extractPatternsFromGherkin() | Parse tags and scenarios |
| 6 | Merge patterns | mergePatterns() | Combine with conflict detection |
| 7 | Compute hierarchy | computeHierarchyChildren() | Build parent-child relationships |
| 8 | Transform | transformToMasterDataset() | Build pre-computed views |
| 9 | Run codecs | Codec.decode() | Generate RenderableDocuments |
| 10 | Write files | fs.writeFile() | Output markdown files |

| Stage | Error Type | Recovery |
| --- | --- | --- |
| Config load | ConfigLoadError | Use default preset |
| Scan | ScanError | Return empty patterns |
| Extract | ExtractError | Skip malformed patterns |
| Merge | ConflictError | Return error to caller |
| Transform | (none) | Pure function, no errors |
| Codec | (none) | Pure function, no errors |
| Write | WriteError | Return error to caller |

---

## Codec Transformation

Scoped architecture diagram showing component relationships:

```mermaid
graph TB
    subgraph api["Api"]
        MasterDataset["MasterDataset[read-model]"]
    end
    subgraph renderer["Renderer"]
        SessionCodec["SessionCodec[projection]"]
        PatternsCodec["PatternsCodec[projection]"]
        ArchitectureCodec["ArchitectureCodec[projection]"]
    end
    subgraph related["Related"]
        PatternRelationshipModel["PatternRelationshipModel"]:::neighbor
    end
    PatternsCodec ..-> PatternRelationshipModel
    ArchitectureCodec --> MasterDataset
    classDef neighbor stroke-dasharray: 5 5
```

---

## Pipeline Data Flow

Scoped architecture diagram showing component relationships:

```mermaid
graph LR
    subgraph extractor["Extractor"]
        Document_Extractor["Document Extractor[service]"]
    end
    subgraph generator["Generator"]
        TransformDataset["TransformDataset[service]"]
    end
    subgraph renderer["Renderer"]
        PatternsCodec["PatternsCodec[projection]"]
    end
    subgraph scanner["Scanner"]
        Pattern_Scanner["Pattern Scanner[infrastructure]"]
    end
    subgraph related["Related"]
        MasterDataset["MasterDataset"]:::neighbor
        PatternRelationshipModel["PatternRelationshipModel"]:::neighbor
    end
    Document_Extractor --> Pattern_Scanner
    PatternsCodec ..-> PatternRelationshipModel
    TransformDataset --> MasterDataset
    TransformDataset ..-> PatternRelationshipModel
    classDef neighbor stroke-dasharray: 5 5
```

---

## API Types

### MasterDatasetSchema (const)

/**
 * Master Dataset - Unified view of all extracted patterns
 *
 * Contains raw patterns plus pre-computed views and statistics.
 * This is the primary data structure passed to generators and sections.
 */

```typescript
MasterDatasetSchema = z.object({
  // ─────────────────────────────────────────────────────────────────────────
  // Raw Data
  // ─────────────────────────────────────────────────────────────────────────

  /** All extracted patterns (both TypeScript and Gherkin) */
  patterns: z.array(ExtractedPatternSchema),

  /** Tag registry for category lookups */
  tagRegistry: TagRegistrySchema,

  // Note: workflow is not in the Zod schema because LoadedWorkflow contains Maps
  // (statusMap, phaseMap) which are not JSON-serializable. When workflow access
  // is needed, get it from SectionContext/GeneratorContext instead.

  // ─────────────────────────────────────────────────────────────────────────
  // Pre-computed Views
  // ─────────────────────────────────────────────────────────────────────────

  /** Patterns grouped by normalized status */
  byStatus: StatusGroupsSchema,

  /** Patterns grouped by phase number (sorted ascending) */
  byPhase: z.array(PhaseGroupSchema),

  /** Patterns grouped by quarter (e.g., "Q4-2024") */
  byQuarter: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by category */
  byCategory: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by source type */
  bySource: SourceViewsSchema,

  // ─────────────────────────────────────────────────────────────────────────
  // Aggregate Statistics
  // ─────────────────────────────────────────────────────────────────────────

  /** Overall status counts */
  counts: StatusCountsSchema,

  /** Number of distinct phases */
  phaseCount: z.number().int().nonnegative(),

  /** Number of distinct categories */
  categoryCount: z.number().int().nonnegative(),

  // ─────────────────────────────────────────────────────────────────────────
  // Relationship Data (optional)
  // ─────────────────────────────────────────────────────────────────────────

  /** Optional relationship index for dependency graph */
  relationshipIndex: z.record(z.string(), RelationshipEntrySchema).optional(),

  // ─────────────────────────────────────────────────────────────────────────
  // Architecture Data (optional)
  // ─────────────────────────────────────────────────────────────────────────

  /** Optional architecture index for diagram generation */
  archIndex: ArchIndexSchema.optional(),
})
```

### StatusGroupsSchema (const)

/**
 * Status-based grouping of patterns
 *
 * Patterns are normalized to three canonical states:
 * - completed: implemented, completed
 * - active: active, partial, in-progress
 * - planned: roadmap, planned, undefined
 */

```typescript
StatusGroupsSchema = z.object({
  /** Patterns with status 'completed' or 'implemented' */
  completed: z.array(ExtractedPatternSchema),

  /** Patterns with status 'active', 'partial', or 'in-progress' */
  active: z.array(ExtractedPatternSchema),

  /** Patterns with status 'roadmap', 'planned', or undefined */
  planned: z.array(ExtractedPatternSchema),
})
```

### StatusCountsSchema (const)

/**
 * Status counts for aggregate statistics
 */

```typescript
StatusCountsSchema = z.object({
  /** Number of completed patterns */
  completed: z.number().int().nonnegative(),

  /** Number of active patterns */
  active: z.number().int().nonnegative(),

  /** Number of planned patterns */
  planned: z.number().int().nonnegative(),

  /** Total number of patterns */
  total: z.number().int().nonnegative(),
})
```

### PhaseGroupSchema (const)

/**
 * Phase grouping with patterns and counts
 *
 * Groups patterns by their phase number, with pre-computed
 * status counts for each phase.
 */

```typescript
PhaseGroupSchema = z.object({
  /** Phase number (e.g., 1, 2, 3, 14, 39) */
  phaseNumber: z.number().int(),

  /** Optional phase name from workflow config */
  phaseName: z.string().optional(),

  /** Patterns in this phase */
  patterns: z.array(ExtractedPatternSchema),

  /** Pre-computed status counts for this phase */
  counts: StatusCountsSchema,
})
```

### SourceViewsSchema (const)

/**
 * Source-based views for different data origins
 */

```typescript
SourceViewsSchema = z.object({
  /** Patterns from TypeScript files (.ts) */
  typescript: z.array(ExtractedPatternSchema),

  /** Patterns from Gherkin feature files (.feature) */
  gherkin: z.array(ExtractedPatternSchema),

  /** Patterns with phase metadata (roadmap items) */
  roadmap: z.array(ExtractedPatternSchema),

  /** Patterns with PRD metadata (productArea, userRole, businessValue) */
  prd: z.array(ExtractedPatternSchema),
})
```

### RelationshipEntrySchema (const)

/**
 * Relationship index for dependency tracking
 *
 * Maps pattern names to their relationship metadata.
 */

```typescript
RelationshipEntrySchema = z.object({
  /** Patterns this pattern uses (from @libar-docs-uses) */
  uses: z.array(z.string()),

  /** Patterns that use this pattern (from @libar-docs-used-by) */
  usedBy: z.array(z.string()),

  /** Patterns this pattern depends on (from @libar-docs-depends-on) */
  dependsOn: z.array(z.string()),

  /** Patterns this pattern enables (from @libar-docs-enables) */
  enables: z.array(z.string()),

  // UML-inspired relationship fields (PatternRelationshipModel)
  /** Patterns this item implements (realization relationship) */
  implementsPatterns: z.array(z.string()),

  /** Files/patterns that implement this pattern (computed inverse with file paths) */
  implementedBy: z.array(ImplementationRefSchema),

  /** Pattern this extends (generalization relationship) */
  extendsPattern: z.string().optional(),

  /** Patterns that extend this pattern (computed inverse) */
  extendedBy: z.array(z.string()),

  /** Related patterns for cross-reference without dependency (from @libar-docs-see-also tag) */
  seeAlso: z.array(z.string()),

  /** File paths to implementation APIs (from @libar-docs-api-ref tag) */
  apiRef: z.array(z.string()),
})
```

### ArchIndexSchema (const)

/**
 * Architecture index for diagram generation
 *
 * Groups patterns by architectural metadata for rendering component diagrams.
 */

```typescript
ArchIndexSchema = z.object({
  /** Patterns grouped by arch-role (bounded-context, projection, saga, etc.) */
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-context (orders, inventory, etc.) */
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-layer (domain, application, infrastructure) */
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-view (named architectural views for scoped diagrams) */
  byView: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns with any architecture metadata (for diagram generation) */
  all: z.array(ExtractedPatternSchema),
})
```

### RenderableDocument (type)

```typescript
type RenderableDocument = {
  title: string;
  purpose?: string;
  detailLevel?: string;
  sections: SectionBlock[];
  additionalFiles?: Record<string, RenderableDocument>;
};
```

### SectionBlock (type)

```typescript
type SectionBlock =
  | HeadingBlock
  | ParagraphBlock
  | SeparatorBlock
  | TableBlock
  | ListBlock
  | CodeBlock
  | MermaidBlock
  | CollapsibleBlock
  | LinkOutBlock;
```

### HeadingBlock (type)

```typescript
type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
```

### TableBlock (type)

```typescript
type TableBlock = z.infer<typeof TableBlockSchema>;
```

### ListBlock (type)

```typescript
type ListBlock = z.infer<typeof ListBlockSchema>;
```

### CodeBlock (type)

```typescript
type CodeBlock = z.infer<typeof CodeBlockSchema>;
```

### MermaidBlock (type)

```typescript
type MermaidBlock = z.infer<typeof MermaidBlockSchema>;
```

### CollapsibleBlock (type)

```typescript
type CollapsibleBlock = {
  type: 'collapsible';
  summary: string;
  content: SectionBlock[];
};
```

### DocumentGenerator (interface)

/**
 * @libar-docs-generator
 * @libar-docs-pattern GeneratorTypes
 * @libar-docs-status completed
 * @libar-docs-used-by GeneratorRegistry, GeneratorFactory, Orchestrator, SectionRegistry
 * @libar-docs-extract-shapes DocumentGenerator, GeneratorContext, GeneratorOutput
 *
 * ## GeneratorTypes - Pluggable Document Generation Interface
 *
 * Minimal interface for pluggable generators that produce documentation from patterns.
 * Both JSON-configured built-in generators and TypeScript custom generators implement this.
 *
 * ### When to Use
 *
 * - Creating a new document format (ADRs, planning docs, API specs)
 * - Building custom generators in TypeScript
 * - Integrating with the unified CLI
 *
 * ### Key Concepts
 *
 * - **Generator:** Transforms patterns → document files
 * - **Context:** Runtime environment (base paths, registries, scenarios)
 * - **Output:** Map of file paths → content
 */

```typescript
interface DocumentGenerator {
  /** Unique generator name (e.g., "patterns", "adrs", "planning") */
  readonly name: string;

  /** Optional description shown in --list-generators */
  readonly description?: string;

  /**
   * Generate documentation from extracted patterns.
   *
   * @param patterns - Extracted patterns from source code
   * @param context - Runtime context (paths, registry, scenario map)
   * @returns Generated files with paths relative to outputDir
   */
  generate(
    patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput>;
}
```

| Property | Description |
| --- | --- |
| name | Unique generator name (e.g., "patterns", "adrs", "planning") |
| description | Optional description shown in --list-generators |

### GeneratorContext (interface)

/**
 * Runtime context provided to generators.
 */

```typescript
interface GeneratorContext {
  /** Base directory for resolving relative paths */
  readonly baseDir: string;

  /** Output directory for generated files */
  readonly outputDir: string;

  /** Tag registry with category/aggregation definitions */
  readonly registry: TagRegistry;

  /** Optional workflow configuration for status handling */
  readonly workflow?: LoadedWorkflow;

  /**
   * Pre-computed pattern views for efficient access.
   *
   * Contains patterns grouped by status, phase, quarter, category, and source,
   * computed in a single pass. Sections should use these pre-computed views
   * instead of filtering the raw patterns array.
   */
  readonly masterDataset?: RuntimeMasterDataset;

  /**
   * Optional codec-specific options for document generation.
   *
   * Used to pass runtime configuration (e.g., changedFiles for PR changes)
   * through the CLI → Orchestrator → Generator → Codec pipeline.
   *
   * @example
   * ```typescript
   * const context: GeneratorContext = {
   *   // ... other fields
   *   codecOptions: {
   *     "pr-changes": { changedFiles: ["src/foo.ts"], releaseFilter: "v0.2.0" }
   *   }
   * };
   * ```
   */
  readonly codecOptions?: CodecOptions;
}
```

| Property | Description |
| --- | --- |
| baseDir | Base directory for resolving relative paths |
| outputDir | Output directory for generated files |
| registry | Tag registry with category/aggregation definitions |
| workflow | Optional workflow configuration for status handling |
| masterDataset | Pre-computed pattern views for efficient access. |
| codecOptions | Optional codec-specific options for document generation. |

### GeneratorOutput (interface)

/**
 * Output from generator execution.
 */

```typescript
interface GeneratorOutput {
  /** Files to write (path relative to outputDir) */
  readonly files: readonly OutputFile[];

  /** Files to delete for cleanup (path relative to outputDir) */
  readonly filesToDelete?: readonly string[];

  /** Optional metadata for registry.json or other purposes */
  readonly metadata?: Record<string, unknown>;
}
```

| Property | Description |
| --- | --- |
| files | Files to write (path relative to outputDir) |
| filesToDelete | Files to delete for cleanup (path relative to outputDir) |
| metadata | Optional metadata for registry.json or other purposes |

### DeliveryProcessConfig (interface)

/**
 * Configuration for creating a delivery process instance.
 * Uses generics to preserve literal types from presets.
 */

```typescript
interface DeliveryProcessConfig {
  /** Tag prefix for directives (e.g., "@docs-" or "@libar-docs-") */
  readonly tagPrefix: string;
  /** File-level opt-in tag (e.g., "@docs" or "@libar-docs") */
  readonly fileOptInTag: string;
  /** Category definitions for pattern classification */
  readonly categories: readonly CategoryDefinition[];
  /** Optional metadata tag definitions */
  readonly metadataTags?: readonly MetadataTagDefinitionForRegistry[];
  /**
   * Optional context inference rules for auto-inferring bounded context from file paths.
   *
   * When provided, these rules are merged with the default rules. User-provided rules
   * take precedence over defaults (applied first in the rule list).
   *
   * @example
   * ```typescript
   * contextInferenceRules: [
   *   { pattern: 'packages/orders/**', context: 'orders' },
   *   { pattern: 'packages/inventory/**', context: 'inventory' },
   * ]
   * ```
   */
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
}
```

| Property | Description |
| --- | --- |
| tagPrefix | Tag prefix for directives (e.g., "@docs-" or "@libar-docs-") |
| fileOptInTag | File-level opt-in tag (e.g., "@docs" or "@libar-docs") |
| categories | Category definitions for pattern classification |
| metadataTags | Optional metadata tag definitions |
| contextInferenceRules | Optional context inference rules for auto-inferring bounded context from file paths. |

### DeliveryProcessInstance (interface)

/**
 * Instance returned by createDeliveryProcess with configured registry
 */

```typescript
interface DeliveryProcessInstance {
  /** The fully configured tag registry */
  readonly registry: TagRegistry;
  /** Regex builders for tag detection */
  readonly regexBuilders: RegexBuilders;
}
```

| Property | Description |
| --- | --- |
| registry | The fully configured tag registry |
| regexBuilders | Regex builders for tag detection |

### RegexBuilders (interface)

/**
 * Regex builders for tag detection
 *
 * Provides type-safe regex operations for detecting and normalizing tags
 * based on the configured tag prefix.
 */

```typescript
interface RegexBuilders {
  /** Pattern to match file-level opt-in (e.g., /** @docs *\/) */
  readonly fileOptInPattern: RegExp;
  /** Pattern to match directives (e.g., @docs-pattern, @docs-status) */
  readonly directivePattern: RegExp;
  /** Check if content has the file-level opt-in marker */
  hasFileOptIn(content: string): boolean;
  /** Check if content has any doc directives */
  hasDocDirectives(content: string): boolean;
  /** Normalize a tag by removing @ and prefix (e.g., "@docs-pattern" -> "pattern") */
  normalizeTag(tag: string): string;
}
```

| Property | Description |
| --- | --- |
| fileOptInPattern | Pattern to match file-level opt-in (e.g., /** @docs *\/) |
| directivePattern | Pattern to match directives (e.g., @docs-pattern, @docs-status) |

---
