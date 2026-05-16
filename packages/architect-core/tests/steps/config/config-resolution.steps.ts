/** @architect */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  resolveProjectConfig,
  createDefaultResolvedConfig,
} from '../../../src/config/resolve-config.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../../../src/config/defaults.js';
import type { ArchitectProjectConfig, ResolvedConfig } from '../../../src/config/project-config.js';

type DataTableRow = Record<string, string>;

interface ConfigResolutionState {
  rawConfig: ArchitectProjectConfig | null;
  resolvedConfig: ResolvedConfig | null;
}

let state: ConfigResolutionState | null = null;

function initState(): ConfigResolutionState {
  return { rawConfig: null, resolvedConfig: null };
}

function requireResolvedConfig(): ResolvedConfig {
  expect(state?.resolvedConfig).not.toBeNull();
  return state!.resolvedConfig!;
}

const feature = await loadFeature('tests/features/config/config-resolution.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a config resolution test context', () => {
      state = initState();
    });
  });

  Rule('Default config provides sensible fallbacks', ({ RuleScenario }) => {
    RuleScenario('Default config has empty sources and isDefault flag', ({ When, Then, And }) => {
      When('creating default resolved config', () => {
        state!.resolvedConfig = createDefaultResolvedConfig();
      });

      Then('isDefault should be true', () => {
        expect(requireResolvedConfig().isDefault).toBe(true);
      });
      And('typescript sources should be empty', () => {
        expect(requireResolvedConfig().project.sources.typescript).toHaveLength(0);
      });
      And('features sources should be empty', () => {
        expect(requireResolvedConfig().project.sources.features).toHaveLength(0);
      });
      And('exclude sources should be empty', () => {
        expect(requireResolvedConfig().project.sources.exclude).toHaveLength(0);
      });
    });
  });

  Rule('Omitted roles apply DEFAULT_ROLES', ({ RuleScenario }) => {
    RuleScenario('Omitted roles apply DEFAULT_ROLES', ({ Given, When, Then, And }) => {
      Given('a raw config with no roles field', () => {
        state!.rawConfig = {};
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('the instance should have {int} roles', (_ctx: unknown, count: number) => {
        expect(requireResolvedConfig().instance.registry.roles).toHaveLength(count);
      });
      And('the instance should include roles:', (_ctx: unknown, table: DataTableRow[]) => {
        const tags = requireResolvedConfig().instance.registry.roles.map((role) => role.tag);
        expect(tags).toEqual(expect.arrayContaining(table.map((row) => row['tag'])));
      });
      And('the instance tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireResolvedConfig().instance.registry.tagPrefix).toBe(tagPrefix);
      });
    });
  });

  Rule('Explicit roles arrays control classification', ({ RuleScenario }) => {
    RuleScenario('Explicit empty roles disable default role matching', ({ Given, When, Then }) => {
      Given('a raw config with explicit empty roles', () => {
        state!.rawConfig = { roles: [] };
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('the instance should have {int} roles', (_ctx: unknown, count: number) => {
        expect(requireResolvedConfig().instance.registry.roles).toHaveLength(count);
      });
    });

    RuleScenario('Explicit custom roles replace the defaults', ({ Given, When, Then, And }) => {
      Given('a raw config with one custom role', () => {
        state!.rawConfig = { roles: [{ tag: 'service', domain: 'Service', priority: 1 }] };
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('the instance should have {int} roles', (_ctx: unknown, count: number) => {
        expect(requireResolvedConfig().instance.registry.roles).toHaveLength(count);
      });
      And('the instance should include role {string}', (_ctx: unknown, tag: string) => {
        const tags = requireResolvedConfig().instance.registry.roles.map((role) => role.tag);
        expect(tags).toContain(tag);
      });
      And('the instance should NOT include role {string}', (_ctx: unknown, tag: string) => {
        const tags = requireResolvedConfig().instance.registry.roles.map((role) => role.tag);
        expect(tags).not.toContain(tag);
      });
    });
  });

  Rule('Stubs are merged into typescript sources', ({ RuleScenario }) => {
    RuleScenario('Stubs appended to typescript sources', ({ Given, When, Then }) => {
      Given('a raw config with typescript sources and stubs', () => {
        state!.rawConfig = { sources: { typescript: ['src/**/*.ts'], stubs: ['stubs/**/*.ts'] } };
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('resolved typescript sources should contain both original and stub globs', () => {
        expect(requireResolvedConfig().project.sources.typescript).toEqual([
          'src/**/*.ts',
          'stubs/**/*.ts',
        ]);
      });
    });
  });

  Rule('Output defaults are applied', ({ RuleScenario }) => {
    RuleScenario('Default output directory and overwrite', ({ Given, When, Then, And }) => {
      Given('a raw config with no output specified', () => {
        state!.rawConfig = {};
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('output directory should be {string}', (_ctx: unknown, directory: string) => {
        expect(requireResolvedConfig().project.output.directory).toBe(directory);
      });
      And('output overwrite should be false', () => {
        expect(requireResolvedConfig().project.output.overwrite).toBe(false);
      });
    });

    RuleScenario('Explicit output overrides defaults', ({ Given, When, Then, And }) => {
      Given(
        'a raw config with output directory {string} and overwrite true',
        (_ctx: unknown, directory: string) => {
          state!.rawConfig = { output: { directory, overwrite: true } };
        }
      );
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('output directory should be {string}', (_ctx: unknown, directory: string) => {
        expect(requireResolvedConfig().project.output.directory).toBe(directory);
      });
      And('output overwrite should be true', () => {
        expect(requireResolvedConfig().project.output.overwrite).toBe(true);
      });
    });
  });

  Rule('Generator defaults are applied', ({ RuleScenario }) => {
    RuleScenario('Generators default to patterns', ({ Given, When, Then }) => {
      Given('a raw config with no generators specified', () => {
        state!.rawConfig = {};
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('generators should contain exactly {string}', (_ctx: unknown, generator: string) => {
        expect(requireResolvedConfig().project.generators).toEqual([generator]);
      });
    });
  });

  Rule('Context inference rules are prepended', ({ RuleScenario }) => {
    RuleScenario('User rules prepended to defaults', ({ Given, When, Then, And }) => {
      Given('a raw config with a custom context inference rule', () => {
        state!.rawConfig = {
          contextInferenceRules: [{ pattern: 'packages/auth/**', context: 'auth' }],
        };
      });
      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });
      Then('the first context inference rule should be the user rule', () => {
        expect(requireResolvedConfig().project.contextInferenceRules[0]).toEqual({
          pattern: 'packages/auth/**',
          context: 'auth',
        });
      });
      And('the default rules should follow after the user rule', () => {
        expect(requireResolvedConfig().project.contextInferenceRules.slice(1)).toEqual(
          DEFAULT_CONTEXT_INFERENCE_RULES
        );
      });
    });
  });

  Rule('Config path is carried from options', ({ RuleScenario }) => {
    RuleScenario('configPath carried from resolution options', ({ Given, When, Then }) => {
      Given('a raw config with no roles field', () => {
        state!.rawConfig = {};
      });
      When(
        'resolving the project config with configPath {string}',
        (_ctx: unknown, configPath: string) => {
          state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, { configPath });
        }
      );
      Then('the resolved configPath should be {string}', (_ctx: unknown, configPath: string) => {
        expect(requireResolvedConfig().configPath).toBe(configPath);
      });
    });
  });
});
