/**
 * Config Loader Step Definitions
 *
 * BDD step definitions for testing config file discovery and loading.
 * Uses temp directories with actual config files to test the full
 * config loading pipeline.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  findConfigFile,
  loadConfig,
  formatConfigError,
  type ConfigLoadError,
  type ConfigLoadResult,
} from '../../../src/config/config-loader.js';

// =============================================================================
// Types
// =============================================================================

type DataTableRow = Record<string, string>;

interface ConfigLoaderState {
  tempDir: string | null;
  configPath: string | null;
  configResult: ConfigLoadResult | null;
  error: ConfigLoadError | null;
  formattedError: string | null;
}

// =============================================================================
// Config File Templates
// =============================================================================

const VALID_GENERIC_CONFIG = `
import { createDeliveryProcess } from "./src/index.js";
export default createDeliveryProcess({ preset: "generic" });
`.trim();

const NO_DEFAULT_EXPORT_CONFIG = `
export const config = { foo: "bar" };
`.trim();

const WRONG_TYPE_CONFIG = `
export default { not: "a valid config" };
`.trim();

// =============================================================================
// Module State
// =============================================================================

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

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/config/config-loader.feature');

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
    Given('a config loader test context with temp directory', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-loader-test-'));
    });
  });

  // ===========================================================================
  // Config File Discovery
  // ===========================================================================

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

      And('config path should end with "delivery-process.config.js"', () => {
        expect(state!.configPath!).toMatch(/delivery-process\.config\.js$/);
      });
    });

    RuleScenario('Find config file in parent directory', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from "nested/src"', async () => {
        const searchDir = path.join(state!.tempDir!, 'nested/src');
        state!.configPath = await findConfigFile(searchDir);
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should end with "delivery-process.config.js"', () => {
        expect(state!.configPath!).toMatch(/delivery-process\.config\.js$/);
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

      And('config path should end with "delivery-process.config.ts"', () => {
        expect(state!.configPath!).toMatch(/delivery-process\.config\.ts$/);
      });
    });

    RuleScenario('Return null when no config file exists', ({ Given, When, Then }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from "src"', async () => {
        const searchDir = path.join(state!.tempDir!, 'src');
        state!.configPath = await findConfigFile(searchDir);
      });

      Then('config file should NOT be found', () => {
        expect(state!.configPath).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Repo Root Boundary
  // ===========================================================================

  Rule('Config discovery stops at repo root', ({ RuleScenario }) => {
    RuleScenario('Stop at .git directory marker', ({ Given, When, Then, And }) => {
      Given('a directory structure:', async (_ctx: unknown, table: DataTableRow[]) => {
        await createDirectoryStructure(table);
      });

      When('finding config file from "project/nested/src"', async () => {
        const searchDir = path.join(state!.tempDir!, 'project/nested/src');
        state!.configPath = await findConfigFile(searchDir);
      });

      Then('config file should be found', () => {
        expect(state!.configPath).not.toBeNull();
      });

      And('config path should NOT contain "project/nested"', () => {
        // Config should be found at root, not in nested path
        expect(state!.configPath!).not.toContain('project/nested');
      });
    });
  });

  // ===========================================================================
  // Config Loading
  // ===========================================================================

  Rule('Config is loaded and validated', ({ RuleScenario }) => {
    RuleScenario('Load valid config with default fallback', ({ Given, When, Then, And }) => {
      Given('no config file exists', () => {
        // temp dir has no config file - this is the default state
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should succeed', () => {
        expect(state!.configResult!.ok).toBe(true);
      });

      And('loaded config should be the default', () => {
        if (!state!.configResult!.ok) throw new Error('Expected success');
        expect(state!.configResult!.value.isDefault).toBe(true);
      });

      And('loaded registry tagPrefix should be "@libar-docs-"', () => {
        if (!state!.configResult!.ok) throw new Error('Expected success');
        expect(state!.configResult!.value.instance.registry.tagPrefix).toBe('@libar-docs-');
      });
    });

    RuleScenario('Load valid config file', ({ Given, When, Then, And }) => {
      Given('a valid config file with preset "generic"', async () => {
        // Create a config file that uses generic preset
        // We need to create a minimal working config that can be imported
        const configContent = `
// Simple config that creates a minimal valid instance
export default {
  registry: {
    tagPrefix: "@docs-",
    fileOptInTag: "@docs",
    categories: [
      { tag: "core", label: "Core" },
      { tag: "api", label: "API" },
      { tag: "infra", label: "Infrastructure" }
    ],
    statusValues: ["roadmap", "active", "completed", "deferred"],
    tags: []
  },
  regexBuilders: {
    category: () => /@docs-(core|api|infra)/,
    status: () => /@docs-status:(roadmap|active|completed|deferred)/,
    pattern: () => /@docs-pattern:([A-Za-z0-9]+)/
  }
};
`.trim();
        const configPath = path.join(state!.tempDir!, 'delivery-process.config.js');
        await fs.writeFile(configPath, configContent);
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should succeed', () => {
        expect(state!.configResult!.ok).toBe(true);
      });

      And('loaded config should NOT be the default', () => {
        if (!state!.configResult!.ok) throw new Error('Expected success');
        expect(state!.configResult!.value.isDefault).toBe(false);
      });

      And('loaded registry tagPrefix should be "@docs-"', () => {
        if (!state!.configResult!.ok) throw new Error('Expected success');
        expect(state!.configResult!.value.instance.registry.tagPrefix).toBe('@docs-');
      });
    });

    RuleScenario('Error on config without default export', ({ Given, When, Then, And }) => {
      Given('a config file without default export', async () => {
        const configPath = path.join(state!.tempDir!, 'delivery-process.config.js');
        await fs.writeFile(configPath, NO_DEFAULT_EXPORT_CONFIG);
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should fail', () => {
        expect(state!.configResult!.ok).toBe(false);
      });

      And('config error message should contain "default export"', () => {
        if (state!.configResult!.ok) throw new Error('Expected failure');
        expect(state!.configResult!.error.message.toLowerCase()).toContain('default export');
      });
    });

    RuleScenario('Error on config with wrong type', ({ Given, When, Then, And }) => {
      Given('a config file exporting wrong type', async () => {
        const configPath = path.join(state!.tempDir!, 'delivery-process.config.js');
        await fs.writeFile(configPath, WRONG_TYPE_CONFIG);
      });

      When('loading config from base directory', async () => {
        state!.configResult = await loadConfig(state!.tempDir!);
      });

      Then('config loading should fail', () => {
        expect(state!.configResult!.ok).toBe(false);
      });

      And('config error message should contain "DeliveryProcessInstance"', () => {
        if (state!.configResult!.ok) throw new Error('Expected failure');
        expect(state!.configResult!.error.message).toContain('DeliveryProcessInstance');
      });
    });
  });

  // ===========================================================================
  // Error Formatting
  // ===========================================================================

  Rule('Config errors are formatted for display', ({ RuleScenario }) => {
    RuleScenario('Format error with path and message', ({ Given, When, Then, And }) => {
      Given('a config load error with path "/test/config.ts" and message "Invalid export"', () => {
        state!.error = {
          type: 'config-load-error',
          path: '/test/config.ts',
          message: 'Invalid export',
        };
      });

      When('formatting the config error', () => {
        state!.formattedError = formatConfigError(state!.error!);
      });

      Then('formatted error should contain "Config error"', () => {
        expect(state!.formattedError!).toContain('Config error');
      });

      And('formatted error should contain "/test/config.ts"', () => {
        expect(state!.formattedError!).toContain('/test/config.ts');
      });

      And('formatted error should contain "Invalid export"', () => {
        expect(state!.formattedError!).toContain('Invalid export');
      });
    });
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create directory structure from DataTable
 */
async function createDirectoryStructure(table: DataTableRow[]): Promise<void> {
  if (!state?.tempDir) throw new Error('State not initialized');

  for (const row of table) {
    const filePath = path.join(state.tempDir, row.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Determine content based on type
    let content: string;
    switch (row.type) {
      case 'config':
        content = VALID_GENERIC_CONFIG;
        break;
      case 'git':
        content = '[core]\n\trepositoryformatversion = 0';
        break;
      case 'source':
      default:
        content = '// source file';
        break;
    }

    await fs.writeFile(filePath, content);
  }
}
