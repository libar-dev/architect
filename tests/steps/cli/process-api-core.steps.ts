/**
 * process-api CLI Core Step Definitions
 *
 * BDD step definitions for testing the process-api CLI
 * core infrastructure: help, version, input validation,
 * status, query, pattern, arch basics, missing args, edge cases.
 *
 * @architect
 * @architect-implements PatternGraphAPICLI
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { writeTempFile } from '../../support/helpers/file-system.js';
import {
  type CLITestState,
  initState,
  getResult,
  runCLICommand,
  writePatternFiles,
  writeArchPatternFiles,
  createTempDir,
} from '../../support/helpers/pattern-graph-api-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/process-api-core.feature');

function createJsProjectConfig(): string {
  return `export default {
  sources: {
    typescript: ['src/**/*.ts']
  }
};
`;
}

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
      state.tempContext = await createTempDir({ prefix: 'cli-process-api-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI displays help and version information
  // ---------------------------------------------------------------------------

  Rule('CLI displays help and version information', ({ RuleScenario }) => {
    RuleScenario('Display help with --help flag', ({ When, Then, And }) => {
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

    RuleScenario('Display version with -v flag', ({ When, Then }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });
    });

    RuleScenario('No subcommand shows help', ({ When, Then, And }) => {
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
  // Rule: CLI requires input flag for subcommands
  // ---------------------------------------------------------------------------

  Rule('CLI requires input flag for subcommands', ({ RuleScenario }) => {
    RuleScenario('Fail without --input flag when running status', ({ When, Then, And }) => {
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

    RuleScenario(
      'Use architect.config.js sources when --input is omitted',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('an architect.config.js with TypeScript sources', async () => {
          await writeTempFile(
            state!.tempContext!.tempDir,
            'architect.config.js',
            createJsProjectConfig()
          );
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
      }
    );

    RuleScenario('Reject unknown options', ({ When, Then, And }) => {
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
  // Rule: CLI status subcommand shows delivery state
  // ---------------------------------------------------------------------------

  Rule('CLI status subcommand shows delivery state', ({ RuleScenario }) => {
    RuleScenario('Status shows counts and completion percentage', ({ Given, When, Then, And }) => {
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
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI pattern subcommand shows pattern detail
  // ---------------------------------------------------------------------------

  Rule('CLI pattern subcommand shows pattern detail', ({ RuleScenario }) => {
    RuleScenario('Pattern lookup returns full detail', ({ Given, When, Then, And }) => {
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

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario('Pattern not found shows error', ({ Given, When, Then, And }) => {
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
  // Rule: CLI arch subcommand queries architecture
  // ---------------------------------------------------------------------------

  Rule('CLI arch subcommand queries architecture', ({ RuleScenario }) => {
    RuleScenario('Arch roles lists roles with counts', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles(state);
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

    RuleScenario('Arch context filters to bounded context', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles(state);
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

    RuleScenario('Arch layer lists layers with counts', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles(state);
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
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI shows errors for missing subcommand arguments
  // ---------------------------------------------------------------------------

  Rule('CLI shows errors for missing subcommand arguments', ({ RuleScenario }) => {
    RuleScenario('Query without method name shows error', ({ Given, When, Then, And }) => {
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

    RuleScenario('Pattern without name shows error', ({ Given, When, Then, And }) => {
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

    RuleScenario('Unknown subcommand shows error', ({ Given, When, Then, And }) => {
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
  // Rule: CLI handles argument edge cases
  // ---------------------------------------------------------------------------

  Rule('CLI handles argument edge cases', ({ RuleScenario }) => {
    RuleScenario('Integer arguments are coerced for phase queries', ({ Given, When, Then }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });
    });

    RuleScenario('Double-dash separator is handled gracefully', ({ When, Then }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });
    });
  });
});
