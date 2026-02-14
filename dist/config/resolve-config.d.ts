/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigResolver
 * @libar-docs-status active
 * @libar-docs-uses ProjectConfigTypes, DeliveryProcessFactory, ConfigurationDefaults
 * @libar-docs-used-by ConfigLoader
 *
 * ## Config Resolution
 *
 * Resolves a raw `DeliveryProcessProjectConfig` into a fully-resolved `ResolvedConfig`
 * with all defaults applied, stubs merged into TypeScript sources, and context inference
 * rules prepended to defaults.
 *
 * ### Architecture
 *
 * ```
 * DeliveryProcessProjectConfig (user-authored)
 *     |
 *     v
 * resolveProjectConfig() -- creates instance, merges sources, applies defaults
 *     |
 *     v
 * ResolvedConfig { instance, project, isDefault, configPath }
 * ```
 *
 * ### When to Use
 *
 * - Called by `loadProjectConfig()` after Zod validation succeeds
 * - Called directly in tests to resolve a config without file I/O
 * - `createDefaultResolvedConfig()` provides a fallback when no config file exists
 */
import type { DeliveryProcessProjectConfig, ResolvedConfig } from './project-config.js';
/**
 * Resolves a raw project config into a fully-resolved config with all defaults applied.
 *
 * Resolution steps:
 * 1. Create taxonomy instance from preset/override fields
 * 2. Merge stub globs into TypeScript sources
 * 3. Apply output defaults (directory, overwrite)
 * 4. Default generators to `['patterns']`
 * 5. Prepend user context inference rules before defaults
 * 6. Carry forward remaining fields with defaults
 *
 * @param raw - The raw project configuration (post-Zod validation)
 * @param options - Optional resolution options
 * @returns Fully resolved configuration ready for use by orchestrator and CLIs
 */
export declare function resolveProjectConfig(raw: DeliveryProcessProjectConfig, options: {
    readonly configPath: string;
}): ResolvedConfig;
/**
 * Creates a default resolved config for when no config file is found.
 *
 * Uses the libar-generic preset with empty sources and standard defaults.
 * The `isDefault` flag is set to `true` so consumers can detect that
 * no user config was loaded.
 *
 * @returns A default ResolvedConfig with empty sources and standard defaults
 */
export declare function createDefaultResolvedConfig(): ResolvedConfig;
//# sourceMappingURL=resolve-config.d.ts.map