/**
 * Generators Module
 *
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Generators Module
 *
 * RDM (RenderableDocument Model) based document generation system.
 * Uses Zod 4 codecs to transform MasterDataset into RenderableDocuments.
 *
 * ## Usage
 *
 * ```typescript
 * import { generatorRegistry } from '@libar-dev/delivery-process/generators';
 * import '@libar-dev/delivery-process/generators/built-in'; // Register built-in generators
 *
 * const generator = generatorRegistry.get('patterns');
 * const output = await generator.generate(patterns, context);
 * ```
 *
 * ### Key Concepts
 *
 * - **DocumentGenerator Protocol:** Minimal interface for pluggable generators
 * - **Codec-Based Generators:** Use Zod 4 codecs for type-safe transformations
 * - **Registry Pattern:** Explicit registration for transparency
 */
export type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from './types.js';
export { GeneratorRegistry, generatorRegistry } from './registry.js';
export { CodecBasedGenerator, createCodecGenerator, DOCUMENT_TYPES, type DocumentType, } from './codec-based.js';
export { generateDocumentation, type GenerateOptions, type GenerateResult, type GeneratedFile, type GenerationError, type GenerationWarning, } from './orchestrator.js';
export { transformToMasterDataset, type RawDataset, type RuntimeMasterDataset, } from './pipeline/index.js';
/**
 * NOTE: Built-in generators are NOT auto-registered.
 * Import './built-in/index.js' explicitly to register them:
 *
 * ```typescript
 * import '@libar-dev/delivery-process/generators/built-in';
 * ```
 *
 * This explicit registration makes side effects visible and prevents
 * accidental registration in contexts where it's not needed.
 */
//# sourceMappingURL=index.d.ts.map