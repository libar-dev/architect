/**
 * @libar-docs
 */
/**
 * @libar-docs-core @libar-docs-intro
 * @libar-docs-pattern PublicAPI
 * @libar-docs-status completed
 *
 * ## PublicAPI - Package Entry Point
 *
 * Main entry point for the @libar-dev/delivery-process package.
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
 * Configuration API for creating customized delivery-process instances.
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess, GENERIC_PRESET } from '@libar-dev/delivery-process';
 *
 * // Use generic preset for non-DDD projects
 * const dp = createDeliveryProcess({ preset: "generic" });
 *
 * // Or customize the tag prefix
 * const dp = createDeliveryProcess({
 *   tagPrefix: "@my-project-",
 *   fileOptInTag: "@my-project"
 * });
 * ```
 */
export { createDeliveryProcess } from './config/factory.js';
export { createRegexBuilders } from './config/regex-builders.js';
export { GENERIC_PRESET, LIBAR_GENERIC_PRESET, DDD_ES_CQRS_PRESET, PRESETS, } from './config/presets.js';
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
 * import { generatorRegistry } from '@libar-dev/delivery-process/generators';
 * import '@libar-dev/delivery-process/generators/built-in';
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
 * New architecture that uses Zod 4 codecs to transform MasterDataset into
 * RenderableDocuments, which are rendered to markdown via a universal renderer.
 *
 * @example
 * ```typescript
 * import { generateDocument, generateAllDocuments } from '@libar-dev/delivery-process/renderable';
 *
 * // Generate a single document type
 * const files = generateDocument("patterns", masterDataset);
 *
 * // Generate all document types
 * const allFiles = generateAllDocuments(masterDataset);
 * ```
 */
export * as renderable from './renderable/index.js';
// ============================================================================
// Process State API - Programmatic Query Interface
// ============================================================================
/**
 * ProcessStateAPI for programmatic access to delivery process state.
 *
 * Wraps MasterDataset with typed query methods for status, phase, FSM,
 * pattern, and timeline queries. Designed for Claude Code integration
 * and programmatic consumption.
 *
 * @example
 * ```typescript
 * import { createProcessStateAPI, type ProcessStateAPI } from '@libar-dev/delivery-process/api';
 *
 * const api = createProcessStateAPI(masterDataset);
 *
 * // Get current work
 * const activeWork = api.getCurrentWork();
 *
 * // Check transition validity
 * if (api.isValidTransition("roadmap", "active")) {
 *   console.log("Can start work");
 * }
 * ```
 */
export * as api from './api/index.js';
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
 * import { lintFiles, validateChanges } from '@libar-dev/delivery-process/lint';
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
//# sourceMappingURL=index.js.map