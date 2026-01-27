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

| Principle                      | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| **Single Source of Truth**     | Code + .feature files are authoritative; docs are generated projections |
| **Single-Pass Transformation** | All derived views computed in O(n) time, not redundant O(n) per section |
| **Codec-Based Rendering**      | Zod 4 codecs transform MasterDataset → RenderableDocument → Markdown    |
| **Schema-First Validation**    | Zod schemas define types; runtime validation at all boundaries          |
| **Result Monad**               | Explicit error handling via `Result<T, E>` instead of exceptions        |

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
  │   CONFIG    │  createDeliveryProcess() → registry + regexBuilders
  └─────────────┘
```

---

## Configuration Architecture

The package supports configurable tag prefixes via the Configuration API.

### Entry Point

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

const dp = createDeliveryProcess({ preset: 'generic' });
// Returns: { registry: TagRegistry, regexBuilders: RegexBuilders }
```

### How Configuration Affects the Pipeline

| Stage           | Configuration Input              | Effect                                      |
| --------------- | -------------------------------- | ------------------------------------------- |
| **Scanner**     | `regexBuilders.hasFileOptIn()`   | Detects files with configured opt-in marker |
| **Scanner**     | `regexBuilders.directivePattern` | Matches tags with configured prefix         |
| **Extractor**   | `registry.categories`            | Maps tags to category names                 |
| **Transformer** | `registry`                       | Builds MasterDataset with category indexes  |

### Configuration Resolution

```
createDeliveryProcess(options)
         │
         ▼
┌────────────────────────────────────┐
│ 1. Select preset (or use default)  │
│    - generic: @docs-               │
│    - ddd-es-cqrs: @libar-docs-     │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ 2. Apply explicit overrides        │
│    - tagPrefix                     │
│    - fileOptInTag                  │
│    - categories                    │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ 3. Build registry                  │
│    buildRegistry(categories)       │
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ 4. Create RegexBuilders            │
│    createRegexBuilders(prefix, tag)│
└────────────────────────────────────┘
         │
         ▼
    { registry, regexBuilders }
```

### Key Files

| File                           | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `src/config/factory.ts`        | `createDeliveryProcess()` factory              |
| `src/config/presets.ts`        | GENERIC_PRESET, DDD_ES_CQRS_PRESET             |
| `src/config/types.ts`          | DeliveryProcessConfig, DeliveryProcessInstance |
| `src/config/regex-builders.ts` | RegexBuilders factory                          |

> **See:** [CONFIGURATION.md](./CONFIGURATION.md) for usage examples and API reference.

---

## Four-Stage Pipeline

The orchestrator (`src/generators/orchestrator.ts`) coordinates four stages:

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

**Key File:** `src/extractor/doc-extractor.ts:extractPatterns()`

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

After extraction, patterns from both sources are merged with conflict detection (`orchestrator.ts:534-560`). If the same pattern name exists in both TypeScript and Gherkin, an error is returned.

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
- `src/renderable/renderer.ts` - Markdown renderer

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

  // ─── Relationship Index ─────────────────────────────────────────────────
  relationshipIndex: Record<
    string,
    {
      uses: string[];
      usedBy: string[];
      dependsOn: string[];
      enables: string[];
    }
  >;
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
MasterDataset → Codec.decode() → RenderableDocument → Renderer → Markdown Files
```

| Component              | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| **MasterDataset**      | Aggregated view of all extracted patterns with indexes by category, phase, status |
| **Codec**              | Zod 4 codec that transforms MasterDataset into RenderableDocument                 |
| **RenderableDocument** | Universal intermediate format with typed section blocks                           |
| **Renderer**           | Domain-agnostic markdown renderer (the "dumb printer")                            |

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

> **Note:** Codec options shown below are illustrative. For complete and current options,
> see the source files in `src/renderable/codecs/` and `src/generators/types.ts`.

### Pattern-Focused Codecs

#### PatternsDocumentCodec

**Purpose:** Pattern registry with category-based organization.

**Output Files:**

- `PATTERNS.md` - Main index with progress summary, navigation, and pattern table
- `patterns/<category>.md` - Detail files per category (when progressive disclosure enabled)

**Options (PatternsCodecOptions):**

| Option                     | Type                                    | Default      | Description                                 |
| -------------------------- | --------------------------------------- | ------------ | ------------------------------------------- |
| `generateDetailFiles`      | boolean                                 | `true`       | Create category detail files                |
| `detailLevel`              | `"summary" \| "standard" \| "detailed"` | `"standard"` | Output verbosity                            |
| `includeDependencyGraph`   | boolean                                 | `true`       | Render Mermaid dependency graph             |
| `includeUseCases`          | boolean                                 | `true`       | Show use cases section                      |
| `filterCategories`         | string[]                                | `[]`         | Filter to specific categories (empty = all) |
| `limits.recentItems`       | number                                  | `10`         | Max recent items in summaries               |
| `limits.collapseThreshold` | number                                  | `5`          | Items before collapsing                     |

#### RequirementsDocumentCodec

**Purpose:** Product requirements documentation grouped by product area or user role.

**Output Files:**

- `PRODUCT-REQUIREMENTS.md` - Main requirements index
- `requirements/<area-slug>.md` - Detail files per product area

**Options (RequirementsCodecOptions):**

| Option                 | Type                                       | Default          | Description                      |
| ---------------------- | ------------------------------------------ | ---------------- | -------------------------------- |
| `generateDetailFiles`  | boolean                                    | `true`           | Create product area detail files |
| `groupBy`              | `"product-area" \| "user-role" \| "phase"` | `"product-area"` | Primary grouping                 |
| `filterStatus`         | `NormalizedStatusFilter[]`                 | `[]`             | Filter by status (empty = all)   |
| `includeScenarioSteps` | boolean                                    | `true`           | Show Given/When/Then steps       |
| `includeBusinessValue` | boolean                                    | `true`           | Display business value metadata  |
| `includeBusinessRules` | boolean                                    | `true`           | Show Gherkin Rule: sections      |

---

### Timeline-Focused Codecs

#### RoadmapDocumentCodec

**Purpose:** Development roadmap organized by phase with progress tracking.

**Output Files:**

- `ROADMAP.md` - Main roadmap with phase navigation and quarterly timeline
- `phases/phase-<N>-<name>.md` - Detail files per phase

**Options (RoadmapCodecOptions):**

| Option                | Type                       | Default | Description                         |
| --------------------- | -------------------------- | ------- | ----------------------------------- |
| `generateDetailFiles` | boolean                    | `true`  | Create phase detail files           |
| `filterStatus`        | `NormalizedStatusFilter[]` | `[]`    | Filter by status                    |
| `includeProcess`      | boolean                    | `true`  | Show quarter, effort, team metadata |
| `includeDeliverables` | boolean                    | `true`  | List deliverables per phase         |
| `filterPhases`        | number[]                   | `[]`    | Filter to specific phases           |

#### CompletedMilestonesCodec

**Purpose:** Historical record of completed work organized by quarter.

**Output Files:**

- `COMPLETED-MILESTONES.md` - Summary with completed phases and recent completions
- `milestones/<quarter>.md` - Detail files per quarter (e.g., `Q1-2026.md`)

#### CurrentWorkCodec

**Purpose:** Active development work currently in progress.

**Output Files:**

- `CURRENT-WORK.md` - Summary of active phases and patterns
- `current/phase-<N>-<name>.md` - Detail files for active phases

#### ChangelogCodec

**Purpose:** Keep a Changelog format changelog grouped by release version.

**Output Files:**

- `CHANGELOG.md` - Changelog with `[vNEXT]`, `[v0.1.0]` sections

**Options (ChangelogCodecOptions):**

| Option              | Type                     | Default | Description                       |
| ------------------- | ------------------------ | ------- | --------------------------------- |
| `includeUnreleased` | boolean                  | `true`  | Include unreleased section        |
| `includeLinks`      | boolean                  | `true`  | Include links                     |
| `categoryMapping`   | `Record<string, string>` | `{}`    | Map categories to changelog types |

---

### Session-Focused Codecs

#### SessionContextCodec

**Purpose:** Current session context for AI agents and developers.

**Output Files:**

- `SESSION-CONTEXT.md` - Session status, active work, current phase focus
- `sessions/phase-<N>-<name>.md` - Detail files for incomplete phases

#### RemainingWorkCodec

**Purpose:** Aggregate view of all incomplete work across phases.

**Output Files:**

- `REMAINING-WORK.md` - Summary by phase, priority breakdown, next actionable
- `remaining/phase-<N>-<name>.md` - Detail files per incomplete phase

**Options (RemainingWorkCodecOptions):**

| Option                  | Type                                             | Default   | Description                   |
| ----------------------- | ------------------------------------------------ | --------- | ----------------------------- |
| `includeIncomplete`     | boolean                                          | `true`    | Include planned items         |
| `includeBlocked`        | boolean                                          | `true`    | Show blocked items analysis   |
| `includeNextActionable` | boolean                                          | `true`    | Next actionable items section |
| `maxNextActionable`     | number                                           | `5`       | Max items in next actionable  |
| `sortBy`                | `"phase" \| "priority" \| "effort" \| "quarter"` | `"phase"` | Sort order                    |
| `groupPlannedBy`        | `"quarter" \| "priority" \| "level" \| "none"`   | `"none"`  | Group planned items           |

---

### Planning Codecs

#### PlanningChecklistCodec

**Purpose:** Pre-planning questions and Definition of Done validation.

**Output Files:** `PLANNING-CHECKLIST.md`

#### SessionPlanCodec

**Purpose:** Implementation plans for coding sessions.

**Output Files:** `SESSION-PLAN.md`

#### SessionFindingsCodec

**Purpose:** Retrospective discoveries for roadmap refinement.

**Output Files:** `SESSION-FINDINGS.md`

**Finding Sources:**

- `pattern.discoveredGaps` - Gap findings
- `pattern.discoveredImprovements` - Improvement suggestions
- `pattern.discoveredRisks` / `pattern.risk` - Risk findings
- `pattern.discoveredLearnings` - Learned insights

---

### Other Codecs

#### AdrDocumentCodec

**Purpose:** Architecture Decision Records extracted from patterns with @libar-docs-adr tags.

**Output Files:**

- `DECISIONS.md` - ADR index with summary and grouping
- `decisions/<category-slug>.md` - Detail files per category

#### PrChangesCodec

**Purpose:** PR-scoped view filtered by changed files or release version.

**Output Files:** `working/PR-CHANGES.md`

#### TraceabilityCodec

**Purpose:** Timeline to behavior file coverage report.

**Output Files:** `TRACEABILITY.md`

#### OverviewCodec

**Purpose:** Project architecture and status overview.

**Output Files:** `OVERVIEW.md`

---

## Progressive Disclosure

Progressive disclosure splits large documents into a main index plus detail files. This improves readability and enables focused navigation.

### How It Works

1. Main document contains summaries and navigation links
2. Detail files contain full information for each grouping
3. `link-out` blocks in main doc point to detail files
4. `additionalFiles` in RenderableDocument specifies detail paths

### Codec Split Logic

| Codec          | Split By               | Detail Path Pattern             |
| -------------- | ---------------------- | ------------------------------- |
| `patterns`     | Category               | `patterns/<category>.md`        |
| `roadmap`      | Phase                  | `phases/phase-<N>-<name>.md`    |
| `milestones`   | Quarter                | `milestones/<quarter>.md`       |
| `current`      | Active Phase           | `current/phase-<N>-<name>.md`   |
| `requirements` | Product Area           | `requirements/<area-slug>.md`   |
| `session`      | Incomplete Phase       | `sessions/phase-<N>-<name>.md`  |
| `remaining`    | Incomplete Phase       | `remaining/phase-<N>-<name>.md` |
| `adrs`         | Category (≥ threshold) | `decisions/<category-slug>.md`  |
| `pr-changes`   | None                   | Single file only                |

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

### TypeScript Scanner

**Key Files:**

- `src/scanner/pattern-scanner.ts` - File discovery and opt-in detection
- `src/scanner/ast-parser.ts` - TypeScript AST parsing

> **Note:** The scanner uses `RegexBuilders` from configuration to detect tags.
> The examples below use `@libar-docs-*` (DDD_ES_CQRS_PRESET). For other prefixes, substitute accordingly.

**Annotation Format:**

```typescript
/**
 * @libar-docs                              // Required opt-in (file level)
 * @libar-docs-core @libar-docs-infra       // Category tags
 * @libar-docs-pattern MyPatternName        // Pattern name
 * @libar-docs-status completed             // Status: roadmap|active|completed|deferred
 * @libar-docs-phase 14                     // Roadmap phase number
 * @libar-docs-uses OtherPattern, Another   // Dependencies (CSV)
 * @libar-docs-usecase "When doing X"       // Use cases (repeatable)
 *
 * ## Pattern Description                   // Markdown description
 *
 * Detailed description of the pattern...
 */
```

**Tag Registry:** Defines categories, priorities, and metadata formats. Source: `src/taxonomy/` TypeScript modules.

### Gherkin Scanner

**Key Files:**

- `src/scanner/gherkin-scanner.ts` - Feature file discovery
- `src/scanner/gherkin-ast-parser.ts` - Cucumber Gherkin parsing

**Annotation Format:**

```gherkin
@libar-docs-pattern:MyPattern @libar-docs-phase:15 @libar-docs-status:roadmap
@libar-docs-quarter:Q1-2025 @libar-docs-effort:2w @libar-docs-team:platform
@libar-docs-depends-on:OtherPattern @libar-docs-enables:NextPattern
@libar-docs-product-area:Generators @libar-docs-user-role:Developer
@libar-docs-release:v0.1.0
Feature: My Pattern Implementation

  Background:
    Given the following deliverables:
      | Deliverable          | Status    |
      | Core implementation  | completed |
      | Tests                | active    |

  @acceptance-criteria
  Scenario: Basic usage
    When user does X
    Then Y happens
```

**Tag Mapping:**

| Gherkin Tag                    | ExtractedPattern Field |
| ------------------------------ | ---------------------- |
| `@libar-docs-pattern:Name`     | `patternName`          |
| `@libar-docs-phase:N`          | `phase`                |
| `@libar-docs-status:*`         | `status`               |
| `@libar-docs-quarter:*`        | `quarter`              |
| `@libar-docs-release:*`        | `release`              |
| `@libar-docs-depends-on:*`     | `dependsOn`            |
| `@libar-docs-product-area:*`   | `productArea`          |
| `@libar-docs-discovered-gap:*` | `discoveredGaps`       |

### Status Normalization

All codecs normalize status to three canonical values:

| Input Status                            | Normalized To |
| --------------------------------------- | ------------- |
| `"completed"`                           | `"completed"` |
| `"active"`                              | `"active"`    |
| `"roadmap"`, `"deferred"`, or undefined | `"planned"`   |

---

## Key Design Patterns

### Result Monad

All operations return `Result<T, E>` for explicit error handling:

```typescript
// types/result.ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Usage
const result = await scanPatterns(options);
if (result.ok) {
  const { files } = result.value;
} else {
  console.error(result.error); // Explicit error handling
}
```

**Benefits:**

- No exception swallowing
- Partial success scenarios supported
- Type-safe error handling at boundaries

### Schema-First Validation

Types are defined as Zod schemas first, TypeScript types inferred:

```typescript
// src/validation-schemas/extracted-pattern.ts
export const ExtractedPatternSchema = z
  .object({
    id: PatternIdSchema,
    name: z.string().min(1),
    category: CategoryNameSchema,
    status: PatternStatusSchema.optional(),
    phase: z.number().int().positive().optional(),
    // ... 30+ fields
  })
  .strict();

export type ExtractedPattern = z.infer<typeof ExtractedPatternSchema>;
```

**Benefits:**

- Runtime validation at all boundaries
- Type inference from schemas (single source of truth)
- Codec support for transformations

### Tag Registry

Data-driven configuration for pattern categorization:

```json
// Generated from TypeScript taxonomy (src/taxonomy/)
{
  "categories": [
    { "tag": "core", "domain": "Core", "priority": 1, "description": "Core patterns" },
    { "tag": "scanner", "domain": "Scanner", "priority": 10, "aliases": ["scan"] },
    { "tag": "generator", "domain": "Generator", "priority": 20, "aliases": ["gen"] }
  ],
  "metadataTags": [
    { "tag": "status", "format": "enum", "values": ["roadmap", "active", "completed", "deferred"] },
    { "tag": "phase", "format": "number" },
    { "tag": "release", "format": "value" },
    { "tag": "usecase", "format": "quoted-value", "repeatable": true }
  ]
}
```

**Category Inference Algorithm:**

1. Extract tag parts (e.g., `@libar-docs-core-utils` → `["core", "utils"]`)
2. Find matching categories in registry (with aliases)
3. Select highest priority (lowest number)
4. Fallback to "uncategorized"

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

### Planning a PR

Use planning codecs to prepare for implementation:

```typescript
import { createSessionPlanCodec, createPlanningChecklistCodec } from '@libar-dev/delivery-process';

// Generate planning documents
const planCodec = createSessionPlanCodec({
  statusFilter: ['planned'],
  includeAcceptanceCriteria: true,
});

const checklistCodec = createPlanningChecklistCodec({
  forActivePhases: false,
  forNextActionable: true,
});
```

**Output documents:**

- `SESSION-PLAN.md` - What to implement
- `PLANNING-CHECKLIST.md` - Pre-flight verification

### Implementing a PR

Use session context and PR changes for active development:

```typescript
import { createSessionContextCodec, createPrChangesCodec } from '@libar-dev/delivery-process';

// Current session context
const sessionCodec = createSessionContextCodec({
  includeAcceptanceCriteria: true,
  includeDependencies: true,
});

// PR-scoped changes
const prCodec = createPrChangesCodec({
  changedFiles: getChangedFiles(), // from git
  includeReviewChecklist: true,
});
```

**Output documents:**

- `SESSION-CONTEXT.md` - Current focus and blocked items
- `working/PR-CHANGES.md` - PR review context

### Release Preparation

Use milestone and changelog codecs for release documentation:

```typescript
import { createMilestonesCodec, createChangelogCodec } from '@libar-dev/delivery-process';

// Quarter-filtered milestones
const milestonesCodec = createMilestonesCodec({
  filterQuarters: ['Q1-2026'],
});

// Changelog with release tagging
const changelogCodec = createChangelogCodec({
  includeUnreleased: false,
});
```

**Output documents:**

- `COMPLETED-MILESTONES.md` - What shipped
- `CHANGELOG.md` - Release notes

### Session Context Generation

For AI agents or session handoffs:

```typescript
import {
  createSessionContextCodec,
  createRemainingWorkCodec,
  createCurrentWorkCodec,
} from '@libar-dev/delivery-process';

// Full session context bundle
const sessionCodec = createSessionContextCodec({
  includeHandoffContext: true,
  includeRelatedPatterns: true,
});

const remainingCodec = createRemainingWorkCodec({
  includeNextActionable: true,
  maxNextActionable: 10,
  groupPlannedBy: 'priority',
});

const currentCodec = createCurrentWorkCodec({
  includeDeliverables: true,
  includeProcess: true,
});
```

**Output documents:**

- `SESSION-CONTEXT.md` - Where we are
- `REMAINING-WORK.md` - What's left
- `CURRENT-WORK.md` - What's in progress

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

### Codec to Generator Mapping

| Codec                       | Generator Name       | CLI Flag                |
| --------------------------- | -------------------- | ----------------------- |
| `PatternsDocumentCodec`     | `patterns`           | `-g patterns`           |
| `RoadmapDocumentCodec`      | `roadmap`            | `-g roadmap`            |
| `CompletedMilestonesCodec`  | `milestones`         | `-g milestones`         |
| `CurrentWorkCodec`          | `current`            | `-g current`            |
| `RequirementsDocumentCodec` | `requirements`       | `-g requirements`       |
| `SessionContextCodec`       | `session`            | `-g session`            |
| `RemainingWorkCodec`        | `remaining`          | `-g remaining`          |
| `PrChangesCodec`            | `pr-changes`         | `-g pr-changes`         |
| `AdrDocumentCodec`          | `adrs`               | `-g adrs`               |
| `PlanningChecklistCodec`    | `planning-checklist` | `-g planning-checklist` |
| `SessionPlanCodec`          | `session-plan`       | `-g session-plan`       |
| `SessionFindingsCodec`      | `session-findings`   | `-g session-findings`   |
| `ChangelogCodec`            | `changelog`          | `-g changelog`          |
| `TraceabilityCodec`         | `traceability`       | `-g traceability`       |
| `OverviewCodec`             | `overview-rdm`       | `-g overview-rdm`       |

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
- [INSTRUCTIONS.md](../INSTRUCTIONS.md) - Tag reference and CLI details
- [src/taxonomy/](../src/taxonomy/) - TypeScript taxonomy source (categories, status values, priorities)

---

## Code References

| Component                | File                                           | Purpose                     |
| ------------------------ | ---------------------------------------------- | --------------------------- |
| MasterDataset Schema     | `src/validation-schemas/master-dataset.ts`     | Central data structure      |
| transformToMasterDataset | `src/generators/pipeline/transform-dataset.ts` | Single-pass transformation  |
| Document Codecs          | `src/renderable/codecs/*.ts`                   | Zod 4 codec implementations |
| Markdown Renderer        | `src/renderable/renderer.ts`                   | Block → Markdown            |
| Orchestrator             | `src/generators/orchestrator.ts`               | Pipeline coordination       |
| TypeScript Scanner       | `src/scanner/pattern-scanner.ts`               | TS AST parsing              |
| Gherkin Scanner          | `src/scanner/gherkin-scanner.ts`               | Feature file parsing        |
