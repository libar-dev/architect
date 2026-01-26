/**
 * @libar-docs
 * @libar-docs-config
 * @libar-docs-pattern TagRegistryLoader
 * @libar-docs-status completed
 * @libar-docs-uses TagRegistrySchema, CodecUtils
 * @libar-docs-used-by LintEngine, GeneratorOrchestrator
 *
 * ## TagRegistryLoader - External Configuration Loading
 *
 * Loads and validates tag registry configuration from external JSON files.
 * Supports auto-discovery, deep merging with defaults, and comprehensive error handling.
 *
 * ### When to Use
 *
 * - Use at CLI startup to load tag taxonomy configuration
 * - Use when validating custom tag registry files
 * - Use when auto-discovering tag-registry.json in standard locations
 */
import { type TagRegistry } from "../validation-schemas/tag-registry.js";
/**
 * Tag registry load error
 *
 * Describes why tag registry loading failed, with detailed validation errors
 * if the failure was due to invalid schema.
 */
export interface TagRegistryLoadError {
    /** Error type identifier */
    type: "tag-registry-load-error";
    /** Path to the registry file that failed to load */
    path: string;
    /** Human-readable error message */
    message: string;
    /** Detailed Zod validation errors if schema validation failed */
    validationErrors?: string[];
}
/**
 * Result type for tag registry loading
 */
export type TagRegistryResult = {
    ok: true;
    value: TagRegistry;
} | {
    ok: false;
    error: TagRegistryLoadError;
};
/**
 * Load tag registry from file or auto-discover
 *
 * @deprecated Since v1.0.0 - Use `loadConfig()` from `config-loader.ts` instead.
 * This function loads from JSON files, while the preferred approach is TypeScript
 * configuration via `delivery-process.config.ts` files.
 *
 * Loading strategy:
 * 1. If configPath is provided, load from that path (error if not found)
 * 2. If configPath is null, auto-discover in standard locations:
 *    - `./tag-registry.json` (current directory)
 *    - `docs/architecture/tag-registry.json` (recommended monorepo location)
 * 3. If no config found, return default registry
 * 4. If config found, parse with Zod, merge with defaults, return merged registry
 *
 * @param configPath - Path to tag registry JSON file, or null for auto-discovery
 * @param baseDir - Base directory for resolving relative paths
 * @returns Result with loaded registry or error details
 *
 * @example
 * ```typescript
 * // DEPRECATED - Use loadConfig() instead:
 * import { loadConfig } from "./config-loader.js";
 * const result = await loadConfig(baseDir);
 * const registry = result.ok ? result.value.instance.registry : null;
 * ```
 */
export declare function loadTagRegistry(configPath: string | null, baseDir: string): Promise<TagRegistryResult>;
/**
 * Format tag registry error for console display
 *
 * @param error - Tag registry load error
 * @returns Formatted error message for console output
 *
 * @example
 * ```typescript
 * const result = await loadTagRegistry("bad.json", "/project");
 * if (!result.ok) {
 *   console.error(formatTagRegistryError(result.error));
 *   process.exit(1);
 * }
 * ```
 */
export declare function formatTagRegistryError(error: TagRegistryLoadError): string;
//# sourceMappingURL=tag-registry-loader.d.ts.map