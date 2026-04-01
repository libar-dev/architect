/**
 * Data API CLI Metadata Step Definitions
 *
 * BDD step definitions for testing response metadata:
 * validation summary counts and pipeline timing.
 *
 * @architect
 * @architect-implements DataAPICLIErgonomics
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  initState,
  getResult,
  runCLICommand,
  writePatternFiles,
  createTempDir,
} from '../../support/helpers/pattern-graph-api-state.js';

// =============================================================================
// JSON Metadata Parsing
// =============================================================================

interface ValidationMetadata {
  danglingReferenceCount: number;
  malformedPatternCount: number;
  unknownStatusCount: number;
  warningCount: number;
}

interface ResponseMetadata {
  validation?: ValidationMetadata;
  pipelineMs?: number;
  cache?: {
    hit: boolean;
    ageMs?: number;
  };
}

function parseResponseMetadata(stdout: string): ResponseMetadata {
  const parsed = JSON.parse(stdout) as { metadata?: ResponseMetadata };
  if (!parsed.metadata) {
    throw new Error('No metadata in response JSON');
  }
  return parsed.metadata;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/data-api-metadata.feature');

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
      state = initState();
      state.tempContext = await createTempDir({ prefix: 'cli-metadata-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Response metadata includes validation summary
  // ---------------------------------------------------------------------------

  Rule('Response metadata includes validation summary', ({ RuleScenario }) => {
    RuleScenario('Validation summary in response metadata', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is valid JSON with key {string}', (_ctx: unknown, key: string) => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
        expect(parsed).toHaveProperty(key);
      });

      And('metadata has a validation object with count fields', () => {
        const metadata = parseResponseMetadata(getResult(state).stdout);
        expect(metadata.validation).toBeDefined();
        expect(typeof metadata.validation!.danglingReferenceCount).toBe('number');
        expect(typeof metadata.validation!.malformedPatternCount).toBe('number');
        expect(typeof metadata.validation!.unknownStatusCount).toBe('number');
        expect(typeof metadata.validation!.warningCount).toBe('number');
      });

      And('metadata has a numeric pipelineMs field', () => {
        const metadata = parseResponseMetadata(getResult(state).stdout);
        expect(metadata.pipelineMs).toBeDefined();
        expect(typeof metadata.pipelineMs).toBe('number');
        expect(metadata.pipelineMs!).toBeGreaterThanOrEqual(0);
      });
    });

    RuleScenario('Pipeline timing in metadata', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('metadata has a numeric pipelineMs field', () => {
        const metadata = parseResponseMetadata(getResult(state).stdout);
        expect(metadata.pipelineMs).toBeDefined();
        expect(typeof metadata.pipelineMs).toBe('number');
        expect(metadata.pipelineMs!).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
