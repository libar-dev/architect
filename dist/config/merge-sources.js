/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern SourceMerger
 * @libar-docs-status active
 * @libar-docs-arch-layer application
 * @libar-docs-arch-context config
 * @libar-docs-arch-role service
 * @libar-docs-uses ProjectConfigTypes
 * @libar-docs-used-by ConfigResolver
 *
 * ## Source Merging
 *
 * Computes effective sources for a specific generator by applying
 * per-generator overrides to the base resolved sources.
 *
 * ### Override Semantics
 *
 * - `replaceFeatures` (non-empty): Used INSTEAD of base features
 * - `additionalFeatures`: Appended to base features (ignored if `replaceFeatures` is set)
 * - `additionalInput`: Appended to base TypeScript sources
 * - `exclude`: Always inherited from base (no override mechanism)
 *
 * ### When to Use
 *
 * Called by the orchestrator before invoking each generator, so that
 * generators like `changelog` can pull from different feature sets
 * than the base config specifies.
 */
/**
 * Computes effective sources for a specific generator by merging
 * base sources with any per-generator overrides.
 *
 * If no override exists for the given generator, the base sources
 * are returned unchanged. When an override is found:
 *
 * - `replaceFeatures` (non-empty array) replaces base features entirely
 * - Otherwise, `additionalFeatures` are appended to base features
 * - `additionalInput` is always appended to base TypeScript sources
 * - `exclude` is always inherited from base (never overridden)
 *
 * @param base - The resolved base sources from project config
 * @param generatorName - The name of the generator to resolve sources for
 * @param overrides - Per-generator source override map
 * @returns The effective sources for the specified generator
 */
export function mergeSourcesForGenerator(base, generatorName, overrides) {
    const override = overrides[generatorName];
    if (override === undefined) {
        return base;
    }
    // Resolve typescript: additionalInput is appended
    const typescript = override.additionalInput !== undefined && override.additionalInput.length > 0
        ? [...base.typescript, ...override.additionalInput]
        : base.typescript;
    // replaceFeatures takes full precedence over base + additionalFeatures
    if (override.replaceFeatures !== undefined && override.replaceFeatures.length > 0) {
        return { typescript, features: override.replaceFeatures, exclude: base.exclude };
    }
    const features = [...base.features, ...(override.additionalFeatures ?? [])];
    return { typescript, features, exclude: base.exclude };
}
//# sourceMappingURL=merge-sources.js.map