/**
 * process-api CLI Step Definitions
 *
 * BDD step definitions for testing the process-api CLI
 * which queries delivery process state via ProcessStateAPI.
 *
 * @libar-docs
 * @libar-docs-implements ProcessStateAPICLI
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createTempDir,
  writeTempFile,
  createTsFileWithDirective,
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

function createPatternFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/completed.ts',
      content: createTsFileWithDirective({
        patternName: 'CompletedPattern',
        status: 'completed',
      }),
    },
    {
      path: 'src/active.ts',
      content: createTsFileWithDirective({
        patternName: 'ActivePattern',
        status: 'active',
      }),
    },
    {
      path: 'src/roadmap.ts',
      content: createTsFileWithDirective({
        patternName: 'RoadmapPattern',
        status: 'roadmap',
      }),
    },
  ];
}

function createArchPatternFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/scanner.ts',
      content: createTsFileWithDirective({
        patternName: 'TestScanner',
        status: 'completed',
        archRole: 'infrastructure',
        archContext: 'testctx',
        archLayer: 'infrastructure',
      }),
    },
    {
      path: 'src/codec.ts',
      content: createTsFileWithDirective({
        patternName: 'TestCodec',
        status: 'completed',
        archRole: 'projection',
        archContext: 'testctx',
        archLayer: 'application',
      }),
    },
  ];
}

function createArchPatternFilesWithDeps(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/scanner-service.ts',
      content: createTsFileWithDirective({
        patternName: 'ScannerService',
        status: 'completed',
        archRole: 'service',
        archContext: 'scanner',
        archLayer: 'application',
        uses: ['FileCache'],
      }),
    },
    {
      path: 'src/file-cache.ts',
      content: createTsFileWithDirective({
        patternName: 'FileCache',
        status: 'completed',
        archRole: 'infrastructure',
        archContext: 'scanner',
        archLayer: 'infrastructure',
        usedBy: ['ScannerService'],
      }),
    },
  ];
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/process-api.feature');

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

  async function writePatternFiles(): Promise<void> {
    const dir = getTempDir();
    for (const file of createPatternFiles()) {
      await writeTempFile(dir, file.path, file.content);
    }
  }

  async function writeArchPatternFiles(): Promise<void> {
    const dir = getTempDir();
    for (const file of createArchPatternFiles()) {
      await writeTempFile(dir, file.path, file.content);
    }
  }

  async function writeArchPatternFilesWithDeps(): Promise<void> {
    const dir = getTempDir();
    for (const file of createArchPatternFilesWithDeps()) {
      await writeTempFile(dir, file.path, file.content);
    }
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

    RuleScenario('No subcommand shows help', ({ When, Then, And }) => {
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
  // Rule: CLI requires input flag for subcommands
  // ---------------------------------------------------------------------------

  Rule('CLI requires input flag for subcommands', ({ RuleScenario }) => {
    RuleScenario('Fail without --input flag when running status', ({ When, Then, And }) => {
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

    RuleScenario('Reject unknown options', ({ When, Then, And }) => {
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
  // Rule: CLI status subcommand shows delivery state
  // ---------------------------------------------------------------------------

  Rule('CLI status subcommand shows delivery state', ({ RuleScenario }) => {
    RuleScenario('Status shows counts and completion percentage', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI query subcommand executes API methods
  // ---------------------------------------------------------------------------

  Rule('CLI query subcommand executes API methods', ({ RuleScenario }) => {
    RuleScenario('Query getStatusCounts returns count object', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Query isValidTransition with arguments', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Unknown API method shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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
  // Rule: CLI pattern subcommand shows pattern detail
  // ---------------------------------------------------------------------------

  Rule('CLI pattern subcommand shows pattern detail', ({ RuleScenario }) => {
    RuleScenario('Pattern lookup returns full detail', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });

    RuleScenario('Pattern not found shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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
  // Rule: CLI arch subcommand queries architecture
  // ---------------------------------------------------------------------------

  Rule('CLI arch subcommand queries architecture', ({ RuleScenario }) => {
    RuleScenario('Arch roles lists roles with counts', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Arch context filters to bounded context', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Arch layer lists layers with counts', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations', async () => {
        await writeArchPatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });
    });

    RuleScenario('Arch graph returns dependency data', ({ Given, When, Then, And }) => {
      Given('TypeScript files with architecture annotations and dependencies', async () => {
        await writeArchPatternFilesWithDeps();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        const result = getResult();
        expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
      });

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult().stdout).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI shows errors for missing subcommand arguments
  // ---------------------------------------------------------------------------

  Rule('CLI shows errors for missing subcommand arguments', ({ RuleScenario }) => {
    RuleScenario('Query without method name shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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

    RuleScenario('Pattern without name shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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

    RuleScenario('Unknown subcommand shows error', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
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
  // Rule: CLI handles argument edge cases
  // ---------------------------------------------------------------------------

  Rule('CLI handles argument edge cases', ({ RuleScenario }) => {
    RuleScenario('Integer arguments are coerced for phase queries', ({ Given, When, Then }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles();
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });

    RuleScenario('Double-dash separator is handled gracefully', ({ When, Then }) => {
      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });
    });
  });
});
