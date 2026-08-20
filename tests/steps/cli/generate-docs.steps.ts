/**
 * generate-docs CLI Step Definitions
 *
 * BDD step definitions for testing the generate-docs CLI
 * which generates documentation from annotated TypeScript.
 *
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { readFile, writeFile } from 'node:fs/promises';
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

function createPatternFileWithStatus(patternName: string, status: 'active' | 'completed'): string {
  return `/** @architect */

/**
 * @architect-role:core
 * @architect-pattern ${patternName}
 * @architect-status ${status}
 * @architect-uses AnotherPattern
 *
 * ## ${patternName}
 *
 * A test pattern for generate-docs CLI testing.
 *
 * **When to use:** Use when testing documentation generation.
 */
export interface ${patternName} {
  id: string;
}
`;
}

function createPatternFile(): string {
  return createPatternFileWithStatus('TestGeneratorPattern', 'completed');
}

function createCompletedPatternFile(): string {
  return createPatternFileWithStatus('CompletedGeneratorPattern', 'completed');
}

function createActivePatternFile(): string {
  return createPatternFileWithStatus('ActiveGeneratorPattern', 'active');
}

function createReducedDocsConfigFile(): string {
  return `export default {
  sources: {
    typescript: ['src/**/*.ts']
  },
  generators: [
    'patterns',
    'traceability',
    'index'
  ]
};
`;
}

function createPackageMappedConfigFile(): string {
  return `export default {
  sources: {
    typescript: ['src/**/*.ts']
  },
  packages: [
    { id: 'demo', displayName: 'Demo Package', match: 'src/' }
  ]
};
`;
}

// An authored embedded host with NO managed-region markers — generation must fail
// loud rather than write. Deliberately free of "product-area" so the "left
// unwritten" assertion (the generated table never landed) is unambiguous.
function embeddedHostWithoutMarkers(): string {
  return `# Authored Host

Authored prose the projection must never overwrite. This host carries no
managed-region markers, so an embedded generator routed at it must fail loud.
`;
}

// An authored embedded host with one or more empty marker-bounded regions. Generation
// fills each inter-marker span; the authored prose around them is preserved byte-for-byte.
// The host must carry EVERY region its generator writes — the formal-spec generator
// writes two (`taxonomy-classification` + `taxonomy-relationships`), and a host missing a
// routed region's markers fails loud (the engine's "host not region-prepared" guard).
function embeddedHostWithEmptyRegions(regionIds: readonly string[]): string {
  const regions = regionIds
    .map((id) => `<!-- architect:gen ${id} begin -->\n<!-- architect:gen ${id} end -->`)
    .join('\n\n');
  return `# Authored Host

Authored prose above the region.

${regions}

Authored prose below the region.
`;
}

/** The full region set the `taxonomy-formal-spec` generator writes into its host. */
const FORMAL_SPEC_HOST_REGIONS = ['taxonomy-classification', 'taxonomy-relationships'] as const;

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
      'List generators includes config-registered reduced-surface generators',
      ({ Given, When, Then, And }) => {
        Given('an architect.config.js with reduced docs generators', async () => {
          await writeTempFile(getTempDir(), 'architect.config.js', createReducedDocsConfigFile());
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
      },
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
        },
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
        },
      );
    });

    RuleScenario(
      'Generate docs manifest with projection root classification',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
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
          },
        );

        And(
          'manifest {string} contains generator {string} with root {string}',
          async (_ctx: unknown, relativePath: string, generatorName: string, rootPath: string) => {
            const raw = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
            const manifest = JSON.parse(raw) as {
              generators?: Record<string, { rootPath?: string }>;
            };

            expect(manifest.generators?.[generatorName]?.rootPath).toBe(rootPath);
          },
        );
      },
    );

    RuleScenario(
      'Use default generator (patterns) when not specified',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
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

    RuleScenario('Generate docs with disclosure override', ({ Given, When, Then, And }) => {
      Given(
        'a TypeScript file {string} with pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createPatternFile());
        },
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
        },
      );
    });

    RuleScenario('Generate docs with status filter override', ({ Given, And, When, Then }) => {
      Given(
        'a TypeScript file {string} with completed pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createCompletedPatternFile());
        },
      );

      And(
        'a TypeScript file {string} with active pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createActivePatternFile());
        },
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And(
        'file {string} contains {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
          expect(content).toContain(text);
        },
      );

      And(
        'file {string} does not contain {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
          expect(content).not.toContain(text);
        },
      );
    });

    // Wave 1 pruned the --maturity flag (maturity is derived from status
    // at projection time). The matching scenario was removed from the
    // feature file; status-based filtering is exercised in the scenarios
    // immediately above and below.

    RuleScenario('Generate docs with repeated status filters', ({ Given, And, When, Then }) => {
      Given(
        'a TypeScript file {string} with completed pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createCompletedPatternFile());
        },
      );

      And(
        'a TypeScript file {string} with active pattern annotations',
        async (_ctx: unknown, relativePath: string) => {
          await writeTempFile(getTempDir(), relativePath, createActivePatternFile());
        },
      );

      When('running {string}', async (_ctx: unknown, cmd: string) => {
        await runCLICommand(cmd);
      });

      Then('exit code is {int}', (_ctx: unknown, code: number) => {
        expect(getResult().exitCode).toBe(code);
      });

      And(
        'file {string} contains {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
          expect(content).toContain(text);
        },
      );

      And(
        'file {string} also contains {string}',
        async (_ctx: unknown, relativePath: string, text: string) => {
          const content = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
          expect(content).toContain(text);
        },
      );
    });

    RuleScenario(
      '--all runs every registered generator plus index',
      ({ Given, When, Then, And }) => {
        Given('an architect.config.js mapping sources to a package', async () => {
          await writeTempFile(getTempDir(), 'architect.config.js', createPackageMappedConfigFile());
        });

        And(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And(
          'the working directory contains files:',
          async (_ctx: unknown, table: Array<{ path: string }>) => {
            for (const row of table) {
              const exists = await fileExists(getTempDir(), row.path);
              expect(exists, `expected ${row.path} to be generated by --all`).toBe(true);
            }
          },
        );
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI verifies determinism with --check
  // ---------------------------------------------------------------------------

  Rule('CLI verifies determinism with --check', ({ RuleScenario }) => {
    RuleScenario(
      'Check passes when generated docs match the working tree',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        // First run generates; the second run (--check) overwrites result and is
        // what the assertions below observe.
        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        And('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains {string}', (_ctx: unknown, text: string) => {
          const combined = getResult().stdout + getResult().stderr;
          expect(combined).toContain(text);
        });
      },
    );

    RuleScenario(
      'Check reports drift when a generated doc is absent',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
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
      },
    );

    RuleScenario(
      'Check reports drift when only the manifest is stale',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        // After generation the rendered docs are in sync; emptying the manifest
        // leaves every .md byte-identical but makes the manifest stale — drift the
        // files-only check would miss.
        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        And(
          'the generated docs manifest in {string} is emptied',
          async (_ctx: unknown, dir: string) => {
            await writeTempFile(
              getTempDir(),
              `${dir}/.generated-docs-manifest.json`,
              '{\n  "version": 1,\n  "generators": {}\n}\n',
            );
          },
        );

        And('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains {string}', (_ctx: unknown, text: string) => {
          const combined = getResult().stdout + getResult().stderr;
          expect(combined).toContain(text);
        });
      },
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: CLI generates and gates embedded-region hosts
  // ---------------------------------------------------------------------------

  Rule('CLI generates and gates embedded-region hosts', ({ RuleScenario }) => {
    RuleScenario(
      'An embedded host present but missing its markers fails loudly',
      ({ Given, And, When, Then }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        And(
          'an embedded host {string} with no managed-region markers',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, embeddedHostWithoutMarkers());
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains all of:', (_ctx: unknown, table: Array<{ text: string }>) => {
          const combined = getResult().stdout + getResult().stderr;
          for (const row of table) {
            expect(combined).toContain(row.text);
          }
        });
      },
    );

    RuleScenario(
      'An embedded host absent in the project is skipped under --all',
      ({ Given, And, When, Then }) => {
        Given('an architect.config.js mapping sources to a package', async () => {
          await writeTempFile(getTempDir(), 'architect.config.js', createPackageMappedConfigFile());
        });

        And(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult().stdout + getResult().stderr).toContain(text);
        });

        And(
          'file {string} exists in working directory',
          async (_ctx: unknown, relativePath: string) => {
            expect(await fileExists(getTempDir(), relativePath)).toBe(true);
          },
        );
      },
    );

    RuleScenario(
      'An explicit -g request for an absent host fails loud',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains {string}', (_ctx: unknown, text: string) => {
          expect(getResult().stdout + getResult().stderr).toContain(text);
        });
      },
    );

    RuleScenario(
      'A hand-edited region in an out-of-tree host fails the determinism gate',
      ({ Given, And, When, Then }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        And(
          'an embedded host {string} with an empty {string} region',
          async (_ctx: unknown, relativePath: string, regionId: string) => {
            // The formal-spec host must carry every region its generator writes, not
            // only the one the scenario names — else generation fails loud on the
            // unprepared sibling region.
            const regionIds =
              relativePath === 'formal-spec/04-tag-registry.md'
                ? FORMAL_SPEC_HOST_REGIONS
                : [regionId];
            await writeTempFile(
              getTempDir(),
              relativePath,
              embeddedHostWithEmptyRegions(regionIds),
            );
          },
        );

        // First run fills the region; the assertions observe the later --check run.
        And('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        And(
          'the {string} region in {string} is hand-edited',
          async (_ctx: unknown, regionId: string, relativePath: string) => {
            const full = `${getTempDir()}/${relativePath}`;
            const content = await readFile(full, 'utf8');
            const beginMarker = `<!-- architect:gen ${regionId} begin -->`;
            expect(content).toContain(beginMarker);
            // Insert a line INSIDE the region (immediately after the begin marker),
            // so a regeneration no longer matches — a region-scoped drift the gate
            // must catch even though the host lives outside the output directory.
            await writeFile(
              full,
              content.replace(beginMarker, `${beginMarker}\nHAND-EDITED DRIFT LINE`),
              'utf8',
            );
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And('output contains all of:', (_ctx: unknown, table: Array<{ text: string }>) => {
          const combined = getResult().stdout + getResult().stderr;
          for (const row of table) {
            expect(combined).toContain(row.text);
          }
        });
      },
    );

    RuleScenario(
      'A validation failure aborts before any embedded host is committed',
      ({ Given, And, When, Then }) => {
        Given(
          'a TypeScript file {string} with pattern annotations',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, createPatternFile());
          },
        );

        And(
          'an embedded host {string} with an empty {string} region',
          async (_ctx: unknown, relativePath: string, regionId: string) => {
            // The formal-spec host must carry every region its generator writes, not
            // only the one the scenario names — else generation fails loud on the
            // unprepared sibling region.
            const regionIds =
              relativePath === 'formal-spec/04-tag-registry.md'
                ? FORMAL_SPEC_HOST_REGIONS
                : [regionId];
            await writeTempFile(
              getTempDir(),
              relativePath,
              embeddedHostWithEmptyRegions(regionIds),
            );
          },
        );

        And(
          'an embedded host {string} with no managed-region markers',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(getTempDir(), relativePath, embeddedHostWithoutMarkers());
          },
        );

        When('running {string}', async (_ctx: unknown, cmd: string) => {
          await runCLICommand(cmd);
        });

        Then('exit code is {int}', (_ctx: unknown, code: number) => {
          expect(getResult().exitCode).toBe(code);
        });

        And(
          'the embedded host {string} was left unwritten by the failed run',
          async (_ctx: unknown, relativePath: string) => {
            const content = await readFile(`${getTempDir()}/${relativePath}`, 'utf8');
            // The failing sibling (no markers) throws during the RENDER phase, before
            // the commit phase runs — so no host is ever written. This is the
            // before-commit abort guarantee (NOT a rollback of in-progress renames):
            // the generated table never landed, and the empty markers + authored prose
            // are byte-intact.
            expect(content).not.toContain('product-area');
            expect(content).toContain('<!-- architect:gen taxonomy-classification begin -->');
            expect(content).toContain('Authored prose above the region.');
          },
        );
      },
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

    RuleScenario('Invalid disclosure value causes validation error', ({ When, Then, And }) => {
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

    RuleScenario('Invalid filter value causes validation error', ({ When, Then, And }) => {
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

    RuleScenario('Empty filter value causes validation error', ({ When, Then, And }) => {
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
