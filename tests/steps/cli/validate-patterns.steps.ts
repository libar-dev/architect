/**
 * validate-patterns CLI Step Definitions
 *
 * BDD step definitions for testing the validate-patterns CLI
 * which cross-validates TypeScript patterns vs Gherkin feature files.
 *
 * @architect
 * @architect-implements CliBehaviorTesting
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
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

function createTypeScriptPatternFile(patternName: string, phase: number, status: string): string {
  return `/** @architect */

/**
 * @architect-core
 * @architect-pattern ${patternName}
 * @architect-phase ${phase}
 * @architect-status ${status}
 *
 * ## ${patternName}
 *
 * A test pattern for validate-patterns CLI testing.
 *
 * **When to use:** Use when testing cross-source validation.
 */
export interface ${patternName} {
  id: string;
}
`;
}

function createGherkinPatternFile(patternName: string, phase: number, status: string): string {
  // Include deliverables for completed patterns to pass validation
  // Deliverables are extracted from Background DataTables, not tags
  const backgroundSection =
    status === 'completed'
      ? `
  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Location |
      | Test deliverable | complete | 1 | src/test.ts |

`
      : '';

  return `@architect
@architect-pattern:${patternName}
@architect-phase:${phase}
@architect-status:${status}
Feature: ${patternName}
  Test feature for validate-patterns CLI testing.
${backgroundSection}
  Scenario: Basic scenario
    Given a test condition
    When an action occurs
    Then a result is expected
`;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/validate-patterns.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-validate-patterns-test-' });
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
  // Rule: CLI requires input and feature patterns
  // ---------------------------------------------------------------------------

  Rule('CLI requires input and feature patterns', ({ RuleScenario }) => {
    RuleScenario('Fail without --input flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stderr contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stderr).toContain(text);
      });
    });

    RuleScenario('Fail without --features flag', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stderr contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stderr).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI validates patterns across TypeScript and Gherkin sources
  // ---------------------------------------------------------------------------

  Rule('CLI validates patterns across TypeScript and Gherkin sources', ({ RuleScenario }) => {
    RuleScenario('Validation passes for matching patterns', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
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
    });

    RuleScenario('Detect phase mismatch between sources', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
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
    });

    RuleScenario('Detect status mismatch between sources', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
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
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI supports multiple output formats
  // ---------------------------------------------------------------------------

  Rule('CLI supports multiple output formats', ({ RuleScenario }) => {
    RuleScenario('JSON output format', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
        }
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
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
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
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Strict mode treats warnings as errors
  // ---------------------------------------------------------------------------

  Rule('Strict mode treats warnings as errors', ({ RuleScenario }) => {
    RuleScenario('Strict mode exits with code 2 on warnings', ({ Given, When, Then }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
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
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI warns about unknown flags
  // ---------------------------------------------------------------------------

  Rule('CLI warns about unknown flags', ({ RuleScenario }) => {
    RuleScenario('Warn on unknown flag but continue', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createTypeScriptPatternFile(patternName, phase, status)
          );
        }
      );

      And(
        'a Gherkin file {string} with pattern {string} at phase {int} status {string}',
        async (
          _ctx: unknown,
          filePath: string,
          patternName: string,
          phase: number,
          status: string
        ) => {
          await writeTempFile(
            getTempDir(),
            filePath,
            createGherkinPatternFile(patternName, phase, status)
          );
        }
      );

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
});
