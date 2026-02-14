/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ReferenceDocShowcase
 *
 * ## Auto-Shape Discovery Mode
 *
 * Target: src/extractor/shape-extractor.ts (extractAllExportedShapes, processExtractShapesTag)
 * See: DD-4 (Wildcard tag value `*`)
 * Since: DS-2
 *
 * ### Activation
 *
 * `@libar-docs-extract-shapes *` triggers auto-discovery mode.
 * All exported declarations in the file are extracted as shapes.
 *
 * ### Pipeline Flow
 *
 * 1. `doc-extractor.ts:171` reads `directive.extractShapes` → `['*']`
 * 2. `processExtractShapesTag()` receives `'*'` as the tag value
 * 3. Detects wildcard → calls `extractAllExportedShapes()` instead of `extractShapes()`
 * 4. Returns all exported shapes from the file
 *
 * ### Why Wildcard Over Config-Driven
 *
 * - Preserves the @libar-docs opt-in marker philosophy
 * - No codec config leaks into scanner/extractor pipeline
 * - Explicit: file author decides what gets extracted
 * - Backward compatible: existing named extraction unchanged
 */

import type { ExtractedShape } from '../../src/validation-schemas/extracted-shape.js';
import type { ProcessExtractShapesResult } from '../../src/extractor/shape-extractor.js';

/**
 * Extract all exported declarations from a TypeScript file as shapes.
 *
 * Uses `findDeclarations()` (already exists in shape-extractor.ts) to discover
 * all declarations, then filters to exported-only and extracts each via
 * `extractShape()`.
 *
 * @param sourceCode - Full file source text
 * @param options - Shape extraction options (includeJsDoc, preserveFormatting)
 * @returns Array of all exported shapes from the file
 */
function extractAllExportedShapes(
  sourceCode: string,
  options?: { includeJsDoc?: boolean; preserveFormatting?: boolean }
): ProcessExtractShapesResult {
  throw new Error('ReferenceDocShowcase not yet implemented - roadmap pattern');
}

// Integration point in processExtractShapesTag():
//
// BEFORE the existing split-and-extract logic:
//
//   // DD-4: Auto-shape discovery via wildcard
//   const trimmedTag = extractShapesTag.trim();
//   if (trimmedTag === '*') {
//     return extractAllExportedShapes(sourceCode);
//   }
//
//   // Existing behavior: named shape extraction
//   const shapeNames = extractShapesTag.split(',').map(s => s.trim()).filter(Boolean);
//   ...

// Implementation will:
// 1. Parse source with typescript-eslint (already done in extractShapes)
// 2. Call findDeclarations(ast) to get Map<string, FoundDeclaration>
// 3. Filter to entries where declaration.exported === true
// 4. Call extractShape() for each exported declaration
// 5. Collect results and warnings
// 6. Warn if > 50 shapes extracted (suspicious, may indicate config error)
