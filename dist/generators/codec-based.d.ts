/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CodecBasedGenerator
 * @libar-docs-status completed
 *
 * ## Codec-Based Generator
 *
 * Adapts the new RenderableDocument Model (RDM) codec system to the
 * existing DocumentGenerator interface. This allows codec-based document
 * generation to work seamlessly with the existing orchestrator.
 *
 * Architecture:
 * ```
 * GeneratorContext.masterDataset → Codec.decode() → RenderableDocument → renderDocumentWithFiles() → OutputFile[]
 * ```
 */
import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from "./types.js";
import type { ExtractedPattern } from "../validation-schemas/index.js";
import { type DocumentType } from "../renderable/generate.js";
/**
 * Codec-based generator that wraps the new RDM system.
 *
 * Each instance handles a single document type and uses the corresponding
 * codec to transform MasterDataset into RenderableDocument, then renders
 * to markdown.
 */
export declare class CodecBasedGenerator implements DocumentGenerator {
    readonly name: string;
    private readonly documentType;
    readonly description: string;
    constructor(name: string, documentType: DocumentType);
    generate(_patterns: readonly ExtractedPattern[], context: GeneratorContext): Promise<GeneratorOutput>;
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
export declare function createCodecGenerator(name: string, documentType: DocumentType): DocumentGenerator;
/**
 * Available codec-based document types.
 * Re-exported from generate.ts for convenience.
 */
export { DOCUMENT_TYPES, type DocumentType } from "../renderable/generate.js";
//# sourceMappingURL=codec-based.d.ts.map