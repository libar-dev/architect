/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Parameterized Reference Document Codec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @libar-docs-convention.
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { heading, paragraph, separator, table, code, list, mermaid, collapsible, linkOut, document, } from '../schema.js';
import { DEFAULT_BASE_OPTIONS, mergeOptions, } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { extractConventions, extractConventionsFromPatterns, extractTablesFromDescription, } from './convention-extractor.js';
import { parseBusinessRuleAnnotations, truncateText } from './helpers.js';
import { extractShapesFromDataset, filterShapesBySelectors } from './shape-matcher.js';
import { sanitizeNodeId, EDGE_STYLES, EDGE_LABELS, SEQUENCE_ARROWS, formatNodeDeclaration, } from './diagram-utils.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import { VALID_TRANSITIONS } from '../../validation/fsm/transitions.js';
import { PROTECTION_LEVELS } from '../../validation/fsm/states.js';
// ============================================================================
// Shared Constants
// ============================================================================
/** Content source identifiers for hardcoded domain diagrams */
export const DIAGRAM_SOURCE_VALUES = ['fsm-lifecycle', 'generation-pipeline'];
// ============================================================================
// Product Area → archContext Mapping (ADR-001)
// ============================================================================
/**
 * Maps canonical product area values to their associated archContext values.
 * Product areas are Gherkin-side tags; archContexts are TypeScript-side tags.
 * This mapping bridges the two tagging domains for diagram scoping.
 */
export const PRODUCT_AREA_ARCH_CONTEXT_MAP = {
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
export const PRODUCT_AREA_META = {
    Annotation: {
        question: 'How do I annotate code?',
        covers: 'Scanning, extraction, tag parsing, dual-source',
        intro: 'The annotation system is the ingestion boundary — it transforms annotated TypeScript ' +
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
                archContext: ['scanner', 'extractor', 'taxonomy'],
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
        ],
    },
    Configuration: {
        question: 'How do I configure the tool?',
        covers: 'Config loading, presets, resolution, source merging, schema validation',
        intro: 'Configuration is the entry boundary — it transforms a user-authored ' +
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
        covers: 'Codecs, generators, rendering, diagrams',
        intro: 'The generation pipeline transforms annotated source code into markdown documents. ' +
            'It follows a four-stage architecture: Scanner → Extractor → Transformer → Codec. ' +
            'Codecs are pure functions — given a MasterDataset, they produce a RenderableDocument ' +
            'without side effects. CompositeCodec composes multiple codecs into a single document.',
        keyInvariants: [
            'Codec purity: Every codec is a pure function (dataset in, document out). No side effects, no filesystem access. Same input always produces same output',
            'Config-driven generation: A single `ReferenceDocConfig` produces a complete document. Content sources compose in fixed order: conventions, diagrams, shapes, behaviors',
            'RenderableDocument IR: Codecs express intent ("this is a table"), the renderer handles syntax ("pipe-delimited markdown"). Switching output format requires only a new renderer',
        ],
        keyPatterns: [
            'ADR005CodecBasedMarkdownRendering',
            'CodecDrivenReferenceGeneration',
            'CrossCuttingDocumentInclusion',
            'ArchitectureDiagramGeneration',
            'ScopedArchitecturalView',
        ],
    },
    Validation: {
        question: 'How is the workflow enforced?',
        covers: 'FSM, DoD, anti-patterns, process guard, lint',
        intro: 'Validation enforces delivery workflow rules at commit time using a Decider pattern. ' +
            'Process Guard derives state from annotations (no separate state store), validates ' +
            'proposed changes against FSM rules, and blocks invalid transitions. Protection levels ' +
            'escalate with status: roadmap allows free editing, active locks scope, completed requires explicit unlock.',
        keyInvariants: [
            'Protection levels: `roadmap`/`deferred` = none (fully editable), `active` = scope-locked (no new deliverables), `completed` = hard-locked (requires `@libar-docs-unlock-reason`)',
            'Valid FSM transitions: Only roadmap→active, roadmap→deferred, active→completed, active→roadmap, deferred→roadmap. Completed is terminal',
            'Decider pattern: All validation is (state, changes, options) → result. State is derived from annotations, not maintained separately',
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
        intro: 'The Data API provides direct terminal access to delivery process state. ' +
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
        intro: 'CoreTypes provides the foundational type system used across all other areas. Three pillars ' +
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
        covers: 'Session lifecycle, handoffs, conventions',
        intro: 'Process defines the session workflow and canonical taxonomy. Git is the event store; ' +
            'documentation artifacts are projections; feature files are the single source of truth. ' +
            'TypeScript source owns pattern identity (ADR-003), while Tier 1 specs are ephemeral ' +
            'planning documents that lose value after completion.',
        keyInvariants: [
            'TypeScript source owns pattern identity: `@libar-docs-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents',
            '7 canonical product-area values: Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process — reader-facing sections, not source modules',
            'Two distinct status domains: Pattern FSM status (4 values) vs. deliverable status (6 values). Never cross domains',
        ],
        keyPatterns: [
            'ADR001TaxonomyCanonicalValues',
            'ADR003SourceFirstPatternArchitecture',
            'MvpWorkflowImplementation',
            'SessionHandoffs',
        ],
    },
};
const DEFAULT_REFERENCE_OPTIONS = {
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
export function createReferenceCodec(config, options) {
    const opts = mergeOptions(DEFAULT_REFERENCE_OPTIONS, options);
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            const sections = [];
            // Product area filtering: when set, pre-filter and auto-derive content sources
            if (config.productArea !== undefined) {
                return decodeProductArea(dataset, config, opts);
            }
            // DD-1 (CrossCuttingDocumentInclusion): Pre-compute include set for additive merging
            const includeSet = config.includeTags !== undefined && config.includeTags.length > 0
                ? new Set(config.includeTags)
                : undefined;
            // 1. Convention content from tagged decision records
            const conventions = extractConventions(dataset, config.conventionTags);
            // DD-1: Merge include-tagged convention patterns (additive)
            if (includeSet !== undefined) {
                const existingNames = new Set(conventions.flatMap((b) => b.sourceDecisions));
                const includedConventionPatterns = dataset.patterns.filter((p) => !existingNames.has(p.name) &&
                    p.include?.some((v) => includeSet.has(v)) === true &&
                    p.convention !== undefined &&
                    p.convention.length > 0);
                if (includedConventionPatterns.length > 0) {
                    // Build bundles from included convention patterns
                    const includedConventions = extractConventionsFromPatterns(includedConventionPatterns);
                    conventions.push(...includedConventions);
                }
            }
            if (conventions.length > 0) {
                sections.push(...buildConventionSections(conventions, opts.detailLevel));
            }
            // 2. Scoped relationship diagrams (normalize singular to array)
            if (opts.detailLevel !== 'summary') {
                const scopes = config.diagramScopes ?? (config.diagramScope !== undefined ? [config.diagramScope] : []);
                for (const scope of scopes) {
                    const diagramSections = buildScopedDiagram(dataset, scope);
                    if (diagramSections.length > 0) {
                        sections.push(...diagramSections);
                    }
                }
            }
            // 3. Shape extraction: combine shapeSources (coarse) + shapeSelectors (fine)
            {
                const allShapes = config.shapeSources.length > 0
                    ? [...extractShapesFromDataset(dataset, config.shapeSources)]
                    : [];
                // DD-3/DD-6: Fine-grained selector-based filtering
                if (config.shapeSelectors !== undefined && config.shapeSelectors.length > 0) {
                    const selectorShapes = filterShapesBySelectors(dataset, config.shapeSelectors);
                    const seenNames = new Set(allShapes.map((s) => s.name));
                    for (const shape of selectorShapes) {
                        if (!seenNames.has(shape.name)) {
                            seenNames.add(shape.name);
                            allShapes.push(shape);
                        }
                    }
                }
                // DD-1: Merge include-tagged shapes (additive)
                if (includeSet !== undefined) {
                    const seenNames = new Set(allShapes.map((s) => s.name));
                    for (const pattern of dataset.patterns) {
                        if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0)
                            continue;
                        for (const shape of pattern.extractedShapes) {
                            if (!seenNames.has(shape.name) &&
                                shape.includes?.some((v) => includeSet.has(v)) === true) {
                                seenNames.add(shape.name);
                                allShapes.push(shape);
                            }
                        }
                    }
                }
                if (allShapes.length > 0) {
                    sections.push(...buildShapeSections(allShapes, opts.detailLevel));
                }
            }
            // 4. Behavior content from tagged patterns
            const behaviorPatterns = config.behaviorCategories.length > 0
                ? dataset.patterns.filter((p) => config.behaviorCategories.includes(p.category))
                : [];
            // DD-1: Merge include-tagged behavior patterns (additive)
            if (includeSet !== undefined) {
                const existingNames = new Set(behaviorPatterns.map((p) => p.name));
                const includedBehaviors = dataset.patterns.filter((p) => !existingNames.has(p.name) &&
                    p.include?.some((v) => includeSet.has(v)) === true &&
                    (p.directive.description.length > 0 || (p.rules !== undefined && p.rules.length > 0)));
                behaviorPatterns.push(...includedBehaviors);
            }
            if (behaviorPatterns.length > 0) {
                sections.push(...buildBehaviorSectionsFromPatterns(behaviorPatterns, opts.detailLevel));
            }
            if (sections.length === 0) {
                const diagnostics = [];
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
        encode: () => {
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
function decodeProductArea(dataset, config, opts) {
    const area = config.productArea;
    if (area === undefined) {
        return document('Error', [paragraph('No product area specified.')], {});
    }
    const sections = [];
    // Pre-filter patterns by product area
    const areaPatterns = dataset.patterns.filter((p) => p.productArea === area);
    // Also collect TypeScript patterns by archContext mapping (for shapes + diagrams)
    const archContexts = PRODUCT_AREA_ARCH_CONTEXT_MAP[area] ?? [];
    const contextSet = new Set(archContexts);
    const tsPatterns = contextSet.size > 0
        ? dataset.patterns.filter((p) => p.archContext !== undefined && contextSet.has(p.archContext))
        : [];
    // Combined set of all relevant patterns (deduplicated)
    const allRelevantNames = new Set([
        ...areaPatterns.map((p) => p.name),
        ...tsPatterns.map((p) => p.name),
    ]);
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
    const conventionPatterns = areaPatterns.filter((p) => p.convention !== undefined && p.convention.length > 0);
    if (conventionPatterns.length > 0) {
        const conventions = extractConventionsFromPatterns(conventionPatterns);
        if (conventions.length > 0) {
            sections.push(...buildConventionSections(conventions, opts.detailLevel));
        }
    }
    // 3. Architecture diagrams — priority: config > meta > auto-generate
    if (opts.detailLevel !== 'summary') {
        const scopes = config.diagramScopes ??
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
        }
        else if (contextSet.size > 0) {
            // Auto-generate fallback — only when archContext mappings exist
            const autoScope = {
                archContext: archContexts,
                direction: 'TB',
                title: `${area} Components`,
            };
            const diagramSections = buildScopedDiagram(dataset, autoScope);
            if (diagramSections.length > 0) {
                sections.push(...diagramSections);
            }
        }
    }
    // 4. Shapes from TypeScript patterns in this product area
    {
        const allShapes = [];
        const seenNames = new Set();
        // Collect shapes from all patterns associated with this area
        for (const pattern of dataset.patterns) {
            if (!allRelevantNames.has(pattern.name))
                continue;
            if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0)
                continue;
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
            const kindOrder = {
                interface: 0,
                type: 1,
                enum: 2,
                function: 3,
                const: 4,
            };
            const sorted = [...allShapes].sort((a, b) => (kindOrder[a.kind] ?? 5) - (kindOrder[b.kind] ?? 5));
            const maxShapes = opts.detailLevel === 'detailed' ? 30 : 20;
            const limited = sorted.slice(0, maxShapes);
            sections.push(...buildShapeSections(limited, opts.detailLevel));
        }
    }
    // 5. Behavior specifications from area patterns with rules or descriptions
    // Optionally exclude source paths (e.g., Tier 1 specs) via config
    const behaviorPatterns = areaPatterns.filter((p) => (config.excludeSourcePaths === undefined ||
        config.excludeSourcePaths.length === 0 ||
        !config.excludeSourcePaths.some((prefix) => p.source.file.startsWith(prefix))) &&
        (p.directive.description.length > 0 || (p.rules !== undefined && p.rules.length > 0)));
    if (behaviorPatterns.length > 0) {
        sections.push(...buildBehaviorSectionsFromPatterns(behaviorPatterns, opts.detailLevel));
    }
    if (sections.length === 0) {
        sections.push(paragraph(`No content found for product area "${area}". ` +
            `Checked ${areaPatterns.length} patterns by productArea tag, ` +
            `${tsPatterns.length} patterns by archContext [${archContexts.join(', ')}].`));
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
function buildConventionSections(conventions, detailLevel) {
    const sections = [];
    for (const bundle of conventions) {
        if (bundle.rules.length === 0)
            continue;
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
                    }
                    else {
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
function buildBehaviorSectionsFromPatterns(patterns, detailLevel) {
    const sections = [];
    if (patterns.length === 0)
        return sections;
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
            }
            else {
                // Structured per-rule rendering with parsed annotations
                // Wrap in collapsible blocks when 3+ rules for progressive disclosure
                const wrapInCollapsible = pattern.rules.length >= 3;
                for (const rule of pattern.rules) {
                    const ruleBlocks = [];
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
                    // Extract and render tables from Rule descriptions (Gherkin or markdown)
                    const ruleTables = extractTablesFromDescription(rule.description);
                    for (const tbl of ruleTables) {
                        const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
                        ruleBlocks.push(table([...tbl.headers], rows));
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
                        const summary = scenarioCount > 0 ? `${rule.name} (${scenarioCount} scenarios)` : rule.name;
                        sections.push(collapsible(summary, ruleBlocks));
                    }
                    else {
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
 * Build sections from extracted TypeScript shapes.
 *
 * Composition order follows AD-5: conventions → shapes → behaviors.
 *
 * Detail level controls:
 * - summary: type name + kind table only (compact)
 * - standard: names + source text code blocks
 * - detailed: full source with JSDoc and property doc tables
 */
function buildShapeSections(shapes, detailLevel) {
    const sections = [];
    sections.push(heading(2, 'API Types'));
    if (detailLevel === 'summary') {
        // Summary: just a table of type names and kinds
        const rows = shapes.map((s) => [s.name, s.kind]);
        sections.push(table(['Type', 'Kind'], rows));
    }
    else {
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
// Scoped Diagram Builder
// ============================================================================
/**
 * Collect patterns matching a DiagramScope filter.
 */
function collectScopePatterns(dataset, scope) {
    const nameSet = new Set(scope.patterns ?? []);
    const contextSet = new Set(scope.archContext ?? []);
    const viewSet = new Set(scope.include ?? []);
    const layerSet = new Set(scope.archLayer ?? []);
    return dataset.patterns.filter((p) => {
        const name = getPatternName(p);
        if (nameSet.has(name))
            return true;
        if (p.archContext !== undefined && contextSet.has(p.archContext))
            return true;
        if (p.include?.some((v) => viewSet.has(v)) === true)
            return true;
        if (p.archLayer !== undefined && layerSet.has(p.archLayer))
            return true;
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
function collectNeighborPatterns(dataset, scopeNames) {
    const neighborNames = new Set();
    const relationships = dataset.relationshipIndex ?? {};
    for (const name of scopeNames) {
        const rel = relationships[name];
        if (!rel)
            continue;
        for (const target of rel.uses) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        for (const target of rel.dependsOn) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        for (const target of rel.implementsPatterns) {
            if (!scopeNames.has(target))
                neighborNames.add(target);
        }
        if (rel.extendsPattern !== undefined && !scopeNames.has(rel.extendsPattern)) {
            neighborNames.add(rel.extendsPattern);
        }
    }
    if (neighborNames.size === 0)
        return [];
    return dataset.patterns.filter((p) => neighborNames.has(getPatternName(p)));
}
/** Extract shared setup from scope + dataset into a reusable context */
function prepareDiagramContext(dataset, scope) {
    const scopePatterns = collectScopePatterns(dataset, scope);
    if (scopePatterns.length === 0)
        return undefined;
    const nodeIds = new Map();
    const scopeNames = new Set();
    for (const pattern of scopePatterns) {
        const name = getPatternName(pattern);
        scopeNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    const neighborPatterns = collectNeighborPatterns(dataset, scopeNames);
    const neighborNames = new Set();
    for (const pattern of neighborPatterns) {
        const name = getPatternName(pattern);
        neighborNames.add(name);
        nodeIds.set(name, sanitizeNodeId(name));
    }
    const relationships = dataset.relationshipIndex ?? {};
    const allNames = new Set([...scopeNames, ...neighborNames]);
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
function emitFlowchartEdges(ctx, showLabels) {
    const lines = [];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    for (const sourceName of ctx.allNames) {
        const sourceId = ctx.nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
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
function buildFlowchartDiagram(ctx, scope) {
    const direction = scope.direction ?? 'TB';
    const showLabels = scope.showEdgeLabels !== false;
    const lines = [`graph ${direction}`];
    // Group scope patterns by archContext for subgraphs
    const byContext = new Map();
    const noContext = [];
    for (const pattern of ctx.scopePatterns) {
        if (pattern.archContext !== undefined) {
            const group = byContext.get(pattern.archContext) ?? [];
            group.push(pattern);
            byContext.set(pattern.archContext, group);
        }
        else {
            noContext.push(pattern);
        }
    }
    // Emit context subgraphs
    for (const [context, patterns] of [...byContext.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
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
function buildSequenceDiagram(ctx) {
    const lines = ['sequenceDiagram'];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
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
        if (!rel)
            continue;
        for (const type of edgeTypes) {
            for (const target of rel[type]) {
                if (ctx.allNames.has(target)) {
                    const arrow = SEQUENCE_ARROWS[type];
                    lines.push(`    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(target)}: ${EDGE_LABELS[type]}`);
                }
            }
        }
        if (rel.extendsPattern !== undefined && ctx.allNames.has(rel.extendsPattern)) {
            const arrow = SEQUENCE_ARROWS.extendsPattern;
            lines.push(`    ${sanitizeNodeId(sourceName)} ${arrow} ${sanitizeNodeId(rel.extendsPattern)}: ${EDGE_LABELS.extendsPattern}`);
        }
    }
    return lines;
}
/** Build a Mermaid state diagram with transitions and pseudo-states (DD-3) */
function buildStateDiagram(ctx, scope) {
    const showLabels = scope.showEdgeLabels !== false;
    const lines = ['stateDiagram-v2'];
    // Track incoming/outgoing dependsOn edges for pseudo-states
    const hasIncoming = new Set();
    const hasOutgoing = new Set();
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
        if (!rel)
            continue;
        for (const target of rel.dependsOn) {
            if (!ctx.allNames.has(target))
                continue;
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
const FSM_TRANSITION_LABELS = {
    roadmap: { active: 'Start work', deferred: 'Postpone', roadmap: 'Stay in planning' },
    active: { completed: 'All deliverables done', roadmap: 'Blocked / regressed' },
    deferred: { roadmap: 'Resume planning' },
};
/** Display names for protection levels in diagram notes */
const PROTECTION_DISPLAY = {
    none: 'none',
    scope: 'scope-locked',
    hard: 'hard-locked',
};
/** Build FSM lifecycle state diagram from VALID_TRANSITIONS and PROTECTION_LEVELS */
function buildFsmLifecycleStateDiagram() {
    const lines = ['stateDiagram-v2'];
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
        }
        else {
            for (const to of targets) {
                const label = FSM_TRANSITION_LABELS[from]?.[to];
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
function buildGenerationPipelineSequenceDiagram() {
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
/** Build a Mermaid C4 context diagram with system boundaries */
function buildC4Diagram(ctx, scope) {
    const showLabels = scope.showEdgeLabels !== false;
    const lines = ['C4Context'];
    if (scope.title !== undefined) {
        lines.push(`    title ${scope.title}`);
    }
    // Group scope patterns by archContext for system boundaries
    const byContext = new Map();
    const noContext = [];
    for (const pattern of ctx.scopePatterns) {
        if (pattern.archContext !== undefined) {
            const group = byContext.get(pattern.archContext) ?? [];
            group.push(pattern);
            byContext.set(pattern.archContext, group);
        }
        else {
            noContext.push(pattern);
        }
    }
    // Emit system boundaries
    for (const [context, patterns] of [...byContext.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
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
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    for (const sourceName of ctx.allNames) {
        const sourceId = ctx.nodeIds.get(sourceName);
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
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
function buildClassDiagram(ctx) {
    const lines = ['classDiagram'];
    const edgeTypes = ['uses', 'dependsOn', 'implementsPatterns'];
    // Class arrow styles per relationship type
    const classArrows = {
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
        if (sourceId === undefined)
            continue;
        const rel = ctx.relationships[sourceName];
        if (!rel)
            continue;
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
function buildScopedDiagram(dataset, scope) {
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
    const ctx = prepareDiagramContext(dataset, scope);
    if (ctx === undefined)
        return [];
    let diagramLines;
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
//# sourceMappingURL=reference.js.map