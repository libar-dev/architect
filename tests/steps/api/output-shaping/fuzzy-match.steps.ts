/**
 * Fuzzy Pattern Matching Step Definitions
 *
 * Tests for fuzzyMatchPatterns(), findBestMatch(), and levenshteinDistance().
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  fuzzyMatchPatterns,
  findBestMatch,
  levenshteinDistance,
  type FuzzyMatch,
} from '../../../../src/api/fuzzy-match.js';

const feature = await loadFeature('tests/features/api/output-shaping/fuzzy-match.feature');

// =============================================================================
// Test State
// =============================================================================

interface FuzzyTestState {
  patternNames: string[];
  results: readonly FuzzyMatch[];
  bestMatch: FuzzyMatch | undefined;
  stringA: string;
  stringB: string;
  distance: number;
}

let state: FuzzyTestState | null = null;

function initState(): FuzzyTestState {
  return {
    patternNames: [],
    results: [],
    bestMatch: undefined,
    stringA: '',
    stringB: '',
    distance: -1,
  };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  Rule('Fuzzy matching uses tiered scoring', ({ RuleScenario }) => {
    RuleScenario('Exact match scores 1.0', ({ Given, When, Then }) => {
      Given(
        'pattern names {string}, {string}, {string}',
        (_ctx: unknown, a: string, b: string, c: string) => {
          state = initState();
          state.patternNames = [a, b, c];
        }
      );

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'the top result is {string} with score {string} and matchType {string}',
        (_ctx: unknown, name: string, scoreStr: string, matchType: string) => {
          expect(state!.results.length).toBeGreaterThan(0);
          expect(state!.results[0].patternName).toBe(name);
          expect(state!.results[0].score).toBe(parseFloat(scoreStr));
          expect(state!.results[0].matchType).toBe(matchType);
        }
      );
    });

    RuleScenario('Exact match is case-insensitive', ({ Given, When, Then }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'the top result is {string} with score {string} and matchType {string}',
        (_ctx: unknown, name: string, scoreStr: string, matchType: string) => {
          expect(state!.results.length).toBeGreaterThan(0);
          expect(state!.results[0].patternName).toBe(name);
          expect(state!.results[0].score).toBe(parseFloat(scoreStr));
          expect(state!.results[0].matchType).toBe(matchType);
        }
      );
    });

    RuleScenario('Prefix match scores 0.9', ({ Given, When, Then }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'the top result is {string} with score {string} and matchType {string}',
        (_ctx: unknown, name: string, scoreStr: string, matchType: string) => {
          expect(state!.results.length).toBeGreaterThan(0);
          expect(state!.results[0].patternName).toBe(name);
          expect(state!.results[0].score).toBe(parseFloat(scoreStr));
          expect(state!.results[0].matchType).toBe(matchType);
        }
      );
    });

    RuleScenario('Substring match scores 0.7', ({ Given, When, Then }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'the top result is {string} with score {string} and matchType {string}',
        (_ctx: unknown, name: string, scoreStr: string, matchType: string) => {
          expect(state!.results.length).toBeGreaterThan(0);
          expect(state!.results[0].patternName).toBe(name);
          expect(state!.results[0].score).toBe(parseFloat(scoreStr));
          expect(state!.results[0].matchType).toBe(matchType);
        }
      );
    });

    RuleScenario('Levenshtein match for close typos', ({ Given, When, Then, And }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'the top result is {string} with matchType {string}',
        (_ctx: unknown, name: string, matchType: string) => {
          expect(state!.results.length).toBeGreaterThan(0);
          expect(state!.results[0].patternName).toBe(name);
          expect(state!.results[0].matchType).toBe(matchType);
        }
      );

      And('the top result score is above {string}', (_ctx: unknown, threshold: string) => {
        expect(state!.results[0].score).toBeGreaterThan(parseFloat(threshold));
      });
    });

    RuleScenario('Results are sorted by score descending', ({ Given, When, Then, And }) => {
      Given(
        'pattern names {string}, {string}, {string}',
        (_ctx: unknown, a: string, b: string, c: string) => {
          state = initState();
          state.patternNames = [a, b, c];
        }
      );

      When('I fuzzy match {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then('the first result has score {string}', (_ctx: unknown, scoreStr: string) => {
        expect(state!.results[0].score).toBe(parseFloat(scoreStr));
      });

      And('the second result has score at least {string}', (_ctx: unknown, scoreStr: string) => {
        expect(state!.results.length).toBeGreaterThanOrEqual(2);
        expect(state!.results[1].score).toBeGreaterThanOrEqual(parseFloat(scoreStr));
      });
    });

    RuleScenario('Empty query matches all patterns as prefix', ({ Given, When, Then }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I fuzzy match with query {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then(
        'all {int} patterns are returned with matchType {string}',
        (_ctx: unknown, count: number, matchType: string) => {
          expect(state!.results.length).toBe(count);
          for (const result of state!.results) {
            expect(result.matchType).toBe(matchType);
          }
        }
      );
    });

    RuleScenario('No candidate patterns returns no results', ({ Given, When, Then }) => {
      Given('no pattern names exist', () => {
        state = initState();
        state.patternNames = [];
      });

      When('I fuzzy match with query {string}', (_ctx: unknown, query: string) => {
        state!.results = fuzzyMatchPatterns(query, state!.patternNames);
      });

      Then('no matches are returned', () => {
        expect(state!.results.length).toBe(0);
      });
    });
  });

  Rule('findBestMatch returns single suggestion', ({ RuleScenario }) => {
    RuleScenario('Best match returns suggestion above threshold', ({ Given, When, Then }) => {
      Given(
        'pattern names {string}, {string}, {string}',
        (_ctx: unknown, a: string, b: string, c: string) => {
          state = initState();
          state.patternNames = [a, b, c];
        }
      );

      When('I find the best match for {string}', (_ctx: unknown, query: string) => {
        state!.bestMatch = findBestMatch(query, state!.patternNames);
      });

      Then('the suggestion is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.bestMatch).toBeDefined();
        expect(state!.bestMatch?.patternName).toBe(expected);
      });
    });

    RuleScenario('No match returns undefined when below threshold', ({ Given, When, Then }) => {
      Given('pattern names {string}, {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patternNames = [a, b];
      });

      When('I find the best match for {string}', (_ctx: unknown, query: string) => {
        state!.bestMatch = findBestMatch(query, state!.patternNames);
      });

      Then('no suggestion is returned', () => {
        expect(state!.bestMatch).toBeUndefined();
      });
    });
  });

  Rule('Levenshtein distance computation', ({ RuleScenario }) => {
    RuleScenario('Identical strings have distance 0', ({ Given, When, Then }) => {
      Given('strings {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.stringA = a;
        state.stringB = b;
      });

      When('I compute the Levenshtein distance', () => {
        state!.distance = levenshteinDistance(state!.stringA, state!.stringB);
      });

      Then('the distance is {int}', (_ctx: unknown, expected: number) => {
        expect(state!.distance).toBe(expected);
      });
    });

    RuleScenario('Single character difference', ({ Given, When, Then }) => {
      Given('strings {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.stringA = a;
        state.stringB = b;
      });

      When('I compute the Levenshtein distance', () => {
        state!.distance = levenshteinDistance(state!.stringA, state!.stringB);
      });

      Then('the distance is {int}', (_ctx: unknown, expected: number) => {
        expect(state!.distance).toBe(expected);
      });
    });
  });
});
