export interface FuzzyMatch {
  readonly patternName: string;
  readonly score: number;
  readonly matchType: 'exact' | 'prefix' | 'substring' | 'fuzzy';
}

const MIN_SCORE_THRESHOLD = 0.3;
const MAX_LEVENSHTEIN_DISTANCE = 3;

/** Lowercase and strip every non-alphanumeric character (hyphens, spaces, dots). */
function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

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
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[n] ?? 0;
}

function scoreMatch(
  query: string,
  patternName: string,
): { score: number; matchType: FuzzyMatch['matchType'] } | undefined {
  const queryLower = query.toLowerCase();
  const nameLower = patternName.toLowerCase();

  if (queryLower === nameLower) return { score: 1.0, matchType: 'exact' };

  if (nameLower.startsWith(queryLower)) {
    const coverage = queryLower.length / nameLower.length;
    const score = 0.9 + coverage * 0.09;
    return { score: Math.min(score, 0.99), matchType: 'prefix' };
  }

  if (nameLower.includes(queryLower)) return { score: 0.7, matchType: 'substring' };

  // Punctuation-insensitive fallback: bridge how an id is TYPED ("ADR-009") to how a
  // pattern name SPELLS it ("ADR009ProjectionTrustBoundary"). Only consulted when the
  // query actually carries punctuation (otherwise the literal checks above already
  // covered it), and slightly discounted so literal matches always rank first.
  const queryNorm = normalizeToken(query);
  if (queryNorm.length > 0 && queryNorm !== queryLower) {
    const nameNorm = normalizeToken(patternName);
    if (nameNorm === queryNorm) return { score: 0.95, matchType: 'exact' };
    if (nameNorm.startsWith(queryNorm)) {
      const coverage = queryNorm.length / nameNorm.length;
      return { score: Math.min(0.88 + coverage * 0.09, 0.97), matchType: 'prefix' };
    }
    if (nameNorm.includes(queryNorm)) return { score: 0.68, matchType: 'substring' };
  }

  const distance = levenshteinDistance(queryLower, nameLower);
  if (distance <= MAX_LEVENSHTEIN_DISTANCE) {
    const maxLen = Math.max(queryLower.length, nameLower.length);
    const score = maxLen > 0 ? 1 - distance / maxLen : 0;
    if (score >= MIN_SCORE_THRESHOLD) return { score, matchType: 'fuzzy' };
  }

  return undefined;
}

/** Split a query into whitespace-separated, non-empty tokens. */
function tokenizeQuery(query: string): string[] {
  return query.split(/\s+/).filter((token) => token.length > 0);
}

/**
 * Per-token score for the multi-word degrade: a pattern is ranked by how many of
 * the query's tokens it matches and how well. Discounted so these approximate
 * multi-token hits read as weaker than any whole-query match.
 */
function scorePerToken(
  tokens: readonly string[],
  patternName: string,
): { score: number; matchType: FuzzyMatch['matchType'] } | undefined {
  let matchedCount = 0;
  let scoreSum = 0;
  for (const token of tokens) {
    const result = scoreMatch(token, patternName);
    if (result !== undefined) {
      matchedCount += 1;
      scoreSum += result.score;
    }
  }
  if (matchedCount === 0) return undefined;
  const coverage = matchedCount / tokens.length;
  const averageScore = scoreSum / matchedCount;
  return { score: coverage * averageScore * 0.6, matchType: 'fuzzy' };
}

function sortMatches(matches: FuzzyMatch[]): void {
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.patternName.length !== b.patternName.length)
      return a.patternName.length - b.patternName.length;
    return a.patternName.localeCompare(b.patternName);
  });
}

export function fuzzyMatchPatterns(
  query: string,
  patternNames: readonly string[],
  maxResults = 10,
): readonly FuzzyMatch[] {
  const matches: FuzzyMatch[] = [];

  for (const patternName of patternNames) {
    const result = scoreMatch(query, patternName);
    if (result !== undefined) {
      matches.push({ patternName, score: result.score, matchType: result.matchType });
    }
  }

  // Multi-word degrade: a natural concept query ("read model consistency") is not
  // a contiguous substring of any single pattern NAME, so the whole-query pass
  // comes back empty. Fall back to per-token matching — rank each pattern by how
  // many query tokens it matches — so a multi-word miss surfaces the closest
  // patterns instead of a bare []. Only when the whole query found nothing, so it
  // never reorders a real whole-query hit.
  if (matches.length === 0) {
    const tokens = tokenizeQuery(query);
    if (tokens.length > 1) {
      for (const patternName of patternNames) {
        const result = scorePerToken(tokens, patternName);
        if (result !== undefined) {
          matches.push({ patternName, score: result.score, matchType: result.matchType });
        }
      }
    }
  }

  sortMatches(matches);

  return matches.slice(0, maxResults);
}

export function findBestMatch(
  query: string,
  patternNames: readonly string[],
): FuzzyMatch | undefined {
  const results = fuzzyMatchPatterns(query, patternNames, 1);
  return results.length > 0 ? results[0] : undefined;
}
