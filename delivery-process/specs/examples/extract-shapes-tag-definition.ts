/**
 * @libar-docs
 * @libar-docs-pattern ExtractShapesTagDefinition
 * @libar-docs-status roadmap
 * @libar-docs-phase 26
 *
 * ## extract-shapes Tag Definition
 *
 * This file documents the exact tag definition to add to registry-builder.ts
 * for the shape extraction feature.
 *
 * ### Location
 *
 * Add to `src/taxonomy/registry-builder.ts` in the `metadataTags` array,
 * after the existing relationship tags (around line 170).
 *
 * ### Integration Points
 *
 * Once added, the tag will be:
 * 1. Recognized by the scanner when parsing TypeScript files
 * 2. Available in ExtractedPattern.metadata
 * 3. Processed by the shape extractor during extraction
 * 4. Rendered by codecs when generating documentation
 */

import type { MetadataTagDefinitionForRegistry } from '../../../src/taxonomy/registry-builder.js';

// =============================================================================
// Tag Definition to Add
// =============================================================================

/**
 * The extract-shapes tag definition.
 *
 * Add this to the `metadataTags` array in registry-builder.ts:
 *
 * ```typescript
 * // After the 'api-ref' tag definition (around line 331)
 * {
 *   tag: 'extract-shapes',
 *   format: 'csv',
 *   purpose: 'TypeScript type names to extract from this file for documentation',
 *   example: '@libar-docs-extract-shapes DeciderInput, ValidationResult, ProcessViolation',
 * },
 * ```
 */
export const EXTRACT_SHAPES_TAG: MetadataTagDefinitionForRegistry = {
  tag: 'extract-shapes',
  format: 'csv',
  purpose: 'TypeScript type names to extract from this file for documentation',
  example: '@libar-docs-extract-shapes DeciderInput, ValidationResult, ProcessViolation',
};

// =============================================================================
// Related Schema Extension
// =============================================================================

/**
 * The ExtractedPattern schema needs to be extended to include extracted shapes.
 *
 * Add to `src/validation-schemas/extracted-pattern.ts`:
 *
 * ```typescript
 * import { ExtractedShapeSchema } from './extracted-shape.js';
 *
 * export const ExtractedPatternSchema = z.object({
 *   // ... existing fields ...
 *
 *   // NEW: Shapes extracted via @libar-docs-extract-shapes tag
 *   extractedShapes: z.array(ExtractedShapeSchema).optional(),
 * });
 * ```
 */

/**
 * Schema for extracted shapes (new file: extracted-shape.ts)
 *
 * ```typescript
 * import { z } from 'zod';
 *
 * export const ExtractedShapeSchema = z.object({
 *   name: z.string(),
 *   kind: z.enum(['interface', 'type', 'enum', 'function', 'const']),
 *   sourceText: z.string(),
 *   jsDoc: z.string().optional(),
 *   lineNumber: z.number(),
 *   typeParameters: z.array(z.string()).optional(),
 *   extends: z.array(z.string()).optional(),
 *   overloads: z.array(z.string()).optional(),
 *   exported: z.boolean(),
 * });
 *
 * export type ExtractedShape = z.infer<typeof ExtractedShapeSchema>;
 * ```
 */

// =============================================================================
// Usage Examples
// =============================================================================

/**
 * Example: Annotating a file for shape extraction
 *
 * ```typescript
 * // src/lint/process-guard/types.ts
 *
 * /**
 *  * @libar-docs
 *  * @libar-docs-pattern ProcessGuardTypes
 *  * @libar-docs-status completed
 *  * @libar-docs-extract-shapes DeciderInput, ValidationResult, ProcessViolation
 *  *
 *  * ## Process Guard Types
 *  *
 *  * Core types for the Process Guard validation decider.
 *  * /
 *
 * export interface DeciderInput {
 *   state: ProcessState;
 *   changes: ChangeDetection;
 *   options: ValidationOptions;
 * }
 *
 * export interface ValidationResult {
 *   valid: boolean;
 *   violations: ProcessViolation[];
 *   warnings: ProcessViolation[];
 * }
 *
 * export interface ProcessViolation {
 *   ruleId: string;
 *   severity: 'error' | 'warning';
 *   message: string;
 *   file: string;
 *   suggestion?: string;
 * }
 * ```
 */

// =============================================================================
// Extractor Integration
// =============================================================================

/**
 * The TypeScript extractor needs to call processExtractShapesTag when
 * it encounters the extract-shapes tag.
 *
 * Update `src/extractor/typescript-extractor.ts`:
 *
 * ```typescript
 * import { processExtractShapesTag } from './shape-extractor.js';
 *
 * // In the extraction logic, after parsing metadata:
 * if (metadata.extractShapes) {
 *   pattern.extractedShapes = processExtractShapesTag(
 *     sourceCode,
 *     metadata.extractShapes
 *   );
 * }
 * ```
 */

// =============================================================================
// Codec Integration
// =============================================================================

/**
 * Codecs need to render extracted shapes.
 *
 * Example helper for codecs (add to `src/renderable/codecs/shared-helpers.ts`):
 *
 * ```typescript
 * import { renderShapesAsMarkdown } from '../../extractor/shape-extractor.js';
 *
 * export function buildApiTypesSection(
 *   pattern: ExtractedPattern,
 *   options: { detailLevel: DetailLevel }
 * ): SectionBlock[] {
 *   if (!pattern.extractedShapes?.length) {
 *     return [];
 *   }
 *
 *   const grouped = options.detailLevel === 'summary';
 *   const markdown = renderShapesAsMarkdown(pattern.extractedShapes, {
 *     groupInSingleBlock: grouped,
 *     includeJsDoc: options.detailLevel === 'detailed',
 *   });
 *
 *   return [
 *     heading(4, 'API Types'),
 *     codeBlock('typescript', markdown),
 *   ];
 * }
 * ```
 */
