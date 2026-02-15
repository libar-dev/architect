/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ConfigurationPresets
 * @libar-docs-status completed
 * @libar-docs-arch-layer domain
 * @libar-docs-arch-context config
 * @libar-docs-uses ConfigurationTypes, Categories, RegistryBuilder
 * @libar-docs-used-by DeliveryProcessFactory
 * @libar-docs-extract-shapes GENERIC_PRESET, LIBAR_GENERIC_PRESET, DDD_ES_CQRS_PRESET, PresetName, PRESETS
 *
 * ## Configuration Presets
 *
 * Predefined configuration presets for common use cases.
 * Uses `as const satisfies` for full type inference while ensuring
 * configuration shape compliance.
 *
 * ### Available Presets
 *
 * - **GENERIC_PRESET**: Minimal categories with @docs- prefix for non-DDD projects
 * - **LIBAR_GENERIC_PRESET**: Minimal categories with @libar-docs- prefix (for package-level config)
 * - **DDD_ES_CQRS_PRESET**: Full 21-category taxonomy with @libar-docs- prefix
 *
 * ### When to Use
 *
 * - Use GENERIC_PRESET for simple documentation needs with @docs- prefix
 * - Use LIBAR_GENERIC_PRESET for simple documentation needs with @libar-docs- prefix (default)
 * - Use DDD_ES_CQRS_PRESET for full DDD/ES/CQRS taxonomy
 * - Use as base for custom configurations
 */
import type { DeliveryProcessConfig } from './types.js';
import { type CategoryDefinition } from '../taxonomy/categories.js';
/**
 * Generic preset for non-DDD projects.
 *
 * Minimal categories with @docs- prefix. Suitable for:
 * - Simple documentation needs
 * - Non-DDD architectures
 * - Projects that want basic pattern tracking
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess, GENERIC_PRESET } from '@libar-dev/delivery-process';
 *
 * const dp = createDeliveryProcess({ preset: "generic" });
 * // Uses @docs-, @docs-pattern, @docs-status, etc.
 * ```
 */
export declare const GENERIC_PRESET: {
    readonly tagPrefix: "@docs-";
    readonly fileOptInTag: "@docs";
    readonly categories: readonly [{
        readonly tag: "core";
        readonly domain: "Core";
        readonly priority: 1;
        readonly description: "Core patterns";
        readonly aliases: readonly [];
    }, {
        readonly tag: "api";
        readonly domain: "API";
        readonly priority: 2;
        readonly description: "Public APIs";
        readonly aliases: readonly [];
    }, {
        readonly tag: "infra";
        readonly domain: "Infrastructure";
        readonly priority: 3;
        readonly description: "Infrastructure";
        readonly aliases: readonly ["infrastructure"];
    }];
};
/**
 * Generic preset with @libar-docs- prefix.
 *
 * Same minimal categories as GENERIC_PRESET but with @libar-docs- prefix.
 * This is the universal default preset for both `createDeliveryProcess()` and
 * `loadConfig()` fallback.
 *
 * Suitable for:
 * - Most projects (default choice)
 * - Projects already using @libar-docs- tags
 * - Package-level configuration (simplified categories, same prefix)
 * - Gradual adoption without tag migration
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess } from '@libar-dev/delivery-process';
 *
 * // Default preset (libar-generic):
 * const dp = createDeliveryProcess();
 * // Uses @libar-docs-, @libar-docs-pattern, @libar-docs-status, etc.
 * // With 3 category tags: @libar-docs-core, @libar-docs-api, @libar-docs-infra
 * ```
 */
export declare const LIBAR_GENERIC_PRESET: {
    readonly tagPrefix: "@libar-docs-";
    readonly fileOptInTag: "@libar-docs";
    readonly categories: readonly [{
        readonly tag: "core";
        readonly domain: "Core";
        readonly priority: 1;
        readonly description: "Core patterns";
        readonly aliases: readonly [];
    }, {
        readonly tag: "api";
        readonly domain: "API";
        readonly priority: 2;
        readonly description: "Public APIs";
        readonly aliases: readonly [];
    }, {
        readonly tag: "infra";
        readonly domain: "Infrastructure";
        readonly priority: 3;
        readonly description: "Infrastructure";
        readonly aliases: readonly ["infrastructure"];
    }];
};
/**
 * Full DDD/ES/CQRS preset (current @libar-dev taxonomy).
 *
 * Complete 21-category taxonomy with @libar-docs- prefix. Suitable for:
 * - DDD architectures
 * - Event sourcing projects
 * - CQRS implementations
 * - Full roadmap/phase tracking
 *
 * @example
 * ```typescript
 * import { createDeliveryProcess, DDD_ES_CQRS_PRESET } from '@libar-dev/delivery-process';
 *
 * const dp = createDeliveryProcess({ preset: "ddd-es-cqrs" });
 * ```
 */
export declare const DDD_ES_CQRS_PRESET: {
    readonly tagPrefix: "@libar-docs-";
    readonly fileOptInTag: "@libar-docs";
    readonly categories: readonly CategoryDefinition[];
    readonly metadataTags: readonly import("../taxonomy/registry-builder.js").MetadataTagDefinitionForRegistry[];
};
/**
 * Available preset names
 */
export type PresetName = 'generic' | 'libar-generic' | 'ddd-es-cqrs';
/**
 * Preset lookup map
 *
 * @example
 * ```typescript
 * import { PRESETS, type PresetName } from '@libar-dev/delivery-process';
 *
 * function getPreset(name: PresetName) {
 *   return PRESETS[name];
 * }
 * ```
 */
export declare const PRESETS: Record<PresetName, DeliveryProcessConfig>;
//# sourceMappingURL=presets.d.ts.map