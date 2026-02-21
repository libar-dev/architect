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
 * ### When to Use
 *
 * - When importing generator types, registry, or orchestrator functions
 * - When building custom generators or extending the generation pipeline
 * - When programmatically generating documentation from code
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

// Core types and protocols
export type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from './types.js';

// Generator registry (singleton + class for custom instances)
export { GeneratorRegistry, generatorRegistry } from './registry.js';

// Codec-based generators (RDM architecture)
export {
  CodecBasedGenerator,
  createCodecGenerator,
  DOCUMENT_TYPES,
  type DocumentType,
} from './codec-based.js';

// Orchestrator - programmatic API for documentation generation
export {
  generateDocumentation,
  type GenerateOptions,
  type GenerateResult,
  type GeneratedFile,
  type GenerationError,
  type GenerationWarning,
} from './orchestrator.js';

// Pipeline - MasterDataset transformation for ProcessStateAPI usage
export {
  buildMasterDataset,
  type PipelineOptions,
  mergePatterns,
  transformToMasterDataset,
  type RawDataset,
  type RuntimeMasterDataset,
} from './pipeline/index.js';

// Product area and reference document config helpers (for downstream repo configs)
export {
  createProductAreaConfigs,
  PRODUCT_AREA_VALUES,
  type ProductAreaConfigOptions,
} from './built-in/reference-generators.js';

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
