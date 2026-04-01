/**
 * Shape Selector Matcher
 *
 * Resolves selector-based shape filters against pattern `source.file` paths
 * in PatternGraph. Uses in-memory string matching (no filesystem access).
 *
 * @see CodecDrivenReferenceGeneration AD-6: In-memory glob matching
 */

import type { PatternGraph } from '../../validation-schemas/pattern-graph.js';
import type { ExtractedShape } from '../../validation-schemas/extracted-shape.js';

// ============================================================================
// Shape Selector Types (DD-6: Structural Discriminated Union)
// ============================================================================

/**
 * Fine-grained selector for extracted shapes.
 *
 * Three structural variants (DD-6, no `kind` field):
 * - `{ group }` — select all shapes with matching group tag
 * - `{ source, names }` — specific shapes from a source file
 * - `{ source }` — all tagged shapes from a source file
 */
export type ShapeSelector =
  | { readonly group: string }
  | { readonly source: string; readonly names: readonly string[] }
  | { readonly source: string };

/** Type guard: selector has source + names fields */
function hasNames(
  selector: ShapeSelector
): selector is { readonly source: string; readonly names: readonly string[] } {
  return 'names' in selector;
}

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
 * @param pattern - Glob-like pattern from a selector source field
 */
export function matchesShapePattern(filePath: string, pattern: string): boolean {
  const starIndex = pattern.indexOf('*');

  // No wildcard: exact match
  if (starIndex === -1) {
    return filePath === pattern;
  }

  const prefix = pattern.substring(0, starIndex);
  const suffix = pattern.substring(pattern.lastIndexOf('*') + 1);

  if (!filePath.startsWith(prefix)) return false;
  if (suffix && !filePath.endsWith(suffix)) return false;

  // Recursive glob (**): any depth between prefix and suffix
  if (pattern.includes('**')) {
    return true;
  }

  // Single-level glob (*): no slashes between prefix and suffix
  const middle = filePath.substring(prefix.length, filePath.length - suffix.length);
  return !middle.includes('/');
}

// ============================================================================
// Selector-Based Shape Filtering
// ============================================================================

/**
 * Filter shapes from PatternGraph using fine-grained ShapeSelectors.
 *
 * Three selector modes (DD-6):
 * - `{ group }` — all shapes where `shape.group` matches
 * - `{ source, names }` — shapes from matching source file with listed names
 * - `{ source }` — all shapes from matching source file
 *
 * Returns a deduplicated list in selector iteration order.
 *
 * @param dataset - PatternGraph with all extracted patterns
 * @param selectors - Fine-grained shape selectors
 * @returns Aggregated ExtractedShape array from matching selectors
 */
export function filterShapesBySelectors(
  dataset: PatternGraph,
  selectors: readonly ShapeSelector[]
): readonly ExtractedShape[] {
  if (selectors.length === 0) return [];

  const seenNames = new Set<string>();
  const shapes: ExtractedShape[] = [];

  for (const selector of selectors) {
    if ('group' in selector && !('source' in selector)) {
      // Group selector: iterate all patterns' shapes, match by group
      for (const pattern of dataset.patterns) {
        if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0) continue;
        for (const shape of pattern.extractedShapes) {
          if (shape.group === selector.group && !seenNames.has(shape.name)) {
            seenNames.add(shape.name);
            shapes.push(shape);
          }
        }
      }
    } else if ('source' in selector) {
      // Source-based selector: match by file path glob
      const sourceGlob = String(selector.source);
      const nameSet = hasNames(selector) ? new Set<string>(selector.names) : undefined;

      for (const pattern of dataset.patterns) {
        if (pattern.extractedShapes === undefined || pattern.extractedShapes.length === 0) continue;
        if (!matchesShapePattern(pattern.source.file, sourceGlob)) continue;

        for (const shape of pattern.extractedShapes) {
          if (seenNames.has(shape.name)) continue;
          // If names specified, filter by name; otherwise include all
          if (nameSet !== undefined && !nameSet.has(shape.name)) continue;
          seenNames.add(shape.name);
          shapes.push(shape);
        }
      }
    }
  }

  return shapes;
}
