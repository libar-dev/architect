/**
 * generate-docs CLI Step Definitions
 *
 * BDD step definitions for testing the generate-docs CLI
 * which generates documentation from annotated TypeScript.
 *
 * @architect
 * @architect-implements CliBehaviorTesting
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createTempDir,
  writeTempFile,
  fileExists,
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

function createPatternFile(): string {
  return `/** @architect */

/**
 * @architect-core
 * @architect-pattern TestGeneratorPattern
 * @architect-status completed
 * @architect-uses AnotherPattern
 *
 * ## TestGeneratorPattern
 *
 * A test pattern for generate-docs CLI testing.
 *
 * **When to use:** Use when testing documentation generation.
 */
export interface TestGeneratorPattern {
  id: string;
}
`;
}

function createReferenceDocsConfigFile(): string {
  return `export default {
  sources: {
    typescript: ['src/**/*.ts']
  },
  referenceDocConfigs: [
    {
      title: 'Reference Sample',
      conventionTags: [],
      behaviorCategories: [],
      claudeMdSection: 'reference',
      docsFilename: 'REFERENCE-SAMPLE.md',
      claudeMdFilename: 'reference-sample.md'
    },
    {
      title: 'Configuration Overview',
      productArea: 'Configuration',
      conventionTags: [],
      behaviorCategories: [],
      claudeMdSection: 'configuration',
      docsFilename: 'CONFIGURATION.md',
      claudeMdFilename: 'configuration.md'
    }
  ]
};
`;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/generate-docs.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-generate-docs-test-' });
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
  // Rule: CLI lists available generators
  // ---------------------------------------------------------------------------

  Rule('CLI lists available generators', ({ RuleScenario }) => {
    RuleScenario('List generators with --list-generators', ({ When, Then, And }) => {
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
      'List generators includes config-registered reference meta-generators',
      ({ Given, When, Then, And }) => {
        Given('an architect.config.js with reference doc configs', async () => {
          await writeTempFile(getTempDir(), 'architect.config.js', createReferenceDocsConfigFile());
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('stdout contains all of:', (_ctx: unknown, table: Array<{ text: string }>) => {
          for (const row of table) {
            expect(getResult().stdout).toContain(row.text);
          }
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI generates documentation from source files
  // ---------------------------------------------------------------------------

  Rule('CLI generates documentation from source files', ({ RuleScenario }) => {
    RuleScenario('Generate patterns documentation', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createPatternFile());
        }
      );

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

    RuleScenario(
      'Use default generator (patterns) when not specified',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
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
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI rejects unknown options
  // ---------------------------------------------------------------------------

  Rule('CLI rejects unknown options', ({ RuleScenario }) => {
    RuleScenario('Unknown option causes error', ({ When, Then, And }) => {
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
