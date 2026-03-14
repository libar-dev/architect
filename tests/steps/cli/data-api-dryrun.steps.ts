/**
 * Data API CLI Dry Run Step Definitions
 *
 * BDD step definitions for testing --dry-run mode:
 * pipeline scope display without processing.
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
} from '../../support/helpers/process-api-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/data-api-dryrun.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-dryrun-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Dry-run shows pipeline scope without processing
  // ---------------------------------------------------------------------------

  Rule('Dry-run shows pipeline scope without processing', ({ RuleScenario }) => {
    RuleScenario('Dry-run shows file counts', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains dry run marker, file counts, config, and cache status', () => {
        const stdout = getResult(state).stdout;
        expect(stdout).toContain('DRY RUN');
        expect(stdout).toContain('TypeScript files:');
        expect(stdout).toContain('Config:');
        expect(stdout).toContain('Cache:');
      });

      And('stdout does not contain {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).not.toContain(text);
      });
    });
  });
});
