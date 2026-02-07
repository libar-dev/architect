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
export declare function getPatternName(p: ExtractedPattern): string;
/**
 * Find a pattern by name using case-insensitive matching.
 */
export declare function findPatternByName(patterns: readonly ExtractedPattern[], name: string): ExtractedPattern | undefined;
/**
 * Look up relationship entry by pattern name with case-insensitive fallback.
 *
 * Tries exact key match first for performance, then falls back to
 * case-insensitive scan if the exact key is not found.
 */
export declare function getRelationships(dataset: MasterDataset, name: string): RelationshipEntry | undefined;
/**
 * Get all pattern display names from the dataset.
 */
export declare function allPatternNames(dataset: MasterDataset): readonly string[];
/**
 * Build a "Did you mean: X?" suggestion string using fuzzy matching.
 * Returns empty string if no good match is found.
 */
export declare function suggestPattern(query: string, candidates: readonly string[]): string;
/**
 * Get the first implements-pattern name from a pattern, if any.
 */
export declare function firstImplements(pattern: ExtractedPattern): string | undefined;
//# sourceMappingURL=pattern-helpers.d.ts.map