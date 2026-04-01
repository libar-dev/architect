/**
 * @architect
 * @architect-core
 * @architect-pattern CodecBasedGenerator
 * @architect-status completed
 * @architect-arch-role service
 * @architect-arch-context generator
 * @architect-arch-layer application
 *
 * ## Codec-Based Generator
 *
 * Adapts the new RenderableDocument Model (RDM) codec system to the
 * existing DocumentGenerator interface. This allows codec-based document
 * generation to work seamlessly with the existing orchestrator.
 *
 * ### When to Use
 *
 * - When creating a new document type generator using the RDM codec pattern
 * - When adapting a Zod codec to the DocumentGenerator interface
 * - When understanding how codec-based generation integrates with the orchestrator
 *
 * Architecture:
 * ```
 * GeneratorContext.masterDataset → Codec.decode() → RenderableDocument → renderDocumentWithFiles() → OutputFile[]
 * ```
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from './types.js';
import type { ExtractedPattern } from '../validation-schemas/index.js';
import { generateDocument, type DocumentType, DOCUMENT_TYPES } from '../renderable/generate.js';
import type { CodecContextEnrichment } from '../renderable/codecs/types/base.js';

/**
 * Codec-based generator that wraps the new RDM system.
 *
 * Each instance handles a single document type and uses the corresponding
 * codec to transform MasterDataset into RenderableDocument, then renders
 * to markdown.
 */
export class CodecBasedGenerator implements DocumentGenerator {
  readonly description: string;

  constructor(
    readonly name: string,
    private readonly documentType: DocumentType
  ) {
    this.description = DOCUMENT_TYPES[documentType].description;
  }

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const dataset = context.masterDataset;

    // Build context enrichment from generator context fields
    const contextEnrichment: CodecContextEnrichment = {
      ...(context.projectMetadata !== undefined
        ? { projectMetadata: context.projectMetadata }
        : {}),
      ...(context.tagExampleOverrides !== undefined
        ? { tagExampleOverrides: context.tagExampleOverrides }
        : {}),
    };

    // Only pass enrichment if there are fields to enrich
    const hasEnrichment = Object.keys(contextEnrichment).length > 0;

    // Generate document using codec, passing through any codec-specific options
    const outputFiles = generateDocument(
      this.documentType,
      dataset,
      context.codecOptions,
      hasEnrichment ? contextEnrichment : undefined
    );

    return Promise.resolve({
      files: outputFiles,
    });
  }
}

/**
 * Create a codec-based generator for a specific document type.
 *
 * @param name - Generator name for registry
 * @param documentType - Document type key from DOCUMENT_TYPES
 * @returns DocumentGenerator instance
 *
 * @example
 * ```typescript
 * const generator = createCodecGenerator("patterns-v2", "patterns");
 * generatorRegistry.register(generator);
 * ```
 */
export function createCodecGenerator(name: string, documentType: DocumentType): DocumentGenerator {
  return new CodecBasedGenerator(name, documentType);
}

/**
 * Available codec-based document types.
 * Re-exported from generate.ts for convenience.
 */
export { DOCUMENT_TYPES, type DocumentType } from '../renderable/generate.js';
