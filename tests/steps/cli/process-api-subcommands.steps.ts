/**
 * process-api CLI Subcommands Step Definitions
 *
 * BDD step definitions for testing the process-api CLI
 * discovery subcommands: list, search, context assembly,
 * tags/sources, extended arch, unannotated.
 *
 * @architect
 * @architect-implements ProcessStateAPICLI
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type CLITestState,
  initState,
  getResult,
  runCLICommand,
  writePatternFiles,
  writeArchPatternFiles,
  writeArchPatternFilesWithDeps,
  writeTwoContextFiles,
  writeMixedAnnotationFiles,
  createTempDir,
} from '../../support/helpers/process-api-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/process-api-subcommands.feature');

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
  // Rule: CLI list subcommand filters patterns
  // ---------------------------------------------------------------------------

  Rule('CLI list subcommand filters patterns', ({ RuleScenario }) => {
    RuleScenario('List all patterns returns JSON array', ({ Given, When, Then, And }) => {
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

    RuleScenario('List with invalid phase shows error', ({ Given, When, Then, And }) => {
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
  // Rule: CLI search subcommand finds patterns by fuzzy match
  // ---------------------------------------------------------------------------

  Rule('CLI search subcommand finds patterns by fuzzy match', ({ RuleScenario }) => {
    RuleScenario('Search returns matching patterns', ({ Given, When, Then, And }) => {
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

    RuleScenario('Search without query shows error', ({ Given, When, Then, And }) => {
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
  // Rule: CLI context assembly subcommands return text output
  // ---------------------------------------------------------------------------

  Rule('CLI context assembly subcommands return text output', ({ RuleScenario }) => {
    RuleScenario('Context returns curated text bundle', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is non-empty', () => {
        expect(getResult(state).stdout.trim().length).toBeGreaterThan(0);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario('Context without pattern name shows error', ({ Given, When, Then, And }) => {
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

    RuleScenario('Overview returns executive summary text', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is non-empty', () => {
        expect(getResult(state).stdout.trim().length).toBeGreaterThan(0);
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
    });

    RuleScenario('Dep-tree returns dependency tree text', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations and dependencies', async () => {
        await writeArchPatternFilesWithDeps(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is non-empty', () => {
        expect(getResult(state).stdout.trim().length).toBeGreaterThan(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI tags and sources subcommands return JSON
  // ---------------------------------------------------------------------------

  Rule('CLI tags and sources subcommands return JSON', ({ RuleScenario }) => {
    RuleScenario('Tags returns tag usage counts', ({ Given, When, Then, And }) => {
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

    RuleScenario('Sources returns file inventory', ({ Given, When, Then, And }) => {
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
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI extended arch subcommands query architecture relationships
  // ---------------------------------------------------------------------------

  Rule('CLI extended arch subcommands query architecture relationships', ({ RuleScenario }) => {
    RuleScenario(
      'Arch neighborhood returns pattern relationships',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with architecture annotations and dependencies', async () => {
          await writeArchPatternFilesWithDeps(state);
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
      }
    );

    RuleScenario('Arch compare returns context comparison', ({ Given, When, Then, And }) => {
      Given('TypeScript files with two architecture contexts', async () => {
        await writeTwoContextFiles(state);
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

    RuleScenario('Arch coverage returns annotation coverage', ({ Given, When, Then, And }) => {
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
  // Rule: CLI unannotated subcommand finds files without annotations
  // ---------------------------------------------------------------------------

  Rule('CLI unannotated subcommand finds files without annotations', ({ RuleScenario }) => {
    RuleScenario(
      'Unannotated finds files missing libar-docs marker',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with mixed annotations', async () => {
          await writeMixedAnnotationFiles(state);
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
      }
    );
  });
});
