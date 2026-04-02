/**
 * pattern-graph CLI Modifiers and Rules Step Definitions
 *
 * BDD step definitions for testing the pattern-graph CLI
 * output modifiers, arch health, and rules subcommand.
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
  writeDanglingRefFiles,
  writeFeatureFilesWithRules,
  createTempDir,
} from '../../support/helpers/pattern-graph-api-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/cli/pattern-graph-cli-modifiers-rules.feature');

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
      state.tempContext = await createTempDir({ prefix: 'cli-pattern-graph-test-' });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Output modifiers work when placed after the subcommand
  // ---------------------------------------------------------------------------

  Rule('Output modifiers work when placed after the subcommand', ({ RuleScenario }) => {
    RuleScenario(
      'Count modifier after list subcommand returns count',
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

        And('stdout JSON data is a number', () => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: unknown };
          expect(typeof parsed.data).toBe('number');
        });
      }
    );

    RuleScenario(
      'Names-only modifier after list subcommand returns names',
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

        And('stdout JSON data is a string array', () => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: unknown };
          expect(Array.isArray(parsed.data)).toBe(true);
          const arr = parsed.data as unknown[];
          expect(arr.length).toBeGreaterThan(0);
          expect(typeof arr[0]).toBe('string');
        });
      }
    );

    RuleScenario('Count modifier combined with list filter', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data is a number', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: unknown };
        expect(typeof parsed.data).toBe('number');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI arch health subcommands detect graph quality issues
  // ---------------------------------------------------------------------------

  Rule('CLI arch health subcommands detect graph quality issues', ({ RuleScenario }) => {
    RuleScenario('Arch dangling returns broken references', ({ Given, When, Then, And }) => {
      Given('TypeScript files with a dangling reference', async () => {
        await writeDanglingRefFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data is an array', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: unknown };
        expect(Array.isArray(parsed.data)).toBe(true);
      });

      And(
        'stdout JSON data contains an entry with field {string}',
        (_ctx: unknown, field: string) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Array<Record<string, unknown>> };
          const arr = parsed.data;
          expect(arr.length).toBeGreaterThan(0);
          expect(arr[0]).toHaveProperty(field);
        }
      );
    });

    RuleScenario('Arch orphans returns isolated patterns', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data is an array', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: unknown };
        expect(Array.isArray(parsed.data)).toBe(true);
      });

      And(
        'stdout JSON data contains an entry with field {string}',
        (_ctx: unknown, field: string) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Array<Record<string, unknown>> };
          const arr = parsed.data;
          expect(arr.length).toBeGreaterThan(0);
          expect(arr[0]).toHaveProperty(field);
        }
      );
    });

    RuleScenario('Arch blocking returns blocked patterns', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data is an array', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: unknown };
        expect(Array.isArray(parsed.data)).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI rules subcommand queries business rules and invariants
  // ---------------------------------------------------------------------------

  Rule('CLI rules subcommand queries business rules and invariants', ({ RuleScenario }) => {
    RuleScenario(
      'Rules returns business rules from feature files',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('Gherkin feature files with business rules', async () => {
          await writeFeatureFilesWithRules(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And(
          'stdout JSON data has fields:',
          (_ctx: unknown, table: ReadonlyArray<{ readonly field: string }>) => {
            const result = getResult(state);
            const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
            for (const row of table) {
              expect(parsed.data).toHaveProperty(row.field);
            }
          }
        );
      }
    );

    RuleScenario('Rules filters by product area', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      And('Gherkin feature files with business rules', async () => {
        await writeFeatureFilesWithRules(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data has field {string}', (_ctx: unknown, field: string) => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
        expect(parsed.data).toHaveProperty(field);
      });
    });

    RuleScenario('Rules with count modifier returns totals', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      And('Gherkin feature files with business rules', async () => {
        await writeFeatureFilesWithRules(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And(
        'stdout JSON data has fields:',
        (_ctx: unknown, table: ReadonlyArray<{ readonly field: string }>) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
          for (const row of table) {
            expect(parsed.data).toHaveProperty(row.field);
          }
        }
      );
    });

    RuleScenario('Rules with names-only returns flat array', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      And('Gherkin feature files with business rules', async () => {
        await writeFeatureFilesWithRules(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout JSON data is an array', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as { data: unknown };
        expect(Array.isArray(parsed.data)).toBe(true);
      });
    });

    RuleScenario('Rules filters by pattern name', ({ Given, When, Then, And }) => {
      Given('TypeScript files with pattern annotations', async () => {
        await writePatternFiles(state);
      });

      And('Gherkin feature files with business rules', async () => {
        await writeFeatureFilesWithRules(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And(
        'stdout JSON data has field values:',
        (
          _ctx: unknown,
          table: ReadonlyArray<{ readonly field: string; readonly value: string }>
        ) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
          for (const row of table) {
            expect(parsed.data[row.field]).toBe(parseInt(row.value, 10));
          }
        }
      );
    });

    RuleScenario(
      'Rules with only-invariants excludes rules without invariants',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('Gherkin feature files with business rules', async () => {
          await writeFeatureFilesWithRules(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And(
          'stdout JSON data has field values:',
          (
            _ctx: unknown,
            table: ReadonlyArray<{ readonly field: string; readonly value: string }>
          ) => {
            const result = getResult(state);
            const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
            for (const row of table) {
              expect(parsed.data[row.field]).toBe(parseInt(row.value, 10));
            }
          }
        );
      }
    );

    RuleScenario(
      'Rules product area filter excludes non-matching areas',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('Gherkin feature files with business rules', async () => {
          await writeFeatureFilesWithRules(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And(
          'stdout JSON data has field values:',
          (
            _ctx: unknown,
            table: ReadonlyArray<{ readonly field: string; readonly value: string }>
          ) => {
            const result = getResult(state);
            const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
            for (const row of table) {
              expect(parsed.data[row.field]).toBe(parseInt(row.value, 10));
            }
          }
        );
      }
    );

    RuleScenario(
      'Rules for non-existent product area returns hint',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('Gherkin feature files with business rules', async () => {
          await writeFeatureFilesWithRules(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout JSON data has field {string}', (_ctx: unknown, field: string) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
          expect(parsed.data).toHaveProperty(field);
        });
      }
    );

    RuleScenario(
      'Rules combines product area and only-invariants filters',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with pattern annotations', async () => {
          await writePatternFiles(state);
        });

        And('Gherkin feature files with business rules', async () => {
          await writeFeatureFilesWithRules(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And(
          'stdout JSON data has field values:',
          (
            _ctx: unknown,
            table: ReadonlyArray<{ readonly field: string; readonly value: string }>
          ) => {
            const result = getResult(state);
            const parsed = JSON.parse(result.stdout) as { data: Record<string, unknown> };
            for (const row of table) {
              expect(parsed.data[row.field]).toBe(parseInt(row.value, 10));
            }
          }
        );
      }
    );
  });
});
