/**
 * @architect
 */

/**
 * @architect-core @architect-intro
 * @architect-pattern PublicAPI
 * @architect-status completed
 *
 * ## PublicAPI - Package Entry Point
 *
 * Main entry point for the @libar-dev/architect package.
 * Exports the three-stage pipeline (Scanner → Extractor → Generator) for
 * extracting documentation directly from TypeScript source code.
 *
 * **Key Features:**
 * - Three-stage pipeline: Scanner → Extractor → Generator
 * - Tag-based categorization with priority inference
 * - Composable section-based document generation
 * - JSON-configurable generators
 *
 * ### When to Use
 *
 * - Use when importing the package's public API in client code
 * - Use for accessing scanner, extractor, and generator modules
 */

// ============================================================================
// Configuration API (Primary Entry Point for External Users)
// ============================================================================

/**
 * Configuration API for creating customized Architect instances.
 *
 * @example
 * ```typescript
 * import { createArchitect } from '@libar-dev/architect';
 *
 * // Use the default libar-generic preset for non-DDD projects
 * const dp = createArchitect();
 *
 * // Or customize the tag prefix
 * const dp = createArchitect({
 *   tagPrefix: "@my-project-",
 *   fileOptInTag: "@my-project"
 * });
 * ```
 */
export { createArchitect, type CreateArchitectOptions } from './config/factory.js';

export type { ArchitectConfig, ArchitectInstance, RegexBuilders } from './config/types.js';

export { createRegexBuilders } from './config/regex-builders.js';

export {
  LIBAR_GENERIC_PRESET,
  DDD_ES_CQRS_PRESET,
  PRESETS,
  type PresetName,
} from './config/presets.js';

// Core types (schema-inferred)
export * from './types/index.js';

// Scanner functionality
export * from './scanner/index.js';

// Extractor functionality
export * from './extractor/index.js';

// Validation schemas (for runtime validation)
export * from './validation-schemas/index.js';

// ============================================================================
// NEW: Composable Generators Module (Recommended)
// ============================================================================

/**
 * New section-based generator system.
 *
 * Use this for all new code. Provides composable sections, JSON configuration,
 * and cleaner API design.
 *
 * @example
 * ```typescript
 * import { generatorRegistry } from '@libar-dev/architect/generators';
 * import '@libar-dev/architect/generators/built-in';
 *
 * const generator = generatorRegistry.get('patterns');
 * const output = await generator.generate(patterns, context);
 * ```
 */
export * as generators from './generators/index.js';

// ============================================================================
// Renderable Document Model (RDM) - Codec-based generation
// ============================================================================

/**
 * RenderableDocument Model for codec-based document generation.
 *
 * New architecture that uses Zod 4 codecs to transform PatternGraph into
 * RenderableDocuments, which are rendered to markdown via a universal renderer.
 *
 * @example
 * ```typescript
 * import { generateDocument, generateAllDocuments } from '@libar-dev/architect/renderable';
 *
 * // Generate a single document type
 * const files = generateDocument("patterns", patternGraph);
 *
 * // Generate all document types
 * const allFiles = generateAllDocuments(patternGraph);
 * ```
 */
export * as renderable from './renderable/index.js';

// ============================================================================
// Lint Module - Pattern & Process Validation
// ============================================================================

/**
 * Lint module for pattern annotation quality and process validation.
 *
 * Includes:
 * - **Rules & Engine**: Pattern annotation quality checking
 * - **Process Guard**: FSM validation, change detection, protection enforcement
 *
 * @example
 * ```typescript
 * import { lintFiles, validateChanges } from '@libar-dev/architect/lint';
 *
 * // Lint pattern annotations
 * const result = await lintFiles(['src/**\/*.ts']);
 *
 * // Validate process changes (pre-commit)
 * const validation = validateChanges(input);
 * if (hasErrors(validation)) {
 *   console.error('Process violations detected');
 * }
 * ```
 */
export * as lint from './lint/index.js';
