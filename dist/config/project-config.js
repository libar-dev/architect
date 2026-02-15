/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern ProjectConfigTypes
 * @libar-docs-status active
 * @libar-docs-arch-layer domain
 * @libar-docs-arch-context config
 * @libar-docs-uses ConfigurationTypes, ConfigurationPresets
 * @libar-docs-used-by DefineConfig, ConfigLoader
 * @libar-docs-extract-shapes DeliveryProcessProjectConfig, SourcesConfig, OutputConfig, GeneratorSourceOverride, ResolvedConfig, ResolvedProjectConfig, ResolvedSourcesConfig
 *
 * ## Project Configuration Types
 *
 * Unified project configuration for the delivery-process package.
 * Replaces the fragmented system where taxonomy, source discovery,
 * and output config lived in three disconnected layers.
 *
 * ### Architecture
 *
 * ```
 * defineConfig() → raw DeliveryProcessProjectConfig
 *     ↓
 * loadProjectConfig() → validates (Zod) → resolveProjectConfig()
 *     ↓
 * ResolvedConfig { instance, project }
 *     ↓
 * mergeSourcesForGenerator() → per-generator effective sources
 * ```
 *
 * ### When to Use
 *
 * - Define project config in `delivery-process.config.ts`
 * - Internal resolution via `resolveProjectConfig()`
 * - CLI override merging
 */
export {};
//# sourceMappingURL=project-config.js.map