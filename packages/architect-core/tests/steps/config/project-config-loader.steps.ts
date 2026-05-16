/** @architect */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  loadProjectConfig,
  type ProjectConfigLoadResult,
} from '../../../src/config/config-loader.js';

interface ProjectConfigLoaderState {
  tempDir: string | null;
  loadResult: ProjectConfigLoadResult | null;
}

const NEW_STYLE_CONFIG = `
export default {
  sources: { typescript: ['src/**/*.ts'] },
};
`.trim();

const EMPTY_ROLES_CONFIG = `
export default {
  roles: [],
  sources: { typescript: ['src/**/*.ts'] },
};
`.trim();

const NO_DEFAULT_EXPORT_CONFIG = `
export const config = { foo: "bar" };
`.trim();

const REMOVED_PRESET_FIELD_CONFIG = `
export default {
  preset: 'libar-generic',
  sources: { typescript: ['src/**/*.ts'] },
};
`.trim();

let state: ProjectConfigLoaderState | null = null;

function initState(): ProjectConfigLoaderState {
  return { tempDir: null, loadResult: null };
}

function requireSuccess(): Exclude<ProjectConfigLoadResult, { readonly ok: false }>['value'] {
  expect(state?.loadResult?.ok).toBe(true);
  return (state!.loadResult as Extract<ProjectConfigLoadResult, { readonly ok: true }>).value;
}

function requireFailure(): Exclude<ProjectConfigLoadResult, { readonly ok: true }>['error'] {
  expect(state?.loadResult?.ok).toBe(false);
  return (state!.loadResult as Extract<ProjectConfigLoadResult, { readonly ok: false }>).error;
}

const feature = await loadFeature('tests/features/config/project-config-loader.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state?.tempDir) await fs.rm(state.tempDir, { recursive: true, force: true });
    state = null;
  });

  Background(({ Given }) => {
    Given('a project config loader test context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-config-loader-test-'));
    });
  });

  Rule('Missing config returns defaults', ({ RuleScenario }) => {
    RuleScenario('No config file returns default resolved config', ({ Given, When, Then, And }) => {
      Given('no config file in the temp directory', () => {});
      When('loading project config from temp directory', async () => {
        state!.loadResult = await loadProjectConfig(state!.tempDir!);
      });
      Then('project config loading should succeed', () => {
        expect(state!.loadResult!.ok).toBe(true);
      });
      And('project config isDefault should be true', () => {
        expect(requireSuccess().isDefault).toBe(true);
      });
    });
  });

  Rule('New-style config is loaded and resolved', ({ RuleScenario }) => {
    RuleScenario(
      'defineConfig export without roles loads default roles',
      ({ Given, When, Then, And }) => {
        Given('a new-style config file with typescript sources and no roles field', async () => {
          await fs.writeFile(path.join(state!.tempDir!, 'architect.config.js'), NEW_STYLE_CONFIG);
        });
        When('loading project config from temp directory', async () => {
          state!.loadResult = await loadProjectConfig(state!.tempDir!);
        });
        Then('project config loading should succeed', () => {
          expect(state!.loadResult!.ok).toBe(true);
        });
        And('project config isDefault should be false', () => {
          expect(requireSuccess().isDefault).toBe(false);
        });
        And('project config instance should have {int} roles', (_ctx: unknown, count: number) => {
          expect(requireSuccess().instance.registry.roles).toHaveLength(count);
        });
      }
    );

    RuleScenario(
      'defineConfig export with explicit empty roles disables defaults',
      ({ Given, When, Then, And }) => {
        Given(
          'a new-style config file with explicit empty roles and typescript sources',
          async () => {
            await fs.writeFile(
              path.join(state!.tempDir!, 'architect.config.js'),
              EMPTY_ROLES_CONFIG
            );
          }
        );
        When('loading project config from temp directory', async () => {
          state!.loadResult = await loadProjectConfig(state!.tempDir!);
        });
        Then('project config loading should succeed', () => {
          expect(state!.loadResult!.ok).toBe(true);
        });
        And('project config isDefault should be false', () => {
          expect(requireSuccess().isDefault).toBe(false);
        });
        And('project config instance should have {int} roles', (_ctx: unknown, count: number) => {
          expect(requireSuccess().instance.registry.roles).toHaveLength(count);
        });
      }
    );
  });

  Rule('Invalid configs produce clear errors', ({ RuleScenario }) => {
    RuleScenario('Config without default export returns error', ({ Given, When, Then, And }) => {
      Given('a config file without a default export', async () => {
        await fs.writeFile(
          path.join(state!.tempDir!, 'architect.config.js'),
          NO_DEFAULT_EXPORT_CONFIG
        );
      });
      When('loading project config from temp directory', async () => {
        state!.loadResult = await loadProjectConfig(state!.tempDir!);
      });
      Then('project config loading should fail', () => {
        expect(state!.loadResult!.ok).toBe(false);
      });
      And(
        'the project config error message should contain {string}',
        (_ctx: unknown, text: string) => {
          expect(requireFailure().message).toContain(text);
        }
      );
    });

    RuleScenario(
      'Config with removed preset field returns Zod error',
      ({ Given, When, Then, And }) => {
        Given('a config file with removed preset field data', async () => {
          await fs.writeFile(
            path.join(state!.tempDir!, 'architect.config.js'),
            REMOVED_PRESET_FIELD_CONFIG
          );
        });
        When('loading project config from temp directory', async () => {
          state!.loadResult = await loadProjectConfig(state!.tempDir!);
        });
        Then('project config loading should fail', () => {
          expect(state!.loadResult!.ok).toBe(false);
        });
        And(
          'the project config error message should contain {string}',
          (_ctx: unknown, text: string) => {
            expect(requireFailure().message).toContain(text);
          }
        );
      }
    );
  });
});
