/**
 * pattern-graph CLI Modifiers and Rules Step Definitions
 *
 * BDD step definitions for testing the pattern-graph CLI
 * output modifiers, arch health, and rules subcommand.
 *
 * @architect
 * @architect-implements PatternGraphAPICLI
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { z } from 'zod';
import { FragmentSchema } from '@libar-dev/architect-projection';
import { writeJson } from '../../../packages/architect-cli/src/cli/commands/_shared/output.js';
import {
  type CLITestState,
  initState,
  getTempDir,
  getResult,
  runCLICommand,
  writeBlockedPatternFiles,
  writePatternFiles,
  writeDanglingRefFiles,
  writeFeatureFilesWithRules,
  writeParentHierarchyFeatureFiles,
  createTempDir,
} from '../../support/helpers/pattern-graph-api-state.js';
import { writeTempFile } from '../../support/helpers/file-system.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLITestState | null = null;
let serializationError: unknown = null;

function parseJsonStdout(): Record<string, unknown> {
  return JSON.parse(getResult(state).stdout) as Record<string, unknown>;
}

function parseStdoutArray(): unknown[] {
  const parsed = JSON.parse(getResult(state).stdout) as unknown;
  expect(Array.isArray(parsed)).toBe(true);
  return parsed as unknown[];
}

function parseProjectionRoot(): Record<string, unknown> {
  const parsed = JSON.parse(getResult(state).stdout) as { root?: unknown };
  expect(typeof parsed.root).toBe('object');
  expect(parsed.root).not.toBeNull();
  return parsed.root as Record<string, unknown>;
}

function parseBundleStdout(): {
  readonly root: Record<string, unknown>;
  readonly children: Record<string, Record<string, unknown>>;
} {
  const parsed = JSON.parse(getResult(state).stdout) as {
    root?: unknown;
    children?: unknown;
  };
  expect(typeof parsed.root).toBe('object');
  expect(parsed.root).not.toBeNull();
  expect(typeof parsed.children).toBe('object');
  expect(parsed.children).not.toBeNull();
  return {
    root: parsed.root as Record<string, unknown>,
    children: parsed.children as Record<string, Record<string, unknown>>,
  };
}

function createBaselineContent(entries: readonly Record<string, string>[]): string {
  return `${JSON.stringify(entries, null, 2)}\n`;
}

const CURRENT_DANGLING_BASELINE_ENTRY = {
  pattern: 'ConsumerPattern',
  field: 'uses',
  missing: 'NonExistentDep',
};

const REMOVED_DANGLING_BASELINE_ENTRY = {
  pattern: 'RemovedPattern',
  field: 'uses',
  missing: 'RemovedDependency',
};

function expectOrderedSubstrings(haystack: string, needles: readonly string[]): void {
  let lastIndex = -1;

  for (const needle of needles) {
    const index = haystack.indexOf(needle);
    expect(index, `Expected stdout to contain ${needle}`).toBeGreaterThanOrEqual(0);
    expect(index, `Expected ${needle} to appear after the previous serialized key`).toBeGreaterThan(
      lastIndex,
    );
    lastIndex = index;
  }
}

// =============================================================================
// Feature Definition
// =============================================================================

const outputModifiersFeature = await loadFeature(
  'tests/features/cli/pattern-graph-cli-output-modifiers.feature',
);
const archHealthFeature = await loadFeature('tests/features/cli/pattern-graph-cli-arch-health.feature');
const rulesSubcommandFeature = await loadFeature(
  'tests/features/cli/pattern-graph-cli-rules-subcommand.feature',
);

describeFeature(outputModifiersFeature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
    serializationError = null;
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

        And('stdout is a JSON number', () => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as unknown;
          expect(typeof parsed).toBe('number');
        });
      },
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

        And('stdout is a JSON string array', () => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as unknown;
          expect(Array.isArray(parsed)).toBe(true);
          const arr = parsed as unknown[];
          expect(arr.length).toBeGreaterThan(0);
          expect(typeof arr[0]).toBe('string');
        });
      },
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

      And('stdout is a JSON number', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as unknown;
        expect(typeof parsed).toBe('number');
      });
    });

    RuleScenario(
      'Parent filter with names-only returns child names',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is a JSON string array', () => {
          const arr = parseStdoutArray();
          expect(arr.every((entry) => typeof entry === 'string')).toBe(true);
        });

        And('the list names-only result equals {string}', (_ctx: unknown, names: string) => {
          expect(parseStdoutArray()).toEqual(names.split(',').map((name) => name.trim()));
        });
      },
    );

    RuleScenario('Parent filter with count returns child count', ({ Given, When, Then, And }) => {
      Given('Gherkin feature files with parent hierarchy', async () => {
        await writeParentHierarchyFeatureFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is a JSON number', () => {
        const parsed = JSON.parse(getResult(state).stdout) as unknown;
        expect(typeof parsed).toBe('number');
      });

      And('the list count equals {int}', (_ctx: unknown, count: number) => {
        expect(JSON.parse(getResult(state).stdout) as unknown).toBe(count);
      });
    });

    RuleScenario(
      'Parent filter returns empty for parent without children',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is an empty JSON string array', () => {
          expect(parseStdoutArray()).toEqual([]);
        });
      },
    );

    RuleScenario(
      'Open questions parent filter returns only descendants with questions',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And(
          'the open question result contains patterns {string}',
          (_ctx: unknown, names: string) => {
            const root = parseProjectionRoot();
            const items = root['items'] as Array<{ pattern: string }>;
            expect(items.map((item) => item.pattern)).toEqual(
              names.split(',').map((name) => name.trim()),
            );
          },
        );

        And('every open question result entry has at least one question', () => {
          const root = parseProjectionRoot();
          const items = root['items'] as Array<{ questions: string[] }>;
          expect(items.length).toBeGreaterThan(0);
          expect(items.every((item) => item.questions.length > 0)).toBe(true);
        });
      },
    );

    RuleScenario(
      'Open questions empty parent returns an empty document',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('the open question result is empty', () => {
          const root = parseProjectionRoot();
          expect(root['count']).toBe(0);
          expect(root['items']).toEqual([]);
        });
      },
    );

    RuleScenario(
      'Open questions unknown parent fails deterministically',
      ({ Given, When, Then }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('parent filter fails with {string}', (_ctx: unknown, text: string) => {
          expect(getResult(state).exitCode).toBe(1);
          const combined = getResult(state).stdout + getResult(state).stderr;
          expect(combined).toContain(text);
        });
      },
    );

    RuleScenario(
      'Bundle include blocks return a composite payload',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          expect(() => JSON.parse(getResult(state).stdout) as unknown).not.toThrow();
        });

        And('the bundle result contains children {string}', (_ctx: unknown, names: string) => {
          expect(Object.keys(parseBundleStdout().children)).toEqual(
            names.split(',').map((name) => name.trim()),
          );
        });

        And(
          'the bundle result includes requested block families {string}',
          (_ctx: unknown, names: string) => {
            const expected = names.split(',').map((name) => name.trim());
            const { root, children } = parseBundleStdout();
            const rootIncludes = root['includes'] as string[];
            expect(rootIncludes).toEqual(expected);
            for (const child of Object.values(children)) {
              expect(child['includes']).toEqual(expected);
              const blocks = child['blocks'] as Record<string, unknown>;
              for (const expectedInclude of expected) {
                const blockKey =
                  expectedInclude === 'open-questions' ? 'openQuestions' : expectedInclude;
                expect(blocks).toHaveProperty(blockKey);
              }
            }
          },
        );

        And('the bundle result preserves the ChildAlpha dependency on ChildBeta', () => {
          const childAlpha = parseBundleStdout().children['ChildAlpha'];
          if (childAlpha === undefined) {
            throw new Error('Expected ChildAlpha bundle entry to exist');
          }
          const deps = childAlpha['blocks'] as { deps?: { uses?: string[] } };
          expect(deps.deps?.uses).toContain('ChildBeta');
        });
      },
    );

    RuleScenario(
      'Bundle mode default include set returns heuristic token estimates',
      ({ Given, When, Then, And }) => {
        Given('Gherkin feature files with parent hierarchy', async () => {
          await writeParentHierarchyFeatureFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout is valid JSON', () => {
          expect(() => JSON.parse(getResult(state).stdout) as unknown).not.toThrow();
        });

        And('the bundle root mode is {string}', (_ctx: unknown, mode: string) => {
          expect(parseBundleStdout().root['mode']).toBe(mode);
        });

        And(
          'the bundle result includes requested block families {string}',
          (_ctx: unknown, names: string) => {
            const expected = names.split(',').map((name) => name.trim());
            const { root, children } = parseBundleStdout();
            expect(root['includes']).toEqual(expected);
            for (const child of Object.values(children)) {
              expect(child['includes']).toEqual(expected);
              const blocks = child['blocks'] as Record<string, unknown>;
              for (const expectedInclude of expected) {
                const blockKey =
                  expectedInclude === 'open-questions' ? 'openQuestions' : expectedInclude;
                expect(blocks).toHaveProperty(blockKey);
              }
            }
          },
        );

        And(
          'the bundle token estimates use the {string} heuristic',
          (_ctx: unknown, method: string) => {
            const { root, children } = parseBundleStdout();
            expect((root['bundleTokenEstimate'] as { method?: string }).method).toBe(method);
            expect((root['tokenEstimate'] as { method?: string }).method).toBe(method);
            for (const child of Object.values(children)) {
              expect((child['tokenEstimate'] as { method?: string }).method).toBe(method);
              for (const blockEstimate of child['blockTokenEstimates'] as Array<{
                estimate: { method?: string };
              }>) {
                expect(blockEstimate.estimate.method).toBe(method);
              }
            }
          },
        );
      },
    );

    RuleScenario('Bundle unknown root pattern fails deterministically', ({ Given, When, Then }) => {
      Given('Gherkin feature files with parent hierarchy', async () => {
        await writeParentHierarchyFeatureFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('parent filter fails with {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).exitCode).toBe(1);
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Bundle accumulates repeated include flags', ({ Given, When, Then, And }) => {
      Given('Gherkin feature files with parent hierarchy', async () => {
        await writeParentHierarchyFeatureFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult(state).exitCode).toBe(code);
      });

      And('stdout is valid JSON', () => {
        expect(() => JSON.parse(getResult(state).stdout) as unknown).not.toThrow();
      });

      And(
        'the bundle result includes requested block families {string}',
        (_ctx: unknown, names: string) => {
          const expected = names.split(',').map((name) => name.trim());
          const { root, children } = parseBundleStdout();
          const rootIncludes = root['includes'] as string[];
          expect(rootIncludes).toEqual(expected);
          for (const child of Object.values(children)) {
            expect(child['includes']).toEqual(expected);
            const blocks = child['blocks'] as Record<string, unknown>;
            for (const expectedInclude of expected) {
              const blockKey =
                expectedInclude === 'open-questions' ? 'openQuestions' : expectedInclude;
              expect(blocks).toHaveProperty(blockKey);
            }
          }
        },
      );
    });

    RuleScenario('Unknown parent filter fails deterministically', ({ Given, When, Then }) => {
      Given('Gherkin feature files with parent hierarchy', async () => {
        await writeParentHierarchyFeatureFiles(state);
      });

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(state, cmd);
      });

      Then('parent filter fails with {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).exitCode).toBe(1);
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario('Malformed projection bundle JSON is rejected', ({ When, Then }) => {
      When('serializing malformed projection bundle data', () => {
        try {
          writeJson({
            data: {
              root: null,
            },
          });
        } catch (error) {
          serializationError = error;
        }
      });

      Then('serialization fails with {string}', (_ctx: unknown, text: string) => {
        expect(serializationError).toBeInstanceOf(Error);
        expect((serializationError as Error).message).toContain(text);
      });
    });
  });
});

describeFeature(archHealthFeature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
    serializationError = null;
  });

  Background(({ Given }) => {
    Given('a temporary working directory', async () => {
      state = initState();
      state.tempContext = await createTempDir({ prefix: 'cli-pattern-graph-test-' });
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
        },
      );
    });

    RuleScenario(
      'Arch dangling baseline matches current references',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with a dangling reference', async () => {
          await writeDanglingRefFiles(state);
        });

        And('a dangling baseline file matching current references', async () => {
          await writeTempFile(
            getTempDir(state),
            'dangling-baseline.json',
            createBaselineContent([CURRENT_DANGLING_BASELINE_ENTRY]),
          );
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout JSON data reports no dangling baseline drift', () => {
          const parsed = parseJsonStdout() as { data: Record<string, unknown> };
          expect(parsed.data['drift']).toBe(false);
          expect(parsed.data['baselineCount']).toBe(1);
          expect(parsed.data['currentCount']).toBe(1);
          expect(parsed.data['addedCount']).toBe(0);
          expect(parsed.data['removedCount']).toBe(0);
        });
      },
    );

    RuleScenario(
      'Arch dangling strict baseline drift reports added and removed entries',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with a dangling reference', async () => {
          await writeDanglingRefFiles(state);
        });

        And('a dangling baseline file with a different reference', async () => {
          await writeTempFile(
            getTempDir(state),
            'dangling-baseline.json',
            createBaselineContent([REMOVED_DANGLING_BASELINE_ENTRY]),
          );
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('stdout JSON data reports one added and one removed dangling baseline entry', () => {
          const parsed = parseJsonStdout() as {
            data: {
              drift: boolean;
              addedCount: number;
              removedCount: number;
              added: Array<Record<string, unknown>>;
              removed: Array<Record<string, unknown>>;
            };
          };
          expect(parsed.data.drift).toBe(true);
          expect(parsed.data.addedCount).toBe(1);
          expect(parsed.data.removedCount).toBe(1);
          expect(parsed.data.added[0]).toEqual(CURRENT_DANGLING_BASELINE_ENTRY);
          expect(parsed.data.removed[0]).toEqual(REMOVED_DANGLING_BASELINE_ENTRY);
        });
      },
    );

    RuleScenario(
      'Arch dangling write-baseline rewrites deterministic JSON',
      ({ Given, When, Then, And }) => {
        Given('TypeScript files with a dangling reference', async () => {
          await writeDanglingRefFiles(state);
        });

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(state, cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult(state).exitCode).toBe(code);
        });

        And('dangling baseline file is deterministic for the current references', async () => {
          const baselinePath = path.join(getTempDir(state), 'dangling-baseline.json');
          const content = await readFile(baselinePath, 'utf8');
          expect(content).toBe(createBaselineContent([CURRENT_DANGLING_BASELINE_ENTRY]));
        });
      },
    );

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
        },
      );
    });

    RuleScenario('Arch blocking returns blocked patterns', ({ Given, When, Then, And }) => {
      Given('TypeScript files with blocked pattern annotations', async () => {
        await writeBlockedPatternFiles(state);
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
        },
      );

      And(
        'stdout JSON data contains a blocking entry with field {string}',
        (_ctx: unknown, field: string) => {
          const result = getResult(state);
          const parsed = JSON.parse(result.stdout) as { data: Array<Record<string, unknown>> };
          const arr = parsed.data;
          expect(arr.length).toBeGreaterThan(0);
          expect(arr[0]).toHaveProperty(field);
        },
      );
    });
  });
});

describeFeature(rulesSubcommandFeature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
    serializationError = null;
  });

  Background(({ Given }) => {
    Given('a temporary working directory', async () => {
      state = initState();
      state.tempContext = await createTempDir({ prefix: 'cli-pattern-graph-test-' });
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

        And('stdout contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult(state).stdout).toContain(text);
        });
      },
    );

    RuleScenario(
      'Rules with --format json preserves routed bundle metadata',
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

        And('stdout is valid JSON for a routed BusinessRuleSet bundle', () => {
          const parsed = parseJsonStdout();

          expect(Object.keys(parsed)).toEqual(['children', 'root', 'routing']);
          expect((parsed['root'] as { kind?: unknown }).kind).toBe('BusinessRuleSet');
          expect(Object.keys(parsed['children'] as Record<string, unknown>)).toEqual([
            'coreutilstest',
            'validationrulestest',
          ]);
          expect(parsed['routing']).toEqual({
            anchorStrategy: 'heading-slug',
            childRouteIds: {
              coreutilstest: 'business-rules:coreutilstest',
              validationrulestest: 'business-rules:validationrulestest',
            },
            childPathStrategy: 'nested',
            rootRouteId: 'business-rules:index',
          });
        });

        And('routed rules JSON keeps canonical bundle key ordering', () => {
          const parsed = parseJsonStdout();

          expect(Object.keys(parsed['root'] as Record<string, unknown>)).toEqual([
            'groupedBy',
            'groupingEntries',
            'kind',
            'rules',
            'scope',
          ]);
          expect(Object.keys(parsed['routing'] as Record<string, unknown>)).toEqual([
            'anchorStrategy',
            'childRouteIds',
            'childPathStrategy',
            'rootRouteId',
          ]);
        });

        And('raw routed rules JSON keeps canonical serializer order on the wire', () => {
          const stdout = getResult(state).stdout;

          expect(stdout).toContain('"rootRouteId": "business-rules:index"');
          expectOrderedSubstrings(stdout, ['"children"', '"root"', '"routing"']);
          expectOrderedSubstrings(stdout, [
            '"anchorStrategy"',
            '"childRouteIds"',
            '"childPathStrategy"',
            '"rootRouteId"',
          ]);
        });

        And('the bundle root validates against FragmentSchema', () => {
          const parsed = parseJsonStdout();
          const result = FragmentSchema.safeParse(parsed['root']);

          expect(result.success, result.success ? '' : z.prettifyError(result.error)).toBe(true);
        });
      },
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

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
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

      And('stdout is a JSON string array', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as unknown;
        expect(Array.isArray(parsed)).toBe(true);
      });
    });

    RuleScenario('Rules with count returns a JSON number', ({ Given, When, Then, And }) => {
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

      And('stdout is a JSON number', () => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as unknown;
        expect(typeof parsed).toBe('number');
      });

      And('the rules count equals {int}', (_ctx: unknown, count: number) => {
        const result = getResult(state);
        const parsed = JSON.parse(result.stdout) as unknown;
        expect(parsed).toBe(count);
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

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });
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

        And('stdout contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult(state).stdout).toContain(text);
        });
      },
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

        And('stdout contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult(state).stdout).toContain(text);
        });
      },
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

        And('stdout contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult(state).stdout).toContain(text);
        });
      },
    );

    RuleScenario('Rules filters by canonical package name', ({ Given, When, Then, And }) => {
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

      And('stdout contains {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).toContain(text);
      });

      And('stdout does not contain {string}', (_ctx: unknown, text: string) => {
        expect(getResult(state).stdout).not.toContain(text);
      });
    });

    RuleScenario('Rules package filter works with count', ({ Given, When, Then, And }) => {
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

      And('stdout is a JSON number', () => {
        const parsed = JSON.parse(getResult(state).stdout) as unknown;
        expect(typeof parsed).toBe('number');
      });

      And('the rules count equals {int}', (_ctx: unknown, count: number) => {
        const parsed = JSON.parse(getResult(state).stdout) as unknown;
        expect(parsed).toBe(count);
      });
    });

    RuleScenario('Rules feature path filter works with count', ({ Given, When, Then, And }) => {
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

      And('stdout is a JSON number', () => {
        const parsed = JSON.parse(getResult(state).stdout) as unknown;
        expect(typeof parsed).toBe('number');
      });

      And('the rules count equals {int}', (_ctx: unknown, count: number) => {
        const parsed = JSON.parse(getResult(state).stdout) as unknown;
        expect(parsed).toBe(count);
      });
    });

    RuleScenario(
      'Rules feature glob filter works with names-only',
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

        And('stdout is a JSON string array', () => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(Array.isArray(parsed)).toBe(true);
        });

        And('the rules names-only result has {int} entries', (_ctx: unknown, count: number) => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed).toHaveLength(count);
        });
      },
    );

    RuleScenario(
      'Rules feature path filter accepts package-host repo-relative path',
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

        And('stdout is a JSON number', () => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(typeof parsed).toBe('number');
        });

        And('the rules count equals {int}', (_ctx: unknown, count: number) => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(parsed).toBe(count);
        });
      },
    );

    RuleScenario(
      'Rules feature glob filter accepts package-host repo-relative glob',
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

        And('stdout is a JSON string array', () => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(Array.isArray(parsed)).toBe(true);
        });

        And('the rules names-only result has {int} entries', (_ctx: unknown, count: number) => {
          const parsed = JSON.parse(getResult(state).stdout) as unknown;
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed).toHaveLength(count);
        });
      },
    );

    RuleScenario('Rules rejects retired phase filter', ({ Given, When, Then, And }) => {
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

      And('output contains {string}', (_ctx: unknown, text: string) => {
        const combined = getResult(state).stdout + getResult(state).stderr;
        expect(combined).toContain(text);
      });
    });

    RuleScenario(
      'Rules rejects conflicting pattern and product-area filters',
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

        And('output contains {string}', (_ctx: unknown, text: string) => {
          const combined = getResult(state).stdout + getResult(state).stderr;
          expect(combined).toContain(text);
        });
      },
    );
  });
});
