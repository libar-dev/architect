/**
 * Data API CLI Cache Step Definitions
 *
 * BDD step definitions for testing MasterDataset caching
 * between CLI invocations: cache hits, mtime invalidation,
 * and --no-cache bypass.
 *
 * @libar-docs
 * @libar-docs-implements DataAPICLIErgonomics
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  type CLIResult,
  initState,
  getTempDir,
  runCLICommand,
  getResult,
  writePatternFiles,
  createTempDir,
} from '../../support/helpers/process-api-state.js';

// =============================================================================
// Extended State for Cache Tests
// =============================================================================

interface CacheTestState extends CLITestState {
  firstResult: CLIResult | null;
  secondResult: CLIResult | null;
}

function initCacheState(): CacheTestState {
  const base = initState();
  return {
    ...base,
    firstResult: null,
    secondResult: null,
  };
}

function getCacheState(state: CacheTestState | null): CacheTestState {
  if (!state) throw new Error('Cache test state not initialized');
  return state;
}

// =============================================================================
// JSON Metadata Parsing
// =============================================================================

interface ParsedMetadata {
  cache?: {
    hit: boolean;
    ageMs?: number;
  };
  pipelineMs?: number;
}

function parseMetadata(result: CLIResult): ParsedMetadata {
  const parsed = JSON.parse(result.stdout) as { metadata?: ParsedMetadata };
  if (!parsed.metadata) {
    throw new Error('No metadata in response JSON');
  }
  return parsed.metadata;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CacheTestState | null = null;
const CACHE_QUERY_TIMEOUT_MS = 120000;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/data-api-cache.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a temporary working directory', async () => {
      state = initCacheState();
      state.tempContext = await createTempDir({ prefix: 'cli-cache-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: MasterDataset is cached between invocations
  // ---------------------------------------------------------------------------

  Rule('MasterDataset is cached between invocations', ({ RuleScenario }) => {
    RuleScenario('Second query uses cached dataset', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running status and capturing the first result', async () => {
        await runCLICommand(state, "process-api -i 'src/**/*.ts' status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).firstResult = getResult(state);
      });

      And('running status and capturing the second result', async () => {
        // Reset result before the second run
        getCacheState(state).result = null;
        await runCLICommand(state, "process-api -i 'src/**/*.ts' status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).secondResult = getResult(state);
      });

      Then('the second result metadata has cache.hit true', () => {
        const s = getCacheState(state);
        const metadata = parseMetadata(s.secondResult!);
        expect(metadata.cache).toBeDefined();
        expect(metadata.cache!.hit).toBe(true);
      });

      And('the second result pipelineMs is less than the first', () => {
        const s = getCacheState(state);
        const firstMetadata = parseMetadata(s.firstResult!);
        const secondMetadata = parseMetadata(s.secondResult!);
        expect(firstMetadata.pipelineMs).toBeDefined();
        expect(secondMetadata.pipelineMs).toBeDefined();
        expect(secondMetadata.pipelineMs!).toBeLessThan(firstMetadata.pipelineMs!);
      });
    });

    RuleScenario('Cache invalidated on source file change', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running status and capturing the first result', async () => {
        await runCLICommand(state, "process-api -i 'src/**/*.ts' status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).firstResult = getResult(state);
      });

      And('a source file mtime is updated', () => {
        const dir = getTempDir(state);
        const filePath = path.join(dir, 'src', 'completed.ts');
        // Advance mtime by 2 seconds to ensure cache key changes
        const now = new Date();
        const future = new Date(now.getTime() + 2000);
        fs.utimesSync(filePath, future, future);
      });

      And('running status and capturing the second result', async () => {
        getCacheState(state).result = null;
        await runCLICommand(state, "process-api -i 'src/**/*.ts' status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).secondResult = getResult(state);
      });

      Then('the second result metadata has cache.hit false', () => {
        const s = getCacheState(state);
        const metadata = parseMetadata(s.secondResult!);
        expect(metadata.cache).toBeDefined();
        expect(metadata.cache!.hit).toBe(false);
      });
    });

    RuleScenario('No-cache flag bypasses cache', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running status and capturing the first result', async () => {
        await runCLICommand(state, "process-api -i 'src/**/*.ts' status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).firstResult = getResult(state);
      });

      And('running status with --no-cache and capturing the second result', async () => {
        getCacheState(state).result = null;
        await runCLICommand(state, "process-api -i 'src/**/*.ts' --no-cache status", {
          timeout: CACHE_QUERY_TIMEOUT_MS,
        });
        getCacheState(state).secondResult = getResult(state);
      });

      Then('the second result metadata has cache.hit false', () => {
        const s = getCacheState(state);
        const metadata = parseMetadata(s.secondResult!);
        expect(metadata.cache).toBeDefined();
        expect(metadata.cache!.hit).toBe(false);
      });
    });
  });
});
