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
import type { DeliveryProcessInstance } from './types.js';
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
export type ConfigLoadResult = {
    ok: true;
    value: ConfigDiscoveryResult;
} | {
    ok: false;
    error: ConfigLoadError;
};
/**
 * Find config file by walking up from startDir
 *
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null if not found
 */
export declare function findConfigFile(startDir: string): Promise<string | null>;
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
export declare function loadConfig(baseDir: string): Promise<ConfigLoadResult>;
/**
 * Format config load error for console display
 *
 * @param error - Config load error
 * @returns Formatted error message
 */
export declare function formatConfigError(error: ConfigLoadError): string;
//# sourceMappingURL=config-loader.d.ts.map