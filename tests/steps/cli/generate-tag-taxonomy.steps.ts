/**
 * generate-tag-taxonomy CLI Step Definitions
 *
 * BDD step definitions for testing the generate-tag-taxonomy CLI
 * which generates TAG_TAXONOMY.md from tag registry configuration.
 *
 * @libar-docs
 * @libar-docs-implements CliBehaviorTesting
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createTempDir,
  writeTempFile,
  fileExists,
  readTempFile,
  type TempDirContext,
} from '../../support/helpers/file-system.js';
import { runCommand, type CLIResult } from '../../support/helpers/cli-runner.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface CLITestState {
  tempContext: TempDirContext | null;
  result: CLIResult | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

function initState(): CLITestState {
  return {
    tempContext: null,
    result: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/generate-tag-taxonomy.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-tag-taxonomy-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  function getState(): CLITestState {
    if (!state) throw new Error('State not initialized');
    return state;
  }

  function getTempDir(): string {
    const s = getState();
    if (!s.tempContext) throw new Error('Temp context not initialized');
    return s.tempContext.tempDir;
  }

  function getResult(): CLIResult {
    const s = getState();
    if (!s.result) throw new Error('CLI result not available - did you run a command?');
    return s.result;
  }

  async function runCLICommand(commandString: string): Promise<void> {
    const s = getState();
    s.result = await runCommand(commandString, { cwd: getTempDir() });
  }

  // ---------------------------------------------------------------------------
  // Rule: CLI displays help and version information
  // ---------------------------------------------------------------------------

  Rule('CLI displays help and version information', ({ RuleScenario }) => {
    // Scenario: Display help with --help flag (When, Then, And)
    RuleScenario('Display help with --help flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });

    // Scenario: Display help with -h flag (When, Then, And)
    RuleScenario('Display help with -h flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });

    // Scenario: Display version with --version flag (When, Then, And)
    RuleScenario('Display version with --version flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });

    // Scenario: Display version with -v flag (When, Then)
    RuleScenario('Display version with -v flag', ({ When, Then }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI generates taxonomy at specified output path
  // ---------------------------------------------------------------------------

  Rule('CLI generates taxonomy at specified output path', ({ RuleScenario }) => {
    // Scenario: Generate taxonomy at default path (When, Then, And, And)
    RuleScenario('Generate taxonomy at default path', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });

      And(
        'file {string} exists in working directory',
        async (_ctx: unknown, relativePath: string) => {
          const exists = await fileExists(getTempDir(), relativePath);
          expect(exists).toBe(true);
        }
      );
    });

    // Scenario: Generate taxonomy at custom output path (When, Then, And, And)
    RuleScenario('Generate taxonomy at custom output path', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });

      And(
        'file {string} exists in working directory',
        async (_ctx: unknown, relativePath: string) => {
          const exists = await fileExists(getTempDir(), relativePath);
          expect(exists).toBe(true);
        }
      );
    });

    // Scenario: Create output directory if missing (When, Then, And)
    RuleScenario('Create output directory if missing', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And(
        'file {string} exists in working directory',
        async (_ctx: unknown, relativePath: string) => {
          const exists = await fileExists(getTempDir(), relativePath);
          expect(exists).toBe(true);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI respects overwrite flag for existing files
  // ---------------------------------------------------------------------------

  Rule('CLI respects overwrite flag for existing files', ({ RuleScenario }) => {
    // Scenario: Fail when output file exists without --overwrite (Given, When, Then, And)
    RuleScenario(
      'Fail when output file exists without --overwrite',
      ({ Given, When, Then, And }) => {
        Given(
          'file {string} exists with content {string}',
          async (_ctx: unknown, relativePath: string, content: string) => {
            await writeTempFile(getTempDir(), relativePath, content);
          }
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('stderr contains {string}', (_ctx: unknown, text: string) => {
          // Check both stderr and stdout since some CLIs output errors to stdout
          const combined = getResult().stderr + getResult().stdout;
          expect(combined).toContain(text);
        });
      }
    );

    // Scenario: Overwrite existing file with -f flag (Given, When, Then, And, And)
    RuleScenario('Overwrite existing file with -f flag', ({ Given, When, Then, And }) => {
      Given(
        'file {string} exists with content {string}',
        async (_ctx: unknown, relativePath: string, content: string) => {
          await writeTempFile(getTempDir(), relativePath, content);
        }
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });

      And(
        'file {string} does not contain {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readTempFile(getTempDir(), relativePath);
          expect(content).not.toContain(text);
        }
      );
    });

    // Scenario: Overwrite existing file with --overwrite flag (Given, When, Then, And)
    RuleScenario('Overwrite existing file with --overwrite flag', ({ Given, When, Then, And }) => {
      Given(
        'file {string} exists with content {string}',
        async (_ctx: unknown, relativePath: string, content: string) => {
          await writeTempFile(getTempDir(), relativePath, content);
        }
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And(
        'file {string} does not contain {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readTempFile(getTempDir(), relativePath);
          expect(content).not.toContain(text);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Generated taxonomy contains expected sections
  // ---------------------------------------------------------------------------

  Rule('Generated taxonomy contains expected sections', ({ RuleScenario }) => {
    // Scenario: Generated file contains category documentation (When, Then, And)
    RuleScenario('Generated file contains category documentation', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And(
        'file {string} contains {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readTempFile(getTempDir(), relativePath);
          expect(content).toContain(text);
        }
      );
    });

    // Scenario: Generated file reports statistics (When, Then, And)
    RuleScenario('Generated file reports statistics', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI warns about unknown flags
  // ---------------------------------------------------------------------------

  Rule('CLI warns about unknown flags', ({ RuleScenario }) => {
    // Scenario: Warn on unknown flag but continue (When, Then, And, And)
    RuleScenario('Warn on unknown flag but continue', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stderr contains {string}', (_ctx: unknown, text: string) => {
        // Check both stderr and stdout since warnings go to console.warn
        const combined = getResult().stderr + getResult().stdout;
        expect(combined).toContain(text);
      });

      And(
        'file {string} exists in working directory',
        async (_ctx: unknown, relativePath: string) => {
          const exists = await fileExists(getTempDir(), relativePath);
          expect(exists).toBe(true);
        }
      );
    });
  });
});
