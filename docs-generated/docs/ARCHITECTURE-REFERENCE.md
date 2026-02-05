# ArchitectureReference

**Purpose:** Full documentation generated from decision document
**Detail Level:** detailed

---

**Problem:**
  The ARCHITECTURE.md document (1300+ lines) describes the four-stage pipeline,
  MasterDataset schema, codec system, and block vocabulary. Maintaining this
  manually leads to drift from actual TypeScript interfaces and implementations.

  **Solution:**
  Auto-generate key architecture sections from annotated source code.
  TypeScript schemas define the data structures; documentation is a projection.
  Approximately 40% of content can be extracted from source annotations.

  **Target Documents:**

| Output | Purpose | Detail Level |
| docs-generated/docs/ARCHITECTURE-REFERENCE.md | Detailed human reference | detailed |
| docs-generated/_claude-md/architecture/architecture-reference.md | Compact AI context | summary |

  **Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| Design Principles | THIS DECISION (Rule: Design Principles) | Rule block table |
| Four-Stage Pipeline | THIS DECISION (Rule: Four-Stage Pipeline) | Rule block content + Mermaid |
| MasterDataset Schema | src/validation-schemas/master-dataset.ts | extract-shapes tag |
| RenderableDocument | src/renderable/schema.ts | extract-shapes tag |
| Block Vocabulary | THIS DECISION (Rule: Block Vocabulary) | Rule block table |
| Codec Factory Pattern | THIS DECISION (Rule: Codec Factory Pattern) | Rule block content |
| Generator Types | src/generators/types.ts | extract-shapes tag |
| Transform Function | src/generators/pipeline/transform-dataset.ts | extract-shapes tag |
| Available Codecs | THIS DECISION (Rule: Available Codecs) | Rule block table |
| Progressive Disclosure | THIS DECISION (Rule: Progressive Disclosure) | Rule block table |
| Codec to Generator Mapping | THIS DECISION (Rule: Codec to Generator Mapping) | Rule block table |
| Status Normalization | THIS DECISION (Rule: Status Normalization) | Rule block table |
| Result Monad Pattern | THIS DECISION (Rule: Result Monad Pattern) | Rule block content |
| Orchestrator Pipeline | THIS DECISION (Rule: Orchestrator Pipeline) | Rule block table + Mermaid |

---

## Implementation Details

### Design Principles

**Context:** The package follows specific architectural principles.

    **Decision:** These are the key design principles:

| Principle | Description |
| --- | --- |
| Single Source of Truth | Code and .feature files are authoritative; docs are generated projections |
| Single-Pass Transformation | All derived views computed in O(n) time, not redundant O(n) per section |
| Codec-Based Rendering | Zod 4 codecs transform MasterDataset to RenderableDocument to Markdown |
| Schema-First Validation | Zod schemas define types; runtime validation at all boundaries |
| Result Monad | Explicit error handling via Result T,E instead of exceptions |

### Four-Stage Pipeline

**Context:** The documentation generation pipeline consists of four stages.

    **Decision:** The four stages are:

| Stage | Purpose | Key Files | Input | Output |
| --- | --- | --- | --- | --- |
| Scanner | File discovery and AST parsing | pattern-scanner.ts, gherkin-scanner.ts | Source files | ScannedFile[] |
| Extractor | Pattern extraction from AST | doc-extractor.ts, gherkin-extractor.ts | ScannedFile[] | ExtractedPattern[] |
| Transformer | Single-pass view computation | transform-dataset.ts | ExtractedPattern[] | MasterDataset |
| Codec | Document generation | codecs/*.ts, render.ts | MasterDataset | Markdown files |

    **Pipeline Diagram:**

```mermaid
graph LR
        CONFIG[CONFIG] --> SCANNER
        SCANNER[SCANNER<br/>TypeScript + Gherkin<br/>files] --> EXTRACTOR
        EXTRACTOR[EXTRACTOR<br/>ExtractedPattern[]] --> TRANSFORMER
        TRANSFORMER[TRANSFORMER<br/>MasterDataset<br/>pre-computed views] --> CODEC
        CODEC[CODEC<br/>RenderableDocument<br/>to Markdown]
```

### MasterDataset Schema

```typescript
/**
 * Master Dataset - Unified view of all extracted patterns
 *
 * Contains raw patterns plus pre-computed views and statistics.
 * This is the primary data structure passed to generators and sections.
 */
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

```typescript
/**
 * Status-based grouping of patterns
 *
 * Patterns are normalized to three canonical states:
 * - completed: implemented, completed
 * - active: active, partial, in-progress
 * - planned: roadmap, planned, undefined
 */
StatusGroupsSchema = z.object({
  /** Patterns with status 'completed' or 'implemented' */
  completed: z.array(ExtractedPatternSchema),

  /** Patterns with status 'active', 'partial', or 'in-progress' */
  active: z.array(ExtractedPatternSchema),

  /** Patterns with status 'roadmap', 'planned', or undefined */
  planned: z.array(ExtractedPatternSchema),
})
```

```typescript
/**
 * Status counts for aggregate statistics
 */
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

```typescript
/**
 * Phase grouping with patterns and counts
 *
 * Groups patterns by their phase number, with pre-computed
 * status counts for each phase.
 */
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

```typescript
/**
 * Source-based views for different data origins
 */
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

```typescript
/**
 * Relationship index for dependency tracking
 *
 * Maps pattern names to their relationship metadata.
 */
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

```typescript
/**
 * Architecture index for diagram generation
 *
 * Groups patterns by architectural metadata for rendering component diagrams.
 */
ArchIndexSchema = z.object({
  /** Patterns grouped by arch-role (bounded-context, projection, saga, etc.) */
  byRole: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-context (orders, inventory, etc.) */
  byContext: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns grouped by arch-layer (domain, application, infrastructure) */
  byLayer: z.record(z.string(), z.array(ExtractedPatternSchema)),

  /** Patterns with any architecture metadata (for diagram generation) */
  all: z.array(ExtractedPatternSchema),
})
```

### RenderableDocument

```typescript
type RenderableDocument = {
  title: string;
  purpose?: string;
  detailLevel?: string;
  sections: SectionBlock[];
  additionalFiles?: Record<string, RenderableDocument>;
};
```

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

```typescript
type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
```

```typescript
type TableBlock = z.infer<typeof TableBlockSchema>;
```

```typescript
type ListBlock = z.infer<typeof ListBlockSchema>;
```

```typescript
type CodeBlock = z.infer<typeof CodeBlockSchema>;
```

```typescript
type MermaidBlock = z.infer<typeof MermaidBlockSchema>;
```

```typescript
type CollapsibleBlock = {
  type: 'collapsible';
  summary: string;
  content: SectionBlock[];
};
```

### Block Vocabulary

**Context:** RenderableDocument uses a fixed vocabulary of 9 section block types.

    **Decision:** Block types are grouped by purpose:

| Category | Block Types | Markdown Output |
| --- | --- | --- |
| Structural | heading, paragraph, separator | ## Title, text, --- |
| Content | table, list, code, mermaid | tables, lists, fenced code |
| Progressive | collapsible, link-out | details/summary, links to files |

    **Block Type Details:**

| Block | Key Properties | Usage |
| --- | --- | --- |
| heading | level (1-6), text | Section headers |
| paragraph | text | Body text |
| separator | (none) | Horizontal rules |
| table | columns, rows, alignment | Data tables |
| list | ordered, items | Bullet or numbered lists |
| code | language, content | Code snippets |
| mermaid | content | Mermaid diagrams |
| collapsible | summary, content | Expandable sections |
| link-out | text, path | Links to detail files |

### Codec Factory Pattern

**Context:** Every codec provides both a default instance and a factory function.

    **Decision:** The two-export pattern enables both simple and customized usage:

```typescript
// Default codec with standard options
    import { PatternsDocumentCodec } from './codecs';
    const doc = PatternsDocumentCodec.decode(dataset);

    // Factory for custom options
    import { createPatternsCodec } from './codecs';
    const codec = createPatternsCodec({ generateDetailFiles: false });
    const doc = codec.decode(dataset);
```

**Common Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| generateDetailFiles | boolean | true | Create progressive disclosure files |
| detailLevel | summary, standard, detailed | standard | Output verbosity |
| limits.recentItems | number | 10 | Max recent items in summaries |
| limits.collapseThreshold | number | 5 | Items before collapsing |

### Generator Types

```typescript
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

```typescript
/**
 * Runtime context provided to generators.
 */
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

```typescript
/**
 * Output from generator execution.
 */
interface GeneratorOutput {
  /** Files to write (path relative to outputDir) */
  readonly files: readonly OutputFile[];

  /** Files to delete for cleanup (path relative to outputDir) */
  readonly filesToDelete?: readonly string[];

  /** Optional metadata for registry.json or other purposes */
  readonly metadata?: Record<string, unknown>;
}
```

### Transform Function

```typescript
/**
 * Runtime MasterDataset with optional workflow
 *
 * Extends the Zod-compatible MasterDataset with workflow reference.
 * LoadedWorkflow contains Maps which aren't JSON-serializable,
 * so it's kept separate from the Zod schema.
 */
interface RuntimeMasterDataset extends MasterDataset {
  /** Optional workflow configuration (not serializable) */
  readonly workflow?: LoadedWorkflow;
}
```

```typescript
/**
 * Raw input data for transformation
 */
interface RawDataset {
  /** Extracted patterns from TypeScript and/or Gherkin sources */
  readonly patterns: readonly ExtractedPattern[];

  /** Tag registry for category lookups */
  readonly tagRegistry: TagRegistry;

  /** Optional workflow configuration for phase names (can be undefined) */
  readonly workflow?: LoadedWorkflow | undefined;
}
```

```typescript
/**
 * Transform raw extracted data into a MasterDataset with all pre-computed views.
 *
 * This is a ONE-PASS transformation that computes:
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Optional relationship index
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 *
 * @example
 * ```typescript
 * const masterDataset = transformToMasterDataset({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * // Access pre-computed views
 * const completed = masterDataset.byStatus.completed;
 * const phase3Patterns = masterDataset.byPhase.find(p => p.phaseNumber === 3);
 * const q42024 = masterDataset.byQuarter["Q4-2024"];
 * ```
 */
function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset;
```

### Available Codecs

**Context:** The package provides multiple specialized codecs for different documentation needs.

    **Decision:** Codecs are grouped by purpose:

    **Pattern-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| PatternsDocumentCodec | PATTERNS.md + patterns/*.md | Pattern registry by category |
| RequirementsDocumentCodec | PRODUCT-REQUIREMENTS.md | PRD grouped by product area |
| AdrDocumentCodec | DECISIONS.md + decisions/*.md | Architecture Decision Records |

    **Timeline-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| RoadmapDocumentCodec | ROADMAP.md + phases/*.md | Development roadmap by phase |
| CompletedMilestonesCodec | COMPLETED-MILESTONES.md | Historical record by quarter |
| CurrentWorkCodec | CURRENT-WORK.md | Active development work |
| ChangelogCodec | CHANGELOG.md | Keep a Changelog format |

    **Session-Focused Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| SessionContextCodec | SESSION-CONTEXT.md | Current session for AI agents |
| RemainingWorkCodec | REMAINING-WORK.md | Incomplete work summary |
| PrChangesCodec | working/PR-CHANGES.md | PR-scoped view by changed files |
| TraceabilityCodec | TRACEABILITY.md | Timeline to behavior coverage |

    **Planning Codecs:**

| Codec | Output | Purpose |
| --- | --- | --- |
| PlanningChecklistCodec | PLANNING-CHECKLIST.md | Pre-planning questions |
| SessionPlanCodec | SESSION-PLAN.md | Implementation plans |
| SessionFindingsCodec | SESSION-FINDINGS.md | Retrospective discoveries |

### Progressive Disclosure

**Context:** Large documents are split into main index plus detail files.

    **Decision:** Each codec has specific split logic:

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

    **Detail Level Options:**

| Value | Behavior |
| --- | --- |
| summary | Minimal output, key metrics only |
| standard | Default with all sections |
| detailed | Maximum detail, all optional sections |

### Codec to Generator Mapping

**Context:** Each codec is exposed via a CLI generator flag.

    **Decision:** The mapping from codec to generator name:

| Codec | Generator Name | CLI Flag |
| --- | --- | --- |
| PatternsDocumentCodec | patterns | -g patterns |
| RoadmapDocumentCodec | roadmap | -g roadmap |
| CompletedMilestonesCodec | milestones | -g milestones |
| CurrentWorkCodec | current | -g current |
| RequirementsDocumentCodec | requirements | -g requirements |
| SessionContextCodec | session | -g session |
| RemainingWorkCodec | remaining | -g remaining |
| PrChangesCodec | pr-changes | -g pr-changes |
| AdrDocumentCodec | adrs | -g adrs |
| PlanningChecklistCodec | planning-checklist | -g planning-checklist |
| SessionPlanCodec | session-plan | -g session-plan |
| SessionFindingsCodec | session-findings | -g session-findings |
| ChangelogCodec | changelog | -g changelog |
| TraceabilityCodec | traceability | -g traceability |
| OverviewCodec | overview-rdm | -g overview-rdm |

### Status Normalization

**Context:** Source annotations use various status values that must be normalized.

    **Decision:** All status values are normalized to three canonical states:

| Input Status | Normalized To |
| --- | --- |
| completed, implemented | completed |
| active, partial, in-progress | active |
| roadmap, planned, deferred, undefined | planned |

### Result Monad Pattern

**Context:** The package uses explicit error handling instead of exceptions.

    **Decision:** All operations return Result T,E for type-safe error handling:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

    // Usage
    const result = await scanPatterns(options);
    if (result.ok) {
      const { files } = result.value;
    } else {
      console.error(result.error);
    }
```

**Benefits:**
    - No exception swallowing
    - Partial success scenarios supported
    - Type-safe error handling at boundaries

### Orchestrator Pipeline

**Context:** The orchestrator coordinates the complete documentation generation pipeline.

    **Decision:** The orchestrator executes these steps:

| Step | Operation | Key Function |
| --- | --- | --- |
| 1 | Load configuration | loadConfig() |
| 2 | Scan TypeScript sources | scanPatterns() |
| 3 | Extract TypeScript patterns | extractPatterns() |
| 4 | Scan Gherkin sources | scanGherkinFiles() |
| 5 | Extract Gherkin patterns | extractPatternsFromGherkin() |
| 6 | Merge patterns | mergePatterns() |
| 7 | Compute hierarchy | computeHierarchyChildren() |
| 8 | Transform to MasterDataset | transformToMasterDataset() |
| 9 | Run codecs | Codec.decode() for each generator |
| 10 | Write output files | fs.writeFile() |

    **Orchestrator Flow Diagram:**

```mermaid
flowchart TB
        A[loadConfig] --> B[scanPatterns]
        B --> C[extractPatterns]
        D[scanGherkinFiles] --> E[extractPatternsFromGherkin]
        C --> F[mergePatterns]
        E --> F
        F --> G[computeHierarchyChildren]
        G --> H[transformToMasterDataset]
        H --> I[For each generator]
        I --> J[Codec.decode]
        J --> K[renderDocumentWithFiles]
        K --> L[fs.writeFile]
```
