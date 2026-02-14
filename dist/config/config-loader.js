/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigLoader
 * @libar-docs-status completed
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context config
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-uses DeliveryProcessFactory, ConfigurationTypes
 * @libar-docs-used-by CLI
 * @libar-docs-extract-shapes ConfigDiscoveryResult, ConfigLoadError, ConfigLoadResult, findConfigFile, loadConfig, formatConfigError
 *
 * ## Config Loader - TypeScript Configuration File Discovery
 *
 * Discovers and loads `delivery-process.config.ts` files for hierarchical configuration.
 * Supports package-level and repo-level configuration inheritance.
 *
 * ### When to Use
 *
 * - When CLI tools need to load project configuration automatically
 * - When implementing custom tooling that respects project config
 * - When testing configuration loading in different directory structures
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
import { isProjectConfig, isLegacyInstance, DeliveryProcessProjectConfigSchema, } from './project-config-schema.js';
import { resolveProjectConfig, createDefaultResolvedConfig } from './resolve-config.js';
/**
 * Config file name to search for
 */
const CONFIG_FILE_NAME = 'delivery-process.config.ts';
/**
 * Compiled JavaScript variant (for projects that pre-compile configs)
 */
const CONFIG_FILE_NAME_JS = 'delivery-process.config.js';
/**
 * Check if a directory contains a .git folder (repo root marker)
 */
async function isRepoRoot(dir) {
    try {
        const gitPath = path.join(dir, '.git');
        const stat = await fs.stat(gitPath);
        return stat.isDirectory() || stat.isFile(); // .git can be a file (worktree)
    }
    catch {
        return false;
    }
}
/**
 * Check if a file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Find config file by walking up from startDir
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */
export async function findConfigFile(startDir) {
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
 * Load configuration from file or use defaults.
 *
 * Delegates to {@link loadProjectConfig} for file discovery and parsing,
 * then maps the result to the legacy {@link ConfigDiscoveryResult} shape.
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
export async function loadConfig(baseDir) {
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
/**
 * Format config load error for console display
 *
 * @param error - Config load error
 * @returns Formatted error message
 */
export function formatConfigError(error) {
    const lines = [`Config error: ${error.message}`, `  Path: ${error.path}`];
    if (error.cause) {
        lines.push(`  Cause: ${error.cause.message}`);
    }
    return lines.join('\n');
}
/**
 * Load unified project configuration from file or use defaults.
 *
 * Supports both new-style `DeliveryProcessProjectConfig` (via `defineConfig()`)
 * and legacy `DeliveryProcessInstance` (via `createDeliveryProcess()`) config files.
 *
 * Discovery strategy:
 * 1. Search for `delivery-process.config.ts` starting from baseDir
 * 2. Walk up parent directories until repo root
 * 3. If found, import and resolve the configuration
 * 4. If not found, return default resolved config
 *
 * @param baseDir - Directory to start searching from (usually cwd or project root)
 * @returns Result with fully resolved configuration or error
 */
/**
 * Apply project config sources as defaults to a mutable CLI config.
 * Only fills in sources not already provided by CLI flags.
 *
 * @param config - Mutable config object with baseDir, input, and features arrays
 * @returns true if a non-default project config was found and applied
 */
export async function applyProjectSourceDefaults(config) {
    if (config.input.length > 0 && config.features.length > 0) {
        return false;
    }
    const result = await loadProjectConfig(config.baseDir);
    if (!result.ok || result.value.isDefault) {
        return false;
    }
    const resolved = result.value;
    if (config.input.length === 0 && resolved.project.sources.typescript.length > 0) {
        config.input.push(...resolved.project.sources.typescript);
    }
    if (config.features.length === 0 && resolved.project.sources.features.length > 0) {
        config.features.push(...resolved.project.sources.features);
    }
    return true;
}
export async function loadProjectConfig(baseDir) {
    const configPath = await findConfigFile(baseDir);
    // No config found — return defaults
    if (configPath === null) {
        return {
            ok: true,
            value: createDefaultResolvedConfig(),
        };
    }
    // Try to import the config file
    let module;
    try {
        const fileUrl = pathToFileURL(configPath).href;
        module = (await import(fileUrl));
    }
    catch (error) {
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
    // No default export
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
    // Legacy DeliveryProcessInstance (createDeliveryProcess) — check first because
    // isProjectConfig is a loose check that could match legacy instances with extra fields
    if (isLegacyInstance(exported)) {
        const defaultResolved = createDefaultResolvedConfig();
        return {
            ok: true,
            value: {
                instance: exported,
                project: defaultResolved.project,
                isDefault: false,
                configPath,
            },
        };
    }
    // New-style project config (defineConfig)
    if (isProjectConfig(exported)) {
        const parseResult = DeliveryProcessProjectConfigSchema.safeParse(exported);
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
        let resolved;
        try {
            resolved = resolveProjectConfig(parseResult.data, {
                configPath,
            });
        }
        catch (error) {
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
        return {
            ok: true,
            value: resolved,
        };
    }
    // Unknown export shape
    return {
        ok: false,
        error: {
            type: 'config-load-error',
            path: configPath,
            message: `Config file must export a DeliveryProcessProjectConfig (use defineConfig()) or DeliveryProcessInstance (use createDeliveryProcess()): ${configPath}`,
        },
    };
}
//# sourceMappingURL=config-loader.js.map