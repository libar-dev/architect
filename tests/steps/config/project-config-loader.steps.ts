/**
 * Project Config Loader Step Definitions
 *
 * BDD step definitions for testing loadProjectConfig, the unified
 * config loader that supports both new-style defineConfig and legacy
 * createArchitect config formats.
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  loadProjectConfig,
  type ProjectConfigLoadResult,
} from '../../../src/config/config-loader.js';

// =============================================================================
// Types
// =============================================================================

interface ProjectConfigLoaderState {
  tempDir: string | null;
  loadResult: ProjectConfigLoadResult | null;
}

// =============================================================================
// Config File Templates
// =============================================================================

const NEW_STYLE_CONFIG = `
export default {
  preset: 'libar-generic',
  sources: { typescript: ['src/**/*.ts'] },
};
`.trim();

const LEGACY_CONFIG = `
export default {
  registry: {
    tagPrefix: "@architect-",
    fileOptInTag: "@architect",
    categories: [
      { tag: "core", label: "Core" },
      { tag: "api", label: "API" },
      { tag: "infra", label: "Infrastructure" }
    ],
    statusValues: ["roadmap", "active", "completed", "deferred"],
    tags: []
  },
  regexBuilders: {
    category: () => /@architect-(core|api|infra)/,
    status: () => /@architect-status:(roadmap|active|completed|deferred)/,
    pattern: () => /@architect-pattern:([A-Za-z0-9]+)/
  }
};
`.trim();

const NO_DEFAULT_EXPORT_CONFIG = `
export const config = { foo: "bar" };
`.trim();

const INVALID_PROJECT_CONFIG = `
export default {
  preset: 'nonexistent-preset',
  sources: { typescript: ['src/**/*.ts'] },
};
`.trim();

// =============================================================================
// Module State
// =============================================================================

let state: ProjectConfigLoaderState | null = null;

function initState(): ProjectConfigLoaderState {
  return {
    tempDir: null,
    loadResult: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/config/project-config-loader.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.tempDir) {
      await fs.rm(state.tempDir, { recursive: true, force: true });
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a project config loader test context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-config-loader-test-'));
    });
  });

  // ===========================================================================
  // Missing config returns defaults
  // ===========================================================================

  Rule('Missing config returns defaults', ({ RuleScenario }) => {
    RuleScenario('No config file returns default resolved config', ({ Given, When, Then, And }) => {
      Given('no config file in the temp directory', () => {
        // temp dir is empty by default — nothing to do
      });

      When('loading project config from temp directory', async () => {
        state!.loadResult = await loadProjectConfig(state!.tempDir!);
      });

      Then('project config loading should succeed', () => {
        expect(state!.loadResult!.ok).toBe(true);
      });

      And('project config isDefault should be true', () => {
        if (!state!.loadResult!.ok) throw new Error('Expected success');
        expect(state!.loadResult!.value.isDefault).toBe(true);
      });
    });
  });

  // ===========================================================================
  // New-style config
  // ===========================================================================

  Rule('New-style config is loaded and resolved', ({ RuleScenario }) => {
    RuleScenario(
      'defineConfig export loads and resolves correctly',
      ({ Given, When, Then, And }) => {
        Given(
          'a new-style config file with preset "libar-generic" and typescript sources',
          async () => {
            const configPath = path.join(state!.tempDir!, 'architect.config.js');
            await fs.writeFile(configPath, NEW_STYLE_CONFIG);
          }
        );

        When('loading project config from temp directory', async () => {
          state!.loadResult = await loadProjectConfig(state!.tempDir!);
        });

        Then('project config loading should succeed', () => {
          expect(state!.loadResult!.ok).toBe(true);
        });

        And('project config isDefault should be false', () => {
          if (!state!.loadResult!.ok) throw new Error('Expected success');
          expect(state!.loadResult!.value.isDefault).toBe(false);
        });

        And('project config instance should have 3 categories', () => {
          if (!state!.loadResult!.ok) throw new Error('Expected success');
          expect(state!.loadResult!.value.instance.registry.categories).toHaveLength(3);
        });
      }
    );
  });

  // ===========================================================================
  // Legacy config backward compatibility
  // ===========================================================================

  Rule('Legacy config is loaded with backward compatibility', ({ RuleScenario }) => {
    RuleScenario('Legacy createArchitect export loads correctly', ({ Given, When, Then, And }) => {
      Given('a legacy config file with registry and regexBuilders', async () => {
        const configPath = path.join(state!.tempDir!, 'architect.config.js');
        await fs.writeFile(configPath, LEGACY_CONFIG);
      });

      When('loading project config from temp directory', async () => {
        state!.loadResult = await loadProjectConfig(state!.tempDir!);
      });

      Then('project config loading should succeed', () => {
        expect(state!.loadResult!.ok).toBe(true);
      });

      And('project config isDefault should be false', () => {
        if (!state!.loadResult!.ok) throw new Error('Expected success');
        expect(state!.loadResult!.value.isDefault).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Invalid configs produce errors
  // ===========================================================================

  Rule('Invalid configs produce clear errors', ({ RuleScenario }) => {
    RuleScenario('Config without default export returns error', ({ Given, When, Then, And }) => {
      Given('a config file without a default export', async () => {
        const configPath = path.join(state!.tempDir!, 'architect.config.js');
        await fs.writeFile(configPath, NO_DEFAULT_EXPORT_CONFIG);
      });

      When('loading project config from temp directory', async () => {
        state!.loadResult = await loadProjectConfig(state!.tempDir!);
      });

      Then('project config loading should fail', () => {
        expect(state!.loadResult!.ok).toBe(false);
      });

      And('the project config error message should contain "default export"', () => {
        if (state!.loadResult!.ok) throw new Error('Expected failure');
        expect(state!.loadResult!.error.message.toLowerCase()).toContain('default export');
      });
    });

    RuleScenario(
      'Config with invalid project config returns Zod error',
      ({ Given, When, Then, And }) => {
        Given('a config file with invalid project config data', async () => {
          const configPath = path.join(state!.tempDir!, 'architect.config.js');
          await fs.writeFile(configPath, INVALID_PROJECT_CONFIG);
        });

        When('loading project config from temp directory', async () => {
          state!.loadResult = await loadProjectConfig(state!.tempDir!);
        });

        Then('project config loading should fail', () => {
          expect(state!.loadResult!.ok).toBe(false);
        });

        And('the project config error message should contain "Invalid project config"', () => {
          if (state!.loadResult!.ok) throw new Error('Expected failure');
          expect(state!.loadResult!.error.message).toContain('Invalid project config');
        });
      }
    );
  });
});
