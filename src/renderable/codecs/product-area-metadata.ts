/**
 * @architect
 * @architect-pattern ReferenceCodec
 * @architect-status completed
 *
 * ## Reference Codec — Product Area Metadata
 *
 * Static data: PRODUCT_AREA_ARCH_CONTEXT_MAP and PRODUCT_AREA_META.
 * Contains ADR-001 canonical product area definitions for intro sections
 * and diagram scope derivation.
 */

import { heading, table } from '../schema.js';
import type { ProductAreaMeta, DiagramScope } from './reference-types.js';

export const PRODUCT_AREA_KEYS = [
  'Annotation',
  'Configuration',
  'Generation',
  'Validation',
  'DataAPI',
  'CoreTypes',
  'Process',
] as const;

export type ProductAreaKey = (typeof PRODUCT_AREA_KEYS)[number];

export function isProductAreaKey(value: string): value is ProductAreaKey {
  return (PRODUCT_AREA_KEYS as readonly string[]).includes(value);
}

// ============================================================================
// Product Area → archContext Mapping (ADR-001)
// ============================================================================

/**
 * Maps canonical product area values to their associated archContext values.
 * Product areas are Gherkin-side tags; archContexts are TypeScript-side tags.
 * This mapping bridges the two tagging domains for diagram scoping.
 */
export const PRODUCT_AREA_ARCH_CONTEXT_MAP: Readonly<Record<ProductAreaKey, readonly string[]>> = {
  Annotation: ['scanner', 'extractor', 'taxonomy'],
  Configuration: ['config'],
  Generation: ['generator', 'renderer'],
  Validation: ['validation', 'lint'],
  DataAPI: ['api', 'cli'],
  CoreTypes: [],
  Process: [],
};

/**
 * ADR-001 canonical product area metadata for intro sections.
 */
export const PRODUCT_AREA_META: Readonly<Record<ProductAreaKey, ProductAreaMeta>> = {
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
    ] satisfies DiagramScope[],
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
      '`architect.config.ts` file into a fully resolved `ArchitectInstance` ' +
      'that powers the entire pipeline. The flow is: `defineConfig()` provides type-safe ' +
      'authoring (Vite convention, zero validation), `ConfigLoader` discovers and loads ' +
      'the file, `ProjectConfigSchema` validates via Zod, `ConfigResolver` applies defaults ' +
      'and merges stubs into sources, and `ArchitectFactory` builds the final instance ' +
      'with `TagRegistry` and `RegexBuilders`. Two presets define escalating taxonomy ' +
      'complexity — from 3 categories (`libar-generic`) to 21 (`ddd-es-cqrs`). ' +
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
    ] satisfies DiagramScope[],
    keyInvariants: [
      'Preset-based taxonomy: `libar-generic` (3 categories, `@architect-`) and `ddd-es-cqrs` (21 categories, full DDD). Presets replace base categories entirely — they define prefix, categories, and metadata tags as a unit',
      'Resolution pipeline: defineConfig() → ConfigLoader → ProjectConfigSchema (Zod) → ConfigResolver → ArchitectFactory → ArchitectInstance. Each stage has a single responsibility',
      'Stubs merged at resolution time: Stub directory globs are appended to typescript sources, making stubs transparent to the downstream pipeline',
      'Source override composition: SourceMerger applies per-generator overrides (`replaceFeatures`, `additionalFeatures`, `additionalInput`) to base sources. Exclude is always inherited from base',
    ],
    keyPatterns: [
      'ArchitectFactory',
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
      'The generation pipeline transforms annotated source code into markdown documents through a ' +
      'four-stage architecture: Scanner discovers files, Extractor produces `ExtractedPattern` objects, ' +
      'Transformer builds MasterDataset with pre-computed views, and Codecs render to markdown via ' +
      'RenderableDocument IR. Nine specialized codecs handle reference docs, planning, session, reporting, ' +
      'timeline, ADRs, business rules, taxonomy, and composite output — each supporting three detail levels ' +
      '(detailed, standard, summary). The Orchestrator runs generators in registration order, producing both ' +
      'detailed `docs-live/` references and compact `_claude-md/` summaries.',
    introSections: [
      heading(3, 'Pipeline Stages'),
      table(
        ['Stage', 'Module', 'Responsibility'],
        [
          ['Scanner', '`src/scanner/`', 'File discovery, AST parsing, opt-in via `@architect`'],
          [
            'Extractor',
            '`src/extractor/`',
            'Pattern extraction from TypeScript JSDoc and Gherkin tags',
          ],
          [
            'Transformer',
            '`src/generators/pipeline/`',
            'MasterDataset with pre-computed views for O(1) access (ADR-006)',
          ],
          [
            'Codec',
            '`src/renderable/`',
            'Pure functions: MasterDataset → RenderableDocument → Markdown',
          ],
        ]
      ),
      heading(3, 'Codec Inventory'),
      table(
        ['Codec', 'Purpose'],
        [
          [
            'ReferenceDocumentCodec',
            'Conventions, diagrams, shapes, behaviors (4-layer composition)',
          ],
          ['PlanningCodec', 'Roadmap and remaining work'],
          ['SessionCodec', 'Current work and session findings'],
          ['ReportingCodec', 'Changelog'],
          ['TimelineCodec', 'Timeline and traceability'],
          ['RequirementsAdrCodec', 'ADR generation'],
          ['BusinessRulesCodec', 'Gherkin rule extraction'],
          ['TaxonomyCodec', 'Tag registry docs'],
          ['CompositeCodec', 'Composes multiple codecs into a single document'],
        ]
      ),
    ],
    keyInvariants: [
      'Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output',
      'Single read model (ADR-006): All codecs consume MasterDataset. No codec reads raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship',
      'Progressive disclosure: Every document renders at three detail levels (detailed, standard, summary) from the same codec. Summary feeds `_claude-md/` modules; detailed feeds `docs-live/reference/`',
      'Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors',
      'RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer',
      'Composition order: Reference docs compose four content layers in fixed order. Product area docs compose five layers: intro, conventions, diagrams, shapes, business rules',
      'Shape extraction: TypeScript shapes (`interface`, `type`, `enum`, `function`, `const`) are extracted by declaration-level `@architect-shape` tags. Shapes include source text, JSDoc, type parameters, and property documentation',
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
      'boundaries — `@architect-uses` belongs on TypeScript, `@architect-depends-on` belongs on Gherkin — ' +
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
    ] satisfies DiagramScope[],
    keyInvariants: [
      'Protection levels: `roadmap`/`deferred` = none (fully editable), `active` = scope-locked (no new deliverables), `completed` = hard-locked (requires `@architect-unlock-reason`)',
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
      'The Data API provides direct terminal access to project state. ' +
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
    ] satisfies DiagramScope[],
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
    ] satisfies DiagramScope[],
    keyInvariants: [
      'TypeScript source owns pattern identity: `@architect-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents',
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
