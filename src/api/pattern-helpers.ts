/**
 * @libar-docs
 * @libar-docs-pattern PatternHelpers
 * @libar-docs-status active
 * @libar-docs-implements DataAPIOutputShaping
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer domain
 *
 * ## Pattern Helpers — Shared Lookup Utilities
 *
 * Common helper functions used by context-assembler, arch-queries, and other
 * API modules that need pattern name resolution and relationship lookups.
 */

import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { MasterDataset, RelationshipEntry } from '../validation-schemas/master-dataset.js';

/**
 * Get the display name for a pattern: prefers explicit `patternName` tag,
 * falls back to the extracted `name`.
 */
export function getPatternName(p: ExtractedPattern): string {
  return p.patternName ?? p.name;
}

/**
 * Find a pattern by name using case-insensitive matching.
 */
export function findPatternByName(
  patterns: readonly ExtractedPattern[],
  name: string
): ExtractedPattern | undefined {
  const lower = name.toLowerCase();
  return patterns.find((p) => getPatternName(p).toLowerCase() === lower);
}

/**
 * Look up relationship entry by pattern name with case-insensitive fallback.
 *
 * Tries exact key match first for performance, then falls back to
 * case-insensitive scan if the exact key is not found.
 */
export function getRelationships(
  dataset: MasterDataset,
  name: string
): RelationshipEntry | undefined {
  if (dataset.relationshipIndex === undefined) return undefined;
  const entry = dataset.relationshipIndex[name];
  if (entry !== undefined) return entry;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(dataset.relationshipIndex)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}
