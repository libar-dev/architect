# Architecture: @libar-dev/delivery-process

> **Code-Driven Documentation Generator with Codec-Based Transformation Pipeline**

This document describes the architecture of the `@libar-dev/delivery-process` package, a documentation generator that extracts patterns from TypeScript and Gherkin sources, transforms them through a unified pipeline, and renders them as markdown via typed codecs.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Configuration Architecture](#configuration-architecture)
3. [Four-Stage Pipeline](#four-stage-pipeline)
4. [Unified Transformation Architecture](#unified-transformation-architecture)
5. [Codec Architecture](#codec-architecture)
6. [Available Codecs](#available-codecs)
7. [Progressive Disclosure](#progressive-disclosure)
8. [Source Systems](#source-systems)
9. [Key Design Patterns](#key-design-patterns)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Workflow Integration](#workflow-integration)
12. [Quick Reference](#quick-reference)

---

## Executive Summary

### What This Package Does

The `@libar-dev/delivery-process` package generates LLM-optimized documentation from dual sources:

- **TypeScript code** with configurable JSDoc annotations (e.g., `@docs-*` or `@libar-docs-*`)
- **Gherkin feature files** with matching tags

The tag prefix is configurable via presets or custom configuration (see [Configuration Architecture](#configuration-architecture)).

### Key Design Principles

| Principle                      | Description                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Single Source of Truth**     | Code + .feature files are authoritative; docs are generated projections                          |
| **Single-Pass Transformation** | All derived views computed in O(n) time, not redundant O(n) per section                          |
| **Codec-Based Rendering**      | Zod 4 codecs transform MasterDataset → RenderableDocument → Markdown                             |
| **Schema-First Validation**    | Zod schemas define types; runtime validation at all boundaries                                   |
| **Single Read Model**          | MasterDataset is the sole read model for all consumers — codecs, validators, query API (ADR-006) |
| **Result Monad**               | Explicit error handling via `Result<T, E>` instead of exceptions                                 |

### Architecture Overview

```
                        Four-Stage Pipeline

  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   ┌─────────────┐
  │   SCANNER   │ → │  EXTRACTOR  │ → │  TRANSFORMER    │ → │   CODEC     │
  │             │   │             │   │                 │   │             │
  │ TypeScript  │   │ ExtractedP- │   │ MasterDataset   │   │ Renderable  │
  │ Gherkin     │   │ attern[]    │   │ (pre-computed   │   │ Document    │
  │ Files       │   │             │   │  views)         │   │ → Markdown  │
  └─────────────┘   └─────────────┘   └─────────────────┘   └─────────────┘
        ↑
  ┌─────────────┐
  │   CONFIG    │  defineConfig() → resolveProjectConfig() → ResolvedConfig
  └─────────────┘
```

---

## Configuration Architecture

> **Configuration Architecture** — See [CONFIGURATION.md](../docs-live/product-areas/CONFIGURATION.md) for config resolution, presets, and core configuration types.
> This content moved to generated product-area docs so configuration behavior stays synchronized with source annotations and schema evolution.

---

## Four-Stage Pipeline

The architecture has two coordinated entry points. The orchestrator (`src/generators/orchestrator.ts`) runs full generation, while the shared pipeline factory `buildMasterDataset()` (`src/generators/pipeline/build-pipeline.ts`) exposes the same scan/extract/transform core to CLI consumers.

### Stage 1: Scanner

Scanner discovers TypeScript and Gherkin sources, then parses each file into normalized scan outputs for extraction.

- TypeScript scanner: `src/scanner/pattern-scanner.ts` + AST parser support.
- Gherkin scanner: `src/scanner/gherkin-scanner.ts` + Gherkin AST parser support.
- Configuration-controlled regex builders determine opt-in and directive matching.

### Stage 2: Extractor

Extractor converts scan outputs into `ExtractedPattern[]` with normalized metadata, relationships, and optional shape data.

- Pattern extraction: `src/extractor/doc-extractor.ts`
- Shape extraction: `src/extractor/shape-extractor.ts`
- Merge behavior is consumer-aware: `fatal` for orchestration/query paths, `concatenate` for cross-source validation scenarios.

### Annotation Format Examples

These examples stay in the pipeline section because they explain the scanner/extractor contract that feeds every downstream stage.

```typescript
/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern MyPatternName
 * @libar-docs-status completed
 * @libar-docs-extract-shapes *
 */
```

```typescript
/**
 * @libar-docs-shape api-types
 * Declaration-level shape extraction with optional group.
 */
export interface PipelineConfig { ... }
```

### Pipeline Factory (ADR-006)

ADR-006 defines MasterDataset as the single read model. `buildMasterDataset()` packages scan, extract, merge, and transform into a reusable boundary for process-api and validators.
Key contract: `Promise<Result<PipelineResult, PipelineError>>` from `src/generators/pipeline/build-pipeline.ts`.
The factory centralizes warnings/scan metadata and prevents feature consumers from re-implementing parallel mini-pipelines.

### Stage 3: Transformer

Transformer computes all derived indexes in one pass (`byStatus`, `byPhase`, `byCategory`, relationships), so downstream codecs and validators read precomputed views instead of repeatedly filtering raw arrays.

### Stage 4: Codec

Codecs decode MasterDataset into a RenderableDocument block tree, and renderers emit markdown and Claude-oriented outputs. This keeps domain logic in codecs and output formatting in renderer functions.

---

## Unified Transformation Architecture

### MasterDataset Schema

**Key File:** `src/validation-schemas/master-dataset.ts`

The `MasterDataset` is the central data structure containing all pre-computed views:

```typescript
interface MasterDataset {
  // ─── Raw Data ───────────────────────────────────────────────────────────
  patterns: ExtractedPattern[];
  tagRegistry: TagRegistry;

  // ─── Pre-computed Views (O(1) access) ───────────────────────────────────
  byStatus: {
    completed: ExtractedPattern[]; // status: completed
    active: ExtractedPattern[]; // status: active
    planned: ExtractedPattern[]; // status: roadmap|planned|undefined
  };

  byPhase: Array<{
    phaseNumber: number;
    phaseName?: string; // From workflow config
    patterns: ExtractedPattern[];
    counts: StatusCounts; // Pre-computed per-phase counts
  }>; // Sorted by phase number ascending

  byQuarter: Record<string, ExtractedPattern[]>; // e.g., "Q4-2024"
  byCategory: Record<string, ExtractedPattern[]>;

  bySource: {
    typescript: ExtractedPattern[]; // From .ts files
    gherkin: ExtractedPattern[]; // From .feature files
    roadmap: ExtractedPattern[]; // Has phase metadata
    prd: ExtractedPattern[]; // Has productArea/userRole/businessValue
  };

  // ─── Aggregate Statistics ───────────────────────────────────────────────
  counts: StatusCounts; // { completed, active, planned, total }
  phaseCount: number;
  categoryCount: number;

  // ─── Relationship Index (10 fields) ─────────────────────────────────────
  relationshipIndex?: Record<
    string,
    {
      // Forward relationships (from annotations)
      uses: string[]; // @libar-docs-uses
      dependsOn: string[]; // @libar-docs-depends-on
      implementsPatterns: string[]; // @libar-docs-implements
      extendsPattern?: string; // @libar-docs-extends
      seeAlso: string[]; // @libar-docs-see-also
      apiRef: string[]; // @libar-docs-api-ref

      // Reverse lookups (computed by transformer)
      usedBy: string[]; // inverse of uses
      enables: string[]; // inverse of dependsOn
      implementedBy: ImplementationRef[]; // inverse of implementsPatterns (with file paths)
      extendedBy: string[]; // inverse of extendsPattern
    }
  >;

  // ─── Architecture Data (optional) ──────────────────────────────────────
  archIndex?: {
    byRole: Record<string, ExtractedPattern[]>;
    byContext: Record<string, ExtractedPattern[]>;
    byLayer: Record<string, ExtractedPattern[]>;
    byView: Record<string, ExtractedPattern[]>;
    all: ExtractedPattern[];
  };
}
```

### RuntimeMasterDataset

The runtime type extends `MasterDataset` with non-serializable workflow:

```typescript
// transform-dataset.ts:50-53
interface RuntimeMasterDataset extends MasterDataset {
  readonly workflow?: LoadedWorkflow; // Contains Maps - not JSON-serializable
}
```

### Single-Pass Transformation

The `transformToMasterDataset()` function iterates over patterns exactly once, accumulating all views:

```typescript
// transform-dataset.ts:98-235 (simplified)
export function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset {
  // Initialize accumulators
  const byStatus: StatusGroups = { completed: [], active: [], planned: [] };
  const byPhaseMap = new Map<number, ExtractedPattern[]>();
  const byQuarter: Record<string, ExtractedPattern[]> = {};
  const byCategoryMap = new Map<string, ExtractedPattern[]>();
  const bySource: SourceViews = { typescript: [], gherkin: [], roadmap: [], prd: [] };

  // Single pass over all patterns
  for (const pattern of patterns) {
    // Status grouping
    const status = normalizeStatus(pattern.status);
    byStatus[status].push(pattern);

    // Phase grouping (also adds to roadmap)
    if (pattern.phase !== undefined) {
      byPhaseMap.get(pattern.phase)?.push(pattern) ?? byPhaseMap.set(pattern.phase, [pattern]);
      bySource.roadmap.push(pattern);
    }

    // Quarter grouping
    if (pattern.quarter) {
      byQuarter[pattern.quarter] ??= [];
      byQuarter[pattern.quarter].push(pattern);
    }

    // Category grouping
    byCategoryMap.get(pattern.category)?.push(pattern) ?? /* ... */;

    // Source grouping (typescript vs gherkin)
    // PRD grouping (has productArea/userRole/businessValue)
    // Relationship index building
  }

  // Build sorted phase groups with counts
  const byPhase = Array.from(byPhaseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([phaseNumber, patterns]) => ({ phaseNumber, patterns, counts: computeCounts(patterns) }));

  return { patterns, tagRegistry, byStatus, byPhase, byQuarter, byCategory, bySource, counts, /* ... */ };
}
```

---

## Codec Architecture

### Key Concepts

The package uses a stable two-step boundary: `MasterDataset -> codec decode -> RenderableDocument -> render`.

```
MasterDataset → Codec.decode() → RenderableDocument ─┬→ renderToMarkdown       → Markdown Files
                                                      ├→ renderToClaudeMdModule → Modular Claude.md
                                                      └→ renderToClaudeContext  → Token-efficient text
```

This separation allows one dataset to be projected into multiple output modes without duplicating domain transforms.

### Block Vocabulary (9 Types)

RenderableDocument blocks stay fixed across codecs:

- Structural: `heading`, `paragraph`, `separator`
- Content: `table`, `list`, `code`, `mermaid`
- Progressive: `collapsible`, `link-out`

### Factory Pattern

Codecs expose a default export for standard options and a `create*Codec(...)` factory for per-run customization.

---

## Available Codecs

The codec system includes 20+ codecs organized by purpose: pattern-focused, timeline-focused, session-focused, planning, reference/composition, and other specialized codecs.

For the complete reference with options tables, factory patterns, and usage examples, see:
**[Available Codecs Reference](../docs-generated/docs/ARCHITECTURE-CODECS.md)** (auto-generated from source annotations)

---

## Progressive Disclosure

Progressive disclosure splits large documents into a main index plus detail files. This improves readability and enables focused navigation.

### How It Works

1. Main file contains summary sections and navigation.
2. Detail files hold full grouped content.
3. `link-out` blocks connect the main file to detail paths.
4. `additionalFiles` carries the generated detail document map.

### Codec Split Logic

Representative splits:

- `patterns` by category -> `patterns/<category>.md`
- `roadmap` by phase -> `phases/phase-<N>-<name>.md`
- `milestones` by quarter -> `milestones/<quarter>.md`
- `session` and `remaining` by incomplete phase
- `pr-changes` emits a single focused file

### Disabling Progressive Disclosure

Set `generateDetailFiles: false` for compact single-file output.

### Detail Level

`detailLevel` controls verbosity:

- `summary`: compact signal
- `standard`: default sections
- `detailed`: maximum optional detail

---

## Source Systems

> **Source Systems** — See [ANNOTATION.md](../docs-live/product-areas/ANNOTATION.md) for scanner types, tag dispatch, and extraction behavior.
> Scanner/extractor implementation details were consolidated into generated annotation docs; only pipeline-level annotation usage examples are retained here.

---

## Key Design Patterns

### Result Monad

> **Result Monad** — See [CORE-TYPES.md](../docs-live/product-areas/CORE-TYPES.md) for Result shape, type guards, and error-handling invariants.
> Core type semantics are maintained in generated type docs; architecture retains only high-level design rationale.

### Schema-First Validation

Schemas are authored first and TypeScript types are inferred from the schema definitions.
This keeps runtime validation and compile-time contracts aligned at every pipeline boundary.
Source: `src/validation-schemas/extracted-pattern.ts`.

### Tag Registry

Tag behavior is data-driven: scanner and extractor dispatch through registry metadata instead of hardcoded parser logic.
Categories, aliases, and priorities in the registry determine how annotation tags map to pattern domains.
This centralizes taxonomy evolution so adding tags changes data configuration, not extraction code.
Source: `src/taxonomy/`.

---

## Data Flow Diagrams

### Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATOR                                        │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 1: Load Tag Registry                                                   ││
│  │         buildRegistry() → TagRegistry                                       ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 2-3: Scan TypeScript Sources                                           ││
│  │           scanPatterns() → extractPatterns() → ExtractedPattern[]           ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 4-5: Scan Gherkin Sources                                              ││
│  │           scanGherkinFiles() → extractPatternsFromGherkin()                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 6: Merge Patterns (with conflict detection)                            ││
│  │         mergePatterns(tsPatterns, gherkinPatterns)                          ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 7: Compute Hierarchy Children                                          ││
│  │         computeHierarchyChildren() → patterns with children[] populated     ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 8: Transform to MasterDataset (SINGLE PASS)                           ││
│  │         transformToMasterDataset({ patterns, tagRegistry, workflow })       ││
│  │                                                                              ││
│  │         Computes: byStatus, byPhase, byQuarter, byCategory, bySource,       ││
│  │                   counts, phaseCount, categoryCount, relationshipIndex      ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 9: Run Codecs                                                          ││
│  │         for each generator:                                                 ││
│  │           doc = Codec.decode(masterDataset)                                 ││
│  │           files = renderDocumentWithFiles(doc, outputPath)                  ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                         │
│                                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ Step 10: Write Output Files                                                 ││
│  │          fs.writeFile() for each OutputFile                                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Factory Entry Point (ADR-006)

Steps 1-8 are also available via `buildMasterDataset()` from `src/generators/pipeline/build-pipeline.ts`. The orchestrator adds Steps 9-10 (codec execution and file writing).

```
buildMasterDataset(options)
         │
         ▼
    Steps 1-8 (scan → extract → merge → transform)
         │
         ▼
    Result<PipelineResult, PipelineError>
         │
         ├── process-api CLI        (mergeConflictStrategy: 'fatal')
         │     └── query handlers consume dataset
         │
         ├── validate-patterns CLI  (mergeConflictStrategy: 'concatenate')
         │     └── cross-source validation via relationshipIndex
         │
         └── orchestrator           (inline pipeline, adds Steps 9-10)
               ├── Step 9:  Codec execution → RenderableDocument[]
               └── Step 10: File writing → OutputFile[]
```

### MasterDataset Views

```
                        ┌─────────────────────────────────────┐
                        │         MasterDataset               │
                        │                                     │
                        │  patterns: ExtractedPattern[]       │
                        │  tagRegistry: TagRegistry           │
                        └─────────────────┬───────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│     byStatus        │     │      byPhase        │     │     byQuarter       │
│                     │     │                     │     │                     │
│ .completed[]        │     │ [0] phaseNumber: 1  │     │ "Q4-2024": [...]    │
│ .active[]           │     │     patterns[]      │     │ "Q1-2025": [...]    │
│ .planned[]          │     │     counts          │     │ "Q2-2025": [...]    │
└─────────────────────┘     │                     │     └─────────────────────┘
                            │ [1] phaseNumber: 14 │
          ┌─────────────────│     patterns[]      │───────────────────┐
          │                 │     counts          │                   │
          ▼                 └─────────────────────┘                   ▼
┌─────────────────────┐                               ┌─────────────────────┐
│     byCategory      │                               │      bySource       │
│                     │                               │                     │
│ "core": [...]       │                               │ .typescript[]       │
│ "scanner": [...]    │                               │ .gherkin[]          │
│ "generator": [...]  │                               │ .roadmap[]          │
└─────────────────────┘                               │ .prd[]              │
                                                      └─────────────────────┘
          │                                                       │
          └───────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │     Aggregate Statistics    │
                    │                             │
                    │ counts: { completed: 45,   │
                    │           active: 12,       │
                    │           planned: 38,      │
                    │           total: 95 }       │
                    │                             │
                    │ phaseCount: 15              │
                    │ categoryCount: 9            │
                    └─────────────────────────────┘
```

### Codec Transformation

````
                    ┌─────────────────────────────┐
                    │       MasterDataset         │
                    └──────────────┬──────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  PatternsCodec    │   │  RoadmapCodec     │   │  SessionCodec     │
│   .decode()       │   │   .decode()       │   │   .decode()       │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│RenderableDocument │   │RenderableDocument │   │RenderableDocument │
│                   │   │                   │   │                   │
│ title: "Patterns" │   │ title: "Roadmap"  │   │ title: "Session"  │
│ sections: [       │   │ sections: [       │   │ sections: [       │
│   heading(...),   │   │   heading(...),   │   │   heading(...),   │
│   table(...),     │   │   list(...),      │   │   paragraph(...), │
│   link-out(...)   │   │   mermaid(...)    │   │   collapsible()   │
│ ]                 │   │ ]                 │   │ ]                 │
│                   │   │                   │   │                   │
│ additionalFiles:  │   │ additionalFiles:  │   │ additionalFiles:  │
│ { "patterns/      │   │ { "phases/        │   │ { "sessions/      │
│    core.md": ... }│   │    phase-14.md" } │   │    phase-15.md" } │
└───────────────────┘   └───────────────────┘   └───────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │     renderToMarkdown()      │
                    │                             │
                    │ Traverses blocks:           │
                    │   heading → ## Title        │
                    │   table → | col | col |     │
                    │   list → - item             │
                    │   code → ```lang            │
                    │   mermaid → ```mermaid      │
                    │   link-out → [See ...](path)│
                    └─────────────────────────────┘
````

---

## Workflow Integration

> **Workflow Integration** — See [PROCESS.md](../docs-live/product-areas/PROCESS.md) for FSM lifecycle, session types, and handoff protocol.
> API tutorial code moved out of architecture overview because source and generated process docs are the authoritative references.

---

## Quick Reference

### Codec Reference

For codec descriptions, options, and factory patterns, see:
**[Available Codecs Reference](../docs-generated/docs/ARCHITECTURE-CODECS.md)**

To list available generators and their CLI flags: `generate-docs --list-generators`

### CLI Usage

```bash
# Single generator
generate-docs -i "src/**/*.ts" -g patterns -o docs

# Multiple generators
generate-docs -i "src/**/*.ts" -g patterns -g roadmap -g session -o docs

# List available generators
generate-docs --list-generators
```

### Common Filter Patterns

```typescript
// Status filters
filterStatus: ['completed']; // Historical only
filterStatus: ['active', 'planned']; // Future work
filterStatus: []; // All (default)

// Phase filters
filterPhases: [14, 15, 16]; // Specific phases
filterPhases: []; // All (default)

// Category filters
filterCategories: ['core', 'ddd']; // Specific categories
filterCategories: []; // All (default)

// Quarter filters
filterQuarters: ['Q1-2026']; // Specific quarter
filterQuarters: []; // All (default)
```

### Output Mode Shortcuts

```typescript
// Compact single-file output
{ generateDetailFiles: false, detailLevel: "summary" }

// Standard with progressive disclosure
{ generateDetailFiles: true, detailLevel: "standard" }

// Maximum detail
{ generateDetailFiles: true, detailLevel: "detailed" }
```

---

## Related Documentation

- [README.md](../README.md) - Package quick start and API overview
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration guide, presets, customization
- [TAXONOMY.md](./TAXONOMY.md) - Tag taxonomy concepts and API
- [src/taxonomy/](../src/taxonomy/) - TypeScript taxonomy source (categories, status values, priorities)

---

## Code References

| Component                | File                                                | Purpose                                        |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------- |
| MasterDataset Schema     | `src/validation-schemas/master-dataset.ts`          | Central data structure                         |
| transformToMasterDataset | `src/generators/pipeline/transform-dataset.ts`      | Single-pass transformation                     |
| Document Codecs          | `src/renderable/codecs/*.ts`                        | Zod 4 codec implementations                    |
| Reference Codec          | `src/renderable/codecs/reference.ts`                | Scoped reference documents                     |
| Composite Codec          | `src/renderable/codecs/composite.ts`                | Multi-codec assembly                           |
| Convention Extractor     | `src/renderable/codecs/convention-extractor.ts`     | Convention content extraction                  |
| Shape Matcher            | `src/renderable/codecs/shape-matcher.ts`            | Declaration-level filtering                    |
| Markdown Renderer        | `src/renderable/render.ts`                          | Block → Markdown                               |
| Claude Context Renderer  | `src/renderable/render.ts`                          | LLM-optimized rendering                        |
| Orchestrator             | `src/generators/orchestrator.ts`                    | Pipeline coordination                          |
| TypeScript Scanner       | `src/scanner/pattern-scanner.ts`                    | TS AST parsing                                 |
| Gherkin Scanner          | `src/scanner/gherkin-scanner.ts`                    | Feature file parsing                           |
| Pipeline Factory         | `src/generators/pipeline/build-pipeline.ts`         | Shared 8-step pipeline for CLI consumers       |
| Business Rules Query     | `src/api/rules-query.ts`                            | Rules domain query (from Gherkin Rule: blocks) |
| Business Rules Codec     | `src/renderable/codecs/business-rules.ts`           | Business rules from Gherkin Rule: blocks       |
| Architecture Codec       | `src/renderable/codecs/architecture.ts`             | Architecture diagrams from annotations         |
| Taxonomy Codec           | `src/renderable/codecs/taxonomy.ts`                 | Taxonomy reference documentation               |
| Validation Rules Codec   | `src/renderable/codecs/validation-rules.ts`         | Process Guard validation rules reference       |
| Decision Doc Generator   | `src/generators/built-in/decision-doc-generator.ts` | ADR/PDR decision documents                     |
| Shape Extractor          | `src/extractor/shape-extractor.ts`                  | Shape extraction from TS                       |
