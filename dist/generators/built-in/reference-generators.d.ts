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
 * Built-in reference document configurations for the delivery-process package.
 *
 * Each entry defines one reference document's convention sources and shape globs.
 * Import this in your `delivery-process.config.ts` to use these configs,
 * or define your own `ReferenceDocConfig[]` for downstream repos.
 */
export declare const LIBAR_REFERENCE_CONFIGS: readonly ReferenceDocConfig[];
/**
 * Registers reference generators from the provided configs in the GeneratorRegistry.
 *
 * Registers:
 * - "reference-docs" meta-generator (produces all files at once)
 * - Individual generators for selective invocation:
 *   "{name}-reference" -> detailed, "{name}-reference-claude" -> summary
 *
 * @param registry - The generator registry to register into
 * @param configs - Reference document configurations (from project config)
 */
export declare function registerReferenceGenerators(registry: GeneratorRegistry, configs: readonly ReferenceDocConfig[]): void;
/** @deprecated Use LIBAR_REFERENCE_CONFIGS instead */
export declare const REFERENCE_CONFIGS: readonly ReferenceDocConfig[];
//# sourceMappingURL=reference-generators.d.ts.map