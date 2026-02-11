/**
 * Shape Source Matcher
 *
 * Resolves `shapeSources` glob patterns against pattern `source.file` paths
 * in MasterDataset. Uses in-memory string matching (no filesystem access).
 *
 * @see CodecDrivenReferenceGeneration AD-6: In-memory glob matching
 */
// ============================================================================
// Glob Pattern Matching
// ============================================================================
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
export function matchesShapePattern(filePath, pattern) {
    const starIndex = pattern.indexOf('*');
    // No wildcard: exact match
    if (starIndex === -1) {
        return filePath === pattern;
    }
    const prefix = pattern.substring(0, starIndex);
    const suffix = pattern.substring(pattern.lastIndexOf('*') + 1);
    if (!filePath.startsWith(prefix))
        return false;
    if (suffix && !filePath.endsWith(suffix))
        return false;
    // Recursive glob (**): any depth between prefix and suffix
    if (pattern.includes('**')) {
        return true;
    }
    // Single-level glob (*): no slashes between prefix and suffix
    const middle = filePath.substring(prefix.length, filePath.length - suffix.length);
    return !middle.includes('/');
}
// ============================================================================
// Shape Extraction from Dataset
// ============================================================================
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
export function extractShapesFromDataset(dataset, shapeSources) {
    if (shapeSources.length === 0)
        return [];
    const seenNames = new Set();
    const shapes = [];
    for (const pattern of dataset.patterns) {
        // Skip patterns without extracted shapes
        if (!pattern.extractedShapes || pattern.extractedShapes.length === 0)
            continue;
        // Check if this pattern's source file matches any shape source glob
        const matches = shapeSources.some((glob) => matchesShapePattern(pattern.source.file, glob));
        if (!matches)
            continue;
        // Collect shapes, deduplicating by name
        for (const shape of pattern.extractedShapes) {
            if (!seenNames.has(shape.name)) {
                seenNames.add(shape.name);
                shapes.push(shape);
            }
        }
    }
    return shapes;
}
//# sourceMappingURL=shape-matcher.js.map