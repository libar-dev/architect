/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CodecBaseOptions
 * @libar-docs-status completed
 *
 * ## Base Codec Options
 *
 * Shared types, interfaces, and utilities for all document codecs.
 * Individual codec files define their own specific option types that extend BaseCodecOptions.
 *
 * ### When to Use
 *
 * - When creating custom codec options that extend the base
 * - When implementing new codecs that need standard configuration
 * - When importing shared types like DetailLevel or NormalizedStatusFilter
 */
// ═══════════════════════════════════════════════════════════════════════════
// Default Options
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Default codec limits
 */
export const DEFAULT_LIMITS = {
    recentItems: 10,
    maxDetailFiles: Number.MAX_SAFE_INTEGER, // Effectively unlimited
    collapseThreshold: 5,
};
/**
 * Default base options
 */
export const DEFAULT_BASE_OPTIONS = {
    generateDetailFiles: true,
    detailLevel: 'standard',
    limits: DEFAULT_LIMITS,
};
// ═══════════════════════════════════════════════════════════════════════════
// Utility: Merge Options with Defaults
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Merge user options with defaults
 */
export function mergeOptions(defaults, options) {
    if (!options) {
        return defaults;
    }
    return {
        ...defaults,
        ...options,
        limits: {
            ...defaults.limits,
            ...options.limits,
        },
    };
}
//# sourceMappingURL=base.js.map