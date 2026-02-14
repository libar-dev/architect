/**
 * @libar-docs
 * @libar-docs-pattern ShapeExtractor
 * @libar-docs-status completed
 * @libar-docs-phase 26
 * @libar-docs-implements ShapeExtraction
 * @libar-docs-uses typescript-estree
 *
 * ## Shape Extractor - TypeScript Type Extraction
 *
 * Extracts TypeScript type definitions (interfaces, type aliases, enums,
 * function signatures) from source files for documentation generation.
 *
 * ### When to Use
 *
 * - When processing @libar-docs-extract-shapes tags during extraction
 * - When generating documentation that needs actual type definitions
 * - When eliminating duplication between JSDoc examples and code
 *
 * ### Key Concepts
 *
 * - **AST-based extraction**: Uses typescript-estree for accurate parsing
 * - **Preserves formatting**: Extracts exact source text, not regenerated
 * - **Includes JSDoc**: Type-level JSDoc comments are preserved
 * - **Order from tag**: Shapes appear in tag-specified order, not source order
 */
import { Result } from '../types/result.js';
import type { ExtractedShape, ShapeExtractionOptionsInput, ShapeExtractionResult } from '../validation-schemas/extracted-shape.js';
/**
 * Extract named shapes from TypeScript source code.
 *
 * @param sourceCode - The TypeScript source code to parse
 * @param shapeNames - Names of shapes to extract (in desired output order)
 * @param options - Extraction options
 * @returns Result containing extraction result with shapes, warnings, and not-found list
 */
export declare function extractShapes(sourceCode: string, shapeNames: string[], options?: ShapeExtractionOptionsInput): Result<ShapeExtractionResult>;
/**
 * Result of processing extract-shapes tag.
 */
export interface ProcessExtractShapesResult {
    /** Successfully extracted shapes in tag order */
    shapes: ExtractedShape[];
    /** Warnings generated during extraction */
    warnings: string[];
}
/**
 * Process extract-shapes tag and return shapes for ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * DD-4: Supports wildcard `*` for auto-discovery mode.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag, or `*` for auto-discovery
 * @returns Result with extracted shapes and any warnings
 */
export declare function processExtractShapesTag(sourceCode: string, extractShapesTag: string): ProcessExtractShapesResult;
/**
 * Discover declarations tagged with @libar-docs-shape in source code.
 *
 * Scans all top-level declarations (exported and non-exported per DD-7)
 * for @libar-docs-shape tags in their preceding JSDoc. Tagged declarations
 * are extracted as shapes with an optional group from the tag value (DD-5).
 *
 * Reuses existing infrastructure: findDeclarations(), extractPrecedingJsDoc(),
 * and extractShape() — no parser changes needed (DD-2).
 *
 * @param sourceCode - TypeScript source code to scan
 * @returns Result containing discovered shapes and warnings
 */
export declare function discoverTaggedShapes(sourceCode: string): Result<ProcessExtractShapesResult>;
export { renderShapesAsMarkdown } from '../renderable/codecs/helpers.js';
//# sourceMappingURL=shape-extractor.d.ts.map