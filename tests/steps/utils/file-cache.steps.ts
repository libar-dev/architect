/**
 * File Cache Step Definitions
 *
 * BDD step definitions for testing the file cache:
 * - Store/retrieve round-trip
 * - has membership checks
 * - Hit/miss stats tracking
 * - Hit rate calculation with zero-division guard
 * - Clear resets everything
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createFileCache, type FileCache } from '../../../src/cache/file-cache.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface FileCacheTestState {
  cache: FileCache;
  retrievedContent: string | undefined;
  hasResult: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: FileCacheTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): FileCacheTestState {
  return {
    cache: createFileCache(),
    retrievedContent: undefined,
    hasResult: false,
  };
}

// =============================================================================
// Feature: File Cache
// =============================================================================

const feature = await loadFeature('tests/features/utils/file-cache.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a file cache test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Store and retrieve round-trip
  // ===========================================================================

  Rule('Store and retrieve round-trip preserves content', ({ RuleScenario }) => {
    RuleScenario('Store and retrieve returns same content', ({ When, Then }) => {
      When(
        'I store content {string} at path {string}',
        (_ctx: unknown, content: string, path: string) => {
          state!.cache.set(path, content);
        }
      );

      Then(
        'retrieving path {string} returns {string}',
        (_ctx: unknown, path: string, expected: string) => {
          const content = state!.cache.get(path);
          expect(content).toBe(expected);
        }
      );
    });

    RuleScenario('Non-existent path returns undefined', ({ When, Then }) => {
      When('I retrieve a non-existent path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      Then('the retrieved content is undefined', () => {
        expect(state!.retrievedContent).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // has checks
  // ===========================================================================

  Rule('has checks membership without affecting stats', ({ RuleScenario }) => {
    RuleScenario('has returns true for cached path', ({ When, Then }) => {
      When(
        'I store content {string} at path {string}',
        (_ctx: unknown, content: string, path: string) => {
          state!.cache.set(path, content);
        }
      );

      Then('has returns true for path {string}', (_ctx: unknown, path: string) => {
        expect(state!.cache.has(path)).toBe(true);
      });
    });

    RuleScenario('has returns false for uncached path', ({ Then }) => {
      Then('has returns false for path {string}', (_ctx: unknown, path: string) => {
        expect(state!.cache.has(path)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Stats tracking
  // ===========================================================================

  Rule('Stats track hits and misses accurately', ({ RuleScenario }) => {
    RuleScenario('Stats track hits and misses', ({ When, And, Then }) => {
      When(
        'I store content {string} at path {string}',
        (_ctx: unknown, content: string, path: string) => {
          state!.cache.set(path, content);
        }
      );

      And('I perform a get on cached path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      And('I perform a get on uncached path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      Then(
        'the stats show {int} hit and {int} miss',
        (_ctx: unknown, expectedHits: number, expectedMisses: number) => {
          const stats = state!.cache.getStats();
          expect(stats.hits).toBe(expectedHits);
          expect(stats.misses).toBe(expectedMisses);
        }
      );

      And('the stats show size {int}', (_ctx: unknown, expectedSize: number) => {
        const stats = state!.cache.getStats();
        expect(stats.size).toBe(expectedSize);
      });
    });

    RuleScenario('Hit rate starts at zero for empty cache', ({ Then }) => {
      Then('the hit rate is {int}', (_ctx: unknown, expected: number) => {
        const stats = state!.cache.getStats();
        expect(stats.hitRate).toBe(expected);
      });
    });

    RuleScenario('Hit rate is 100 when all gets are hits', ({ When, And, Then }) => {
      When(
        'I store content {string} at path {string}',
        (_ctx: unknown, content: string, path: string) => {
          state!.cache.set(path, content);
        }
      );

      And('I perform a get on path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      Then('the hit rate is {int}', (_ctx: unknown, expected: number) => {
        const stats = state!.cache.getStats();
        expect(stats.hitRate).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // Clear
  // ===========================================================================

  Rule('Clear resets cache and stats', ({ RuleScenario }) => {
    RuleScenario('Clear resets everything', ({ When, And, Then }) => {
      When(
        'I store content {string} at path {string}',
        (_ctx: unknown, content: string, path: string) => {
          state!.cache.set(path, content);
        }
      );

      And('I perform a get on path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      And('I clear the cache', () => {
        state!.cache.clear();
      });

      Then(
        'the stats show {int} hits and {int} misses',
        (_ctx: unknown, expectedHits: number, expectedMisses: number) => {
          const stats = state!.cache.getStats();
          expect(stats.hits).toBe(expectedHits);
          expect(stats.misses).toBe(expectedMisses);
        }
      );

      And('the stats show size {int}', (_ctx: unknown, expectedSize: number) => {
        const stats = state!.cache.getStats();
        expect(stats.size).toBe(expectedSize);
      });

      When('I retrieve a non-existent path {string}', (_ctx: unknown, path: string) => {
        state!.retrievedContent = state!.cache.get(path);
      });

      Then('the retrieved content is undefined', () => {
        expect(state!.retrievedContent).toBeUndefined();
      });
    });
  });
});
