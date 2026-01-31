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
import type { RenderableDocument } from './schema.js';
import { renderDocumentWithFiles, type OutputFile } from './render.js';

// Default codec instances
import {
  PatternsDocumentCodec,
  RoadmapDocumentCodec,
  CompletedMilestonesCodec,
  CurrentWorkCodec,
  RequirementsDocumentCodec,
  SessionContextCodec,
  RemainingWorkCodec,
  PrChangesCodec,
  AdrDocumentCodec,
  PlanningChecklistCodec,
  SessionPlanCodec,
  SessionFindingsCodec,
  ChangelogCodec,
  TraceabilityCodec,
  OverviewCodec,
  BusinessRulesCodec,
  ArchitectureDocumentCodec,
  TaxonomyDocumentCodec,
} from './codecs/index.js';

// Factory functions for creating codecs with options
import {
  createPatternsCodec,
  createRoadmapCodec,
  createMilestonesCodec,
  createCurrentWorkCodec,
  createRequirementsCodec,
  createSessionContextCodec,
  createRemainingWorkCodec,
  createPrChangesCodec,
  createAdrCodec,
  createPlanningChecklistCodec,
  createSessionPlanCodec,
  createSessionFindingsCodec,
  createChangelogCodec,
  createTraceabilityCodec,
  createOverviewCodec,
  createBusinessRulesCodec,
  createArchitectureCodec,
  createTaxonomyCodec,
} from './codecs/index.js';

// Codec options types
import type {
  PatternsCodecOptions,
  RoadmapCodecOptions,
  CompletedMilestonesCodecOptions,
  CurrentWorkCodecOptions,
  RequirementsCodecOptions,
  SessionCodecOptions,
  RemainingWorkCodecOptions,
  PrChangesCodecOptions,
  AdrCodecOptions,
  PlanningChecklistCodecOptions,
  SessionPlanCodecOptions,
  SessionFindingsCodecOptions,
  ChangelogCodecOptions,
  TraceabilityCodecOptions,
  OverviewCodecOptions,
  BusinessRulesCodecOptions,
  ArchitectureCodecOptions,
  TaxonomyCodecOptions,
} from './codecs/index.js';

// Shared codec types for type-safe factory invocation
import type { DocumentCodec, BaseCodecOptions } from './codecs/types/base.js';

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
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

// ═══════════════════════════════════════════════════════════════════════════
// Codec Options Type
// ═══════════════════════════════════════════════════════════════════════════

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
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Map
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map document types to their default codecs (no options)
 */
const CODEC_MAP = {
  patterns: PatternsDocumentCodec,
  roadmap: RoadmapDocumentCodec,
  milestones: CompletedMilestonesCodec,
  current: CurrentWorkCodec,
  requirements: RequirementsDocumentCodec,
  session: SessionContextCodec,
  remaining: RemainingWorkCodec,
  'pr-changes': PrChangesCodec,
  adrs: AdrDocumentCodec,
  'planning-checklist': PlanningChecklistCodec,
  'session-plan': SessionPlanCodec,
  'session-findings': SessionFindingsCodec,
  changelog: ChangelogCodec,
  traceability: TraceabilityCodec,
  overview: OverviewCodec,
  'business-rules': BusinessRulesCodec,
  architecture: ArchitectureDocumentCodec,
  taxonomy: TaxonomyDocumentCodec,
} as const;

/**
 * Map document types to their factory functions.
 * Used when options are provided to create a codec with custom configuration.
 */
const CODEC_FACTORY_MAP = {
  patterns: createPatternsCodec,
  roadmap: createRoadmapCodec,
  milestones: createMilestonesCodec,
  current: createCurrentWorkCodec,
  requirements: createRequirementsCodec,
  session: createSessionContextCodec,
  remaining: createRemainingWorkCodec,
  'pr-changes': createPrChangesCodec,
  adrs: createAdrCodec,
  'planning-checklist': createPlanningChecklistCodec,
  'session-plan': createSessionPlanCodec,
  'session-findings': createSessionFindingsCodec,
  changelog: createChangelogCodec,
  traceability: createTraceabilityCodec,
  overview: createOverviewCodec,
  'business-rules': createBusinessRulesCodec,
  architecture: createArchitectureCodec,
  taxonomy: createTaxonomyCodec,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Generation Functions
// ═══════════════════════════════════════════════════════════════════════════

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
export function generateDocument(
  type: DocumentType,
  dataset: MasterDataset,
  options?: CodecOptions
): OutputFile[] {
  const outputPath = DOCUMENT_TYPES[type].outputPath;

  // Get options for this specific document type
  const typeOptions = options?.[type];

  // Use factory function if options provided, otherwise use default codec
  // Note: We cast to the common factory signature because TypeScript can't correlate
  // CODEC_FACTORY_MAP[type] with CodecOptions[type] at compile time. This is type-safe
  // because all options extend BaseCodecOptions and all factories return DocumentCodec.
  let codec: DocumentCodec;
  if (typeOptions) {
    const factory = CODEC_FACTORY_MAP[type] as (opts?: BaseCodecOptions) => DocumentCodec;
    codec = factory(typeOptions);
  } else {
    codec = CODEC_MAP[type];
  }

  // Decode: MasterDataset → RenderableDocument
  const doc = codec.decode(dataset) as RenderableDocument;

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
export function generateDocuments(
  types: DocumentType[],
  dataset: MasterDataset,
  options?: CodecOptions
): OutputFile[] {
  const allFiles: OutputFile[] = [];

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
export function generateAllDocuments(dataset: MasterDataset, options?: CodecOptions): OutputFile[] {
  const types = Object.keys(DOCUMENT_TYPES) as DocumentType[];
  return generateDocuments(types, dataset, options);
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get available document types
 */
export function getAvailableDocumentTypes(): DocumentType[] {
  return Object.keys(DOCUMENT_TYPES) as DocumentType[];
}

/**
 * Check if a string is a valid document type
 */
export function isValidDocumentType(type: string): type is DocumentType {
  return type in DOCUMENT_TYPES;
}

/**
 * Get document type info
 */
export function getDocumentTypeInfo(type: DocumentType): {
  outputPath: string;
  description: string;
} {
  return DOCUMENT_TYPES[type];
}
