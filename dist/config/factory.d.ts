/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern DeliveryProcessFactory
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context config
 * @libar-docs-arch-layer application
 * @libar-docs-uses ConfigurationTypes, ConfigurationPresets, RegexBuilders, TagRegistry
 * @libar-docs-used-by PublicAPI
 * @libar-docs-extract-shapes CreateDeliveryProcessOptions, createDeliveryProcess
 *
 * ## Delivery Process Factory
 *
 * Main factory function for creating configured delivery process instances.
 * Supports presets, custom configuration, and configuration overrides.
 *
 * ### When to Use
 *
 * - At application startup to create a configured instance
 * - When switching between different tag prefixes
 * - When customizing the taxonomy for a specific project
 */
import type { DeliveryProcessConfig, DeliveryProcessInstance } from './types.js';
import { type PresetName } from './presets.js';
/**
 * Options for creating a delivery process instance
 */
export interface CreateDeliveryProcessOptions {
    /** Use a preset configuration */
    preset?: PresetName;
    /** Custom tag prefix (overrides preset) */
    tagPrefix?: string;
    /** Custom file opt-in tag (overrides preset) */
    fileOptInTag?: string;
    /** Custom categories (replaces preset categories entirely) */
    categories?: DeliveryProcessConfig['categories'];
}
/**
 * Creates a configured delivery process instance.
 *
 * Configuration resolution order:
 * 1. Start with preset (or libar-generic default)
 * 2. Preset categories REPLACE base taxonomy categories (not merged)
 * 3. Apply explicit overrides (tagPrefix, fileOptInTag, categories)
 * 4. Create regex builders from final configuration
 *
 * Note: Presets define complete category sets. The libar-generic preset
 * has 3 categories (core, api, infra), while ddd-es-cqrs has 21.
 * Categories from the preset replace base categories entirely.
 *
 * @param options - Configuration options
 * @returns Configured delivery process instance
 *
 * @example
 * ```typescript
 * // Use generic preset
 * const dp = createDeliveryProcess({ preset: "generic" });
 * ```
 *
 * @example
 * ```typescript
 * // Custom prefix with DDD taxonomy
 * const dp = createDeliveryProcess({
 *   preset: "ddd-es-cqrs",
 *   tagPrefix: "@my-project-",
 *   fileOptInTag: "@my-project"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Default (libar-generic preset with 3 categories)
 * const dp = createDeliveryProcess();
 * ```
 */
export declare function createDeliveryProcess(options?: CreateDeliveryProcessOptions): DeliveryProcessInstance;
//# sourceMappingURL=factory.d.ts.map