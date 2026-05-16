/** @architect */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  findConfigFile,
  loadConfig,
  formatConfigError,
  type ConfigLoadError,
  type ConfigLoadResult,
} from '../../../src/config/config-loader.js';

type DataTableRow = Record<string, string>;

interface ConfigLoaderState {
  tempDir: string | null;
  configPath: string | null;
  configResult: ConfigLoadResult | null;
  error: ConfigLoadError | null;
  formattedError: string | null;
}

const VALID_MINIMAL_CONFIG = `
export default { tagPrefix: "@custom-" };
`.trim();

const EMPTY_ROLES_CONFIG = `
export default { roles: [] };
`.trim();

const NO_DEFAULT_EXPORT_CONFIG = `
export const config = { foo: "bar" };
`.trim();

const WRONG_TYPE_CONFIG = `
export default { not: "a valid config" };
`.trim();

let state: ConfigLoaderState | null = null;

function initState(): ConfigLoaderState {
  return {
    tempDir: null,
    configPath: null,
    configResult: null,
    error: null,
    formattedError: null,
  };
}

function requireConfigSuccess(): Extract<ConfigLoadResult, { ok: true }>['value'] {
  expect(state?.configResult?.ok).toBe(true);
  return (state!.configResult as Extract<ConfigLoadResult, { ok: true }>).value;
}

function requireConfigFailure(): Extract<ConfigLoadResult, { ok: false }>['error'] {
  expect(state?.configResult?.ok).toBe(false);
  return (state!.configResult as Extract<ConfigLoadResult, { ok: false }>).error;
}

async function createDirectoryStructure(table: DataTableRow[]): Promise<void> {
  if (!state?.tempDir) throw new Error('State not initialized');

  for (const row of table) {
    const relativePath = row['path'];
    if (relativePath === undefined)
      throw new Error('Expected DataTable row to include a path column');

    const filePath = path.join(state.tempDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let content = '// source file';
    if (row['type'] === 'config') content = VALID_MINIMAL_CONFIG;
    if (row['type'] === 'git') content = '[core]\n\trepositoryformatversion = 0';

    await fs.writeFile(filePath, content);
  }
}

const feature = await loadFeature('tests/features/config/config-loader.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempDir) await fs.rm(state.tempDir, { recursive: true, force: true });
    state = null;
  });

  Background(({ Given }) => {
    Given('a config loader test context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-loader-test-'));
    });
  });

  Rule('Config files are discovered by walking up directories', ({ RuleScenario }) => {
    RuleScenario('Find config file in current directory', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from the base directory', async () => {
        state!.configPath = await findConfigFile(state!.tempDir!);
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should end with {string}', (_ctx: unknown, suffix: string) => {
        expect(state!.configPath!).toMatch(new RegExp(`${suffix.replace('.', '\\.')}$$`));
      });
    });

    RuleScenario('Find config file in parent directory', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from {string}', async (_ctx: unknown, relativeDir: string) => {
        state!.configPath = await findConfigFile(path.join(state!.tempDir!, relativeDir));
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should end with {string}', (_ctx: unknown, suffix: string) => {
        expect(state!.configPath!).toMatch(new RegExp(`${suffix.replace('.', '\\.')}$$`));
      });
    });

    RuleScenario('Prefer TypeScript config over JavaScript', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from the base directory', async () => {
        state!.configPath = await findConfigFile(state!.tempDir!);
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should end with {string}', (_ctx: unknown, suffix: string) => {
        expect(state!.configPath!).toMatch(new RegExp(`${suffix.replace('.', '\\.')}$$`));
      });
    });

    RuleScenario('Return null when no config file exists', ({ Given, When, Then }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from {string}', async (_ctx: unknown, relativeDir: string) => {
        state!.configPath = await findConfigFile(path.join(state!.tempDir!, relativeDir));
      });

      Then('config file should NOT be found', () => {
        expect(state!.configPath).toBeNull();
      });
    });
  });

  Rule('Config discovery stops at repo root', ({ RuleScenario }) => {
    RuleScenario('Stop at .git directory marker', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from {string}', async (_ctx: unknown, relativeDir: string) => {
        state!.configPath = await findConfigFile(path.join(state!.tempDir!, relativeDir));
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should NOT contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.configPath!).not.toContain(text);
      });
    });
  });

  Rule('Config is loaded and validated', ({ RuleScenario }) => {
    RuleScenario('Load valid config with default fallback', ({ Given, When, Then, And }) => {
      Given('no config file exists', () => {});

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should succeed', () => {
        expect(state!.configResult!.ok).toBe(true);
      });

      And('loaded config should be the default', () => {
        expect(requireConfigSuccess().isDefault).toBe(true);
      });

      And('loaded registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireConfigSuccess().instance.registry.tagPrefix).toBe(tagPrefix);
      });

      And('loaded registry should have exactly {int} roles', (_ctx: unknown, count: number) => {
        expect(requireConfigSuccess().instance.registry.roles).toHaveLength(count);
      });
    });

    RuleScenario('Load valid minimal config file', ({ Given, When, Then, And }) => {
      Given(
        'a valid config file with custom tagPrefix {string}',
        async (_ctx: unknown, tagPrefix: string) => {
          await fs.writeFile(
            path.join(state!.tempDir!, 'architect.config.js'),
            `export default { tagPrefix: ${JSON.stringify(tagPrefix)} };`
          );
        }
      );

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should succeed', () => {
        expect(state!.configResult!.ok).toBe(true);
      });

      And('loaded config should NOT be the default', () => {
        expect(requireConfigSuccess().isDefault).toBe(false);
      });

      And('loaded registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireConfigSuccess().instance.registry.tagPrefix).toBe(tagPrefix);
      });
    });

    RuleScenario('Load config with explicit empty roles', ({ Given, When, Then, And }) => {
      Given('a valid config file with explicit empty roles', async () => {
        await fs.writeFile(path.join(state!.tempDir!, 'architect.config.js'), EMPTY_ROLES_CONFIG);
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should succeed', () => {
        expect(state!.configResult!.ok).toBe(true);
      });

      And('loaded config should NOT be the default', () => {
        expect(requireConfigSuccess().isDefault).toBe(false);
      });

      And('loaded registry should have exactly {int} roles', (_ctx: unknown, count: number) => {
        expect(requireConfigSuccess().instance.registry.roles).toHaveLength(count);
      });
    });

    RuleScenario('Error on config without default export', ({ Given, When, Then, And }) => {
      Given('a config file without default export', async () => {
        await fs.writeFile(
          path.join(state!.tempDir!, 'architect.config.js'),
          NO_DEFAULT_EXPORT_CONFIG
        );
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should fail', () => {
        expect(state!.configResult!.ok).toBe(false);
      });

      And('config error message should contain {string}', (_ctx: unknown, text: string) => {
        expect(requireConfigFailure().message).toContain(text);
      });
    });

    RuleScenario('Error on config with wrong type', ({ Given, When, Then, And }) => {
      Given('a config file exporting wrong type', async () => {
        await fs.writeFile(path.join(state!.tempDir!, 'architect.config.js'), WRONG_TYPE_CONFIG);
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should fail', () => {
        expect(state!.configResult!.ok).toBe(false);
      });

      And('config error message should contain {string}', (_ctx: unknown, text: string) => {
        expect(requireConfigFailure().message).toContain(text);
      });
    });
  });

  Rule('Config errors are formatted for display', ({ RuleScenario }) => {
    RuleScenario('Format error with path and message', ({ Given, When, Then }) => {
      Given(
        'a config load error with path {string} and message {string}',
        (_ctx: unknown, pathText: string, message: string) => {
          state!.error = { type: 'config-load-error', path: pathText, message };
        }
      );

      When('formatting the config error', () => {
        state!.formattedError = formatConfigError(state!.error!);
      });

      Then('formatted error should contain:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          expect(state!.formattedError!).toContain(row['text']);
        }
      });
    });
  });
});
