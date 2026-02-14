/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern DefineConfig
 * @libar-docs-status active
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
 * In `delivery-process.config.ts` at project root:
 *
 * ```typescript
 * import { defineConfig } from '@libar-dev/delivery-process/config';
 *
 * export default defineConfig({
 *   preset: 'ddd-es-cqrs',
 *   sources: { typescript: ['src/** /*.ts'] },
 * });
 * ```
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
export declare function defineConfig(config: DeliveryProcessProjectConfig): DeliveryProcessProjectConfig;
//# sourceMappingURL=define-config.d.ts.map