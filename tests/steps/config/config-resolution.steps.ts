/**
 * Config Resolution Step Definitions
 *
 * BDD step definitions for testing resolveProjectConfig and
 * createDefaultResolvedConfig, verifying defaults, source merging,
 * and context inference rule ordering.
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  resolveProjectConfig,
  createDefaultResolvedConfig,
} from '../../../src/config/resolve-config.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../../../src/config/defaults.js';
import type { ArchitectProjectConfig, ResolvedConfig } from '../../../src/config/project-config.js';

// =============================================================================
// Types
// =============================================================================

interface ConfigResolutionState {
  rawConfig: ArchitectProjectConfig | null;
  resolvedConfig: ResolvedConfig | null;
  resolveOptions: { readonly configPath: string } | undefined;
}

// =============================================================================
// Module State
// =============================================================================

let state: ConfigResolutionState | null = null;

function initState(): ConfigResolutionState {
  return {
    rawConfig: null,
    resolvedConfig: null,
    resolveOptions: undefined,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/config/config-resolution.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a config resolution test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Default config
  // ===========================================================================

  Rule('Default config provides sensible fallbacks', ({ RuleScenario }) => {
    RuleScenario('Default config has empty sources and isDefault flag', ({ When, Then, And }) => {
      When('creating default resolved config', () => {
        state!.resolvedConfig = createDefaultResolvedConfig();
      });

      Then('isDefault should be true', () => {
        expect(state!.resolvedConfig!.isDefault).toBe(true);
      });

      And('typescript sources should be empty', () => {
        expect(state!.resolvedConfig!.project.sources.typescript).toHaveLength(0);
      });

      And('features sources should be empty', () => {
        expect(state!.resolvedConfig!.project.sources.features).toHaveLength(0);
      });

      And('exclude sources should be empty', () => {
        expect(state!.resolvedConfig!.project.sources.exclude).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Preset instance
  // ===========================================================================

  Rule('Preset creates correct taxonomy instance', ({ RuleScenario }) => {
    RuleScenario('libar-generic preset creates 3 categories', ({ Given, When, Then, And }) => {
      Given('a raw config with preset "libar-generic"', () => {
        state!.rawConfig = { preset: 'libar-generic' };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('the instance should have 3 categories', () => {
        expect(state!.resolvedConfig!.instance.registry.categories).toHaveLength(3);
      });

      And('the instance tagPrefix should be "@architect-"', () => {
        expect(state!.resolvedConfig!.instance.registry.tagPrefix).toBe('@architect-');
      });
    });
  });

  // ===========================================================================
  // Stubs merged
  // ===========================================================================

  Rule('Stubs are merged into typescript sources', ({ RuleScenario }) => {
    RuleScenario('Stubs appended to typescript sources', ({ Given, When, Then }) => {
      Given('a raw config with typescript sources and stubs', () => {
        state!.rawConfig = {
          sources: {
            typescript: ['src/**/*.ts'],
            stubs: ['stubs/**/*.ts'],
          },
        };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('resolved typescript sources should contain both original and stub globs', () => {
        const ts = state!.resolvedConfig!.project.sources.typescript;
        expect(ts).toContain('src/**/*.ts');
        expect(ts).toContain('stubs/**/*.ts');
        expect(ts).toHaveLength(2);
      });
    });
  });

  // ===========================================================================
  // Output defaults
  // ===========================================================================

  Rule('Output defaults are applied', ({ RuleScenario }) => {
    RuleScenario('Default output directory and overwrite', ({ Given, When, Then, And }) => {
      Given('a raw config with no output specified', () => {
        state!.rawConfig = { preset: 'libar-generic' };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('output directory should be "docs-live"', () => {
        expect(state!.resolvedConfig!.project.output.directory).toBe('docs-live');
      });

      And('output overwrite should be false', () => {
        expect(state!.resolvedConfig!.project.output.overwrite).toBe(false);
      });
    });

    RuleScenario('Explicit output overrides defaults', ({ Given, When, Then, And }) => {
      Given('a raw config with output directory "custom-docs" and overwrite true', () => {
        state!.rawConfig = {
          preset: 'libar-generic',
          output: { directory: 'custom-docs', overwrite: true },
        };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('output directory should be "custom-docs"', () => {
        expect(state!.resolvedConfig!.project.output.directory).toBe('custom-docs');
      });

      And('output overwrite should be true', () => {
        expect(state!.resolvedConfig!.project.output.overwrite).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Generator defaults
  // ===========================================================================

  Rule('Generator defaults are applied', ({ RuleScenario }) => {
    RuleScenario('Generators default to patterns', ({ Given, When, Then }) => {
      Given('a raw config with no generators specified', () => {
        state!.rawConfig = { preset: 'libar-generic' };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('generators should contain exactly "patterns"', () => {
        expect(state!.resolvedConfig!.project.generators).toEqual(['patterns']);
      });
    });
  });

  // ===========================================================================
  // Context inference rules
  // ===========================================================================

  Rule('Context inference rules are prepended', ({ RuleScenario }) => {
    RuleScenario('User rules prepended to defaults', ({ Given, When, Then, And }) => {
      Given('a raw config with a custom context inference rule', () => {
        state!.rawConfig = {
          preset: 'libar-generic',
          contextInferenceRules: [{ pattern: 'packages/auth/**', context: 'auth' }],
        };
      });

      When('resolving the project config', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/test/config.ts',
        });
      });

      Then('the first context inference rule should be the user rule', () => {
        const rules = state!.resolvedConfig!.project.contextInferenceRules;
        expect(rules[0]).toEqual({ pattern: 'packages/auth/**', context: 'auth' });
      });

      And('the default rules should follow after the user rule', () => {
        const rules = state!.resolvedConfig!.project.contextInferenceRules;
        // User rule + all default rules
        expect(rules).toHaveLength(1 + DEFAULT_CONTEXT_INFERENCE_RULES.length);
        // Second rule should be the first default
        expect(rules[1]).toEqual(DEFAULT_CONTEXT_INFERENCE_RULES[0]);
      });
    });
  });

  // ===========================================================================
  // Config path
  // ===========================================================================

  Rule('Config path is carried from options', ({ RuleScenario }) => {
    RuleScenario('configPath carried from resolution options', ({ Given, When, Then }) => {
      Given('a raw config with preset "libar-generic"', () => {
        state!.rawConfig = { preset: 'libar-generic' };
      });

      When('resolving the project config with configPath "/my/config.ts"', () => {
        state!.resolvedConfig = resolveProjectConfig(state!.rawConfig!, {
          configPath: '/my/config.ts',
        });
      });

      Then('the resolved configPath should be "/my/config.ts"', () => {
        expect(state!.resolvedConfig!.configPath).toBe('/my/config.ts');
      });
    });
  });
});
