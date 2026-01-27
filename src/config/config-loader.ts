/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigLoader
 * @libar-docs-status completed
 * @libar-docs-uses DeliveryProcessFactory, ConfigurationTypes
 * @libar-docs-used-by CLI
 *
 * ## Config Loader - TypeScript Configuration File Discovery
 *
 * Discovers and loads `delivery-process.config.ts` files for hierarchical configuration.
 * Supports package-level and repo-level configuration inheritance.
 *
 * ### Discovery Strategy
 *
 * 1. Look for `delivery-process.config.ts` in current directory
 * 2. Walk up parent directories until repo root (contains .git)
 * 3. Stop at first config found or fall back to default
 *
 * ### Config File Format
 *
 * Config files should export a `DeliveryProcessInstance`:
 *
 * ```typescript
 * import { createDeliveryProcess } from '@libar-dev/delivery-process';
 *
 * export default createDeliveryProcess({ preset: "libar-generic" });
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { createDeliveryProcess } from './factory.js';
import type { DeliveryProcessInstance } from './types.js';

/**
 * Type for dynamic config module import
 */
interface ConfigModule {
  default?: unknown;
}

/**
 * Config file name to search for
 */
const CONFIG_FILE_NAME = 'delivery-process.config.ts';

/**
 * Compiled JavaScript variant (for projects that pre-compile configs)
 */
const CONFIG_FILE_NAME_JS = 'delivery-process.config.js';

/**
 * Result of config file discovery
 */
export interface ConfigDiscoveryResult {
  /** Whether a config file was found */
  found: boolean;
  /** Absolute path to the config file (if found) */
  path?: string;
  /** The loaded configuration instance */
  instance: DeliveryProcessInstance;
  /** Whether the default configuration was used */
  isDefault: boolean;
}

/**
 * Error during config loading
 */
export interface ConfigLoadError {
  type: 'config-load-error';
  path: string;
  message: string;
  /** The underlying error that caused the failure (if any) */
  cause?: Error | undefined;
}

/**
 * Result type for config loading
 */
export type ConfigLoadResult =
  | { ok: true; value: ConfigDiscoveryResult }
  | { ok: false; error: ConfigLoadError };

/**
 * Check if a directory contains a .git folder (repo root marker)
 */
async function isRepoRoot(dir: string): Promise<boolean> {
  try {
    const gitPath = path.join(dir, '.git');
    const stat = await fs.stat(gitPath);
    return stat.isDirectory() || stat.isFile(); // .git can be a file (worktree)
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find config file by walking up from startDir
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */
export async function findConfigFile(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // Check for TypeScript config first
    const tsConfigPath = path.join(currentDir, CONFIG_FILE_NAME);
    if (await fileExists(tsConfigPath)) {
      return tsConfigPath;
    }

    // Check for JavaScript config (pre-compiled)
    const jsConfigPath = path.join(currentDir, CONFIG_FILE_NAME_JS);
    if (await fileExists(jsConfigPath)) {
      return jsConfigPath;
    }

    // Stop at repo root to avoid walking too far
    if (await isRepoRoot(currentDir)) {
      break;
    }

    // Move to parent directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Load and validate a config file
 *
 * @param configPath - Absolute path to config file
 * @returns Loaded DeliveryProcessInstance
 */
async function importConfigFile(configPath: string): Promise<DeliveryProcessInstance> {
  // Convert to file URL for ESM import
  const fileUrl = pathToFileURL(configPath).href;

  // Dynamic import - works with both .ts (via ts-node/tsx) and .js
  const module = (await import(fileUrl)) as ConfigModule;

  // Config should have a default export
  if (module.default === undefined || module.default === null) {
    throw new Error(`Config file must have a default export: ${configPath}`);
  }

  const config = module.default as Record<string, unknown>;

  // Validate that it's a DeliveryProcessInstance (has required properties)
  if (typeof config !== 'object' || !('registry' in config) || !('regexBuilders' in config)) {
    throw new Error(
      `Config file must export a DeliveryProcessInstance (use createDeliveryProcess()): ${configPath}`
    );
  }

  return config as unknown as DeliveryProcessInstance;
}

/**
 * Load configuration from file or use defaults
 *
 * Discovery strategy:
 * 1. Search for `delivery-process.config.ts` starting from baseDir
 * 2. Walk up parent directories until repo root
 * 3. If found, import and return the configuration
 * 4. If not found, return default libar-generic preset configuration
 *
 * @param baseDir - Directory to start searching from (usually cwd or project root)
 * @returns Result with loaded configuration or error
 *
 * @example
 * ```typescript
 * // In CLI tool
 * const result = await loadConfig(process.cwd());
 * if (!result.ok) {
 *   console.error(result.error.message);
 *   process.exit(1);
 * }
 *
 * const { instance, isDefault, path } = result.value;
 * if (!isDefault) {
 *   console.log(`Using config from: ${path}`);
 * }
 *
 * // Use instance.registry for scanning/extracting
 * ```
 */
export async function loadConfig(baseDir: string): Promise<ConfigLoadResult> {
  const configPath = await findConfigFile(baseDir);

  // No config found - use default
  if (!configPath) {
    return {
      ok: true,
      value: {
        found: false,
        instance: createDeliveryProcess({ preset: 'libar-generic' }),
        isDefault: true,
      },
    };
  }

  // Try to load the config file
  try {
    const instance = await importConfigFile(configPath);
    return {
      ok: true,
      value: {
        found: true,
        path: configPath,
        instance,
        isDefault: false,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: {
        type: 'config-load-error',
        path: configPath,
        message: `Failed to load config: ${message}`,
        cause: error instanceof Error ? error : undefined,
      },
    };
  }
}

/**
 * Format config load error for console display
 *
 * @param error - Config load error
 * @returns Formatted error message
 */
export function formatConfigError(error: ConfigLoadError): string {
  const lines = [`Config error: ${error.message}`, `  Path: ${error.path}`];

  if (error.cause) {
    lines.push(`  Cause: ${error.cause.message}`);
  }

  return lines.join('\n');
}
