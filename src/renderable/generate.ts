/**
 * @architect
 * @architect-core
 * @architect-pattern DocumentGenerator
 * @architect-status completed
 * @architect-arch-role service
 * @architect-arch-context renderer
 * @architect-arch-layer application
 *
 * ## Document Generation
 *
 * Simplified document generation using codecs.
 * Replaces the complex BuiltInGenerator + SectionRegistry pattern.
 *
 * ### When to Use
 *
 * - When generating specific document types from PatternGraph
 * - When needing high-level generation API without direct codec usage
 * - When building custom documentation workflows
 *
 * Flow: PatternGraph → Codec → RenderableDocument → Renderer → Markdown
 */

import type { PatternGraph } from '../validation-schemas/pattern-graph.js';
import type { RenderableDocument } from './schema.js';
import { renderDocumentWithFiles, type OutputFile } from './render.js';
import { Result } from '../types/result.js';

// Auto-registration: each codec file exports codecMeta; barrel collects all
import { ALL_CODEC_METAS } from './codecs/codec-registry.js';

// Codec options types (retained for CodecOptions interface type safety)
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
  ValidationRulesCodecOptions,
  ClaudeModuleCodecOptions,
  IndexCodecOptions,
} from './codecs/index.js';

// Shared codec types for type-safe factory invocation
import type {
  DocumentCodec,
  BaseCodecOptions,
  CodecContextEnrichment,
} from './codecs/types/base.js';
import { setCodecContextEnrichment, clearCodecContextEnrichment } from './codecs/types/base.js';

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
  'claude-modules': {
    outputPath: 'CLAUDE-MODULES.md',
    description: 'CLAUDE.md modules generated from annotated behavior specs',
  },
  index: {
    outputPath: 'INDEX.md',
    description: 'Navigation hub with editorial preamble and PatternGraph statistics',
  },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

/**
 * Per-document-type renderer overrides.
 * Derived from codecMeta.renderer fields — document types without a custom
 * renderer use the default `renderToMarkdown`.
 */
const DOCUMENT_TYPE_RENDERERS: Partial<Record<DocumentType, (doc: RenderableDocument) => string>> =
  Object.fromEntries(
    ALL_CODEC_METAS.filter(
      (m): m is typeof m & { renderer: NonNullable<typeof m.renderer> } => m.renderer !== undefined
    ).map((m) => [m.type, m.renderer])
  );

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
  'validation-rules'?: ValidationRulesCodecOptions;
  'claude-modules'?: ClaudeModuleCodecOptions;
  index?: IndexCodecOptions;
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Registry
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Factory function type for creating codecs with options.
 */
type CodecFactory = (opts?: BaseCodecOptions) => DocumentCodec;

// Private storage for the CodecRegistry
const _codecStore = new Map<DocumentType, DocumentCodec>();
const _factoryStore = new Map<DocumentType, CodecFactory>();

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
  register(type: DocumentType, codec: DocumentCodec): void {
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
  registerFactory(type: DocumentType, factory: CodecFactory): void {
    _factoryStore.set(type, factory);
  },

  /**
   * Get the default codec for a document type.
   *
   * @param type - The document type to retrieve
   * @returns The codec instance, or undefined if not registered
   */
  get(type: DocumentType): DocumentCodec | undefined {
    return _codecStore.get(type);
  },

  /**
   * Get the factory function for a document type.
   *
   * @param type - The document type to retrieve
   * @returns The factory function, or undefined if not registered
   */
  getFactory(type: DocumentType): CodecFactory | undefined {
    return _factoryStore.get(type);
  },

  /**
   * Check if a codec is registered for a document type.
   *
   * @param type - The document type to check
   * @returns True if a codec is registered
   */
  has(type: DocumentType): boolean {
    return _codecStore.has(type);
  },

  /**
   * Check if a factory is registered for a document type.
   *
   * @param type - The document type to check
   * @returns True if a factory is registered
   */
  hasFactory(type: DocumentType): boolean {
    return _factoryStore.has(type);
  },

  /**
   * Get all registered document types.
   *
   * @returns Array of registered document types
   */
  getRegisteredTypes(): DocumentType[] {
    return Array.from(_codecStore.keys());
  },

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    _codecStore.clear();
    _factoryStore.clear();
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Registry Initialization (Auto-registered from codecMeta exports)
// ═══════════════════════════════════════════════════════════════════════════

for (const meta of ALL_CODEC_METAS) {
  const type = meta.type as DocumentType;
  CodecRegistry.register(type, meta.defaultInstance);
  CodecRegistry.registerFactory(type, meta.factory);
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Error that occurred during document generation.
 *
 * Provides structured information about what went wrong during the
 * codec decode or render phase.
 */
export interface GenerationError {
  /** The document type that failed to generate */
  documentType: DocumentType;
  /** Error message describing what went wrong */
  message: string;
  /** The original error (if available) */
  cause?: Error | undefined;
  /** Phase where the error occurred */
  phase: 'decode' | 'render';
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Resolution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve the codec for a document type, using a factory if options are provided.
 */
function resolveCodec(type: DocumentType, options?: CodecOptions): DocumentCodec | undefined {
  const typeOptions = options?.[type];
  if (typeOptions !== undefined) {
    const factory = CodecRegistry.getFactory(type);
    if (factory !== undefined) {
      return factory(typeOptions);
    }
  }
  return CodecRegistry.get(type);
}

// ═══════════════════════════════════════════════════════════════════════════
// Generation Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Decode a document type to RenderableDocument without rendering to markdown.
 *
 * This is the Live Documentation API entry point: it invokes the codec's decode()
 * step and returns the structured RenderableDocument, skipping the markdown render
 * step entirely. Interactive consumers (Studio desktop, MCP clients) use this to
 * receive typed document blocks for native rendering.
 *
 * @param type - Document type to decode
 * @param dataset - PatternGraph with pattern data
 * @param options - Optional codec-specific options (e.g., patternName for design-review)
 * @param contextEnrichment - Optional runtime context (projectMetadata, tagExampleOverrides)
 * @returns Result containing RenderableDocument on success, or GenerationError on failure
 *
 * @example
 * ```typescript
 * const result = decodeDocumentSafe("architecture", patternGraph);
 * if (Result.isOk(result)) {
 *   // result.value is RenderableDocument — structured JSON, not markdown
 *   const doc = result.value;
 *   console.log(doc.title, doc.sections.length);
 * }
 * ```
 */
export function decodeDocumentSafe(
  type: DocumentType,
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): Result<RenderableDocument, GenerationError> {
  const codec = resolveCodec(type, options);
  if (codec === undefined) {
    return Result.err({
      documentType: type,
      message: `No codec registered for document type: "${type}". Available types: ${CodecRegistry.getRegisteredTypes().join(', ')}`,
      phase: 'decode',
    });
  }

  if (contextEnrichment) {
    setCodecContextEnrichment(contextEnrichment);
  }

  try {
    const doc = codec.decode(dataset) as RenderableDocument;
    return Result.ok(doc);
  } catch (err) {
    return Result.err({
      documentType: type,
      message: err instanceof Error ? err.message : String(err),
      cause: err instanceof Error ? err : undefined,
      phase: 'decode',
    });
  } finally {
    if (contextEnrichment) {
      clearCodecContextEnrichment();
    }
  }
}

/**
 * Decode a document type to RenderableDocument without rendering to markdown.
 *
 * Throwing variant of `decodeDocumentSafe()`. Use when you prefer exceptions
 * over Result-based error handling.
 *
 * @param type - Document type to decode
 * @param dataset - PatternGraph with pattern data
 * @param options - Optional codec-specific options
 * @param contextEnrichment - Optional runtime context
 * @returns RenderableDocument — the structured intermediate format
 * @throws Error if the codec is not registered or decode fails
 *
 * @example
 * ```typescript
 * const doc = decodeDocument("architecture", patternGraph);
 * // doc.sections contains heading, mermaid, table, paragraph blocks
 * ```
 */
export function decodeDocument(
  type: DocumentType,
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): RenderableDocument {
  const codec = resolveCodec(type, options);
  if (codec === undefined) {
    throw new Error(
      `No codec registered for document type: "${type}". Available types: ${CodecRegistry.getRegisteredTypes().join(', ')}`
    );
  }

  if (contextEnrichment) {
    setCodecContextEnrichment(contextEnrichment);
  }

  try {
    return codec.decode(dataset) as RenderableDocument;
  } finally {
    if (contextEnrichment) {
      clearCodecContextEnrichment();
    }
  }
}

/**
 * Generate a single document type with Result-based error handling.
 *
 * This function wraps codec.decode() and renderDocumentWithFiles() in try/catch,
 * returning a Result type instead of throwing exceptions. Use this when you need
 * explicit error handling without try/catch at the call site.
 *
 * @param type - Document type to generate
 * @param dataset - PatternGraph with pattern data
 * @param options - Optional codec-specific options
 * @returns Result containing OutputFile[] on success, or GenerationError on failure
 *
 * @example
 * ```typescript
 * const result = generateDocumentSafe("patterns", patternGraph);
 * if (Result.isOk(result)) {
 *   for (const file of result.value) {
 *     fs.writeFileSync(file.path, file.content);
 *   }
 * } else {
 *   console.error(`Failed to generate ${result.error.documentType}: ${result.error.message}`);
 * }
 * ```
 */
export function generateDocumentSafe(
  type: DocumentType,
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): Result<OutputFile[], GenerationError> {
  const outputPath = DOCUMENT_TYPES[type].outputPath;

  const codec = resolveCodec(type, options);
  if (codec === undefined) {
    return Result.err({
      documentType: type,
      message: `No codec registered for document type: "${type}". Available types: ${CodecRegistry.getRegisteredTypes().join(', ')}`,
      phase: 'decode',
    });
  }

  // Set context enrichment before decode (cleared in finally)
  if (contextEnrichment) {
    setCodecContextEnrichment(contextEnrichment);
  }

  try {
    // Decode: PatternGraph → RenderableDocument (with error handling)
    let doc: RenderableDocument;
    try {
      doc = codec.decode(dataset) as RenderableDocument;
    } catch (err) {
      return Result.err({
        documentType: type,
        message: err instanceof Error ? err.message : String(err),
        cause: err instanceof Error ? err : undefined,
        phase: 'decode',
      });
    }

    // Render: RenderableDocument → OutputFile[] (with error handling)
    try {
      const renderer = DOCUMENT_TYPE_RENDERERS[type];
      const files = renderDocumentWithFiles(doc, outputPath, renderer);
      return Result.ok(files);
    } catch (err) {
      return Result.err({
        documentType: type,
        message: err instanceof Error ? err.message : String(err),
        cause: err instanceof Error ? err : undefined,
        phase: 'render',
      });
    }
  } finally {
    if (contextEnrichment) {
      clearCodecContextEnrichment();
    }
  }
}

/**
 * Generate a single document type
 *
 * @param type - Document type to generate
 * @param dataset - PatternGraph with pattern data
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
 * const files = generateDocument("patterns", patternGraph);
 *
 * // With options (uses factory function)
 * const files = generateDocument("pr-changes", patternGraph, {
 *   "pr-changes": { changedFiles: ["src/foo.ts"], releaseFilter: "v0.2.0" }
 * });
 * ```
 */
export function generateDocument(
  type: DocumentType,
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): OutputFile[] {
  const outputPath = DOCUMENT_TYPES[type].outputPath;

  const codec = resolveCodec(type, options);
  if (codec === undefined) {
    throw new Error(
      `No codec registered for document type: "${type}". Available types: ${CodecRegistry.getRegisteredTypes().join(', ')}`
    );
  }

  // Set context enrichment before decode (cleared in finally)
  if (contextEnrichment) {
    setCodecContextEnrichment(contextEnrichment);
  }

  try {
    // Decode: PatternGraph → RenderableDocument
    const doc = codec.decode(dataset) as RenderableDocument;

    // Render: RenderableDocument → OutputFile[]
    const renderer = DOCUMENT_TYPE_RENDERERS[type];
    return renderDocumentWithFiles(doc, outputPath, renderer);
  } finally {
    if (contextEnrichment) {
      clearCodecContextEnrichment();
    }
  }
}

/**
 * Generate multiple document types
 *
 * @param types - Document types to generate
 * @param dataset - PatternGraph with pattern data
 * @param options - Optional codec-specific options
 * @param contextEnrichment - Optional runtime context (projectMetadata, tagExampleOverrides)
 * @returns Array of all output files
 */
export function generateDocuments(
  types: DocumentType[],
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): OutputFile[] {
  const allFiles: OutputFile[] = [];

  for (const type of types) {
    const files = generateDocument(type, dataset, options, contextEnrichment);
    allFiles.push(...files);
  }

  return allFiles;
}

/**
 * Generate all document types
 *
 * @param dataset - PatternGraph with pattern data
 * @param options - Optional codec-specific options
 * @param contextEnrichment - Optional runtime context (projectMetadata, tagExampleOverrides)
 * @returns Array of all output files
 */
export function generateAllDocuments(
  dataset: PatternGraph,
  options?: CodecOptions,
  contextEnrichment?: CodecContextEnrichment
): OutputFile[] {
  const types = Object.keys(DOCUMENT_TYPES) as DocumentType[];
  return generateDocuments(types, dataset, options, contextEnrichment);
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
