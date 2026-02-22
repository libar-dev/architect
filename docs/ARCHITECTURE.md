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
12. [Programmatic Usage](#programmatic-usage)
13. [Extending the System](#extending-the-system)
14. [Quick Reference](#quick-reference)

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

The pipeline has two entry points. The orchestrator (`src/generators/orchestrator.ts`) runs all 10 steps end-to-end for documentation generation. The shared pipeline factory `buildMasterDataset()` (`src/generators/pipeline/build-pipeline.ts`) runs steps 1-8 and returns a `Result<PipelineResult, PipelineError>` for CLI consumers like process-api and validate-patterns (see [Pipeline Factory](#pipeline-factory-adr-006)).

### Stage 1: Scanner

**Purpose:** Discover source files and parse them into structured AST representations.

| Scanner Type | Input                          | Output                 | Key File                         |
| ------------ | ------------------------------ | ---------------------- | -------------------------------- |
| TypeScript   | `.ts` files with `@libar-docs` | `ScannedFile[]`        | `src/scanner/pattern-scanner.ts` |
| Gherkin      | `.feature` files               | `ScannedGherkinFile[]` | `src/scanner/gherkin-scanner.ts` |

**TypeScript Scanning Flow:**

```
findFilesToScan()     →  hasFileOptIn()      →  parseFileDirectives()
(glob patterns)          (@libar-docs check)    (AST extraction)
```

**Gherkin Scanning Flow:**

```
findFeatureFiles()    →  parseFeatureFile()  →  extractPatternTags()
(glob patterns)          (Cucumber parser)      (tag extraction)
```

### Stage 2: Extractor

**Purpose:** Convert scanned files into normalized `ExtractedPattern` objects.

**Key Files:**

- `src/extractor/doc-extractor.ts:extractPatterns()` - Pattern extraction
- `src/extractor/shape-extractor.ts` - Shape extraction (3 modes)

**Shape Extraction Modes:**

| Mode                    | Trigger                                | Behavior                                       |
| ----------------------- | -------------------------------------- | ---------------------------------------------- |
| Explicit names          | `@libar-docs-extract-shapes Foo, Bar`  | Extracts named declarations only               |
| Wildcard auto-discovery | `@libar-docs-extract-shapes *`         | Extracts all exported declarations from file   |
| Declaration-level       | `@libar-docs-shape` on individual decl | Extracts tagged declarations (exported or not) |

Shapes now include `params`, `returns`, and `throws` fields (parsed from `@param`/`@returns`/`@throws` JSDoc tags on function shapes), and an optional `group` field from the `@libar-docs-shape` tag value. `ExportInfo` includes an optional `signature` field for function/const/class declarations.

```typescript
interface ExtractedPattern {
  id: string; // pattern-{8-char-hex}
  name: string;
  category: string;
  directive: DocDirective;
  code: string;
  source: SourceInfo; // { file, lines: [start, end] }

  // Metadata from annotations
  patternName?: string;
  status?: PatternStatus; // roadmap|active|completed|deferred
  phase?: number;
  quarter?: string; // Q1-2025
  release?: string; // v0.1.0 or vNEXT
  useCases?: string[];
  uses?: string[];
  usedBy?: string[];
  dependsOn?: string[];
  enables?: string[];

  // ... 30+ additional fields
}
```

**Dual-Source Merging:**

After extraction, patterns from both sources are merged with conflict detection. Merge behavior varies by consumer: `'fatal'` mode (used by process-api and orchestrator) returns an error if the same pattern name exists in both TypeScript and Gherkin; `'concatenate'` mode (used by validate-patterns) falls back to concatenation on conflict, since the validator needs both sources for cross-source matching.

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

ADR-006 established the **Single Read Model Architecture**: the MasterDataset is the sole read model for all consumers. The shared pipeline factory extracts the 8-step scan-extract-merge-transform pipeline into a reusable function.

**Key File:** `src/generators/pipeline/build-pipeline.ts`

**Signature:**

```typescript
function buildMasterDataset(
  options: PipelineOptions
): Promise<Result<PipelineResult, PipelineError>>;
```

**PipelineOptions:**

| Field                   | Type                                         | Description                                              |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `input`                 | `readonly string[]`                          | TypeScript source glob patterns                          |
| `features`              | `readonly string[]`                          | Gherkin feature glob patterns                            |
| `baseDir`               | `string`                                     | Base directory for glob resolution                       |
| `mergeConflictStrategy` | `'fatal' \| 'concatenate'`                   | How to handle duplicate pattern names across sources     |
| `exclude`               | `readonly string[]` (optional)               | Glob patterns to exclude from scanning                   |
| `workflowPath`          | `string` (optional)                          | Custom workflow config JSON path                         |
| `contextInferenceRules` | `readonly ContextInferenceRule[]` (optional) | Custom context inference rules                           |
| `includeValidation`     | `boolean` (optional)                         | When false, skip validation pass (default true)          |
| `failOnScanErrors`      | `boolean` (optional)                         | When true, return error on scan failures (default false) |

**PipelineResult:**

| Field          | Type                         | Description                                |
| -------------- | ---------------------------- | ------------------------------------------ |
| `dataset`      | `RuntimeMasterDataset`       | The fully-computed read model              |
| `validation`   | `ValidationSummary`          | Schema validation results for all patterns |
| `warnings`     | `readonly PipelineWarning[]` | Structured non-fatal warnings              |
| `scanMetadata` | `ScanMetadata`               | Aggregate scan counts for reporting        |

**PipelineWarning:**

| Field     | Type                                          | Description                |
| --------- | --------------------------------------------- | -------------------------- |
| `type`    | `'scan' \| 'extraction' \| 'gherkin-parse'`   | Warning category           |
| `message` | `string`                                      | Human-readable description |
| `count`   | `number` (optional)                           | Number of affected items   |
| `details` | `readonly PipelineWarningDetail[]` (optional) | File-level diagnostics     |

**ScanMetadata:**

| Field                   | Type     | Description                        |
| ----------------------- | -------- | ---------------------------------- |
| `scannedFileCount`      | `number` | Total files successfully scanned   |
| `scanErrorCount`        | `number` | Files that failed to scan          |
| `skippedDirectiveCount` | `number` | Invalid directives skipped         |
| `gherkinErrorCount`     | `number` | Feature files that failed to parse |

**PipelineError:**

| Field     | Type     | Description                                             |
| --------- | -------- | ------------------------------------------------------- |
| `step`    | `string` | Pipeline step that failed (e.g., `'config'`, `'merge'`) |
| `message` | `string` | Human-readable error description                        |

**Consumer Table:**

| Consumer            | `mergeConflictStrategy`          | Error Handling              |
| ------------------- | -------------------------------- | --------------------------- |
| `process-api`       | `'fatal'`                        | Maps to `process.exit(1)`   |
| `validate-patterns` | `'concatenate'`                  | Falls back to concatenation |
| `orchestrator`      | inline (equivalent to `'fatal'`) | Inline error reporting      |

**Consumer Layers (ADR-006):**

| Layer                  | May Import                            | Examples                                              |
| ---------------------- | ------------------------------------- | ----------------------------------------------------- |
| Pipeline Orchestration | `scanner/`, `extractor/`, `pipeline/` | `orchestrator.ts`, pipeline setup in CLI entry points |
| Feature Consumption    | `MasterDataset`, `relationshipIndex`  | codecs, ProcessStateAPI, validators, query handlers   |

**Named Anti-Patterns (ADR-006):**

| Anti-Pattern            | Detection Signal                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Parallel Pipeline       | Feature consumer imports from `scanner/` or `extractor/`                                           |
| Lossy Local Type        | Local interface with subset of `ExtractedPattern` fields + dedicated extraction function           |
| Re-derived Relationship | Building `Map` or `Set` from `pattern.implementsPatterns`, `uses`, or `dependsOn` in consumer code |

### Stage 3: Transformer

**Purpose:** Compute all derived views in a single O(n) pass.

**Key File:** `src/generators/pipeline/transform-dataset.ts:transformToMasterDataset()`

This is the **key innovation** of the unified pipeline. Instead of each section calling `.filter()` repeatedly:

```typescript
// OLD: Each section filters independently - O(n) per section
const completed = patterns.filter((p) => normalizeStatus(p.status) === 'completed');
const active = patterns.filter((p) => normalizeStatus(p.status) === 'active');
const phase3 = patterns.filter((p) => p.phase === 3);
```

The transformer computes ALL views upfront:

```typescript
// NEW: Single-pass transformation - O(n) total
const masterDataset = transformToMasterDataset({ patterns, tagRegistry, workflow });

// Sections access pre-computed views - O(1)
const completed = masterDataset.byStatus.completed;
const phase3 = masterDataset.byPhase.find((p) => p.phaseNumber === 3);
```

### Stage 4: Codec

**Purpose:** Transform MasterDataset into RenderableDocument, then render to markdown.

**Key Files:**

- `src/renderable/codecs/*.ts` - Document codecs
- `src/renderable/render.ts` - Markdown renderer

```typescript
// Codec transforms to universal intermediate format
const doc = PatternsDocumentCodec.decode(masterDataset);

// Renderer produces markdown files
const files = renderDocumentWithFiles(doc, 'PATTERNS.md');
```

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

The delivery-process package uses a codec-based architecture for document generation:

```
MasterDataset → Codec.decode() → RenderableDocument ─┬→ renderToMarkdown       → Markdown Files
                                                      ├→ renderToClaudeMdModule → Modular Claude.md
                                                      └→ renderToClaudeContext  → Token-efficient text
```

| Component                  | Description                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **MasterDataset**          | Aggregated view of all extracted patterns with indexes by category, phase, status              |
| **Codec**                  | Zod 4 codec that transforms MasterDataset into RenderableDocument                              |
| **RenderableDocument**     | Universal intermediate format with typed section blocks                                        |
| **renderToMarkdown**       | Domain-agnostic markdown renderer for human documentation                                      |
| **renderToClaudeMdModule** | Modular-claude-md renderer (H3-rooted headings, omits Mermaid/link-outs)                       |
| **renderToClaudeContext**  | LLM-optimized renderer (~20-40% fewer tokens, omits Mermaid, flattens collapsibles) _(legacy)_ |

### Block Vocabulary (9 Types)

The RenderableDocument uses a fixed vocabulary of section blocks:

| Category        | Block Types                         |
| --------------- | ----------------------------------- |
| **Structural**  | `heading`, `paragraph`, `separator` |
| **Content**     | `table`, `list`, `code`, `mermaid`  |
| **Progressive** | `collapsible`, `link-out`           |

### Factory Pattern

Every codec provides two exports:

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

The codec system includes 20+ codecs organized by purpose: pattern-focused, timeline-focused, session-focused, planning, reference/composition, and other specialized codecs.

For the complete reference with options tables, factory patterns, and usage examples, see:
**[Available Codecs Reference](../docs-generated/docs/ARCHITECTURE-CODECS.md)** (auto-generated from source annotations)

---

## Progressive Disclosure

Progressive disclosure splits large documents into a main index plus detail files. This improves readability and enables focused navigation.

### How It Works

1. Main document contains summaries and navigation links
2. Detail files contain full information for each grouping
3. `link-out` blocks in main doc point to detail files
4. `additionalFiles` in RenderableDocument specifies detail paths

### Codec Split Logic

| Codec              | Split By               | Detail Path Pattern             |
| ------------------ | ---------------------- | ------------------------------- |
| `patterns`         | Category               | `patterns/<category>.md`        |
| `roadmap`          | Phase                  | `phases/phase-<N>-<name>.md`    |
| `milestones`       | Quarter                | `milestones/<quarter>.md`       |
| `current`          | Active Phase           | `current/phase-<N>-<name>.md`   |
| `requirements`     | Product Area           | `requirements/<area-slug>.md`   |
| `session`          | Incomplete Phase       | `sessions/phase-<N>-<name>.md`  |
| `remaining`        | Incomplete Phase       | `remaining/phase-<N>-<name>.md` |
| `adrs`             | Category (≥ threshold) | `decisions/<category-slug>.md`  |
| `taxonomy`         | Tag Domain             | `taxonomy/<domain>.md`          |
| `validation-rules` | Rule Category          | `validation/<category>.md`      |
| `pr-changes`       | None                   | Single file only                |

### Disabling Progressive Disclosure

All codecs accept `generateDetailFiles: false` to produce compact single-file output:

```typescript
const codec = createPatternsCodec({ generateDetailFiles: false });
// Only produces PATTERNS.md, no patterns/*.md files
```

### Detail Level

The `detailLevel` option controls output verbosity:

| Value        | Behavior                              |
| ------------ | ------------------------------------- |
| `"summary"`  | Minimal output, key metrics only      |
| `"standard"` | Default with all sections             |
| `"detailed"` | Maximum detail, all optional sections |

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

## Programmatic Usage

### Direct Codec Usage

```typescript
import { createPatternsCodec, type MasterDataset } from '@libar-dev/delivery-process';
import { renderToMarkdown } from '@libar-dev/delivery-process/renderable';

// Create custom codec
const codec = createPatternsCodec({
  filterCategories: ['core'],
  generateDetailFiles: false,
});

// Transform dataset
const document = codec.decode(masterDataset);

// Render to markdown
const markdown = renderToMarkdown(document);
```

### Using generateDocument

```typescript
import { generateDocument, type DocumentType } from '@libar-dev/delivery-process/renderable';

// Generate with default options
const files = generateDocument('patterns', masterDataset);

// files is OutputFile[]
for (const file of files) {
  console.log(`${file.path}: ${file.content.length} bytes`);
}
```

### Accessing Additional Files

The RenderableDocument includes detail files in `additionalFiles`:

```typescript
const document = PatternsDocumentCodec.decode(dataset);

// Main content
console.log(document.title); // "Pattern Registry"
console.log(document.sections.length);

// Detail files (for progressive disclosure)
if (document.additionalFiles) {
  for (const [path, subDoc] of Object.entries(document.additionalFiles)) {
    console.log(`Detail file: ${path}`);
    console.log(`  Title: ${subDoc.title}`);
  }
}
```

---

## Extending the System

### Creating a Custom Codec

```typescript
import { z } from 'zod';
import { MasterDatasetSchema, type MasterDataset } from '../validation-schemas/master-dataset';
import { type RenderableDocument, document, heading, paragraph } from '../renderable/schema';
import { RenderableDocumentOutputSchema } from '../renderable/codecs/shared-schema';

// Define options
interface MyCodecOptions {
  includeCustomSection?: boolean;
}

// Create factory
export function createMyCodec(options?: MyCodecOptions) {
  const opts = { includeCustomSection: true, ...options };

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      const sections = [
        heading(2, 'Summary'),
        paragraph(`Total patterns: ${dataset.counts.total}`),
      ];

      if (opts.includeCustomSection) {
        sections.push(heading(2, 'Custom Section'));
        sections.push(paragraph('Custom content here'));
      }

      return document('My Custom Document', sections, {
        purpose: 'Custom document purpose',
      });
    },
    encode: () => {
      throw new Error('MyCodec is decode-only');
    },
  });
}
```

### Registering a Custom Generator

```typescript
import { generatorRegistry } from '@libar-dev/delivery-process/generators';
import { createCodecGenerator } from '@libar-dev/delivery-process/generators/codec-based';

// Register if using existing document type
generatorRegistry.register(createCodecGenerator('my-patterns', 'patterns'));

// Or create custom generator class for new codec
class MyCustomGenerator implements DocumentGenerator {
  readonly name = 'my-custom';
  readonly description = 'My custom generator';

  generate(patterns, context) {
    const codec = createMyCodec();
    const doc = codec.decode(context.masterDataset);
    const files = renderDocumentWithFiles(doc, 'MY-CUSTOM.md');
    return Promise.resolve({ files });
  }
}

generatorRegistry.register(new MyCustomGenerator());
```

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
