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
import * as fs from "fs/promises";
import { existsSync } from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { createDeliveryProcess } from "./factory.js";
/**
 * Config file name to search for
 */
const CONFIG_FILE_NAME = "delivery-process.config.ts";
/**
 * Compiled JavaScript variant (for projects that pre-compile configs)
 */
const CONFIG_FILE_NAME_JS = "delivery-process.config.js";
/**
 * Check if a directory contains a .git folder (repo root marker)
 */
async function isRepoRoot(dir) {
    try {
        const gitPath = path.join(dir, ".git");
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
 * Load and validate a config file
 *
 * @param configPath - Absolute path to config file
 * @returns Loaded DeliveryProcessInstance
 */
async function importConfigFile(configPath) {
    // Convert to file URL for ESM import
    const fileUrl = pathToFileURL(configPath).href;
    // Dynamic import - works with both .ts (via ts-node/tsx) and .js
    const module = (await import(fileUrl));
    // Config should have a default export
    if (module.default === undefined || module.default === null) {
        throw new Error(`Config file must have a default export: ${configPath}`);
    }
    const config = module.default;
    // Validate that it's a DeliveryProcessInstance (has required properties)
    if (typeof config !== "object" ||
        !("registry" in config) ||
        !("regexBuilders" in config)) {
        throw new Error(`Config file must export a DeliveryProcessInstance (use createDeliveryProcess()): ${configPath}`);
    }
    return config;
}
/**
 * Load configuration from file or use defaults
 *
 * Discovery strategy:
 * 1. Search for `delivery-process.config.ts` starting from baseDir
 * 2. Walk up parent directories until repo root
 * 3. If found, import and return the configuration
 * 4. If not found, return default DDD_ES_CQRS_PRESET configuration
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
    const configPath = await findConfigFile(baseDir);
    // No config found - use default
    if (!configPath) {
        return {
            ok: true,
            value: {
                found: false,
                instance: createDeliveryProcess(), // Default DDD_ES_CQRS_PRESET
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            ok: false,
            error: {
                type: "config-load-error",
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
export function formatConfigError(error) {
    const lines = [`Config error: ${error.message}`, `  Path: ${error.path}`];
    if (error.cause) {
        lines.push(`  Cause: ${error.cause.message}`);
    }
    return lines.join("\n");
}
/**
 * Synchronous check for config file (for non-async contexts)
 *
 * Note: This only checks if the file exists, not if it's valid.
 * Use loadConfig() for full validation.
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null
 */
export function findConfigFileSync(startDir) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    while (currentDir !== root) {
        const tsConfigPath = path.join(currentDir, CONFIG_FILE_NAME);
        if (existsSync(tsConfigPath)) {
            return tsConfigPath;
        }
        const jsConfigPath = path.join(currentDir, CONFIG_FILE_NAME_JS);
        if (existsSync(jsConfigPath)) {
            return jsConfigPath;
        }
        // Check for .git to stop at repo root
        const gitPath = path.join(currentDir, ".git");
        if (existsSync(gitPath)) {
            break;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    return null;
}
//# sourceMappingURL=config-loader.js.map