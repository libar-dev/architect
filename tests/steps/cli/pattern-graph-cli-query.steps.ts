/**
 * pattern-graph CLI Query Passthrough Step Definitions
 *
 * BDD step definitions for testing the pattern-graph CLI `query <method>`
 * passthrough: method dispatch, argument coercion, enum validation, and the
 * compact-summary shape the list-shaped methods must return.
 *
 * @architect
 * @architect-implements PatternGraphAPICLI
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
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Helpers
// =============================================================================

const COMPACT_SUMMARY_KEYS = new Set(['patternName', 'status', 'role', 'file']);

function parseDataArray(): readonly Record<string, unknown>[] {
  const parsed = JSON.parse(getResult(state).stdout) as { data?: unknown };
  expect(Array.isArray(parsed.data)).toBe(true);
  return parsed.data as readonly Record<string, unknown>[];
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/pattern-graph-cli-query.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-pattern-graph-query-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI query subcommand executes API methods
  // ---------------------------------------------------------------------------

  Rule('CLI query subcommand executes API methods', ({ RuleScenario }) => {
    RuleScenario('Query getStatusCounts returns count object', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult(state);
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Query isValidTransition with arguments', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult(state);
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario(
      'Query getStatusDistribution returns a structured object',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          const result = getResult(state);
          expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
        });
      },
    );

    RuleScenario(
      "Query getPatternDependencies resolves a pattern's edges",
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          const result = getResult(state);
          expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
        });
      },
    );

    RuleScenario(
      'Query getPatternsByNormalizedStatus accepts the normalized enum',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          const result = getResult(state);
          expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
        });
      },
    );

    RuleScenario(
      'Query checkTransition returns a transition check for raw statuses',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          const result = getResult(state);
          expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
        });
      },
    );

    RuleScenario('Invalid normalized status argument shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Missing pattern-name argument shows usage', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Unknown API method shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Invalid accepted status argument shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Invalid phase query argument shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI query list methods return compact summaries
  // ---------------------------------------------------------------------------

  Rule('CLI query list methods return compact summaries', ({ RuleScenario }) => {
    RuleScenario(
      'Query getPatternsByStatus returns compact entries',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          const result = getResult(state);
          expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
        });

        And('the data array is non-empty', () => {
          expect(parseDataArray().length).toBeGreaterThan(0);
        });

        And('every data item has only compact summary keys', () => {
          for (const item of parseDataArray()) {
            for (const key of Object.keys(item)) {
              expect(COMPACT_SUMMARY_KEYS.has(key)).toBe(true);
            }
            expect(item['patternName']).toBeDefined();
            expect(item['status']).toBeDefined();
            expect(item['file']).toBeDefined();
          }
        });

        And('no data item carries full-pattern keys', () => {
          for (const item of parseDataArray()) {
            expect('scenarios' in item).toBe(false);
            expect('rules' in item).toBe(false);
            expect('directive' in item).toBe(false);
          }
        });
      },
    );

    RuleScenario('Query getCurrentWork returns compact entries', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult(state);
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });

      And('the data array is non-empty', () => {
        expect(parseDataArray().length).toBeGreaterThan(0);
      });

      And('every data item has only compact summary keys', () => {
        for (const item of parseDataArray()) {
          for (const key of Object.keys(item)) {
            expect(COMPACT_SUMMARY_KEYS.has(key)).toBe(true);
          }
          expect(item['patternName']).toBeDefined();
          expect(item['status']).toBeDefined();
          expect(item['file']).toBeDefined();
        }
      });

      And('no data item carries full-pattern keys', () => {
        for (const item of parseDataArray()) {
          expect('scenarios' in item).toBe(false);
          expect('rules' in item).toBe(false);
          expect('directive' in item).toBe(false);
        }
      });
    });
  });
});
