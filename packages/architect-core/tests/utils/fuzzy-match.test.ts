import { describe, expect, it } from 'vitest';

import { fuzzyMatchPatterns } from '../../src/utils/fuzzy-match.js';

const NAMES = [
  'ADR009ProjectionTrustBoundary',
  'ADR006SingleReadModelArchitecture',
  'PatternGraphApi',
  'MarkdownRenderer',
] as const;

describe('fuzzyMatchPatterns — punctuation-insensitive id resolution', () => {
  it('resolves a hyphenated ADR id ("ADR-009") to its ADR pattern name', () => {
    const results = fuzzyMatchPatterns('ADR-009', NAMES);
    expect(results[0]?.patternName).toBe('ADR009ProjectionTrustBoundary');
  });

  it('still resolves the un-hyphenated form ("ADR009") as a literal prefix', () => {
    const results = fuzzyMatchPatterns('ADR009', NAMES);
    expect(results[0]?.patternName).toBe('ADR009ProjectionTrustBoundary');
    expect(results[0]?.matchType).toBe('prefix');
  });

  it('keeps literal matches ranked above punctuation-normalized ones', () => {
    // "ADR006" is a literal prefix of ADR006...; the hyphen fallback for "ADR-009"
    // is discounted, so a literal-prefix query must out-score a normalized one.
    const literal = fuzzyMatchPatterns('ADR006', NAMES)[0];
    const normalized = fuzzyMatchPatterns('ADR-006', NAMES)[0];
    expect(literal?.patternName).toBe('ADR006SingleReadModelArchitecture');
    expect(normalized?.patternName).toBe('ADR006SingleReadModelArchitecture');
    expect(literal?.score ?? 0).toBeGreaterThanOrEqual(normalized?.score ?? 0);
  });

  it('does not match an unrelated query', () => {
    expect(fuzzyMatchPatterns('ZZZ-999', NAMES)).toHaveLength(0);
  });
});

describe('fuzzyMatchPatterns — multi-word concept degrade', () => {
  it('degrades a multi-word concept query to per-token matching when the whole-query pass is empty', () => {
    // "read model consistency" is no contiguous substring of any name, so the
    // whole-query pass is empty; the per-token fallback surfaces the pattern that
    // matches the most tokens instead of a bare [].
    const results = fuzzyMatchPatterns('read model consistency', NAMES);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.patternName).toBe('ADR006SingleReadModelArchitecture');
  });

  it('keeps a single-token miss empty — the fallback is multi-word only', () => {
    expect(fuzzyMatchPatterns('zzznotapattern', NAMES)).toHaveLength(0);
  });
});
