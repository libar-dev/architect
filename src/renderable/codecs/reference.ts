/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 * @libar-docs-convention codec-registry
 * @libar-docs-product-area:Generation
 *
 * ## ReferenceDocumentCodec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @libar-docs-convention.
 *
 * **Purpose:** Scoped reference documentation assembling four content layers (conventions, diagrams, shapes, behaviors) into a single document.
 *
 * **Output Files:** Configured per-instance (e.g., `docs/REFERENCE-SAMPLE.md`, `_claude-md/architecture/reference-sample.md`)
 *
 * ### 4-Layer Composition (in order)
 *
 * 1. **Convention content** -- Extracted from `@libar-docs-convention`-tagged patterns (rules, invariants, tables)
 * 2. **Scoped diagrams** -- Mermaid diagrams filtered by `archContext`, `archLayer`, `patterns`, or `include` tags
 * 3. **TypeScript shapes** -- API surfaces from `shapeSources` globs or `shapeSelectors` (declaration-level filtering)
 * 4. **Behavior content** -- Gherkin-sourced patterns from `behaviorCategories`
 *
 * ### Key Options (ReferenceDocConfig)
 *
 * | Option | Type | Description |
 * | --- | --- | --- |
 * | conventionTags | string[] | Convention tag values to extract from decision records |
 * | diagramScope | DiagramScope | Single diagram configuration |
 * | diagramScopes | DiagramScope[] | Multiple diagrams (takes precedence over diagramScope) |
 * | shapeSources | string[] | Glob patterns for TypeScript shape extraction |
 * | shapeSelectors | ShapeSelector[] | Fine-grained declaration-level shape filtering |
 * | behaviorCategories | string[] | Category tags for behavior pattern content |
 * | includeTags | string[] | Cross-cutting content routing via include tags |
 * | preamble | SectionBlock[] | Static editorial sections prepended before generated content |
 * | productArea | string | Pre-filter all content sources to matching product area |
 * | excludeSourcePaths | string[] | Exclude patterns by source path prefix |
 *
 * ### DiagramScope.diagramType Values
 *
 * | Type | Description |
 * | --- | --- |
 * | graph (default) | Flowchart with subgraphs by archContext, custom node shapes |
 * | sequenceDiagram | Sequence diagram with typed messages between participants |
 * | stateDiagram-v2 | State diagram with transitions from dependsOn relationships |
 * | C4Context | C4 context diagram with boundaries, systems, and relationships |
 * | classDiagram | Class diagram with archRole stereotypes and typed arrows |
 *
 * ### ShapeSelector Variants
 *
 * | Variant | Example | Behavior |
 * | --- | --- | --- |
 * | group only | `{ group: "api-types" }` | Match shapes by group tag |
 * | source + names | `{ source: "src/types.ts", names: ["Config"] }` | Named shapes from file |
 * | source only | `{ source: "src/path/*.ts" }` | All tagged shapes from glob |
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating scoped product area documents with live diagrams
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 * - When assembling multi-layer documents that combine conventions, diagrams, shapes, and behaviors
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  type HeadingBlock,
  heading,
  paragraph,
  separator,
  table,
  code,
  list,
  mermaid,
  collapsible,
  linkOut,
  document,
} from '../schema.js';
import {
  type BaseCodecOptions,
  type DetailLevel,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
} from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import {
  extractConventions,
  extractConventionsFromPatterns,
  type ConventionBundle,
} from './convention-extractor.js';
import { parseBusinessRuleAnnotations, truncateText } from './helpers.js';
import { extractShapesFromDataset, filterShapesBySelectors } from './shape-matcher.js';
import type { ShapeSelector } from './shape-matcher.js';
import {
  sanitizeNodeId,
  EDGE_STYLES,
  EDGE_LABELS,
  SEQUENCE_ARROWS,
  formatNodeDeclaration,
} from './diagram-utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import { VALID_TRANSITIONS } from '../../validation/fsm/transitions.js';
import { PROTECTION_LEVELS, type ProtectionLevel } from '../../validation/fsm/states.js';
import type { ProcessStatusValue } from '../../taxonomy/index.js';
import type { ExtractedPattern } from '../../validation-schemas/extracted-pattern.js';
import { camelCaseToTitleCase, slugify } from '../../utils/string-utils.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';

// ============================================================================
// Shared Constants
// ============================================================================

/** Content source identifiers for hardcoded domain diagrams */
export const DIAGRAM_SOURCE_VALUES = [
  'fsm-lifecycle',
  'generation-pipeline',
  'master-dataset-views',
] as const;

/** Discriminated source type for DiagramScope.source */
export type DiagramSource = (typeof DIAGRAM_SOURCE_VALUES)[number];

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Scoped diagram filter for dynamic mermaid generation from relationship metadata.
 *
 * Patterns matching the filter become diagram nodes. Immediate neighbors
 * (connected via relationship edges but not in scope) appear with a distinct style.
 */
export interface DiagramScope {
  /** Bounded contexts to include (matches pattern.archContext) */
  readonly archContext?: readonly string[];

  /** Explicit pattern names to include */
  readonly patterns?: readonly string[];

  /** Cross-cutting include tags (matches pattern.include entries) */
  readonly include?: readonly string[];

  /** Architectural layers to include (matches pattern.archLayer) */
  readonly archLayer?: readonly string[];

  /** Mermaid graph direction (default: 'TB') */
  readonly direction?: 'TB' | 'LR';

  /** Section heading for this diagram (default: 'Component Overview') */
  readonly title?: string;

  /** Mermaid diagram type (default: 'graph' for flowchart) */
  readonly diagramType?:
    | 'graph'
    | 'sequenceDiagram'
    | 'stateDiagram-v2'
    | 'C4Context'
    | 'classDiagram';

  /** Show relationship type labels on edges (default: true) */
  readonly showEdgeLabels?: boolean;

  /** Content source override. When set, uses hardcoded domain content
   * instead of computing from pattern relationships.
   * - 'fsm-lifecycle': FSM state transitions with protection levels
   * - 'generation-pipeline': 4-stage generation pipeline temporal flow
   * - 'master-dataset-views': MasterDataset pre-computed view fan-out
   */
  readonly source?: DiagramSource;
}

/**
 * Configuration for a reference document type.
 *
 * Each config object defines one reference document's composition.
 * Convention tags, shape sources, and behavior tags control content assembly.
 */
export interface ReferenceDocConfig {
  /** Document title (e.g., "Process Guard Reference") */
  readonly title: string;

  /** Convention tag values to extract from decision records */
  readonly conventionTags: readonly string[];

  /**
   * Glob patterns for TypeScript shape extraction sources.
   * Resolved via in-memory matching against pattern.source.file (AD-6).
   */
  readonly shapeSources: readonly string[];

  /** Categories to filter behavior patterns from MasterDataset */
  readonly behaviorCategories: readonly string[];

  /** Optional scoped diagram generation from relationship metadata */
  readonly diagramScope?: DiagramScope;

  /** Multiple scoped diagrams. Takes precedence over diagramScope. */
  readonly diagramScopes?: readonly DiagramScope[];

  /** Target _claude-md/ directory for summary output */
  readonly claudeMdSection: string;

  /** Output filename for detailed docs (in docs/) */
  readonly docsFilename: string;

  /** Output filename for summary _claude-md module */
  readonly claudeMdFilename: string;

  /** DD-3/DD-6: Fine-grained shape selectors for declaration-level filtering */
  readonly shapeSelectors?: readonly ShapeSelector[];

  /** DD-1 (CrossCuttingDocumentInclusion): Include-tag values for cross-cutting content routing */
  readonly includeTags?: readonly string[];

  /**
   * Product area filter (ADR-001 canonical values).
   * When set, pre-filters all content sources to patterns with matching productArea.
   * Auto-generates diagram scopes from productArea→archContext mapping if no
   * explicit diagramScopes are provided.
   */
  readonly productArea?: string;

  /**
   * Exclude patterns whose source.file starts with any of these prefixes.
   * Used to filter ephemeral planning specs from behavior sections.
   * @example ['delivery-process/specs/']
   */
  readonly excludeSourcePaths?: readonly string[];

  /**
   * Static preamble sections prepended before all generated content.
   * Use for editorial intro prose that cannot be expressed as annotations.
   * Appears in both detailed and summary outputs.
   */
  readonly preamble?: readonly SectionBlock[];

  /** When true, shapes section renders before conventions (default: false) */
  readonly shapesFirst?: boolean;
}

// ============================================================================
// Product Area → archContext Mapping (ADR-001)
// ============================================================================

/**
 * Maps canonical product area values to their associated archContext values.
 * Product areas are Gherkin-side tags; archContexts are TypeScript-side tags.
 * This mapping bridges the two tagging domains for diagram scoping.
 */
export const PRODUCT_AREA_ARCH_CONTEXT_MAP: Readonly<Record<string, readonly string[]>> = {
  Annotation: ['scanner', 'extractor', 'taxonomy'],
  Configuration: ['config'],
  Generation: ['generator', 'renderer'],
  Validation: ['validation', 'lint'],
  DataAPI: ['api', 'cli'],
  CoreTypes: [],
  Process: [],
};

/**
 * Product area metadata for intro sections and index generation.
 *
 * Each area has a reader-facing question (from ADR-001), a coverage summary,
 * an intro paragraph synthesized from executable specs, key invariants
 * curated from business rules, and the most important patterns in the area.
 */
export interface ProductAreaMeta {
  /** Reader-facing question (from ADR-001 canonical values) */
  readonly question: string;
  /** Comma-separated coverage summary */
  readonly covers: string;
  /** 2-4 sentence intro explaining what this area does and why it matters */
  readonly intro: string;
  /** Live diagram scopes generated from annotation data (overrides auto-generated diagram) */
  readonly diagramScopes?: readonly DiagramScope[];
  /** Key invariants to surface prominently (curated from executable specs) */
  readonly keyInvariants: readonly string[];
  /** Key patterns in this area */
  readonly keyPatterns: readonly string[];
}

/**
 * ADR-001 canonical product area metadata for intro sections.
 */
export const PRODUCT_AREA_META: Readonly<Record<string, ProductAreaMeta>> = {
  Annotation: {
    question: 'How do I annotate code?',
    covers: 'Scanning, extraction, tag parsing, dual-source',
    intro:
      'The annotation system is the ingestion boundary — it transforms annotated TypeScript ' +
      'and Gherkin files into `ExtractedPattern[]` objects that feed the entire downstream ' +
      'pipeline. Two parallel scanning paths (TypeScript AST + Gherkin parser) converge ' +
      'through dual-source merging. The system is fully data-driven: the `TagRegistry` ' +
      'defines all tags, formats, and categories — adding a new annotation requires only ' +
      'a registry entry, zero parser changes.',
    diagramScopes: [
      {
        archContext: ['scanner', 'extractor'],
        diagramType: 'C4Context',
        title: 'Scanning & Extraction Boundary',
      },
      {
        archContext: ['scanner', 'extractor'],
        direction: 'LR',
        title: 'Annotation Pipeline',
      },
    ],
    keyInvariants: [
      'Source ownership enforced: `uses`/`used-by`/`category` belong in TypeScript only; `depends-on`/`quarter`/`team`/`phase` belong in Gherkin only. Anti-pattern detector validates at lint time',
      'Data-driven tag dispatch: Both AST parser and Gherkin parser use `TagRegistry.metadataTags` to determine extraction. 6 format types (`value`/`enum`/`csv`/`number`/`flag`/`quoted-value`) cover all tag shapes — zero parser changes for new tags',
      'Pipeline data preservation: Gherkin `Rule:` blocks, deliverables, scenarios, and all metadata flow through scanner → extractor → `ExtractedPattern` → generators without data loss',
      'Dual-source merge with conflict detection: Same pattern name in both TypeScript and Gherkin produces a merge conflict error. Phase mismatches between sources produce validation errors',
    ],
    keyPatterns: [
      'PatternRelationshipModel',
      'ShapeExtraction',
      'DualSourceExtraction',
      'GherkinRulesSupport',
      'DeclarationLevelShapeTagging',
      'CrossSourceValidation',
      'ExtractionPipelineEnhancementsTesting',
    ],
  },
  Configuration: {
    question: 'How do I configure the tool?',
    covers: 'Config loading, presets, resolution, source merging, schema validation',
    intro:
      'Configuration is the entry boundary — it transforms a user-authored ' +
      '`delivery-process.config.ts` file into a fully resolved `DeliveryProcessInstance` ' +
      'that powers the entire pipeline. The flow is: `defineConfig()` provides type-safe ' +
      'authoring (Vite convention, zero validation), `ConfigLoader` discovers and loads ' +
      'the file, `ProjectConfigSchema` validates via Zod, `ConfigResolver` applies defaults ' +
      'and merges stubs into sources, and `DeliveryProcessFactory` builds the final instance ' +
      'with `TagRegistry` and `RegexBuilders`. Three presets define escalating taxonomy ' +
      'complexity — from 3 categories (`generic`, `libar-generic`) to 21 (`ddd-es-cqrs`). ' +
      '`SourceMerger` computes per-generator source overrides, enabling generators like ' +
      'changelog to pull from different feature sets than the base config.',
    diagramScopes: [
      {
        archContext: ['config'],
        diagramType: 'C4Context',
        title: 'Configuration Loading Boundary',
      },
      {
        archContext: ['config'],
        direction: 'LR',
        title: 'Configuration Resolution Pipeline',
      },
    ],
    keyInvariants: [
      'Preset-based taxonomy: `generic` (3 categories, `@docs-`), `libar-generic` (3 categories, `@libar-docs-`), `ddd-es-cqrs` (21 categories, full DDD). Presets replace base categories entirely — they define prefix, categories, and metadata tags as a unit',
      'Resolution pipeline: defineConfig() → ConfigLoader → ProjectConfigSchema (Zod) → ConfigResolver → DeliveryProcessFactory → DeliveryProcessInstance. Each stage has a single responsibility',
      'Stubs merged at resolution time: Stub directory globs are appended to typescript sources, making stubs transparent to the downstream pipeline',
      'Source override composition: SourceMerger applies per-generator overrides (`replaceFeatures`, `additionalFeatures`, `additionalInput`) to base sources. Exclude is always inherited from base',
    ],
    keyPatterns: [
      'DeliveryProcessFactory',
      'ConfigLoader',
      'ConfigResolver',
      'DefineConfig',
      'ConfigurationPresets',
      'SourceMerger',
    ],
  },
  Generation: {
    question: 'How does code become docs?',
    covers:
      'Codecs, generators, orchestrator, rendering, diagrams, progressive disclosure, product areas, RenderableDocument IR',
    intro:
      'The generation pipeline transforms annotated source code into markdown documents ' +
      'through a four-stage architecture. ' +
      '**Stage 1 — Scanner** (`src/scanner/`): Discovers TypeScript and Gherkin files, ' +
      'parses AST structure, and detects opt-in via `@libar-docs` markers. ' +
      '**Stage 2 — Extractor** (`src/extractor/`): Extracts patterns from TypeScript JSDoc ' +
      'annotations and Gherkin tags, producing `ExtractedPattern` objects with metadata, ' +
      'relationships, shapes, rules, and deliverables. ' +
      '**Stage 3 — Transformer** (`src/generators/pipeline/`): Builds `MasterDataset` with ' +
      'pre-computed views (`byStatus`, `byCategory`, `byPhase`, `byProductArea`) for O(1) access. ' +
      'All consumers share a single `buildMasterDataset()` factory — no parallel pipelines (ADR-006). ' +
      '**Stage 4 — Codec** (`src/renderable/`): Pure functions that transform MasterDataset into ' +
      'RenderableDocument — an intermediate representation with 9 block types (heading, paragraph, ' +
      'table, list, code, mermaid, collapsible, linkOut, separator). The renderer converts IR to ' +
      'markdown syntax. ' +
      'The codec inventory includes: **ReferenceDocumentCodec** (4-layer composition: conventions, ' +
      'diagrams, shapes, behaviors), **PlanningCodec** (roadmap and remaining work), ' +
      '**SessionCodec** (current work and session findings), **ReportingCodec** (changelog), ' +
      '**TimelineCodec** (timeline and traceability), **RequirementsAdrCodec** (ADR generation), ' +
      '**BusinessRulesCodec** (Gherkin rule extraction), **TaxonomyCodec** (tag registry docs), ' +
      '**CompositeCodec** (composes multiple codecs into a single document). ' +
      'Every codec supports three detail levels — **detailed** (full reference with rationale, ' +
      'code examples, and verified-by lists), **standard** (narrative without rationale), and ' +
      '**summary** (compact tables for `_claude-md/` modules). ' +
      'The Orchestrator (`src/generators/orchestrator.ts`) runs registered generators in order. ' +
      'Each generator creates codec instances from configuration, decodes the shared MasterDataset, ' +
      'renders to markdown, and writes output files to `docs-live/` (reference docs) or ' +
      '`docs-live/_claude-md/` (AI-optimized compacts). ' +
      'Product area docs are a special case — they filter the entire MasterDataset to a single area, ' +
      'compose 5 sections (intro, conventions, diagrams, shapes, business rules), and generate both ' +
      'detailed and summary versions with a progressive disclosure index.',
    keyInvariants: [
      'Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output',
      'Single read model (ADR-006): All codecs consume MasterDataset. No codec reads raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship',
      'Progressive disclosure: Every document renders at three detail levels (detailed, standard, summary) from the same codec. Summary feeds `_claude-md/` modules; detailed feeds `docs-live/reference/`',
      'Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors',
      'RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer',
      'Composition order: Reference docs compose four content layers in fixed order. Product area docs compose five layers: intro, conventions, diagrams, shapes, business rules',
      'Shape extraction: TypeScript shapes (`interface`, `type`, `enum`, `function`, `const`) are extracted by declaration-level `@libar-docs-shape` tags. Shapes include source text, JSDoc, type parameters, and property documentation',
      'Generator registration: Generators self-register via `registerGenerator()`. The orchestrator runs them in registration order. Each generator owns its output files and codec configuration',
    ],
    keyPatterns: [
      'ADR005CodecBasedMarkdownRendering',
      'CodecDrivenReferenceGeneration',
      'CrossCuttingDocumentInclusion',
      'ArchitectureDiagramGeneration',
      'ScopedArchitecturalView',
      'CompositeCodec',
      'RenderableDocument',
      'ProductAreaOverview',
    ],
  },
  Validation: {
    question: 'How is the workflow enforced?',
    covers: 'FSM, DoD, anti-patterns, process guard, lint',
    intro:
      'Validation is the enforcement boundary — it ensures that every change to annotated source files ' +
      'respects the delivery lifecycle rules defined by the FSM, protection levels, and scope constraints. ' +
      'The system operates in three layers: the FSM validator checks status transitions against a 4-state ' +
      'directed graph, the Process Guard orchestrates commit-time validation using a Decider pattern ' +
      '(state derived from annotations, not stored separately), and the lint engine provides pluggable ' +
      'rule execution with pretty and JSON output. Anti-pattern detection enforces dual-source ownership ' +
      'boundaries — `@libar-docs-uses` belongs on TypeScript, `@libar-docs-depends-on` belongs on Gherkin — ' +
      'preventing cross-domain tag confusion that causes documentation drift. Definition of Done validation ' +
      'ensures completed patterns have all deliverables marked done and at least one acceptance-criteria scenario.',
    diagramScopes: [
      {
        archContext: ['validation', 'lint'],
        diagramType: 'C4Context',
        title: 'Validation & Lint Boundary',
      },
      {
        archContext: ['validation', 'lint'],
        direction: 'LR',
        title: 'Enforcement Pipeline',
      },
    ],
    keyInvariants: [
      'Protection levels: `roadmap`/`deferred` = none (fully editable), `active` = scope-locked (no new deliverables), `completed` = hard-locked (requires `@libar-docs-unlock-reason`)',
      'Valid FSM transitions: Only roadmap→active, roadmap→deferred, active→completed, active→roadmap, deferred→roadmap. Completed is terminal',
      'Decider pattern: All validation is (state, changes, options) → result. State is derived from annotations, not maintained separately',
      'Dual-source ownership: Anti-pattern detection enforces tag boundaries — `uses` on TypeScript (runtime deps), `depends-on`/`quarter`/`team` on Gherkin (planning metadata). Violations are flagged before they cause documentation drift',
    ],
    keyPatterns: [
      'ProcessGuardLinter',
      'PhaseStateMachineValidation',
      'DoDValidation',
      'StepLintVitestCucumber',
      'ProgressiveGovernance',
    ],
  },
  DataAPI: {
    question: 'How do I query process state?',
    covers: 'Process state API, stubs, context assembly, CLI',
    intro:
      'The Data API provides direct terminal access to delivery process state. ' +
      'It replaces reading generated markdown or launching explore agents — targeted queries ' +
      'use 5-10x less context. The `context` command assembles curated bundles tailored to ' +
      'session type (planning, design, implement).',
    keyInvariants: [
      'One-command context assembly: `context <pattern> --session <type>` returns metadata + file paths + dependency status + architecture position in ~1.5KB',
      'Session type tailoring: `planning` (~500B, brief + deps), `design` (~1.5KB, spec + stubs + deps), `implement` (deliverables + FSM + tests)',
      'Direct API queries replace doc reading: JSON output is 5-10x smaller than generated docs',
    ],
    keyPatterns: [
      'DataAPIContextAssembly',
      'ProcessStateAPICLI',
      'DataAPIDesignSessionSupport',
      'DataAPIRelationshipGraph',
      'DataAPIOutputShaping',
    ],
  },
  CoreTypes: {
    question: 'What foundational types exist?',
    covers: 'Result monad, error factories, branded types, string utils',
    intro:
      'CoreTypes provides the foundational type system used across all other areas. Three pillars ' +
      'enforce discipline at compile time: the Result monad replaces try/catch with explicit ' +
      'error handling — functions return `Result.ok(value)` or `Result.err(error)` instead of ' +
      'throwing. The DocError discriminated union provides structured error context with type, ' +
      'file, line, and reason fields, enabling exhaustive pattern matching in error handlers. ' +
      'Branded types create nominal typing from structural TypeScript — `PatternId`, ' +
      '`CategoryName`, and `SourceFilePath` are compile-time distinct despite all being strings. ' +
      'String utilities handle slugification and case conversion with acronym-aware title casing.',
    diagramScopes: [
      {
        include: ['core-types'],
        diagramType: 'C4Context',
        title: 'Core Type System',
      },
      {
        include: ['core-types'],
        direction: 'LR',
        title: 'Error Handling Flow',
      },
    ],
    keyInvariants: [
      'Result over try/catch: All functions return `Result<T, E>` instead of throwing. Compile-time verification that errors are handled. `isOk`/`isErr` type guards enable safe narrowing',
      'DocError discriminated union: 12 structured error types with `type` discriminator field. `isDocError` type guard for safe classification. Specialized union aliases (`ScanError`, `ExtractionError`) scope error handling per operation',
      'Branded nominal types: `Branded<T, Brand>` creates compile-time distinct types from structural TypeScript. Prevents mixing `PatternId` with `CategoryName` even though both are `string` at runtime',
      'String transformation consistency: `slugify` produces URL-safe identifiers, `camelCaseToTitleCase` preserves acronyms (e.g., "APIEndpoint" becomes "API Endpoint"), `toKebabCase` handles consecutive uppercase correctly',
    ],
    keyPatterns: [
      'ResultMonad',
      'ErrorHandlingUnification',
      'ErrorFactories',
      'StringUtils',
      'KebabCaseSlugs',
    ],
  },
  Process: {
    question: 'How does the session workflow work?',
    covers: 'Session lifecycle, handoffs, FSM alignment, governance decisions, conventions',
    intro:
      'Process defines the USDP-inspired session workflow that governs how work moves through ' +
      'the delivery lifecycle. Three session types (planning, design, implementation) have fixed ' +
      'input/output contracts: planning creates roadmap specs from pattern briefs, design produces ' +
      'code stubs and decision records, and implementation writes code against scope-locked specs. ' +
      'Git is the event store — documentation artifacts are projections of annotated source code, ' +
      'not hand-maintained files. The FSM enforces state transitions (roadmap → active → completed) ' +
      'with escalating protection levels, while handoff templates preserve context across LLM session ' +
      'boundaries. ADR-003 established that TypeScript source owns pattern identity; tier 1 specs ' +
      'are ephemeral planning documents that lose value after completion.',
    diagramScopes: [
      {
        source: 'fsm-lifecycle',
        title: 'Delivery Lifecycle FSM',
      },
      {
        include: ['process-workflow'],
        direction: 'LR',
        title: 'Process Pattern Relationships',
      },
    ],
    keyInvariants: [
      'TypeScript source owns pattern identity: `@libar-docs-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents',
      '7 canonical product-area values: Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process — reader-facing sections, not source modules',
      'Two distinct status domains: Pattern FSM status (4 values) vs. deliverable status (6 values). Never cross domains',
      'Session types define capabilities: planning creates specs, design creates stubs, implementation writes code. Each session type has a fixed input/output contract enforced by convention',
    ],
    keyPatterns: [
      'ADR001TaxonomyCanonicalValues',
      'ADR003SourceFirstPatternArchitecture',
      'MvpWorkflowImplementation',
      'SessionHandoffs',
    ],
  },
};

// ============================================================================
// Reference Codec Options
// ============================================================================

export interface ReferenceCodecOptions extends BaseCodecOptions {
  /** Override detail level (default: 'standard') */
  readonly detailLevel?: DetailLevel;
}

const DEFAULT_REFERENCE_OPTIONS: Required<ReferenceCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  detailLevel: 'standard',
};

// ============================================================================
// Codec Factory
// ============================================================================

/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from up to four sources:
 * 1. Convention content from convention-tagged decision records
 * 2. Scoped relationship diagram (if diagramScope configured)
 * 3. TypeScript shapes from patterns matching shapeSources globs
 * 4. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export function createReferenceCodec(
  config: ReferenceDocConfig,
  options?: ReferenceCodecOptions
): DocumentCodec {
  const opts = mergeOptions(DEFAULT_REFERENCE_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      const sections: SectionBlock[] = [];

      // Product area filtering: when set, pre-filter and auto-derive content sources
      // Preamble is applied inside decodeProductArea() — not here, to avoid dead code
      if (config.productArea !== undefined) {
        return decodeProductArea(dataset, config, opts);
      }

      // DD-1 (CrossCuttingDocumentInclusion): Pre-compute include set for additive merging
      const includeSet =
        config.includeTags !== undefined && config.includeTags.length > 0
          ? new Set(config.includeTags)
          : undefined;

      // 1. Convention content from tagged decision records
      const conventions = extractConventions(dataset, config.conventionTags);

      // DD-1: Merge include-tagged convention patterns (additive)
      if (includeSet !== undefined) {
        const existingNames = new Set(conventions.flatMap((b) => b.sourceDecisions));
        const includedConventionPatterns = dataset.patterns.filter(
          (p) =>
            !existingNames.has(p.name) &&
            p.include?.some((v) => includeSet.has(v)) === true &&
            p.convention !== undefined &&
            p.convention.length > 0
        );
        if (includedConventionPatterns.length > 0) {
          // Build bundles from included convention patterns
          const includedConventions = extractConventionsFromPatterns(includedConventionPatterns);
          conventions.push(...includedConventions);
        }
      }

      const conventionBlocks =
        conventions.length > 0 ? buildConventionSections(conventions, opts.detailLevel) : [];

      // 2. Scoped relationship diagrams (normalize singular to array)
      const diagramBlocks: SectionBlock[] = [];
      if (opts.detailLevel !== 'summary') {
        const scopes: readonly DiagramScope[] =
          config.diagramScopes ?? (config.diagramScope !== undefined ? [config.diagramScope] : []);

        for (const scope of scopes) {
          const diagramSections = buildScopedDiagram(dataset, scope);
          if (diagramSections.length > 0) {
            diagramBlocks.push(...diagramSections);
          }
        }
      }

      // 3. Shape extraction: combine shapeSources (coarse) + shapeSelectors (fine)
      const shapeBlocks: SectionBlock[] = [];
      {
        const allShapes =
          config.shapeSources.length > 0
            ? [...extractShapesFromDataset(dataset, config.shapeSources)]
            : ([] as ExtractedShape[]);
        const seenNames = new Set(allShapes.map((s) => s.name));

        // DD-3/DD-6: Fine-grained selector-based filtering
        if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
          const selectorShapes = filterShapesBySelectors(dataset, config.shapeSelectors);
          for (const shape of selectorShapes) {
            if (!seenNames.has(shape.name)) {
              seenNames.add(shape.name);
              allShapes.push(shape);
            }
          }
        }

        // DD-1: Merge include-tagged shapes (additive)
        if (includeSet !== undefined) {
          for (const pattern of dataset.patterns) {
            if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0)
              continue;
            for (const shape of pattern.extractedShapes) {
              if (
                !seenNames.has(shape.name) &&
                shape.includes?.some((v) => includeSet.has(v)) === true
              ) {
                seenNames.add(shape.name);
                allShapes.push(shape);
              }
            }
          }
        }

        if (allShapes.length > 0) {
          shapeBlocks.push(...buildShapeSections(allShapes, opts.detailLevel));
        }
      }

      // 4. Behavior content from tagged patterns
      const behaviorPatterns =
        config.behaviorCategories.length > 0
          ? dataset.patterns.filter((p) => config.behaviorCategories.includes(p.category))
          : [];

      // DD-1: Merge include-tagged behavior patterns (additive)
      if (includeSet !== undefined) {
        const existingNames = new Set(behaviorPatterns.map((p) => p.name));
        const includedBehaviors = dataset.patterns.filter(
          (p) =>
            !existingNames.has(p.name) &&
            p.include?.some((v) => includeSet.has(v)) === true &&
            (p.directive.description.length > 0 || (p.rules !== undefined && p.rules.length > 0))
        );
        behaviorPatterns.push(...includedBehaviors);
      }

      const behaviorBlocks =
        behaviorPatterns.length > 0
          ? buildBehaviorSectionsFromPatterns(behaviorPatterns, opts.detailLevel)
          : [];

      // DD-4 (GeneratedDocQuality): Assemble in configured order
      if (config.shapesFirst === true) {
        sections.push(...shapeBlocks, ...conventionBlocks, ...diagramBlocks, ...behaviorBlocks);
      } else {
        sections.push(...conventionBlocks, ...diagramBlocks, ...shapeBlocks, ...behaviorBlocks);
      }

      if (sections.length === 0) {
        const diagnostics: string[] = [];
        if (config.conventionTags.length > 0) {
          diagnostics.push(`conventions [${config.conventionTags.join(', ')}]`);
        }
        if (config.shapeSources.length > 0) {
          diagnostics.push(`shapes [${config.shapeSources.join(', ')}]`);
        }
        if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
          diagnostics.push(`selectors [${config.shapeSelectors.length} selectors]`);
        }
        if (config.behaviorCategories.length > 0) {
          diagnostics.push(`behaviors [${config.behaviorCategories.join(', ')}]`);
        }
        if (includeSet !== undefined) {
          diagnostics.push(`includeTags [${[...includeSet].join(', ')}]`);
        }
        sections.push(paragraph(`No content found. Sources checked: ${diagnostics.join('; ')}.`));
      }

      return document(config.title, sections, {
        purpose: `Reference document: ${config.title}`,
        detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
      });
    },
    encode: (): never => {
      throw new Error('ReferenceDocumentCodec is decode-only');
    },
  });
}

// ============================================================================
// Product Area Decode Path
// ============================================================================

/**
 * Decode a product-area-scoped reference document.
 *
 * When `config.productArea` is set, this function replaces the standard decode
 * path. It pre-filters all patterns by product area and auto-derives content
 * sources from the filtered set rather than relying on explicit config arrays.
 *
 * Document structure:
 * 1. Intro (reader question + coverage from ADR-001 metadata)
 * 2. Invariant rules from executable specs (conventions + behavior rules)
 * 3. Architecture diagrams (auto-scoped via productArea→archContext mapping)
 * 4. Key API types (shapes from TypeScript patterns in this area)
 * 5. Behavior specifications (all patterns with rules/descriptions)
 */
function decodeProductArea(
  dataset: MasterDataset,
  config: ReferenceDocConfig,
  opts: Required<ReferenceCodecOptions>
): RenderableDocument {
  const area = config.productArea;
  if (area === undefined) {
    return document('Error', [paragraph('No product area specified.')], {});
  }
  const sections: SectionBlock[] = [];

  // Static preamble: editorial sections before generated content
  if (config.preamble !== undefined && config.preamble.length > 0) {
    sections.push(...config.preamble);
    sections.push(separator());
  }

  // Pre-computed view: O(1) lookup instead of linear filter
  const areaPatterns = dataset.byProductArea[area] ?? [];

  // Collect TypeScript patterns by explicit archContext tag (for shapes + diagrams)
  // Note: archIndex.byContext includes inferred contexts — use explicit filter to match only tagged patterns
  const archContexts = PRODUCT_AREA_ARCH_CONTEXT_MAP[area] ?? [];
  const contextSet = new Set(archContexts);
  const tsPatterns =
    contextSet.size > 0
      ? dataset.patterns.filter((p) => p.archContext !== undefined && contextSet.has(p.archContext))
      : [];

  // 1. Intro section from ADR-001 metadata with key invariants
  const meta = PRODUCT_AREA_META[area];
  if (meta !== undefined) {
    sections.push(paragraph(`**${meta.question}** ${meta.intro}`));

    if (meta.keyInvariants.length > 0) {
      sections.push(heading(2, 'Key Invariants'));
      sections.push(list([...meta.keyInvariants]));
    }
    sections.push(separator());
  }

  // 2. Convention/invariant content from area patterns with convention tags
  const conventionPatterns = areaPatterns.filter(
    (p) => p.convention !== undefined && p.convention.length > 0
  );
  if (conventionPatterns.length > 0) {
    const conventions = extractConventionsFromPatterns(conventionPatterns);
    if (conventions.length > 0) {
      sections.push(...buildConventionSections(conventions, opts.detailLevel));
    }
  }

  // 3. Architecture diagrams — priority: config > meta > auto-generate
  if (opts.detailLevel !== 'summary') {
    const scopes: readonly DiagramScope[] =
      config.diagramScopes ??
      (config.diagramScope !== undefined ? [config.diagramScope] : undefined) ??
      meta?.diagramScopes ??
      [];

    if (scopes.length > 0) {
      // Explicit scopes from config or meta — always render
      for (const scope of scopes) {
        const diagramSections = buildScopedDiagram(dataset, scope);
        if (diagramSections.length > 0) {
          sections.push(...diagramSections);
        }
      }
    } else if (archContexts.length > 0) {
      // Auto-generate fallback — only when archContext mappings exist
      const autoScope: DiagramScope = {
        archContext: archContexts,
        direction: 'TB',
        title: `${area} Components`,
      };
      const diagramSections = buildScopedDiagram(dataset, autoScope);
      if (diagramSections.length > 0) {
        sections.push(...diagramSections);
      }
    }
  } else {
    // Compact boundary summary for summary-level documents (replaces diagrams)
    const scopes: readonly DiagramScope[] = config.diagramScopes ?? meta?.diagramScopes ?? [];
    const summary = buildBoundarySummary(dataset, scopes);
    if (summary !== undefined) {
      sections.push(summary);
    }
  }

  // 4. Shapes from TypeScript patterns in this product area
  {
    const allShapes: ExtractedShape[] = [];
    const seenNames = new Set<string>();
    const seenPatternNames = new Set<string>();

    // Collect shapes from all patterns associated with this area
    for (const pattern of [...areaPatterns, ...tsPatterns]) {
      if (seenPatternNames.has(pattern.name)) continue;
      seenPatternNames.add(pattern.name);
      if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0) continue;
      for (const shape of pattern.extractedShapes) {
        if (!seenNames.has(shape.name)) {
          seenNames.add(shape.name);
          allShapes.push(shape);
        }
      }
    }

    // Also include shapes matched by explicit config (if any)
    if (config.shapeSources.length > 0) {
      for (const shape of extractShapesFromDataset(dataset, config.shapeSources)) {
        if (!seenNames.has(shape.name)) {
          seenNames.add(shape.name);
          allShapes.push(shape);
        }
      }
    }
    if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
      for (const shape of filterShapesBySelectors(dataset, config.shapeSelectors)) {
        if (!seenNames.has(shape.name)) {
          seenNames.add(shape.name);
          allShapes.push(shape);
        }
      }
    }

    if (allShapes.length > 0) {
      // Prioritize interfaces and types over functions/variables to keep
      // product area docs focused on key API types, not implementation details.
      const kindOrder: Readonly<Record<string, number>> = {
        interface: 0,
        type: 1,
        enum: 2,
        function: 3,
        const: 4,
      };
      const sorted = [...allShapes].sort(
        (a, b) => (kindOrder[a.kind] ?? 5) - (kindOrder[b.kind] ?? 5)
      );
      const maxShapes = opts.detailLevel === 'detailed' ? 30 : 20;
      const limited = sorted.slice(0, maxShapes);
      sections.push(...buildShapeSections(limited, opts.detailLevel));
    }
  }

  // 5. Compact business rules index (replaces verbose Behavior Specifications)
  // Shows only rule name, invariant, and rationale per rule in tables
  const rulesPatterns = areaPatterns.filter(
    (p) =>
      (config.excludeSourcePaths === undefined ||
        config.excludeSourcePaths.length === 0 ||
        !config.excludeSourcePaths.some((prefix) => p.source.file.startsWith(prefix))) &&
      p.rules !== undefined &&
      p.rules.length > 0
  );
  if (rulesPatterns.length > 0) {
    sections.push(...buildBusinessRulesCompactSection(rulesPatterns, opts.detailLevel));
  }

  // DD-4 (GeneratedDocQuality): Insert TOC after intro for large product area docs
  const tocBlocks = buildTableOfContents(sections);
  if (tocBlocks.length > 0) {
    const firstSepIdx = sections.findIndex((s) => s.type === 'separator');
    if (firstSepIdx >= 0) {
      sections.splice(firstSepIdx + 1, 0, ...tocBlocks);
    }
  }

  if (sections.length === 0) {
    sections.push(
      paragraph(
        `No content found for product area "${area}". ` +
          `Checked ${areaPatterns.length} patterns by productArea tag, ` +
          `${tsPatterns.length} patterns by archContext [${archContexts.join(', ')}].`
      )
    );
  }

  return document(config.title, sections, {
    purpose: `${area} product area overview`,
    detailLevel: opts.detailLevel === 'summary' ? 'Compact summary' : 'Full reference',
  });
}

// ============================================================================
// Section Builders
// ============================================================================

/**
 * Build sections from convention bundles.
 */
function buildConventionSections(
  conventions: readonly ConventionBundle[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  for (const bundle of conventions) {
    if (bundle.rules.length === 0) continue;

    for (const rule of bundle.rules) {
      sections.push(heading(2, rule.ruleName));

      if (rule.invariant) {
        sections.push(paragraph(`**Invariant:** ${rule.invariant}`));
      }

      if (rule.narrative && detailLevel !== 'summary') {
        sections.push(paragraph(rule.narrative));
      }

      if (rule.rationale && detailLevel === 'detailed') {
        sections.push(paragraph(`**Rationale:** ${rule.rationale}`));
      }

      for (const tbl of rule.tables) {
        const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
        sections.push(table([...tbl.headers], rows));
      }

      if (rule.codeExamples !== undefined && detailLevel !== 'summary') {
        for (const example of rule.codeExamples) {
          if (example.type === 'code' && example.language === 'mermaid') {
            sections.push(mermaid(example.content));
          } else {
            sections.push(example);
          }
        }
      }

      if (rule.verifiedBy && rule.verifiedBy.length > 0 && detailLevel === 'detailed') {
        sections.push(paragraph(`**Verified by:** ${rule.verifiedBy.join(', ')}`));
      }

      sections.push(separator());
    }
  }

  return sections;
}

/**
 * Build sections from a pre-filtered list of behavior patterns.
 *
 * DD-1 (CrossCuttingDocumentInclusion): Extracted from buildBehaviorSections to
 * accept pre-merged patterns (category-selected + include-tagged).
 */
function buildBehaviorSectionsFromPatterns(
  patterns: readonly ExtractedPattern[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  if (patterns.length === 0) return sections;

  sections.push(heading(2, 'Behavior Specifications'));

  for (const pattern of patterns) {
    sections.push(heading(3, pattern.name));

    // Cross-reference link to source file (omitted at summary level)
    if (detailLevel !== 'summary') {
      sections.push(linkOut(`View ${pattern.name} source`, pattern.source.file));
    }

    if (pattern.directive.description && detailLevel !== 'summary') {
      sections.push(paragraph(pattern.directive.description));
    }

    if (pattern.rules && pattern.rules.length > 0) {
      if (detailLevel === 'summary') {
        // Compact table with word-boundary-aware truncation
        const ruleRows = pattern.rules.map((r) => [
          r.name,
          r.description ? truncateText(r.description, 120) : '',
        ]);
        sections.push(table(['Rule', 'Description'], ruleRows));
      } else {
        // Structured per-rule rendering with parsed annotations
        // Wrap in collapsible blocks when 3+ rules for progressive disclosure
        const wrapInCollapsible = pattern.rules.length >= 3;

        for (const rule of pattern.rules) {
          const ruleBlocks: SectionBlock[] = [];
          ruleBlocks.push(heading(4, rule.name));
          const annotations = parseBusinessRuleAnnotations(rule.description);

          if (annotations.invariant) {
            ruleBlocks.push(paragraph(`**Invariant:** ${annotations.invariant}`));
          }

          if (annotations.rationale && detailLevel === 'detailed') {
            ruleBlocks.push(paragraph(`**Rationale:** ${annotations.rationale}`));
          }

          if (annotations.remainingContent) {
            ruleBlocks.push(paragraph(annotations.remainingContent));
          }

          if (annotations.codeExamples && detailLevel === 'detailed') {
            for (const example of annotations.codeExamples) {
              ruleBlocks.push(example);
            }
          }

          // Merged scenario names + verifiedBy as deduplicated list
          const names = new Set(rule.scenarioNames);
          if (annotations.verifiedBy) {
            for (const v of annotations.verifiedBy) {
              names.add(v);
            }
          }
          if (names.size > 0) {
            ruleBlocks.push(paragraph('**Verified by:**'));
            ruleBlocks.push(list([...names]));
          }

          if (wrapInCollapsible) {
            const scenarioCount = rule.scenarioNames.length;
            const summary =
              scenarioCount > 0 ? `${rule.name} (${scenarioCount} scenarios)` : rule.name;
            sections.push(collapsible(summary, ruleBlocks));
          } else {
            sections.push(...ruleBlocks);
          }
        }
      }
    }
  }

  sections.push(separator());
  return sections;
}

/**
 * Build a compact business rules index section.
 *
 * Replaces the verbose Behavior Specifications in product area docs.
 * Groups rules by pattern, showing only rule name, invariant, and rationale.
 * Always renders open H3 headings with tables for immediate scannability.
 *
 * Detail level controls:
 * - summary: Section omitted entirely
 * - standard: Rules with invariants only; truncated to 150/120 chars
 * - detailed: All rules; full text, no truncation
 */
function buildBusinessRulesCompactSection(
  patterns: readonly ExtractedPattern[],
  detailLevel: DetailLevel
): SectionBlock[] {
  if (detailLevel === 'summary') return [];

  const sections: SectionBlock[] = [];

  // Count totals for header (lightweight pass — no annotation parsing)
  let totalRules = 0;
  let totalInvariants = 0;

  for (const p of patterns) {
    if (p.rules === undefined) continue;
    for (const r of p.rules) {
      totalRules++;
      if (r.description.includes('**Invariant:**')) totalInvariants++;
    }
  }

  if (totalRules === 0) return sections;

  sections.push(heading(2, 'Business Rules'));
  sections.push(
    paragraph(
      `${String(patterns.length)} patterns, ` +
        `${String(totalInvariants)} rules with invariants ` +
        `(${String(totalRules)} total)`
    )
  );

  const isDetailed = detailLevel === 'detailed';
  const maxInvariant = isDetailed ? 0 : 150;
  const maxRationale = isDetailed ? 0 : 120;

  const sorted = [...patterns].sort((a, b) => a.name.localeCompare(b.name));

  for (const pattern of sorted) {
    if (pattern.rules === undefined) continue;

    const rows: string[][] = [];
    for (const rule of pattern.rules) {
      const ann = parseBusinessRuleAnnotations(rule.description);

      // At standard level, skip rules without invariant
      if (!isDetailed && ann.invariant === undefined) continue;

      const invariantText = ann.invariant ?? '';
      const rationaleText = ann.rationale ?? '';

      rows.push([
        rule.name,
        maxInvariant > 0 ? truncateText(invariantText, maxInvariant) : invariantText,
        maxRationale > 0 ? truncateText(rationaleText, maxRationale) : rationaleText,
      ]);
    }

    if (rows.length === 0) continue;

    sections.push(heading(3, camelCaseToTitleCase(pattern.name)));
    sections.push(table(['Rule', 'Invariant', 'Rationale'], rows));
  }

  sections.push(separator());
  return sections;
}

/**
 * Build a table of contents from H2 headings in a sections array.
 *
 * DD-4 (GeneratedDocQuality): Product area docs can be 100+ KB with many
 * sections. A TOC at the top makes browser navigation practical. Only
 * generated when there are 3 or more H2 headings (below that, a TOC adds
 * noise without navigation value).
 */
function buildTableOfContents(allSections: readonly SectionBlock[]): SectionBlock[] {
  const h2Headings = allSections.filter(
    (s): s is HeadingBlock => s.type === 'heading' && s.level === 2
  );
  if (h2Headings.length < 3) return [];

  const tocItems = h2Headings.map((h) => {
    const anchor = slugify(h.text);
    return `[${h.text}](#${anchor})`;
  });

  return [heading(2, 'Contents'), list(tocItems), separator()];
}

/**
 * Build sections from extracted TypeScript shapes.
 *
 * Composition order follows AD-5: conventions → shapes → behaviors.
 *
 * Detail level controls:
 * - summary: type name + kind table only (compact)
 * - standard: names + source text code blocks
 * - detailed: full source with JSDoc and property doc tables
 */
function buildShapeSections(
  shapes: readonly ExtractedShape[],
  detailLevel: DetailLevel
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, 'API Types'));

  if (detailLevel === 'summary') {
    // Summary: just a table of type names and kinds
    const rows = shapes.map((s) => [s.name, s.kind]);
    sections.push(table(['Type', 'Kind'], rows));
  } else {
    // Standard/Detailed: code blocks for each shape
    for (const shape of shapes) {
      sections.push(heading(3, `${shape.name} (${shape.kind})`));

      if (shape.jsDoc) {
        sections.push(code(shape.jsDoc, 'typescript'));
      }
      sections.push(code(shape.sourceText, 'typescript'));

      // Property docs table for interfaces at detailed level
      if (detailLevel === 'detailed' && shape.propertyDocs && shape.propertyDocs.length > 0) {
        const propRows = shape.propertyDocs.map((p) => [p.name, p.jsDoc]);
        sections.push(table(['Property', 'Description'], propRows));
      }

      // Param docs table for functions at standard and detailed levels
      if (shape.params && shape.params.length > 0) {
        const paramRows = shape.params.map((p) => [p.name, p.type ?? '', p.description]);
        sections.push(table(['Parameter', 'Type', 'Description'], paramRows));
      }

      // Returns and throws docs at detailed level only
      if (detailLevel === 'detailed') {
        if (shape.returns) {
          const returnText = shape.returns.type
            ? `**Returns** (\`${shape.returns.type}\`): ${shape.returns.description}`
            : `**Returns:** ${shape.returns.description}`;
          sections.push(paragraph(returnText));
        }

        if (shape.throws && shape.throws.length > 0) {
          const throwsRows = shape.throws.map((t) => [t.type ?? '', t.description]);
          sections.push(table(['Exception', 'Description'], throwsRows));
        }
      }
    }
  }

  sections.push(separator());
  return sections;
}

// ============================================================================
// Boundary Summary Builder
// ============================================================================

/**
 * Build a compact boundary summary paragraph from diagram scope data.
 *
 * Groups scope patterns by archContext and produces a text like:
 * **Components:** Scanner (PatternA, PatternB), Extractor (PatternC)
 *
 * Skips scopes with `source` override (hardcoded diagrams like fsm-lifecycle).
 * Returns undefined if no patterns found.
 */
function buildBoundarySummary(
  dataset: MasterDataset,
  scopes: readonly DiagramScope[]
): SectionBlock | undefined {
  const allPatterns: ExtractedPattern[] = [];
  const seenNames = new Set<string>();

  for (const scope of scopes) {
    // Skip hardcoded source diagrams — they don't represent pattern boundaries
    if (scope.source !== undefined) continue;

    for (const pattern of collectScopePatterns(dataset, scope)) {
      const name = getPatternName(pattern);
      if (!seenNames.has(name)) {
        seenNames.add(name);
        allPatterns.push(pattern);
      }
    }
  }

  if (allPatterns.length === 0) return undefined;

  // Group by archContext
  const byContext = new Map<string, string[]>();
  for (const pattern of allPatterns) {
    const ctx = pattern.archContext ?? 'Other';
    const group = byContext.get(ctx) ?? [];
    group.push(getPatternName(pattern));
    byContext.set(ctx, group);
  }

  // Build compact text: "Context (A, B), Context (C)"
  const parts: string[] = [];
  for (const [context, names] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const label = context.charAt(0).toUpperCase() + context.slice(1);
    parts.push(`${label} (${names.join(', ')})`);
  }

  return paragraph(`**Components:** ${parts.join(', ')}`);
}

// ============================================================================
// Scoped Diagram Builder
// ============================================================================

/**
 * Collect patterns matching a DiagramScope filter.
 */
function collectScopePatterns(dataset: MasterDataset, scope: DiagramScope): ExtractedPattern[] {
  const nameSet = new Set(scope.patterns ?? []);
  const contextSet = new Set(scope.archContext ?? []);
  const viewSet = new Set(scope.include ?? []);
  const layerSet = new Set(scope.archLayer ?? []);

  return dataset.patterns.filter((p) => {
    const name = getPatternName(p);
    if (nameSet.has(name)) return true;
    if (p.archContext !== undefined && contextSet.has(p.archContext)) return true;
    if (p.include?.some((v) => viewSet.has(v)) === true) return true;
    if (p.archLayer !== undefined && layerSet.has(p.archLayer)) return true;
    return false;
  });
}

/**
 * Collect neighbor patterns — targets of relationship edges from scope patterns
 * that are not themselves in scope. Only outgoing edges (uses, dependsOn,
 * implementsPatterns, extendsPattern) are traversed; incoming edges (usedBy,
 * enables) are intentionally excluded to keep scoped diagrams focused on what
 * the scope depends on, not what depends on it.
 */
function collectNeighborPatterns(
  dataset: MasterDataset,
  scopeNames: ReadonlySet<string>
): ExtractedPattern[] {
  const neighborNames = new Set<string>();
  const relationships = dataset.relationshipIndex ?? {};

  for (const name of scopeNames) {
    const rel = relationships[name];
    if (!rel) continue;

    for (const target of rel.uses) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    for (const target of rel.dependsOn) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    for (const target of rel.implementsPatterns) {
      if (!scopeNames.has(target)) neighborNames.add(target);
    }
    if (rel.extendsPattern !== undefined && !scopeNames.has(rel.extendsPattern)) {
      neighborNames.add(rel.extendsPattern);
    }
  }

  if (neighborNames.size === 0) return [];

  return dataset.patterns.filter((p) => neighborNames.has(getPatternName(p)));
}

// ============================================================================
// Diagram Context & Strategy Builders (DD-6)
// ============================================================================

/** Pre-computed diagram context shared by all diagram type builders */
interface DiagramContext {
  readonly scopePatterns: readonly ExtractedPattern[];
  readonly neighborPatterns: readonly ExtractedPattern[];
  readonly scopeNames: ReadonlySet<string>;
  readonly neighborNames: ReadonlySet<string>;
  readonly nodeIds: ReadonlyMap<string, string>;
  readonly relationships: Readonly<
    Record<
      string,
      {
        uses: readonly string[];
        dependsOn: readonly string[];
        implementsPatterns: readonly string[];
        extendsPattern?: string | undefined;
      }
    >
  >;
  readonly allNames: ReadonlySet<string>;
}

/** Extract shared setup from scope + dataset into a reusable context */
function prepareDiagramContext(
  dataset: MasterDataset,
  scope: DiagramScope
): DiagramContext | undefined {
  const scopePatterns = collectScopePatterns(dataset, scope);
  if (scopePatterns.length === 0) return undefined;

  const nodeIds = new Map<string, string>();
  const scopeNames = new Set<string>();

  for (const pattern of scopePatterns) {
    const name = getPatternName(pattern);
    scopeNames.add(name);
    nodeIds.set(name, sanitizeNodeId(name));
  }

  const neighborPatterns = collectNeighborPatterns(dataset, scopeNames);
  const neighborNames = new Set<string>();
  for (const pattern of neighborPatterns) {
    const name = getPatternName(pattern);
    neighborNames.add(name);
    nodeIds.set(name, sanitizeNodeId(name));
  }

  const relationships = dataset.relationshipIndex ?? {};
  const allNames = new Set([...scopeNames, ...neighborNames]);

  // Prune orphan scope patterns — nodes with zero edges in the diagram context.
  // A pattern participates if it is the source or target of any edge within allNames.
  const connected = new Set<string>();
  for (const name of allNames) {
    const rel = relationships[name];
    if (!rel) continue;
    const edgeArrays = [rel.uses, rel.dependsOn, rel.implementsPatterns];
    for (const targets of edgeArrays) {
      for (const target of targets) {
        if (allNames.has(target)) {
          connected.add(name);
          connected.add(target);
        }
      }
    }
    if (rel.extendsPattern !== undefined && allNames.has(rel.extendsPattern)) {
      connected.add(name);
      connected.add(rel.extendsPattern);
    }
  }

  // Only prune orphan scope patterns when the diagram has SOME connected
  // patterns. If no edges exist at all, the diagram is a component listing
  // and all scope patterns should be preserved.
  if (connected.size > 0) {
    const prunedScopePatterns = scopePatterns.filter((p) => connected.has(getPatternName(p)));
    if (prunedScopePatterns.length === 0) {
      return undefined;
    }

    const prunedScopeNames = new Set<string>();
    for (const p of prunedScopePatterns) {
      prunedScopeNames.add(getPatternName(p));
    }

    // Rebuild nodeIds — remove pruned entries
    const prunedNodeIds = new Map<string, string>();
    for (const name of [...prunedScopeNames, ...neighborNames]) {
      const id = nodeIds.get(name);
      if (id !== undefined) prunedNodeIds.set(name, id);
    }

    const prunedAllNames = new Set([...prunedScopeNames, ...neighborNames]);

    return {
      scopePatterns: prunedScopePatterns,
      neighborPatterns,
      scopeNames: prunedScopeNames,
      neighborNames,
      nodeIds: prunedNodeIds,
      relationships,
      allNames: prunedAllNames,
    };
  }

  return {
    scopePatterns,
    neighborPatterns,
    scopeNames,
    neighborNames,
    nodeIds,
    relationships,
    allNames,
  };
}

/** Emit relationship edges for flowchart diagrams (DD-4, DD-7) */
function emitFlowchartEdges(ctx: DiagramContext, showLabels: boolean): string[] {
  const lines: string[] = [];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

  for (const sourceName of ctx.allNames) {
    const sourceId = ctx.nodeIds.get(sourceName);
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

    for (const type of edgeTypes) {
      for (const target of rel[type]) {
        const targetId = ctx.nodeIds.get(target);
        if (targetId !== undefined) {
          const arrow = EDGE_STYLES[type];
          const label = showLabels ? `|${EDGE_LABELS[type]}|` : '';
          lines.push(`    ${sourceId} ${arrow}${label} ${targetId}`);
        }
      }
    }

    if (rel.extendsPattern !== undefined) {
      const targetId = ctx.nodeIds.get(rel.extendsPattern);
      if (targetId !== undefined) {
        const arrow = EDGE_STYLES.extendsPattern;
        const label = showLabels ? `|${EDGE_LABELS.extendsPattern}|` : '';
        lines.push(`    ${sourceId} ${arrow}${label} ${targetId}`);
      }
    }
  }

  return lines;
}

/** Build a Mermaid flowchart diagram with custom shapes and edge labels (DD-1, DD-4) */
function buildFlowchartDiagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const direction = scope.direction ?? 'TB';
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = [`graph ${direction}`];

  // Group scope patterns by archContext for subgraphs
  const byContext = new Map<string, ExtractedPattern[]>();
  const noContext: ExtractedPattern[] = [];
  for (const pattern of ctx.scopePatterns) {
    if (pattern.archContext !== undefined) {
      const group = byContext.get(pattern.archContext) ?? [];
      group.push(pattern);
      byContext.set(pattern.archContext, group);
    } else {
      noContext.push(pattern);
    }
  }

  // Emit context subgraphs
  for (const [context, patterns] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const contextLabel = context.charAt(0).toUpperCase() + context.slice(1);
    lines.push(`    subgraph ${sanitizeNodeId(context)}["${contextLabel}"]`);
    for (const pattern of patterns) {
      const name = getPatternName(pattern);
      const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
      lines.push(`        ${formatNodeDeclaration(nodeId, name, pattern.archRole)}`);
    }
    lines.push('    end');
  }

  // Emit scope patterns without context
  for (const pattern of noContext) {
    const name = getPatternName(pattern);
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    ${formatNodeDeclaration(nodeId, name, pattern.archRole)}`);
  }

  // Emit neighbor subgraph
  if (ctx.neighborPatterns.length > 0) {
    lines.push('    subgraph related["Related"]');
    for (const pattern of ctx.neighborPatterns) {
      const name = getPatternName(pattern);
      const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
      lines.push(`        ${nodeId}["${name}"]:::neighbor`);
    }
    lines.push('    end');
  }

  // Emit edges
  lines.push(...emitFlowchartEdges(ctx, showLabels));

  // Add neighbor class definition
  if (ctx.neighborPatterns.length > 0) {
    lines.push('    classDef neighbor stroke-dasharray: 5 5');
  }

  return lines;
}

/** Build a Mermaid sequence diagram with participants and messages (DD-2) */
function buildSequenceDiagram(ctx: DiagramContext): string[] {
  const lines: string[] = ['sequenceDiagram'];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

  // Emit participant declarations for scope patterns (sanitized for Mermaid syntax)
  for (const name of ctx.scopeNames) {
    lines.push(`    participant ${sanitizeNodeId(name)} as ${name}`);
  }
  // Emit participant declarations for neighbor patterns
  for (const name of ctx.neighborNames) {
    lines.push(`    participant ${sanitizeNodeId(name)} as ${name}`);
  }

  // Emit messages from relationships
  for (const sourceName of ctx.allNames) {
    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

    for (const type of edgeTypes) {
      for (const target of rel[type]) {
        if (ctx.allNames.has(target)) {
          const arrow = SEQUENCE_ARROWS[type];
          lines.push(
            `    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(target)}: ${EDGE_LABELS[type]}`
          );
        }
      }
    }

    if (rel.extendsPattern !== undefined && ctx.allNames.has(rel.extendsPattern)) {
      const arrow = SEQUENCE_ARROWS.extendsPattern;
      lines.push(
        `    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(rel.extendsPattern)}: ${EDGE_LABELS.extendsPattern}`
      );
    }
  }

  return lines;
}

/** Build a Mermaid state diagram with transitions and pseudo-states (DD-3) */
function buildStateDiagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = ['stateDiagram-v2'];

  // Track incoming/outgoing dependsOn edges for pseudo-states
  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();

  // Emit state declarations for scope patterns
  for (const name of ctx.scopeNames) {
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    state "${name}" as ${nodeId}`);
  }

  // Emit state declarations for neighbor patterns
  for (const name of ctx.neighborNames) {
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    state "${name}" as ${nodeId}`);
  }

  // Emit transitions from dependsOn relationships
  for (const sourceName of ctx.allNames) {
    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

    for (const target of rel.dependsOn) {
      if (!ctx.allNames.has(target)) continue;
      const sourceId = ctx.nodeIds.get(sourceName) ?? sanitizeNodeId(sourceName);
      const targetId = ctx.nodeIds.get(target) ?? sanitizeNodeId(target);
      const label = showLabels ? ` : ${EDGE_LABELS.dependsOn}` : '';
      lines.push(`    ${targetId} --> ${sourceId}${label}`);
      hasIncoming.add(sourceName);
      hasOutgoing.add(target);
    }
  }

  // Add start pseudo-states for patterns with no incoming edges
  for (const name of ctx.scopeNames) {
    if (!hasIncoming.has(name)) {
      const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
      lines.push(`    [*] --> ${nodeId}`);
    }
  }

  // Add end pseudo-states for patterns with no outgoing edges
  for (const name of ctx.scopeNames) {
    if (!hasOutgoing.has(name)) {
      const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
      lines.push(`    ${nodeId} --> [*]`);
    }
  }

  return lines;
}

/** Presentation labels for FSM transitions (codec concern, not FSM domain) */
const FSM_TRANSITION_LABELS: Readonly<
  Partial<Record<ProcessStatusValue, Partial<Record<ProcessStatusValue, string>>>>
> = {
  roadmap: { active: 'Start work', deferred: 'Postpone', roadmap: 'Stay in planning' },
  active: { completed: 'All deliverables done', roadmap: 'Blocked / regressed' },
  deferred: { roadmap: 'Resume planning' },
};

/** Display names for protection levels in diagram notes */
const PROTECTION_DISPLAY: Readonly<Record<ProtectionLevel, string>> = {
  none: 'none',
  scope: 'scope-locked',
  hard: 'hard-locked',
};

/** Build FSM lifecycle state diagram from VALID_TRANSITIONS and PROTECTION_LEVELS */
function buildFsmLifecycleStateDiagram(): string[] {
  const lines: string[] = ['stateDiagram-v2'];
  const states = Object.keys(VALID_TRANSITIONS);

  // Entry point: first state is initial
  const initialState = states[0];
  if (initialState !== undefined) {
    lines.push(`    [*] --> ${initialState}`);
  }

  // Transitions derived from the FSM transition matrix
  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    if (targets.length === 0) {
      // Terminal state
      lines.push(`    ${from} --> [*]`);
    } else {
      for (const to of targets) {
        const label = FSM_TRANSITION_LABELS[from as ProcessStatusValue]?.[to];
        const suffix = label !== undefined ? ` : ${label}` : '';
        lines.push(`    ${from} --> ${to}${suffix}`);
      }
    }
  }

  // Protection level notes derived from PROTECTION_LEVELS
  for (const [state, level] of Object.entries(PROTECTION_LEVELS)) {
    const display = PROTECTION_DISPLAY[level];
    lines.push(`    note right of ${state}`);
    lines.push(`        Protection: ${display}`);
    lines.push('    end note');
  }

  return lines;
}

/** Build generation pipeline sequence diagram from hardcoded domain knowledge */
function buildGenerationPipelineSequenceDiagram(): string[] {
  return [
    'sequenceDiagram',
    '    participant CLI',
    '    participant Orchestrator',
    '    participant Scanner',
    '    participant Extractor',
    '    participant Transformer',
    '    participant Codec',
    '    participant Renderer',
    '    CLI ->> Orchestrator: generate(config)',
    '    Orchestrator ->> Scanner: scanPatterns(globs)',
    '    Scanner -->> Orchestrator: TypeScript ASTs',
    '    Orchestrator ->> Scanner: scanGherkinFiles(globs)',
    '    Scanner -->> Orchestrator: Gherkin documents',
    '    Orchestrator ->> Extractor: extractPatterns(files)',
    '    Extractor -->> Orchestrator: ExtractedPattern[]',
    '    Orchestrator ->> Extractor: extractFromGherkin(docs)',
    '    Extractor -->> Orchestrator: ExtractedPattern[]',
    '    Orchestrator ->> Orchestrator: mergePatterns(ts, gherkin)',
    '    Orchestrator ->> Transformer: transformToMasterDataset(patterns)',
    '    Transformer -->> Orchestrator: MasterDataset',
    '    Orchestrator ->> Codec: codec.decode(dataset)',
    '    Codec -->> Orchestrator: RenderableDocument',
    '    Orchestrator ->> Renderer: render(document)',
    '    Renderer -->> Orchestrator: markdown string',
  ];
}

/** Build MasterDataset fan-out diagram from hardcoded domain knowledge */
function buildMasterDatasetViewsDiagram(): string[] {
  return [
    'graph TB',
    '    MD[MasterDataset]',
    '    MD --> byStatus["byStatus<br/>(completed / active / planned)"]',
    '    MD --> byPhase["byPhase<br/>(sorted, with counts)"]',
    '    MD --> byQuarter["byQuarter<br/>(keyed by Q-YYYY)"]',
    '    MD --> byCategory["byCategory<br/>(keyed by category name)"]',
    '    MD --> bySource["bySource<br/>(typescript / gherkin / roadmap / prd)"]',
    '    MD --> counts["counts<br/>(aggregate statistics)"]',
    '    MD --> RI["relationshipIndex?<br/>(forward + reverse lookups)"]',
    '    MD --> AI["archIndex?<br/>(role / context / layer / view)"]',
  ];
}

/** Build a Mermaid C4 context diagram with system boundaries */
function buildC4Diagram(ctx: DiagramContext, scope: DiagramScope): string[] {
  const showLabels = scope.showEdgeLabels !== false;
  const lines: string[] = ['C4Context'];

  if (scope.title !== undefined) {
    lines.push(`    title ${scope.title}`);
  }

  // Group scope patterns by archContext for system boundaries
  const byContext = new Map<string, ExtractedPattern[]>();
  const noContext: ExtractedPattern[] = [];
  for (const pattern of ctx.scopePatterns) {
    if (pattern.archContext !== undefined) {
      const group = byContext.get(pattern.archContext) ?? [];
      group.push(pattern);
      byContext.set(pattern.archContext, group);
    } else {
      noContext.push(pattern);
    }
  }

  // Emit system boundaries
  for (const [context, patterns] of [...byContext.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const contextLabel = context.charAt(0).toUpperCase() + context.slice(1);
    const contextId = sanitizeNodeId(context);
    lines.push(`    Boundary(${contextId}, "${contextLabel}") {`);
    for (const pattern of patterns) {
      const name = getPatternName(pattern);
      const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
      lines.push(`        System(${nodeId}, "${name}")`);
    }
    lines.push('    }');
  }

  // Emit standalone systems (no context)
  for (const pattern of noContext) {
    const name = getPatternName(pattern);
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    System(${nodeId}, "${name}")`);
  }

  // Emit external systems for neighbor patterns
  for (const pattern of ctx.neighborPatterns) {
    const name = getPatternName(pattern);
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    System_Ext(${nodeId}, "${name}")`);
  }

  // Emit relationships
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;
  for (const sourceName of ctx.allNames) {
    const sourceId = ctx.nodeIds.get(sourceName);
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

    for (const type of edgeTypes) {
      for (const target of rel[type]) {
        const targetId = ctx.nodeIds.get(target);
        if (targetId !== undefined) {
          const label = showLabels ? EDGE_LABELS[type] : '';
          lines.push(`    Rel(${sourceId}, ${targetId}, "${label}")`);
        }
      }
    }

    if (rel.extendsPattern !== undefined) {
      const targetId = ctx.nodeIds.get(rel.extendsPattern);
      if (targetId !== undefined) {
        const label = showLabels ? EDGE_LABELS.extendsPattern : '';
        lines.push(`    Rel(${sourceId}, ${targetId}, "${label}")`);
      }
    }
  }

  return lines;
}

/** Build a Mermaid class diagram with pattern exports and relationships */
function buildClassDiagram(ctx: DiagramContext): string[] {
  const lines: string[] = ['classDiagram'];
  const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'] as const;

  // Class arrow styles per relationship type
  const classArrows: Record<string, string> = {
    uses: '..>',
    dependsOn: '..>',
    implementsPatterns: '..|>',
    extendsPattern: '--|>',
  };

  // Emit class declarations for scope patterns (with members)
  for (const pattern of ctx.scopePatterns) {
    const name = getPatternName(pattern);
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    class ${nodeId} {`);

    if (pattern.archRole !== undefined) {
      lines.push(`        <<${pattern.archRole}>>`);
    }

    if (pattern.exports.length > 0) {
      for (const exp of pattern.exports) {
        lines.push(`        +${exp.name} ${exp.type}`);
      }
    }

    lines.push('    }');
  }

  // Emit class declarations for neighbor patterns (no members)
  for (const pattern of ctx.neighborPatterns) {
    const name = getPatternName(pattern);
    const nodeId = ctx.nodeIds.get(name) ?? sanitizeNodeId(name);
    lines.push(`    class ${nodeId}`);
  }

  // Emit relationship edges
  for (const sourceName of ctx.allNames) {
    const sourceId = ctx.nodeIds.get(sourceName);
    if (sourceId === undefined) continue;

    const rel = ctx.relationships[sourceName];
    if (!rel) continue;

    for (const type of edgeTypes) {
      for (const target of rel[type]) {
        const targetId = ctx.nodeIds.get(target);
        if (targetId !== undefined) {
          const arrow = classArrows[type] ?? '..>';
          lines.push(`    ${sourceId} ${arrow} ${targetId} : ${EDGE_LABELS[type]}`);
        }
      }
    }

    if (rel.extendsPattern !== undefined) {
      const targetId = ctx.nodeIds.get(rel.extendsPattern);
      if (targetId !== undefined) {
        lines.push(`    ${sourceId} --|> ${targetId} : ${EDGE_LABELS.extendsPattern}`);
      }
    }
  }

  return lines;
}

/**
 * Build a scoped relationship diagram from DiagramScope config.
 *
 * Dispatches to type-specific builders based on scope.diagramType (DD-6).
 * Scope patterns are grouped by archContext in subgraphs (flowchart) or
 * rendered as participants/states (sequence/state diagrams).
 */
export function buildScopedDiagram(dataset: MasterDataset, scope: DiagramScope): SectionBlock[] {
  const title = scope.title ?? 'Component Overview';

  // Content source override: render hardcoded domain diagrams
  if (scope.source === 'fsm-lifecycle') {
    return [
      heading(2, title),
      paragraph('FSM lifecycle showing valid state transitions and protection levels:'),
      mermaid(buildFsmLifecycleStateDiagram().join('\n')),
      separator(),
    ];
  }
  if (scope.source === 'generation-pipeline') {
    return [
      heading(2, title),
      paragraph('Temporal flow of the documentation generation pipeline:'),
      mermaid(buildGenerationPipelineSequenceDiagram().join('\n')),
      separator(),
    ];
  }
  if (scope.source === 'master-dataset-views') {
    return [
      heading(2, title),
      paragraph('Pre-computed view fan-out from MasterDataset (single-pass transform):'),
      mermaid(buildMasterDatasetViewsDiagram().join('\n')),
      separator(),
    ];
  }

  const ctx = prepareDiagramContext(dataset, scope);
  if (ctx === undefined) return [];

  let diagramLines: string[];
  switch (scope.diagramType ?? 'graph') {
    case 'sequenceDiagram':
      diagramLines = buildSequenceDiagram(ctx);
      break;
    case 'stateDiagram-v2':
      diagramLines = buildStateDiagram(ctx, scope);
      break;
    case 'C4Context':
      diagramLines = buildC4Diagram(ctx, scope);
      break;
    case 'classDiagram':
      diagramLines = buildClassDiagram(ctx);
      break;
    case 'graph':
    default:
      diagramLines = buildFlowchartDiagram(ctx, scope);
      break;
  }

  return [
    heading(2, title),
    paragraph('Scoped architecture diagram showing component relationships:'),
    mermaid(diagramLines.join('\n')),
    separator(),
  ];
}
