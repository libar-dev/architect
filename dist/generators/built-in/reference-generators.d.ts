/**
 * @libar-docs
 * @libar-docs-pattern ReferenceGeneratorRegistration
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Reference Generator Registrations
 *
 * Registers all reference document generators. Each config produces
 * TWO generators: detailed (docs/) and summary (_claude-md/).
 */
import type { GeneratorRegistry } from '../registry.js';
import { type ReferenceDocConfig } from '../../renderable/codecs/reference.js';
/**
 * Canonical product area values from ADR-001.
 * Each generates a composite overview document scoped to that area.
 */
export declare const PRODUCT_AREA_VALUES: readonly ["Annotation", "Configuration", "Generation", "Validation", "DataAPI", "CoreTypes", "Process"];
/**
 * Options for customizing product area config generation.
 */
export interface ProductAreaConfigOptions {
    /** Filename suffix for docs output (default: '.md') */
    readonly docsFilenameSuffix?: string;
}
/**
 * Creates reference document configs for all canonical product areas.
 *
 * Each config uses `productArea` as the primary filter — the codec
 * auto-derives all content sources from the filtered pattern set.
 * Explicit `conventionTags`, `shapeSources`, and `behaviorCategories`
 * are left empty because the product-area decode path ignores them.
 *
 * @param options - Optional customization for output filenames
 */
export declare function createProductAreaConfigs(options?: ProductAreaConfigOptions): ReferenceDocConfig[];
/**
 * Registers reference generators from the provided configs in the GeneratorRegistry.
 *
 * Partitions configs by `productArea` presence:
 * - Configs WITH `productArea` -> "product-area-docs" meta-generator
 * - Configs WITHOUT `productArea` -> "reference-docs" meta-generator
 * - Individual generators registered for all configs
 *
 * @param registry - The generator registry to register into
 * @param configs - Reference document configurations (from project config)
 */
export declare function registerReferenceGenerators(registry: GeneratorRegistry, configs: readonly ReferenceDocConfig[]): void;
//# sourceMappingURL=reference-generators.d.ts.map