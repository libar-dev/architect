/**
 * Shape Source Matcher
 *
 * Resolves `shapeSources` glob patterns against pattern `source.file` paths
 * in MasterDataset. Uses in-memory string matching (no filesystem access).
 *
 * @see CodecDrivenReferenceGeneration AD-6: In-memory glob matching
 */
import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';
/**
 * Fine-grained selector for extracted shapes.
 *
 * Three structural variants (DD-6, no `kind` field):
 * - `{ group }` — select all shapes with matching group tag
 * - `{ source, names }` — specific shapes from a source file
 * - `{ source }` — all tagged shapes from a source file
 */
export type ShapeSelector = {
    readonly group: string;
} | {
    readonly source: string;
    readonly names: readonly string[];
} | {
    readonly source: string;
};
/**
 * Match a file path against a simple glob pattern.
 *
 * Supports three pattern styles:
 * - Exact match: `src/generators/types.ts`
 * - Single-level glob: `src/lint/*.ts` (no slashes in wildcard segment)
 * - Recursive glob: `src/generators/pipeline/**\/*.ts` or `src/**\/*.ts`
 *
 * @param filePath - Relative file path from pattern.source.file
 * @param pattern - Glob-like pattern from ReferenceDocConfig.shapeSources
 */
export declare function matchesShapePattern(filePath: string, pattern: string): boolean;
/**
 * Extract shapes from MasterDataset patterns whose `source.file`
 * matches any of the given glob patterns.
 *
 * Returns a deduplicated list of ExtractedShape objects in dataset
 * iteration order. Shapes are deduplicated by name (first occurrence wins).
 *
 * @param dataset - MasterDataset with all extracted patterns
 * @param shapeSources - Glob patterns to match against source.file
 * @returns Aggregated ExtractedShape array from matching patterns
 */
export declare function extractShapesFromDataset(dataset: MasterDataset, shapeSources: readonly string[]): readonly ExtractedShape[];
/**
 * Filter shapes from MasterDataset using fine-grained ShapeSelectors.
 *
 * Three selector modes (DD-6):
 * - `{ group }` — all shapes where `shape.group` matches
 * - `{ source, names }` — shapes from matching source file with listed names
 * - `{ source }` — all shapes from matching source file
 *
 * Returns a deduplicated list in selector iteration order.
 *
 * @param dataset - MasterDataset with all extracted patterns
 * @param selectors - Fine-grained shape selectors
 * @returns Aggregated ExtractedShape array from matching selectors
 */
export declare function filterShapesBySelectors(dataset: MasterDataset, selectors: readonly ShapeSelector[]): readonly ExtractedShape[];
//# sourceMappingURL=shape-matcher.d.ts.map