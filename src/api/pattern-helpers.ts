/**
 * @architect
 * @architect-pattern PatternHelpers
 * @architect-status active
 * @architect-implements DataAPIOutputShaping
 * @architect-arch-context api
 * @architect-arch-layer domain
 *
 * ## Pattern Helpers — Shared Lookup Utilities
 *
 * Common helper functions used by context-assembler, arch-queries, and other
 * API modules that need pattern name resolution and relationship lookups.
 *
 * **When to Use:** When resolving pattern names, looking up relationships, or finding patterns by name in API module code.
 */

import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type {
  MasterDataset,
  RelationshipEntry,
  SequenceIndexEntry,
} from '../validation-schemas/master-dataset.js';
import { findBestMatch } from './fuzzy-match.js';

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

/**
 * Look up a sequenceIndex entry by pattern name with case-insensitive fallback.
 */
export function getSequenceEntry(
  dataset: MasterDataset,
  name: string
): SequenceIndexEntry | undefined {
  if (dataset.sequenceIndex === undefined) return undefined;
  const exact = dataset.sequenceIndex[name];
  if (exact !== undefined) return exact;

  const pattern = findPatternByName(dataset.patterns, name);
  if (pattern === undefined) return undefined;

  return dataset.sequenceIndex[getPatternName(pattern)];
}

/**
 * Get all pattern display names from the dataset.
 */
export function allPatternNames(dataset: MasterDataset): readonly string[] {
  return dataset.patterns.map((p) => getPatternName(p));
}

/**
 * Build a "Did you mean: X?" suggestion string using fuzzy matching.
 * Returns empty string if no good match is found.
 */
export function suggestPattern(query: string, candidates: readonly string[]): string {
  const best = findBestMatch(query, candidates);
  return best !== undefined ? ` Did you mean: ${best.patternName}?` : '';
}

/**
 * Get the first implements-pattern name from a pattern, if any.
 */
export function firstImplements(pattern: ExtractedPattern): string | undefined {
  return pattern.implementsPatterns?.[0];
}
