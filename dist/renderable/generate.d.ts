/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DocumentGenerator
 * @libar-docs-status completed
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
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import { type OutputFile } from './render.js';
import type { PatternsCodecOptions, RoadmapCodecOptions, CompletedMilestonesCodecOptions, CurrentWorkCodecOptions, RequirementsCodecOptions, SessionCodecOptions, RemainingWorkCodecOptions, PrChangesCodecOptions, AdrCodecOptions, PlanningChecklistCodecOptions, SessionPlanCodecOptions, SessionFindingsCodecOptions, ChangelogCodecOptions, TraceabilityCodecOptions, OverviewCodecOptions, BusinessRulesCodecOptions, ArchitectureCodecOptions, TaxonomyCodecOptions, ValidationRulesCodecOptions } from './codecs/index.js';
/**
 * Available document types and their output paths
 */
export declare const DOCUMENT_TYPES: {
    readonly patterns: {
        readonly outputPath: "PATTERNS.md";
        readonly description: "Pattern registry with category details";
    };
    readonly roadmap: {
        readonly outputPath: "ROADMAP.md";
        readonly description: "Development roadmap by phase";
    };
    readonly milestones: {
        readonly outputPath: "COMPLETED-MILESTONES.md";
        readonly description: "Historical completed milestones";
    };
    readonly current: {
        readonly outputPath: "CURRENT-WORK.md";
        readonly description: "Active development work in progress";
    };
    readonly requirements: {
        readonly outputPath: "PRODUCT-REQUIREMENTS.md";
        readonly description: "Product requirements by area/role";
    };
    readonly session: {
        readonly outputPath: "SESSION-CONTEXT.md";
        readonly description: "Current session context and focus";
    };
    readonly remaining: {
        readonly outputPath: "REMAINING-WORK.md";
        readonly description: "Aggregate view of incomplete work";
    };
    readonly 'pr-changes': {
        readonly outputPath: "working/PR-CHANGES.md";
        readonly description: "PR-scoped changes for review";
    };
    readonly adrs: {
        readonly outputPath: "DECISIONS.md";
        readonly description: "Architecture Decision Records";
    };
    readonly 'planning-checklist': {
        readonly outputPath: "PLANNING-CHECKLIST.md";
        readonly description: "Pre-planning questions and Definition of Done";
    };
    readonly 'session-plan': {
        readonly outputPath: "SESSION-PLAN.md";
        readonly description: "Implementation plans for phases";
    };
    readonly 'session-findings': {
        readonly outputPath: "SESSION-FINDINGS.md";
        readonly description: "Retrospective discoveries for roadmap refinement";
    };
    readonly changelog: {
        readonly outputPath: "CHANGELOG-GENERATED.md";
        readonly description: "Keep a Changelog format changelog";
    };
    readonly traceability: {
        readonly outputPath: "TRACEABILITY.md";
        readonly description: "Timeline to behavior file coverage";
    };
    readonly overview: {
        readonly outputPath: "OVERVIEW.md";
        readonly description: "Project architecture overview";
    };
    readonly 'business-rules': {
        readonly outputPath: "BUSINESS-RULES.md";
        readonly description: "Business rules and invariants by domain";
    };
    readonly architecture: {
        readonly outputPath: "ARCHITECTURE.md";
        readonly description: "Architecture diagrams (component and layered views)";
    };
    readonly taxonomy: {
        readonly outputPath: "TAXONOMY.md";
        readonly description: "Tag taxonomy configuration reference";
    };
    readonly 'validation-rules': {
        readonly outputPath: "VALIDATION-RULES.md";
        readonly description: "Process Guard validation rules reference";
    };
};
export type DocumentType = keyof typeof DOCUMENT_TYPES;
/**
 * Union type for all codec-specific options.
 * Used to pass runtime options (e.g., changedFiles for PR changes) through
 * the CLI → Orchestrator → Generator → Codec pipeline.
 *
 * Each document type can optionally have its own options.
 * If options are provided for a document type, the factory function is used
 * instead of the default codec instance.
 *
 * @example
 * ```typescript
 * const options: CodecOptions = {
 *   "pr-changes": { changedFiles: ["src/foo.ts"], releaseFilter: "v0.2.0" }
 * };
 * generateDocument("pr-changes", dataset, options);
 * ```
 */
export interface CodecOptions {
    patterns?: PatternsCodecOptions;
    roadmap?: RoadmapCodecOptions;
    milestones?: CompletedMilestonesCodecOptions;
    current?: CurrentWorkCodecOptions;
    requirements?: RequirementsCodecOptions;
    session?: SessionCodecOptions;
    remaining?: RemainingWorkCodecOptions;
    'pr-changes'?: PrChangesCodecOptions;
    adrs?: AdrCodecOptions;
    'planning-checklist'?: PlanningChecklistCodecOptions;
    'session-plan'?: SessionPlanCodecOptions;
    'session-findings'?: SessionFindingsCodecOptions;
    changelog?: ChangelogCodecOptions;
    traceability?: TraceabilityCodecOptions;
    overview?: OverviewCodecOptions;
    'business-rules'?: BusinessRulesCodecOptions;
    architecture?: ArchitectureCodecOptions;
    taxonomy?: TaxonomyCodecOptions;
    'validation-rules'?: ValidationRulesCodecOptions;
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
export declare function generateDocument(type: DocumentType, dataset: MasterDataset, options?: CodecOptions): OutputFile[];
/**
 * Generate multiple document types
 *
 * @param types - Document types to generate
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options
 * @returns Array of all output files
 */
export declare function generateDocuments(types: DocumentType[], dataset: MasterDataset, options?: CodecOptions): OutputFile[];
/**
 * Generate all document types
 *
 * @param dataset - MasterDataset with pattern data
 * @param options - Optional codec-specific options
 * @returns Array of all output files
 */
export declare function generateAllDocuments(dataset: MasterDataset, options?: CodecOptions): OutputFile[];
/**
 * Get available document types
 */
export declare function getAvailableDocumentTypes(): DocumentType[];
/**
 * Check if a string is a valid document type
 */
export declare function isValidDocumentType(type: string): type is DocumentType;
/**
 * Get document type info
 */
export declare function getDocumentTypeInfo(type: DocumentType): {
    outputPath: string;
    description: string;
};
//# sourceMappingURL=generate.d.ts.map