/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern DefineConfig
 * @libar-docs-status active
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-arch-context config
 * @libar-docs-arch-role infrastructure
 * @libar-docs-include reference-sample
 * @libar-docs-uses ProjectConfigTypes
 * @libar-docs-used-by ConfigLoader
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
 * - In `delivery-process.config.ts` at project root to get type-safe configuration with autocompletion.
 */

import type { DeliveryProcessProjectConfig } from './project-config.js';

/**
 * Type-safe identity function for delivery-process project configuration.
 *
 * Returns the config object unchanged. Provides TypeScript autocompletion
 * and type checking without runtime overhead. Validation happens at
 * config load time via `loadProjectConfig()`.
 *
 * @param config - The project configuration object
 * @returns The same config object (identity)
 */
export function defineConfig(config: DeliveryProcessProjectConfig): DeliveryProcessProjectConfig {
  return config;
}
