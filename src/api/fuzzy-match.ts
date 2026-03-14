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
 *
 * **When to Use:** When resolving user-typed pattern names that may contain typos or partial matches.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Two-row DP: previous row and current row
  let prevRow: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow: number[] = new Array<number>(n + 1);

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
function scoreMatch(
  query: string,
  patternName: string
): { score: number; matchType: FuzzyMatch['matchType'] } | undefined {
  const queryLower = query.toLowerCase();
  const nameLower = patternName.toLowerCase();

  // Tier 1: Exact match (case-insensitive)
  if (queryLower === nameLower) {
    return { score: 1.0, matchType: 'exact' };
  }

  // Tier 2: Prefix match — score increases with query coverage of the name
  if (nameLower.startsWith(queryLower)) {
    const coverage = queryLower.length / nameLower.length;
    const score = 0.9 + coverage * 0.09;
    return { score: Math.min(score, 0.99), matchType: 'prefix' };
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
 * 2. Prefix match: score = 0.9 + (queryLen/nameLen) * 0.09 (shorter names rank higher)
 * 3. Substring match: score = 0.7
 * 4. Levenshtein distance <= 3: score = 1 - (distance / max(len1, len2))
 *
 * Results are sorted by score descending, with shorter names as tie-breaker.
 *
 * @param query - Search query string
 * @param patternNames - All available pattern names to search
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Sorted array of FuzzyMatch results
 */
export function fuzzyMatchPatterns(
  query: string,
  patternNames: readonly string[],
  maxResults = 10
): readonly FuzzyMatch[] {
  const matches: FuzzyMatch[] = [];

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

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaker: shorter name = more specific match
    if (a.patternName.length !== b.patternName.length)
      return a.patternName.length - b.patternName.length;
    // Final tie-breaker: lexical ordering for deterministic results
    return a.patternName.localeCompare(b.patternName);
  });
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
export function findBestMatch(
  query: string,
  patternNames: readonly string[]
): FuzzyMatch | undefined {
  const results = fuzzyMatchPatterns(query, patternNames, 1);
  return results.length > 0 ? results[0] : undefined;
}
