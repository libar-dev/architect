/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DocumentGenerator
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 *
 * ## Document Generation
 *
 * Simplified document generation using codecs.
 * Replaces the complex BuiltInGenerator + SectionRegistry pattern.
 *
 * ### When to Use
 *
 * - When generating specific document types from MasterDataset
 * - When needing high-level generation API without direct codec usage
 * - When building custom documentation workflows
 *
 * Flow: MasterDataset → Codec → RenderableDocument → Renderer → Markdown
 */
import { renderDocumentWithFiles } from './render.js';
import { Result } from '../types/result.js';
// Default codec instances
import { PatternsDocumentCodec, RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec, RequirementsDocumentCodec, SessionContextCodec, RemainingWorkCodec, PrChangesCodec, AdrDocumentCodec, PlanningChecklistCodec, SessionPlanCodec, SessionFindingsCodec, ChangelogCodec, TraceabilityCodec, OverviewCodec, BusinessRulesCodec, ArchitectureDocumentCodec, TaxonomyDocumentCodec, ValidationRulesCodec, } from './codecs/index.js';
// Factory functions for creating codecs with options
import { createPatternsCodec, createRoadmapCodec, createMilestonesCodec, createCurrentWorkCodec, createRequirementsCodec, createSessionContextCodec, createRemainingWorkCodec, createPrChangesCodec, createAdrCodec, createPlanningChecklistCodec, createSessionPlanCodec, createSessionFindingsCodec, createChangelogCodec, createTraceabilityCodec, createOverviewCodec, createBusinessRulesCodec, createArchitectureCodec, createTaxonomyCodec, createValidationRulesCodec, } from './codecs/index.js';
// ═══════════════════════════════════════════════════════════════════════════
// Document Types
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Available document types and their output paths
 */
export const DOCUMENT_TYPES = {
    patterns: {
        outputPath: 'PATTERNS.md',
        description: 'Pattern registry with category details',
    },
    roadmap: {
        outputPath: 'ROADMAP.md',
        description: 'Development roadmap by phase',
    },
    milestones: {
        outputPath: 'COMPLETED-MILESTONES.md',
        description: 'Historical completed milestones',
    },
    current: {
        outputPath: 'CURRENT-WORK.md',
        description: 'Active development work in progress',
    },
    requirements: {
        outputPath: 'PRODUCT-REQUIREMENTS.md',
        description: 'Product requirements by area/role',
    },
    session: {
        outputPath: 'SESSION-CONTEXT.md',
        description: 'Current session context and focus',
    },
    remaining: {
        outputPath: 'REMAINING-WORK.md',
        description: 'Aggregate view of incomplete work',
    },
    'pr-changes': {
        outputPath: 'working/PR-CHANGES.md',
        description: 'PR-scoped changes for review',
    },
    adrs: {
        outputPath: 'DECISIONS.md',
        description: 'Architecture Decision Records',
    },
    'planning-checklist': {
        outputPath: 'PLANNING-CHECKLIST.md',
        description: 'Pre-planning questions and Definition of Done',
    },
    'session-plan': {
        outputPath: 'SESSION-PLAN.md',
        description: 'Implementation plans for phases',
    },
    'session-findings': {
        outputPath: 'SESSION-FINDINGS.md',
        description: 'Retrospective discoveries for roadmap refinement',
    },
    changelog: {
        outputPath: 'CHANGELOG-GENERATED.md',
        description: 'Keep a Changelog format changelog',
    },
    traceability: {
        outputPath: 'TRACEABILITY.md',
        description: 'Timeline to behavior file coverage',
    },
    overview: {
        outputPath: 'OVERVIEW.md',
        description: 'Project architecture overview',
    },
    'business-rules': {
        outputPath: 'BUSINESS-RULES.md',
        description: 'Business rules and invariants by domain',
    },
    architecture: {
        outputPath: 'ARCHITECTURE.md',
        description: 'Architecture diagrams (component and layered views)',
    },
    taxonomy: {
        outputPath: 'TAXONOMY.md',
        description: 'Tag taxonomy configuration reference',
    },
    'validation-rules': {
        outputPath: 'VALIDATION-RULES.md',
        description: 'Process Guard validation rules reference',
    },
};
// Private storage for the CodecRegistry
const _codecStore = new Map();
const _factoryStore = new Map();
/**
 * Registry for document codecs providing a single source of truth.
 *
 * The CodecRegistry centralizes codec and factory registration, eliminating
 * the need to manually synchronize CODEC_MAP and CODEC_FACTORY_MAP.
 *
 * @example
 * ```typescript
 * // Register a codec and its factory
 * CodecRegistry.register('patterns', PatternsDocumentCodec);
 * CodecRegistry.registerFactory('patterns', createPatternsCodec);
 *
 * // Retrieve codec or factory
 * const codec = CodecRegistry.get('patterns');
 * const factory = CodecRegistry.getFactory('patterns');
 * ```
 */
export const CodecRegistry = {
    /**
     * Register a default codec for a document type.
     *
     * @param type - The document type to register
     * @param codec - The codec instance to use
     */
    register(type, codec) {
        _codecStore.set(type, codec);
    },
    /**
     * Register a factory function for a document type.
     *
     * Factory functions are used when codec options are provided,
     * allowing customization of codec behavior at runtime.
     *
     * @param type - The document type to register
     * @param factory - The factory function to create codecs with options
     */
    registerFactory(type, factory) {
        _factoryStore.set(type, factory);
    },
    /**
     * Get the default codec for a document type.
     *
     * @param type - The document type to retrieve
     * @returns The codec instance, or undefined if not registered
     */
    get(type) {
        return _codecStore.get(type);
    },
    /**
     * Get the factory function for a document type.
     *
     * @param type - The document type to retrieve
     * @returns The factory function, or undefined if not registered
     */
    getFactory(type) {
        return _factoryStore.get(type);
    },
    /**
     * Check if a codec is registered for a document type.
     *
     * @param type - The document type to check
     * @returns True if a codec is registered
     */
    has(type) {
        return _codecStore.has(type);
    },
    /**
     * Check if a factory is registered for a document type.
     *
     * @param type - The document type to check
     * @returns True if a factory is registered
     */
    hasFactory(type) {
        return _factoryStore.has(type);
    },
    /**
     * Get all registered document types.
     *
     * @returns Array of registered document types
     */
    getRegisteredTypes() {
        return Array.from(_codecStore.keys());
    },
    /**
     * Clear all registrations (useful for testing).
     */
    clear() {
        _codecStore.clear();
        _factoryStore.clear();
    },
};
// ═══════════════════════════════════════════════════════════════════════════
// Registry Initialization
// ═══════════════════════════════════════════════════════════════════════════
// Register all default codecs
CodecRegistry.register('patterns', PatternsDocumentCodec);
CodecRegistry.register('roadmap', RoadmapDocumentCodec);
CodecRegistry.register('milestones', CompletedMilestonesCodec);
CodecRegistry.register('current', CurrentWorkCodec);
CodecRegistry.register('requirements', RequirementsDocumentCodec);
CodecRegistry.register('session', SessionContextCodec);
CodecRegistry.register('remaining', RemainingWorkCodec);
CodecRegistry.register('pr-changes', PrChangesCodec);
CodecRegistry.register('adrs', AdrDocumentCodec);
CodecRegistry.register('planning-checklist', PlanningChecklistCodec);
CodecRegistry.register('session-plan', SessionPlanCodec);
CodecRegistry.register('session-findings', SessionFindingsCodec);
CodecRegistry.register('changelog', ChangelogCodec);
CodecRegistry.register('traceability', TraceabilityCodec);
CodecRegistry.register('overview', OverviewCodec);
CodecRegistry.register('business-rules', BusinessRulesCodec);
CodecRegistry.register('architecture', ArchitectureDocumentCodec);
CodecRegistry.register('taxonomy', TaxonomyDocumentCodec);
CodecRegistry.register('validation-rules', ValidationRulesCodec);
// Register all factory functions (used when codec options are provided)
CodecRegistry.registerFactory('patterns', createPatternsCodec);
CodecRegistry.registerFactory('roadmap', createRoadmapCodec);
CodecRegistry.registerFactory('milestones', createMilestonesCodec);
CodecRegistry.registerFactory('current', createCurrentWorkCodec);
CodecRegistry.registerFactory('requirements', createRequirementsCodec);
CodecRegistry.registerFactory('session', createSessionContextCodec);
CodecRegistry.registerFactory('remaining', createRemainingWorkCodec);
CodecRegistry.registerFactory('pr-changes', createPrChangesCodec);
CodecRegistry.registerFactory('adrs', createAdrCodec);
CodecRegistry.registerFactory('planning-checklist', createPlanningChecklistCodec);
CodecRegistry.registerFactory('session-plan', createSessionPlanCodec);
CodecRegistry.registerFactory('session-findings', createSessionFindingsCodec);
CodecRegistry.registerFactory('changelog', createChangelogCodec);
CodecRegistry.registerFactory('traceability', createTraceabilityCodec);
CodecRegistry.registerFactory('overview', createOverviewCodec);
CodecRegistry.registerFactory('business-rules', createBusinessRulesCodec);
CodecRegistry.registerFactory('architecture', createArchitectureCodec);
CodecRegistry.registerFactory('taxonomy', createTaxonomyCodec);
CodecRegistry.registerFactory('validation-rules', createValidationRulesCodec);
// ═══════════════════════════════════════════════════════════════════════════
// Generation Functions
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Generate a single document type with Result-based error handling.
 *
 * This function wraps codec.decode() and renderDocumentWithFiles() in try/catch,
 * returning a Result type instead of throwing exceptions. Use this when you need
 * explicit error handling without try/catch at the call site.
 *
 * @param type - Document type to generate
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options
 * @returns Result containing OutputFile[] on success, or GenerationError on failure
 *
 * @example
 * ```typescript
 * const result = generateDocumentSafe("patterns", masterDataset);
 * if (Result.isOk(result)) {
 *   for (const file of result.value) {
 *     fs.writeFileSync(file.path, file.content);
 *   }
 * } else {
 *   console.error(`Failed to generate ${result.error.documentType}: ${result.error.message}`);
 * }
 * ```
 */
export function generateDocumentSafe(type, dataset, options) {
    const outputPath = DOCUMENT_TYPES[type].outputPath;
    // Get options for this specific document type
    const typeOptions = options?.[type];
    // Use factory function if options provided, otherwise use default codec
    let codec;
    if (typeOptions !== undefined) {
        const factory = CodecRegistry.getFactory(type);
        if (factory !== undefined) {
            codec = factory(typeOptions);
        }
    }
    codec ??= CodecRegistry.get(type);
    if (codec === undefined) {
        return Result.err({
            documentType: type,
            message: `No codec registered for document type: ${type}`,
            phase: 'decode',
        });
    }
    // Decode: MasterDataset → RenderableDocument (with error handling)
    let doc;
    try {
        doc = codec.decode(dataset);
    }
    catch (err) {
        return Result.err({
            documentType: type,
            message: err instanceof Error ? err.message : String(err),
            cause: err instanceof Error ? err : undefined,
            phase: 'decode',
        });
    }
    // Render: RenderableDocument → OutputFile[] (with error handling)
    try {
        const files = renderDocumentWithFiles(doc, outputPath);
        return Result.ok(files);
    }
    catch (err) {
        return Result.err({
            documentType: type,
            message: err instanceof Error ? err.message : String(err),
            cause: err instanceof Error ? err : undefined,
            phase: 'render',
        });
    }
}
/**
 * Generate a single document type
 *
 * @param type - Document type to generate
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options (e.g., changedFiles for PR changes)
 * @returns Array of output files (main + additional for progressive disclosure)
 *
 * When options are provided for the requested document type, the factory function
 * is used to create a codec with custom configuration. Otherwise, the default
 * codec instance is used.
 *
 * **Error Handling:** This function may throw if codec.decode() or rendering fails.
 * For explicit error handling without exceptions, use `generateDocumentSafe()` which
 * returns a Result type instead.
 *
 * @example
 * ```typescript
 * // Without options (uses default codec)
 * const files = generateDocument("patterns", masterDataset);
 *
 * // With options (uses factory function)
 * const files = generateDocument("pr-changes", masterDataset, {
 *   "pr-changes": { changedFiles: ["src/foo.ts"], releaseFilter: "v0.2.0" }
 * });
 * ```
 */
export function generateDocument(type, dataset, options) {
    const outputPath = DOCUMENT_TYPES[type].outputPath;
    // Get options for this specific document type
    const typeOptions = options?.[type];
    // Use factory function if options provided, otherwise use default codec
    let codec;
    if (typeOptions !== undefined) {
        const factory = CodecRegistry.getFactory(type);
        if (factory !== undefined) {
            codec = factory(typeOptions);
        }
    }
    codec ??= CodecRegistry.get(type);
    if (codec === undefined) {
        throw new Error(`No codec registered for document type: ${type}`);
    }
    // Decode: MasterDataset → RenderableDocument
    const doc = codec.decode(dataset);
    // Render: RenderableDocument → OutputFile[]
    return renderDocumentWithFiles(doc, outputPath);
}
/**
 * Generate multiple document types
 *
 * @param types - Document types to generate
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options
 * @returns Array of all output files
 */
export function generateDocuments(types, dataset, options) {
    const allFiles = [];
    for (const type of types) {
        const files = generateDocument(type, dataset, options);
        allFiles.push(...files);
    }
    return allFiles;
}
/**
 * Generate all document types
 *
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options
 * @returns Array of all output files
 */
export function generateAllDocuments(dataset, options) {
    const types = Object.keys(DOCUMENT_TYPES);
    return generateDocuments(types, dataset, options);
}
// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Get available document types
 */
export function getAvailableDocumentTypes() {
    return Object.keys(DOCUMENT_TYPES);
}
/**
 * Check if a string is a valid document type
 */
export function isValidDocumentType(type) {
    return type in DOCUMENT_TYPES;
}
/**
 * Get document type info
 */
export function getDocumentTypeInfo(type) {
    return DOCUMENT_TYPES[type];
}
//# sourceMappingURL=generate.js.map