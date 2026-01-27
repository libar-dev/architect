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
// Generator registry (singleton + class for custom instances)
export { GeneratorRegistry, generatorRegistry } from './registry.js';
// Codec-based generators (RDM architecture)
export { CodecBasedGenerator, createCodecGenerator, DOCUMENT_TYPES, } from './codec-based.js';
// Orchestrator - programmatic API for documentation generation
export { generateDocumentation, mergePatterns, } from './orchestrator.js';
// Pipeline - MasterDataset transformation for ProcessStateAPI usage
export { transformToMasterDataset, } from './pipeline/index.js';
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
//# sourceMappingURL=index.js.map