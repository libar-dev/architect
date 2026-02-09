/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CodecBasedGenerator
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
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
    // Codec-based generation requires MasterDataset
    if (!context.masterDataset) {
      return Promise.resolve({
        files: [],
        errors: [
          {
            type: 'generator' as const,
            message: `Generator "${this.name}" requires MasterDataset in context but none was provided. Ensure the orchestrator creates a MasterDataset before running codec-based generators.`,
          },
        ],
      });
    }

    // Convert RuntimeMasterDataset to MasterDataset format
    // The RDM codecs expect the Zod-inferred MasterDataset type
    const dataset = context.masterDataset;

    // Generate document using codec, passing through any codec-specific options
    const outputFiles = generateDocument(this.documentType, dataset, context.codecOptions);

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
