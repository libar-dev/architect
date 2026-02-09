/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern FuzzyMatcherImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIOutputShaping
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## FuzzyMatcher — Pattern Name Fuzzy Search
 *
 * Provides fuzzy matching for pattern names with tiered scoring:
 * exact (1.0) > prefix (0.9) > substring (0.7) > Levenshtein (distance-based).
 *
 * No external dependencies — Levenshtein implementation is ~20 lines.
 *
 * Used by:
 * - `search` subcommand: ranked results via fuzzyMatchPatterns()
 * - `pattern` subcommand: "Did you mean...?" fallback via findBestMatch()
 */
/**
 * Result of a fuzzy match against a pattern name.
 */
export interface FuzzyMatch {
    /** The matched pattern name */
    readonly patternName: string;
    /** Match quality score (0-1, higher is better) */
    readonly score: number;
    /** How the match was achieved */
    readonly matchType: 'exact' | 'prefix' | 'substring' | 'fuzzy';
}
/**
 * Compute Levenshtein edit distance between two strings.
 *
 * Pure implementation with no external dependencies.
 * Uses dynamic programming O(m*n) approach.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance (0 = identical)
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Find patterns matching a query with fuzzy matching.
 *
 * Scoring tiers (all case-insensitive):
 * 1. Exact match: score = 1.0
 * 2. Prefix match: score = 0.9
 * 3. Substring match: score = 0.7
 * 4. Levenshtein distance <= 3: score = 1 - (distance / max(len1, len2))
 *
 * Results are sorted by score descending, limited to maxResults.
 *
 * @param query - Search query string
 * @param patternNames - All available pattern names to search
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Sorted array of FuzzyMatch results
 */
export declare function fuzzyMatchPatterns(query: string, patternNames: readonly string[], maxResults?: number): readonly FuzzyMatch[];
/**
 * Find the single best match for a query.
 *
 * Used for "Did you mean...?" suggestions when an exact pattern lookup fails.
 * Returns undefined if no match scores above the minimum threshold (0.3).
 *
 * @param query - Pattern name that wasn't found
 * @param patternNames - All available pattern names
 * @returns Best matching FuzzyMatch, or undefined if no good match
 */
export declare function findBestMatch(query: string, patternNames: readonly string[]): FuzzyMatch | undefined;
//# sourceMappingURL=fuzzy-match.d.ts.map