/**
 * @architect
 * @architect-pattern ConfigLoader
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:configuration
 *
 * ## ConfigLoader - Architect Project Configuration Loader
 *
 * Discovers and loads `architect.config.ts` (or `.js`) from a project root,
 * validating it against `ArchitectProjectConfigSchema` and resolving defaults.
 *
 * ### When to Use
 *
 * - CLI/MCP boot: locate the active project's config
 * - Tests: synthesize a `ResolvedConfig` from a fixture root
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { pathToFileURL } from 'url';

import type { ArchitectProjectConfig, ResolvedConfig } from './project-config.js';
import { isProjectConfig, ArchitectProjectConfigSchema } from './project-config-schema.js';
import { resolveProjectConfig, createDefaultResolvedConfig } from './resolve-config.js';
import type { ArchitectInstance } from './types.js';

const CONFIG_FILE_NAME = 'architect.config.ts';
const CONFIG_FILE_NAME_JS = 'architect.config.js';

export interface ConfigDiscoveryResult {
  found: boolean;
  path?: string;
  instance: ArchitectInstance;
  isDefault: boolean;
}

export interface ConfigLoadError {
  type: 'config-load-error';
  path: string;
  message: string;
  cause?: Error | undefined;
}

export type ConfigLoadResult =
  | { ok: true; value: ConfigDiscoveryResult }
  | { ok: false; error: ConfigLoadError };

async function isRepoRoot(dir: string): Promise<boolean> {
  try {
    const gitPath = path.join(dir, '.git');
    const stat = await fs.stat(gitPath);
    return stat.isDirectory() || stat.isFile();
  } catch {
    return false;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function findConfigFile(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const tsConfigPath = path.join(currentDir, CONFIG_FILE_NAME);
    if (await fileExists(tsConfigPath)) return tsConfigPath;

    const jsConfigPath = path.join(currentDir, CONFIG_FILE_NAME_JS);
    if (await fileExists(jsConfigPath)) return jsConfigPath;

    if (await isRepoRoot(currentDir)) break;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

export async function loadConfig(baseDir: string): Promise<ConfigLoadResult> {
  const result = await loadProjectConfig(baseDir);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    value: {
      found: !result.value.isDefault,
      ...(result.value.configPath !== undefined ? { path: result.value.configPath } : {}),
      instance: result.value.instance,
      isDefault: result.value.isDefault,
    },
  };
}

export function formatConfigError(error: ConfigLoadError): string {
  const lines = [`Config error: ${error.message}`, `  Path: ${error.path}`];

  if (error.cause) {
    lines.push(`  Cause: ${error.cause.message}`);
  }

  return lines.join('\n');
}

export type ProjectConfigLoadResult =
  | { readonly ok: true; readonly value: ResolvedConfig }
  | { readonly ok: false; readonly error: ConfigLoadError };

export async function applyProjectSourceDefaults(config: {
  readonly baseDir: string;
  input: string[];
  features: string[];
}): Promise<boolean> {
  if (config.input.length > 0 && config.features.length > 0) {
    return false;
  }

  const result = await loadProjectConfig(config.baseDir);
  if (!result.ok || result.value.isDefault) {
    return false;
  }

  const resolved = result.value;
  let applied = false;

  if (config.input.length === 0 && resolved.project.sources.typescript.length > 0) {
    config.input.push(...resolved.project.sources.typescript);
    applied = true;
  }
  if (config.features.length === 0 && resolved.project.sources.features.length > 0) {
    config.features.push(...resolved.project.sources.features);
    applied = true;
  }
  return applied;
}

export async function loadProjectConfig(baseDir: string): Promise<ProjectConfigLoadResult> {
  const configPath = await findConfigFile(baseDir);

  if (configPath === null) {
    return {
      ok: true,
      value: createDefaultResolvedConfig(),
    };
  }

  let module: { default?: unknown };
  try {
    const fileUrl = pathToFileURL(configPath).href;
    module = (await import(fileUrl)) as { default?: unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: {
        type: 'config-load-error',
        path: configPath,
        message: `Failed to import config: ${message}`,
        cause: error instanceof Error ? error : undefined,
      },
    };
  }

  const exported = module.default;

  if (exported === undefined || exported === null) {
    return {
      ok: false,
      error: {
        type: 'config-load-error',
        path: configPath,
        message: `Config file must have a default export: ${configPath}`,
      },
    };
  }

  if (isProjectConfig(exported)) {
    const configForValidation = (() => {
      const copy = { ...(exported as Record<string, unknown>) };
      for (const key of ['codec' + 'Options', 'referenceDoc' + 'Configs']) {
        Reflect.deleteProperty(copy, key);
      }
      return copy;
    })();
    const parseResult = ArchitectProjectConfigSchema.safeParse(configForValidation);
    if (!parseResult.success) {
      const zodMessage = parseResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return {
        ok: false,
        error: {
          type: 'config-load-error',
          path: configPath,
          message: `Invalid project config: ${zodMessage}`,
        },
      };
    }
    let resolved: ResolvedConfig;
    try {
      resolved = resolveProjectConfig(parseResult.data as ArchitectProjectConfig, { configPath });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        error: {
          type: 'config-load-error',
          path: configPath,
          message: `Failed to resolve project config: ${message}`,
          cause: error instanceof Error ? error : undefined,
        },
      };
    }
    return { ok: true, value: resolved };
  }

  return {
    ok: false,
    error: {
      type: 'config-load-error',
      path: configPath,
      message: `Config file must export an ArchitectProjectConfig (use defineConfig()): ${configPath}`,
    },
  };
}
