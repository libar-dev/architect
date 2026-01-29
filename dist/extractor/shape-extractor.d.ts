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
import type { ExtractedShape, ReExportedShape } from '../validation-schemas/extracted-shape.js';
/**
 * Options for shape extraction (simplified for internal use).
 */
interface ShapeExtractionOptions {
    /** Include JSDoc comments in extraction (default: true) */
    includeJsDoc?: boolean;
    /** For functions, include full signature or just name+params (default: 'signature') */
    functionDetail?: 'signature' | 'name-only';
    /** Preserve original formatting vs normalize (default: true) */
    preserveFormatting?: boolean;
}
/**
 * Result of shape extraction from a file.
 */
interface ShapeExtractionResult {
    /** Successfully extracted shapes, in requested order */
    shapes: ExtractedShape[];
    /** Shape names that were requested but not found */
    notFound: string[];
    /** Shape names that exist but are imports (not defined in file) */
    imported: string[];
    /** Shape names that are re-exported from other files */
    reExported: ReExportedShape[];
    /** Any warnings generated during extraction */
    warnings: string[];
}
/**
 * Extract named shapes from TypeScript source code.
 *
 * @param sourceCode - The TypeScript source code to parse
 * @param shapeNames - Names of shapes to extract (in desired output order)
 * @param options - Extraction options
 * @returns Extraction result with shapes, warnings, and not-found list
 */
export declare function extractShapes(sourceCode: string, shapeNames: string[], options?: ShapeExtractionOptions): ShapeExtractionResult;
/**
 * Process extract-shapes tag and return shapes for ExtractedPattern.
 *
 * Called by the document extractor when processing TypeScript files
 * with @libar-docs-extract-shapes tags.
 *
 * @param sourceCode - File content
 * @param extractShapesTag - Comma-separated shape names from tag
 * @returns Array of extracted shapes in tag order
 */
export declare function processExtractShapesTag(sourceCode: string, extractShapesTag: string): ExtractedShape[];
/**
 * Render extracted shapes as markdown code blocks.
 *
 * @param shapes - Shapes to render
 * @param options - Rendering options
 * @returns Markdown string with fenced code blocks
 */
export declare function renderShapesAsMarkdown(shapes: ExtractedShape[], options?: {
    groupInSingleBlock?: boolean;
    includeJsDoc?: boolean;
}): string;
export {};
//# sourceMappingURL=shape-extractor.d.ts.map