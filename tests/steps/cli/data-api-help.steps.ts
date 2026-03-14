/**
 * Data API CLI Per-Subcommand Help Step Definitions
 *
 * BDD step definitions for testing per-subcommand help output,
 * global help, and unknown subcommand help fallback.
 *
 * @libar-docs
 * @libar-docs-implements DataAPICLIErgonomics
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  initState,
  getResult,
  runCLICommand,
  createTempDir,
} from '../../support/helpers/process-api-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/data-api-help.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-help-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Per-subcommand help shows usage and flags
  // ---------------------------------------------------------------------------

  Rule('Per-subcommand help shows usage and flags', ({ RuleScenario }) => {
    RuleScenario('Per-subcommand help for context', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains context usage and session flag', () => {
        const stdout = getResult(state).stdout;
        expect(stdout).toContain('context');
        expect(stdout).toContain('--session');
      });
    });

    RuleScenario('Global help still works', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario('Unknown subcommand help', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });
  });
});
