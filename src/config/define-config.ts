/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern DefineConfig
 * @architect-status active
 * @architect-arch-layer infrastructure
 * @architect-arch-context config
 * @architect-arch-role infrastructure
 * @architect-include reference-sample
 * @architect-uses ProjectConfigTypes
 * @architect-used-by ConfigLoader
 *
 * ## Define Config
 *
 * Identity function for type-safe project configuration.
 * Follows the Vite/Vitest `defineConfig()` convention:
 * returns the input unchanged, providing only TypeScript type checking.
 *
 * Validation happens later at load time via Zod schema in `loadProjectConfig()`.
 *
 * ### When to Use
 *
 * - In `architect.config.ts` at project root to get type-safe configuration with autocompletion.
 */

import type { ArchitectProjectConfig } from './project-config.js';

/**
 * Type-safe identity function for Architect project configuration.
 *
 * Returns the config object unchanged. Provides TypeScript autocompletion
 * and type checking without runtime overhead. Validation happens at
 * config load time via `loadProjectConfig()`.
 *
 * @param config - The project configuration object
 * @returns The same config object (identity)
 */
export function defineConfig(config: ArchitectProjectConfig): ArchitectProjectConfig {
  return config;
}
