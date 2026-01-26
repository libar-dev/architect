/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern DeliveryProcessFactory
 * @libar-docs-status completed
 * @libar-docs-uses ConfigurationTypes, ConfigurationPresets, RegexBuilders, TagRegistry
 * @libar-docs-used-by PublicAPI
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
import { buildRegistry } from "../taxonomy/registry-builder.js";
import { mergeTagRegistries } from "../validation-schemas/tag-registry.js";
import { createRegexBuilders } from "./regex-builders.js";
import { DDD_ES_CQRS_PRESET, PRESETS } from "./presets.js";
/**
 * Creates a configured delivery process instance.
 *
 * Configuration resolution order:
 * 1. Start with preset (or DDD-ES-CQRS default)
 * 2. Apply explicit overrides (tagPrefix, fileOptInTag, categories)
 * 3. Build registry by merging with base taxonomy
 * 4. Create regex builders from final configuration
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
 * // Default (full DDD-ES-CQRS preset)
 * const dp = createDeliveryProcess();
 * ```
 */
export function createDeliveryProcess(options = {}) {
    // Start with preset or default to DDD-ES-CQRS
    const baseConfig = options.preset ? PRESETS[options.preset] : DDD_ES_CQRS_PRESET;
    // Apply overrides
    const tagPrefix = options.tagPrefix ?? baseConfig.tagPrefix;
    const fileOptInTag = options.fileOptInTag ?? baseConfig.fileOptInTag;
    const categories = options.categories ?? baseConfig.categories;
    // Build the base registry from taxonomy constants (readonly)
    const baseRegistry = buildRegistry();
    // Convert readonly arrays to mutable for mergeTagRegistries compatibility
    // This is necessary because buildRegistry() returns readonly arrays from `as const`
    const mutableBaseRegistry = {
        version: baseRegistry.version,
        categories: [...baseRegistry.categories].map((c) => ({
            ...c,
            aliases: [...c.aliases],
        })),
        metadataTags: [...baseRegistry.metadataTags].map((t) => ({
            ...t,
            values: t.values ? [...t.values] : undefined,
            required: t.required ?? false,
            repeatable: t.repeatable ?? false,
        })),
        aggregationTags: [...baseRegistry.aggregationTags],
        formatOptions: [...baseRegistry.formatOptions],
        tagPrefix: baseRegistry.tagPrefix,
        fileOptInTag: baseRegistry.fileOptInTag,
    };
    // Create override with mutable category arrays
    const registryOverride = {
        tagPrefix,
        fileOptInTag,
        categories: [...categories].map((c) => ({
            tag: c.tag,
            domain: c.domain,
            priority: c.priority,
            description: c.description,
            aliases: [...c.aliases],
        })),
    };
    const registry = mergeTagRegistries(mutableBaseRegistry, registryOverride);
    // Create regex builders
    const regexBuilders = createRegexBuilders(tagPrefix, fileOptInTag);
    return {
        registry,
        regexBuilders,
    };
}
//# sourceMappingURL=factory.js.map