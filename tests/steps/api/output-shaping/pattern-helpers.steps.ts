/**
 * Pattern Helpers Step Definitions
 *
 * Tests for getPatternName(), findPatternByName(), getRelationships(),
 * and suggestPattern() — shared lookup utilities used across the API layer.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  getPatternName,
  findPatternByName,
  getRelationships,
  suggestPattern,
} from '../../../../src/api/pattern-helpers.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/extracted-pattern.js';
import type {
  MasterDataset,
  RelationshipEntry,
} from '../../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/api/output-shaping/pattern-helpers.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  pattern: ExtractedPattern | null;
  patterns: readonly ExtractedPattern[];
  result: string | undefined | null;
  foundPattern: ExtractedPattern | undefined;
  relationships: RelationshipEntry | undefined;
  suggestion: string;
  dataset: MasterDataset | null;
  candidates: readonly string[];
}

function initState(): TestState {
  return {
    pattern: null,
    patterns: [],
    result: null,
    foundPattern: undefined,
    relationships: undefined,
    suggestion: '',
    dataset: null,
    candidates: [],
  };
}

let state: TestState | null = null;

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ---------------------------------------------------------------------------
  // Rule: getPatternName uses patternName tag when available
  // ---------------------------------------------------------------------------

  Rule('getPatternName uses patternName tag when available', ({ RuleScenario }) => {
    RuleScenario('Returns patternName when set', ({ Given, When, Then }) => {
      Given(
        'a pattern with name {string} and patternName {string}',
        (_ctx: unknown, name: string, patternName: string) => {
          state = initState();
          const pattern = createTestPattern({ name });
          // Override patternName — factory always sets it to name by default
          (pattern as Record<string, unknown>)['patternName'] = patternName;
          state.pattern = pattern;
        }
      );

      When('I get the pattern name', () => {
        state!.result = getPatternName(state!.pattern!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.result).toBe(expected);
      });
    });

    RuleScenario('Falls back to name when patternName is absent', ({ Given, When, Then }) => {
      Given('a pattern with name {string} and no patternName', (_ctx: unknown, name: string) => {
        state = initState();
        const pattern = createTestPattern({ name });
        // Remove patternName to test fallback — factory sets it by default
        delete (pattern as Record<string, unknown>)['patternName'];
        state.pattern = pattern;
      });

      When('I get the pattern name', () => {
        state!.result = getPatternName(state!.pattern!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.result).toBe(expected);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: findPatternByName performs case-insensitive matching
  // ---------------------------------------------------------------------------

  Rule('findPatternByName performs case-insensitive matching', ({ RuleScenario }) => {
    RuleScenario('Exact case match', ({ Given, When, Then }) => {
      Given('patterns {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patterns = [createTestPattern({ name: a }), createTestPattern({ name: b })];
      });

      When('I find pattern by name {string}', (_ctx: unknown, name: string) => {
        state!.foundPattern = findPatternByName(state!.patterns, name);
      });

      Then('the found pattern name is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.foundPattern).toBeDefined();
        expect(getPatternName(state!.foundPattern!)).toBe(expected);
      });
    });

    RuleScenario('Case-insensitive match', ({ Given, When, Then }) => {
      Given('patterns {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patterns = [createTestPattern({ name: a }), createTestPattern({ name: b })];
      });

      When('I find pattern by name {string}', (_ctx: unknown, name: string) => {
        state!.foundPattern = findPatternByName(state!.patterns, name);
      });

      Then('the found pattern name is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.foundPattern).toBeDefined();
        expect(getPatternName(state!.foundPattern!)).toBe(expected);
      });
    });

    RuleScenario('No match returns undefined', ({ Given, When, Then }) => {
      Given('patterns {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.patterns = [createTestPattern({ name: a }), createTestPattern({ name: b })];
      });

      When('I find pattern by name {string}', (_ctx: unknown, name: string) => {
        state!.foundPattern = findPatternByName(state!.patterns, name);
      });

      Then('no pattern is found', () => {
        expect(state!.foundPattern).toBeUndefined();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: getRelationships looks up with case-insensitive fallback
  // ---------------------------------------------------------------------------

  Rule('getRelationships looks up with case-insensitive fallback', ({ RuleScenario }) => {
    RuleScenario('Exact key match in relationship index', ({ Given, When, Then }) => {
      Given('a dataset with relationship entry for {string}', (_ctx: unknown, name: string) => {
        state = initState();
        // Create patterns with uses/usedBy so the transform pipeline builds
        // a relationship index entry for the given name
        const patterns = [
          createTestPattern({ name, filePath: 'src/order.ts', uses: ['EventStore'] }),
          createTestPattern({ name: 'EventStore', filePath: 'src/event.ts' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
      });

      When('I get relationships for {string}', (_ctx: unknown, name: string) => {
        state!.relationships = getRelationships(state!.dataset!, name);
      });

      Then('relationships are found', () => {
        expect(state!.relationships).toBeDefined();
      });
    });

    RuleScenario('Case-insensitive fallback match', ({ Given, When, Then }) => {
      Given('a dataset with relationship entry for {string}', (_ctx: unknown, name: string) => {
        state = initState();
        const patterns = [
          createTestPattern({ name, filePath: 'src/order.ts', uses: ['EventStore'] }),
          createTestPattern({ name: 'EventStore', filePath: 'src/event.ts' }),
        ];
        state.dataset = createTestMasterDataset({ patterns });
      });

      When('I get relationships for {string}', (_ctx: unknown, name: string) => {
        state!.relationships = getRelationships(state!.dataset!, name);
      });

      Then('relationships are found', () => {
        expect(state!.relationships).toBeDefined();
      });
    });

    RuleScenario('Missing relationship index returns undefined', ({ Given, When, Then }) => {
      Given('a dataset without relationship index', () => {
        state = initState();
        // Empty dataset has no relationship index
        state.dataset = createTestMasterDataset();
      });

      When('I get relationships for {string}', (_ctx: unknown, name: string) => {
        state!.relationships = getRelationships(state!.dataset!, name);
      });

      Then('no relationships are found', () => {
        expect(state!.relationships).toBeUndefined();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: suggestPattern provides fuzzy suggestions
  // ---------------------------------------------------------------------------

  Rule('suggestPattern provides fuzzy suggestions', ({ RuleScenario }) => {
    RuleScenario('Suggests close match', ({ Given, When, Then }) => {
      Given('candidate names {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.candidates = [a, b];
      });

      When('I suggest a pattern for {string}', (_ctx: unknown, query: string) => {
        state!.suggestion = suggestPattern(query, state!.candidates);
      });

      Then('the suggestion contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.suggestion).toContain(expected);
      });
    });

    RuleScenario('No close match returns empty', ({ Given, When, Then }) => {
      Given('candidate names {string} and {string}', (_ctx: unknown, a: string, b: string) => {
        state = initState();
        state.candidates = [a, b];
      });

      When('I suggest a pattern for {string}', (_ctx: unknown, query: string) => {
        state!.suggestion = suggestPattern(query, state!.candidates);
      });

      Then('the suggestion is empty', () => {
        expect(state!.suggestion).toBe('');
      });
    });
  });
});
