/**
 * Data API CLI REPL Step Definitions
 *
 * BDD step definitions for testing the interactive REPL mode:
 * multi-query sessions, help output, and pipeline reload.
 *
 * @architect
 * @architect-implements DataAPICLIErgonomics
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  type CLIResult,
  initState,
  writePatternFiles,
  createTempDir,
} from '../../support/helpers/pattern-graph-api-state.js';
import { runCLI } from '../../support/helpers/cli-runner.js';

// =============================================================================
// Extended State for REPL Tests
// =============================================================================

interface ReplTestState extends CLITestState {
  replResult: CLIResult | null;
}

function initReplState(): ReplTestState {
  const base = initState();
  return {
    ...base,
    replResult: null,
  };
}

function getReplState(state: ReplTestState | null): ReplTestState {
  if (!state) throw new Error('REPL test state not initialized');
  return state;
}

function getTempDir(state: ReplTestState | null): string {
  const s = getReplState(state);
  if (!s.tempContext) throw new Error('Temp context not initialized');
  return s.tempContext.tempDir;
}

function getReplResult(state: ReplTestState | null): CLIResult {
  const s = getReplState(state);
  if (!s.replResult) throw new Error('REPL result not available');
  return s.replResult;
}

// =============================================================================
// REPL Runner Helper
// =============================================================================

async function runRepl(state: ReplTestState | null, commands: string[]): Promise<void> {
  const s = getReplState(state);
  const stdinData = commands.join('\n') + '\n';
  s.replResult = await runCLI('process-api', ['-i', "'src/**/*.ts'", 'repl'], {
    cwd: getTempDir(state),
    timeout: 30000,
    stdin: stdinData,
  });
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ReplTestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/data-api-repl.feature');

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
      state = initReplState();
      state.tempContext = await createTempDir({ prefix: 'cli-repl-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: REPL mode accepts multiple queries on a single pipeline load
  // ---------------------------------------------------------------------------

  Rule('REPL mode accepts multiple queries on a single pipeline load', ({ RuleScenario }) => {
    RuleScenario('REPL accepts multiple queries', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('piping "status" then "list" then "quit" to the REPL', async () => {
        await runRepl(state, ['status', 'list', 'quit']);
      });

      Then('the REPL output contains status JSON', () => {
        const result = getReplResult(state);
        // status command outputs pretty-printed JSON with success and data fields
        expect(result.stdout).toContain('"success": true');
        expect(result.stdout).toContain('"counts"');
      });

      And('the REPL output contains list JSON', () => {
        const result = getReplResult(state);
        // list command outputs JSON with pattern names
        expect(result.stdout).toContain('"RoadmapPattern"');
      });

      And('the REPL exits cleanly', () => {
        const result = getReplResult(state);
        // REPL should exit with code 0 after quit
        expect(result.exitCode).toBe(0);
      });
    });

    RuleScenario('REPL shows help output', ({ Given, When, Then }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('piping "help" then "quit" to the REPL', async () => {
        await runRepl(state, ['help', 'quit']);
      });

      Then('the REPL output contains available commands', () => {
        const result = getReplResult(state);
        // help goes to stdout
        expect(result.stdout).toContain('status');
        expect(result.stdout).toContain('context');
        expect(result.stdout).toContain('dep-tree');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: REPL reload rebuilds the pipeline from fresh sources
  // ---------------------------------------------------------------------------

  Rule('REPL reload rebuilds the pipeline from fresh sources', ({ RuleScenario }) => {
    RuleScenario('REPL reloads pipeline on command', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('piping "status" then "reload" then "status" then "quit" to the REPL', async () => {
        await runRepl(state, ['status', 'reload', 'status', 'quit']);
      });

      Then('the REPL stderr contains "Reloading pipeline"', () => {
        const result = getReplResult(state);
        expect(result.stderr).toContain('Reloading pipeline');
      });

      And('the REPL stderr contains "Reloaded"', () => {
        const result = getReplResult(state);
        expect(result.stderr).toContain('Reloaded');
      });

      And('the REPL output contains two status responses', () => {
        const result = getReplResult(state);
        // Both status commands produce JSON with success:true
        // Count occurrences of "success": true — should be at least 2
        const matches = result.stdout.match(/"success": true/g);
        expect(matches).not.toBeNull();
        expect(matches!.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
