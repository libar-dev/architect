/**
 * lint-process CLI Step Definitions
 *
 * BDD step definitions for testing the lint-process CLI
 * which validates changes against delivery process rules.
 *
 * @architect
 * @architect-implements CliBehaviorTesting
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { execSync } from 'node:child_process';
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
// Git Repository Setup
// =============================================================================

function initGitRepo(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
  // Create initial commit to have a valid git state
  execSync('git commit --allow-empty -m "Initial commit"', { cwd: dir, stdio: 'pipe' });
}

// =============================================================================
// Fixture Content Builders
// =============================================================================

function createFeatureFile(status: string, unlockReason?: string): string {
  const lines = [
    '@architect-pattern:TestPattern',
    '@architect-phase:1',
    `@architect-status:${status}`,
  ];

  if (unlockReason) {
    lines.push(`@architect-unlock-reason:${unlockReason}`);
  }

  lines.push(
    'Feature: Test Pattern',
    '  A test feature for lint-process CLI testing.',
    '',
    '  Scenario: Basic scenario',
    '    Given a test condition',
    '    When an action occurs',
    '    Then a result is expected',
    ''
  );

  return lines.join('\n');
}

function createArchitectConfig(featurePattern: string): string {
  return `export default {
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['${featurePattern}'],
  },
};
`;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/lint-process.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-lint-process-test-' });
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
  // Rule: CLI requires git repository for validation
  // ---------------------------------------------------------------------------

  Rule('CLI requires git repository for validation', ({ RuleScenario }) => {
    RuleScenario('Fail without git repository in staged mode', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult().stdout + getResult().stderr;
        expect(combined.toLowerCase()).toContain(text.toLowerCase());
      });
    });

    RuleScenario('Fail without git repository in all mode', ({ When, Then, And }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult().stdout + getResult().stderr;
        expect(combined.toLowerCase()).toContain(text.toLowerCase());
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI validates file mode input
  // ---------------------------------------------------------------------------

  Rule('CLI validates file mode input', ({ RuleScenario }) => {
    RuleScenario('Fail when files mode has no files', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

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

    RuleScenario('Accept file via positional argument', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

      And(
        'a feature file {string} with status {string}',
        async (_ctx: unknown, filePath: string, status: string) => {
          await writeTempFile(getTempDir(), filePath, createFeatureFile(status));
        }
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });

    RuleScenario('Accept file via --file flag', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

      And(
        'a feature file {string} with status {string}',
        async (_ctx: unknown, filePath: string, status: string) => {
          await writeTempFile(getTempDir(), filePath, createFeatureFile(status));
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
  // Rule: CLI handles no changes gracefully
  // ---------------------------------------------------------------------------

  Rule('CLI handles no changes gracefully', ({ RuleScenario }) => {
    RuleScenario('No changes detected exits successfully', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

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
    RuleScenario('JSON output format', ({ Given, When, Then }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });

    RuleScenario('Pretty output format is default', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

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
  // Rule: CLI supports debug options
  // ---------------------------------------------------------------------------

  Rule('CLI supports debug options', ({ RuleScenario }) => {
    RuleScenario('Show state flag displays derived state', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

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
    RuleScenario('Warn on unknown flag but continue', ({ Given, When, Then, And }) => {
      Given('a git repository', () => {
        initGitRepo(getTempDir());
      });

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
  // Rule: CLI honors config-defined feature scope
  // ---------------------------------------------------------------------------

  Rule('CLI honors config-defined feature scope', ({ RuleScenario }) => {
    RuleScenario(
      'Config includes completed test features in process state',
      ({ Given, And, When, Then }) => {
        Given('a git repository', () => {
          initGitRepo(getTempDir());
        });

        And(
          'an architect config that scopes features to {string}',
          async (_ctx: unknown, featurePattern: string) => {
            await writeTempFile(
              getTempDir(),
              'architect.config.ts',
              createArchitectConfig(featurePattern)
            );
          }
        );

        And(
          'a completed feature file {string} with unlock-reason {string}',
          async (_ctx: unknown, filePath: string, unlockReason: string) => {
            await writeTempFile(
              getTempDir(),
              filePath,
              createFeatureFile('completed', unlockReason)
            );
          }
        );

        And('all files are staged', () => {
          execSync('git add .', { cwd: getTempDir(), stdio: 'pipe' });
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output does not contain {string}', (_ctx: unknown, text: string) => {
          const combined = getResult().stdout + getResult().stderr;
          expect(combined).not.toContain(text);
        });
      }
    );

    RuleScenario(
      'Non-feature files with status-like text are ignored',
      ({ Given, And, When, Then }) => {
        Given('a git repository', () => {
          initGitRepo(getTempDir());
        });

        And(
          'an architect config that scopes features to {string}',
          async (_ctx: unknown, featurePattern: string) => {
            await writeTempFile(
              getTempDir(),
              'architect.config.ts',
              createArchitectConfig(featurePattern)
            );
          }
        );

        And(
          'a markdown file {string} containing {string}',
          async (_ctx: unknown, filePath: string, content: string) => {
            await writeTempFile(getTempDir(), filePath, `# Example\n\n${content}\n`);
          }
        );

        And('all files are staged', () => {
          execSync('git add .', { cwd: getTempDir(), stdio: 'pipe' });
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output does not contain {string}', (_ctx: unknown, text: string) => {
          const combined = getResult().stdout + getResult().stderr;
          expect(combined).not.toContain(text);
        });
      }
    );
  });
});
