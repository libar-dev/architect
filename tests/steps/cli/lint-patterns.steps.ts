/**
 * lint-patterns CLI Step Definitions
 *
 * BDD step definitions for testing the lint-patterns CLI
 * which validates pattern annotation quality.
 *
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import path from 'node:path';
import {
  createTempDir,
  writeTempFile,
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
// Fixture Content Builders
// =============================================================================

function createCompletePatternFile(): string {
  return `/** @architect */

/**
 * @architect-role:service
 * @architect-pattern AnotherPattern
 * @architect-status completed
 * @architect-uses TestPattern
 *
 * ## AnotherPattern
 *
 * Provides the companion pattern used by TestPattern.
 *
 * **When to use:** Use this pattern when validating relationship-aware lint passes.
 */
export interface AnotherPattern {
  id: string;
}

/**
 * @architect-role:service
 * @architect-pattern TestPattern
 * @architect-status completed
 * @architect-uses AnotherPattern
 *
 * ## TestPattern
 *
 * A test pattern with complete annotations.
 *
 * **When to use:** Use this pattern when testing lint-patterns CLI.
 */
export interface TestPattern {
  id: string;
}
`;
}

function createMissingPatternNameFile(): string {
  return `/** @architect */

/**
 * @architect-role:service
 * @architect-status completed
 *
 * ## Some Pattern
 *
 * This pattern is missing its explicit name tag.
 */
export interface MissingName {
  id: string;
}
`;
}

function createMissingStatusFile(): string {
  return `/** @architect */

/**
 * @architect-role:service
 * @architect-pattern WarningPattern
 *
 * ## WarningPattern
 *
 * Missing @architect-status tag (warning level).
 *
 * ### When to Use
 *
 * Testing warning-level violations.
 */
export interface WarningPattern {
  id: string;
}
`;
}

function createUnresolvedUsesFile(): string {
  return `/** @architect */

/**
 * @architect-role:service
 * @architect-pattern UsesMissingPattern
 * @architect-status completed
 * @architect-uses MissingPattern
 *
 * ## UsesMissingPattern
 *
 * A pattern that references a missing target.
 *
 * **When to use:** Use this pattern when validating unresolved uses enforcement.
 */
export interface UsesMissingPattern {
  id: string;
}
`;
}

function createInvalidPatternNameFile(): string {
  return `/** @architect */

/**
 * @architect-role:service
 * @architect-pattern Invalid Pattern - description
 * @architect-status completed
 *
 * ## Invalid Pattern
 *
 * This pattern identity should fail PascalCase validation.
 *
 * **When to use:** Use this pattern when validating invalid identity enforcement.
 */
export interface InvalidPatternName {
  id: string;
}
`;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/lint-patterns.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-lint-patterns-test-' });
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

  async function copyLegacyFixture(fixtureName: string, relativePath: string): Promise<void> {
    const fixturePath = path.resolve('tests/fixtures/legacy-taxonomy', fixtureName);
    const fixture = await import('node:fs/promises').then((fs) =>
      fs.readFile(fixturePath, 'utf-8'),
    );
    await writeTempFile(getTempDir(), relativePath, fixture);
  }

  // ---------------------------------------------------------------------------
  // Rule: CLI displays help and version information
  // ---------------------------------------------------------------------------

  Rule('CLI displays help and version information', ({ RuleScenario }) => {
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
  // Rule: CLI requires input patterns
  // ---------------------------------------------------------------------------

  Rule('CLI requires input patterns', ({ RuleScenario }) => {
    RuleScenario('Fail without --input flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult().stdout + getResult().stderr;
        expect(combined).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Lint passes for valid patterns
  // ---------------------------------------------------------------------------

  Rule('Lint passes for valid patterns', ({ RuleScenario }) => {
    RuleScenario('Lint passes for complete annotations', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with complete annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createCompletePatternFile());
        },
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
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Lint detects violations in incomplete patterns
  // ---------------------------------------------------------------------------

  Rule('Lint detects violations in incomplete patterns', ({ RuleScenario }) => {
    RuleScenario('Report violations for incomplete annotations', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} without pattern name',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createMissingPatternNameFile());
        },
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
    });

    RuleScenario('Reject unresolved uses by default', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with unresolved uses',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createUnresolvedUsesFile());
        },
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
    });

    RuleScenario('Reject invalid pattern names by default', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with invalid pattern name',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createInvalidPatternNameFile());
        },
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
    });

    RuleScenario('Reject dangling pattern removal', ({ Given, When, Then, And }) => {
      Given(
        'the legacy taxonomy fixture {string} is copied to {string}',
        async (_ctx: unknown, fixtureName: string, relativePath: string) => {
          await copyLegacyFixture(fixtureName, relativePath);
        },
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
    });

    RuleScenario(
      'Baseline does not hide new touched-file violations',
      ({ Given, When, Then, And }) => {
        Given(
          'the legacy taxonomy fixture {string} is copied to {string}',
          async (_ctx: unknown, fixtureName: string, relativePath: string) => {
            await copyLegacyFixture(fixtureName, relativePath);
          },
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
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI supports multiple output formats
  // ---------------------------------------------------------------------------

  Rule('CLI supports multiple output formats', ({ RuleScenario }) => {
    RuleScenario('JSON output format', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with complete annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createCompletePatternFile());
        },
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const output = getResult().stdout.trim();
        // Find JSON object in output (may have prefix logs)
        const jsonStart = output.indexOf('{');
        if (jsonStart === -1) {
          throw new Error('No JSON object found in output');
        }
        const jsonStr = output.substring(jsonStart);
        expect(() => {
          JSON.parse(jsonStr);
        }).not.toThrow();
      });
    });

    RuleScenario('Pretty output format is default', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with complete annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createCompletePatternFile());
        },
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
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Strict mode treats warnings as errors
  // ---------------------------------------------------------------------------

  Rule('Strict mode treats warnings as errors', ({ RuleScenario }) => {
    RuleScenario('Strict mode fails on warnings', ({ Given, When, Then }) => {
      Given(
        'a TypeScript file {string} with missing status',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createMissingStatusFile());
        },
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });

    RuleScenario('Non-strict mode passes with warnings', ({ Given, When, Then }) => {
      Given(
        'a TypeScript file {string} with missing status',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createMissingStatusFile());
        },
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });
  });
});
