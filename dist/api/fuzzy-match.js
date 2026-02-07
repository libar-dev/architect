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
/** Minimum score threshold for inclusion in results */
const MIN_SCORE_THRESHOLD = 0.3;
/** Maximum Levenshtein distance to consider */
const MAX_LEVENSHTEIN_DISTANCE = 3;
// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------
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
export function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0)
        return n;
    if (n === 0)
        return m;
    // Two-row DP: previous row and current row
    let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
    let currRow = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
        currRow[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const deletion = (prevRow[j] ?? 0) + 1;
            const insertion = (currRow[j - 1] ?? 0) + 1;
            const substitution = (prevRow[j - 1] ?? 0) + cost;
            currRow[j] = Math.min(deletion, insertion, substitution);
        }
        // Swap rows
        [prevRow, currRow] = [currRow, prevRow];
    }
    return prevRow[n] ?? 0;
}
/**
 * Score a single pattern name against a query using tiered matching.
 */
function scoreMatch(query, patternName) {
    const queryLower = query.toLowerCase();
    const nameLower = patternName.toLowerCase();
    // Tier 1: Exact match (case-insensitive)
    if (queryLower === nameLower) {
        return { score: 1.0, matchType: 'exact' };
    }
    // Tier 2: Prefix match
    if (nameLower.startsWith(queryLower)) {
        return { score: 0.9, matchType: 'prefix' };
    }
    // Tier 3: Substring match
    if (nameLower.includes(queryLower)) {
        return { score: 0.7, matchType: 'substring' };
    }
    // Tier 4: Levenshtein distance
    const distance = levenshteinDistance(queryLower, nameLower);
    if (distance <= MAX_LEVENSHTEIN_DISTANCE) {
        const maxLen = Math.max(queryLower.length, nameLower.length);
        const score = maxLen > 0 ? 1 - distance / maxLen : 0;
        if (score >= MIN_SCORE_THRESHOLD) {
            return { score, matchType: 'fuzzy' };
        }
    }
    return undefined;
}
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
export function fuzzyMatchPatterns(query, patternNames, maxResults = 10) {
    const matches = [];
    for (const patternName of patternNames) {
        const result = scoreMatch(query, patternName);
        if (result !== undefined) {
            matches.push({
                patternName,
                score: result.score,
                matchType: result.matchType,
            });
        }
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, maxResults);
}
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
export function findBestMatch(query, patternNames) {
    const results = fuzzyMatchPatterns(query, patternNames, 1);
    return results.length > 0 ? results[0] : undefined;
}
//# sourceMappingURL=fuzzy-match.js.map